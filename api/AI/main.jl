# import the libraris for hosting API
using Genie, Genie.Requests, Genie.Renderer.Json
# import the libraries for AI
using Flux
using HorseML.Clustering
using HorseML.Preprocessing
using HorseML.Preprocessing: transform, inv_transform
using BSON
using BSON: @load
using CSV
using DataFrames
using Statistics
using Plots

include("./tornado.jl")

# load all the data
function load_all_data()
    # specify the number of data
    data = Matrix{Float32}(undef, 35082, 7)
    counts = 1
    for year in 1974:2023
        path = "../Earthquake Data/csv_result/$year.csv"
        raw = Matrix(CSV.read(path, DataFrame))
        for i in 1 : size(raw, 1)
            row = raw[i, :]
            data[counts, :] = collect(row)
            counts += 1
        end
    end
    return reverse(data, dims=1)
end

function predict(data)
    # load the model and scaler
    @load "./main_model/xscaler.bson" xscaler
    @load "./main_model/tscaler.bson" tscaler
    @load "./main_model/model.bson" model
    # predict
    main_predict = inv_transform(tscaler, model(transform(xscaler, vcat(data[1:2], data[5])')')')
    @load "./location_model2/xscaler.bson" xscaler
    @load "./location_model2/tscaler.bson" tscaler
    @load "./location_model2/model.bson" model
    # predict
    location_predict = inv_transform(tscaler, model(transform(xscaler, data[3:5]')')')
    return hcat(main_predict, location_predict)
end

function next_earthquake(datetime, model_data)
    output = predict(model_data)
    hour = datetime[3] + Int(round(output[1]))
    day = datetime[2]
    month = datetime[1]
    if hour > 24
        day += 1
        hour -= 24
        if month in [1, 3, 5, 7, 8, 10, 12] && day > 31
            day = 1
            month += 1
        elseif day > 30
            day = 1
            month += 1
        end
    end
    return [month, day, hour, round(output[2]*100)/100, round(output[3]*100)/100, round(output[4]*100)/100, round(output[5]*100)/100]
end

function predict_earthquakes(earthquake_data)
    earthquakes = Array{Float32}(undef, 4, 7)
    datetime = [earthquake_data["month"], earthquake_data["day"], earthquake_data["time"]]
    model_data = [earthquake_data["time"], earthquake_data["mag"], earthquake_data["lat"], earthquake_data["long"], earthquake_data["depth"]]
    for i in 1 : 4
        earthquakes[i, :] = next_earthquake(datetime, model_data)
        datetime = earthquakes[i, 1:3]
        model_data = earthquakes[i, 3:7]
    end
    return earthquakes
end

nan_to_num(x::Number) = (isequal(x, NaN)) ? 0 : x

function risk_calculation(data, lat, lon)
    lat = round(lat*10)/10
    lon = round(lon*10)/10
    distance = mean(sqrt.(nan_to_num.((data[:, 5] .- lat).^2 + (data[:, 6] .- lon).^2)))
    magnitude = (32 .^ data[:, 4])
    return mean(nan_to_num.(magnitude ./ (distance*10).^3))
end

# load risk file
function load_risks()
    path = "./CSV/risks.csv"
    return Matrix(CSV.read(path, DataFrame))
end

function clustering(risk)
    x = dropdims(load_risks(), dims=2)
    push!(x, risk)
    model = Kmeans(3)
    Clustering.fit!(model, x)
    return x, model.labels
end

function risk_level(risk)
    data, labels = clustering(risk)
    if labels[argmin(data)] == labels[end]
        return 1
    elseif labels[argmax(data)] == labels[end]
        return 3
    else
        return 2
    end
end

function create_image(lat, lon, jobid)
    high = Matrix(CSV.read("./CSV/risk-high.csv", DataFrame))
    plot(high[:, 2], high[:, 1], label="high risk", color="#ff0000", xlabel="longitude", ylabel="latitude", st=:scatter)
    medium = Matrix(CSV.read("./CSV/risk-medium.csv", DataFrame))
    plot!(medium[:, 2], medium[:, 1], label="medium risk", color="#00ff00", st=:scatter)
    low = Matrix(CSV.read("./CSV/risk-low.csv", DataFrame))
    plot!(low[:, 2], low[:, 1], label="low risk", color="#0000ff", st=:scatter)
    plot!([lon], [lat], label="your location", color="#000000", markershape=:star, markersize=10, st=:scatter)
    savefig("risk_images/$jobid.png")
end

# route for providing API
route("/earthquake.json", method=POST) do
    json_data = jsonpayload()
    earthquake_data = json_data["last"]
    earthquakes = predict_earthquakes(earthquake_data)
    data = Dict(
        "earthquake1"=>Dict(
            "month"=>earthquakes[1, 1],
            "day"=>earthquakes[1, 2],
            "hour"=>earthquakes[1, 3],
            "mag"=>earthquakes[1, 4],
            "lat"=>earthquakes[1, 5],
            "lon"=>earthquakes[1, 6],
        ),
        "earthquake2"=>Dict(
            "month"=>earthquakes[2, 1],
            "day"=>earthquakes[2, 2],
            "hour"=>earthquakes[2, 3],
            "mag"=>earthquakes[2, 4],
            "lat"=>earthquakes[2, 5],
            "lon"=>earthquakes[2, 6],
        ),
        "earthquake3"=>Dict(
            "month"=>earthquakes[3, 1],
            "day"=>earthquakes[3, 2],
            "hour"=>earthquakes[3, 3],
            "mag"=>earthquakes[3, 4],
            "lat"=>earthquakes[3, 5],
            "lon"=>earthquakes[3, 6],
        ),
        "earthquake4"=>Dict(
            "month"=>earthquakes[4, 1],
            "day"=>earthquakes[4, 2],
            "hour"=>earthquakes[4, 3],
            "mag"=>earthquakes[4, 4],
            "lat"=>earthquakes[4, 5],
            "lon"=>earthquakes[4, 6],
        ),
        "id"=>json_data["jobID"]
        )
    json(data)
end

route("/risk.json", method=POST) do
    json_data = jsonpayload()
    create_image(json_data["lat"], json_data["long"], json_data["jobID"])
    risk = risk_calculation(load_all_data(), json_data["lat"], json_data["long"])
    if risk == Inf || isequal(risk, NaN)
        risk = 1000
    end
    json(Dict(
            "risk"=>risk,
            "level"=>risk_level(risk),
            "id"=>json_data["jobID"]
        )
    )
end

up(4000, async=false)
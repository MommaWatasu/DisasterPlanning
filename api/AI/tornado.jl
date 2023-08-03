using Genie
using Flux
using HorseML.Clustering
using HorseML.Preprocessing
using HorseML.Preprocessing: transform, inv_transform
using BSON
using BSON: @load

function predict(data)
    # load the model and scaler
    @load "./tornado/main_model/xscaler.bson" xscaler
    @load "./tornado/main_model/tscaler.bson" tscaler
    @load "./tornado/main_model/model.bson" model
    # predict
    main_predict = inv_transform(tscaler, model(transform(xscaler, datetime)')')
    @load "./tornado/location_model/xscaler.bson" xscaler
    @load "./tornado/location_model/tscaler.bson" tscaler
    @load "./tornado/location_model/model.bson" model
    # predict
    location_predict = inv_transform(tscaler, model(transform(xscaler, model_data)')')
    return hcat(main_predict, location_predict)
end

function next_tornado(datetime, model_data)
    output = predict(datetime, model_data)
    day = datetime[2] + Int(round(output[1]))
    month = datetime[1]
    if month in [1, 3, 5, 7, 8, 10, 12]
        if day > 31
            day -= 31
            month += 1
        end
    else
        if day > 30
            day -= 30
            month += 1
        end
    end
    return [month, day, round(output[2]*100)/100, round(output[3]*100)/100, round(output[4]*100)/100, round(output[5]*100)/100]
end

function predict_earthquakes(tornado_data)
    tornados = Array{Float32}(undef, 4, 6)
    datetime = [tornado_data["month"], tornado_data["day"]]
    model_data = [tornado_data["slat"], tornado_data["slon"], tornado_data["elat"], tornado_data["elon"]]
    for i in 1 : 4
        tornados[i, :] = next_tornado(datetime, model_data)
        datetime = tornados[i, 1:2]
        model_data = tornados[i, 3:6]
    end
    return tornados
end

# route for providing API
route("/tornado.json", method=POST) do
    json_data = jsonpayload()
    tornado_data = json_data["last"]
    tornados = predict_tornados(tornado_data)
    data = Dict(
        "tornado1"=>Dict(
            "month"=>earthquakes[1, 1],
            "day"=>earthquakes[1, 2],
            "slat"=>earthquakes[1, 3],
            "slon"=>earthquakes[1, 4],
            "elat"=>earthquakes[1, 5],
            "elon"=>earthquakes[1, 6],
        ),
        "tornado2"=>Dict(
            "month"=>earthquakes[2, 1],
            "day"=>earthquakes[2, 2],
            "slat"=>earthquakes[2, 3],
            "slon"=>earthquakes[2, 4],
            "elat"=>earthquakes[2, 5],
            "elon"=>earthquakes[2, 6],
        ),
        "tornado3"=>Dict(
            "month"=>earthquakes[3, 1],
            "day"=>earthquakes[3, 2],
            "slat"=>earthquakes[3, 3],
            "slon"=>earthquakes[3, 4],
            "elat"=>earthquakes[3, 5],
            "elon"=>earthquakes[3, 6],
        ),
        "tornado4"=>Dict(
            "month"=>earthquakes[4, 1],
            "day"=>earthquakes[4, 2],
            "slat"=>earthquakes[4, 3],
            "slon"=>earthquakes[4, 4],
            "elat"=>earthquakes[4, 5],
            "elon"=>earthquakes[4, 6],
        ),
        "id"=>json_data["jobID"]
        )
    json(data)
end
# import the libraris for hosting API
using Genie, Genie.Requests, Genie.Renderer.Json
using HorseML.Preprocessing
using HorseML.Preprocessing: transform, inv_transform
# import the libraries for AI
using Flux
using HorseML.Preprocessing
using BSON
using BSON: @load

function predict(data)
    # load the model and scaler
    @load "./main_model/xscaler.bson" xscaler
    @load "./main_model/tscaler.bson" tscaler
    @load "./main_model/model.bson" model
    # predict
    main_predict = inv_transform(tscaler, model(transform(xscaler, vcat(data[1:2], data[5])')')')
    @load "./location_model/xscaler.bson" xscaler
    @load "./location_model/tscaler.bson" tscaler
    @load "./location_model/model.bson" model
    # predict
    location_predict = inv_transform(tscaler, model(transform(xscaler, data[3:5]')')')
    return hcat(main_predict, location_predict)
end

# route for providing API
route("/earthquake.json", method=POST) do
    json_data = jsonpayload()
    earthquake_data = json_data["last"]
    model_data = [earthquake_data["time"], earthquake_data["mag"], earthquake_data["lat"], earthquake_data["long"], earthquake_data["depth"]]
    output = predict(model_data)
    hour = earthquake_data["time"] + Int(round(output[1]))
    day = earthquake_data["day"]
    month = earthquake_data["month"]
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
    data = Dict(
        "month"=>month,
        "day"=>day,
        "hour"=>hour,
        "mag"=>round(output[2]*100)/100,
        "lat"=>round(output[3]*100)/100,
        "lon"=>round(output[4]*100)/100,
        "id"=>json_data["jobID"]
        )
    json(data)
end

up(4000, async=false)
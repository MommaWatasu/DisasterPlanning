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
    @load "./main-model/xscaler.bson" xscaler
    @load "./main-model/tscaler.bson" tscaler
    @load "./main-model/model.bson" model
    # predict
    main_predict = inv_transform(tscaler, model(transform(xscaler, data)')')
    @load "./day-model/xscaler.bson" xscaler
    @load "./day-model/tscaler.bson" tscaler
    @load "./day-model/model.bson" model
    # predict
    day_predict = inv_transform(tscaler, model(transform(xscaler, data)')')
    return hcat(day_predict, main_predict)
end

# route for providing API
route("/earthquake.json", method=POST) do
    json_data = jsonpayload()
    earthquake_data = json_data["last"]
    model_data = [earthquake_data["month"], earthquake_data["day"], earthquake_data["time"], earthquake_data["mag"], earthquake_data["lat"], earthquake_data["long"], earthquake_data["depth"]]
    model_data = hcat(model_data, model_data)'
    output = predict(model_data)
    month = earthquake_data["month"]
    if Int(round(output[1])) - earthquake_data["day"] < 0
        month += 1
    end
    data = Dict("month"=>month, "day"=>Int(round(output[1])), "hour"=>Int(round(output[2])), "mag"=>round(output[3]*100)/100, "id"=>json_data["jobID"])
    json(data)
end

up(4000, async=false)
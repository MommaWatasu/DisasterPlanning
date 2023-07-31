# import the libraris for hosting API
using Genie, Genie.Requests, Genie.Renderer.Json
using HorseML.Preprocessing
using HorseML.Preprocessing: transform, inv_transform
using Dates
using Dates: day
# import the libraries for AI
using Flux
using HorseML.Preprocessing
using BSON
using BSON: @load

function predict(data)
    # load the model and scaler
    @load "./xscaler.bson" xscaler
    @load "./tscaler.bson" tscaler
    @load "./model.bson" model
    # predict
    println(model(transform(xscaler, data)'))
    return inv_transform(tscaler, model(transform(xscaler, data)')')
end

# route for providing API
route("/earthquake.json", method=POST) do
    json_data = jsonpayload()
    earthquake_data = json_data["last"]
    model_data = [earthquake_data["time"], earthquake_data["mag"], earthquake_data["lat"], earthquake_data["long"], earthquake_data["depth"]]
    model_data = hcat(model_data, model_data)'
    hour = predict(model_data)[1, 1]
    pday = day(now())
    if hour-earthquake_data["time"] < 0
        pday = day(now()) + 1
    end
    data = Dict("data"=>pday, "hour"=>hour, "id"=>json_data["jobID"])
    json(data)
end

up(4000, async=false)
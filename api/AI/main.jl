# import the libraris for hosting API
using Genie, Genie.Renderer.Json
using Dates
# import the libraries for AI
using Flux
using HorseML.Preprocessing
using BSON
using BSON: @load

function predict(data)
    # load the model and scaler
    @load "./scaler.bson" scaler
    @load "./model.bson" model
    # predict
    return inv_transform(scaler, model(transform(scaler)))
end

# route for providing API
route("/earthquake.json", method=GET) do
    json_data = jsonpayload()["last"]
    model_data = [json_data["time"], json_data["mag"], json_data["lat"], json_data["long"], json_data["depth"]]
    hour = predict(model_data)
    if hour-json_data["time"] < 0
        day = day(now()) + 1
    else
        day = day(now())
    end
    data = Dict("data"=>day, "hour"=>hour, "id"=>json_data["jobID"])
    json(data)
end
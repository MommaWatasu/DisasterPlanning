using Genie
using Flux
using HorseML.Clustering
using HorseML.Preprocessing
using HorseML.Preprocessing: transform, inv_transform
using BSON
using BSON: @load

function predict(main_model_data, location_model_data)
    # load the model and scaler
    @load "./tornado/main_model/xscaler.bson" xscaler
    @load "./tornado/main_model/tscaler.bson" tscaler
    @load "./tornado/main_model/model.bson" model
    # predict
    main_predict = inv_transform(tscaler, model(transform(xscaler, main_model_data')')')
    @load "./tornado/location_model/xscaler.bson" xscaler
    @load "./tornado/location_model/tscaler.bson" tscaler
    @load "./tornado/location_model/model.bson" model
    # predict
    location_predict = inv_transform(tscaler, model(transform(xscaler, location_model_data')')')
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

function calc_datetime(month, day, day_diff)
    day = day + day_diff
    if month in [1, 3, 5, 7, 8, 10, 12]
        if day > 31
            month += 1
            day -= 31
        end
    else
        if day > 30
            month += 1
            day -= 30
        end
    end
    return month, day
end

function predict_tornados(tornado_data)
    tornados = Array{Float32}(undef, 4, 6)
    main_model_data = [tornado_data["month"], tornado_data["day"], tornado_data["mag"]]
    location_model_data = [tornado_data["slat"], tornado_data["slon"], tornado_data["elat"], tornado_data["elon"]]
    for i in 1 : 4
        tornados[i, :] = next_tornado(main_model_data, location_model_data)
        month, day = calc_datetime(tornado_data["month"], tornado_data["day"], tornados[i, 1])
        main_model_data = [month, day, tornados[i, 2]]
        location_model_data = tornados[i, 3:6]
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
            "month"=>tornados[1, 1],
            "day"=>tornados[1, 2],
            "slat"=>tornados[1, 3],
            "slon"=>tornados[1, 4],
            "elat"=>tornados[1, 5],
            "elon"=>tornados[1, 6],
        ),
        "tornado2"=>Dict(
            "month"=>tornados[2, 1],
            "day"=>tornados[2, 2],
            "slat"=>tornados[2, 3],
            "slon"=>tornados[2, 4],
            "elat"=>tornados[2, 5],
            "elon"=>tornados[2, 6],
        ),
        "tornado3"=>Dict(
            "month"=>tornados[3, 1],
            "day"=>tornados[3, 2],
            "slat"=>tornados[3, 3],
            "slon"=>tornados[3, 4],
            "elat"=>tornados[3, 5],
            "elon"=>tornados[3, 6],
        ),
        "tornado4"=>Dict(
            "month"=>tornados[4, 1],
            "day"=>tornados[4, 2],
            "slat"=>tornados[4, 3],
            "slon"=>tornados[4, 4],
            "elat"=>tornados[4, 5],
            "elon"=>tornados[4, 6],
        ),
        "id"=>json_data["jobID"]
        )
    json(data)
end
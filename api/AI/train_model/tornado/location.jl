using BSON: @load, @save
using CSV
using DataFrames
using HorseML.Preprocessing
using Flux
import Flux.params
import Flux.Losses.mse
using Random
using Statistics

function load_data()
    path = "../data/us_tornado.csv"
    data = Matrix(CSV.read(path, DataFrame))
    return data
end

function process_data(data, train_number)
    xdata = data[:, 9:12]
    tdata=data[2:end, 9:12]
    xscaler = Standard()
    xdata = fit_transform!(xscaler, xdata)
    tscaler = Standard()
    tdata = fit_transform!(tscaler, tdata[:, :])
    @save "bson-loc/xscaler.bson" xscaler
    @save "bson-loc/tscaler.bson" tscaler

    idx = collect(1:size(tdata, 1)-1)
    shuffle!(idx)
    trains = round(Int, size(tdata, 1) * train_number)
    return tscaler, xdata[idx[1:trains-1], :], tdata[idx[1:trains-1].+1, :], xdata[idx[trains:end], :], tdata[idx[trains:end].+1, :]
end

average_loss(data, model) = mean([mse(model(x), y) for (x, y) in data])

function create_model(min)
    # train model
    data = load_data()
    scaler, x_train, y_train, x_test, y_test = process_data(data, 0.7)
    model = Chain(
        Dense(4=>10, relu),
        Dropout(0.2),
        Dense(10=>30, relu),
        # output layer
        Dense(30=>4)
    )
    loss(x, y) = mse(model(x), y)
    opt = Adam()
    train_data = databuilder(x_train, y_train)
    test_data = databuilder(x_test, y_test)
    for epoch in 1:10
        Flux.train!(loss, params(model), train_data, opt)
        epoch_loss = average_loss(test_data, model)
        println("epoch: $epoch/10, loss: ", epoch_loss)
        if min > epoch_loss
            min = epoch_loss
            @save "bson-loc/model.bson" model
        end
    end
    # load the best model
    @load "bson-loc/model.bson" model
    println("\e[1;32mminimum loss: $min\e[0;0m")
    println("\e[1;32mDone\e[0;0m")

    # show test
    println("=======day-diff========")
    println(model(x_test')[1, 1:10])
    println(y_test[1:10, 1])
    return min
end

function main()
    min = 1
    while true
        min = create_model(min)
    end
end

main()
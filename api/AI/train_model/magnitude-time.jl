using Flux
import Flux.params
import Flux.Losses.mse
using HorseML.Preprocessing

using BSON
using BSON: @save, @load
using CSV
using DataFrames
using Random
using Statistics

# load one file
function load_data()
    path = "C:\\Users\\Student\\Desktop\\WatasuM\\DisasterML\\data\\earthquake_csv\\1974.csv"
    raw = Matrix(CSV.read(path, DataFrame))
    data = Matrix{Float32}(undef, size(raw, 1), 5)
    for i in 1 : size(raw, 1)
        row = raw[i, :]
        data[i, :] = collect(row)
    end
    return data
end

# load all the data
function load_all_data()
    # specify the number of data
    data = Matrix{Float32}(undef, 35082, 7)
    counts = 1
    for year in 1974:2023
        path = "C:\\Users\\Student\\Desktop\\WatasuM\\DisasterML\\data\\earthquake_csv\\$year.csv"
        raw = Matrix(CSV.read(path, DataFrame))
        for i in 1 : size(raw, 1)
            row = raw[i, :]
            data[counts, :] = collect(row)
            counts += 1
        end
    end
    return reverse(data, dims=1)
end

function process_data(data, train_number)
    # create test data
    tdata = data[:, 3:4]
    idx = collect(1:size(tdata, 1)-1)
    shuffle!(idx)
    trains = round(Int, size(tdata, 1) * train_number)

    # standerize data
    xdata = hcat(data[:, 3:4], data[:, 7])
    tdata[2:end, 1] = tdata[2:end, 1]-xdata[1:end-1, 1]
    for i in 1 : size(tdata, 1)
        if tdata[i, 1] < 0
            tdata[i, 1] += 24
        end
    end
    xscaler = Standard()
    xdata = fit_transform!(xscaler, xdata)
    tscaler = Standard()
    tdata = fit_transform!(tscaler, tdata)
    @save "C:\\Users\\Student\\Desktop\\WatasuM\\DisasterML\\main_model\\xscaler.bson" xscaler
    @save "C:\\Users\\Student\\Desktop\\WatasuM\\DisasterML\\main_model\\tscaler.bson" tscaler
    return tscaler, xdata[idx[1:trains-1], :], tdata[idx[1:trains-1].+1, :], xdata[idx[trains:end], :], tdata[idx[trains:end].+1, :]
end

average_loss(data, model) = mean([mse(model(x), y) for (x, y) in data])

function create_model(min)
    # train model
    data = load_all_data()
    scaler, x_train, y_train, x_test, y_test = process_data(data, 0.7)
    model = Chain(
        Dense(3=>5),
        Dropout(0.2),
        Dense(5=>10),
        Dense(10=>5, relu),
        # output layer
        Dense(5=>2)
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
            @save "C:\\Users\\Student\\Desktop\\WatasuM\\DisasterML\\main_model\\model.bson" model
        end
    end
    # load the best model
    @load "C:\\Users\\Student\\Desktop\\WatasuM\\DisasterML\\main_model\\model.bson" model
    println("\e[1;32mminimum loss: $min\e[0;0m")
    println("\e[1;32mDone\e[0;0m")

    # show test
    println("======hours==========")
    println(model(x_test')[1, 1:10])
    println(y_test[1:10, 1])
    println("======magnitude======")
    println(model(x_test')[2, 1:10])
    println(y_test[1:10, 2])
    return min
end

function main()
    min = 1
    while true
        min = create_model(min)
    end
end

main()
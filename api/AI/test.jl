using Flux
using HorseML.Preprocessing

using BSON
using BSON: @load
using CSV
using DataFrames
using Random
using Statistics

function load_data()
    path = "C:\\Users\\Student\\Desktop\\WatasuM\\DisasterML\\data\\earthquake_csv\\1974.csv"
    raw = Matrix(CSV.read(path, DataFrame))
    data = Matrix{Float32}(undef, size(raw, 1), 5)
    for i in 1 : size(raw, 1)
        row = raw[i, :]
        data[i, :] = [row[1], row[2], row[3], row[4], row[5]]
    end
    return data
end

function process_data(data, train_number)
    tdata = hcat(data[:, 1])
    idx = collect(1:size(tdata, 1))
    shuffle!(idx)
    trains = round(Int, size(tdata, 1) * train_number)

    xdata = data[:, 1:5]
    xscaler = Standard()
    xdata = fit_transform!(xscaler, xdata)
    tscaler = Standard()
    tdata = fit_transform!(tscaler, tdata)
    return tscaler, xdata[idx[1:trains-1], :], tdata[idx[1:trains-1], :], xdata[idx[trains:end], :], tdata[idx[trains:end], :]
end

function main()
    @load "C:\\Users\\Student\\Desktop\\WatasuM\\DisasterML\\model.bson" model
    data = load_data()
    scaler, x_train, y_train, x_test, y_test = process_data(data, 0.7)
    println(inv_transform(scaler, model(x_test')[:, 1:10]'))
    println(inv_transform(scaler, y_test[1:10, :]))
end

main()
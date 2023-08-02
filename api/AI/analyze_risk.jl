using BSON: @save
using CSV
using DataFrames
using HorseML
using HorseML.Clustering
using Plots

# load one file
function load_data()
    path = "risks.csv"
    return Matrix(CSV.read(path, DataFrame))
end

function clustering()
    x = load_data()
    model = Kmeans(3)
    Clustering.fit!(model, x)
    return x, model.labels
end

function main()
    x, labels = clustering()
    plot(x, labels, st=:scatter)
    savefig("C:\\Users\\Student\\Desktop\\WatasuM\\DisasterPlanning\\api\\AI\\clustering.png")
end

main()
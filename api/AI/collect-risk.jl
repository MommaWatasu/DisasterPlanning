using CSV
using DataFrames
using HTTP
using JSON
using Plots

function get_risk(lat, lon)
    r = HTTP.request("POST", "http://localhost:4000/risk.json", [("Content-Type", "application/json")], """{
           "name": "earthquake",
           "city": "Stanford",
           "region": "CA",
           "longitude": -122.1639,
           "latitude": 37.423,
           "jobID": "TEST123",
           "ip": "128.12.123.204",
           "status": "pending",
           "lat": $lat,
           "long": $lon
       }
       """)
    risk = JSON.parse(String(r.body))["risk"]
    return risk
end

function main()
    risks = []
    while true
        risks = []
        try
            for lat in 36.5:0.1:38.5
                for lon in -123.5:0.1:-121.5
                    r = get_risk(lat, lon)
                    println("risk: $r")
                    push!(risks, r)
                end
            end
            break
        catch
            println("got invalid data")
        end
    end
    histogram(risks)
    savefig("C:\\Users\\Student\\Desktop\\WatasuM\\DisasterPlanning\\api\\AI\\plot.png")
    df = DataFrame(risks[:, :], :auto)
    CSV.write("risks.csv", df)
end

function plot_locations()
    lats = []
    lons = []
    risks = []
    for lat in 36.5:0.1:38.5
        for lon in -123.5:0.1:-121.5
            r = get_risk(lat, lon)
            println("risk: $r")
            push!(risks, r)
            push!(lats, lat)
            push!(lons, lon)
        end
    end
    high = []
    middle = []
    low = []
    for i in 1 : length(risks)
        if risks[i]>550
            push!(high, i)
        elseif 250<risks[i]<=550
            push!(middle, i)
        else
            push!(low, i)
        end
    end
    plot(lats[high], lons[high], color="#ff0000", st=:scatter)
    plot!(lats[middle], lons[middle], color="#00ff00", st=:scatter)
    plot!(lats[low], lons[low], color="#0000ff", st=:scatter)

    df = DataFrame(hcat(lats[high], lons[high]), :auto)
    CSV.write("./risk-high.csv", df)
    df = DataFrame(hcat(lats[middle], lons[middle]), :auto)
    CSV.write("./risk-middle.csv", df)
    df = DataFrame(hcat(lats[low], lons[low]), :auto)
    CSV.write("./risk-low.csv", df)
    savefig("C:\\Users\\Student\\Desktop\\WatasuM\\DisasterPlanning\\api\\AI\\locations.png")
end

#main()
plot_locations()
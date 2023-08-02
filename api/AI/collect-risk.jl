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
    return (risk == 0) ? Inf : risk
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

main()
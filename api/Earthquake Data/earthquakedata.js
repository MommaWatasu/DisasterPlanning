const axios = require('axios');
const fs = require('fs');

var year = 2023;
var startMonth = 1;
var endMonth = 6;
var running = true;
var completed = 0;
var retryInt = 0;

var total = 0;

var URL = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=37.423&longitude=-122.1639&maxradiuskm=180&minmagnitude=2&mindepth=0&maxdepth=1000";

var stats = JSON.parse(fs.readFileSync("./earthquake_stats.json"));

async function getDisasterData(){
    if (running == false){
        // stop the program
        return;
    }
    // get the current time as a string
    var time = new Date();
    var timeString = time.toTimeString();
    console.log(`${timeString} | Starting: ${year}, ${startMonth} thru ${endMonth}`)
    var starting = year + "-" + startMonth + "-01";
    var ending = year + "-" + endMonth + "-01";
    var tempURL = URL + "&starttime=" + starting + "&endtime=" + ending;

    var response = await axios.get(tempURL);
    var data = response.data;
    var features = data.features;
    var earthquakes = [];
    
    // write a loop that goes through all the features and creates a disaster object for each one
    for(var i = 0; i < features.length; i++){
        var earthquake = features[i];
        // convert timestamp to 24 hour time
        var timestamp = earthquake.properties.time;
        var date = new Date(timestamp);
        var hour = date.getHours();
        var topush = {
            "time": hour,
            "mag": earthquake.properties.mag,
            "place": earthquake.properties.place,
            "lat": earthquake.geometry.coordinates[1],
            "long": earthquake.geometry.coordinates[0],
            "depth": earthquake.geometry.coordinates[2],
            "month": date.getMonth(),
            "day": date.getDate(),
        }

        earthquakes.push(topush);
    }

    // write the earthquakes array to a file
    // the file should go in the /earthquakedataset folder
    // the file name should be in the format: year-startMonth-endMonth.json
    // example: 2020-1-6.json
    var filename = year + "-" + startMonth + "-" + endMonth + ".json";
    var filepath = "./earthquakedataset/" + filename;
    await fs.writeFileSync(filepath, JSON.stringify(earthquakes));
    completed++;
    
    
    if (year == 1973){
        running = false;
    }

    if (earthquakes.length == 0 && retryInt < 3){
        console.log("No earthquakes found for this interval, retrying");
        retryInt++;
    }else{
        retryInt = 0;
        if (startMonth == 1){
            stats[year] = earthquakes.length;
            startMonth = 6;
            endMonth = 12;
        }else if (startMonth == 6){
            startMonth = 1;
            endMonth = 6;
            stats[year] += earthquakes.length;
            year--;
        }
        var time = new Date();
        var timeString = time.toTimeString();
        total += earthquakes.length;

        fs.writeFileSync("./earthquake_stats.json", JSON.stringify(stats));
        console.log(`${timeString} | Finished (Task: ${completed}) [New Entries: ${earthquakes.length}, Total Entries: ${total}] \n`)
    }
} 

const interval = setInterval(getDisasterData, 5000);
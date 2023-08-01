const fs = require('fs');
const path = require('path');

const folderPath = './earthquakedataset';

var year = 2023;
var month = 1;
var month2 = 6;

var csv_base = [
    ["Time", "Mag", "Lat", "Long", "Depth", "Day", "Month"],
]

var csv_data = [
    ["Time", "Mag", "Lat", "Long", "Depth", "Day", "Month"],
]

const toCsv = (data) => {
    return data.map((row) => row.join(',')).join('\n');
  };
  
const saveCsv = (data, filePath, year) => {
    const csvString = toCsv(data);
  
    fs.writeFileSync(`./csv_result/${year}.csv`, csvString);
};

while (year > 1972) {
    if (month == 1){
        csv_data = [["Time", "Mag", "Lat", "Long", "Depth", "Day", "Month"]];
    }
    var newpath = path.join(folderPath, `${year}-${month}-${month2}.json`);
    if(fs.statSync(newpath).isFile()){
        const fileContents = JSON.parse(fs.readFileSync(newpath));
        console.log(fileContents)
        if (month == 1){
            csv_data = [["Time", "Mag", "Lat", "Long", "Depth", "Day", "Month"]];
        }
        for (var i = 0; i < fileContents.length; i++){
            console.log(fileContents[i])
            csv_data.push([`${fileContents[i].time}`, `${fileContents[i].mag}`, `${fileContents[i].lat}`, `${fileContents[i].long}`, `${fileContents[i].depth}`, `${fileContents[i].day}`, `${fileContents[i].month}`]);
        }
    }

    if (month == 6){
        //console.log(csv_data)
        saveCsv(csv_data, `./csv_result/${year}-${month}-${month2}.csv`, year);
        month = 1;
        month2 = 6;
        year--;
        csv_data = [["Time", "Mag", "Lat", "Long", "Depth", "Day", "Month"]];
    }else{
        month = 6;
        month2 = 12;
    }
}


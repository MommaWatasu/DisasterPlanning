let express = require('express');

let port = 3000;
let app = express();
const path = require('path');
const axios = require('axios');
const ejs = require('ejs');
const fs = require('fs');

const userAgentParser = require("user-agent");

let userData = require('../data/users.json');
let suppliesData = require('../data/supplies.json');
let prepareData = require('../data/prepare.json');

const GithubActionURL = "https://api.github.com/repos/MommaWatasu/DisasterPlanning/dispatches";
const Token = "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";

const header = {
    "Accept": "application/vnd.github.everest-preview+json",
    "Content-Type": "application/json",
    "Authorization": "Bearer " + Token
}

const isMobile = (req, res) => {
    const userAgent = req.headers["user-agent"];
    const agent = userAgentParser.parse(userAgent);
    console.log(agent)
    return agent.os == "iPhone";
};

var jobCache = {};
jobCache = JSON.parse(fs.readFileSync('../data/jobCache.json', 'utf8'));

app.set('trust proxy', true);
app.set('view engine', 'ejs');

async function updateCache(){
    for (var job in jobCache){
        if (job.time < Date.now() - 600000){
            delete jobCache[job];
        }
    }

    await fs.writeFileSync('../data/jobCache.json', JSON.stringify(jobCache), 'utf8');
    return
}
setTimeout(updateCache, 30000);

async function getIPInfo(ip){
    console.log(ip)
    var info = await axios.get('https://ipapi.co/' + ip + '/json/');
    return info.data;
}

const createRandomString = (length) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      const randomCharacter = characters.charAt(Math.floor(Math.random() * characters.length));
      randomString += randomCharacter;
    }
    return randomString;
};

app.listen(port, () => {
    console.log('Server listening on port ' + port);
});

app.get('/', (req, res) => {
    var indexHtmlPath = path.join(__dirname, '..', 'webapp', 'index.html');
    res.sendFile(indexHtmlPath);
});

app.get('/api', (req, res) => {
    var indexHtmlPath = path.join(__dirname, '..', 'webapp', 'api.html');
    res.sendFile(indexHtmlPath);
});

app.get('/disasters', (req, res) => {
    var indexHtmlPath = path.join(__dirname, '..', 'webapp', 'disasters.html');
    res.sendFile(indexHtmlPath);
});

app.get('/style.css', (req, res) => {
    const cssPath = path.join(__dirname, '..', 'webapp', 'style.css');
    res.sendFile(cssPath);
});

app.get('/style2.css', (req, res) => {
    const cssPath = path.join(__dirname, '..', 'webapp', 'style2.css');
    res.sendFile(cssPath);
});

app.get('/CDN/images/:image', (req, res) => {
    var image = req.params.image;
    const imagePath = path.join(__dirname, '..', 'webapp', 'assets', 'images', image);
    try {
        res.sendFile(imagePath);
    }
    catch {
        res.send('Image not found');
    }
});

app.get('/api/user/:name', (req, res) => {
    var name = req.params.name;
    var user = userData[name];
    if(user){
        res.json(user);
    } else {
        res.status(200).send('User not found');
    } 
});

app.get('/api/supplies/:name', (req, res) => {
    var name = req.params.name;
    var supplies = suppliesData[name];
    if(supplies){
        res.json(supplies);
    } else {
        res.status(200).send('Supplies not found');
    } 
});

app.get('/api/risk/:name/:long/:lati', (req, res) => {
    if (req.params.name != "earthquake"){
        res.send("Disaster not found");
        return;
    }

    if (req.headers["jobID"] == undefined){
        res.send("No job ID");
        return;
    }

    var jobID = req.headers["jobID"];
    var long = req.params.long;
    var lati = req.params.lati;
    var name = req.params.name;

    if (jobCache[jobID] == undefined){
        res.send("Job not found");
        return;
    }
    
    
});

app.get('/disaster/:name', async (req, res) => {
    if (req.params.name != "earthquake"){
        res.send("Disaster not found");
        return;
    }

    var locals = {
        name: req.params.name,
    };

    var ip = await req.ip;
    console.log(ip);
    if (ip.startsWith(":")) {
        ip = "128.12.123.204";
    }
    
    if (ip == "128.12.123.204"){
        locals.city = "Stanford";
        locals.region = "CA";
        locals.longitude = "-122.1639";
        locals.latitude = "37.423";
        locals.response = false
    }else{
        var ipInfo = await getIPInfo(ip);
    console.log(ipInfo);
        if (ipInfo.city){
            locals.city = ipInfo.city;
            locals.region = ipInfo.region_code;
            locals.longitude = ipInfo.longitude;
            locals.latitude = ipInfo.latitude;
            locals.response = false
        }
        else {
            locals.city = "Stanford";
            locals.region = "CA";
            locals.longitude = "-122.1639";
            locals.latitude = "37.423";
            locals.response = false
        }
    }
    

    var jobID = null;
    var found = true;

    while (found == true){
        jobID = createRandomString(8);
        if (jobCache[jobID] == undefined){
            found = false;
            break;
        }
    }

    //var previous = jobCache.find(job => job.ip == ip);

    jobCache[jobID] = {
        "name": req.params.name,
        "city": locals.city,
        "region": locals.region,
        "longitude": locals.longitude,
        "latitude": locals.latitude,
        "jobID": jobID,
        "ip": ip,
        "status": "pending",
        "time": Date.now()
    }

    await updateCache();
    locals.response = true;
    /* 
    await axios.post(GithubActionURL, {
        "event_type": "api",
        "client_payload": {
            "jobID": jobID,
            "name": req.params.name,
            "city": locals.city,
            "region": locals.region,
            "longitude": locals.longitude,
            "latitude": locals.latitude,
            "ip": ip
        },   
    }, header)
  */
    console.log(req.headers)
    if (isMobile(req, res)) {
        console.log("mobile")
        res.render('new/mobile/indexinfo.ejs', locals);
    } else {
        res.render('new/mobile/indexinfo.ejs', locals);
    }
   
});
    
app.get('/prepare/:name', async (req, res) => {
    if (req.params.name != "earthquake"){
        res.send("Disaster not found");
        return;
    }

    var information = await prepareData[req.params.name];

    var finalList = [];

    for (let i = 0; i < information.options.length; i++) {
        var detail = `<details style="justify-content: center; margin: 0 auto;"><summary>${information.options[i].name}</summary>`;
        for (let ii = 0; ii < information.options[i].value.length; ii++) {
            detail += `<p style:"white-space: pre-line;">${information.options[i].value[ii]}</p>`;
        }
        detail += "</details>";
        finalList.push(detail);
    }
    information.finaloptions = finalList;

    res.render('prepare.ejs', information);
});

app.get('/bard', (req, res) => {
    res.render('bardbad', { what: 'an ai', who: 'bard' });
  });

app.get('/api/clientlocation', async (req, res) => {
    var ip = await req.ip;
    console.log(ip);
    if (ip == "::1"){
        ip = "128.12.123.204"
    }
    axios.get('https://ipapi.co/' + ip + '/json/').then((response) => {
        res.json({
            "latitude": response.data.latitude,
            "longitude": response.data.longitude,
            "city": response.data.city,
            "region": response.data.region,
            "country": response.data.country
        });
        //res.json(response.data);
    }
    ).catch((error) => {
        console.log(error);
    });
    // https://ipapi.co/128.12.123.204/json/
});

app.get('/app', async (req, res) => {

    var locals = {
    };

    var ip = await req.ip;
    console.log(ip);
    if (ip.startsWith(":")) {
        ip = "128.12.123.204";
    }
    
    if (ip == "128.12.123.204"){
        locals.city = "Stanford";
        locals.region = "CA";
        locals.longitude = "-122.1639";
        locals.latitude = "37.423";
        locals.response = false
    }else{
        var ipInfo = await getIPInfo(ip);
        if (ipInfo.city){
            locals.city = ipInfo.city;
            locals.region = ipInfo.region_code;
            locals.longitude = ipInfo.longitude;
            locals.latitude = ipInfo.latitude;
            locals.response = false
        }
    }

    if (isMobile(req, res)) {
        res.render('new/mobile/home.ejs', locals);
    } else {
        res.render('new/mobile/home.ejs', locals);
    }
   
});

app.use(function(req, res, next) {
    res.redirect('/'); 
});


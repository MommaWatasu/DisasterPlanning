let express = require('express');

let port = 3000;
let app = express();
const path = require('path');
const axios = require('axios');
const ejs = require('ejs');
const fs = require('fs');
const store = require('store');

const userAgentParser = require("user-agent");
var admin = require("firebase-admin");

let userData = require('../data/users.json');
let suppliesData = require('../data/supplies.json');
let prepareData = require('../data/prepare.json');

var serviceAccount = require("E:/service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const Userdb = db.collection('Users');
/* 
Userdb.doc("XuVCOg3Nk03dxo3uDqmM").get().then(async (doc) => {
    console.log(await doc.data())
});
*/

const GithubActionURL = "https://api.github.com/repos/MommaWatasu/DisasterPlanning/dispatches";
const Token = "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";

const Months = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
]

const header = {
    "Accept": "application/vnd.github.everest-preview+json",
    "Content-Type": "application/json",
    "Authorization": "Bearer " + Token
}

async function getUser(id){
    var user = await Userdb.doc(id).get();
    if (!user.exists){
        return null;
    }else{
        return user.data();
    }
}

async function validateUser(id, token){
    var user = await getUser(id);
    if (user == null){
        return false;
    }else{
        if (user.AccessTokens.indexOf(token)){
            return true;
        }else{
            return false;
        }
    }
}

const isMobile = (req, res) => {
    const userAgent = req.headers["user-agent"];
    const agent = userAgentParser.parse(userAgent);
    return agent.os == "iPhone";
};

var jobCache = {};
jobCache = JSON.parse(fs.readFileSync('../data/jobCache.json', 'utf8'));

var planCache = {};
planCache = JSON.parse(fs.readFileSync('../data/planCache.json', 'utf8'));

app.set('trust proxy', true);
app.set('view engine', 'ejs');

async function updateCache(){
    for (var job in jobCache){
        if (job.time < Date.now() - 600000){
            delete jobCache[job];
        }
    }

    await fs.writeFileSync('../data/jobCache.json', JSON.stringify(jobCache), 'utf8');

    await fs.writeFileSync('../data/planCache.json', JSON.stringify(planCache), 'utf8');
    return
}
setTimeout(updateCache, 30000);

async function getIPInfo(ip){
    console.log(ip)
    if (ip.startsWith(":")) {
        ip = "128.12.123.204";
    }
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
    res.redirect('/app');
});

app.get('/api', (req, res) => {
    var indexHtmlPath = path.join(__dirname, '..', 'webapp', 'api.html');
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

app.get("/api/ai/locations.png", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "api", "ai", "locations.png"));
});

app.get('/app/risk', async (req, res) => {

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

    var body = {
        "jobID": "RISK",
        "lat": Number(locals.latitude),
        "long": Number(locals.longitude)
    }

    const risk = await axios.post("http://localhost:4000/risk.json", body)
    switch(risk.data.level){
        case 1:
            locals.rating = "Low Risk";
            locals.color = "green";
        break;

        case 2:
            locals.rating = "Medium Risk";
            locals.color = "orange";
        break;

        case 3:
            locals.rating = "High Risk";
            locals.color = "rgb(212, 46, 34)";
        break;
    }

    if (isMobile(req, res)) {
        res.render('new/mobile/indexinfo.ejs', locals);
    } else {
        res.render('new/mobile/indexinfo.ejs', locals);
    }
   
});

app.get('/app/plan', async (req, res) => {
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
        res.render('new/mobile/planning/select.ejs', locals);
    } else {
        res.render('new/mobile/planning/select.ejs', locals);
    }
})

app.get("/app/plans/:name", async (req, res) => {
    
});

app.get("/app/plan/:name", async (req, res) => {
    var locals = {};
    locals.name = req.params.name;

    var ip = await req.ip;
    var ipInfo = await getIPInfo(ip);

    locals.city = ipInfo.city;
    locals.region = ipInfo.region_code;
    locals.longitude = ipInfo.longitude;
    locals.latitude = ipInfo.latitude;

    var found = true;
    var key = "";
    while (found){
        key = createRandomString(10);
        if (planCache[key] == undefined){
            found = false;
        }else{
            found = true;
        }
    }
    planCache[key] = {
        "name": req.params.name,
        "ip": [await req.ip],
        "time": new Date(),
        "lastUpdated": new Date(),
        "location": {
            "city": locals.city,
            "region": ipInfo.region_code,
            "longitude": locals.longitude,
            "latitude": locals.latitude
        },
        "actions": [],
        "supplies": [],
    };

    console.log(planCache[key])

    locals.planID = key;
    locals.plan = planCache[key];

    if (isMobile(req, res)) {
        res.render('new/mobile/planning/createplan.ejs', locals);
    } else {
        res.render('new/mobile/planning/createplan.ejs', locals);
    }
});

app.get("/app/plan/:name/:planID", async (req, res) => {
    var locals = {};
    locals.name = req.params.name;
    locals.planID = req.params.planID;

    var ip = await req.ip;
    var ipInfo = await getIPInfo(ip);

    locals.city = ipInfo.city;
    locals.region = ipInfo.region_code;
    locals.longitude = ipInfo.longitude;
    locals.latitude = ipInfo.latitude;

    var plan = planCache[req.params.planID];

    if (plan == undefined){
        res.redirect("/app/plan/" + req.params.name);
        return;
    }

    plan.ip.push(await req.ip);

    locals.plan = plan;

    console.log();

    locals.text = {
        "created": `${Months[new Date(locals.plan.time).getMonth() + 1]} ${new Date(locals.plan.time).getDate()}, ${new Date(locals.plan.time).getFullYear()}`,
        "lastUpdated": `${Months[new Date(locals.plan.lastUpdated).getMonth() + 1]} ${new Date(locals.plan.lastUpdated).getDate()}, ${new Date(locals.plan.lastUpdated).getFullYear()}`,
        "city": locals.plan.location.city,
        "region": locals.plan.location.region,
    }

    console.log(locals)

    if (isMobile(req, res)) {
        res.render('new/mobile/planning/plan.ejs', locals);
    } else {
        res.render('new/mobile/planning/plan.ejs', locals);
    }
});

app.post("/api/plan/:jobid/update", async (req, res) => {
    var plan = planCache[req.params.jobid];

    if (plan == undefined){
        res.send("not found");
        return;
    }

    if (req.body.type == undefined){
        res.send("invalid type");
        return;
    }

    if (req.body.type == "action"){

    }

    var ip = await req.ip;
    var ipInfo = await getIPInfo(ip);

    plan.ip.push(await req.ip);
    plan.lastUpdated = new Date();

});

/* 
app.use(function(req, res, next) {
    res.redirect('/'); 
});

*/

/*
await sleep(0)
    function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
    }
*/
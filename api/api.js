let express = require('express');

let port = 3000;
let app = express();
const path = require('path');
const axios = require('axios');
const ejs = require('ejs');
const fs = require('fs');
const store = require('store');

const cookieParser = require("cookie-parser");
app.use(cookieParser());

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

/* 
axios.post("http://localhost:4000/risk.json", {
    "jobID": "wake",
    "lat": 37,
    "long": -122,
}).then((response) => {
    console.log("AI Online");
});
*/

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

async function getUser(id) {
    var user = await Userdb.doc(id).get();
    if (!user.exists) {
        return null;
    } else {
        return user.data();
    }
}

async function validateUser(id, token) {
    var user = await getUser(id);
    if (user == null) {
        return false;
    } else {
        if (user.AccessTokens.indexOf(token)) {
            return true;
        } else {
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

async function updateCache() {
    for (var job in jobCache) {
        if (job.time < Date.now() - 600000) {
            delete jobCache[job];
        }
    }

    await fs.writeFileSync('../data/jobCache.json', JSON.stringify(jobCache), 'utf8');

    await fs.writeFileSync('../data/planCache.json', JSON.stringify(planCache), 'utf8');
    return
}
setTimeout(updateCache, 30000);

async function getIPInfo(ip) {
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
    } catch {
        res.send('Image not found');
    }
});

app.get('/bard', (req, res) => {
    res.render('bardbad', {
        what: 'an ai',
        who: 'bard'
    });
});

app.get('/api/clientlocation', async (req, res) => {
    var ip = await req.ip;
    console.log(ip);
    if (ip == "::1") {
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
    }).catch((error) => {
        console.log(error);
    });
    // https://ipapi.co/128.12.123.204/json/
});

app.get('/app', async (req, res) => {
    var locals = {};
    if (req.cookies.userid == undefined || req.cookies.sessiontoken == undefined) {
        locals.user = "Not Logged In"
    } else {
        var user = await getUser(req.cookies.userid);
        if (user == null) {
            locals.user = "Not Logged In"
        } else {
            if (user.AccessTokens.indexOf(req.cookies.sessiontoken) != -1) {
                locals.user = user.Name.First + " " + user.Name.Last;
            } else {
                locals.user = "Not Logged In"
            }
        }
    }
    console.log(req.cookies)

    var ip = await req.ip;
    console.log(ip);
    if (ip.startsWith(":")) {
        ip = "128.12.123.204";
    }

    if (ip == "128.12.123.204") {
        locals.city = "Stanford";
        locals.region = "CA";
        locals.longitude = "-122.1639";
        locals.latitude = "37.423";
        locals.response = false
    } else {
        var ipInfo = await getIPInfo(ip);
        if (ipInfo.city) {
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

app.get("/api/login", async (req, res) => {
    res.render('new/login.ejs');
});

app.get("/api/ai/locations.png", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "api", "ai", "locations.png"));
});

app.get("/api/ai/risk_images/:jobId", (req, res) => {
    if (fs.existsSync(`../api/ai/risk_images/${req.params.jobId}.png`)) {
        res.sendFile(path.join(__dirname, "..", "api", "ai", "risk_images", `${req.params.jobId}.png`));
    } else {
        res.sendFile("../api/ai/locations.png");
    }
});

app.get('/app/risk', async (req, res) => {
    var locals = {
        "jobID": createRandomString(5),
    };

    var ip = await req.ip;
    console.log(ip);
    if (ip.startsWith(":")) {
        ip = "128.12.123.204";
    }

    if (ip == "128.12.123.204") {
        locals.city = "Stanford";
        locals.region = "CA";
        locals.longitude = "-122.1639";
        locals.latitude = "37.423";
        locals.response = false
    } else {
        var ipInfo = await getIPInfo(ip);
        if (ipInfo.city) {
            locals.city = ipInfo.city;
            locals.region = ipInfo.region_code;
            locals.longitude = ipInfo.longitude;
            locals.latitude = ipInfo.latitude;
            locals.response = false
        }
    }

    var body = {
        "jobID": locals.jobID,
        "lat": Number(locals.latitude),
        "long": Number(locals.longitude)
    }

    var risk;

    try {
        risk = await axios.post("http://localhost:4000/risk.json", body)
    } catch {
        console.log("Error")
        risk = {}
        risk.data = {
            "level": 3
        }
    }

    switch (risk.data.level) {
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

    var currentDate = new Date();

    var lastEarthquakes;
    var worked = false;
    var count = 0;
    console.log("Government is working :|")
    while (worked == false) {
        try {
            lastEarthquakes = await axios.get(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=37.423&longitude=-122.1639&minmagnitude=2.5&mindepth=0&maxdepth=1000&starttime=2023-${currentDate.getMonth()}-${currentDate.getDate()}&endtime=2023-${currentDate.getMonth() + 1}-${currentDate.getDate()}&maxradiuskm=180`)
            count++;
            if (lastEarthquakes.data.features.length > 0) {
                worked = true;
                console.log(count)
                break;
            }
        } catch {
            console.log("Waste of $1.7B tax payer dollars")
        }
    }

    const recent = lastEarthquakes.data.features[0]
    var recents = [];

    for (i = 0; i < 4; i++) {
        var time = new Date(lastEarthquakes.data.features[i].properties.time)
        recents.push({
            "time": {
                "hour": time.getHours(),
                "day": time.getDate(),
                "month": Months[time.getMonth() + 1]
            },
            "mag": lastEarthquakes.data.features[i].properties.mag,
            "lat": lastEarthquakes.data.features[i].geometry.coordinates[1],
            "long": lastEarthquakes.data.features[i].geometry.coordinates[0],
            "depth": lastEarthquakes.data.features[i].geometry.coordinates[2],
            "place": lastEarthquakes.data.features[i].properties.place
        })
    }

    locals.recents = recents;

    var earthquakeTime = new Date(recent.properties.time);

    var body2 = {
        "name": "earthquake",
        "city": locals.city,
        "state": locals.region,
        "longitude": Number(locals.longitude),
        "latitude": Number(locals.latitude),
        "ip": ip,
        "status": "pending",
        "jobID": locals.jobID,
        "last": {
            "time": earthquakeTime.getHours(),
            "mag": recent.properties.mag,
            "lat": recent.geometry.coordinates[1],
            "long": recent.geometry.coordinates[0],
            "depth": recent.geometry.coordinates[2],
            "day": earthquakeTime.getDay() + 1,
            "month": earthquakeTime.getMonth() + 1,
        }
    }

    const earthquakes = await axios.post("http://localhost:4000/earthquake.json", body2)

    locals.predicted = earthquakes.data

    locals.months = [
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

    if (isMobile(req, res)) {
        res.render('new/mobile/indexinfo.ejs', locals);
    } else {
        res.render('new/mobile/indexinfo.ejs', locals);
    }

});

app.get("/app/plans", async (req, res) => {
    var cookies = req.cookies;

    if (req.cookies.userid == undefined || req.cookies.sessiontoken == undefined) {
        res.send("Invalid User")
        return
    }

    if (validateUser(cookies.userid, cookies.sessiontoken) == false) {
        res.send("Invalid User")
        return
    }

    var user = await getUser(cookies.userid);
    var plans = user.plans;

    console.log(plans)

    var locals = {

    }

    for (i = 0; i < plans.length; i++) {
        var plan = plans[i];
        var date = plan.created.toDate();

        plans[i].createdatestring = `${Months[date.getMonth() + 1]} ${date.getDate()}, ${date.getFullYear()}`;
    }
    console.log(plans)
    locals.plans = plans;

    res.render('new/mobile/planning/plans.ejs', locals);

});

app.get("/app/plans/view/:id", async (req, res) => {
    if (req.cookies.userid == undefined || req.cookies.sessiontoken == undefined) {
        res.send("Invalid User")
        return
    }

    if (validateUser(req.cookies.userid, req.cookies.sessiontoken) == false) {
        res.send("Invalid User")
        return
    }

    var user = await getUser(req.cookies.userid);
    var plan = {};

    for (i = 0; i < user.plans.length; i++) {
        if (user.plans[i].id == req.params.id) {
            plan = user.plans[i];
            plan.createdatestring = `${Months[plan.created.toDate().getMonth() + 1]} ${plan.created.toDate().getDate()}, ${plan.created.toDate().getFullYear()}`;
            plan.updatedstring = `${Months[plan.lastUpdated.toDate().getMonth() + 1]} ${plan.lastUpdated.toDate().getDate()}, ${plan.lastUpdated.toDate().getFullYear()}`;
        }
    }

    if (plan.id == undefined) {
        res.send("Invalid Plan")
        return
    }

    var locals = {
        "plan": plan
    }

    res.render('new/mobile/planning/plan.ejs', locals);
});

/* 
app.get('/app/plans/select', async (req, res) => {
    var locals = {};

    var ip = await req.ip;
    console.log(ip);
    if (ip.startsWith(":")) {
        ip = "128.12.123.204";
    }

    if (ip == "128.12.123.204") {
        locals.city = "Stanford";
        locals.region = "CA";
        locals.longitude = "-122.1639";
        locals.latitude = "37.423";
        locals.response = false
    } else {
        var ipInfo = await getIPInfo(ip);
        if (ipInfo.city) {
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

app.get("/app/plans/create/:name", async (req, res) => {
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
    while (found) {
        key = createRandomString(10);
        if (planCache[key] == undefined) {
            found = false;
        } else {
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

    if (plan == undefined) {
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
*/
 
app.use(function(req, res, next) {
    res.redirect('/'); 
});


/*
await sleep(0)
    function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
    }
*/
'use strict';
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var pi_clock_1 = require("./pi-clock");
var shell = require('shelljs');
var piClock = new pi_clock_1.PiClock();
piClock.start();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('app'));
app.use('/bower_components', express.static('bower_components'));
var getConfig = function () {
    return JSON.parse(fs.readFileSync('./config/config.json'));
};
app.get('/config', function (req, res) {
    return res.send(getConfig());
});
app.get('/configreset', function (req, res) {
    fs.writeFileSync('./config/config.json', fs.readFileSync('./config/default.json'));
    piClock.start();
    return res.send(getConfig());
});
app.post('/config', function (req, res) {
    var config = req.body;
    fs.writeFileSync('./config/config.json', JSON.stringify(config, null, 4));
    piClock.start();
    return res.send('Success!');
});
app.get('/downloadLog', function (req, res) {
    return res.send(fs.readFileSync('./out-0.log'));
});
app.get('/lightState', function (req, res) {
    var color = '#505050';
    switch (piClock.lightState) {
        case pi_clock_1.LightState.wake:
            color = '#00FF00';
            break;
        case pi_clock_1.LightState.sleep:
            color = '#FF0000';
            break;
    }
    return res.send({ "background-color": "" + color });
});
app.get('/shutdown', function (req, res) {
    piClock.dispose();
    shell.exec('/usr/bin/sudo /sbin/poweroff');
});
app.listen(3000, function () {
    console.log('Our app is listening on port 3000!');
});
process.on('SIGINT', function () {
    piClock.dispose();
    process.exit();
});
var pi_clock_2 = require("./pi-clock");
exports.PiClock = pi_clock_2.PiClock;

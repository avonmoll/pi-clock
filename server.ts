'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
import { PiClock, LightState } from './pi-clock';
var shell = require('shelljs');

let piClock = new PiClock();
piClock.start();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('app'));
app.use('/bower_components', express.static('bower_components'));

let getConfig = function(){
  return JSON.parse(fs.readFileSync('./config/config.json'));
};

app.get('/config', function(req, res) {
  return res.send(getConfig());
});

app.get('/configreset', function(req, res){
  // fs.createReadStream('./config/default.json').pipe(fs.createWriteStream('./config/config.json'));
  fs.writeFileSync('./config/config.json', fs.readFileSync('./config/default.json'));
  piClock.start();
  return res.send(getConfig());
});

app.post('/config', function(req, res) {
  // console.log(req.body.color);
  let config = req.body;
  fs.writeFileSync('./config/config.json', JSON.stringify(config, null, 4));
  piClock.start();
  return res.send('Success!');
});

app.get('/lightState', function(req, res) {
    let color = '#505050';
    switch(piClock.lightState) {
        case LightState.wake:
            color = '#00FF00';
            break;
        case LightState.sleep:
            color = '#FF0000';
            break;
    }
    return res.send({"background-color": `${color}`});
})

app.get('/shutdown', function(req, res) {
    piClock.dispose();
    shell.exec('/usr/bin/sudo /sbin/poweroff');
});

app.listen(3000, function() {
  console.log('Our app is listening on port 3000!');
});

process.on('SIGINT', function() {
    piClock.dispose();
    process.exit();
})

export {PiClock} from './pi-clock';

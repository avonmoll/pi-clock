'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('app'));
app.use('/bower_components', express.static('bower_components'));

app.get('/welcome', function(req, res) {
  console.log("Welcome accessed");
  return res.send('Welcome to Module 2 Homework!');
});

app.post('/', function(req, res) {
  console.log(req.body.color);
  return res.send('Received!');
});

app.listen(3000, function() {
  console.log('Our app is listening on port 3000!');
});

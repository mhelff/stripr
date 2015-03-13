#!/usr/bin/env node
/*
 Stripr
 
 node.js backend + angularjs frontend for controlling a RGB-LED-Strip connected to a Raspberry Pi.

 Copyright (C) 2015 Martin Helff

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later 
 version.

 This program is distributed in the hope that it will be useful, but WITHOUT 
 ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS 
 FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with 
 this program. If not, see http://www.gnu.org/licenses/.

*/

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var net = require('net');
var util = require('util');
var rgbtostrip = require('./rgbtostrip.js');
var callsignal = require('./callsignal.js');

var app = express();
app.use(express.static(path.join(__dirname, 'client')));
app.use(bodyParser.json());
// API endpoint for requesting the lighting information
app.get('/getlight', function (req, res) {
    res.send('{"s": ' + rgbtostrip.steps + ', "h": ' + rgbtostrip.h + ', "v":' + rgbtostrip.v + ', "mode":"' + rgbtostrip.mode + '"}');
});

// API endpoint setting which light is on
app.post('/setlight', function (req, res) {
	rgbtostrip.setColor( req.body.h, req.body.v );
	rgbtostrip.setMode( req.body.mode );
	rgbtostrip.steps = req.body.s;
    res.send('ok');
});

// API endpoint for requesting the calldata information
app.get('/getcalldata', function (req, res) {
    res.send(JSON.stringify(callsignal.calldata));
});

// API endpoint setting which light is on
app.post('/setcalldata', function (req, res) {
	callsignal.calldata = req.body;
	callsignal.saveCalldata();
    res.send('ok');
});

// init call listener
callsignal.loadCalldata();
callsignal.startListener('fritz.box', 1012);
 
module.exports = app;

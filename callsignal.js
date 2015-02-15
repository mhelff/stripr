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

var net = require('net');
var fs = require('fs');
var rgbtostrip = require('./rgbtostrip.js');

var callsignal = {
	
	// default: blink red on incoming call every 500 ms
	calldata: { '*': {'hue': '0', 'v': '100', 'frequency': '500', 'name': 'Standard'} },
	
	loadCalldata: function() {
		filename = fs.realpathSync(__dirname) + '/calldata.json';
		try {
			this.calldata = JSON.parse(fs.readFileSync(filename, 'utf8'));
			console.log('calldata read from file');
		} catch( e ) {
			console.log('calldata file does not exist, using default data');
		}
	},
	
	saveCalldata: function() {
		filename = fs.realpathSync(__dirname) + '/calldata.json';
		
		fs.writeFile(filename, JSON.stringify(this.calldata, null, 4), function(err) {
    		if(err) {
      			console.log(err);
    		} else {
      			console.log("JSON saved to " + filename);
    		}
		}); 
	},
	
	getCalldata: function(msisdn) {
		if( msisdn in this.calldata ) {
			console.log('found msisdn!');
			return this.calldata[msisdn];
		} else {
			return this.calldata['*'];
		}	
	},	
	
	startListener: function(host, port) {

		var client = net.createConnection(port, host,
    		function() { //'connect' listener
  				console.log('connected to server!'); 			
			});
			
		client.on('data', function(data) {
  			cmd = getCommand(data.toString());
  		
  			if(cmd == 'RING') {
     			msisdn = getIncomingMSISDN(data.toString());
     			blinkdata = callsignal.getCalldata(msisdn);
     			console.log('Its ringing: ' + msisdn);
     			blinker.startBlink(blinkdata);  
  			}
  		
  			if(cmd == 'CONNECT') {
     			console.log('Its connecting');
     			blinker.stopBlink();
  			}
  		
  			if(cmd == 'DISCONNECT') {
     			console.log('Its disconnecting');
     			blinker.stopBlink();
  			}

  			console.log(data.toString());
		});
		
		client.on('end', function() {
  			console.log('disconnected from server');
  			startListener('fritz.box', 1012);
		});
	}
}


function getCommand(input) {
   var params = input.split(';');
   var cmd = params[1];
   return cmd;
}

function getIncomingMSISDN(input) {
   var params = input.split(';');
   var cmd = params[3];
   return cmd;
}


var blinker = {
   onoff: false,
   startBlink: function(blinkdata) {
   	  rgbtostrip.stopMode();
      this.iv = setInterval( function() {
                if(!this.onoff) {
                   rgbtostrip.setColor(blinkdata.hue, blinkdata.v, true);
                } else {
                   rgbtostrip.setColorStrip(0, 0, true);
                }
                this.onoff = !this.onoff;
             }, blinkdata.frequency ); 
      },
    stopBlink: function() {
            clearInterval(this.iv);
            rgbtostrip.setColorStrip(0, 0, true);
            rgbtostrip.startMode();
            console.log('Stopped interval!');
      }
  }




module.exports = callsignal;
        
   

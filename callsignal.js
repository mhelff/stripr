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
var util = require('util');
var rgbtostrip = require('./rgbtostrip.js');

var callsignal = {
	
	// default: blink red on incoming call every 500 ms
	calldata: { '*': {'hue': '0', 'v': '100', 'frequency': '500', 'name': 'Standard'} },
	
	connected: false,
	
	loadCalldata: function() {
		filename = fs.realpathSync(__dirname) + '/calldata.json';
		try {
			this.calldata = JSON.parse(fs.readFileSync(filename, 'utf8'));
			util.log('calldata read from file');
		} catch( e ) {
			util.log('calldata file does not exist, using default data');
		}
	},
	
	saveCalldata: function() {
		filename = fs.realpathSync(__dirname) + '/calldata.json';
		
		fs.writeFile(filename, JSON.stringify(this.calldata, null, 4), function(err) {
    		if(err) {
      			util.log(err);
    		} else {
      			util.log("JSON saved to " + filename);
    		}
		}); 
	},
	
	getCalldata: function(msisdn) {
		if( msisdn in this.calldata ) {
			util.log('found msisdn!');
			return this.calldata[msisdn];
		} else {
			return this.calldata['*'];
		}	
	},	
	
	startListener: function(host, port) {

		if(!callsignal.connected) {
          	util.log('connecting to server');
			var client = net.createConnection(port, host,
    			function() { //'connect' listener
  				util.log('connected to server');
  				callsignal.connected = true;	
			});
		
			client.on('error', function (e) { util.log("error connecting: " + e); });	
			
		client.on('data', function(data) {
  			cmd = getCommand(data.toString());
  		
  			if(cmd == 'RING') {
     			msisdn = getIncomingMSISDN(data.toString());
     			blinkdata = callsignal.getCalldata(msisdn);
     			rgbtostrip.blinkHue = blinkdata.hue;
     			rgbtostrip.blinkV = blinkdata.v;
     			rgbtostrip.blinkFrequency = blinkdata.frequency;
     			util.log('Its ringing: ' + msisdn);
     			this.orgMode = rgbtostrip.mode;
                        // just in case nothing was set before, switch back to single color after call signal
                        if(this.orgMode === undefined) {
                          this.orgMode = 'single';
                        }
     			rgbtostrip.setMode('blink');  
  			}
  		
  			if(cmd == 'CONNECT') {
     			util.log('Its connecting');
                        // only reset if we are blinking
                        if(rgbtostrip.mode == 'blink') {
     			    rgbtostrip.setMode(this.orgMode);
                        }
  			}
  		
  			if(cmd == 'DISCONNECT') {
     			util.log('Its disconnecting');
                        // only reset if we are blinking
                        if(rgbtostrip.mode == 'blink') {
     			    rgbtostrip.setMode(this.orgMode);
                        }
   			}

  			// console.log(data.toString());
		});
		
		client.on('end', function() {
  			util.log('disconnected from server');
  			callsignal.connected = false;
		});
		}
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

module.exports = callsignal;
        
   

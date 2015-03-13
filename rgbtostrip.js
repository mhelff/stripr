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


var piblaster = require("pi-blaster.js");
var util = require('util');

var rgbtostrip = {
	
	h: 0,
	v: 0,
	mode: 'single',
	steps: 20,
	
	setColor: function(h, v, force) {
		if(!force) {
			this.h = h;
			this.v = v;
		}
		
		if(this.mode == 'single' || force) {
			colorarray = this.hsvToRgb(h/360.0, 1, v/100.0);
        	this.setColorStrip(colorarray[0], colorarray[1], colorarray[2]);   
		}
	},
	
	setColorStrip: function(red, green, blue) {
		this.setR(red);
		this.setG(green);
		this.setB(blue);
	},
	
	setR: function(red) {
		piblaster.setPwm(17, red / 255.0);
	},
	
	setG: function(green) {
		piblaster.setPwm(22, green / 255.0);
	},

	setB: function(blue) {
		piblaster.setPwm(24, blue / 255.0);
	},
	
	getColor: function() {
		return currentColor;
	},
	
	setMode: function(newmode) {

		var oldmode = this.mode;
		this.mode = newmode;
		if(oldmode != this.mode) {
                        util.log('Switching mode from ' + oldmode + ' to ' + this.mode);
			this.startMode();	
		} 
	},
	
	setSteps: function(step) {
		this.steps = step;
	},
	
	setBrightness: function(bright) {
		this.brightness = bright;
	},
	
	startMode: function() {
		util.log('start mode: ' + this.mode);
		if(this.mode == 'single') {
			this.fader.stopFade();
			this.blinker.stopBlink();
			this.setColor(this.h, this.v);
		} else if(this.mode == 'fade') {
	       this.fader.startFade(this);
	       this.blinker.stopBlink();
		} else if(this.mode == 'blink') {
			this.fader.stopFade();
	       	this.blinker.startBlink(this);
		}		
	},
	
	stopMode: function() {
		if(this.mode == 'fade') {
			this.fader.stopFade();
		}
	},
	 
    fader: {
   		hue: 0,
   		
   		startFade: function() {
   			this.hue = rgbtostrip.h;
   			
   	  		this.iv = setInterval( (function() {
   	  			this.hue += (rgbtostrip.steps/100.0);
   	  			if(this.hue > 360.0) {
   	  				this.hue = 0.0;
   	  			}
   	  			
        		rgbtostrip.setColor(this.hue, rgbtostrip.v, true);   
               }).bind(this), 10 );
            util.log('Started fader'); 
      	},
      	
    	stopFade: function() {
            clearInterval(this.iv);
            util.log('Stopped fader');
      	}
 
    },
    
	blinker: {
   		onoff: false,
   		startBlink: function() {
   	  		this.blinkiv = setInterval( function() {
                if(!this.onoff) {
                   rgbtostrip.setColor(rgbtostrip.blinkHue, rgbtostrip.blinkV, true);
                } else {
                   rgbtostrip.setColorStrip(0, 0, true);
                }
                this.onoff = !this.onoff;
             }, rgbtostrip.blinkFrequency ); 
             util.log('Started blinker');
      	},
      
    	stopBlink: function() {
            clearInterval(this.blinkiv);
            util.log('Stopped blinker');
      	}
  	},
    
    hsvToRgb: function(h, s, v) {
    	var r, g, b;
    
    	var i = Math.floor(h * 6);
    	var f = h * 6 - i;
    	var p = v * (1 - s);
    	var q = v * (1 - f * s);
    	var t = v * (1 - (1 - f) * s);

    	switch(i % 6){
        	case 0: r = v, g = t, b = p; break;
        	case 1: r = q, g = v, b = p; break;
        	case 2: r = p, g = v, b = t; break;
        	case 3: r = p, g = q, b = v; break;
        	case 4: r = t, g = p, b = v; break;
        	case 5: r = v, g = p, b = q; break;
    	}

    	return [r * 255, g * 255, b * 255];
	}
 		

};

util.log('Initializing rgbtostrip');
rgbtostrip.setColor(0, 0);

module.exports = rgbtostrip;

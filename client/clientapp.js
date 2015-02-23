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

var app = angular.module('stripr', ['ui.bootstrap']);

app.isSending = false;
 	
 app.controller('StriprController', ['$scope', "$http", function ($scope, $http) {
  	
  	$scope.testStyle = {'-webkit-slider-runnable-track': '{height: 4em; width: 100%; background: rgba(1,1,1,0)}', '-webkit-appearance': 'none'};	  	
  		  	    
  	$http.get('/getlight').
    	success(function(data, status, headers, config) {
    		console.log(data);
      		$scope.h = data.h;
      		$scope.v = data.v;
      		$scope.colorMode = data.mode;
      		$scope.speed = data.s;
      		$scope.brightnessStyle = {'background':'linear-gradient(90deg, black, ' + calculateHtmlColor($scope.h, 100.0) + ')'};
    	}).
    	error(function(data, status, headers, config) {
      		// log error
    });
    
    $scope.$watch('colorMode', function(value) {
    	if(value !== undefined) {
       		$scope.slideDelegate();
    	}
 	});
 	
 	$scope.$watch('m', function(value) {
    	if(value !== undefined) {
       		console.log('found m: ' + value);
    	}
 	});
 	          		
  	$scope.slideDelegate = function() {
  		if($scope.colorMode == 'single') {
  			//$scope.brightnessStyle = {'background':'linear-gradient(90deg, black, ' + calculateHtmlColor($scope.h, 100.0) + ')'};
  			less.modifyVars({'track-color':'linear-gradient(90deg, black, ' + calculateHtmlColor($scope.h, 100.0) + ')'});
  		} else {
  			//$scope.brightnessStyle = {'background':'linear-gradient(90deg, black, white)'};
  			less.modifyVars({'track-color':'linear-gradient(90deg, black, white)'});
  		}
  		
          if(!app.isSending) {
          	app.isSending = true;
          	payload = '{"s": ' + $scope.speed + ', "h": ' + $scope.h + ', "v": ' + $scope.v + ', "mode": "' + $scope.colorMode + '"}';
          	console.log('sending: ' + payload);
          	$http.post('/setlight', '{"s": ' + $scope.speed + ', "h": ' + $scope.h + ', "v": ' + $scope.v + ', "mode": "' + $scope.colorMode + '"}').
    			success(function(data, status, headers, config) {
    			     app.isSending = false;
    			}).
    			error(function(data, status, headers, config) {
  		      	     app.isSending = false;
    		});
          } else {
          	console.log('skipped sending: ' + $scope.colorMode);
          }  		
  	};

  	

  			
}]);

app.controller('CalldataController', ["$http", function ($http) {
	
	this.calldata = {};
	this.m = '';
	this.hu = '0';
	this.va = '100';
	this.f = '500';
	this.n = '';
	
	$http.get('/getcalldata').
    	success(function(data, status, headers, config) {
    		console.log(data);
      		this.calldata = data;
    	}.bind(this)).
    	error(function(data, status, headers, config) {
      		console.log('Could not read calldata');
    });
    
    this.saveCalldata = function() {
    	$http.post('/setcalldata', JSON.stringify(this.calldata)).
    			success(function(data, status, headers, config) {
    			     console.log('updated calldata');
    			}).
    			error(function(data, status, headers, config) {
  		      	     console.log('could not update calldata');
    		});
    }
    
    this.removeCalldata = function(msisdn) {
    	delete this.calldata[msisdn];
    	this.saveCalldata();
    }
    
    this.addCalldata = function() {
    	this.calldata[this.m] = { 'hue': this.hu, 'v': this.va, 'frequency': this.f, 'name': this.n };
    	this.saveCalldata();
    	
    	// reset form
    	this.m = '';
    	this.hu = '0';
		this.va = '100';
		this.f = '500';
		this.n = '';    	
     }


	
}]);

function calculateHtmlColor(hue, v) {
  		colorArray = hsvToRgb(hue/360.0, 1, v/100.0);
  		return '#' + decimalToHex(colorArray[0]) + decimalToHex(colorArray[1]) + decimalToHex(colorArray[2]);	
}

function decimalToHex(d, padding) {
    	var hex = Number(Math.round(d)).toString(16);
    	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    	while (hex.length < padding) {
        	hex = "0" + hex;
    	}

    	return hex;
	}
	
function hsvToRgb(h, s, v){
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

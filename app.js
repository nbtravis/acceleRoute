var express = require('express');
var app = express();
var http = require("http");
var querystring = require("querystring");

app.all('/', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

app.get('/', function (req, res) {
	var from = querystring.escape(req.query.from),
    	to = querystring.escape(req.query.to),
    	time = req.query.time;

    calculate(from, to, time, res);
});

var calculate = function(from, to, time, res) {
	var memo = {};
	var end;

	calculateHelper(from, to, convertTime(time), res);
};

var calculateHelper = function(from, to, time, res) {

	var options = {
		host: 'dev.virtualearth.net',
		path: '/REST/V1/Routes/Transit?wp.0='+from+'&wp.1='+to+'&timeType=Departure&dateTime='+time+'&maxSolns=3&output=json&key=Ar4y4wDSYp3CK2xuOrmYnj_CrI-XcCKR9gekEPPSZUWwH5G7QP-8TAwVSp07TD9T'
	};

	var callback = function(response) {
		var str = '';

		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			res.send(str);
		});
	};

	http.request(options, callback).end();
};

var convertTime = function(time) {
	var d = new Date(time).toLocaleDateString(),
	    t = new Date(time).toLocaleTimeString().replace(' ', '');

	return querystring.escape(d+" "+t);
}

var server = app.listen(3000, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);

});
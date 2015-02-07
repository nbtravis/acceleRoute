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
    	to = querystring.escape(req.query.to);

	var options = {
		host: 'dev.virtualearth.net',
		path: '/REST/V1/Routes/Transit?wp.0='+from+'&wp.1='+to+'&timeType=Departure&dateTime=3:00:00PM&output=json&key=Ar4y4wDSYp3CK2xuOrmYnj_CrI-XcCKR9gekEPPSZUWwH5G7QP-8TAwVSp07TD9T'
	};

	var callback = function(response) {
		var str = '';

        response.on('data', function (chunk) {
        	str += chunk;
        });

        response.on('end', function () {
        	res.send(calculate(str));
        });
    };

    http.request(options, callback).end();

});

var calculate = function(data) {
	return data;
}

var server = app.listen(3000, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);

});
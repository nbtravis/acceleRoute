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
    	time = req.query.time,
    	speed = req.query.speed;

    calculate(from, to, time, speed, res);
});

app.get('/test', function (req, res) {
	res.send("Hello from Azure !");
})

var memoTime = {};
var memoPrev = {};
var memoDir = {};
var end = "";
var stack = [];
var accumulatePath = function() {
	if (!(end in memoTime)) return [];
	var result = [];
	var curr = end;
	while (memoPrev[curr] !== "") {
		result.push([memoTime[curr], memoDir[curr]]);
		curr = memoPrev[curr];
	}
	return result;
};

var calculate = function(from, to, time, speed, res) {
	memoTime = {}, memoPrev = {}, memoDir = {};
	end = "";
	stack = [];
	var options = {
		host: 'dev.virtualearth.net',
		path: '/REST/V1/Routes/Transit?wp.0='+from+'&wp.1='+to+'&timeType=Departure&dateTime='+convertTime(time)+'&maxSolns=3&output=json&key=Ar4y4wDSYp3CK2xuOrmYnj_CrI-XcCKR9gekEPPSZUWwH5G7QP-8TAwVSp07TD9T'
	};

	var callback = function(response) {
		var str = '';

		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			var resources = JSON.parse(str).resourceSets[0].resources;
			for (var k = 0; k < resources.length; k++) {
				var resource = resources[k];
				var data = resource.routeLegs[0];
				var items = data.itineraryItems;
				var instr = items[0].instruction.text;

				var duration = items[0].travelDuration;
				
				var i = instr.indexOf("to") + 3;
				var dest = instr.substring(i, instr.length);
				var j = instr.indexOf("from")+5;
				var src = instr.substring(j, i-3);

				var scaledTime = duration / speed;
				var newDepartureTime = (new Date(Date(time))).getTime() + scaledTime*1000;
				memoTime[src] = (new Date(Date(time))).getTime();
				memoPrev[src] = "";
				memoDir[src] = "";

				if ((!(dest in memoTime)) || (memoTime[dest]>newDepartureTime)) {
					stack.push([newDepartureTime, dest]);


					memoTime[dest] = newDepartureTime;
					memoPrev[dest] = src;
					memoDir[dest] = instr;
			    }
				if (end==="") {
					var lastInstr = items[items.length - 1].instruction;
					if (lastInstr.text.indexOf("Walk")===0) {
						instr = lastInstr.text;
						i = instr.indexOf("to") + 3;
						dest = instr.substring(i, instr.length);
						end = dest;
					}
					else {
						instr = items[items.length - 1].childItineraryItems[1].instruction.text;
						end = instr.substring(8, instr.length);
					}
					console.log(end);
				}

			} 

		});
	};
	http.get("http://"+options.host+options.path, callback);

	calculateHelper(to, speed, res);
};

var calculateHelper = function(to, speed, res) {
	if (end==="") {
		setTimeout(function(){calculateHelper(to, speed, res)}, 100);
		return;
	}
	if (stack.length === 0) {
		//console.log(res);
		//res.send(accumulatePath());
		setTimeout(function(){calculateHelper(to, speed, res)}, 100);
		return;
	}

	console.log(stack);
	var pos = stack.pop();
	var time = pos[0];
	var from = pos[1];
	while(memoTime[from]<time) {
		if (stack.length>0) {
			pos = stack.pop();
			time = pos[0];
			from = pos[1];
		}
		else {
			setTimeout(function(){calculateHelper(to, speed, res)}, 100);
			return;
		}
	}
	from = querystring.escape(from);
	var options = {
		host: 'dev.virtualearth.net',
		path: '/REST/V1/Routes/Transit?wp.0='+from+'&wp.1='+to+'&timeType=Departure&dateTime='+convertTime(time)+'&maxSolns=3&output=json&key=Ar4y4wDSYp3CK2xuOrmYnj_CrI-XcCKR9gekEPPSZUWwH5G7QP-8TAwVSp07TD9T'
	};
	from = pos[1];
	var callback = function(response) {
		var str = '';

		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			if (str==="") return;
			var resources1 = JSON.parse(str).resourceSets[0];
			if (resources1 === undefined) return;
			resources = resources1.resources;

			for (var k = 0; k < resources.length; k++) {
				var resource = resources[k];
				var data = resource.routeLegs[0];
				var items = data.itineraryItems;
				var instr = items[0].instruction.text;
				console.log(instr);
				console.log("duration " + items[0].travelDuration + " steps " + items.length);

				if (items[0].travelDuration===0) {
					if (items.length === 1) {
						end = from;
						res.send(accumulatePath());
						return;
					}
					else return;

				}
				if (instr.indexOf("Walk")===0) {
					var i = instr.indexOf("to")+3;
					var dest = instr.substring(i, instr.length);
					if (dest === from) {
						items = items.slice(1, items.length);
						instr = items[0].instruction.text;
					}
				}
				//console.log("from" + from);
				if (instr.indexOf("Walk")===0 && memoDir[from].indexOf("Walk")===0)
					continue;
				
				if (instr.indexOf("Walk")===0) {
					var duration = items[0].travelDuration;
					
					var i = instr.indexOf("to") + 3;
					var dest = instr.substring(i, instr.length);
					var j = instr.indexOf("from")+5;
					var src = instr.substring(j, i-3);

					var scaledTime = duration / speed;
					var newDepartureTime = time + scaledTime*1000;
					if (dest in memoTime && memoTime[dest]<=newDepartureTime) continue;
					memoTime[dest] = newDepartureTime;
					memoPrev[dest] = src;
					memoDir[dest] = instr;
					if (dest !== end)
						stack.push([newDepartureTime, dest]);
				}
				
				else {
					var arriveInstr = items[0].childItineraryItems[1].instruction.text;
					// TODO : also find time we leave the bus stop
					
					var dest = arriveInstr.substring(8, instr.length);
					var tempTime = items[0].childItineraryItems[1].time;
					var newDepartureTime = (eval("new " + tempTime.substring(1, tempTime.length-1))).getTime();
					if (dest in memoTime && memoTime[dest]<=newDepartureTime) continue;
					memoTime[dest] = newDepartureTime;
					memoPrev[dest] = from;
					memoDir[dest] = items[0].childItineraryItems[0].instruction.text + "\n" +
							items[0].instruction.text + "\n" +
							arriveInstr;
					if (dest !== end) 
						stack.push([newDepartureTime, dest]);
				}

			}
		});
	};

	http.get("http://"+options.host+options.path, callback);
	if (end in memoTime) {
		res.send(accumulatePath());
		return;
	}
	calculateHelper(to, speed, res);
};

var convertTime = function(time) {
	var d = new Date(Date(time)).toLocaleDateString(),
	    t = new Date(Date(time)).toLocaleTimeString().replace(' ', '');

	return querystring.escape(d+" "+t);
}

var server = app.listen(process.env.PORT || 3000, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);

});
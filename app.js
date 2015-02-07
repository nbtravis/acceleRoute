var express = require('express')
  , app = express.createServer();

app.configure(function () {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      next();
    });
    app.use(app.router);
});

app.get("/", function(req, res) {
	res.send("Hello from azure !");
})

app.listen(80);
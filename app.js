var express = require('express');
var path = require('path');


var settings=require('./settings');

var flash=require('connect-flash');

var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var users = require('./routes/users');
var http=require('http');

var session=require('express-session');

var MongoStore=require('connect-mongo')(session);

var fs=require('fs');
var accessLog=fs.createWriteStream('access.log',{flags:'a'});
var errorLog=fs.createWriteStream('error.log',{flags:'a'});

var app = express();

app.set('port',process.env.PORT||3000);

var serveStatic=require('serve-static');

app.use(serveStatic(path.join(__dirname, 'public')));
app.use(function(err,req,res,next){
    var meta='['+new Date()+']'+req.url+'\n';
    errorLog.write(meta+err.stack+'\n');
    next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());

app.use(favicon());
app.use(logger({stream:accessLog}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.use(session({
    secret:settings.cookieSecret,
    name:settings.db,
    cookie:{maxAge:1000*60*60*24*30},
    store:new MongoStore({
        db:settings.db
    })
}));




//app.get('/', routes.index);
//app.get('/users', users);
require('./routes/index')(app);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});




http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port '+app.get('port'));
});

//module.exports = app;

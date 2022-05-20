const express = require('express');
const app = express();
const port = 3000;
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var path = require('path');
var dispatcher = require('./dispatcher');

// Set up Page Renderer
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

// Define the routes
var router = express.Router();
router.get('/', startPage);
app.use('/', router);

function startPage(req, res) {
    console.log('Loading start page from: ' + req.hostname);
    res.render('index');
}

dispatcher.initialise();

// Listen for a client, set up search route
// --------------------
io.on('connection', socket => {
    console.log('user connected', socket.id);
    socket.emit('clientConnect', {message: 'Welcome, new client'});

    socket.on('search', message => {
        dispatcher.dispatchSearch(message.search, socket);        
    });
    
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});


// Simple error handling
// --------------------
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    console.log('Page not found: ' + req.url);
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('Error %d, remoteAddress: %s', err.status, ip);
    console.log('If running inside Vagrant, this may give some clues to the callers identity:');
    console.log(req.ip);
    console.log(req.ips);
    console.log(req.hostname);
    console.log(req.headers);        
    
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


// All done, start listening
server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


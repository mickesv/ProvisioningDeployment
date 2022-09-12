const express = require('express');
const app = express();
const port = 3000;
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fetch = require('node-fetch');
const os = require('os');
var path = require('path');

// TextManager manages all the texts in the database
// Dispatcher manages the job queue
const TextManager = require('./textManager');
const Dispatcher = require('./dispatcher');

// const serverIDMessage = { message: 'Server id: ' + os.hostname() };
const serverIDMessage = {}; // No message

// Set up Page Renderer
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

// Define the routes
// --------------------
var router = express.Router();
router.get('/', startPage);
router.get('/add', addTextPage);
router.get('/list', listTextsPage);
app.use('/', router);

function startPage(req, res) {
    console.log('Loading start page from: ' + req.hostname);
    return res.render('index', serverIDMessage);
}

function addTextPage(req, res) {
    console.log('Serving the "Add New Text" page...');
    return res.render('addText');
}

function listTextsPage(req, res) {
    console.log('Listing available texts.');
    let tm = new TextManager();
    return tm.connect()
        .then( tm.listTexts )
        .then(texts => res.render('index', {textList: texts,
                                                ...serverIDMessage}) );
}

// Listen for a client, set up what to do on specific messages on the socket
// --------------------
io.on('connection', socket => {
    console.log('user connected', socket.id);
    socket.emit('clientConnect', {message: 'Welcome, new client'});

    socket.on('search', searchTexts );
    socket.on('addText', addText)    
    socket.on('disconnect', () => { console.log('user disconnected'); });

    // Functions to handle messages from the (web) client
    // And yeah, it is ugly to define these inside another function,
    // but that closures for you. And my inexperience with JavaScript.
    // I suppose I could curry up the socket variable into the method
    // call, but that sounds lime work.
    // --------------------
    function searchTexts(message) {
        // Fetch the available texts from TextManager
        // Let the Dispatcher format them as "jobs"
        // Then dispatch the search
        let tm = new TextManager();
        let dispatcher = new Dispatcher();
        return tm.connect()
            .then( tm.listTexts )
            .then( texts => dispatcher.formatJobs(message.search, texts, socket.id) )
            .then( jobs => dispatcher.dispatchSearch(message.search, jobs, socket) );
    }

    function addText(message) {
        let url = message.url || 'https://gutenberg.org/cache/epub/2600/pg2600.txt'
        let title = message.title || 'War and Peace'
        console.log('Adding Text', title, 'from', url);
        return fetch(url)
            .then(res => res.text())
            .then(text => {
                console.log('Fetched text: ', text.substring(1,80))
                let tm = new TextManager();
                return tm.connect()
                    .then( () => tm.addText(title, text) )
            })
            .then( () => socket.emit('textAdded', title) )
            .then(() => console.log('Text added.'))
            .catch( (err) => {
                console.log('Could not add text. Error', err);
                socket.emit('abort', 'Could not add text.');
            });
    }
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

    if ('/favicon.ico' != req.url) {        
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log('Error %d, remoteAddress: %s', err.status, ip);
        console.log('If running inside Vagrant, this may give some clues to the callers identity:');
        console.log(req.ip);
        console.log(req.ips);
        console.log(req.hostname);
        console.log(req.headers);   
    }     
    
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


// All done, start listening
server.listen(port, () => {
    console.log(`QuoteFinder app listening on port ${port}`);
    console.log('Server id:', os.hostname());
});


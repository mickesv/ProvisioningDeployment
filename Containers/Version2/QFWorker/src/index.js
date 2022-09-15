const RSMQPromise = require('rsmq-promise-native');
const rsmq = new RSMQPromise({host: process.env.REDIS_HOST });
var RSMQWorker = require('rsmq-worker');
const TextManager = require('./textManager');
const ActiveSearchStrategy = require('./searchStrategyBuilder')();

const SEARCHQUEUE = 'searchJob';
var MAXTHREADS = 10;

// Setup
// --------------------
if (process.env.MAXTHREADS) {
    MAXTHREADS = process.env.MAXTHREADS;
}

if (!process.env.REDIS_HOST) {
    console.log('WARNING: the environment variable REDIS_HOST is not set');
}

var worker = new RSMQWorker(SEARCHQUEUE, {host: process.env.REDIS_HOST});

// Timeout watchdog
// --------------------
const HBINTERVAL = 60000;
function keepAlive() {
    console.log('Connected to queue', SEARCHQUEUE, ':', worker.queue.connected);
    setTimeout(keepAlive, HBINTERVAL);
}
keepAlive() // Comment this line to remove these status messages.

// Start listening for jobs on SEARCHQUEUE
// ========================================
worker.on('message', (msg, next, id) => {
    let job = JSON.parse(msg);
    console.log(SEARCHQUEUE,job.searchString, 'in Text', job.textTitle);
    let textManager = new TextManager();
    let textSearcher = new ActiveSearchStrategy();
    // textSearcher.testSearch();

    return textManager.connect()
        .then( () => rsmq.sendMessage( {qname: job.returnQueue, message: 'STARTED'}))
        .then( () => textManager.startSearch(job, MAXTHREADS, textSearcher))
        .then( result => result.flat() )
        .then ( result => {
            console.log('Number of results:', result.length);
            result.forEach(r => {
                let cleanedResult = r.replace(/[\n\r]/g, ' ').trim();
                rsmq.sendMessage( {qname: job.returnQueue, message: JSON.stringify({ textTitle: job.textTitle,
                                                                                     contents: cleanedResult })})})}) // This is starting to look a lot like lisp, don't you think?
        .then( () => rsmq.sendMessage( {qname: job.returnQueue, message: 'DONE'}))
        .catch( err => console.log('Failed during search. Continuing...'))
        .then( () => next());
});

worker.on('error', (err, msg) => {
    console.log('Error', err, msg);
});

worker.start();
console.log('Worker started...');

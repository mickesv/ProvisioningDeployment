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

// Start listening for jobs on SEARCHQUEUE
// ========================================
var worker = new RSMQWorker(SEARCHQUEUE, {host: process.env.REDIS_HOST});
worker.on('message', (msg, next, id) => {
    console.log('Job on queue', SEARCHQUEUE, id, msg);
    let job = JSON.parse(msg);
    let textManager = new TextManager();
    let textSearcher = new ActiveSearchStrategy();
    // textSearcher.testSearch();

    return textManager.connect()
        .then( () => rsmq.sendMessage( {qname: job.returnQueue, message: 'STARTED'}))
        .then( () => textManager.startSearch(job, MAXTHREADS, textSearcher))
        .then( result => result.flat() )
        .then ( result => {
            console.log('Back in dispatch, preparing to return results', result.length);
            result.forEach(r => {
                let cleanedResult = r.replace(/[\n\r]/g, ' ').trim();
                rsmq.sendMessage( {qname: job.returnQueue, message: JSON.stringify({ textTitle: job.textTitle,
                                                                                     contents: cleanedResult })})})}) // This is starting to look a lot like lisp, don't you think?
        .catch( err => console.log('Failed during search', err))
        .then( () => rsmq.sendMessage( {qname: job.returnQueue, message: 'DONE'}))
        .then( () => next());
});

worker.on('error', (err, msg) => {
    console.log('Error', err, msg);
});

worker.start();
console.log('Worker started...');

const RSMQPromise = require('rsmq-promise-native');
const rsmq = new RSMQPromise({host: process.env.REDIS_HOST });
var RSMQWorker = require('rsmq-worker');
var textManager = require('./textmanager');
var textSearcher = require('./textsearcher');

const SEARCHQUEUE = 'searchJob';
var MAXTHREADS = 10;

if (process.env.MAXTHREADS) {
    MAXTHREADS = process.env.MAXTHREADS;
}

if (!process.env.REDIS_HOST) {
    console.log('WARNING: the environment variable REDIS_HOST is not set');
}

var worker = new RSMQWorker(SEARCHQUEUE, {host: process.env.REDIS_HOST});

// TODO Replace with proper search-in-text function
function searchFun(searchString, text) {
    return "looked for " + searchString;
}


// Launch a test job every time QFWorker is restarted
//textManager.populateTestText();
//textManager.testSearch();

// Test the search algorithm
//textSearcher.testSearch();

// Start listening for real jobs
worker.on('message', (msg, next, id) => {
    console.log('Job on queue', SEARCHQUEUE, id, msg);
    let job = JSON.parse(msg);

    job.textName='testText'; // TODO remove this line to search in actual texts

    textManager.startSearch(job, MAXTHREADS, textSearcher.findSentences)
        .then ( result => {
            console.log('Back in dispatch, preparing to return results', result);
            console.log(job.returnQueue);
            rsmq.sendMessage( {qname: job.returnQueue, message: JSON.stringify(result)});
        });
        
    return next();
});

worker.on('error', (err, msg) => {
    console.log('Error', err, msg);
});

worker.start();
console.log('Worker started...');

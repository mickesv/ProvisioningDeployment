const RSMQPromise = require('rsmq-promise-native');
const rsmq = new RSMQPromise({host: process.env.REDIS_HOST });
var RSMQWorker = require('rsmq-worker');
var textManager = require('./textManager')
var Text = require('./textStore');

const SEARCHQUEUE = 'searchJob';

if (!process.env.REDIS_HOST) {
    console.log('WARNING: the environment variable REDIS_HOST is not set');
}

var worker = new RSMQWorker(SEARCHQUEUE, {host: process.env.REDIS_HOST});

worker.on('message', (msg, next, id) => {
    console.log('Job on queue', SEARCHQUEUE, id, msg);
    job = JSON.parse(msg);

    // TODO
    // - retreive all texts matching job.textName
    // - Take 10 (MAXTHREADS) or remaining, create a Promise to search in it
    //   - when searching, each hit is sent directly to job.returnQueue
    //   - repeat with MAXTHREADS again (can I use cursors on a MongoDB?)
    // - when all done, send jobDone on job.returnQueue.

    // Someting like this:
// (async () => {
//   const stream = MongooseModel.find({}).populate({path: 'fieldX'}).batchSize(100).cursor();
//   for await (const doc of stream) {
//     console.log(doc);
//   }
// })();
    
    next();
});

worker.on('error', (err, msg) => {
    console.log('Error', err, msg);
});

worker.start();
console.log('Worker started...');

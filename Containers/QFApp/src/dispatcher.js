const RSMQPromise = require('rsmq-promise-native');
const rsmq = new RSMQPromise({host: process.env.REDIS_HOST });
const RSMQWorker = require('rsmq-worker');
var textManager = require('./textmanager');

const SEARCHQUEUE = 'searchJob';
const DEFAULTTIMEOUT = 20000;
var TIMEOUT = DEFAULTTIMEOUT;

function initialise() {
    if (!process.env.REDIS_HOST) {
        console.log('WARNING: the environment variable REDIS_HOST is not set');
    }

    if (process.env.TIMEOUT) {
        TIMEOUT = 1000 * process.env.TIMEOUT;
    }
    
    return createQueue(SEARCHQUEUE);
};

module.exports.initialise = initialise;


function createQueue(queueName) {
    return rsmq.deleteQueue({qname: queueName})
        .catch(err => {} )
        .then( () => rsmq.createQueue({qname: queueName}))
        .then(done => console.log('Created Message Queue', queueName))
        .catch(err => console.log(err));    
}

function startListeners(queueName, socket) {
    console.log('Listening for results on message queue', queueName);
    let worker = new RSMQWorker(queueName, {host: process.env.REDIS_HOST });
    worker.on('message', (msg, next, id) => {
        console.log('Response on queue', queueName, id, msg);
        socket.emit('answer', msg);
        next();
    });

    worker.start();
    setTimeout( () => { cleanup(queueName, socket, worker, 'timeout'); }, TIMEOUT);
}

function cleanup(queueName, socket, worker, reason) {
    console.log('cleaning up for reason', reason);
    worker.quit();
    rsmq.deleteQueue({qname: queueName});
    socket.emit('done', {msg: reason} );                         
}



function formatJobs(searchString, texts, queueName) {
    let jobs = [];
    texts.forEach( j => jobs.push({searchString: searchString,
                                   textName: j,
                                   returnQueue: queueName}));
    return jobs;
}

function sendJobs(jobs) {
    // TODO as the number of texts/jobs grow, it will become painful to allocate memory for so many promises.
    let prom = [];
    jobs.forEach( j => prom.push(new Promise( () => {
        console.log('Creating message for job', j);
        rsmq.sendMessage( {qname: SEARCHQUEUE, message: JSON.stringify(j)} )
    })));
    return Promise.all(prom);
}


module.exports.dispatchSearch= (searchString, socket) => {
    console.log('Searching for : ' + searchString);

    // TODO
    // - List available texts
    // - Create returnQueue (use socket.id as name)
    // - Format Jobs (one for each text) {searchString: , textTitle:, returnQueue: socket.id}
    // - send jobs
    // - Wait for returnMessage
    //   - if returnMessage is "job started", increase workerCounter
    //   - if returnMessage is "result", output in socket.emit
    //   - if returnMessage is "job done", decrease workerCounter
    // - if (workerCounter==0 || timeout (TIMEOUT == 10s || process.env.TIMEOUT)) socket.emit("done", {maybe-some-stats})
    //   - …and close the returnQueue

    let texts = textManager.listTexts();
    let jobs = formatJobs(searchString, texts, socket.id);    
    return createQueue(socket.id)
        .then(() => startListeners(socket.id, socket))
        .then(() => sendJobs(jobs));
};

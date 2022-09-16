const fetch = require('node-fetch');
const DEFAULTTIMEOUT = 20;
const DEFAULTWORKER = "qfworkerv3"

// Dispatcher manages the job queues
// - Splits a search query into one job per text.
// - dispatch the jobs to the job queue so that workers might pick them up
// - wait for an answer
// - pass the answer on to the web client on the other end of the socket.
//
// For one particular job, there are a couple of message queues:
// - SearchJob :: This is where all jobs are announced
// - ReturnQueue :: Answers are returned to this queue. 
//                  One queue is created for each client, so I am
//                  using 'socket.id' for this queue.

class Dispatcher {
    constructor() {
        this.TIMEOUT = 1000 * (process.env.TIMEOUT || DEFAULTTIMEOUT);
        this.WORKER = process.env.WORKER || DEFAULTWORKER;
    }

    formatJobs(searchString, texts) {
        return texts.map( t => { return {searchString: searchString, textTitle: t};});
    }

    dispatchSearch(searchString, jobs, socket) {
        console.log('Searching for : ' + searchString);
        let baseurl = 'http://' + this.WORKER + ':3000';

        if (0 >= jobs.length) {
            socket.emit('done', {msg: 'no texts available' }); 
            return 'DONE'
        };        

        setTimeout( () => socket.emit('done', {msg: 'timeout'}), this.TIMEOUT);

        return Promise.all(jobs.map( j => {
            let title = j.textTitle.replaceAll(' ','+');
            let search = j.searchString.replaceAll(' ','+');
            let url = baseurl + '/' + title + '/' +search;
            console.log('Using url:', url);
            return fetch(url)
                .then(res => res.json())
                .then(res => res.forEach( t => socket.emit('answer', JSON.stringify(t))));
        }))
        .then( () => socket.emit('done', {msg: 'done'}));
    }

}

module.exports = Dispatcher;

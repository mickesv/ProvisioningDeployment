var mongoose = require('mongoose');
var dbServer = '127.0.0.1:27017';
const dbPort = '27017';
const dbName = 'textStore';
var Text = require('./textStore');

class TextManager {    
    constructor() {
        this._initialise();
    }

    populateTestText() {
        console.log('Adding a test entry to the database.');
        return new Text({name:'testText', startLine: 0, contents: 'test'})
            .save()
            .catch(err => console.log('Error while inserting test text:', err.message));
    }

    testSearch() {
        let testJob= {searchString: 'test', textName: 'testText', returnQueue: null, };        
        return this.startSearch(testJob, 5, (t) => t);
    }

    runSearch(job, batch, searchFun) {
        return Promise.resolve(batch)
        .then( batch => {
            let results = [];
            batch.forEach( doc => {
                results.push(searchFun(job.searchString, doc.contents));
            });

            return results;
        });
    }

    startSearch(job, threads, searchFun) {
        console.log('Starting search for', job.searchString);
        return Text.find({name: job.textName})
            .then(results => {
                let batches = Array.from(Array(threads), () => Array());
                let roundRobin = 0;
                results.forEach(doc => {
                    batches[roundRobin++].push(doc);
                    roundRobin %= threads;
                });            
                return batches;
            })
            .then( batches => batches.map( batch => Promise.resolve(batch).then( batch => this.runSearch(job, batch, searchFun) )) )        
            .then( batches => Promise.all(batches) );
    }

// TODO flatten results into a one-dimensional array; cull empty or seemingly empty strings.
    
    _initialise() {
        if (!process.env.TEXTSTORE_HOST) {
            console.log('WARNING: the environment variable TEXTSTORE_HOST is not set');        
        } else {
            dbServer = process.env.TEXTSTORE_HOST + ':' + dbPort;
        }

        let connection = `mongodb://${dbServer}/${dbName}`
        mongoose.connect(connection)
            .then( () => console.log('Connected to database', dbName))
            .catch( (err) => {
                console.error('Database connection error', dbName);
                console.error(' trying to connect to server:', connection);
            });
    }
}

module.exports = new TextManager();

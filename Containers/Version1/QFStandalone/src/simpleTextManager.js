var mongoose = require('mongoose');
var dbServer = '127.0.0.1:27017';
const dbPort = '27017';
const dbName = 'textStore';
var Text = require('./textStore');

const CHUNKSIZE = 1000; // number of lines per chunk

class SimpleTextManager {    
    constructor() {
    }

    connect() {
        if (!process.env.TEXTSTORE_HOST) {
            console.log('WARNING: the environment variable TEXTSTORE_HOST is not set');        
        } else {
            dbServer = process.env.TEXTSTORE_HOST + ':' + dbPort;
        }

        let connection = `mongodb://${dbServer}/${dbName}`
        return mongoose.connect(connection)
            .then( () => console.log('Connected to database', dbName))
            .catch( (err) => {
                console.error('Database connection error', dbName);
                console.error(' trying to connect to server:', connection);
                throw new Error('Failed to connect to database.');
            });
    }

    simpleSearch(searchString) {
        console.log("Searching for:", searchString);
        return Text.find({"contents": {"$regex": searchString,
                                       "$options": "i"}});
    }

    addText(title, contents) {
        contents = contents || '';
        console.log('Storing text to database');
        let lines = contents.split(/\n/);
        let firstLine = 0;
        let lastLine = firstLine + CHUNKSIZE;
        while (firstLine <= lines.length) {
            let chunk = lines.slice(firstLine, lastLine+1).join('\n');
            firstLine=lastLine+1;
            lastLine=firstLine + CHUNKSIZE;
            new Text({name: title, startLine: firstLine, contents: chunk})
                .save()
                .catch(err => console.log('Error while inserting test text:', err.message));
        }
    }
    
    listTexts() {
        console.log('Retrieving available text titles...');
        return Text.distinct('name');
    }
}

module.exports = SimpleTextManager;

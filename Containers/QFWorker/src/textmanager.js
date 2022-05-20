var mongoose = require('mongoose');
var dbServer = '127.0.0.1:27017';
const dbPort = '27017';
const dbName = 'textStore';

class TextManager {    
    constructor() {
        this._initialise();
    }

    startSearch(textName) {
        console.log('Starting search for', textName);
    }
    
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

const SearchStrategy = require('./searchStrategy');
const MAXDISTANCE=5;

class FuzzySentenceSearcher extends SearchStrategy {
    constructor() {
        super();
    }

    search(searchString, inputData, distance=MAXDISTANCE) {
        let results = [];
        let re = new RegExp(this._prepareString(searchString, distance), 'gi');    
        let match;
        while ((match = re.exec(inputData)) != null) {
            results.push(this._getSentenceAt(match['index'], re.lastIndex, inputData));
        }
        return results;
    }

    _prepareString(searchString, distance=MAXDISTANCE) {
        let strings = searchString.split(' ').map( s => s.trim().toLowerCase() ); // Future work: Add more complex cleanup of the words.
        let out = '\\b'
        let nearRE = '\\W+(?:\\w+\\W+){0,' + distance + '}?'
        out = strings.slice(0,-1).reduce( (out,s) => out+s+nearRE,out );
        out = out + strings.slice(-1) + '\\b';    
        return out;
    }

    _getSentenceAt(index, lastIndex, inputData) {
        let start = this._findSentenceBoundary(index,inputData, -1);
        let end = this._findSentenceBoundary(lastIndex,inputData, 1);
        return inputData.substring(start,end);
    }

    _findSentenceBoundary(index, inputData, direction) {
        let i=index;
        for (i = index; (i > 0 && i < inputData.length); i+=direction) {
            if (inputData[i].match(new RegExp('[.!?]')) ) {
                return i+1;
            }
        }
    }
}

module.exports = FuzzySentenceSearcher;

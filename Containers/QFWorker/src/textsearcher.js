
const MAXDISTANCE=5;

function prepareString(searchString, distance=MAXDISTANCE) {
    let strings = searchString.split(' ').map( s => s.trim().toLowerCase() ); // TODO Add more complex cleanup of the words.
    let out = '\\b'
    let nearRE = '\\W+(?:\\w+\\W+){0,' + distance + '}?'
    out = strings.slice(0,-1).reduce( (out,s) => out+s+nearRE,out );
    out = out + strings.slice(-1) + '\\b';    
    return out;
}

function findSentenceBoundary(index, inputData, direction) {
    for (i = index; (i > 0 && i < inputData.length); i+=direction) {
        if (inputData[i].match(new RegExp('[.!?]')) ) {
            return i+1;
        }
    }
}

function getSentenceAt(index, lastIndex, inputData) {
    let start = findSentenceBoundary(index,inputData, -1);
    let end = findSentenceBoundary(lastIndex,inputData, 1);
    return inputData.substring(start,end);
}

function findSentences(searchString, inputData, distance=MAXDISTANCE) {
    let results = [];
    let re = new RegExp(prepareString(searchString, distance), 'gi');    
    let match;
    while ((match = re.exec(inputData)) != null) {
        results.push(getSentenceAt(match['index'], re.lastIndex, inputData));
    }

    return results;
}


function testSearch() {
    let data = "“Well, Prince, so Genoa and Lucca are now just family estates of the Buonapartes. But I warn you, if you don’t tell me that this means war, if you still try to defend the infamies and horrors perpetrated by that Antichrist—I really believe he is Antichrist—I will have nothing more to do with you and you are no longer my friend, no longer my ‘faithful slave,’ as you call yourself! But how do you do? I see I have frightened you—sit down and tell me all the news.”\n\nIt was in July, 1805, and the speaker was the well-known Anna Pávlovna Schérer, maid of honor and favorite of the Empress Márya Fëdorovna. With these words she greeted Prince Vasíli Kurágin, a man of high rank and importance, who was the first to arrive at her reception. Anna Pávlovna had had a cough for some days. She was, as she said, suffering from la grippe; grippe being then a new word in St. Petersburg, used only by the elite.\n\nAll her invitations without exception, written in French, and delivered by a scarlet-liveried footman that morning, ran as follows:\n\n“If you have nothing better to do, Count (or Prince), and if the prospect of spending an evening with a poor invalid is not too terrible, I shall be very charmed to see you tonight between 7 and 10—Annette Schérer.”"

    let str = "prince"    

    console.log(findSentences(str, data));
}

module.exports.testSearch = testSearch;
module.exports.findSentences = findSentences;

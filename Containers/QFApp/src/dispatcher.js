
module.exports.dispatchSearch= (searchString, socket) => {
    console.log('Searching for : ' + searchString);

    // For now, something dummy just to provide a staggered response
    var responses = [];    
    for (i =0; i < 10; i++) {
        let ans = 'Responsepart ' + i;        
        responses.push(delayRespond(socket, ans, i*1000))
    }
    Promise.all(responses)
        .then( () => { socket.emit('done', {}); });
};

function delayRespond(socket, ans, delay) {
    return new Promise( (res, rej) => {
        setTimeout(res, delay);
    })
        .then( () => { socket.emit('answer', ans); } );
}

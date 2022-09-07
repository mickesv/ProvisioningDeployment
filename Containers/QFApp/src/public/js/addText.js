
//$(function(){
    const socket= io();

    function addText() {
        title = $('#texttitle').val();
        url = $('#texturl').val();
        console.log('Add button clicked, data:', title, url);
        $('#Status').html('<i class="fas fa-spinner fa-spin fa-2x"></i>');
        console.log('adding text ', title);
        socket.emit('addText', {title:title, url:url});
        $('#Results').html('<p>');
    }
    
    socket.on('textAdded', msg => {
        console.log('Text added', msg);
        $('#Status').html('');
        $('#Results').append('Text added to Database. Title: <i>' + msg + '</i></p>');
    });

   socket.on('abort', msg => {
       console.log('Received abort, msg');
        $('#Status').html('');       
   });

    socket.on('clientConnect', msg => {
        console.log('Connected to server: ', msg)
    });
//});



$(function(){
    const socket= io();

    $('#search').on('focus', function(e) {
        $(this).val('');
    });
    
    $('#search').on('keyup', function(e) {
        if(e.keyCode === 13) {
            var params = {search: $(this).val() };
            $('#SearchStatus').html('<i class="fas fa-spinner fa-spin fa-2x"></i>');
            console.log('searching for ', params);
            socket.emit('search', params);
            $('#Results').html('<ul>\n');            
        }});

    socket.on('answer', msg => {
        console.log('Receiving partial answer', msg);
        $('#Results').append('<li>' + msg + '\n');
    });

    socket.on('done', () => {
        console.log('All parts received');
        $('#SearchStatus').html('');
        $('#Results').append('</ul>\n');
    });

    socket.on('clientConnect', msg => {
        console.log('Connected to server: ', msg)
    });
});

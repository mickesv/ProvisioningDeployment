
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
        parsed = JSON.parse(msg);
        $('#Results').append('<li><b>' + parsed.textTitle + '</b> ' + parsed.contents + '\n');
    });

    socket.on('done', () => {
        console.log('All parts received');
        $('#SearchStatus').html('');
        $('#Results').append('</ul>\n');
        $('#WorkerHeading').html('');
        $('#WorkerCount').html('');
    });

    socket.on('addWorker', () => {
        updateWorkers(+1);
    });

    socket.on('removeWorker', () => {
        updateWorkers(-1);
    });

    socket.on('clientConnect', msg => {
        console.log('Connected to server: ', msg)
    });

    function updateWorkers(direction) {
        var workers = parseInt($('#WorkerCount').html());
        if (isNaN(workers)) {
            workers = 1;
        } else {
            workers = workers + direction;
        }
        console.log('Updating number of workers to', workers);

        if (workers >= 0) {
            $('#WorkerHeading').html('Number of Workers: ');
            $('#WorkerCount').html(workers);
        } else {
            $('#WorkerHeading').html('');
            $('#WorkerCount').html('');
        }        
    }
});

const io = require('socket.io')(3001, {
    cors: {
        origin:[
            'http://localhost:8080'
        ]
    }
})

io.on('connection',socket=>{
    console.log(socket.id);

    /* (1)
    socket.on('custom-event', (num, str, obj)=>{
        console.log(num, str, obj);
    });
    //  */

    socket.on('send-message', (message)=>{
        // io.emit('receive-message', message); // >> send all
        socket.broadcast.emit('receive-message', message); // >> send all except me

        // console.log(message);
    });
})
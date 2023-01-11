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

    socket.on('send-message', (message, room)=>{
        // io.emit('receive-message', message); // >> send all
        if (room === '') {
            socket.broadcast.emit('receive-message', message); // >> send all except me
        } else {
            socket.to(room).emit('receive-message', message); // if room value === socket.id >> send private message 
        }

        // console.log(message);
    });

    socket.on('join-room', (room, callbackFn)=>{
        socket.join(room);
        callbackFn(`Joined ${room}`);
    })
})
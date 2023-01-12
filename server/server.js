/* tutorial code - 1 
const {instrument} = require("@socket.io/admin-ui")

const io = require('socket.io')(3000, {
    cors: {
        origin:[
            'http://localhost:8080',
            'https://admin.socket.io'
        ]
    }
})
// */

// /* @socket.io/admin-ui 제공 code 
// https://github.com/socketio/socket.io-admin-ui/#how-to-use
const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: [
        "http://localhost:8080",
        "https://admin.socket.io"
    ],
    credentials: true
  }
});

httpServer.listen(3000); // https://admin.socket.io 필수 설정 
// */

const userIo = io.of('/user')
userIo.on('connection', socket => {
    console.log('connected to user namespace');
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

// /* https://admin.socket.io >> 상태확인 
instrument(io, {
    auth: false
  });
// */ 
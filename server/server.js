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

const rooms = new Map();
/* 예상 구조
{
    room1:{
        id-user1:{
            name: name-user1,
            x: 1.1234,
            y: 2.1234
        },
        id-user2:{
            name: name-user2,
            x: 1.1234,
            y: 2.1234
        }
    },
    room2:{
        id-user3:{
            name: name-user3,
            x: 1.1234,
            y: 2.1234
        },
        id-user4:{
            name: name-user4,
            x: 1.1234,
            y: 2.1234
        }
    },
}
 */ 

/* namespace : /user
const userIo = io.of('/user')
userIo.on('connection', (socket) => {
    console.log('connected to user namespace with userid '+socket.id);
})

userIo.use((socket,next)=>{
    if(socket.handshake.auth.token){
        const userInfo = getUserInfoFromToken(socket.handshake.auth.token)
        socket.userId = userInfo.id
        socket.userName = userInfo.name
        next()
    }else{
        // next(new Error('please send token'))
        // (5) 0 <= random <= 99
        const rand_0_99 = Math.floor(Math.random() * 100);
        socket.userId = `newUserID-${rand_0_99}`;
        socket.userName = `newUserName-${rand_0_99}`;;
    }
})
// */

function getUserInfoFromToken(token) {
    // access DB and check token if you need  
    return {id: `id-${token}`, name: `name-${token}`};
}

io.use((socket,next)=>{
    const rand_0_99 = Math.floor(Math.random() * 100);
    let userId = `newUserID-${rand_0_99}`;
    let userName = `newUserName-${rand_0_99}`;
    let isConnected = true;

    if(socket.handshake.auth.token){
        const userInfo = getUserInfoFromToken(socket.handshake.auth.token)
        userId = userInfo.id
        userName = userInfo.name
        // 사용자 정보 계속 추가
    }

    socket.userId = userId;
    socket.userName = userName;
    socket.isConnected = isConnected;

    next()
})

io.of("/").adapter.on("join-room", (room, id) => {
    if(room===id) return;
    // console.log(`socket ${id} has joined room ${room}`);
});

io.on('connection',socket=>{
    // console.log(socket.id);
    // console.log(socket.userId, socket.userName, socket.isConnected, socket.rooms);

    // 접속한 userId 확인하기
    // 접속한 userId로 접속한 기록이 있는지 확인하기
    // userId가 어느 방에 있었는지 확인하여 그 방에 넣어 주기
    sendMassegeToClient(socket, `${socket.userName} connected`,'');

    /* (1)
    socket.on('custom-event', (num, str, obj)=>{
        console.log(num, str, obj);
    });
    //  */

    socket.on('send-message', (message, room)=>{
        sendMassegeToClient(socket, `${socket.userName} : ${message}`, room);
    });

    socket.on('join-room', (room, callbackFn)=>{
        const userId = socket.userId;
        addUserToRoom(socket, room, userId);

        socket.join(room);
        
        callbackFn(`Joined ${room}`);
    });

    socket.on('ping', n=>{
        console.log(socket.userName, n)
    })

    socket.on('disconnect', () => {
        const userId = socket.userId;

        console.log(`${userId} try to disconnect.`);
        sendMassegeToClient(socket, `${socket.userName} disconnected`, '');

        /* 방정보가 바뀌면 접속해제 설정이 안되는 헛점
        const room = socket.room;
        if (rooms.has(room) && rooms.get(room).has(userId)) {
            rooms.get(room).get(userId).set('isConnected', false); // 접속해제 설정
        }
        // */
        userDisconnect(userId);

        // 접속해제 되자마자 rooms 리스트에서 삭제되는 현상 보완
        // (예시)>> 접속해제되면, 카운터 실행 >> 3초 후 rooms 리스트 삭제 
        const milisecondTimeout = 3000;
        setTimeout(() => {
            if (isConnected(userId)) return;// 3초 안에 다시 접속하면 disconnect 안함.
            rooms.forEach((users,roomId,map)=>{
                rooms.get(roomId).delete(userId);
            })

            console.log(`(after 3 sec) ${userId} data deleted. (logout)`);
            console.log(`after ${userId} disconnected `, rooms);
        }, milisecondTimeout);
    });
})

/** 해당 사용자의 connected 상태를 확인함 */
function isConnected(userId){
    let isConnected = false;
    rooms.forEach((users,roomId,map)=>{
        users.forEach((_userInfo,_userId,_map) => {
            if(!_userInfo.has('isConnected')) return;
            if(userId !== _userId) return;
            isConnected = _userInfo.get('isConnected');
        });
    })
    console.log(`${userId} is ${isConnected? 'connedted yet.':'disconnected aleady.'}`);
    return isConnected;
}

/** 해당 사용자의 상태를 disconnect 시킴 */
function userDisconnect(userId){
    rooms.forEach((users,roomId,map)=>{
        users.forEach((_userInfo,_userId,_map) => {
            if(userId !== _userId) return;
            _userInfo.set('isConnected', false);
            return;
        });
    })
}

function addUserToRoom(socket, room, userId) {
    if(!room) {
        console.log(`room = ${room}; >>  return;`);
        return;
    }
    // 소켓의 rooms에서 socket.id 기준으로 제거
    socket.rooms.forEach(r => {
        // 본인의 아이디로 된 room은 제외
        if (socket.id !== r) { 
            socket.leave(r);
        }
    });

    // 관리중인 데이터 rooms에서 userId 기준으로 제거
    // /* 모두 찾아서 제거 (비효율?)
    rooms.forEach((users,roomId,map)=>{
        rooms.get(roomId).delete(userId);
    })
    // */

    if (!rooms.has(room)) {
        const users = new Map();
        rooms.set(room, users);
    }

    const usersInRoom = rooms.get(room);
    if(!usersInRoom.has(userId)){
        const userInfo = new Map();
        userInfo.set('userName', socket.userName);
        userInfo.set('isConnected', socket.isConnected);
        usersInRoom.set(userId, userInfo);
    }

    sendMassegeToClient(socket, `${socket.userName} joined ${room}`, room);
    console.log(rooms); 
}

/** 나 제외 모든 사용자에게 메시지를 보낸다. */
function sendMassegeToClient (socket, message, room, isBroadcast = true){
    // io.emit('receive-message', message); // >> send all
    if (room === '') {
        socket.broadcast.emit('receive-message', message); // >> send all except me
    } else {
        socket.to(room).emit('receive-message', message); // if room value === socket.id >> send private message 
    }
    // console.log(message);
}

// /* https://admin.socket.io >> 상태확인 
instrument(io, {
    auth: false
  });
// */ 
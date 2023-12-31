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

const express = require('express');
const cors = require('cors');
const app = express();

const httpServer = createServer(app);

// CORS 설정
app.use(cors());
// Sample route
app.get('/', (req, res) => {
    res.send('<h1>Socket.io Server is running</h1>');
});

const io = new Server(httpServer, {
  cors: {
    origin: [
        "http://localhost:8080",
        "https://admin.socket.io",
        "https://socketio-client-ks.onrender.com/"
    ],
    credentials: true
  }
});

// httpServer.listen(3000); // https://admin.socket.io 필수 설정 

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); // https://admin.socket.io 필수 설정 
// */

const users = new Map();
/* 데이터 구조
user-Map(userid-string, userInfo-Map(key-str, value-str))
 */

const rooms = new Map();
/* 데이터 구조
room-Map(roomid-string, user-Map(userid, userInfo-Map(key-str,value-str)))

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

io.use((socket,next)=>{
    const rand_0_99 = Math.floor(Math.random() * 100);
    let userId = `newUserID-${rand_0_99}`;
    let userName = `No UserName-${rand_0_99}`;
    let isConnected = true;

    if(socket.handshake.auth.token){
        const userInfoDB = getUserInfoFromToken(socket.handshake.auth.token)
        userId = userInfoDB.id
        userName = userInfoDB.name
        // 사용자 정보 계속 추가
    }
    
    socket.userId = userId;
    socket.userName = userName;
    socket.isConnected = isConnected;

    const userInfo = new Map();
    // userInfo.set('id', userId);
    userInfo.set('name', userName);
    userInfo.set('isConnected', true);

    if(users.has(userId)) users.delete(userId);

    users.set(userId, userInfo);

    next()
})

io.on('connection',socket=>{
    sendMassegeToClient(socket, `${socket.userName} connected ${socket.id}`,'toAll');
    dataListCheck();

    /* (1)
    socket.on('custom-event', (num, str, obj)=>{
        console.log(num, str, obj);
    });
    //  */

    socket.on('send-message', (message, room)=>{
        sendMassegeToClient(socket, `${socket.userName} : ${message}`, room||'toAll');
    });

    socket.on('send-xy', (xy, roomId, callbackFn)=>{
        const userId = socket.userId;
        const x = xy.x;
        const y = xy.y;
        // console.log(xy,roomId);

        // room이 없거나, 사용자가 없으면 로직 중단
        if (!rooms.has(roomId)) return;
        if (!rooms.get(roomId).has(userId)) return;
        
        // socket.userId >> 기준으로 해당 사용자의 x,y 좌표를 업데이트한다.
        const targetUserInfo = rooms.get(roomId).get(userId);
        targetUserInfo.set('x', x);
        targetUserInfo.set('y', y);
        // room의 사용자들에게 전파한다.

        const userList = userListInRoom(roomId);
        sendUserLocationToClient(socket, roomId, userList);

        callbackFn(userList);
    })

    socket.on('join-room', (roomId, callbackFn)=>{
        const userId = socket.userId;
        const ex_room = roomId? 
            addUserToRoom(socket, roomId, userId) : removeUserInAllRoom(socket, userId);
        if (!roomId) {
            callbackFn(`You leave all rooms ${roomId}`, ex_room, {});
            return;
        }

        socket.join(roomId);
        callbackFn(`You joined ${roomId}`, ex_room, userListInRoom(roomId));
    });

    socket.on('leave-room-message', (ex_room, callbackFn)=>{
        sendMassegeToClient(socket, `${socket.userName} leaved ${ex_room}`, ex_room);
        sendUserListToClient(socket, ex_room);
        callbackFn(ex_room?`Leaved ${ex_room}`:'');
    });

    socket.on('disconnect', () => {
        const userId = socket.userId;

        // console.log(`${userId} try to disconnect.`);
        sendMassegeToClient(socket, `${socket.userName} disconnected`, 'toAll');

        
        // 접속해제 되자마자 rooms 리스트에서 삭제되는 현상 보완
        // disconnect >> 자리비움 / leave >> 모든 방에서 나가기
        userDisconnect(userId); // 접속해제 시킴
        
        sendUserListToClient(socket, socket.room);
        
        // (예시)>> 접속해제되면, 카운터 실행 >> 30초 후 rooms 리스트 삭제 
        const milisecondTimeout = 30000;
        setTimeout(() => {
         if (isConnected(userId)) return;// milisecondTimeout 안에 다시 접속하면 disconnect 안함.
            const ex_room =removeUserInAllRoom(socket, userId);
            sendUserListToClient(socket, ex_room);
            // sendUserLocationToClient(socket, ex_room);

            console.log(`(after ${milisecondTimeout/1000} sec) ${userId} data deleted from room.`);

            dataListCheck();
        }, milisecondTimeout);
    });
})

/** DB에서 사용자 정보 가져오기 */
function getUserInfoFromToken(token) {
    // access DB and check token if you need  
    return {id: `id-${token}`, name: `name-${token}`};
}

/** 해당 사용자의 connected 상태를 확인함 */
function isConnected(userId){
    let checked = false;
    let isConnected = false;
    rooms.forEach((_users,_roomId,_room_map)=>{
        _users.forEach((_userInfo,_userId,_user_map) => {
            if(userId !== _userId) return;
            if(!_userInfo.has('isConnected')) return;
            isConnected = _userInfo.get('isConnected'); 
            checked = true; 
            return;
        });
        if(checked) return;
    })
    console.log(`${userId} is ${isConnected? 'connedted yet.':'disconnected aleady.'}`);
    return isConnected;
}

/** 해당 사용자의 상태를 disconnect 시킴 */
function userDisconnect(userId){
    let checked = false;
    rooms.forEach((_users,_roomId,_room_map)=>{
        _users.forEach((_userInfo,_userId,_user_map) => {
            if(userId !== _userId) return;
            _userInfo.set('isConnected', false);
            checked = true;
            return;
        });
        if(checked) return;
    })
}

/** userId 기준으로 room 리스트에서 userId를 삭제한다. */
function removeUserInAllRoom(socket, userId){
    // 이전 room 정보 확인
    let ex_room = '';

    // 관리중인 데이터 rooms에서 userId 기준으로 제거
    rooms.forEach((_users,_roomId,_map)=>{
        const roomUserList = rooms.get(_roomId);
        if (roomUserList.has(userId)) {
            roomUserList.delete(userId);
            ex_room = _roomId;
            return;
        }
    })

    // 소켓의 실제 rooms에서 socket.id 기준으로 제거
    socket.rooms.forEach(_room => {
        // 본인의 아이디로 된 room은 제외
        if (socket.id !== _room) { 
            socket.leave(_room);
        }
    });

    return ex_room;
}

/** 사용자를 특정룸에 join하고, rooms Map 데이터를 업데이트 한다. (+DB작업)*/
function addUserToRoom(socket, room, userId) {

    // 이전 room 정보 확인
    let ex_room = '';

    if(!room) {
        console.log(`room = ${room}; >>  return;`);
        return ex_room;
    }

    ex_room = removeUserInAllRoom(socket, userId);


    if (!rooms.has(room)) {
        const users = new Map();
        rooms.set(room, users);
    }

    const usersInRoom = rooms.get(room);
    if(!usersInRoom.has(userId)){
        // const userInfo = new Map();
        // userInfo.set('userName', socket.userName);
        // userInfo.set('isConnected', socket.isConnected);
        // console.log(users.get(userId));
        const userInfo = users.get(userId);
        userInfo.set('room', room);
        usersInRoom.set(userId, userInfo);
        socket.room = room;
    }

    sendUserListToClient(socket, room);

    sendMassegeToClient(socket, `${socket.userName} joined ${room}`, room);

    dataListCheck();

    return ex_room;
}

/** 나 제외 모든 사용자에게 메시지를 보낸다. */
function sendMassegeToClient (socket, message, room, isBroadcast = true){
    // io.emit('receive-message', message); // >> send all
    if (room === 'toAll') {
        socket.broadcast.emit('receive-message', `${message} (TO ALL)`); // >> send all except me
    } else {
        socket.to(room).emit('receive-message', `${message} (TO ${room})`); // if room value === socket.id >> send private message 
    }
    // console.log(message);
}

/** 나 제외 해당 방의 사용자에게 그 방의 사용자 리스트를 보내 준다. */
function sendUserListToClient (socket, roomId){
    socket.to(roomId).emit('receive-userlist', userListInRoom(roomId)); // if room value === socket.id >> send private message 
}

/** 나 제외 해당 방의 사용자에게 그 방의 사용자 위치정보를 보내 준다. */
function sendUserLocationToClient (socket, roomId, userList){
    socket.to(roomId).emit('receive-userlocation', userList); // if room value === socket.id >> send private message 
}

function userListInRoom(room){
    // console.log(rooms.get(room));
    const usersInRoom = rooms.get(room);
    let returnObj = {};
    if (!usersInRoom) {
        return returnObj;
    }

    usersInRoom.forEach((_user,_userId,_map) => {
        returnObj[_userId] = Object.fromEntries(_user)
    })
    // const obj = Object.fromEntries(rooms.get(room))
    // console.log(returnObj);
    // console.log(room, obj);
    // console.log(socket.id);
    return returnObj;
}

function dataListCheck(){

    console.log('rooms',rooms);
    // console.log('users',users);
}



// /* https://admin.socket.io >> 상태확인 
instrument(io, {
    auth: false
  });
// */ 
var qs = getQueryStringObject();
var token = qs.token; 
var initRoomName = qs.room;

// console.log(initRoomName);

// var socket = io('http://localhost:3000');
var socket = io('http://localhost:3000', {auth:{token:token}});

/* namespace : /user
// var userSocket = io('http://localhost:3000/user'); // no token 
var userSocket = io('http://localhost:3000/user', {auth:{token:token}}); // with token 

userSocket.on('connect', ()=>{
  // displayMessage(`userSocket name: ${socket.userName}`)
  console.log(userSocket);
})

userSocket.on('connect_error', (error) => {
  displayMessage(error)
})
// */

socket.on('connect', () => {
  displayMessage(`You connected with id: ${socket.id}`)
  setTimeout(() => {
    const initRoomName = roomInput.value;
    if(initRoomName){
      socketEmitJoinRoom(initRoomName);
    }
  }, 1000);
});

socket.on('disconnect', () => {
  displayMessage(`You disconnected`)
});

/* (1)
socket.emit('custom-event', 10, 'Hi', {a:'a'});
//  */

socket.on('receive-message', (message) => {
  displayMessage(message);
})

socket.on('receive-userlist', _userList=>{
  // console.log(_userList);
  displayUserListInTheRoom(_userList, userList);
})

var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

var roomInput = document.getElementById("room-input");
var joinRoomButton = document.getElementById("room-button");
/* 
  <ui id="user-list"></ui>
  <input id="token-input" type="text"/>
  <button id="connect-button">connect</button>
  <button id="disconnect-button">disconnect</button>
  <button id="room-join-a-button">A</button>
  <button id="room-join-b-button">B</button>
  <button id="room-join-c-button">C</button>
  */
var userList = document.getElementById("user-list");
var tokenInput = document.getElementById("token-input");
tokenInput.value = token || '';

var connectButton = document.getElementById("connect-button");
var disconnectButton = document.getElementById("disconnect-button");
var joinRoomAButton = document.getElementById("room-join-a-button");
var joinRoomBButton = document.getElementById("room-join-b-button");
var joinRoomCButton = document.getElementById("room-join-c-button");

disconnectButton.addEventListener('click', e=>{
  e.preventDefault();

  if(!socket.connected) return;
  socket.disconnect();
})

connectButton.addEventListener('click', e=>{
  e.preventDefault();

  if(socket.connected) return;
  const newtoken = tokenInput.value;
  // if (!newtoken) {
  //   return;
  // }

  // 기존 접속 해제
  // socket.disconnect();
  // 토큰을 가지고 명시적으로 접속
  // if(!socket.auth.token){
  //   socket.auth.token = newtoken;
  // }

  socket.auth.token = newtoken || undefined;
  socket.connect();
})

// 메시지 보내기
form.addEventListener('submit', function (e) {
  e.preventDefault();

  const message = input.value;
  const room = roomInput.value;

  if (message === "") return
  displayMessage(message);

  // You connected with id: zuwQG7Pg9GpBQasSAAAJ << socket.id 
  socket.emit('send-message', message, room); // add room value / if room value === socket.id >> send private message 

  input.value = "";
});

joinRoomButton.addEventListener("click", joinRoomEventHander);
joinRoomAButton.addEventListener("click", joinRoomEventHander);
joinRoomBButton.addEventListener("click", joinRoomEventHander);
joinRoomCButton.addEventListener("click", joinRoomEventHander);

// connectButton.addEventListener('click', () => {
//   const token = tokenInput.value;
//   if (token === '') {
//     return;
//   }
//   // userSocket.disconnect();
//   // userSocket = io('http://localhost:3000/user', { auth: { token: token } });
// })

// c : connect / d : disconnect

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input')) {
    return;
  }
  if (e.key === 'c') {
    if(socket.connected) return;
    socket.connect();
  }
  if (e.key === 'd') {
    if(!socket.connected) return;
    socket.disconnect();
  }
});




let count = 0;
setInterval(() => {
  // volatile : 진행시간 계속 유지
  // socket.volatile.emit('ping', ++count)
  // socket.emit('ping', ++count)
}, 1000);



// setTimeout(() => {
  if(initRoomName){

    roomInput.value = initRoomName;
//     socketEmitJoinRoom(initRoomName);
  }
// }, 1000);





function getQueryStringObject() {
  var a = window.location.search.substring(1).split('&');
  if (a == "") return {};
  var b = {};
  for (var i = 0; i < a.length; ++i) {
      var p = a[i].split('=', 2);
      if (p.length == 1)
          b[p[0]] = "";
      else
          b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
  }
  return b;
}

function displayMessage(message) {
  const ul = messages;
  
  var item = document.createElement('li');
  item.textContent = message;
  ul.appendChild(item);
  // window.scrollTo(0, document.body.scrollHeight);
  ul.scrollTo(0,ul.scrollHeight);
}

function joinRoomEventHander(e) {
  e.preventDefault();
  // console.log(e.target.id);
  let room = '';

  switch (e.target.id) {
    case 'room-button':
      room = roomInput.value;
      if(!room) {
        console.log('room is blank');
        return;
      }
      break;
      
    case 'room-join-a-button':
      room = 'roomA';
      break;
    case 'room-join-b-button':
      room = 'roomB';
      break;
    case 'room-join-c-button':
      room = 'roomC';
      break;
      default:
      return;
  }

  roomInput.value = room;
  socketEmitJoinRoom(room);
}

function socketEmitJoinRoom(current_room) {
  // console.log(current_room);
  if(!socket.connected) {
    displayMessage('You are disconnected !!')
    return;
  }
  socket.emit('join-room', current_room, (message, ex_room, _userList) => {
    displayMessage(message);
    // console.log(_userList);
    displayUserListInTheRoom(_userList, userList);

    if (!ex_room || current_room === ex_room) {
      return;
    }

    socket.emit('leave-room-message', ex_room, (message)=>{
      if(message) displayMessage(message);
    })
  });
}

/** userList Object를 표시 */
function displayUserListInTheRoom(_userList){
  const ul = userList;

  while (ul && ul.firstChild) {
    // console.log(ul.firstChild);
    ul.removeChild(ul.firstChild);
  }

  for (const id in _userList) {
    if (Object.hasOwnProperty.call(_userList, id)) { 
      // const element = obj[id]['name'];
      // console.log(element);
      // console.log(id);
      // console.log('id.isConnected', obj[id]['isConnected']);
      
      const isConnected = _userList[id]['isConnected'];
      var item = document.createElement('li');
      item.textContent = id.concat(isConnected?'':' (자리비움)');
      if(ul) ul.appendChild(item);
    }
  }

  if(ul) ul.scrollTo(0,ul.scrollHeight);
}

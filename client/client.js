var socket = io('http://localhost:3000');
var userSocket = io('http://localhost:3000/user'); // no token 
// var userSocket = io('http://localhost:3000/user', {auth:{token:'TestToken'}}); // with token 

userSocket.on('connect_error', (error) => {
  displayMessage(error)
})

socket.on('connect', () => {
  displayMessage(`You connected with id: ${socket.id}`)
});

/* (1)
socket.emit('custom-event', 10, 'Hi', {a:'a'});
//  */

socket.on('receive-message', (message) => {
  displayMessage(message);
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
var connectButton = document.getElementById("connect-button");
var disconnectButton = document.getElementById("disconnect-button");
var joinRoomAButton = document.getElementById("room-join-a-button");
var joinRoomBButton = document.getElementById("room-join-b-button");
var joinRoomCButton = document.getElementById("room-join-c-button");

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

function socketEmitJoinRoom(room) {
  console.log(room);
  socket.emit('join-room', room, (message) => {
    displayMessage(message);
  });
}

joinRoomButton.addEventListener("click", () => {
  const room = roomInput.value;
  socketEmitJoinRoom(room);
});

function displayMessage(message) {
  var item = document.createElement('li');
  item.textContent = message;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}

connectButton.addEventListener('click', () => {
  const token = tokenInput.value;
  if (token === '') {
    return;
  }

  userSocket = io('http://localhost:3000/user', { auth: { token: token } });
})

// c : connect / d : disconnect
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input')) {
    return;
  }
  if (e.key === 'c') {
    socket.connect();
  }
  if (e.key === 'd') {
    socket.disconnect();
  }
});

let count = 0;
setInterval(() => {
  // volatile : 진행시간 계속 유지
  // socket.volatile.emit('ping', ++count)
}, 1000);
var qs = getQueryStringObject();
var token = qs.token; 
var initRoomName = qs.room;

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







/* socket io 이벤트 리스너 등록 */
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
  removeAllUsersInList();
});

socket.on('receive-message', (message) => {
  displayMessage(message);
})

socket.on('receive-userlist', _userList=>{
  // console.log(_userList);
  displayUserListInTheRoom(_userList, userList);
})

socket.on('receive-userlocation', _userList=>{
  // console.log(_userList);
  displayUserLocationInTheRoom(_userList);
})


/* (1)
socket.emit('custom-event', 10, 'Hi', {a:'a'});
//  */







/* 화면요소 + 이벤트 핸들러 */
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

var roomInput = document.getElementById("room-input");
roomInput.value = initRoomName||'';

var joinRoomButton = document.getElementById("room-button");

var userLocationTextArea = document.getElementById("location");
var userList = document.getElementById("user-list");
var tokenInput = document.getElementById("token-input");
tokenInput.value = token || '';

var connectButton = document.getElementById("connect-button");
var disconnectButton = document.getElementById("disconnect-button");
var joinRoomAButton = document.getElementById("room-join-a-button");
var joinRoomBButton = document.getElementById("room-join-b-button");
var joinRoomCButton = document.getElementById("room-join-c-button");
var leaveRoomButton = document.getElementById("room-leave-button");
var leaveOffButton = document.getElementById("leave-button");

connectButton.addEventListener('click', e=>{
  e.preventDefault();

  if(socket.connected) return;
  const newtoken = tokenInput.value;

  socket.auth.token = newtoken || undefined;
  socket.connect();
})

disconnectButton.addEventListener('click', e=>{
  e.preventDefault();

  if(!socket.connected) return;
  socket.disconnect();
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
leaveRoomButton.addEventListener("click", joinRoomEventHander);
leaveOffButton.addEventListener("click", joinRoomEventHander);

function joinRoomEventHander(e) {
  e.preventDefault();
  // console.log(e.target.id);
  let room = '';
  let isOff = false;

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
    case 'room-leave-button':
      room = '';
      break;
    case 'leave-button':
      room = '';
      isOff = true;
      break;
    default:
      return;
  }

  roomInput.value = room;
  socketEmitJoinRoom(room, isOff);

}

function mousemove(event){
  /* 의도 : mousemove 이벤트시 1초마다 위치값 보내기 >> 오작동
  let count = 0;
  setInterval(() => {
    console.log("pageX: ",event.pageX, 
    "pageY: ", event.pageY, 
    "clientX: ", event.clientX, 
    "clientY:", event.clientY)
  }, 1000);
  */

  const xy = {x: event.clientX, y: event.clientY};
  const room = roomInput.value;

  // console.log(xy);
  if (xy.x === 0 && xy.y === 0) {
    return; // 채팅시 x,y 좌표 0,0 현상 방지
  }
  socket.emit('send-xy', xy, room, (userLocation)=>{
    // userLocation = {userId: {x:user.x, y:user.y}} 
    // console.log(userLocation);
    displayUserLocationInTheRoom(userLocation);
  });
}

// window.addEventListener('mousemove', mousemove);
window.addEventListener('click', mousemove);











  
  
  
  
  
/* 함수 선언 */
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

function socketEmitJoinRoom(room, isOff = false) {
  // console.log(current_room);
  if(!socket.connected) {
    displayMessage('You are disconnected !!')
    return;
  }
  socket.emit('join-room', room, (message, ex_room, _userList) => {
    displayMessage(message);
    // console.log(_userList);
    displayUserListInTheRoom(_userList, userList);

    if (!ex_room || room === ex_room) {
      return;
    }

    socket.emit('leave-room-message', ex_room, (message)=>{
      if(message) displayMessage(message);
    })

    if (isOff) socket.disconnect();
  });
}

/** userList Object를 표시 */
function displayUserListInTheRoom(_userList){

  const ul = removeAllUsersInList();

  for (const id in _userList) {
    if (Object.hasOwnProperty.call(_userList, id)) { 
      // const element = obj[id]['name'];
      // console.log(element);
      // console.log(id);
      // console.log('id.isConnected', obj[id]['isConnected']);
      
      const isConnected = _userList[id]['isConnected'];
      const name = _userList[id]['name'];
      var item = document.createElement('li');
      item.textContent = name.concat(isConnected?'':' (자리비움)');
      if(ul) ul.appendChild(item);
    }
  }

  if(ul) ul.scrollTo(0,ul.scrollHeight);
}

/** userLocation Object를 표시 */
function displayUserLocationInTheRoom(_userList){

  const textBox = userLocationTextArea;

  textBox.value = '';
  let userLocation = {};

  for (const id in _userList) {
    if (Object.hasOwnProperty.call(_userList, id)) { 
      
      const x = _userList[id]['x']||0;
      const y = _userList[id]['y']||0;
      userLocation[id] = {x,y};
    }
  }

  textBox.value = JSON.stringify(userLocation);
}

function removeAllUsersInList(){
  const ul = userList;

  while (ul && ul.firstChild) {
    // console.log(ul.firstChild);
    ul.removeChild(ul.firstChild);
  }

  return ul;
}

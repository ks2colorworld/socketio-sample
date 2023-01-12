// 참조 사이트 : https://chat.openai.com/chat
const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const characters = new Map();

io.on('connection', socket => {
  console.log('A user connected');
  socket.on('update-position', (position) => {
      characters.set(socket.id, position);
      io.emit('update-position', characters);
  });
  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    characters.delete(socket.id);
    io.emit('update-position', characters);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server listening on port ${port}`));

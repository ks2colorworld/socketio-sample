# socket.io example tutorial  

https://socket.io/get-started/chat  

```
cd _origin_tutorial
npm i
node index.js
```

```
pm2 start index.js --watch
```

# (Main sample) add other feature 

- 참고자료 : https://youtu.be/ZKEqqIO7n-k

## http://localhost:3000
```
cd server
npm i
npm run dev
```

## http://localhost:8080 (소스 변경시 브라우저 자동 새로고침)

### 클라이언트 소스는 client.js 소스만 참고할 것 
```
cd client
npm i
npm run dev
```
- test url sample 
```
http://localhost:8080/
http://localhost:8080/?token=user1111
http://localhost:8080/?token=user1111&room=roomA
```

# Homework

Here are some ideas to improve the application:

- Broadcast a message to connected users when someone connects or disconnects.
- Add support for nicknames.
- Don’t send the same message to the user that sent it. Instead, append the message directly as soon as he/she presses enter.
- Add “{user} is typing” functionality.
- Show who’s online.
- Add private messaging.
- Share your improvements!

- https://socket.io/how-to/use-with-express-session 

# Demo deployed : 
- ### target branch name : [[deploy-version]](https://github.com/ks2colorworld/socketio-sample/tree/deploy-version)
- client
    - https://socketio-client-ks.onrender.com/
    - http://localhost:8080 (if you run locally - no need to build)

- server (very slow when running for the first time)
    - (just check healthy)[https://socketio-server-colorworld.koyeb.app/](https://socketio-server-colorworld.koyeb.app/)

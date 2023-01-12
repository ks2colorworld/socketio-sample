# socket.io example tutorial  

https://socket.io/get-started/chat  

```
cd _origin_tutorial
node index.js
```

```
pm2 start index.js --watch
```

# add other feature 

- 참고자료 : https://youtu.be/ZKEqqIO7n-k

## 클라이언트 소스는 js 소스만 참고할 것 
```
cd client
npm run dev
```

```
cd server
npm run dev
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
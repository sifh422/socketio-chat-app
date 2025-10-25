const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const users = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle user joining
  socket.on('join', (username) => {
    users[socket.id] = username;
    console.log(`${username} joined the chat`);
    
    // Broadcast to all users that someone joined
    io.emit('message', {
      id: Date.now(),
      user: 'System',
      text: `${username} joined the chat`,
      time: new Date().toLocaleTimeString()
    });
    
    // Send updated user list to all clients
    io.emit('users', Object.values(users));
  });
  
  // Handle incoming messages
  socket.on('message', (messageData) => {
    const message = {
      id: Date.now(),
      user: users[socket.id],
      text: messageData.text,
      time: new Date().toLocaleTimeString()
    };
    
    // Broadcast message to all users
    io.emit('message', message);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      console.log(`${username} left the chat`);
      
      // Broadcast to all users that someone left
      io.emit('message', {
        id: Date.now(),
        user: 'System',
        text: `${username} left the chat`,
        time: new Date().toLocaleTimeString()
      });
      
      // Remove user from users object
      delete users[socket.id];
      
      // Send updated user list to all clients
      io.emit('users', Object.values(users));
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
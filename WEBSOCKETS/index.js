// Tutoriel Socket.io — étapes 1 à 5
// https://socket.io/fr/docs/v4/tutorial/step-1

const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

// Étape 2 : servir le fichier HTML
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Étapes 3-5 : gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('a user connected');

  // Étape 3 : déconnexion
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  // Étapes 4-5 : recevoir un message et le broadcaster à tous
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

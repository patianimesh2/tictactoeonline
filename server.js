const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Create room
  socket.on('createRoom', () => {
    const roomId = uuidv4();
    rooms[roomId] = {
      sockets: [socket.id],
      players: {
        [socket.id]: { mark: 'X' }
      },
      board: Array(9).fill(null),
      turn: 'X'
    };

    socket.join(roomId);
    socket.data.roomId = roomId;

    const roomLink = `${process.env.BASE_URL || 'https://tictactoeonline-oow9.onrender.com/:' + PORT}/?room=${roomId}`;
    socket.emit('roomCreated', roomLink);
  });

  // Join room
  socket.on('joinRoomByLink', (roomId) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('errorMsg', 'Room not found');
    if (room.sockets.length >= 2) return socket.emit('errorMsg', 'Room full');

    room.sockets.push(socket.id);
    room.players[socket.id] = { mark: 'O' };
    socket.join(roomId);
    socket.data.roomId = roomId;

    io.to(roomId).emit('startGame', { board: room.board, turn: room.turn });
  });

  // Handle moves
  socket.on('makeMove', ({ index }) => {
    const roomId = socket.data.roomId;
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;

    if (player.mark !== room.turn)
      return socket.emit('errorMsg', 'Not your turn');

    if (room.board[index] !== null)
      return socket.emit('errorMsg', 'Cell already taken');

    room.board[index] = player.mark;

    const winner = checkWinner(room.board);
    if (winner) {
      io.to(roomId).emit('gameOver', { winner, board: room.board });
      room.board = Array(9).fill(null);
      room.turn = 'X';
      return;
    }

    if (room.board.every(cell => cell !== null)) {
      io.to(roomId).emit('gameOver', { winner: null, board: room.board });
      room.board = Array(9).fill(null);
      room.turn = 'X';
      return;
    }

    room.turn = room.turn === 'X' ? 'O' : 'X';
    io.to(roomId).emit('moveMade', { board: room.board, turn: room.turn });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;

    room.sockets = room.sockets.filter(id => id !== socket.id);
    delete room.players[socket.id];
    io.to(roomId).emit('playerLeft');

    if (room.sockets.length === 0) delete rooms[roomId];
  });
});

function checkWinner(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let [a,b1,c] of lines) {
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
  }
  return null;
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

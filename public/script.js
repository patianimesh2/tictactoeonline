const socket = io();
const createBtn = document.getElementById('createRoom');
const statusDiv = document.getElementById('status');
const linkBox = document.getElementById('linkBox');
const roomLinkInput = document.getElementById('roomLink');
const copyBtn = document.getElementById('copyLink');
const boardDiv = document.getElementById('board');

// Create room
createBtn.addEventListener('click', () => {
  socket.emit('createRoom');
  statusDiv.textContent = 'Creating your private room...';
});

// When room created
socket.on('roomCreated', (link) => {
  linkBox.classList.remove('hidden');
  roomLinkInput.value = link;
  statusDiv.textContent = 'Room ready! Waiting for opponent...';
});

// Copy link to clipboard
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(roomLinkInput.value);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
});

// Auto join via link
window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  if (roomId) {
    socket.emit('joinRoomByLink', roomId);
    statusDiv.textContent = 'Joining room...';
  }
});

// Game logic
socket.on('startGame', ({ board, turn }) => {
  statusDiv.textContent = `Game started! Player ${turn}'s turn`;
  linkBox.classList.add('hidden');
  renderBoard(board);
});

socket.on('moveMade', ({ board, turn }) => {
  renderBoard(board);
  statusDiv.textContent = `Player ${turn}'s turn`;
});

socket.on('gameOver', ({ winner, board }) => {
  renderBoard(board);
  if (winner) statusDiv.textContent = `🎉 Player ${winner} wins!`;
  else statusDiv.textContent = `It's a draw!`;
});

socket.on('errorMsg', (msg) => alert(msg));
socket.on('playerLeft', () => {
  alert('Other player left.');
  statusDiv.textContent = 'Opponent disconnected.';
});

function renderBoard(board) {
  boardDiv.innerHTML = '';
  board.forEach((cell, i) => {
    const div = document.createElement('div');
    div.className = 'cell';
    div.textContent = cell || '';
    div.addEventListener('click', () => socket.emit('makeMove', { index: i }));
    boardDiv.appendChild(div);
  });
}

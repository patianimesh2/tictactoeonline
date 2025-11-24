const socket = io();
const nameInput = document.getElementById('name');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const playAgainBtn = document.getElementById('playAgain');


let myMark = null;
let myTurn = false;
let localBoard = Array(9).fill(null);


function renderBoard(board) {
boardEl.innerHTML = '';
board.forEach((cell, i) => {
const el = document.createElement('div');
el.className = 'cell';
el.textContent = cell || '';
el.dataset.index = i;
el.addEventListener('click', () => onCellClick(i));
boardEl.appendChild(el);
});
}


function onCellClick(i) {
if (!myMark) return alert('Join the room first');
if (!myTurn) return; // not your turn
if (localBoard[i]) return; // taken
socket.emit('makeMove', { index: i });
}


function updatePlayers(players) {
playersEl.innerHTML = players.map(p => `${p.name} (${p.mark})`).join(' vs ');
}


// auto-join if room param exists
if (roomId) {
joinBtn.style.display = 'none';
nameInput.style.display = 'none';
doJoin();
}


joinBtn?.addEventListener('click', doJoin);


function doJoin() {
const name = nameInput.value || 'Player';
socket.emit('joinRoom', { roomId, name });
statusEl.textContent = 'Waiting for opponent...';
}


socket.on('roomUpdate', ({ players }) => {
updatePlayers(players);
statusEl.textContent = players.length === 1 ? 'Waiting for opponent...' : 'Opponent found — starting';
});


socket.on('startGame', ({ board, turn }) => {
// determine player's mark
const playersText = playersEl.textContent || '';
// server tells each socket which mark they are via room.players mapping; easier: server emits players list only; we must infer mark by requesting server or by receiving players info; to keep simple, server assigned mark
const canvas = document.getElementById("tetris-board");
const ctx = canvas.getContext("2d");
const nextPieceCanvas = document.getElementById("next-piece");
const nextPieceCtx = nextPieceCanvas.getContext("2d");
const scoreElement = document.getElementById("score-value");
const startButton = document.getElementById("start-button");
const musicToggle = document.getElementById("music-toggle");

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
let score = 0;
let board = [];
let currentPiece;
let nextPiece;
let gameInterval;
let gameRunning = false;
const GAME_SPEED = 500;

const sounds = {
	move: new Howl({ src: [""] }),
	rotate: new Howl({ src: [""] }),
	drop: new Howl({ src: ["https://cdn.freesound.org/previews/492/492883_3206727-lq.mp3"] }),
	clearLine: new Howl({ src: ["https://cdn.freesound.org/previews/702/702515_321967-lq.mp3"] }),
	gameOver: new Howl({ src: ["https://cdn.freesound.org/previews/382/382310_5421751-lq.mp3"] }),
	backgroundMusic: new Howl({ src: ["https://archive.org/download/TetrisThemeMusic/Tetris.mp3"],
		loop: true,
		volume: 0.5
	})
};

const COLORS = [
	"#FF0000", 
	"#00FF00", 
	"#0000FF", 
	"#FFFF00", 
	"#FF00FF",
	"#00FFFF", 
	"#FFA500" 
];

const pieces = [
	{ shape: [[1, 1, 1, 1]], color: 0 },
	{
		shape: [
			[1, 1],
			[1, 1]
		],
		color: 1
	},
	{
		shape: [
			[0, 1, 1],
			[1, 1, 0]
		],
		color: 2
	},
	{
		shape: [
			[1, 1, 0],
			[0, 1, 1]
		],
		color: 3
	},
	{
		shape: [
			[1, 1, 1],
			[0, 1, 0]
		],
		color: 4
	},
	{
		shape: [
			[1, 1, 1],
			[1, 0, 0]
		],
		color: 5
	},
	{
		shape: [
			[1, 1, 1],
			[0, 0, 1]
		],
		color: 6
	}
];

function initBoard() {
	for (let r = 0; r < ROWS; r++) {
		board[r] = [];
		for (let c = 0; c < COLS; c++) {
			board[r][c] = { value: 0, color: null };
		}
	}
}

function drawBoard() {
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			if (board[r][c].value) {
				ctx.fillStyle = COLORS[board[r][c].color];
				ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
				ctx.strokeStyle = "black";
				ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
			}
		}
	}

	if (currentPiece) {
		ctx.fillStyle = COLORS[currentPiece.color];
		for (let r = 0; r < currentPiece.shape.length; r++) {
			for (let c = 0; c < currentPiece.shape[r].length; c++) {
				if (currentPiece.shape[r][c]) {
					ctx.fillRect(
						(currentPiece.x + c) * BLOCK_SIZE,
						(currentPiece.y + r) * BLOCK_SIZE,
						BLOCK_SIZE,
						BLOCK_SIZE
					);
					ctx.strokeStyle = "black";
					ctx.strokeRect(
						(currentPiece.x + c) * BLOCK_SIZE,
						(currentPiece.y + r) * BLOCK_SIZE,
						BLOCK_SIZE,
						BLOCK_SIZE
					);
				}
			}
		}
	}
}

function drawNextPiece() {
	nextPieceCtx.fillStyle = "#fff";
	nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

	if (nextPiece) {
		nextPieceCtx.fillStyle = COLORS[nextPiece.color];
		const offsetX =
			(nextPieceCanvas.width - nextPiece.shape[0].length * BLOCK_SIZE) / 2;
		const offsetY =
			(nextPieceCanvas.height - nextPiece.shape.length * BLOCK_SIZE) / 2;

		for (let r = 0; r < nextPiece.shape.length; r++) {
			for (let c = 0; c < nextPiece.shape[r].length; c++) {
				if (nextPiece.shape[r][c]) {
					nextPieceCtx.fillRect(
						offsetX + c * BLOCK_SIZE,
						offsetY + r * BLOCK_SIZE,
						BLOCK_SIZE,
						BLOCK_SIZE
					);
					nextPieceCtx.strokeStyle = "black";
					nextPieceCtx.strokeRect(
						offsetX + c * BLOCK_SIZE,
						offsetY + r * BLOCK_SIZE,
						BLOCK_SIZE,
						BLOCK_SIZE
					);
				}
			}
		}
	}
}

function newPiece() {
	const pieceIndex = Math.floor(Math.random() * pieces.length);
	const piece = pieces[pieceIndex];
	return {
		shape: piece.shape,
		color: piece.color,
		x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2),
		y: 0
	};
}

function collision(x, y, piece) {
	for (let r = 0; r < piece.length; r++) {
		for (let c = 0; c < piece[r].length; c++) {
			if (piece[r][c]) {
				if (
					y + r >= ROWS ||
					x + c < 0 ||
					x + c >= COLS ||
					(y + r >= 0 && board[y + r][x + c].value)
				) {
					return true;
				}
			}
		}
	}
	return false;
}

function merge() {
	for (let r = 0; r < currentPiece.shape.length; r++) {
		for (let c = 0; c < currentPiece.shape[r].length; c++) {
			if (currentPiece.shape[r][c]) {
				board[currentPiece.y + r][currentPiece.x + c] = {
					value: 1,
					color: currentPiece.color
				};
			}
		}
	}
}

function rotate(piece) {
	const newPiece = [];
	for (let c = 0; c < piece[0].length; c++) {
		const newRow = [];
		for (let r = piece.length - 1; r >= 0; r--) {
			newRow.push(piece[r][c]);
		}
		newPiece.push(newRow);
	}
	return newPiece;
}

function clearLines() {
	let linesCleared = 0;
	for (let r = ROWS - 1; r >= 0; r--) {
		if (board[r].every((cell) => cell.value)) {
			board.splice(r, 1);
			board.unshift(new Array(COLS).fill().map(() => ({ value: 0, color: null })));
			linesCleared++;
			r++; 
		}
	}
	if (linesCleared > 0) {
		let pointsEarned = 0;
		switch (linesCleared) {
			case 1:
				pointsEarned = 100;
				break;
			case 2:
				pointsEarned = 300;
				break;
			case 3:
				pointsEarned = 500;
				break;
			case 4:
				pointsEarned = 800;
				break;
		}
		score += pointsEarned;
		scoreElement.textContent = score;
		sounds.clearLine.play();
	}
}

function gameOver() {
	clearInterval(gameInterval);
	ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "white";
	ctx.font = "36px VT323";
	ctx.textAlign = "center";
	ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
	gameRunning = false;
	sounds.backgroundMusic.stop();
	sounds.gameOver.play();
}

function update() {
	if (!collision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
		currentPiece.y++;
	} else {
		merge();
		clearLines();
		currentPiece = nextPiece;
		nextPiece = newPiece();
		if (collision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
			gameOver();
			return;
		}
		sounds.drop.play();
	}
	drawBoard();
	drawNextPiece();
}

function moveLeft() {
	if (!collision(currentPiece.x - 1, currentPiece.y, currentPiece.shape)) {
		currentPiece.x--;
		sounds.move.play();
		drawBoard();
	}
}

function moveRight() {
	if (!collision(currentPiece.x + 1, currentPiece.y, currentPiece.shape)) {
		currentPiece.x++;
		sounds.move.play();
		drawBoard();
	}
}

function moveDown() {
	if (!collision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
		currentPiece.y++;
		sounds.move.play();
		drawBoard();
	}
}

function rotatePiece() {
	const rotated = rotate(currentPiece.shape);
	if (!collision(currentPiece.x, currentPiece.y, rotated)) {
		currentPiece.shape = rotated;
		sounds.rotate.play();
		drawBoard();
	}
}

document.addEventListener("keydown", (e) => {
	if (!gameRunning) return;

	if (e.key === "ArrowLeft") moveLeft();
	else if (e.key === "ArrowRight") moveRight();
	else if (e.key === "ArrowDown") moveDown();
	else if (
		e.key === "ArrowUp" ||
		e.key === "r" ||
		e.key === "R" ||
		e.key === "0"
	)
		rotatePiece();
});

document.getElementById("left").addEventListener("click", moveLeft);
document.getElementById("right").addEventListener("click", moveRight);
document.getElementById("down").addEventListener("click", moveDown);
document.getElementById("rotate").addEventListener("click", rotatePiece);

startButton.addEventListener("click", () => {
	if (gameRunning) return;

	initBoard();
	score = 0;
	scoreElement.textContent = score;
	currentPiece = newPiece();
	nextPiece = newPiece();
	gameRunning = true;
	drawNextPiece();
	gameInterval = setInterval(update, GAME_SPEED);

	if (musicToggle.checked) {
		sounds.backgroundMusic.play();
	}
});

musicToggle.addEventListener("change", () => {
	if (musicToggle.checked) {
		sounds.backgroundMusic.play();
	} else {
		sounds.backgroundMusic.pause();
	}
});

drawBoard();
drawNextPiece();

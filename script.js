// ==================== DOM Elements ====================
const board = document.getElementById("chessboard");
const turnIndicator = document.getElementById("turn-indicator");
const timerDisplay = document.getElementById("timer");
const moveHistoryEl = document.getElementById("move-history");
const gameMessageEl = document.getElementById("game-message");
const moveCountEl = document.getElementById("move-count");
const gameStatusEl = document.getElementById("game-status");

// ==================== Piece Unicode ====================
const pieces = {
  r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
  R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙", "": ""
};

// ==================== Game State ====================
let gameBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"]
];

let boardHistory = [];
let moveRecords = [];
let selected = null;
let highlights = [];
let currentPlayer = "white";
let timer = 30;
let interval = null;
let moveCount = 0;
let gameEnded = false;
let lastPawnMove = null;

// ==================== Game Mode & AI ====================
let gameMode = "pvp"; // "pvp" or "bot"
let botDifficulty = "medium"; // "easy", "medium", "hard"
let playerColor = "white"; // Which color the player controls

const castlingRights = {
  white: { kingMoved: false, rookAMoved: false, rookHMoved: false },
  black: { kingMoved: false, rookAMoved: false, rookHMoved: false },
};

// ==================== Theme Management ====================
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeToggle = document.getElementById("theme-toggle");
  const isDarkMode = document.body.classList.contains("dark-mode");
  themeToggle.querySelector(".theme-icon").textContent = isDarkMode ? "☀️" : "🌙";
}

// Load theme preference
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
  updateThemeIcon();
}

// ==================== Game Mode Management ====================
function showGameModeDialog() {
  document.getElementById("game-mode-dialog").classList.remove("hidden");
}

function closeGameModeDialog() {
  document.getElementById("game-mode-dialog").classList.add("hidden");
}

function showGameOverModal(title, message) {
  document.getElementById("game-over-title").textContent = title;
  document.getElementById("game-over-message").textContent = message;
  document.getElementById("game-over-modal").classList.remove("hidden");
}

function closeGameOverModal() {
  document.getElementById("game-over-modal").classList.add("hidden");
}

function startPvPGame() {
  gameMode = "pvp";
  closeGameModeDialog();
  resetGame();
}

function startBotGame() {
  gameMode = "bot";
  botDifficulty = "medium"; // Default to medium difficulty
  playerColor = "white"; // Player is always white
  closeGameModeDialog();
  resetGame();
}

// ==================== Sound Effects ====================
function playSound(type) {
  // Simple beep sounds using Web Audio API
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case "move":
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case "capture":
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
      case "check":
        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
    }
  } catch (e) {
    // Audio not available
  }
}

// ==================== Move Notation ====================
function generateMoveNotation(fromRow, fromCol, toRow, toCol, piece, isCapture) {
  const colLetters = "abcdefgh";
  const rowNumbers = "87654321";
  
  piece = piece.toLowerCase();
  const fromSquare = colLetters[fromCol] + rowNumbers[fromRow];
  const toSquare = colLetters[toCol] + rowNumbers[toRow];
  
  let notation = "";
  if (piece === "p") {
    if (isCapture) notation = colLetters[fromCol] + "x" + toSquare;
    else notation = toSquare;
  } else {
    notation = piece.toUpperCase() + (isCapture ? "x" : "") + toSquare;
  }
  
  return notation;
}

function addMoveToHistory(notation) {
  const moveNum = Math.floor(moveCount / 2) + 1;
  const entry = document.createElement("div");
  entry.className = "move-entry";
  entry.textContent = (moveCount % 2 === 0 ? moveNum + ". " : "") + notation + (moveCount % 2 === 1 ? " " : "");
  moveHistoryEl.appendChild(entry);
  moveHistoryEl.scrollTop = moveHistoryEl.scrollHeight;
}

// ==================== Board Rendering ====================
function renderBoard() {
  const inCheck = isKingInCheck(currentPlayer);
  const kingPos = findKing(currentPlayer);
  board.innerHTML = "";

  // Update turn indicator
  turnIndicator.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} to Move`;
  
  // Update timer color based on remaining time
  if (timer <= 10) {
    timerDisplay.parentElement.classList.add("warning");
  } else {
    timerDisplay.parentElement.classList.remove("warning");
  }

  // Render squares
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;
      const piece = gameBoard[row][col];
      square.textContent = pieces[piece];
      
      // Add piece color class for styling
      if (piece && /[A-Z]/.test(piece)) {
        square.classList.add("white-piece");
      } else if (piece) {
        square.classList.add("black-piece");
      }

      if (selected && selected.row === row && selected.col === col) {
        square.classList.add("selected");
      }

      const highlight = highlights.find(p => p.row === row && p.col === col);
      if (highlight) {
        const target = gameBoard[row][col];
        const isWhite = currentPlayer === "white";
        const isEnemy = target && (isWhite !== /[A-Z]/.test(target));
        square.classList.add(isEnemy ? "capture" : "highlight");
      }

      if (inCheck && kingPos && row === kingPos.row && col === kingPos.col) {
        square.classList.add("check");
      }

      square.setAttribute("draggable", "true");
      square.addEventListener("click", () => onSquareClick(row, col));
      square.addEventListener("dragstart", e => onDragStart(e, row, col));
      square.addEventListener("dragover", e => e.preventDefault());
      square.addEventListener("drop", e => onDrop(e, row, col));

      board.appendChild(square);
    }
  }

  updateGameStatus();
}

function updateGameStatus() {
  if (gameEnded) return;
  
  const inCheck = isKingInCheck(currentPlayer);
  
  if (isCheckmate(currentPlayer)) {
    const winner = currentPlayer === "white" ? "Black" : "White";
    gameMessageEl.className = "game-message checkmate";
    gameMessageEl.textContent = `♛ CHECKMATE! ${winner} wins! ♛`;
    gameStatusEl.textContent = "Checkmate";
    gameEnded = true;
    clearInterval(interval);
    playSound("check");
    showGameOverModal("Checkmate!", `${winner} wins the game!`);
  } else if (isStalemate(currentPlayer)) {
    gameMessageEl.className = "game-message stalemate";
    gameMessageEl.textContent = "🤝 STALEMATE - Draw!";
    gameStatusEl.textContent = "Stalemate";
    gameEnded = true;
    clearInterval(interval);
    showGameOverModal("Stalemate", "The game is a draw!");
  } else if (inCheck) {
    gameMessageEl.className = "game-message check";
    gameMessageEl.textContent = "⚠️ Check!";
    playSound("check");
  } else {
    gameMessageEl.textContent = "";
    gameStatusEl.textContent = "Playing";
  }
  
  // Bot's turn - make move after a delay
  if (gameMode === "bot" && currentPlayer !== playerColor && !gameEnded) {
    setTimeout(() => {
      if (!gameEnded) {
        makeBotMove();
      }
    }, 800);
  }
}

// ==================== Square Click Handler ====================
function onSquareClick(row, col) {
  if (gameEnded) return;
  
  // Prevent move if it's bot's turn (in bot mode)
  if (gameMode === "bot" && currentPlayer !== playerColor) return;
  
  const piece = gameBoard[row][col];

  if (selected) {
    if (highlights.some(p => p.row === row && p.col === col)) {
      executeMove(selected.row, selected.col, row, col);
    }
    selected = null;
    highlights = [];
  } else if (piece && ((currentPlayer === "white" && /[A-Z]/.test(piece)) ||
                       (currentPlayer === "black" && /[a-z]/.test(piece)))) {
    selected = { row, col };
    highlights = getSafeLegalMoves(piece, row, col);
  }
  renderBoard();
}

// ==================== Move Execution ====================
function executeMove(fromRow, fromCol, toRow, toCol) {
  const movingPiece = gameBoard[fromRow][fromCol];
  const targetPiece = gameBoard[toRow][toCol];
  const isWhite = movingPiece === movingPiece.toUpperCase();
  const isCapture = !!targetPiece;
  
  // Generate notation before move
  const notation = generateMoveNotation(fromRow, fromCol, toRow, toCol, movingPiece, isCapture);
  
  // Save board state
  boardHistory.push(structuredClone(gameBoard));
  
  // Execute the move
  movePiece(fromRow, fromCol, toRow, toCol);
  
  // Play sound
  if (isCapture) playSound("capture");
  else playSound("move");
  
  // Add to move history
  moveCount++;
  moveCountEl.textContent = moveCount;
  addMoveToHistory(notation);
  
  // Switch player
  currentPlayer = currentPlayer === "white" ? "black" : "white";
  resetTimer();
  
  renderBoard();
}

// ==================== Move Piece Logic ====================
function movePiece(fromRow, fromCol, toRow, toCol) {
  const movingPiece = gameBoard[fromRow][fromCol];
  const isWhite = movingPiece === movingPiece.toUpperCase();
  const color = isWhite ? "white" : "black";

  // ===== Castling =====
  if (movingPiece.toLowerCase() === "k" && Math.abs(toCol - fromCol) === 2) {
    const direction = toCol - fromCol > 0 ? 1 : -1;
    const rookFromCol = direction > 0 ? 7 : 0;
    const rookToCol = fromCol + direction;
    gameBoard[toRow][toCol] = movingPiece;
    gameBoard[fromRow][fromCol] = "";
    gameBoard[toRow][rookToCol] = gameBoard[toRow][rookFromCol];
    gameBoard[toRow][rookFromCol] = "";
    castlingRights[color].kingMoved = true;
    if (direction > 0) castlingRights[color].rookHMoved = true;
    else castlingRights[color].rookAMoved = true;
    return;
  }

  // Update castling rights
  if (movingPiece.toLowerCase() === "k") castlingRights[color].kingMoved = true;
  if (movingPiece.toLowerCase() === "r") {
    if (fromCol === 0) castlingRights[color].rookAMoved = true;
    if (fromCol === 7) castlingRights[color].rookHMoved = true;
  }

  // ===== En Passant =====
  if (movingPiece.toLowerCase() === "p" && fromCol !== toCol && !gameBoard[toRow][toCol]) {
    // En passant capture
    const captureRow = fromRow;
    gameBoard[captureRow][toCol] = "";
  }

  // Normal move
  gameBoard[toRow][toCol] = movingPiece;
  gameBoard[fromRow][fromCol] = "";

  // Track pawn moves for en passant
  if (movingPiece.toLowerCase() === "p") {
    const moveDistance = Math.abs(toRow - fromRow);
    if (moveDistance === 2) {
      lastPawnMove = { col: toCol, captureRow: (fromRow + toRow) / 2, player: color };
    } else {
      lastPawnMove = null;
    }
  } else {
    lastPawnMove = null;
  }

  // ===== Pawn Promotion =====
  if (/[Pp]/.test(movingPiece) && (toRow === 0 || toRow === 7)) {
    const promotionPiece = showPromotionDialog();
    gameBoard[toRow][toCol] = isWhite ? promotionPiece : promotionPiece.toLowerCase();
  }
}

// ==================== Pawn Promotion Dialog ====================
function showPromotionDialog() {
  const options = ["Q", "R", "B", "N"];
  let choice = null;
  
  // Simple prompt for now (can be improved with custom modal)
  while (!options.includes(choice?.toUpperCase())) {
    choice = prompt("Promote to (Q/R/B/N):", "Q")?.toUpperCase() || "Q";
  }
  
  return choice;
}

// ==================== Stalemate Detection ====================
function isStalemate(color) {
  // Not in check AND no legal moves available
  if (isKingInCheck(color)) return false;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = gameBoard[r][c];
      if (!p) continue;
      const isWhite = p === p.toUpperCase();
      const isFriendly = (color === "white" && isWhite) || (color === "black" && !isWhite);
      if (!isFriendly) continue;
      
      if (getSafeLegalMoves(p, r, c).length > 0) return false;
    }
  }
  return true;
}

// ==================== Drag and Drop Handlers ====================
function onDragStart(e, row, col) {
  if (gameEnded) {
    e.preventDefault();
    return;
  }
  
  // Prevent drag if it's bot's turn (in bot mode)
  if (gameMode === "bot" && currentPlayer !== playerColor) {
    e.preventDefault();
    return;
  }
  
  if ((currentPlayer === "white" && /[A-Z]/.test(gameBoard[row][col])) ||
      (currentPlayer === "black" && /[a-z]/.test(gameBoard[row][col]))) {
    selected = { row, col };
    highlights = getSafeLegalMoves(gameBoard[row][col], row, col);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ row, col }));
    renderBoard();
  } else {
    e.preventDefault();
  }
}

function onDrop(e, row, col) {
  e.preventDefault();
  if (gameEnded) return;
  
  try {
    const from = JSON.parse(e.dataTransfer.getData("text/plain"));
    if (highlights.some(p => p.row === row && p.col === col)) {
      executeMove(from.row, from.col, row, col);
    }
  } catch (err) {
    console.error("Drop error:", err);
  }
  selected = null;
  highlights = [];
  renderBoard();
}

// ==================== Game Reset ====================
function resetGame() {
  gameBoard = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
  ];
  selected = null;
  highlights = [];
  currentPlayer = "white";
  moveCount = 0;
  gameEnded = false;
  lastPawnMove = null;
  boardHistory = [];
  moveRecords = [];
  castlingRights.white = { kingMoved: false, rookAMoved: false, rookHMoved: false };
  castlingRights.black = { kingMoved: false, rookAMoved: false, rookHMoved: false };
  
  moveCountEl.textContent = "0";
  gameStatusEl.textContent = "Playing";
  gameMessageEl.textContent = "";
  
  // Update UI with game mode info
  if (gameMode === "bot") {
    document.getElementById("game-mode").textContent = "vs Bot";
    document.getElementById("game-difficulty").textContent = botDifficulty.charAt(0).toUpperCase() + botDifficulty.slice(1);
  } else {
    document.getElementById("game-mode").textContent = "Local PvP";
    document.getElementById("game-difficulty").textContent = "-";
  }
  
  moveHistoryEl.innerHTML = '<p class="empty-state">No moves yet</p>';
  
  resetTimer();
  renderBoard();
}

// ==================== Undo Move ====================
function undoMove() {
  if (boardHistory.length === 0) {
    alert("No moves to undo!");
    return;
  }
  
  gameBoard = boardHistory.pop();
  moveRecords.pop();
  moveCount--;
  moveCountEl.textContent = moveCount;
  currentPlayer = currentPlayer === "white" ? "black" : "white";
  gameEnded = false;
  gameMessageEl.textContent = "";
  
  // Remove last move from history display
  const entries = moveHistoryEl.querySelectorAll(".move-entry");
  if (entries.length > 0) {
    entries[entries.length - 1].remove();
  }
  if (entries.length <= 1) {
    moveHistoryEl.innerHTML = '<p class="empty-state">No moves yet</p>';
  }
  
  resetTimer();
  renderBoard();
}

// ==================== Timer Management ====================
function updateTimer() {
  timer--;
  timerDisplay.textContent = timer;
  
  if (timer <= 0) {
    clearInterval(interval);
    gameEnded = true;
    const loser = currentPlayer;
    const winner = currentPlayer === "white" ? "Black" : "White";
    gameMessageEl.className = "game-message checkmate";
    gameMessageEl.textContent = `⏰ ${winner} wins! ${loser} ran out of time!`;
    gameStatusEl.textContent = "Time Out";
  }
}

function resetTimer() {
  timer = 30;
  timerDisplay.textContent = "30";
  clearInterval(interval);
  interval = setInterval(updateTimer, 1000);
}

// ==================== Legal Move Calculation ====================
function getSafeLegalMoves(piece, row, col) {
  const candidateMoves = getLegalMoves(piece, row, col);
  const legal = [];
  
  for (const move of candidateMoves) {
    const tempBoard = structuredClone(gameBoard);
    tempBoard[move.row][move.col] = tempBoard[row][col];
    tempBoard[row][col] = "";
    
    const originalBoard = gameBoard;
    gameBoard = tempBoard;
    const stillInCheck = isKingInCheck(currentPlayer);
    gameBoard = originalBoard;
    
    if (!stillInCheck) legal.push(move);
  }
  
  // Add castling moves for kings (after basic validation to avoid recursion)
  if (piece.toLowerCase() === "k") {
    const isWhite = piece === piece.toUpperCase();
    const castlingMoves = getCastlingMovesValidated(row, col, isWhite);
    legal.push(...castlingMoves);
  }
  
  return legal;
}

// ==================== Get Legal Moves for Piece ====================
function getLegalMoves(piece, row, col) {
  const moves = [];
  if (!piece) return moves; // No piece at location
  
  const isWhite = piece === piece.toUpperCase();
  piece = piece.toLowerCase();

  const directions = {
    r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
    b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    q: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    k: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    n: [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]]
  };

  // ===== Knight and King (single square moves) =====
  if (piece === "n" || piece === "k") {
    for (const [dr, dc] of directions[piece]) {
      const r = row + dr, c = col + dc;
      if (r < 0 || r > 7 || c < 0 || c > 7) continue;
      const target = gameBoard[r][c];
      if (!target || (isWhite !== /[A-Z]/.test(target))) {
        moves.push({ row: r, col: c });
      }
    }
    
    // Note: Castling is NOT added here to prevent infinite recursion
    // It's handled separately in getSafeLegalMoves
    
    return moves;
  }

  // ===== Pawns =====
  if (piece === "p") {
    const dir = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    
    // Forward move
    if (!gameBoard[row + dir]?.[col]) {
      moves.push({ row: row + dir, col: col });
      
      // Double move from start
      if (row === startRow && !gameBoard[row + 2 * dir][col]) {
        moves.push({ row: row + 2 * dir, col });
      }
    }

    // Diagonal captures
    [-1, 1].forEach(offset => {
      const r = row + dir;
      const c = col + offset;
      if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const target = gameBoard[r][c];
        if (target && isWhite !== /[A-Z]/.test(target)) {
          moves.push({ row: r, col: c });
        }
      }
    });
    
    // En passant
    if (lastPawnMove && (lastPawnMove.col === col + 1 || lastPawnMove.col === col - 1)) {
      if ((isWhite && row === 3) || (!isWhite && row === 4)) {
        if (lastPawnMove.player !== (isWhite ? "white" : "black")) {
          moves.push({ row: row + dir, col: lastPawnMove.col });
        }
      }
    }
    
    return moves;
  }

  // ===== Rooks, Bishops, Queens (sliding pieces) =====
  for (const [dr, dc] of directions[piece] || []) {
    for (let step = 1; step < 8; step++) {
      const r = row + dr * step;
      const c = col + dc * step;
      if (r < 0 || r > 7 || c < 0 || c > 7) break;
      const target = gameBoard[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (isWhite !== /[A-Z]/.test(target)) {
          moves.push({ row: r, col: c });
        }
        break;
      }
    }
  }

  return moves;
}

// ==================== Castling Moves (Validated) ====================
function getCastlingMovesValidated(row, col, isWhite) {
  const moves = [];
  const color = isWhite ? "white" : "black";
  const rights = castlingRights[color];
  
  // Can't castle if king already moved or in check
  if (rights.kingMoved || isKingInCheck(color)) return moves;

  const originalBoard = gameBoard;

  // King-side castling (O-O): King to g-file
  if (!rights.rookHMoved && !originalBoard[row][5] && !originalBoard[row][6]) {
    // Check if any square the king passes through is under attack
    let canCastle = true;
    
    // Check f-file (col 5)
    let tempBoard = structuredClone(originalBoard);
    tempBoard[row][5] = isWhite ? "K" : "k";
    tempBoard[row][4] = "";
    gameBoard = tempBoard;
    if (isKingInCheck(color)) canCastle = false;
    gameBoard = originalBoard;
    
    if (canCastle) {
      moves.push({ row, col: 6 });
    }
  }

  // Queen-side castling (O-O-O): King to c-file
  if (!rights.rookAMoved && !originalBoard[row][1] && !originalBoard[row][2] && !originalBoard[row][3]) {
    // Check if any square the king passes through is under attack
    let canCastle = true;
    
    // Check d-file (col 3)
    let tempBoard = structuredClone(originalBoard);
    tempBoard[row][3] = isWhite ? "K" : "k";
    tempBoard[row][4] = "";
    gameBoard = tempBoard;
    if (isKingInCheck(color)) canCastle = false;
    gameBoard = originalBoard;
    
    if (canCastle) {
      moves.push({ row, col: 2 });
    }
  }

  return moves;
}

// ==================== Check and Checkmate Detection ====================
function isKingInCheck(color) {
  const kingPos = findKing(color);
  if (!kingPos) return false; // King not found
  
  const opponent = color === "white" ? "black" : "white";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = gameBoard[r][c];
      if (p && ((opponent === "white" && /[A-Z]/.test(p)) ||
                (opponent === "black" && /[a-z]/.test(p)))) {
        const moves = getLegalMoves(p, r, c);
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function isCheckmate(color) {
  if (!isKingInCheck(color)) return false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = gameBoard[r][c];
      if (!piece) continue;

      const isWhite = piece === piece.toUpperCase();
      const isFriendly = (color === "white" && isWhite) || (color === "black" && !isWhite);
      if (!isFriendly) continue;

      if (getSafeLegalMoves(piece, r, c).length > 0) return false;
    }
  }

  return true;
}

function findKing(color) {
  const symbol = color === "white" ? "K" : "k";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (gameBoard[r][c] === symbol) return { row: r, col: c };
    }
  }
  return null;
}

// ==================== AI Bot Logic ====================
function makeBotMove() {
  if (gameEnded || currentPlayer === playerColor) return;
  
  const depth = botDifficulty === "easy" ? 1 : botDifficulty === "medium" ? 2 : 3;
  const bestMove = findBestMove(depth);
  
  if (bestMove) {
    executeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
  }
}

function findBestMove(depth) {
  let bestScore = -Infinity;
  let bestMove = null;
  
  // Get all possible moves for bot (always black)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = gameBoard[r][c];
      if (!piece) continue;
      
      // Bot always plays as black (lowercase pieces)
      if (!/[a-z]/.test(piece)) continue;
      
      const moves = getSafeLegalMoves(piece, r, c);
      
      for (const move of moves) {
        // Try this move
        const tempBoard = structuredClone(gameBoard);
        const tempPlayer = currentPlayer;
        
        gameBoard[move.row][move.col] = gameBoard[r][c];
        gameBoard[r][c] = "";
        currentPlayer = "white"; // After black moves, white's turn
        
        const score = minimax(depth - 1, -Infinity, Infinity, true);
        
        // Undo move - restore exact state
        gameBoard = tempBoard;
        currentPlayer = tempPlayer;
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = { fromRow: r, fromCol: c, toRow: move.row, toCol: move.col };
        }
      }
    }
  }
  
  return bestMove;
}

function minimax(depth, alpha, beta, isMaximizing) {
  if (depth === 0 || isCheckmate(currentPlayer) || isStalemate(currentPlayer)) {
    return evaluateBoard();
  }
  
  // Determine which side we're moving for
  const isWhiteToMove = currentPlayer === "white";
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = gameBoard[r][c];
        if (!piece) continue;
        
        // In maximizing, we always move white pieces
        const isWhitePiece = /[A-Z]/.test(piece);
        if (!isWhitePiece) continue;
        
        const moves = getSafeLegalMoves(piece, r, c);
        for (const move of moves) {
          const tempBoard = structuredClone(gameBoard);
          const tempPlayer = currentPlayer;
          
          gameBoard[move.row][move.col] = gameBoard[r][c];
          gameBoard[r][c] = "";
          currentPlayer = currentPlayer === "white" ? "black" : "white";
          
          const score = minimax(depth - 1, alpha, beta, false);
          
          gameBoard = tempBoard;
          currentPlayer = tempPlayer;
          
          maxScore = Math.max(score, maxScore);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) return maxScore;
        }
      }
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = gameBoard[r][c];
        if (!piece) continue;
        
        // In minimizing, we always move black pieces
        const isWhitePiece = /[A-Z]/.test(piece);
        if (isWhitePiece) continue;
        
        const moves = getSafeLegalMoves(piece, r, c);
        for (const move of moves) {
          const tempBoard = structuredClone(gameBoard);
          const tempPlayer = currentPlayer;
          
          gameBoard[move.row][move.col] = gameBoard[r][c];
          gameBoard[r][c] = "";
          currentPlayer = currentPlayer === "white" ? "black" : "white";
          
          const score = minimax(depth - 1, alpha, beta, true);
          
          gameBoard = tempBoard;
          currentPlayer = tempPlayer;
          
          minScore = Math.min(score, minScore);
          beta = Math.min(beta, score);
          if (beta <= alpha) return minScore;
        }
      }
    }
    return minScore;
  }
}

function evaluateBoard() {
  // Piece values
  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let score = 0;
  
  // Count material
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = gameBoard[r][c];
      if (!piece) continue;
      
      const value = pieceValues[piece.toLowerCase()];
      const isWhite = piece === piece.toUpperCase();
      score += isWhite ? value : -value;
    }
  }
  
  // Check/checkmate bonus
  if (isCheckmate("black")) score += 1000;
  if (isCheckmate("white")) score -= 1000;
  if (isKingInCheck("black")) score += 50;
  if (isKingInCheck("white")) score -= 50;
  
  return score;
}

// ==================== Initialize Game ====================
document.addEventListener("DOMContentLoaded", function() {
  loadTheme();
  // Clear the move history on load
  moveHistoryEl.innerHTML = '<p class="empty-state">No moves yet</p>';
  renderBoard();
  // Start the timer
  resetTimer();
});

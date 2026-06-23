/**
 * INTEGRATION MODULE: Connect Chess Validator to Existing Game
 * =============================================================
 * Shows how to replace the current move validation with the bulletproof system
 */

// Initialize the validator globally
const chessValidator = new ChessValidator();

/**
 * Initialize validator with current game board
 * Call this at game start
 */
function initializeValidator(gameBoardArray) {
  chessValidator.initializeBoard(gameBoardArray);
}

/**
 * GET SAFE LEGAL MOVES (Replacement for existing function)
 * Uses the bulletproof Two-Phase validation
 */
function getSafeLegalMoves(piece, row, col) {
  // Get all fully legal moves (Phase 1 + Phase 2)
  return chessValidator.getLegalMoves(piece, row, col);
}

/**
 * EXECUTE MOVE (Replacement for existing function)
 * Validates and executes a move with proper state tracking
 */
function executeMoveValidated(fromRow, fromCol, toRow, toCol) {
  const piece = chessValidator.boardState.board[fromRow * 8 + fromCol];
  if (!piece) return false;

  return chessValidator.executeMove(piece, fromRow, fromCol, toRow, toCol);
}

/**
 * CHECK VALIDATION
 */
function isKingInCheckValidated(color) {
  return chessValidator.isKingInCheck(color);
}

/**
 * CHECKMATE DETECTION
 */
function isCheckmateValidated(color) {
  return chessValidator.isCheckmate(color);
}

/**
 * STALEMATE DETECTION
 */
function isStalemateValidated(color) {
  return chessValidator.isStalemate(color);
}

/**
 * UPDATE GAME BOARD FROM VALIDATOR
 * Syncs the validator's internal board with the game UI board
 */
function syncValidatorBoardToGame() {
  const board2D = chessValidator.getBoardAs2D();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      gameBoard[row][col] = board2D[row][col];
    }
  }
}

/**
 * SYNC GAME BOARD TO VALIDATOR
 * Syncs the game UI board with the validator's internal board
 */
function syncGameBoardToValidator() {
  chessValidator.initializeBoard(gameBoard);
}

/**
 * HANDLE CASTLING RIGHTS UPDATE
 */
function updateCastlingRights(color, kingMoved, rookAMoved, rookHMoved) {
  chessValidator.setCastlingRights(color, kingMoved, rookAMoved, rookHMoved);
}

/**
 * HANDLE EN PASSANT TRACKING
 */
function updateEnPassant(col, player, row) {
  chessValidator.setLastPawnMove(col, player, row);
}

/**
 * EXAMPLE: Integrate with existing executeMove function
 * 
 * Replace the current executeMove() with this pattern:
 */
function executeMoveBulletproof(fromRow, fromCol, toRow, toCol) {
  const movingPiece = gameBoard[fromRow][fromCol];
  const targetPiece = gameBoard[toRow][toCol];
  const isWhite = movingPiece === movingPiece.toUpperCase();
  const isCapture = !!targetPiece;

  // Validate move using bulletproof system
  const pseudoLegal = chessValidator.generator.generatePseudoLegalMoves(
    movingPiece,
    fromRow,
    fromCol
  );
  const moveData = pseudoLegal.find(m => m.row === toRow && m.col === toCol);

  if (!moveData) {
    console.warn("Move not in pseudo-legal set");
    return;
  }

  // Check full legality (Phase 2: King Safety)
  if (!chessValidator.validator.isMoveLegal(movingPiece, fromRow, fromCol, toRow, toCol, moveData)) {
    console.warn("Move leaves king in check");
    return;
  }

  // Generate move notation BEFORE executing
  const notation = generateMoveNotation(fromRow, fromCol, toRow, toCol, movingPiece, isCapture);

  // Execute move on UI board
  gameBoard[toRow][toCol] = movingPiece;
  gameBoard[fromRow][fromCol] = "";

  // Execute move in validator
  chessValidator.executeMove(movingPiece, fromRow, fromCol, toRow, toCol, moveData);

  // Update castling rights
  if (movingPiece.toLowerCase() === "k") {
    castlingRights[isWhite ? "white" : "black"].kingMoved = true;
    chessValidator.setCastlingRights(
      isWhite ? "white" : "black",
      true,
      castlingRights[isWhite ? "white" : "black"].rookAMoved,
      castlingRights[isWhite ? "white" : "black"].rookHMoved
    );
  }

  if (movingPiece.toLowerCase() === "r") {
    if (fromCol === 0) {
      castlingRights[isWhite ? "white" : "black"].rookAMoved = true;
      chessValidator.setCastlingRights(
        isWhite ? "white" : "black",
        castlingRights[isWhite ? "white" : "black"].kingMoved,
        true,
        castlingRights[isWhite ? "white" : "black"].rookHMoved
      );
    } else if (fromCol === 7) {
      castlingRights[isWhite ? "white" : "black"].rookHMoved = true;
      chessValidator.setCastlingRights(
        isWhite ? "white" : "black",
        castlingRights[isWhite ? "white" : "black"].kingMoved,
        castlingRights[isWhite ? "white" : "black"].rookAMoved,
        true
      );
    }
  }

  // Update en passant tracking
  if (movingPiece.toLowerCase() === "p" && Math.abs(toRow - fromRow) === 2) {
    lastPawnMove = { col: toCol, player: isWhite ? "white" : "black", row: toRow };
    chessValidator.setLastPawnMove(toCol, isWhite ? "white" : "black", toRow);
  } else {
    lastPawnMove = null;
    chessValidator.setLastPawnMove(null, null, null);
  }

  // Add move to history
  addMoveToHistory(notation);
  moveCount++;

  // Switch player
  currentPlayer = currentPlayer === "white" ? "black" : "white";

  // Render updated board
  renderBoard();
}

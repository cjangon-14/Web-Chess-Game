/**
 * BULLETPROOF CHESS MOVE VALIDATION ENGINE
 * =========================================
 * Two-Phase Validation Framework:
 *   Phase 1: Pseudo-Legal Move Generation (LegalMoves)
 *   Phase 2: King Safety Check (isMoveLegal via makeMove/unmakeMove)
 *
 * Edge-Case Safeguards:
 *   - Absolute Pins: Prevents moving pieces shielding the king
 *   - Illegal Castling: Validates king/rook movement, pass-through checks, prior moves
 *   - En Passant Exposure: Checks for rank ray attacks after removing both pawns
 *
 * Performance Optimization:
 *   - In-place board mutations (NO deep-cloning)
 *   - State save/restore for efficient hypothetical moves
 *   - Coordinate mapping: row/col ↔ flat index (optional for future optimization)
 */

// ==================== BOARD STATE MANAGEMENT ====================
class BoardState {
  constructor(board = null) {
    this.board = board || Array(64).fill("");
    this.castlingRights = {
      white: { kingMoved: false, rookAMoved: false, rookHMoved: false },
      black: { kingMoved: false, rookAMoved: false, rookHMoved: false }
    };
    this.lastPawnMove = null;
    this.moveHistory = [];
    this.stateStack = [];
  }

  // Save current state for hypothetical move testing
  saveState() {
    this.stateStack.push({
      boardSnapshot: [...this.board],
      castlingSnapshot: JSON.parse(JSON.stringify(this.castlingRights)),
      lastPawnMoveSnapshot: this.lastPawnMove ? { ...this.lastPawnMove } : null
    });
  }

  // Restore state after hypothetical move
  restoreState() {
    if (this.stateStack.length === 0) throw new Error("State stack underflow");
    const state = this.stateStack.pop();
    this.board = state.boardSnapshot;
    this.castlingRights = state.castlingSnapshot;
    this.lastPawnMove = state.lastPawnMoveSnapshot;
  }

  // Convert row/col to flat array index (optimization for future use)
  static toIndex(row, col) {
    return row * 8 + col;
  }

  // Convert flat array index back to row/col
  static fromIndex(index) {
    return { row: Math.floor(index / 8), col: index % 8 };
  }

  isWhitePiece(piece) {
    return piece && /[A-Z]/.test(piece);
  }

  isBlackPiece(piece) {
    return piece && /[a-z]/.test(piece);
  }

  getPieceColor(piece) {
    if (!piece) return null;
    return this.isWhitePiece(piece) ? "white" : "black";
  }

  isEnemyPiece(piece, color) {
    const pieceColor = this.getPieceColor(piece);
    return pieceColor && pieceColor !== color;
  }

  isFriendlyPiece(piece, color) {
    const pieceColor = this.getPieceColor(piece);
    return pieceColor === color;
  }
}

// ==================== PHASE 1: PSEUDO-LEGAL MOVE GENERATION ====================
class LegalMoveGenerator {
  constructor(boardState) {
    this.state = boardState;
  }

  /**
   * Generate ALL pseudo-legal moves for a piece (including moves leaving king in check)
   * These moves are later validated in Phase 2
   */
  generatePseudoLegalMoves(piece, row, col) {
    if (!piece) return [];

    const color = this.state.getPieceColor(piece);
    const type = piece.toLowerCase();

    switch (type) {
      case "p":
        return this.generatePawnMoves(row, col, color);
      case "n":
        return this.generateKnightMoves(row, col, color);
      case "b":
        return this.generateBishopMoves(row, col, color);
      case "r":
        return this.generateRookMoves(row, col, color);
      case "q":
        return this.generateQueenMoves(row, col, color);
      case "k":
        return this.generateKingMoves(row, col, color);
      default:
        return [];
    }
  }

  generatePawnMoves(row, col, color) {
    const moves = [];
    const dir = color === "white" ? -1 : 1; // white: -1 (up), black: +1 (down)
    const startRow = color === "white" ? 6 : 1;

    // Forward single move
    const nextRow = row + dir;
    if (nextRow >= 0 && nextRow <= 7 && !this.state.board[nextRow * 8 + col]) {
      moves.push({ row: nextRow, col, isCapture: false, isEnPassant: false });

      // Forward double move from start
      if (row === startRow) {
        const doubleRow = row + 2 * dir;
        if (!this.state.board[doubleRow * 8 + col]) {
          moves.push({ row: doubleRow, col, isCapture: false, isEnPassant: false });
        }
      }
    }

    // Diagonal captures (standard captures + en passant)
    for (const dcol of [-1, 1]) {
      const captureCol = col + dcol;
      if (captureCol < 0 || captureCol > 7) continue;

      const captureRow = row + dir;
      if (captureRow < 0 || captureRow > 7) continue;

      // Standard diagonal capture
      const targetPiece = this.state.board[captureRow * 8 + captureCol];
      if (targetPiece && this.state.isEnemyPiece(targetPiece, color)) {
        moves.push({ row: captureRow, col: captureCol, isCapture: true, isEnPassant: false });
      }

      // En passant capture (CRITICAL EDGE CASE)
      if (
        this.state.lastPawnMove &&
        this.state.lastPawnMove.col === captureCol &&
        ((color === "white" && row === 3) || (color === "black" && row === 4))
      ) {
        // Ensure the last move was an enemy pawn
        if (this.state.lastPawnMove.player !== color) {
          moves.push({ 
            row: captureRow, 
            col: captureCol, 
            isCapture: true, 
            isEnPassant: true,
            capturedPieceRow: row, // Row of the en passant-captured pawn
            capturedPieceCol: captureCol // Col of the en passant-captured pawn
          });
        }
      }
    }

    return moves;
  }

  generateKnightMoves(row, col, color) {
    const moves = [];
    const deltas = [
      [2, 1], [1, 2], [-1, 2], [-2, 1],
      [-2, -1], [-1, -2], [1, -2], [2, -1]
    ];

    for (const [dr, dc] of deltas) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) continue;

      const target = this.state.board[newRow * 8 + newCol];
      if (!target || this.state.isEnemyPiece(target, color)) {
        moves.push({ row: newRow, col: newCol, isCapture: !!target });
      }
    }

    return moves;
  }

  generateBishopMoves(row, col, color) {
    return this.generateSlidingMoves(row, col, color, [
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]);
  }

  generateRookMoves(row, col, color) {
    return this.generateSlidingMoves(row, col, color, [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ]);
  }

  generateQueenMoves(row, col, color) {
    return this.generateSlidingMoves(row, col, color, [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]);
  }

  generateSlidingMoves(row, col, color, directions) {
    const moves = [];
    for (const [dr, dc] of directions) {
      for (let step = 1; step < 8; step++) {
        const newRow = row + dr * step;
        const newCol = col + dc * step;
        if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) break;

        const target = this.state.board[newRow * 8 + newCol];
        if (!target) {
          moves.push({ row: newRow, col: newCol, isCapture: false });
        } else if (this.state.isEnemyPiece(target, color)) {
          moves.push({ row: newRow, col: newCol, isCapture: true });
          break;
        } else {
          break; // Blocked by friendly piece
        }
      }
    }
    return moves;
  }

  generateKingMoves(row, col, color) {
    const moves = [];
    const deltas = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (const [dr, dc] of deltas) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) continue;

      const target = this.state.board[newRow * 8 + newCol];
      if (!target || this.state.isEnemyPiece(target, color)) {
        moves.push({ row: newRow, col: newCol, isCapture: !!target, isCastling: false });
      }
    }

    // Add castling moves (will be validated in Phase 2)
    this.addCastlingMoves(row, col, color, moves);

    return moves;
  }

  addCastlingMoves(row, col, color, moves) {
    const rights = this.state.castlingRights[color];

    // King-side castling: king → g-file
    if (!rights.kingMoved && !rights.rookHMoved) {
      // No pieces between king and h-rook
      if (!this.state.board[row * 8 + 5] && !this.state.board[row * 8 + 6]) {
        moves.push({ row, col: 6, isCapture: false, isCastling: true, castleDir: "kingside" });
      }
    }

    // Queen-side castling: king → c-file
    if (!rights.kingMoved && !rights.rookAMoved) {
      // No pieces between king and a-rook
      if (!this.state.board[row * 8 + 1] && !this.state.board[row * 8 + 2] && !this.state.board[row * 8 + 3]) {
        moves.push({ row, col: 2, isCapture: false, isCastling: true, castleDir: "queenside" });
      }
    }
  }
}

// ==================== PHASE 2: MOVE LEGALITY VALIDATION ====================
class MoveLegalityValidator {
  constructor(boardState) {
    this.state = boardState;
    this.generator = new LegalMoveGenerator(boardState);
  }

  /**
   * CORE VALIDATION: Check if a move is fully legal
   * Uses makeMove → isKingInCheck → unmakeMove pattern
   */
  isMoveLegal(piece, fromRow, fromCol, toRow, toCol, moveData = {}) {
    if (!piece) return false;

    const color = this.state.getPieceColor(piece);
    if (!color) return false;

    // Special handling for castling
    if (moveData.isCastling) {
      return this.validateCastling(color, fromRow, fromCol, toRow, toCol, moveData.castleDir);
    }

    // Make the move in-place
    this.makeMove(piece, fromRow, fromCol, toRow, toCol, moveData);

    // Check if own king is in check after the move
    const kingInCheck = this.isKingInCheck(color);

    // Unmake the move to restore board state
    this.unmakeMove(piece, fromRow, fromCol, toRow, toCol, moveData);

    // Move is legal only if king is NOT in check after the move
    return !kingInCheck;
  }

  /**
   * IN-PLACE MOVE EXECUTION (Phase 2 Helper)
   * Mutates board directly; restore with unmakeMove
   */
  makeMove(piece, fromRow, fromCol, toRow, toCol, moveData = {}) {
    const fromIndex = fromRow * 8 + fromCol;
    const toIndex = toRow * 8 + toCol;

    // Store captured piece for unmake
    moveData.capturedPiece = this.state.board[toIndex];

    // Handle en passant: remove captured pawn from its actual position
    if (moveData.isEnPassant) {
      const capturedIndex = moveData.capturedPieceRow * 8 + moveData.capturedPieceCol;
      moveData.capturedEnPassantPiece = this.state.board[capturedIndex];
      this.state.board[capturedIndex] = "";
    }

    // Handle castling: move the rook
    if (moveData.isCastling) {
      if (moveData.castleDir === "kingside") {
        const rookFromIndex = fromRow * 8 + 7;
        const rookToIndex = fromRow * 8 + 5;
        this.state.board[rookToIndex] = this.state.board[rookFromIndex];
        this.state.board[rookFromIndex] = "";
      } else if (moveData.castleDir === "queenside") {
        const rookFromIndex = fromRow * 8 + 0;
        const rookToIndex = fromRow * 8 + 3;
        this.state.board[rookToIndex] = this.state.board[rookFromIndex];
        this.state.board[rookFromIndex] = "";
      }
    }

    // Move the piece
    this.state.board[toIndex] = piece;
    this.state.board[fromIndex] = "";
  }

  /**
   * RESTORE BOARD AFTER HYPOTHETICAL MOVE
   * Reverses makeMove exactly
   */
  unmakeMove(piece, fromRow, fromCol, toRow, toCol, moveData = {}) {
    const fromIndex = fromRow * 8 + fromCol;
    const toIndex = toRow * 8 + toCol;

    // Restore the piece to original position
    this.state.board[fromIndex] = piece;

    // Restore captured piece (or leave empty if none)
    this.state.board[toIndex] = moveData.capturedPiece || "";

    // Restore en passant captured pawn
    if (moveData.isEnPassant && moveData.capturedEnPassantPiece) {
      const capturedIndex = moveData.capturedPieceRow * 8 + moveData.capturedPieceCol;
      this.state.board[capturedIndex] = moveData.capturedEnPassantPiece;
    }

    // Restore castling: unmove the rook
    if (moveData.isCastling) {
      if (moveData.castleDir === "kingside") {
        const rookFromIndex = fromRow * 8 + 7;
        const rookToIndex = fromRow * 8 + 5;
        this.state.board[rookFromIndex] = this.state.board[rookToIndex];
        this.state.board[rookToIndex] = "";
      } else if (moveData.castleDir === "queenside") {
        const rookFromIndex = fromRow * 8 + 0;
        const rookToIndex = fromRow * 8 + 3;
        this.state.board[rookFromIndex] = this.state.board[rookToIndex];
        this.state.board[rookToIndex] = "";
      }
    }
  }

  /**
   * KING SAFETY CHECK
   * Detects if king of given color is under attack
   */
  isKingInCheck(color) {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;

    const opponent = color === "white" ? "black" : "white";
    return this.isSquareAttackedBy(kingPos.row, kingPos.col, opponent);
  }

  /**
   * ATTACK DETECTION
   * Checks if a square is attacked by any opponent piece
   * CRITICAL: This prevents absolute pins by checking all attacking vectors
   */
  isSquareAttackedBy(row, col, attackerColor) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.state.board[r * 8 + c];
        if (!piece || !this.state.isFriendlyPiece(piece, attackerColor)) continue;

        // Generate pseudo-legal moves for this attacking piece
        const attacks = this.generator.generatePseudoLegalMoves(piece, r, c);
        if (attacks.some(move => move.row === row && move.col === col)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * CASTLING VALIDATION (EDGE CASE SAFEGUARD)
   * Ensures: no prior king/rook move, not in check, no pass-through checks
   */
  validateCastling(color, fromRow, fromCol, toRow, toCol, castleDir) {
    const rights = this.state.castlingRights[color];

    // King or rook has already moved
    if (rights.kingMoved) return false;
    if (castleDir === "kingside" && rights.rookHMoved) return false;
    if (castleDir === "queenside" && rights.rookAMoved) return false;

    // King is in check
    if (this.isKingInCheck(color)) return false;

    // Check if king passes through or lands on attacked square
    if (castleDir === "kingside") {
      // Check f-file (col 5) and g-file (col 6)
      if (this.isSquareAttackedBy(fromRow, 5, color === "white" ? "black" : "white")) return false;
      if (this.isSquareAttackedBy(fromRow, 6, color === "white" ? "black" : "white")) return false;
    } else if (castleDir === "queenside") {
      // Check d-file (col 3) and c-file (col 2)
      if (this.isSquareAttackedBy(fromRow, 3, color === "white" ? "black" : "white")) return false;
      if (this.isSquareAttackedBy(fromRow, 2, color === "white" ? "black" : "white")) return false;
    }

    return true;
  }

  findKing(color) {
    const king = color === "white" ? "K" : "k";
    for (let i = 0; i < 64; i++) {
      if (this.state.board[i] === king) {
        return { row: Math.floor(i / 8), col: i % 8 };
      }
    }
    return null;
  }
}

// ==================== PUBLIC API ====================
class ChessValidator {
  constructor() {
    this.boardState = new BoardState();
    this.generator = new LegalMoveGenerator(this.boardState);
    this.validator = new MoveLegalityValidator(this.boardState);
  }

  /**
   * Initialize the board from a 2D array (8x8 rows/cols)
   */
  initializeBoard(board2D) {
    this.boardState.board = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        this.boardState.board.push(board2D[row][col] || "");
      }
    }
  }

  /**
   * Get all FULLY LEGAL moves for a piece (Phase 1 + Phase 2)
   */
  getLegalMoves(piece, row, col) {
    const pseudoLegal = this.generator.generatePseudoLegalMoves(piece, row, col);
    const legal = [];

    for (const move of pseudoLegal) {
      if (this.validator.isMoveLegal(piece, row, col, move.row, move.col, move)) {
        legal.push(move);
      }
    }

    return legal;
  }

  /**
   * Validate a specific move
   */
  validateMove(piece, fromRow, fromCol, toRow, toCol) {
    // First check if it's in pseudo-legal moves
    const pseudoLegal = this.generator.generatePseudoLegalMoves(piece, fromRow, fromCol);
    const moveData = pseudoLegal.find(m => m.row === toRow && m.col === toCol);

    if (!moveData) return false;

    // Then check legality (king safety)
    return this.validator.isMoveLegal(piece, fromRow, fromCol, toRow, toCol, moveData);
  }

  /**
   * Execute a move permanently (update board state)
   */
  executeMove(piece, fromRow, fromCol, toRow, toCol, moveData = {}) {
    const pseudoLegal = this.generator.generatePseudoLegalMoves(piece, fromRow, fromCol);
    const move = pseudoLegal.find(m => m.row === toRow && m.col === toCol);

    if (!move || !this.validator.isMoveLegal(piece, fromRow, fromCol, toRow, toCol, move)) {
      return false;
    }

    const fromIndex = fromRow * 8 + fromCol;
    const toIndex = toRow * 8 + toCol;
    const color = this.boardState.getPieceColor(piece);

    // Save state before move
    this.boardState.saveState();

    // Execute the move
    this.validator.makeMove(piece, fromRow, fromCol, toRow, toCol, move);

    // Update castling rights
    const type = piece.toLowerCase();
    if (type === "k") {
      this.boardState.castlingRights[color].kingMoved = true;
    }
    if (type === "r") {
      if (fromCol === 0) {
        this.boardState.castlingRights[color].rookAMoved = true;
      } else if (fromCol === 7) {
        this.boardState.castlingRights[color].rookHMoved = true;
      }
    }

    // Update last pawn move for en passant
    if (type === "p" && Math.abs(toRow - fromRow) === 2) {
      this.boardState.lastPawnMove = {
        col: toCol,
        player: color,
        row: toRow
      };
    } else {
      this.boardState.lastPawnMove = null;
    }

    this.boardState.moveHistory.push({
      piece, fromRow, fromCol, toRow, toCol, ...move
    });

    return true;
  }

  /**
   * Check if king is in check
   */
  isKingInCheck(color) {
    return this.validator.isKingInCheck(color);
  }

  /**
   * Check if king is in checkmate
   */
  isCheckmate(color) {
    if (!this.validator.isKingInCheck(color)) return false;

    for (let i = 0; i < 64; i++) {
      const piece = this.boardState.board[i];
      if (!piece) continue;

      const row = Math.floor(i / 8);
      const col = i % 8;

      if (!this.boardState.isFriendlyPiece(piece, color)) continue;

      if (this.getLegalMoves(piece, row, col).length > 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if position is stalemate
   */
  isStalemate(color) {
    if (this.validator.isKingInCheck(color)) return false;

    for (let i = 0; i < 64; i++) {
      const piece = this.boardState.board[i];
      if (!piece) continue;

      const row = Math.floor(i / 8);
      const col = i % 8;

      if (!this.boardState.isFriendlyPiece(piece, color)) continue;

      if (this.getLegalMoves(piece, row, col).length > 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get current board as 2D array for UI rendering
   */
  getBoardAs2D() {
    const board2D = [];
    for (let row = 0; row < 8; row++) {
      board2D[row] = [];
      for (let col = 0; col < 8; col++) {
        board2D[row][col] = this.boardState.board[row * 8 + col] || "";
      }
    }
    return board2D;
  }

  /**
   * Get internal flat board (for advanced use)
   */
  getBoardFlat() {
    return [...this.boardState.board];
  }

  /**
   * Set castling rights
   */
  setCastlingRights(color, kingMoved, rookAMoved, rookHMoved) {
    this.boardState.castlingRights[color] = {
      kingMoved,
      rookAMoved,
      rookHMoved
    };
  }

  /**
   * Set last pawn move (for en passant tracking)
   */
  setLastPawnMove(col, player, row) {
    this.boardState.lastPawnMove = { col, player, row };
  }
}

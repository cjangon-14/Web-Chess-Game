VALIDATOR DOCUMENTATION
================================
Bulletproof Chess Move Validation System

TABLE OF CONTENTS
==================
1. Architecture Overview
2. Two-Phase Validation Framework
3. Edge-Case Safeguards
4. API Reference
5. Integration Guide
6. Performance Characteristics

═══════════════════════════════════════════════════════════════════════

1. ARCHITECTURE OVERVIEW
========================

The system consists of three core modules:

  ┌─────────────────┐
  │  BoardState     │ Manages 64-element flat array, castling rights, en passant
  └────────┬────────┘
           │
  ┌────────▼─────────────┐
  │LegalMoveGenerator     │ Phase 1: Pseudo-legal move generation
  └────────┬─────────────┘
           │
  ┌────────▼──────────────────────┐
  │MoveLegalityValidator           │ Phase 2: King safety checks
  └────────┬──────────────────────┘
           │
  ┌────────▼──────────────┐
  │ChessValidator (Public)│ Public API for game integration
  └───────────────────────┘

BOARD REPRESENTATION
====================
- Flat 1D Array: 64 elements (index = row*8 + col)
- Pieces: "r","n","b","q","k","p" (black) and "R","N","B","Q","K","P" (white)
- Empty squares: "" (empty string)

Example coordinate mapping:
  e2 square (white pawn start) = row 6, col 4 → index 52
  e8 square (black king start) = row 0, col 4 → index 4

═══════════════════════════════════════════════════════════════════════

2. TWO-PHASE VALIDATION FRAMEWORK
==================================

PHASE 1: PSEUDO-LEGAL MOVE GENERATION
--------------------------------------
LegalMoveGenerator.generatePseudoLegalMoves(piece, row, col)

What it does:
  - Generates ALL moves a piece can make based on pure chess rules
  - Does NOT check king safety
  - Includes moves that would leave the king in check
  - Includes all move metadata (capture, castling, en passant)

Performance:
  - O(1) for knight/king (8 fixed directions max)
  - O(7) for bishop/rook/queen (up to 7 squares per direction)
  - O(1) for pawn (up to 3 moves: forward, double-forward, captures)

Return format:
  [
    { row: 5, col: 4, isCapture: false, isEnPassant: false },
    { row: 4, col: 4, isCapture: false, isEnPassant: false },
    ...
  ]

Example:
  validator.generator.generatePseudoLegalMoves("P", 6, 4)
  → [{row: 5, col: 4}, {row: 4, col: 4}] (pawn on e2 can go to e3 or e4)


PHASE 2: KING SAFETY CHECK
---------------------------
MoveLegalityValidator.isMoveLegal(piece, fromRow, fromCol, toRow, toCol, moveData)

The Hypothetical Move Workflow:

  1. makeMove()
     ├─ Move piece on board (in-place)
     ├─ Remove captured piece
     ├─ Handle en passant: remove captured pawn from actual position
     └─ Handle castling: move the rook as well

  2. isKingInCheck(color)
     ├─ Find friendly king position
     ├─ Check if any opponent piece attacks the king square
     └─ Return true if king is under attack

  3. unmakeMove()
     ├─ Restore piece to original position
     ├─ Restore captured piece
     ├─ Restore en passant pawn
     └─ Restore rook (if castling)

  Result: Move is LEGAL if king is NOT in check after the move


Why This Works:
  ✓ Handles absolute pins automatically (moving pinned piece leaves king in check)
  ✓ Handles en passant exposure (removing both pawns exposes king check)
  ✓ Prevents illegal castling (validated separately in validateCastling)
  ✓ Works in-place without deep cloning (memory efficient)


Example Flow:
  ┌─────────────────────────────────────────┐
  │ Execute Move: Bishop from d1 to b3      │
  └──────────────┬──────────────────────────┘
                 │
        ┌────────▼────────┐
        │  makeMove()      │
        │  Board changes   │
        └────────┬────────┘
                 │
        ┌────────▼──────────────┐
        │ isKingInCheck(white)  │
        │ Still safe? NO ✓      │
        └────────┬──────────────┘
                 │
        ┌────────▼────────┐
        │ unmakeMove()     │
        │ Board restored   │
        └────────┬────────┘
                 │
        ┌────────▼───────────────┐
        │ Move is LEGAL ✓        │
        └───────────────────────┘

═══════════════════════════════════════════════════════════════════════

3. EDGE-CASE SAFEGUARDS
=======================

CRITICAL EDGE CASE #1: ABSOLUTE PINS
-------------------------------------
Definition:
  A pinned piece is one that shields the king from an opponent's attack.
  Moving a pinned piece off the pin line exposes the king to check.

Example Setup:
  r . . . . . . .
  . . . . . . . .
  . . . . B . . .   ← White Bishop on e6
  . . P . . . . .   ← White Pawn on c5 (pinned)
  . . . . K . . .   ← White King on e4
  . . b . . . . .   ← Black bishop on c3
  . . . . . . . .
  . . . . . . . .

Why it's tricky:
  - The pawn on c5 IS blocking the bishop attack from c3
  - If pawn moves right (to d5), black bishop has a direct line to white king
  - This is illegal, but traditional generators might not catch it

Our Solution:
  1. generatePseudoLegalMoves() generates move (c5 → d5)
  2. isMoveLegal() makes the move hypothetically
  3. isKingInCheck() detects the bishop attack on king
  4. unmakeMove() restores the board
  5. Move is rejected as ILLEGAL

Test: TestAbsolutePins() in validatorTests.js


CRITICAL EDGE CASE #2: ILLEGAL CASTLING
----------------------------------------
Illegal castling scenarios:
  1. King has already moved
  2. Rook has already moved
  3. King is in check before castling
  4. King moves through a checked square
  5. King lands on a checked square
  6. Pieces between king and rook

Our Solution (validateCastling):
  ✓ Check castlingRights.kingMoved == false
  ✓ Check castlingRights.rookHMoved == false (kingside) or rookAMoved (queenside)
  ✓ Check isKingInCheck(color) == false
  ✓ Check isSquareAttackedBy(passthrough-file, opponent-color) == false
  ✓ Check isSquareAttackedBy(destination-file, opponent-color) == false

Example: Castling through check

  r . . . q . . r     Rank 8 (Black)
  . . . . . . . .
  . . . . . . . .
  . . . . . . . .
  . . . . . . . .
  . . . . . . . .
  . . . . . . . .
  R . . . K . . R     Rank 1 (White) - Black queen attacks f1

White cannot castle kingside because:
  - f1 (passthrough) is attacked by black queen
  - g1 (destination) is also attacked

Tests: TestIllegalCastling() in validatorTests.js


CRITICAL EDGE CASE #3: EN PASSANT EXPOSURE
-------------------------------------------
Definition:
  En passant capture can expose the king to check by removing two pawns
  that were blocking an attack vector.

Example Setup:
  . . . . . . . .
  . . . . . . . .
  . . . r . . . .   ← Black rook on c6
  P . p . . . . .   ← White Pawn e5, Black pawn c5 (just moved)
  . . . . K . . .   ← White King e4
  . . . . . . . .
  . . . . . . . .

Why it's tricky:
  - White pawn on e5 can capture en passant on d6
  - BUT removing both pawns opens rank 5 to black rook
  - This exposes white king to horizontal attack

Our Solution:
  1. generatePseudoLegalMoves() generates en passant capture
  2. moveData includes: {isEnPassant: true, capturedPieceRow, capturedPieceCol}
  3. makeMove() removes BOTH the capturing pawn and the captured pawn
  4. isKingInCheck() detects the rook attack on the king
  5. unmakeMove() restores both pawns
  6. Move is rejected as ILLEGAL if king is in check

Special handling in makeMove():
  ```javascript
  if (moveData.isEnPassant) {
    const capturedIndex = moveData.capturedPieceRow * 8 + moveData.capturedPieceCol;
    moveData.capturedEnPassantPiece = this.state.board[capturedIndex];
    this.state.board[capturedIndex] = "";  // Remove en passant pawn
  }
  ```

Tests: TestEnPassantExposure() in validatorTests.js

═══════════════════════════════════════════════════════════════════════

4. API REFERENCE
================

PUBLIC CLASS: ChessValidator

Constructor:
  const validator = new ChessValidator()

Methods:

  initializeBoard(board2D)
    - Setup: Takes 8x8 2D array
    - Returns: void
    - Example:
        const board = [
          ["r", "n", "b", "q", "k", "b", "n", "r"],
          ...
          ["R", "N", "B", "Q", "K", "B", "N", "R"]
        ];
        validator.initializeBoard(board);

  getLegalMoves(piece, row, col)
    - Purpose: Get all fully legal moves for a piece
    - Performs: Phase 1 + Phase 2 validation
    - Returns: Array of move objects
    - Example:
        const moves = validator.getLegalMoves("P", 6, 4);
        // [{row: 5, col: 4}, {row: 4, col: 4}]

  validateMove(piece, fromRow, fromCol, toRow, toCol)
    - Purpose: Check if a specific move is legal
    - Returns: boolean
    - Example:
        if (validator.validateMove("N", 7, 1, 5, 2)) {
          console.log("Knight move is legal");
        }

  executeMove(piece, fromRow, fromCol, toRow, toCol, moveData)
    - Purpose: Execute a move permanently (updates board state)
    - Modifies: Internal board, castling rights, en passant tracking
    - Returns: boolean (success/failure)
    - Example:
        if (validator.executeMove("P", 6, 4, 5, 4)) {
          console.log("Pawn moved");
        }

  isKingInCheck(color)
    - Purpose: Check if king is currently in check
    - Parameters: color = "white" or "black"
    - Returns: boolean
    - Example:
        if (validator.isKingInCheck("white")) {
          console.log("White is in check!");
        }

  isCheckmate(color)
    - Purpose: Check if king is in checkmate
    - Parameters: color = "white" or "black"
    - Returns: boolean
    - Example:
        if (validator.isCheckmate("black")) {
          gameEnded = true;
          winner = "white";
        }

  isStalemate(color)
    - Purpose: Check if position is stalemate
    - Parameters: color = "white" or "black"
    - Returns: boolean
    - Example:
        if (validator.isStalemate("white")) {
          result = "draw";
        }

  getBoardAs2D()
    - Purpose: Get current board as 8x8 2D array
    - Returns: [[...], [...], ...]
    - Example:
        const board2D = validator.getBoardAs2D();
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            console.log(board2D[r][c]);
          }
        }

  getBoardFlat()
    - Purpose: Get current board as flat 64-element array
    - Returns: [...]
    - Example:
        const board = validator.getBoardFlat();
        console.log(board[4]); // e-file position

  setCastlingRights(color, kingMoved, rookAMoved, rookHMoved)
    - Purpose: Update castling rights after move
    - Parameters:
        color: "white" or "black"
        kingMoved: boolean
        rookAMoved: boolean (queenside rook)
        rookHMoved: boolean (kingside rook)
    - Example:
        validator.setCastlingRights("white", true, false, false);

  setLastPawnMove(col, player, row)
    - Purpose: Set en passant tracking
    - Parameters:
        col: column of pawn
        player: "white" or "black"
        row: row pawn moved to
    - Example:
        validator.setLastPawnMove(4, "black", 3);

═══════════════════════════════════════════════════════════════════════

5. INTEGRATION GUIDE
====================

Step 1: Include the validator modules in HTML
  <script src="moveValidator.js"></script>
  <script src="validatorIntegration.js"></script>
  <script src="validatorTests.js"></script>

Step 2: Initialize the validator at game start
  function startGame() {
    initializeValidator(gameBoard); // gameBoard is existing 2D array
  }

Step 3: Replace move selection with validator
  BEFORE:
    const legalMoves = getLegalMoves(piece, row, col);
    highlights = legalMoves;

  AFTER:
    const legalMoves = chessValidator.getLegalMoves(piece, row, col);
    highlights = legalMoves;

Step 4: Replace move execution with validator
  BEFORE:
    function executeMove(fromRow, fromCol, toRow, toCol) {
      gameBoard[toRow][toCol] = gameBoard[fromRow][fromCol];
      gameBoard[fromRow][fromCol] = "";
      currentPlayer = /* switch player */
    }

  AFTER:
    function executeMove(fromRow, fromCol, toRow, toCol) {
      const piece = gameBoard[fromRow][fromCol];
      if (!chessValidator.validateMove(piece, fromRow, fromCol, toRow, toCol)) {
        console.error("Illegal move!");
        return;
      }
      chessValidator.executeMove(piece, fromRow, fromCol, toRow, toCol);
      syncValidatorBoardToGame();
      currentPlayer = /* switch player */
    }

Step 5: Update check/checkmate detection
  BEFORE:
    if (isKingInCheck(currentPlayer)) { ... }

  AFTER:
    if (chessValidator.isKingInCheck(currentPlayer)) { ... }

Step 6: Sync board state periodically
  // After each move
  syncValidatorBoardToGame();

  // Or before AI moves
  syncGameBoardToValidator();

═══════════════════════════════════════════════════════════════════════

6. PERFORMANCE CHARACTERISTICS
===============================

MEMORY USAGE
============
  - BoardState: 64 bytes (flat array) + metadata
  - NO deep cloning during move validation
  - Single state stack entry: ~256 bytes per saveState()
  - ~2x more efficient than structuredClone approach

TIME COMPLEXITY
===============
  getLegalMoves(piece, row, col):
    - Knight/King: O(8) = O(1)
    - Pawn: O(3) = O(1)
    - Rook/Bishop: O(7*7) = O(49) ≈ O(1) (bounded by 64 squares)
    - Queen: O(7*8) = O(56) ≈ O(1)
    Phase 2 (validity check): O(64) per move (scan all opponent pieces)
    Total: O(64) per move = O(1) effective

  isKingInCheck(color):
    - O(64) scan of all opponent pieces
    - Each generates pseudo-legal moves: O(1) bounded
    - Total: O(64) = O(1) effective

  isCheckmate(color):
    - O(64) scan of all friendly pieces
    - Each generates legal moves: O(64)
    - Total: O(64 * 64) = O(4096) = acceptable

OPTIMIZATION OPPORTUNITIES
===========================
  1. Bitboards: Replace 64-element array with 8 64-bit integers
     - Would reduce memory from 64 to 8 integers
     - Would enable bit-parallel move generation
     - Not implemented yet (use current approach for clarity)

  2. Move caching: Cache legal moves per position
     - Requires transposition table (hash of board state)
     - Added complexity; not implemented

  3. Early termination: In checkmate check, stop after first legal move found
     - Already implemented (return false immediately)

═══════════════════════════════════════════════════════════════════════

TESTING
=======
Run comprehensive test suite:
  const results = runValidatorTests();
  console.log(results);
  // {total: 15, passed: 15, failed: 0, results: [...]}

Tests cover:
  ✓ Basic pawn/knight/bishop/rook/queen/king moves
  ✓ Absolute pin prevention
  ✓ Illegal castling prevention
  ✓ En passant with and without exposure
  ✓ King safety checks
  ✓ Checkmate detection
  ✓ Stalemate detection

═══════════════════════════════════════════════════════════════════════

DEBUGGING
=========
Enable detailed logging:
  1. Add console.log() in makeMove/unmakeMove
  2. Log board state at each phase
  3. Log attack detection results
  4. Log castling validation steps

Example:
  function makeMove(piece, fromRow, fromCol, toRow, toCol, moveData = {}) {
    console.log(`Making move: ${piece} from (${fromRow},${fromCol}) to (${toRow},${toCol})`);
    // ... move logic ...
    console.log(`Board after move:`, this.state.board);
  }

═══════════════════════════════════════════════════════════════════════

# ♔ Web Chess Game

A modern, fully functional browser-based chess game with a sleek interface, complete chess rule implementation, and **AI Bot opponent**.

## 📋 Project Overview

## ✨ Features

### Core Chess Rules
- ✅ **Legal move validation** with king safety checks
- ♔ **Castling** (King-side and Queen-side with full validation)
- ♟️ **Pawn promotion** with piece selection
- ⚔️ **En passant** capture support
- 👑 **Check and checkmate** detection
- 🤝 **Stalemate** detection (draw condition)
- ♞ **Full piece movement** (all pieces follow standard chess rules)
- 📌 **Absolute pin detection** (pieces pinned to king cannot move off pin line)

### Game Modes
- 🎮 **Local PvP** - Play against another player on the same device
- 🤖 **Play with Bot** - Challenge the AI opponent with **default medium difficulty**

### Game Features
- 🖱️ **Dual input modes** - Click-to-move or drag-and-drop
- 📝 **Move history** - Horizontal wrap display with all moves
- 🔄 **Undo functionality** - Step back moves
- 🎮 **Instant mode selection** - Switch between PvP and Bot (no difficulty menu)
- 🎵 **Sound effects** - Audio feedback for moves, captures, and checks

### Modern Design
- 🌓 **Dark/Light theme toggle** - Persistent theme preference
- 📱 **Responsive layout** - Optimized for desktop and tablet
- 🎨 **Minimalist UI** - Clean, professional interface with crisp borders (no shadows)
- 🎯 **Move indicators** - Color-coded highlights:
  - 🟨 Yellow = Legal moves
  - 🔴 Red = Capture moves
  - 🔵 Blue = Selected piece
  - 🔴 Red pulsing = King in check
- 🎉 **Elegant game over modal** - Celebratory display for checkmate/stalemate

### Information Panels
- **Left panel**: Game status and move history
- **Right panel**: Game controls and game info
- **Center**: Chess board with piece positions
- **Status display**: Real-time game messages

## 🎮 How to Play

### Starting a Game
1. Open `index.html` in your web browser
2. Click **New Game** button
3. Choose your game mode instantly:
   - **👥 Local PvP**: Play against another human player
   - **🤖 Play with Bot**: Face off against the AI (medium difficulty)
4. Game starts immediately

### Making Moves
1. Click or drag pieces to move them
2. Legal moves will be highlighted in yellow
3. Capture moves are highlighted in red
4. If your king is in check, it will pulse red
5. Use **Undo** to step back a move anytime

## 🤖 AI Bot Details

### Algorithm
The bot uses **Minimax algorithm** to calculate optimal moves:
- Evaluates board state by material count and strategic position
- Search depth: Medium (default) for balanced gameplay

### Move Evaluation
Scores are based on:
- Material value (Pawn=1, Knight/Bishop=3, Rook=5, Queen=9)
- Checkmate bonus (+1000)
- Stalemate consideration
- Check status evaluation

## 🏁 Game Endings

- **Checkmate**: King is in check and has no legal moves
- **Stalemate**: King is NOT in check but has no legal moves (draw)
- **New Game**: Start fresh at any time via the New Game button

## 📊 Special Moves

- **Castling**: Move king 2 squares toward rook (if neither has moved and no pieces between)
- **Pawn Promotion**: When a pawn reaches the opposite end, choose Q/R/B/N
- **En Passant**: Pawn capture on empty square when opponent's pawn moves 2 squares

## 🎨 Themes

- **Light Mode** (default): Clean, bright interface
- **Dark Mode**: Deep carbon canvas for comfortable play

Theme preference is automatically saved to your browser.

## 📱 Responsive Design

- **Desktop**: Full three-column layout (left status, center board, right controls)
- **Tablet**: Optimized stacked layout
- **Mobile**: Single column with focused board view

## 🛠️ Technologies

- **HTML5** - Semantic structure
- **CSS3** - Modern styling with CSS variables and animations
- **JavaScript (Vanilla)** - Complete game logic with AI bot using minimax algorithm
- **Web Audio API** - Sound effects (optional)

## 🚀 Getting Started

```bash
# Simply open in a browser
# No build process or dependencies required!
open index.html
```

Or use Live Server in VS Code for development.

## 📋 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## 🎓 Code Structure

- `index.html` - Layout and UI elements (includes game mode modal)
- `style.css` - Modern responsive styling with theme support and modal styles
- `script.js` - Complete chess game logic, rules engine, and minimax AI

## 🤖 AI Implementation Details

### State Preservation
- The AI preserves game state during move evaluation
- Board and player turn are restored after each theoretical move
- Prevents corrupting the actual game state

### Performance
- Minimax with strategic evaluation for real-time moves
- Optimal for medium difficulty gameplay

### Limitations
- No opening book or endgame tables
- Doesn't learn from previous games
- AI set to default medium difficulty for balanced play

## 📝 Notes

- All chess rules are fully implemented
- Games are not saved (refresh page starts new game)
- Multiplayer is local (same device)
- Instant game mode switching between PvP and Bot

## 🤝 Future Enhancement Ideas

- Adjustable AI difficulty selection
- Opening book database
- Game replay/analysis
- Online multiplayer support
- Move hints for learning
- Performance stats and move tracking

## 📄 License

This project is open source and available for educational and personal use.
- 📱 **Responsive layout** - Optimized for desktop and tablet
- 🎨 **Modern UI** - Clean, professional interface with smooth animations
- 🎯 **Move indicators** - Color-coded highlights:
  - 🟨 Yellow = Legal moves
  - 🔴 Red = Capture moves
  - 🔵 Blue = Selected piece
  - 🔴 Red border = King in check

### Information Panels
- **Left panel**: Current player, timer, and move history
- **Right panel**: Game controls, statistics, and rules reference
- **Center**: Chess board with piece positions
- **Status display**: Real-time game messages (check, checkmate, stalemate, etc.)

## 🎮 How to Play

1. Open `index.html` in your web browser
2. Click or drag pieces to move them
3. Legal moves will be highlighted in yellow
4. Capture moves are highlighted in red
5. If your king is in check, it will have a red border
6. Complete your move within 30 seconds
7. Use "Undo" to step back a move
8. Use "New Game" to start fresh

## 🔧 Move Controls

- **Click Move**: Click a piece, then click a destination square
- **Drag Move**: Click and drag a piece to its destination
- **Visual Feedback**: Pieces show valid move options before moving
- **Undo**: Go back one move using the Undo button
- **New Game**: Reset the board and start over

## 🏁 Game Endings

- **Checkmate**: King is in check and has no legal moves
- **Stalemate**: King is NOT in check but has no legal moves (draw)
- **Time Out**: Player runs out of time on their turn
- **New Game**: Start fresh at any time

## 📊 Special Moves

- **Castling**: Move king 2 squares toward rook (if neither has moved and no pieces between)
- **Pawn Promotion**: When a pawn reaches the opposite end, choose Q/R/B/N
- **En Passant**: Pawn capture on empty square when opponent's pawn moves 2 squares

## 🎨 Themes

- **Light Mode** (default): Clean, bright interface
- **Dark Mode**: Easy on the eyes for evening play

Theme preference is automatically saved to your browser.

## 📱 Responsive Design

- Desktop: Full three-panel layout
- Tablet: Stacked layout with optimized spacing
- Mobile: Simplified interface optimized for touch

## 🛠️ Technologies

- **HTML5** - Semantic structure
- **CSS3** - Modern styling with CSS variables and animations
- **JavaScript** - Complete game logic with no external dependencies
- **Web Audio API** - Sound effects (optional)

## 🚀 Getting Started

```bash
# Simply open in a browser
# No build process or dependencies required!
open index.html
```

Or use Live Server in VS Code for development.

## 📋 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## 🎓 Code Structure

- `index.html` - Layout and UI elements
- `style.css` - Modern responsive styling with theme support
- `script.js` - Complete chess game logic and rules engine

## 📝 Notes

- All chess rules are fully implemented
- Games are not saved (refresh page starts new game)
- Difficulty levels and AI are not implemented
- Multiplayer is local (same device)

## 🤝 Contributing

Feel free to enhance this project with:
- AI opponent
- PGN file support
- Game replay functionality
- Online multiplayer
- Mobile app version

## 📄 License

This project is open source and available for educational and personal use.

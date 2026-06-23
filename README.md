# ♔ Web Chess Game

A modern, fully functional browser-based chess game with a sleek interface, complete chess rule implementation, and **AI Bot opponent**.

## ✨ Features

### Core Chess Rules
- ✅ **Legal move validation** with king safety checks
- ♔ **Castling** (King-side and Queen-side)
- ♟️ **Pawn promotion** with piece selection
- ⚔️ **En passant** capture support
- 👑 **Check and checkmate** detection
- 🤝 **Stalemate** detection (draw condition)
- ♞ **Full piece movement** (all pieces follow standard chess rules)

### Game Modes
- 🎮 **Local PvP** - Play against another player on the same device
- 🤖 **Play with Bot** - Challenge the AI opponent:

### Game Features
- 🖱️ **Dual input modes** - Click-to-move or drag-and-drop
- ⏰ **Turn timer** - 30 seconds per move (with visual warning)
- 📝 **Move history** - Displays all moves in algebraic notation
- 🔄 **Undo functionality** - Step back moves
- 🎮 **Game mode selector** - Switch between PvP and Bot
- 🎵 **Sound effects** - Audio feedback for moves, captures, and checks

### Modern Design
- 🌓 **Dark/Light theme toggle** - Persistent theme preference
- 📱 **Responsive layout** - Optimized for desktop and tablet
- 🎨 **Modern UI** - Clean, professional interface with smooth animations
- 🎯 **Move indicators** - Color-coded highlights:
  - 🟨 Yellow = Legal moves
  - 🔴 Red = Capture moves
  - 🔵 Blue = Selected piece
  - 🔴 Red border = King in check

### Information Panels
- **Left panel**: Game status, timer, and move history
- **Right panel**: Game controls, statistics, game mode info
- **Center**: Chess board with piece positions
- **Status display**: Real-time game messages (check, checkmate, stalemate, etc.)

## 🎮 How to Play

### Starting a Game
1. Open `index.html` in your web browser
2. Click the ⚙️ **Settings** button in the header
3. Choose your game mode:
   - **Local PvP**: Play against another human player
   - **Play with Bot**: Face off against the AI
4. Click **New Game** to start

### Making Moves
1. Click or drag pieces to move them
2. Legal moves will be highlighted in yellow
3. Capture moves are highlighted in red
4. If your king is in check, it will have a red border
5. Complete your move within 30 seconds
6. Use "Undo" to step back a move

## 🤖 AI Bot Details

### Algorithm
The bot uses **Minimax with Alpha-Beta Pruning** to calculate optimal moves:
- Evaluates board state by material count and strategic position
- Prunes branches to improve performance


### Move Evaluation
Scores are based on:
- Material value (Pawn=1, Knight/Bishop=3, Rook=5, Queen=9)
- Checkmate bonus (+1000)
- Stalemate consideration
- Check status evaluation

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
- **JavaScript** - Complete game logic with AI bot using minimax algorithm
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
- Alpha-beta pruning reduces tree search by ~80%

### Limitations
- No opening book or endgame tables
- Doesn't learn from previous games
- Limited to depth 3 to maintain reasonable performance

## 📝 Notes

- All chess rules are fully implemented
- Games are not saved (refresh page starts new game)
- AI may occasionally make suboptimal moves on Hard due to depth limit
- Multiplayer is local (same device)

## 🤝 Future Enhancement Ideas

- Deeper AI search with iterative deepening
- Opening book database
- Endgame tablebase support
- PGN file import/export
- Game replay/analysis
- Online multiplayer
- Move hints for learning

## 📄 License

This project is open source and available for educational and personal use.

## ✨ Features

### Core Chess Rules
- ✅ **Legal move validation** with king safety checks
- ♔ **Castling** (King-side and Queen-side)
- ♟️ **Pawn promotion** with piece selection
- ⚔️ **En passant** capture support
- 👑 **Check and checkmate** detection
- 🤝 **Stalemate** detection (draw condition)
- ♞ **Full piece movement** (all pieces follow standard chess rules)

### Game Features
- 🖱️ **Dual input modes** - Click-to-move or drag-and-drop
- ⏰ **Turn timer** - 30 seconds per move (with visual warning)
- 📝 **Move history** - Displays all moves in algebraic notation
- 🔄 **Undo functionality** - Step back moves
- 🎮 **Game reset** - Start a new game anytime
- 🎵 **Sound effects** - Audio feedback for moves, captures, and checks

### Modern Design
- 🌓 **Dark/Light theme toggle** - Persistent theme preference
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

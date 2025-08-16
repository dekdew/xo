class XOGame {
  constructor() {
    this.board = Array(9).fill("");
    this.currentPlayer = Math.random() < 0.5 ? "X" : "O"; // Random starter
    this.gameActive = true;
    this.scoreX = 0;
    this.scoreO = 0;
    this.turn = 1;
    this.currentRound = 1;
    this.maxRounds = 5;
    this.lastWinner = null; // Track last winner
    this.maxChips = 3; // Maximum chips per player
    this.playerMoves = { X: [], O: [] }; // Track move order for each player
    this.gameMode = "pvp"; // "pvp" or "bot"
    this.isPlayerTurn = true; // For bot mode

    this.winningConditions = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    this.setupModeSelection();
  }

  setupModeSelection() {
    const modeSelection = document.getElementById("modeSelection");
    const gameContainer = document.getElementById("gameContainer");
    const pvpButton = document.getElementById("pvpMode");
    const botButton = document.getElementById("botMode");

    pvpButton.addEventListener("click", () => {
      this.gameMode = "pvp";
      this.startGame();
    });

    botButton.addEventListener("click", () => {
      this.gameMode = "bot";
      this.currentPlayer = "X"; // Player always starts as X in bot mode
      this.startGame();
    });
  }

  startGame() {
    const modeSelection = document.getElementById("modeSelection");
    const gameContainer = document.getElementById("gameContainer");
    
    modeSelection.style.display = "none";
    gameContainer.style.display = "block";
    
    this.updatePlayerDisplays();
    this.initializeGame();
  }

  getPlayerEmoji(player) {
    if (player === "X") {
      return "🐱";
    } else {
      return this.gameMode === "bot" ? "🤖" : "🐶";
    }
  }

  updatePlayerDisplays() {
    // Update the corner score displays
    const playerXEmoji = document.querySelector("#playerXScore .player-emoji");
    const playerOEmoji = document.querySelector("#playerOScore .player-emoji");
    
    playerXEmoji.textContent = this.getPlayerEmoji("X");
    playerOEmoji.textContent = this.getPlayerEmoji("O");
  }

  initializeGame() {
    this.cells = document.querySelectorAll(".cell");
    this.gameStatusDisplay = document.getElementById("gameStatus");
    this.resetButton = document.getElementById("resetButton");
    this.resetSeriesButton = document.getElementById("resetSeriesButton");
    this.nextRoundButton = document.getElementById("nextRoundButton");
    this.scoreXDisplay = document.getElementById("scoreX");
    this.scoreODisplay = document.getElementById("scoreO");
    this.turnDisplay = document.getElementById("turnCount");
    this.roundIcons = [
      document.getElementById("round1"),
      document.getElementById("round2"),
      document.getElementById("round3"),
      document.getElementById("round4"),
      document.getElementById("round5"),
    ];
    this.container = document.querySelector(".container");
    this.playerXScore = document.getElementById("playerXScore");
    this.playerOScore = document.getElementById("playerOScore");

    this.cells.forEach((cell) => {
      cell.addEventListener("click", this.handleCellClick.bind(this));
    });

    this.resetButton.addEventListener("click", this.surrender.bind(this));
    this.resetSeriesButton.addEventListener(
      "click",
      this.resetSeries.bind(this)
    );
    this.nextRoundButton.addEventListener("click", this.nextRound.bind(this));

    // Set initial container class for starting player
    this.container.className = `container player-${this.currentPlayer.toLowerCase()}`;
    
    this.updateDisplay();
    this.updateRoundHighlight();
  }

  handleCellClick(event) {
    const cell = event.target;
    const cellIndex = parseInt(cell.getAttribute("data-index"));

    if (this.board[cellIndex] !== "" || !this.gameActive) {
      return;
    }

    // Prevent clicks during bot turn
    if (this.gameMode === "bot" && this.currentPlayer === "O") {
      return;
    }

    this.makeMove(cellIndex, cell);
  }

  makeMove(index, cell) {
    // Check if player already has maximum chips
    if (this.playerMoves[this.currentPlayer].length >= this.maxChips) {
      // Remove the oldest chip
      const oldestMoveIndex = this.playerMoves[this.currentPlayer].shift();
      this.removeChip(oldestMoveIndex);
    }

    // Place new chip
    this.board[index] = this.currentPlayer;
    cell.textContent = this.getPlayerEmoji(this.currentPlayer);
    cell.classList.add(this.currentPlayer.toLowerCase());

    // Add this move to player's move history
    this.playerMoves[this.currentPlayer].push(index);

    // Add visual indicator for newest chip
    this.updateChipVisuals();

    if (this.checkWinner()) {
      this.handleGameEnd("win");
    } else {
      this.switchPlayer();
    }
  }

  removeChip(index) {
    const cell = this.cells[index];
    this.board[index] = "";
    cell.textContent = "";
    cell.classList.remove("x", "o", "disabled", "oldest", "newest");
  }

  updateChipVisuals() {
    // Reset all chip visual states
    this.cells.forEach((cell) => {
      cell.classList.remove("oldest", "newest", "current-player-turn");
    });

    // Mark oldest and newest chips for both players
    ["X", "O"].forEach((player) => {
      const moves = this.playerMoves[player];
      if (moves.length > 0) {
        // Mark oldest chip
        if (moves.length === this.maxChips) {
          this.cells[moves[0]].classList.add("oldest");
          // Add blinking only for current player's oldest chip
          if (player === this.currentPlayer) {
            this.cells[moves[0]].classList.add("current-player-turn");
          }
        }
        // Mark newest chip
        this.cells[moves[moves.length - 1]].classList.add("newest");
      }
    });
  }

  checkWinner() {
    for (let condition of this.winningConditions) {
      const [a, b, c] = condition;
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        // Highlight winning cells
        condition.forEach((index) => {
          this.cells[index].classList.add("winning");
        });

        return true;
      }
    }
    return false;
  }

  checkDraw() {
    return this.board.every((cell) => cell !== "");
  }

  handleGameEnd(result) {
    this.gameActive = false;

    if (result === "win") {
      const winner = this.currentPlayer;
      const winnerEmoji = this.getPlayerEmoji(winner);
      this.gameStatusDisplay.innerHTML = `<span class="winner-announcement">🎉 ${winnerEmoji} Wins! 🎉</span>`;

      // Store winner for next game starting player
      this.lastWinner = winner;

      // Update round icon with winner
      this.updateRoundIcon(winner);

      // Update based on turn number with count up effect
      const points = this.turn;
      if (winner === "X") {
        this.animateScoreUpdate(
          this.scoreX,
          this.scoreX + points,
          this.scoreXDisplay
        );
        this.scoreX += points;
      } else {
        this.animateScoreUpdate(
          this.scoreO,
          this.scoreO + points,
          this.scoreODisplay
        );
        this.scoreO += points;
      }

      // Update crown display after score update
      this.updateCrown();
      this.showNextRoundButton();
    } else if (result === "draw") {
      this.gameStatusDisplay.innerHTML =
        '<span class="draw-announcement">🤝 Draw! 🤝</span>';
      // Update round icon for draw (keep as sword)
      this.showNextRoundButton();
    }

    // Disable all cells and stop blinking
    this.cells.forEach((cell) => {
      cell.classList.add("disabled");
      cell.classList.remove("current-player-turn", "oldest", "newest");
    });

    // Remove active highlights from player scores
    this.playerXScore.classList.remove("active");
    this.playerOScore.classList.remove("active");

    // Hide surrender button and show reset series button
    this.resetButton.style.display = "none";
    this.resetSeriesButton.style.display = "inline-block";
  }
  switchPlayer() {
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    this.turn++;
    this.updateDisplay();
    this.updateChipVisuals(); // Update blinking for new current player
    
    // Bot move in bot mode
    if (this.gameMode === "bot" && this.currentPlayer === "O" && this.gameActive) {
      setTimeout(() => {
        this.makeBotMove();
      }, 500); // Small delay for better UX
    }
  }

  updateDisplay() {
    this.turnDisplay.textContent = this.turn;

    // Update active player highlight
    this.playerXScore.classList.toggle("active", this.currentPlayer === "X");
    this.playerOScore.classList.toggle("active", this.currentPlayer === "O");

    // Update crown for player with higher score
    this.updateCrown();

    // Update container background based on current player
    this.container.className = `container player-${this.currentPlayer.toLowerCase()}`;

    if (this.gameActive) {
      this.gameStatusDisplay.innerHTML = `Turn<br><span id="turnCount">${this.turn}</span>`;
      // Re-get references since innerHTML was updated
      this.turnDisplay = document.getElementById("turnCount");
    }
  }

  updateCrown() {
    const playerXEmoji = this.playerXScore.querySelector(".player-emoji");
    const playerOEmoji = this.playerOScore.querySelector(".player-emoji");

    playerXEmoji.classList.remove("winner");
    playerOEmoji.classList.remove("winner");

    if (this.scoreX > this.scoreO) {
      playerXEmoji.classList.add("winner");
    } else if (this.scoreO > this.scoreX) {
      playerOEmoji.classList.add("winner");
    }
  }

  resetGame() {
    this.board = Array(9).fill("");

    // Loser plays first in next game (or random if no previous winner)
    if (this.lastWinner) {
      this.currentPlayer = this.lastWinner === "X" ? "O" : "X"; // Loser starts
    } else {
      this.currentPlayer = Math.random() < 0.5 ? "X" : "O"; // Random if first game
    }

    this.gameActive = true;
    this.turn = 1;
    this.playerMoves = { X: [], O: [] }; // Reset move history

    this.cells.forEach((cell) => {
      cell.textContent = "";
      cell.className = "cell";
    });

    this.updateDisplay();
  }

  showNextRoundButton() {
    if (this.currentRound >= this.maxRounds) {
      // Series ended, show final winner
      let finalWinner;
      if (this.scoreX > this.scoreO) {
        finalWinner = `${this.getPlayerEmoji("X")} Wins! 🎉`;
      } else if (this.scoreO > this.scoreX) {
        finalWinner = `${this.getPlayerEmoji("O")} Wins! 🎉`;
      } else {
        finalWinner = "Tied! 🤝";
      }

      this.gameStatusDisplay.innerHTML = `<span class="winner-announcement">${finalWinner}</span>`;
    } else {
      // Show next round button
      this.nextRoundButton.style.display = "inline-block";
    }
  }

  surrender() {
    if (this.gameActive) {
      // Current player loses by surrendering
      const loser = this.currentPlayer;
      const winner = loser === "X" ? "O" : "X";
      const winnerEmoji = this.getPlayerEmoji(winner);
      const loserEmoji = this.getPlayerEmoji(loser);

      this.gameStatusDisplay.innerHTML = `<span class="winner-announcement">🏳️ ${winnerEmoji} Wins! 🎉</span>`;

      // Store winner for next game starting player
      this.lastWinner = winner;

      // Update round icon with winner
      this.updateRoundIcon(winner);

      // Award points to winner (full points for surrender)
      const points = 9; // Maximum points for surrender
      if (winner === "X") {
        this.animateScoreUpdate(
          this.scoreX,
          this.scoreX + points,
          this.scoreXDisplay
        );
        this.scoreX += points;
      } else {
        this.animateScoreUpdate(
          this.scoreO,
          this.scoreO + points,
          this.scoreODisplay
        );
        this.scoreO += points;
      }

      this.gameActive = false;

      // Hide surrender button and show reset series button
      this.resetButton.style.display = "none";
      this.resetSeriesButton.style.display = "inline-block";

      // Disable all cells
      this.cells.forEach((cell) => {
        cell.classList.add("disabled");
        cell.classList.remove("current-player-turn", "oldest", "newest");
      });

      // Remove active highlights from player scores
      this.playerXScore.classList.remove("active");
      this.playerOScore.classList.remove("active");

      // Update crown display after score update
      setTimeout(() => {
        this.updateCrown();
      }, 900);
      this.showNextRoundButton();
    }
  }

  resetSeries() {
    this.scoreX = 0;
    this.scoreO = 0;
    this.currentRound = 1;
    this.lastWinner = null;
    this.scoreXDisplay.textContent = this.scoreX;
    this.scoreODisplay.textContent = this.scoreO;
    this.nextRoundButton.style.display = "none";
    this.resetSeriesButton.style.display = "none";
    this.resetButton.style.display = "inline-block";
    // Reset round icons
    this.roundIcons.forEach((icon) => {
      icon.textContent = "⚔️";
    });
    this.resetGame();
    this.updateRoundHighlight();
  }

  nextRound() {
    this.currentRound++;
    this.nextRoundButton.style.display = "none";
    this.resetSeriesButton.style.display = "none";
    this.resetButton.style.display = "inline-block";
    this.resetGame();
    this.updateRoundHighlight();
  }

  updateRoundIcon(winner) {
    const roundIndex = this.currentRound - 1;
    if (roundIndex >= 0 && roundIndex < this.roundIcons.length) {
      const winnerEmoji = this.getPlayerEmoji(winner);
      this.roundIcons[roundIndex].textContent = winnerEmoji;
    }
  }

  updateRoundHighlight() {
    // Remove highlight from all round icons
    this.roundIcons.forEach(icon => {
      icon.classList.remove("current-round");
    });
    
    // Add highlight to current round
    const currentRoundIndex = this.currentRound - 1;
    if (currentRoundIndex >= 0 && currentRoundIndex < this.roundIcons.length) {
      this.roundIcons[currentRoundIndex].classList.add("current-round");
    }
  }

  resetScore() {
    this.scoreX = 0;
    this.scoreO = 0;
    this.scoreXDisplay.textContent = this.scoreX;
    this.scoreODisplay.textContent = this.scoreO;
    // Reset round icons
    this.roundIcons.forEach((icon) => {
      icon.textContent = "⚔️";
    });
  }

  animateScoreUpdate(fromScore, toScore, displayElement) {
    const duration = 800; // Animation duration in ms
    const steps = 30; // Number of animation steps
    const stepDuration = duration / steps;
    const increment = (toScore - fromScore) / steps;

    let currentScore = fromScore;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      currentScore += increment;

      if (step >= steps) {
        currentScore = toScore;
        displayElement.textContent = Math.round(currentScore);
        displayElement.classList.remove("score-updating");
        clearInterval(timer);
      } else {
        displayElement.textContent = Math.round(currentScore);
        displayElement.classList.add("score-updating");
      }
    }, stepDuration);
  }

  // Bot AI Methods
  makeBotMove() {
    if (!this.gameActive) return;

    const availableMoves = this.getAvailableMoves();
    if (availableMoves.length === 0) return;

    let bestMove = this.getBestMove();
    
    // If no strategic move found, pick random
    if (bestMove === -1) {
      bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    const cell = this.cells[bestMove];
    this.makeMove(bestMove, cell);
  }

  getAvailableMoves() {
    return this.board
      .map((cell, index) => cell === "" ? index : null)
      .filter(index => index !== null);
  }

  getBestMove() {
    // 1. Try to win
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === "") {
        this.board[i] = "O";
        if (this.checkWinnerForPlayer("O")) {
          this.board[i] = "";
          return i;
        }
        this.board[i] = "";
      }
    }

    // 2. Block player from winning
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === "") {
        this.board[i] = "X";
        if (this.checkWinnerForPlayer("X")) {
          this.board[i] = "";
          return i;
        }
        this.board[i] = "";
      }
    }

    // 3. Take center if available
    if (this.board[4] === "") {
      return 4;
    }

    // 4. Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => this.board[i] === "");
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // 5. Take edges
    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter(i => this.board[i] === "");
    if (availableEdges.length > 0) {
      return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }

    return -1;
  }

  checkWinnerForPlayer(player) {
    return this.winningConditions.some(condition => 
      condition.every(index => this.board[index] === player)
    );
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new XOGame();
});

// Add some fun sound effects (optional)
function playSound(type) {
  // You can add sound effects here if desired
  // For example: new Audio('click.mp3').play();
}

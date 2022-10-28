"use strict";

class Player {
    constructor(symbol, isHuman = true) {
        this.roundsWon = 0;
        if (!["X", "O"].includes(symbol)) {
            throw new Error("Player symbol must be X or Y");
        }
        this.symbol = symbol;
        this.piecesPlayed = 0;
        this.lastPiecePlayed = { "x": null, "y": null };
        this.isHuman = isHuman;
    }
    setToHuman() { this.isHuman = true; };
    setToAI() { this.isHuman = false; };
    toString() { return `Player ${this.symbol}`; }
    resetPiecesPlayed() { this.piecesPlayed = 0; }
    addWin() { this.roundsWon++; }
    getRoundsWon() { return this.roundsWon; }
    getSymbol() { return this.symbol; }
    playMove(x, y, board = gameBoard, HTMLdisplayed = true) {
        const attemptSuccesful = board.insert(x, y, this.symbol, HTMLdisplayed);
        if (attemptSuccesful) {
            this.piecesPlayed++;
            this.lastPiecePlayed["x"] = x;
            this.lastPiecePlayed["y"] = y;
            return true;
        }
        return false;
    }

    resetAll() {
        this.roundsWon = 0;
        this.piecesPlayed = 0;
        this.lastPiecePlayed = { "x": null, "y": null };
        this.isHuman = true;
    }
    getLastPiecePlayed() { return this.lastPiecePlayed; }
    getIsHuman() { return this.isHuman; }
}

// controls the board (backend) - get, set and reset
const gameBoard = (() => {
    const STARTING_CONFIGURATION = [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
    ];
    const N_COLS = STARTING_CONFIGURATION.length;
    const N_ROWS = STARTING_CONFIGURATION[0].length;
    // pass by value
    let board = STARTING_CONFIGURATION.map((arr) => {
        return arr.slice();
    });
    const cellCount = board.flat(Infinity).length;
    let piecesOnBoard = 0;
    let boardState = "inplay";
    let winner = null;
    let savedBoardState = {};

    const saveBoardState = () => {
        savedBoardState["board"] = board.map((arr) => {
            return arr.slice();
        });
        savedBoardState["boardState"] = boardState;
    }

    const loadSavedBoardState = () => {
        board = savedBoardState["board"];
        boardState = savedBoardState["boardState"];
    }

    const getWinner = () => { return winner; }

    const getBoard = () => { return board; };

    // log the board
    const printBoard = () => {
        let textToPrint = "";
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                const cellState = (board[i][j] === "") ? ' ' : board[i][j];
                textToPrint += '[' + cellState + ']';
            }
            textToPrint += "\n";
        }
        console.log(textToPrint);
    };

    // check that the board has no symbols
    const isEmpty = () => {
        for (let i = 0; i < N_ROWS; i++) {
            for (let j = 0; j < N_COLS; j++) {
                if (board[i][j] !== "") {
                    return false;
                }
            }
        }
        return true;
    }

    // check that the board only has symbols
    const isFull = () => {
        for (let i = 0; i < N_ROWS; i++) {
            for (let j = 0; j < N_COLS; j++) {
                if (board[i][j] === "") {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Inserts a symbol into a board cell
     * @param {String} symbol
     * @param {Number} x row index
     * @param {Number} y col index
     * @return {Boolean} successful insertion
     */
    const insert = (x, y, symbol, HTMLdisplayed = true) => {
        if (x < 0 || x > N_ROWS || y < 0 || y > N_COLS) {
            throw new Error("Cell row or column argument does not exist, use an x or y in-between 0 and 2")
        }
        if (symbol !== "X" && symbol !== "O") {
            throw new Error("Symbol argument does not exist, use X or O")
        }
        if (boardState !== "inplay") {
            throw new Error("Cannot insert symbol when game is over");
        }
        if (board[x][y] === "") {
            board[x][y] = symbol;
            if (HTMLdisplayed) {
                displayController.updateBoardPiece(x, y, symbol);
            }
            piecesOnBoard++;
            return true;
        }
        return false;
    }

    const clearCell = (x, y, reverseEndGame = true, HTMLdisplayed = false) => {
        board[x][y] = "";
        if (HTMLdisplayed) {
            displayController.updateBoardPiece(x, y, "");
        }
        piecesOnBoard--;
        if (reverseEndGame) {
            boardState = "inplay";
            winner = null;
        }
    }

    // Return all possible x,y coordinates containing the available moves for the current board state
    const getPossibleMoves = () => {
        if (boardState !== "inplay") return [];

        const possibleMoves = [];
        for (let i = 0; i < N_ROWS; i++) {
            for (let j = 0; j < N_COLS; j++) {
                if (board[i][j] === "") {
                    possibleMoves.push({ "x": i, "y": j });
                }
            }
        }

        return possibleMoves;
    }


    // update the board's current state
    const updateBoardState = (lastPlayer) => {
        if (winnerOnBoard(lastPlayer)) {
            boardState = "won";
        } else if (isFull()) {
            boardState = "tied";
        } else {
            boardState = "inplay";
        }
    }

    // check if a winner is on board
    const winnerOnBoard = (lastPlayer) => {
        const lastPiece = lastPlayer.getLastPiecePlayed();
        if (hasHorizontalWin(lastPiece) || hasVerticalWin(lastPiece) || hasDiagonalWin()) {
            winner = lastPlayer;
            return true;
        }
        return false;
    }

    // check for a horizontal tic-tac-toe
    const hasHorizontalWin = (lastPiece) => {
        const x = lastPiece["x"];
        for (let i = 1; i < board[x].length; i++) {
            if (board[x][0] !== board[x][i] || board[x][0] === "") {
                return false;
            }
        }
        return true;
    };

    // check for is a vertical tic-tac-toe
    const hasVerticalWin = (lastPiece) => {
        const y = lastPiece["y"];
        for (let i = 1; i < board.length; i++) {
            if (board[i][y] !== board[0][y] || board[i][y] === "") {
                return false;
            }
        }
        return true;
    }

    // check for is a diagonal tic-tac-toe
    const hasDiagonalWin = () => {
        let leftDiagonalWin = true;
        let rightDiagonalWin = true;
        // check left to right diagonal
        for (let y = 1; y < board.length; y++) {
            if (board[y][y] !== board[0][0] || board[0][0] === "") {
                leftDiagonalWin = false;
                break;
            }
        }

        // check right to left diagonal
        let x = board.length - 2;
        for (let y = 1; y < board.length && x >= 0; y++, x--) {
            if (board[y][x] !== board[0][board.length - 1] || board[y][x] === "") {
                rightDiagonalWin = false;
                break;
            }
        }
        return leftDiagonalWin || rightDiagonalWin;
    }

    // reset the board
    const reset = () => {
        //pass by value
        board = STARTING_CONFIGURATION.map((arr) => {
            return arr.slice();
        });
        piecesOnBoard = 0;
        boardState = "inplay";
        winner = null;
        savedBoardState = {};
    };

    const getCellCount = () => { return cellCount; };
    const getPiecesOnBoard = () => { return piecesOnBoard; };
    const getBoardState = () => { return boardState; };
    const resetBoardState = () => { boardState = "inplay"; };

    return { reset, clearCell, getWinner, printBoard, getPossibleMoves, insert, saveBoardState, loadSavedBoardState, getBoard, getCellCount, getPiecesOnBoard, getBoardState, updateBoardState, resetBoardState };
})();


// controls the display (frontend) - updates html, displays messages
const displayController = (() => {

    const messageDiv = document.getElementById("message");
    const roundHTML = document.querySelector("#round");
    const cells = document.querySelectorAll(".cell");

    const resetBoard = () => {
        for (let i = 0; i < cells.length; i++) {
            cells[i].textContent = "";
        }
    }

    const updateBoardPiece = (x, y, symbol) => {
        const cellDiv = document.querySelector(`.cell[data-row="${x}"][data-col="${y}"]`);
        cellDiv.textContent = symbol;
    }

    const updateRound = (roundNumber) => {
        roundHTML.textContent = roundNumber;
    }

    const updateScore = (lastPlayer) => {
        const symbol = lastPlayer.symbol;
        const playerScoreHTML = document.querySelector(`#player-${symbol}-score`);
        playerScoreHTML.textContent = lastPlayer.getRoundsWon();
    }

    const displayTurnMessage = (player) => {
        messageDiv.textContent = `${player}'s turn`;
    }

    const displayEndRoundMessage = (winner) => {
        messageDiv.textContent = `${winner} wins! Click on new round!`;
    }

    return { resetBoard, updateBoardPiece, updateRound, updateScore, displayTurnMessage, displayEndRoundMessage };
})();

const introController = (() => {
    const introUIDiv = document.getElementById("intro-UI");
    const gameUIDiv = document.getElementById("game-UI");
    const aiModeBtn = document.getElementById("ai-mode");
    const humanModeBtn = document.getElementById("human-mode");
    const chooseXBtn = document.getElementById("choose-X");
    const chooseOBtn = document.getElementById("choose-O");
    const finishBtn = document.getElementById("finish-intro-btn");
    let chosenGameMode = "";
    let chosenSymbol = "";

    const reset = () => {
        chosenGameMode = "";
        chosenSymbol = "";
        aiModeBtn.classList.remove("selected");
        humanModeBtn.classList.remove("selected");
        chooseXBtn.classList.remove("selected");
        chooseOBtn.classList.remove("selected");
        introUIDiv.classList.remove("hidden");
        gameUIDiv.classList.add("hidden");
    }

    // get an adjacent html sibling, assuming there are only two siblings.
    const getAdjacentSibling = (e) => {
        const el = e.target;
        let prevSibling = el.previousElementSibling;
        let nextSibling = el.nextElementSibling;
        if (prevSibling && nextSibling) {
            throw new Error("There are adjacent siblings on each side")
        } else if (prevSibling) {
            return prevSibling;
        } else if (nextSibling) {
            return nextSibling;
        }
        throw new Error("There are no adjacent siblings")
    }

    // highlight and unhighlight adjacent buttons for each mode
    const highlightSelected = (e) => {
        e.target.classList.toggle("selected");
        const adjacentSibling = getAdjacentSibling(e);
        if (adjacentSibling.classList.contains("selected")
            && e.target.classList.contains("selected")) {
            adjacentSibling.classList.toggle("selected");
        }
        updateSelection(e.target.parentElement, e.target);
    }

    // retrieve player's clicked mode settings
    const updateSelection = (selectorTypeEle, selectedEle) => {
        if (selectorTypeEle.id === "game-mode-selector") {
            chosenGameMode = selectedEle.id;
        } else if (selectorTypeEle.id === "symbol-selector") {
            chosenSymbol = (selectedEle.id === "choose-O") ? "O" : "X";
        } else {
            throw new Error("Invalid parent element")
        }
    }

    // move to the game element of the UI
    const endIntroDisplay = () => {
        if (chosenGameMode && chosenSymbol) {
            introUIDiv.classList.toggle("hidden");
            gameUIDiv.classList.toggle("hidden");
            gameController.newGame(chosenSymbol, chosenGameMode);
        }
    }

    aiModeBtn.addEventListener("click", highlightSelected);
    humanModeBtn.addEventListener("click", highlightSelected);
    chooseXBtn.addEventListener("click", highlightSelected);
    chooseOBtn.addEventListener("click", highlightSelected);
    finishBtn.addEventListener("click", endIntroDisplay);

    return { reset };
})();

// controls the flow - start, restart, play piece, player turn, end game (tie, win), update scores
const gameController = (() => {
    const playerX = new Player("X");
    const playerO = new Player("O");
    const players = [playerX, playerO];
    let currentPlayer = null;
    let roundsPlayed = 0;
    const cells = document.querySelectorAll(".cell");
    const newGameBtn = document.querySelector("#new-game");
    const newRoundBtn = document.querySelector("#new-round");

    cells.forEach((cell) =>
        cell.addEventListener("click", (e) => {
            const x = e.target.dataset.row;
            const y = e.target.dataset.col;
            if (currentPlayer.playMove(x, y)) {
                moveGameForward(currentPlayer);
            }
        })
    );

    // keep the game moving if the board state is in play
    const moveGameForward = (lastPlayer) => {
        gameBoard.updateBoardState(lastPlayer)
        if (gameBoard.getBoardState() !== "inplay") {
            endRound(lastPlayer);
        } else {
            nextTurn();
        }
    }

    // at the end of each round, update round and player statistics
    const endRound = (lastPlayer) => {
        if (gameBoard.getBoardState() === "won") {
            lastPlayer.addWin();
            displayController.updateScore(lastPlayer);
            displayController.displayEndRoundMessage(lastPlayer);
        }
    }

    // Update display and open the floor to the player or AI to make a move
    const nextTurn = (firstTurn = false) => {
        if (!firstTurn) {
            currentPlayer = (currentPlayer === playerX) ? playerO : playerX;
        }
        displayController.displayTurnMessage(currentPlayer);
        if (!currentPlayer.getIsHuman()) {
            const coord = getComputerPlay();
            currentPlayer.playMove(coord["x"], coord["y"], gameBoard);
            moveGameForward(currentPlayer);
        }
    }

    // Start a new round by randomly deciding who goes first, resetting the board, display and players
    // as well as updating the number of rounds played and display for whose turn it is and the current round number.
    const newRound = () => {
        currentPlayer = players[Math.round(Math.random())];
        gameBoard.reset();
        displayController.resetBoard();
        playerX.resetPiecesPlayed();
        playerO.resetPiecesPlayed();
        roundsPlayed++;
        displayController.updateRound(roundsPlayed);
        displayController.displayTurnMessage(currentPlayer);
        if (!currentPlayer.getIsHuman()) {
            nextTurn(true);
        }
    }

    // Get the AI's current play based on minimax. The board is saved and reloaded since it will
    // be modified in miniMax
    const getComputerPlay = () => {
        gameBoard.saveBoardState();
        const bestMoveCoord = miniMax(gameBoard, currentPlayer);
        gameBoard.loadSavedBoardState();
        return bestMoveCoord["coord"];
    }

    // begin a new game by resetting players, board and the display, and then beginning a new round
    const newGame = (playerSymbol, gameMode) => {
        playerO.resetAll();
        playerX.resetAll();
        updatePlayerSettings(playerSymbol, gameMode);
        roundsPlayed = 0;
        displayController.updateRound(roundsPlayed);
        displayController.updateScore(playerO);
        displayController.updateScore(playerX);
        newRound();
    }

    // change player configurations based on new settings
    const updatePlayerSettings = (playerSymbol, gameMode) => {
        if (gameMode === "ai-mode") {
            if (playerSymbol === "X") {
                playerO.setToAI();
            } else if (playerSymbol === "O") {
                playerX.setToAI();
            } else {
                throw new Error(`Invalid player symbol ${playerSymbol}`);
            }
        } else if (gameMode === "human-mode") {
            playerO.setToHuman();
            playerX.setToHuman();
        } else {
            throw new Error(`Invalid game mode ${gameMode}`);
        }
    }

    // get the player based on the type requested, assuming there can only be one AI
    const getPlayer = (type) => {
        if ((playerX.getIsHuman() && type === "human")
            || !playerX.getIsHuman() && type === "ai") {
            return playerX;
        } else {
            return playerO;
        }
    }

    /**
     * Retrieves the best possible move for the AI
     * @param {Board} simBoard
     * @param {Player} player
     * @return {"score": Number,
     *          "coord": {"x": Number, "y": Number}}
     */
    const miniMax = (simBoard, player) => {
        const BASE_SCORE = 10;
        let availCoords = simBoard.getPossibleMoves();
        let possibleWinner = simBoard.getWinner();
        if (possibleWinner && possibleWinner.getIsHuman()) {
            return { "score": -BASE_SCORE };
        } else if (possibleWinner && !possibleWinner.getIsHuman()) {
            return { "score": BASE_SCORE };
        } else if (simBoard.getBoardState() === "tied") {
            return { "score": 0 };
        }
        let moves = [];
        for (const coord of availCoords) {
            let move = {};
            let score;
            move["coord"] = { "x": coord["x"], "y": coord["y"] };
            player.playMove(coord["x"], coord["y"], simBoard, false);
            simBoard.updateBoardState(player);

            if (!player.getIsHuman()) {
                score = miniMax(simBoard, getPlayer("human"))["score"];
            } else {
                score = miniMax(simBoard, getPlayer("ai"))["score"];
            }
            move["score"] = score;
            simBoard.clearCell(coord["x"], coord["y"]);
            moves.push(move);
        }

        const playerIsAI = !player.getIsHuman();
        return getBestWorseMove(moves, playerIsAI);
    }

    /**
     * Based on the list of available moves, return the best or worse
     * @param {Array} moves // all possible moves with scores and coordinates
     * @param {Boolean} isBestMove
     * @return {"score": Number,
     *          "coord": {"x": Number, "y": Number}} // the best or worse move
     */
    const getBestWorseMove = (moves, isBestMove) => {
        const BASE_SCORE = 10;
        let bestMove = null;
        if (isBestMove) {
            let bestScore = -BASE_SCORE;
            for (const move of moves) {
                if (move["score"] >= bestScore) {
                    bestScore = move["score"];
                    bestMove = move;
                }
            }
        } else {
            let bestScore = BASE_SCORE;
            for (const move of moves) {
                if (move["score"] <= bestScore) {
                    bestScore = move["score"];
                    bestMove = move;
                }
            }
        }
        return bestMove;
    }

    newGameBtn.onclick = introController.reset;
    newRoundBtn.onclick = newRound;

    return { moveGameForward, nextTurn, newRound, endRound, newGame };
})();

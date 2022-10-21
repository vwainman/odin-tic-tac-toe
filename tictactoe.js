"use strict";

class Player {
    constructor(pieceType, isHuman = true) {
        this.roundsWon = 0;
        this.pieceType = pieceType;
        this.piecesPlayed = 0;
        this.lastPiecePlayed = { "x": null, "y": null };
        this.isHuman = isHuman;
    }
    toString() { return `Player ${this.pieceType}`; }
    resetPiecesPlayed() { this.piecesPlayed = 0; }
    addWin() { this.roundsWon++; }
    getRoundsWon() { return this.roundsWon; }
    getPieceType() { return this.pieceType; }
    playPieceSuccess(x, y) {
        const attemptSuccesful = gameBoard.setPiece(x, y, this.pieceType);
        if (attemptSuccesful) {
            this.piecesPlayed++;
            this.lastPiecePlayed["x"] = x;
            this.lastPiecePlayed["y"] = y;
            return true;
        }
        return false;
    }
    optimalPlay() {
        // 1. try to find a one piece away tic-tac-toe
        // 2. if none can be found, try to find if the opponent is near a tic-tac-toe
        // 3.
    }
    resetAll() {
        this.roundsWon = 0;
        this.piecesPlayed = 0;
        this.lastPiecePlayed = { "x": null, "y": null };
    }
    getLastPiecePlayed() { return this.lastPiecePlayed; }
    playerIsHuman() { return this.isHuman; }
}

// controls the board (backend) - get, set and reset
const gameBoard = (() => {
    const STARTING_CONFIGURATION = [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
    ];
    // pass by value
    let board = STARTING_CONFIGURATION.map((arr) => {
        return arr.slice();
    });
    const cellCount = board.flat(Infinity).length;
    let piecesOnBoard = 0;
    let boardState = "inplay";

    const getBoard = () => { return board; };

    const setPiece = (rowIdx, colIdx, playerPiece) => {
        if (board[rowIdx][colIdx] === "" && boardState === "inplay") {
            board[rowIdx][colIdx] = playerPiece;
            displayController.updateBoardPiece(rowIdx, colIdx, playerPiece);
            piecesOnBoard++;
            return true;
        }
        return false;
    }

    const roundOver = (lastPlayer) => {
        if (winnerOnBoard(lastPlayer)) {
            boardState = "winner";
        } else if (piecesOnBoard === cellCount) {
            boardState = "tie";
        }
        return boardState === "winner" || boardState === "tie";
    }

    const winnerOnBoard = (lastPlayer) => {
        const lastPiece = lastPlayer.getLastPiecePlayed();
        if (hasHorizontalWin(lastPiece) || hasVerticalWin(lastPiece) || hasDiagonalWin()) {
            return true;
        }
        return false;
    }

    const hasHorizontalWin = (lastPiece) => {
        const x = lastPiece["x"];
        for (let i = 1; i < board[x].length; i++) {
            if (board[x][0] !== board[x][i] || board[x][0] === "") {
                return false;
            }
        }
        return true;
    };

    const hasVerticalWin = (lastPiece) => {
        const y = lastPiece["y"];
        for (let i = 1; i < board.length; i++) {
            if (board[i][y] !== board[0][y] || board[i][y] === "") {
                return false;
            }
        }
        return true;
    }

    const hasDiagonalWin = () => {
        let leftDiagonalWin = true;
        let rightDiagonalWin = true;
        // check left to right diagonal, if necessary
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

    const reset = () => {
        //pass by value
        board = STARTING_CONFIGURATION.map((arr) => {
            return arr.slice();
        });
        piecesOnBoard = 0;
        boardState = "inplay";
    };

    const logState = () => {
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                const cellState = (board[i][j] === "") ? ' ' : board[i][j];
                process.stdout.write('[' + cellState + ']');
            }
            console.log();
        }
        console.log();
    };

    const getCellCount = () => { return cellCount; };
    const getPiecesOnBoard = () => { return piecesOnBoard; };
    const getBoardState = () => { return boardState; };
    const resetBoardState = () => { boardState = "inplay"; };

    return { reset, logState, setPiece, getBoard, getCellCount, getPiecesOnBoard, getBoardState, roundOver, resetBoardState };
})();


// controls the display (frontend) - updates html, displays messages
const displayController = (() => {

    const messageDiv = document.getElementById("message");
    const roundHTML = document.querySelector("#round");
    const cells = document.querySelectorAll(".cell");

    const resetBoard = () => {
        console.log("RESET OCCURS");
        for (let i = 0; i < cells.length; i++) {
            cells[i].textContent = "";
        }
    }

    const updateBoardPiece = (x, y, playerPiece) => {
        const cellDiv = document.querySelector(`.cell[data-row="${x}"][data-col="${y}"]`);
        if (cellDiv.textContent === "") {
            cellDiv.textContent = playerPiece;
        }
    }

    const updateRound = (roundNumber) => {
        roundHTML.textContent = roundNumber;
    }

    const updateScore = (lastPlayer) => {
        const symbol = lastPlayer.pieceType;
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
            if (currentPlayer.playPieceSuccess(x, y)) {
                moveGameForward(currentPlayer);
            }
        })
    );

    const moveGameForward = (lastPlayer) => {
        if (gameBoard.roundOver(lastPlayer)) {
            endRound(lastPlayer);
        } else {
            nextTurn();
        }
    }

    const endRound = (lastPlayer) => {
        roundsPlayed++;
        displayController.updateRound(roundsPlayed);
        if (gameBoard.getBoardState() === "winner") {
            lastPlayer.addWin();
            displayController.updateScore(lastPlayer);
            displayController.displayEndRoundMessage(lastPlayer);
        }
    }

    const nextTurn = () => {
        currentPlayer = (currentPlayer === playerX) ? playerO : playerX;
        displayController.displayTurnMessage(currentPlayer);
    }

    const newRound = () => {
        currentPlayer = players[Math.round(Math.random())];
        gameBoard.reset();
        displayController.resetBoard();
        playerX.resetPiecesPlayed();
        playerO.resetPiecesPlayed();
        displayController.displayTurnMessage(currentPlayer);
    }

    const newGame = () => {
        playerO.resetAll();
        playerX.resetAll();
        roundsPlayed = 0;
        displayController.updateRound(roundsPlayed);
        displayController.updateScore(playerO);
        displayController.updateScore(playerX);
        newRound();
    }

    newGameBtn.onclick = newGame;
    newRoundBtn.onclick = newRound;

    return { moveGameForward, nextTurn, newRound, endRound, newGame };
})();

gameController.newGame();
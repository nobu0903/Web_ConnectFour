import { idiotComputerTurn, smartComputerTurn, createNewNode, minimax, isGameOver, evaluateBoard, evaluateLine } from "./computer.js";
import { dropPiece, checkWinner, showModeSelection } from "./gameLogic.js";
import { board, dropButton, currentPlayer, mode, virtualBoard, bestScore } from "./gameState.js";

// メソッド

// 盤面を作る（7列 × 6行）
function createBoard() {
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");//cssでスタイルを追加するためclass cellを追加
            cell.dataset.row = row;//data-rowっていうエレメントがhtmlにできる。 javascript内ではrow
            cell.dataset.col = col;//data-colっていうエレメントがhtmlにできる。 javascript内ではcol
            board.appendChild(cell);//cellをboardのChildとしてループして作る
        }
    }
}



function resetBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = ''; // 盤面を空にする
    createBoard(); // 新しい盤面を作成
    virtualBoard = Array.from({ length: 6 }, () => Array(7).fill(null)); // ここで再代入
    currentPlayer = 'red'; // ここで再代入
}

function isColumnFull(col) {
    const cell = document.querySelector(`.cell[data-row="0"][data-col="${col}"]`);
    return cell && (cell.classList.contains('red') || cell.classList.contains('yellow'));
}

export { createBoard, resetBoard, isColumnFull};
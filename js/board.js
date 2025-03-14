import * as gameState from './GameState.js';
import { updateTurn } from "./gameLogic.js";

// 盤面を作る（7列 × 6行）
export function createBoard() {
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

export function resetBoard() {
    const board = document.getElementById('board');
    board.innerHTML = ''; // 盤面を空にする
    createBoard(); // createBoardを呼び出して盤面を作り直す
    // virtualBoardもリセット
    gameState.resetVirtualBoard()
    gameState.resetCurrentPlayer();
    gameState.resetWinnerToNull()
    updateTurn(gameState.currentPlayer); // 現在のプレイヤーを更新
}

//board.js
export function isColumnFull(col) {
    const cell = document.querySelector(`.cell[data-row="0"][data-col="${col}"]`);
    return cell && (cell.classList.contains('red') || cell.classList.contains('yellow'));
}
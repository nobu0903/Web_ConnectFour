import { createBoard, resetBoard, isColumnFull } from "./board.js";
import { idiotComputerTurn, smartComputerTurn, createNewNode, minimax, isGameOver, evaluateBoard, evaluateLine } from "./computer.js";
import { dropPiece, checkWinner, showModeSelection } from "./gameLogic.js";
import { board, dropButton, currentPlayer, mode, virtualBoard, bestScore } from "./gameState.js";

createBoard();

//play with computer と一緒だから変えないといけない
document.querySelector('.play-with-friend').addEventListener('click', () => {
    resetBoard(); // 盤面をリセット
    currentPlayer = 'red'; // プレイヤーをredに設定
    mode = 'play-with-friend';
});

//main.js
document.querySelector('.play-with-idiot-computer').addEventListener('click', () => {
    resetBoard(); // 盤面をリセット
    currentPlayer = 'red'; // プレイヤーをredに設定
    mode = 'play-with-idiot-computer';
});

//main.js
document.querySelector('.play-with-smart-computer').addEventListener('click', () => {
    resetBoard(); // 盤面をリセット
    currentPlayer = 'red'; // プレイヤーをredに設定
    mode = 'play-with-smart-computer';
});

//main.js
// 各列のボタンにクリックイベントを追加
const columnButtons = document.querySelectorAll('.column-button');
columnButtons.forEach(button => {
    button.addEventListener('click', () => {
        const col = button.dataset.col; // ボタンから列番号を取得
        dropPiece(col); // 駒を落とす
    });
});

//main.js
// ゲームの状態を管理する変数
let gameMode = null; // 'pvp' または 'pvc'

//main.js
// ページ読み込み時にモード選択画面を表示
document.addEventListener('DOMContentLoaded', () => {
    showModeSelection();
});
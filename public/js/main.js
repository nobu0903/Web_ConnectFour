import * as gameState from "./GameState.js";
import { createBoard, resetBoard } from "./board.js"
import { minimax } from "./computer.js"
import { showModeSelection } from "./gameLogic.js";

createBoard();

// ページ読み込み時にモード選択画面を表示
document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById("board");
    showModeSelection();
    document.getElementById('next-button').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        showModeSelection();
        const nextButton = document.getElementById('next-button');
        nextButton.style.display = 'block'; // メッセージを表示
    });
});

// クライアントサイドのWebSocket接続
const socket = new WebSocket('ws://localhost:3000');

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    // サーバーからのデータを処理
};





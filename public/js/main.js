import * as gameState from "./GameState.js";
import { createBoard, resetBoard } from "./board.js"
import { minimax } from "./computer.js"
import { showModeSelection, initializeWebSocket } from "./gameLogic.js";

createBoard();

// ページ読み込み時にモード選択画面を表示
document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById("board");
    showModeSelection();
    
    // ログイン状態の確認
    const token = localStorage.getItem('token');
    if (token) {
        console.log('保存されたトークンでWebSocket接続を試行');
        initializeWebSocket(token);
    }
    
    // Pingサービスを開始
    startPingService();
    
    document.getElementById('next-button').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        showModeSelection();
        const nextButton = document.getElementById('next-button');
        nextButton.style.display = 'block'; // メッセージを表示
    });
});

// Ping機能の実装
function startPingService() {
    const PING_INTERVAL = 14 * 60 * 1000; // 14分
    const PING_URL = '/ping';

    async function sendPing() {
        try {
            const response = await fetch(PING_URL);
            const data = await response.json();
            console.log('Ping送信成功:', data);
        } catch (error) {
            console.error('Ping送信エラー:', error);
        }
    }

    // 初回のPingを送信
    sendPing();

    // 定期的にPingを送信
    setInterval(sendPing, PING_INTERVAL);
}





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

// WebSocket接続URLを環境に応じて決定
const getWebSocketURL = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
};

// WebSocket接続を確立
function connectWebSocket(token) {
    const wsUrl = `${getWebSocketURL()}?token=${token}`;
    console.log('WebSocket接続を試行:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket接続が確立されました');
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket接続エラー:', error);
    };
    
    ws.onclose = (event) => {
        console.log('WebSocket接続が切断されました。コード:', event.code);
        // 3秒後に再接続を試みる
        setTimeout(() => {
            console.log('WebSocket再接続を試みます...');
            connectWebSocket(token);
        }, 3000);
    };

    return ws;
}

// クライアントサイドのWebSocket接続
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.host;
const socket = new WebSocket(`${wsProtocol}//${wsHost}`);

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    // サーバーからのデータを処理
};





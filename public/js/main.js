import * as gameState from "./GameState.js";
import { createBoard, resetBoard } from "./board.js"
import { minimax } from "./computer.js"
import { showModeSelection } from "./gameLogic.js";

createBoard();

// ページ読み込み時にモード選択画面を表示
document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById("board");
    showModeSelection();
    
    // ログイン状態の確認
    const token = localStorage.getItem('token');
    if (token) {
        console.log('保存されたトークンでWebSocket接続を試行');
        onLoginSuccess(token);
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
        // 接続成功時にマッチングを開始
        ws.send(JSON.stringify({ type: "findMatch" }));
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

    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('WebSocketメッセージ受信:', data);
        
        switch(data.type) {
            case 'gameStart':
                console.log('ゲーム開始:', data);
                // ゲーム開始処理
                break;
            case 'move':
                console.log('手を受信:', data);
                // 手の処理
                break;
            case 'gameResult':
                console.log('ゲーム結果:', data);
                // 結果の処理
                break;
        }
    };

    return ws;
}

// グローバルなWebSocket接続を保持
let globalSocket = null;

// ログイン成功時にWebSocket接続を確立
function initializeWebSocket(token) {
    if (globalSocket) {
        globalSocket.close();
    }
    globalSocket = connectWebSocket(token);
}

// ログイン成功時に呼び出される関数
function onLoginSuccess(token) {
    console.log('ログイン成功、WebSocket接続を開始');
    initializeWebSocket(token);
}

// Ping機能の実装
//render freee plan have shitty function that sleep in each 15 mins so I have to refresh page in every 14 mins I can refresh 15min - 1sec but I don't wanna do such a boring thing so I use 14 mins and I use ping to keep connection alive
function startPingService() {
    const PING_INTERVAL = 14 * 60 * 1000; // 14分
    const PING_URL = '/ping';
    //async is used to define an asynchronous function, which means the function will always return a Promise and can use await inside it.
    //1. sendPing() is called.
    //2. The function pauses at await fetch(PING_URL) until the network request completes.
    //3. Once the request completes, the function pauses again at await response.json() until the JSON is parsed.
    //4. Finally, it logs "Ping送信成功" with the parsed data.
    //5. If any error happens, it logs "Ping送信エラー" instead.

    async function sendPing() {
        try {
            const response = await fetch(PING_URL); //await is pause execusion until the promise is resolved
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





import { initializeWebSocket } from './gameLogic.js';

let isLoginMode = true;
let authToken = null;

export function showAuthForm() {
    const container = document.getElementById('login-signup-container');
    container.classList.add('active');
}

export function hideAuthForm() {
    const container = document.getElementById('login-signup-container');
    container.classList.remove('active');
}

export function getAuthToken() {
    return authToken;
}

function updateAuthFormMode() {
    const title = document.getElementById('auth-title');
    const submitButton = document.getElementById('auth-submit');
    const toggleText = document.getElementById('auth-toggle-text');
    
    if (isLoginMode) {
        title.textContent = 'ログイン';
        submitButton.textContent = 'ログイン';
        toggleText.textContent = 'アカウントをお持ちでない方はこちら';
    } else {
        title.textContent = 'アカウント作成';
        submitButton.textContent = '登録';
        toggleText.textContent = 'すでにアカウントをお持ちの方はこちら';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = message;
    errorDiv.classList.add('active');
}

function hideError() {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.classList.remove('active');
}

async function handleAuth(username, password) {
    try {
        const endpoint = isLoginMode ? '/api/login' : '/api/register';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Authentication failed');
        }

        authToken = data.token;
        hideError();
        hideAuthForm();

        // WebSocket接続を初期化し、マッチング開始
        const socket = initializeWebSocket(authToken);
        const gameStatus = document.getElementById("gameStatus");
        gameStatus.textContent = `対戦相手を待っています...`;
        gameStatus.style.display = "block";

        // WebSocket接続が確立されるのを待ってからマッチング要求を送信
        socket.addEventListener('open', () => {
            console.log('WebSocket接続が確立されました。マッチング要求を送信します。');
            // 少し待ってからマッチング要求を送信
            setTimeout(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    const matchRequest = { type: "findMatch" };
                    console.log('マッチング要求を送信:', matchRequest);
                    socket.send(JSON.stringify(matchRequest));
                } else {
                    console.error('WebSocketが接続されていません。状態:', socket.readyState);
                }
            }, 1000);
        });

        return true;
    } catch (error) {
        showError(error.message);
        return false;
    }
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const toggleText = document.getElementById('auth-toggle-text');

    toggleText.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        updateAuthFormMode();
        hideError();
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        await handleAuth(username, password);
    });
}); 
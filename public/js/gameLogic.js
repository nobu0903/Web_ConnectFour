import * as gameState from "./GameState.js";
import { isColumnFull, resetBoard } from "./board.js";
import { smartComputerTurn } from "./computer.js";

// WebSocketの接続を確立
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.host;
const socket = new WebSocket(`${wsProtocol}//${wsHost}`);

// 駒を落とす関数
export function dropPiece(col, isOpponentMove = false) {
    if (gameState.winner) 
        return; // 勝者が決まっている場合は処理を終了

    // 自分の手番でない場合は処理を終了（相手の手の場合を除く）
    if (!isOpponentMove && !gameState.isMyTurn) {
        console.log("相手のターンです");
        return;
    }

    console.log("駒を落とす処理開始:", col);
    console.log("現在のプレイヤー:", gameState.currentPlayer);

    for (let row = 5; row >= 0; row--) { // 下から上に向かって探す
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) {
            console.log("セルが見つかりません:", row, col);
            continue;
        }

        if (isColumnFull(col)) {
            console.log("列が満杯です:", col);
            alert('Error: This column is already full. \nPlease choose another one');
            return; // 列が埋まっている場合は処理を終了
        }

        if (!cell.classList.contains('red') && !cell.classList.contains('yellow')) { // 空のセルを探す
            console.log("空のセルが見つかりました:", row, col);
            cell.classList.add(gameState.currentPlayer); // 現在のプレイヤーの色を追加
            gameState.virtualBoard[row][col] = gameState.currentPlayer; // virtualBoardも更新
            const lastPlayer = gameState.currentPlayer; // 最後に置いたプレイヤーの色を保持
            
            // 勝者の判定
            if (checkWinner(row, col, lastPlayer)) {
                gameState.setWinner(gameState.currentPlayer);
                console.log(`${lastPlayer} win!!`);
            }
            break;
        }
    }
    
    // プレイヤーのターンを交代
    if (!isOpponentMove) {
        // 自分の手番の場合
        gameState.switchPlayer();
        gameState.setMyTurn(false); // 自分のターンを終了
        updateTurn(gameState.currentPlayer);
        
        // サーバーに動きを送信（ルームIDも含める）
        const message = { 
            type: "move", 
            move: { col }, 
            roomId: gameState.currentRoomId 
        };
        console.log("送信するメッセージ:", message);
        socket.send(JSON.stringify(message));
    } else {
        // 相手の手番の場合
        gameState.switchPlayer();
        gameState.setMyTurn(true); // 自分のターンを開始
        updateTurn(gameState.currentPlayer);
    }
    
    // 勝者が決まった場合の処理
    if (gameState.winner) {
        return;
    }
    else if (gameState.currentPlayer === 'yellow' && (gameState.mode === 'play-with-smart-computer-level1' || gameState.mode === 'play-with-smart-computer-level2' || gameState.mode === 'play-with-smart-computer-level3')) {
        smartComputerTurn(); // コンピューターのターン
    }
}

export function checkWinner(row, col, lastPlayer) {
    // 行と列の範囲をチェック
    if (row < 0 || row > 5 || col < 0 || col > 6) {
        return false; // 範囲外の場合は勝者なし
    }

    const currentColor = lastPlayer; // 最後に置いたプレイヤーの色を取得

    // 横方向のチェック
    for (let c = Math.max(0, col - 3); c <= Math.min(5, col + 3); c++) {
        const cell1 = document.querySelector(`.cell[data-row="${row}"][data-col="${c}"]`);
        const cell2 = document.querySelector(`.cell[data-row="${row}"][data-col="${c + 1}"]`);
        const cell3 = document.querySelector(`.cell[data-row="${row}"][data-col="${c + 2}"]`);
        const cell4 = document.querySelector(`.cell[data-row="${row}"][data-col="${c + 3}"]`);

        if (cell1 && cell2 && cell3 && cell4 && 
            cell1.classList.contains(currentColor) &&
            cell2.classList.contains(currentColor) &&
            cell3.classList.contains(currentColor) &&
            cell4.classList.contains(currentColor)) {
            // 勝者が決まった場合
                // 勝利したセルにアニメーションを追加
                for (let i = 0; i < 4; i++) {
                    const winningCell = document.querySelector(`.cell[data-row="${row}"][data-col="${c+i}"]`);
                    if (winningCell) {
                        winningCell.classList.add('win'); // アニメーションを適用
                    }
                }
            
            return true; // 横に4つ並んでいる
        }
    }

    // 縦方向のチェック
    for (let r = Math.max(0, row - 3); r <= Math.min(5, row + 3); r++) {
        const cell1 = document.querySelector(`.cell[data-row="${r}"][data-col="${col}"]`);
        const cell2 = document.querySelector(`.cell[data-row="${r + 1}"][data-col="${col}"]`);
        const cell3 = document.querySelector(`.cell[data-row="${r + 2}"][data-col="${col}"]`);
        const cell4 = document.querySelector(`.cell[data-row="${r + 3}"][data-col="${col}"]`);

        if (cell1 && cell2 && cell3 && cell4 && 
            cell1.classList.contains(currentColor) &&
            cell2.classList.contains(currentColor) &&
            cell3.classList.contains(currentColor) &&
            cell4.classList.contains(currentColor)) {
            // 勝者が決まった場合
                // 勝利したセルにアニメーションを追加
                for (let i = 0; i < 4; i++) {
                    const winningCell = document.querySelector(`.cell[data-row="${r + i}"][data-col="${col}"]`);
                    if (winningCell) {
                        winningCell.classList.add('win'); // アニメーションを適用
                    }
                }
            return true; // 縦に4つ並んでいる
        }
    }

    // 斜め方向のチェック（右下がり）
    for (let d = -3; d <= 0; d++) {
        const cell1 = document.querySelector(`.cell[data-row="${row - d}"][data-col="${col - d}"]`);//dがマイナスだからマイナスのマイナスでdata-rowはプラスになる。
        const cell2 = document.querySelector(`.cell[data-row="${row - d - 1}"][data-col="${col - d - 1}"]`);
        const cell3 = document.querySelector(`.cell[data-row="${row - d - 2}"][data-col="${col - d - 2}"]`);
        const cell4 = document.querySelector(`.cell[data-row="${row - d - 3}"][data-col="${col - d - 3}"]`);

        if (cell1 && cell2 && cell3 && cell4 && 
            cell1.classList.contains(currentColor) &&
            cell2.classList.contains(currentColor) &&
            cell3.classList.contains(currentColor) &&
            cell4.classList.contains(currentColor)) {
            // 勝者が決まった場合
                // 勝利したセルにアニメーションを追加
                for (let i = 0; i < 4; i++) {
                    const winningCell = document.querySelector(`.cell[data-row="${row - d - i}"][data-col="${col - d - i}"]`);
                    if (winningCell) {
                        winningCell.classList.add('win'); // アニメーションを適用
                    }
                }
            return true; // 右下がりに4つ並んでいる
        }
    }

    // 斜め方向のチェック（左下がり）
    for (let d = -3; d <= 0; d++) {
        const cell1 = document.querySelector(`.cell[data-row="${row + d}"][data-col="${col - d}"]`);
        const cell2 = document.querySelector(`.cell[data-row="${row + d + 1}"][data-col="${col - d - 1}"]`);
        const cell3 = document.querySelector(`.cell[data-row="${row + d + 2}"][data-col="${col - d - 2}"]`);
        const cell4 = document.querySelector(`.cell[data-row="${row + d + 3}"][data-col="${col - d - 3}"]`);

        if (cell1 && cell2 && cell3 && cell4 && 
            cell1.classList.contains(currentColor) &&
            cell2.classList.contains(currentColor) &&
            cell3.classList.contains(currentColor) &&
            cell4.classList.contains(currentColor)) {
            // 勝者が決まった場合
                // 勝利したセルにアニメーションを追加
                for (let i = 0; i < 4; i++) {
                    const winningCell = document.querySelector(`.cell[data-row="${row + d + i}"][data-col="${col - d - i}"]`);
                    if (winningCell) {
                        winningCell.classList.add('win'); // アニメーションを適用
                    }
            }
            return true; // 左下がりに4つ並んでいる
        }
    }

    return false; // 4つ並んでいない
}

// サーバーからのメッセージを処理
socket.onmessage = (event) => {
    console.log("受信したメッセージ:", event.data);
    const data = JSON.parse(event.data);
    
    if (data.type === "roomCreated") {
        console.log("ルーム作成成功！ID:", data.roomId);
        gameState.setCurrentRoomId(data.roomId);
        // ターンインジケーターを非表示
        document.getElementById("turnIndicator").style.display = "none";
    } else if (data.type === "gameStart") {
        console.log("対戦相手が見つかりました！ゲーム開始");
        gameState.setCurrentRoomId(data.roomId);
        
        // 先手後手の設定
        gameState.setMyTurn(data.isFirstMove);
        
        startGame(data.roomId, data.isFirstMove);
        // ターンインジケーターを表示
        document.getElementById("turnIndicator").style.display = "block";
    } else if (data.type === "move") {
        console.log("moveのメッセージを受け取りました");
        console.log("受信したルームID:", data.roomId);
        console.log("現在のルームID:", gameState.currentRoomId);
        // 自分のルームのメッセージかどうかを確認
        if (data.roomId === gameState.currentRoomId) {
            console.log("ルームIDが一致しました");
            console.log("相手の手:", data.move);
            const column = parseInt(data.move.col);
            dropPiece(column, true);
        } else {
            console.log("ルームIDが一致しません");
        }
    }
};

// ゲーム開始処理
function startGame(roomId, isFirstMove) {
    const gameStatus = document.getElementById("gameStatus");
    gameStatus.textContent = `ゲームが開始されました！${isFirstMove ? '（先手）' : '（後手）'}`;
    gameStatus.style.display = "block";

    resetBoard();
    gameState.resetCurrentPlayer();
    updateTurn(gameState.currentPlayer);
}

// モード選択画面の表示
export function showModeSelection() {
    const modeSelection = document.getElementById('mode-selection');
    modeSelection.style.display = 'flex';

    document.getElementById('online-mode').addEventListener('click', () => {
        resetBoard();
        gameState.resetCurrentPlayer();
        gameState.resetModePlayInOnline();
        socket.send(JSON.stringify({ type: "findMatch" }));
        modeSelection.style.display = 'none';
        const gameStatus = document.getElementById("gameStatus");
        gameStatus.textContent = `対戦相手を待っています...`;
        gameStatus.style.display = "block";
    });

    // プレイヤー対プレイヤーのモード
    document.getElementById('pvp-mode').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        gameState.resetCurrentPlayer();
        gameState.resetModePlayWithFrirend();
        modeSelection.style.display = 'none';
    });

    // player vs computer mode
    document.getElementById('pvc-mode').addEventListener('click', () => {
        document.getElementById('pvc-levels').style.display = 'block'; // レベル選択を表示
    });
    
    // 各レベルボタンにイベントリスナーを追加
    document.getElementById('pvc-mode-level1').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        gameState.resetCurrentPlayer();
        gameState.resetModePlayWithLevel1();
        modeSelection.style.display = 'none';
    });
    
    document.getElementById('pvc-mode-level2').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        gameState.resetCurrentPlayer();
        gameState.resetModePlayWithLevel2(); 
        modeSelection.style.display = 'none';
    });
    
    document.getElementById('pvc-mode-level3').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        gameState.resetCurrentPlayer();
        gameState.resetModePlayWithLevel3(); 
        modeSelection.style.display = 'none';
    });
}

export function updateTurn(player) {
    let turnIndicator = document.getElementById("turnIndicator");
    
    if (gameState.mode === "play-in-online") {
        // オンラインモードの場合
        if (gameState.isMyTurn) {
            turnIndicator.textContent = "あなたのターンです";
            turnIndicator.style.color = gameState.currentPlayer;
        } else {
            turnIndicator.textContent = "相手のターンです";
            turnIndicator.style.color = gameState.currentPlayer;
        }
    } else {
        // その他のモードの場合は既存の表示を使用
        if (player === "red") {
            turnIndicator.textContent = "red Turn";
            turnIndicator.style.color = "red";
        } else if (player === "yellow") {
            turnIndicator.textContent = "yellow Turn";
            turnIndicator.style.color = "yellow";
        }
    }
    
    // 勝者が決まった場合の処理
    if (gameState.winner) {
        turnIndicator.textContent = `${gameState.winner} wins!`;
        turnIndicator.style.color = "white";
    }
}

function createRoom() {
    socket.send(JSON.stringify({ type: "createRoom" }));
}

function joinRoom(roomId) {
    socket.send(JSON.stringify({ type: "joinRoom", roomId }));
}

function sendMove(move) {
    socket.send(JSON.stringify({ type: "move", move }));
}

// 各列のボタンにクリックイベントを追加する関数
export function initializeColumnButtons() {
    const columnButtons = document.querySelectorAll('.column-button');
    columnButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (gameState.winner) return;
            const col = button.dataset.col;
            dropPiece(col);
        });
    });
}

// 初期化関数を呼び出し
initializeColumnButtons();
    

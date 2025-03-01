import * as gameState from "./GameState.js";
import { isColumnFull, resetBoard } from "./board.js";
import { smartComputerTurn } from "./computer.js";

// WebSocketの接続を確立
const socket = new WebSocket('ws://localhost:3000'); // サーバーのURL

// 駒を落とす関数
export function dropPiece(col, isOpponentMove = false) {
    if (gameState.winner) 
        return; // 勝者が決まっている場合は処理を終了

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
        updateTurn(gameState.currentPlayer);
        
        // サーバーに動きを送信
        socket.send(JSON.stringify({ type: "move", move: { col } }));
    } else {
        // 相手の手番の場合
        gameState.switchPlayer();
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
    console.log("受信したメッセージ:", event.data); // 受信したメッセージをログに出力
    const data = JSON.parse(event.data);
    
    if (data.type === "roomCreated") {
        console.log("ルーム作成成功！ID:", data.roomId);
    } else if (data.type === "gameStart") {
        console.log("対戦相手が見つかりました！ゲーム開始");
        startGame(data.roomId); // ゲーム開始処理を呼び出す
    } else if (data.type === "move") {
        console.log("相手の手:", data.move);
        const column = parseInt(data.move.col); // 文字列を数値に変換
        dropPiece(column, true); // 相手の動きとして直接dropPieceを呼び出す
    }
};



// ゲーム開始処理
function startGame(roomId) {
    // ゲーム開始のUI更新
    const gameStatus = document.getElementById("gameStatus");
    gameStatus.textContent = `ゲームが開始されました！ルームID: ${roomId}`;
    gameStatus.style.display = "block";

    // 必要に応じて、他の初期化処理を追加
    resetBoard(); // 盤面をリセット
    gameState.resetCurrentPlayer();
    updateTurn(gameState.currentPlayer);
}

//main.js
// モード選択画面の表示
export function showModeSelection() {
    const modeSelection = document.getElementById('mode-selection');
    modeSelection.style.display = 'flex';

    // online match
    document.getElementById('online-mode').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        gameState.resetCurrentPlayer();
        gameState.resetModePlayInOnline(); // オンラインモードに設定
        
        // 他のプレイヤーとマッチングを試みる
        socket.send(JSON.stringify({ type: "findMatch" }));
        
        modeSelection.style.display = 'none';
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
    

    if (player === "red") {
        turnIndicator.textContent = "red Turn";
        turnIndicator.style.color = "red";
    } else if (player === "yellow") {
        turnIndicator.textContent = "yellow Turn";
        turnIndicator.style.color = "yellow";
    } 
    
    // 勝者が決まった場合の処理を追加
    if (gameState.winner) { // 勝者の判定にlastPlayerを使用
        turnIndicator.textContent = `${gameState.winner} wins!`; // 勝者の名前を表示
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
    

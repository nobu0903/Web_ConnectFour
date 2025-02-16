import { createBoard, resetBoard, isColumnFull } from "./board.js";
import { idiotComputerTurn, smartComputerTurn, createNewNode, minimax, isGameOver, evaluateBoard, evaluateLine } from "./computer.js";
import { board, dropButton, currentPlayer, mode, virtualBoard, bestScore } from "./gameState.js";
// メソッド

// 駒を落とす関数
function dropPiece(col) {
    for (let row = 5; row >= 0; row--) { // 下から上に向かって探す
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (isColumnFull(col)) {
            alert('Error: This column is already full. \nPlease choose other one');
            return; // 列が埋まっている場合は処理を終了
        }
        if (!cell.classList.contains('red') && !cell.classList.contains('yellow')) { // 空のセルを探す
            cell.classList.add(currentPlayer); // 現在のプレイヤーの色を追加
            virtualBoard[row][col] = currentPlayer; // virtualBoardも更新
            const lastPlayer = currentPlayer; // 最後に置いたプレイヤーの色を保持
            if (checkWinner(row, col, lastPlayer)) { // 勝者の判定にlastPlayerを使用
                alert(`${lastPlayer} win!!`); // 正しいプレイヤーの色を表示
            }
            break;
        }
    }
    
    // プレイヤーのターンを交代
    currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
    
    // コンピューターのターンを呼び出す
    if (currentPlayer === 'yellow' && (mode === 'play-with-idiot-computer')) {
        idiotComputerTurn(); // コンピューターのターン
    }
    //後で変えるミニマックス作ったら適用する
    //ifにしてたらidiot computer押してもsmart computer呼び出されてたけどelse ifにしたらidiot computer が適用された
    else if (currentPlayer === 'yellow' && (mode === 'play-with-smart-computer')) {
        smartComputerTurn(); // コンピューターのターン
    }
}


//gameLogic.js
function checkWinner(row, col, lastPlayer) {
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
            if (勝者が決まった場合) {
                // 勝利したセルにアニメーションを追加
                for (let i = 0; i < 4; i++) {
                    const winningCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
                    if (winningCell) {
                        winningCell.classList.add('win'); // アニメーションを適用
                    }
                }
                // 勝利メッセージを表示
                const winnerMessage = document.getElementById('winner-message');
                winnerMessage.textContent = `${lastPlayer} の勝利！`;
                winnerMessage.style.display = 'block'; // メッセージを表示

                // 次へボタンを表示
                const nextButton = document.getElementById('next-button');
                nextButton.style.display = 'block'; // 次へボタンを表示
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
            if (勝者が決まった場合) {
                // 勝利したセルにアニメーションを追加
                for (let i = 0; i < 4; i++) {
                    const winningCell = document.querySelector(`.cell[data-row="${r + i}"][data-col="${col}"]`);
                    if (winningCell) {
                        winningCell.classList.add('win'); // アニメーションを適用
                    }
                }
                // 勝利メッセージを表示
                const winnerMessage = document.getElementById('winner-message');
                winnerMessage.textContent = `${lastPlayer} の勝利！`;
                winnerMessage.style.display = 'block'; // メッセージを表示

                // 次へボタンを表示
                const nextButton = document.getElementById('next-button');
                nextButton.style.display = 'block'; // 次へボタンを表示
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
        console.log("右下がりの勝者チェック開始")

        if (cell1 && cell2 && cell3 && cell4 && 
            cell1.classList.contains(currentColor) &&
            cell2.classList.contains(currentColor) &&
            cell3.classList.contains(currentColor) &&
            cell4.classList.contains(currentColor)) {
            // 勝者が決まった場合
            if (勝者が決まった場合) {
                // 勝利したセルにアニメーションを追加
                for (let i = 0; i < 4; i++) {
                    const winningCell = document.querySelector(`.cell[data-row="${row - d - i}"][data-col="${col - d - i}"]`);
                    if (winningCell) {
                        winningCell.classList.add('win'); // アニメーションを適用
                    }
                }
                // 勝利メッセージを表示
                const winnerMessage = document.getElementById('winner-message');
                winnerMessage.textContent = `${lastPlayer} の勝利！`;
                winnerMessage.style.display = 'block'; // メッセージを表示

                // 次へボタンを表示
                const nextButton = document.getElementById('next-button');
                nextButton.style.display = 'block'; // 次へボタンを表示
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
            if (勝者が決まった場合) {
                // 勝利したセルにアニメーションを追加
                for (let i = 0; i < 4; i++) {
                    const winningCell = document.querySelector(`.cell[data-row="${row + d + i}"][data-col="${col - d - i}"]`);
                    if (winningCell) {
                        winningCell.classList.add('win'); // アニメーションを適用
                    }
                }
                // 勝利メッセージを表示
                const winnerMessage = document.getElementById('winner-message');
                winnerMessage.textContent = `${lastPlayer} の勝利！`;
                winnerMessage.style.display = 'block'; // メッセージを表示

                // 次へボタンを表示
                const nextButton = document.getElementById('next-button');
                nextButton.style.display = 'block'; // 次へボタンを表示
            }
            return true; // 左下がりに4つ並んでいる
        }
    }

    
    return false; // 4つ並んでいない
}

// モード選択画面の表示
function showModeSelection() {
    const modeSelection = document.getElementById('mode-selection');
    modeSelection.style.display = 'flex';

    // player vs player mode 
    document.getElementById('pvp-mode').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        currentPlayer = 'red'; // プレイヤーをredに設定
        mode = 'play-with-friend';
        modeSelection.style.display = 'none';
    });

    // player vs computer mode
    document.getElementById('pvc-mode').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        currentPlayer = 'red'; // プレイヤーをredに設定
        mode = 'play-with-smart-computer';
        modeSelection.style.display = 'none';
    });
}

export { dropPiece, checkWinner, showModeSelection };
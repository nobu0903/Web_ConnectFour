const board = document.getElementById("board");
const dropButton = document.getElementById("dropButton");
let currentPlayer = 'red'; // プレイヤーの色を管理
let mode = 'play-with-friend';

// 盤面を作る（7列 × 6行）
function createBoard() {
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

createBoard();


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
            const lastPlayer = currentPlayer; // 最後に置いたプレイヤーの色を保持
            if (checkWinner(row, col, lastPlayer)) { // 勝者の判定にlastPlayerを使用
                alert(`${lastPlayer} win!!`); // 正しいプレイヤーの色を表示
            }
            console.log(currentPlayer);
            break;
        }
    }
    
    // プレイヤーのターンを交代
    currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
    
    // コンピューターのターンを呼び出す
    if (currentPlayer === 'yellow' && (mode === 'play-with-idiot-computer')) {
        idiotComputerTurn(); // コンピューターのターン
    }
    //ここにminimax functionつくって適用する予定です。
    if (currentPlayer === 'yellow' && (mode === 'play-with-smart-computer')) {
        idiotComputerTurn(); // コンピューターのターン
    }
}

function resetBoard() {
    const board = document.getElementById('board');
    board.innerHTML = ''; // 盤面を空にする
    createBoard();//createBoardを呼び出して盤面のを作り直す
    currentPlayer = 'red';
}


function isColumnFull(col) {
    const cell = document.querySelector(`.cell[data-row="0"][data-col="${col}"]`);
    return cell && (cell.classList.contains('red') || cell.classList.contains('yellow'));
}

function idiotCmputerTurn() {
    const availableColumns = [];

    for(let col = 0; col < 7; col++) {
        const cell = document.querySelector(`.cell[data-row="0"][data-col="${col}"]`);
        if (!cell.classList.contains('red') && !cell.classList.contains('yellow')) {
            availableColumns.push(col)//availableColumnというArrayにcol numberを入れる
        }
    }
    //空いているcolumnがあればrandomで駒を落とす
    if (availableColumns.length > 0) {
        const randomCol = availableColumns[Math.floor(Math.random() * availableColumns.length)];
        dropPiece(randomCol);
    }
}
 

// ボタンにイベントリスナーを追加
//play with computer と一緒だから変えないといけない
document.querySelector('.play-with-friend').addEventListener('click', () => {
    resetBoard(); // 盤面をリセット
    currentPlayer = 'red'; // プレイヤーをredに設定
    mode = 'play-with-friend';
});

document.querySelector('.play-with-idiot-computer').addEventListener('click', () => {
    resetBoard(); // 盤面をリセット
    currentPlayer = 'red'; // プレイヤーをredに設定
    mode = 'play-with-idiot-computer';
});

document.querySelector('.play-with-smart-computer').addEventListener('click', () => {
    resetBoard(); // 盤面をリセット
    currentPlayer = 'red'; // プレイヤーをredに設定
    mode = 'play-with-smart-computer';
});

// 各列のボタンにクリックイベントを追加
const columnButtons = document.querySelectorAll('.column-button');
columnButtons.forEach(button => {
    button.addEventListener('click', () => {
        const col = button.dataset.col; // ボタンから列番号を取得
        dropPiece(col); // 駒を落とす
    });
});

function checkWinner(row, col, lastPlayer) {
    // 行と列の範囲をチェック
    if (row < 0 || row > 5 || col < 0 || col > 6) {
        return false; // 範囲外の場合は勝者なし
    }

    const currentColor = lastPlayer; // 最後に置いたプレイヤーの色を取得
    console.log(`Checking winner for row: ${row}, col: ${col}, currentColor: ${currentColor}`); // デバッグ用ログ

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
            return true; // 縦に4つ並んでいる
        }
    }

    // 斜め方向のチェック（右下がり）
    for (let d = -3; d <= 0; d++) {
        const cell1 = document.querySelector(`.cell[data-row="${row + d}"][data-col="${col + d}"]`);
        const cell2 = document.querySelector(`.cell[data-row="${row + d + 1}"][data-col="${col + d + 1}"]`);
        const cell3 = document.querySelector(`.cell[data-row="${row + d + 2}"][data-col="${col + d + 2}"]`);
        const cell4 = document.querySelector(`.cell[data-row="${row + d + 3}"][data-col="${col + d + 3}"]`);

        if (cell1 && cell2 && cell3 && cell4 && 
            cell1.classList.contains(currentColor) &&
            cell2.classList.contains(currentColor) &&
            cell3.classList.contains(currentColor) &&
            cell4.classList.contains(currentColor)) {
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
            return true; // 左下がりに4つ並んでいる
        }
    }

    return false; // 4つ並んでいない
}
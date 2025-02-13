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

function resetBoard() {
    const board = document.getElementById('board');
    board.innerHTML = ''; // 盤面を空にする
    createBoard();//createBoardを呼び出して盤面のを作り直す
    // virtualBoardもリセット
    virtualBoard = Array.from({ length: 6 }, () => Array(7).fill(null));
    currentPlayer = 'red';
}


function isColumnFull(col) {
    const cell = document.querySelector(`.cell[data-row="0"][data-col="${col}"]`);
    return cell && (cell.classList.contains('red') || cell.classList.contains('yellow'));
}

function idiotComputerTurn() {
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

function smartComputerTurn() {
    const availableColumns = [];

    for(let col = 0; col < 7; col++) {
        const cell = document.querySelector(`.cell[data-row="0"][data-col="${col}"]`);
        if (!cell.classList.contains('red') && !cell.classList.contains('yellow')) {
            availableColumns.push(col);
        }
    }

    // ミニマックスを使用して最適な列を選択
    let bestCol = availableColumns[0];
    let bestScore = -Infinity;

    for (const col of availableColumns) {
        const newNode = createNewNode(virtualBoard, col, currentPlayer);/* ゲームの新しい状態を作成 */
        const score = minimax(newNode, 3, false, -Infinity, Infinity); // 深さ3で評価
        if (score > bestScore) {
            bestScore = score;
            bestCol = col;
        }
    }

    dropPiece(bestCol);
}
//virtualBoardの初期化: ゲーム開始時に、空の盤面をvirtualBoardとして初期化します。minimax functionに引数として使う
let virtualBoard = Array.from({ length: 6 }, () => Array(7).fill(null));

// 新しい状態を作成する関数
function createNewNode(virtualBoard, col, player) {
    const newNode = virtualBoard.map(row => row.slice()); // 現在の盤面をコピー

    // 指定された列にピースを落とす
    for (let row = newNode.length - 1; row >= 0; row--) {
        if (!newNode[row][col]) { // 空のセルを見つけたら
            newNode[row][col] = player; // 現在のプレイヤーのピースを配置
            break; // ピースを配置したらループを終了
        }
    }

    return newNode; // 新しい盤面を返す
}

//https://www.youtube.com/watch?v=l-hh51ncgDI ミニマックスアルゴリズムとアルファベータアルゴリズムについての動画
// アルファ（α）
// 定義: αは、最大化プレイヤーが現在のノードで得られる最良のスコアの下限を示します。
// 役割: 最大化プレイヤーが選ぶ手の中で、これまでに見つかった最良のスコアを保持します。新しい評価スコアがこのαよりも大きい場合、最大化プレイヤーはその手を選ぶ可能性があるため、探索を続けます。
// 更新: 新しい評価スコアが見つかるたびに、αはそのスコアと比較され、より大きい方に更新されます。
// ベータ（β）
// 定義: βは、最小化プレイヤーが現在のノードで得られる最良のスコアの上限を示します。
// 役割: 最小化プレイヤーが選ぶ手の中で、これまでに見つかった最良のスコアを保持します。新しい評価スコアがこのβよりも小さい場合、最小化プレイヤーはその手を選ぶ可能性があるため、探索を続けます。
// 更新: 新しい評価スコアが見つかるたびに、βはそのスコアと比較され、より小さい方に更新されます。
function minimax (node, depth, isMaximizingPlayer, alpha, beta) {
    //深さまたはゲーム終了のチェック: 探索の深さが0またはゲームが終了している場合、ゲームの状態を評価し、そのスコアを返します
    if (depth === 0 || isGameOver(node)) {
        return evaluateBoard(node)
    }
    //最大化プレイヤーのチェック: 現在のプレイヤーが最大化を目指すプレイヤーかどうかを確認します。
    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (let col = 0; col < 7; col++) {
            if (node[0][col] === null) { // isColumnFullの代わりに直接チェック
                const newNode = createNewNode(node, col, 'yellow'); // nodeを使用
                const eval = minimax(newNode, depth - 1, false, alpha, beta); // newNodeを渡す
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);//aalphaをその深さにおける最大値に更新
                if (beta <= alpha) break //beta cut             
            }
        }
        return maxEval;
    }
    else {
        let minEval = Infinity;//最小評価スコアを正の無限大で初期化します。これにより一番高い評価の数字が最大値となる。
        for (let col = 0; col < 7; col++) {
            if (node[0][col] === null) {
                const newNode = createNewNode(node, col, 'red');
                const eval = minimax(newNode, depth - 1, true, alpha, beta);
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);//betaをその深さにおける最小値に更新
                if (beta <= alpha) break; // αカット
            }
        }
        return minEval;
    }
}

// ゲームの開始時に仮想の盤面を使用してミニマックスを呼び出す
const bestScore = minimax(virtualBoard, 3, true, -Infinity, Infinity); // 例えば、深さ3で最大化プレイヤーのターン

function isGameOver(node) {
    // 盤面の状態を取得
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const cell = node[row][col];
            if (cell) { // cellがnullでないことを確認
                if (cell === 'red' || cell === 'yellow') {
                    // 勝者のチェック
                    if (checkWinner(row, col, cell)) {
                        return true; // 勝者がいる場合
                    }
                }
            }
        }
    }

    // 盤面が満杯かどうかをチェック
    for (let col = 0; col < 7; col++) {
        if (!isColumnFull(col)) {
            return false; // 空いている列がある場合はゲームは続行中
        }
    }

    return true; // 盤面が満杯の場合
}

function evaluateBoard(node) {
    let score = 0;

    // 横方向のチェック
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            let compCount = 0;
            let playerCount = 0;

            for (let i = 0; i < 4; i++) {
                if (node[row][col + i] === 'yellow') compCount++;
                if (node[row][col + i] === 'red') playerCount++;
            }
            score += evaluateLine(compCount, playerCount);
        }
    }

    // 縦方向のチェック
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row < 3; row++) {
            let compCount = 0;
            let playerCount = 0;

            for (let i = 0; i < 4; i++) {
                if (node[row + i][col] === 'yellow') compCount++;
                if (node[row + i][col] === 'red') playerCount++;
            }
            score += evaluateLine(compCount, playerCount);
        }
    }

    // 斜め方向のチェック（右下がり）
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            let compCount = 0;
            let playerCount = 0;

            for (let i = 0; i < 4; i++) {
                if (node[row + i][col + i] === 'yellow') compCount++;
                if (node[row + i][col + i] === 'red') playerCount++;
            }
            score += evaluateLine(compCount, playerCount);
        }
    }

    // 斜め方向のチェック（左下がり）
    for (let row = 0; row < 3; row++) {
        for (let col = 3; col < 7; col++) {
            let compCount = 0;
            let playerCount = 0;

            for (let i = 0; i < 4; i++) {
                if (node[row + i][col - i] === 'yellow') compCount++;
                if (node[row + i][col - i] === 'red') playerCount++;
            }
            score += evaluateLine(compCount, playerCount);
        }
    }

    console.log(score); // まず記録
    return score; // その後リターン
}


// 評価スコアを返す補助関数
function evaluateLine(compCount, playerCount) {
    if (compCount > 0 && playerCount > 0) return 0;
    if (compCount === 4) return 1000; // 勝利状態
    if (compCount === 3) return 100;  // より大きな重み
    if (compCount === 2) return 20;   // より大きな重み
    if (playerCount === 4) return -1000;
    if (playerCount === 3) return -100;
    if (playerCount === 2) return -20;
    return compCount - playerCount; // 1個の駒も評価
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
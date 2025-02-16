import { createBoard, resetBoard, isColumnFull } from "./board.js";
import { dropPiece, checkWinner, showModeSelection } from "./gameLogic.js";
import { board, dropButton, currentPlayer, mode, virtualBoard, bestScore } from "./gameState.js";

// メソッド
// ここに、コンピューターの手を決定する処理などのメソッドを追加
//いらない削除
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
        const newNode = createNewNode(virtualBoard, col, getCurrentPlayer());/* ゲームの新しい状態*/
        const score = minimax(newNode, 3, false, -Infinity, Infinity); // 深さ3で評価
        if (score > bestScore) {
            bestScore = score;
            bestCol = col;
        }
    }

    dropPiece(bestCol);
}

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
                const score = minimax(newNode, depth - 1, false, alpha, beta); // newNodeを渡す
                maxEval = Math.max(maxEval, score);
                alpha = Math.max(alpha, score);//aalphaをその深さにおける最大値に更新
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
                const score = minimax(newNode, depth - 1, true, alpha, beta);
                minEval = Math.min(minEval, score);
                beta = Math.min(beta, score);//betaをその深さにおける最小値に更新
                if (beta <= alpha) break; // αカット
            }
        }
        return minEval;
    }
}


//computer.js minimax function でしか使ってないからcomputer.jsに移動gameLogic.jsではない
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

//computer.js
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

//computer.js
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

export { idiotComputerTurn, smartComputerTurn, createNewNode, minimax, isGameOver, evaluateBoard, evaluateLine };
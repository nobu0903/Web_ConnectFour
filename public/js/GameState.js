//ほかのファイルからエレメントとファンクションをインポート
import { createBoard, resetBoard } from "./board.js"
import { minimax } from "./computer.js"
import { dropPiece } from "./gameLogic.js";




// ここでboardをエクスポートする必要があります
export const dropButton = null; // ここではnullに設定

export let currentPlayer = 'red'; // プレイヤーの色を管理

export function resetCurrentPlayer() {
    currentPlayer = 'red'; // 'red' にリセット
}
export function switchPlayer() {
    currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red'; // プレイヤーを切り替える
}

export let mode = 'play-with-friend';
export function resetModePlayWithFrirend () {
    mode = "play-with-friend"
}
export function resetModePlayWithLevel1 () {
    mode = "play-with-smart-computer-level1"
}
export function resetModePlayWithLevel2  () {
    mode = "play-with-smart-computer-level2"
}
export function resetModePlayWithLevel3  () {
    mode = "play-with-smart-computer-level3"
}
export let winner = null; // 勝者を管理する変数を追加
export function resetWinnerToRed() {
    winner = 'red';
}
export function resetWinnerToNull() {
    winner = null;
}
export function setWinner(player) {
    winner = player; // 勝者を設定
}
export let virtualBoard = Array.from({ length: 6 }, () => Array(7).fill(null));

//virtualBoardの初期化: ゲーム開始時に、空の盤面をvirtualBoardとして初期化します。minimax functionに引数として使う
export function resetVirtualBoard() {
    virtualBoard = Array.from({ length: 6 }, () => Array(7).fill(null)); // 再代入
}

// ゲームの開始時に仮想の盤面を使用してミニマックスを呼び出す
export const bestScore = minimax(virtualBoard, 3, true, -Infinity, Infinity); // 例えば、深さ3で最大化プレイヤーのターン

// 各列のボタンにクリックイベントを追加
export const columnButtons = document.querySelectorAll('.column-button');
columnButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (winner) return; // 勝者が決まっている場合は何もしない
        const col = button.dataset.col; // ボタンから列番号を取得
        dropPiece(col); // 駒を落とす
    });
});

// ゲームの状態を管理する変数
export let gameMode = null; // 'pvp' または 'pvc'

export function initializeGameElements() {
    const board = document.getElementById("board");
    const dropButton = document.getElementById("dropButton");
    // ここで他の初期化処理を行う
}





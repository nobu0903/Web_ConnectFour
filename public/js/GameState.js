//ほかのファイルからエレメントとファンクションをインポート
import { createBoard, resetBoard } from "./board.js"
import { minimax } from "./computer.js"

// ここでboardをエクスポートする必要があります
export const dropButton = null; // ここではnullに設定

export let currentPlayer = 'red'; // プレイヤーの色を管理
export let mode = null;
export let winner = null; // 勝者を管理する変数を追加
export let currentRoomId = null; // 現在のルームIDを保持する変数を追加
export let isMyTurn = true; // 自分のターンかどうかを管理

export function setCurrentRoomId(roomId) {
    currentRoomId = roomId;
}

export function resetCurrentPlayer() {
    currentPlayer = 'red'; // 'red' にリセット
}

export function switchPlayer() {
    currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red'; // プレイヤーを切り替える
}

export function resetModePlayInOnline () {
    mode = "play-in-online";
}
export function resetModePlayWithFrirend () {
    mode = "play-with-friend";
}
export function resetModePlayWithLevel1 () {
    mode = "play-with-smart-computer-level1";
}
export function resetModePlayWithLevel2  () {
    mode = "play-with-smart-computer-level2";
}
export function resetModePlayWithLevel3  () {
    mode = "play-with-smart-computer-level3";
}

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

// ゲームの状態を管理する変数
export let gameMode = null; // 'pvp' または 'pvc'

export function initializeGameElements() {
    const board = document.getElementById("board");
    const dropButton = document.getElementById("dropButton");
    // ここで他の初期化処理を行う
}

export function resetCurrentRoomId() {
    currentRoomId = null;
}

export function setMyTurn(value) {
    isMyTurn = value;
}

export function resetMyTurn() {
    isMyTurn = true;
}





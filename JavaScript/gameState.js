import { minimax } from "./computer.js"

const board = document.getElementById("board");
const dropButton = document.getElementById("dropButton");
let currentPlayer = 'red'; // プレイヤーの色を管理
let mode = 'play-with-friend';

//virtualBoardの初期化: ゲーム開始時に、空の盤面をvirtualBoardとして初期化します。minimax functionに引数として使う
let virtualBoard = Array.from({ length: 6 }, () => Array(7).fill(null));

// ゲームの開始時に仮想の盤面を使用してミニマックスを呼び出す
const bestScore = minimax(virtualBoard, 3, true, -Infinity, Infinity); // 例えば、深さ3で最大化プレイヤーのターン

export { board, dropButton, currentPlayer, mode, virtualBoard, bestScore};
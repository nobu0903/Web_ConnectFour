import * as gameState from "./GameState.js";
import { createBoard, resetBoard } from "./board.js"
import { minimax } from "./computer.js"
import { showModeSelection } from "./gameLogic.js";



createBoard();






// ページ読み込み時にモード選択画面を表示
document.addEventListener('DOMContentLoaded', () => {
    showModeSelection();
    document.getElementById('next-button').addEventListener('click', () => {
        resetBoard(); // 盤面をリセット
        showModeSelection();
        const nextButton = document.getElementById('next-button');
        nextButton.style.display = 'block'; // メッセージを表示
    });
});


console.log("分けてもいけますね");



try {
    virtualBoard = []; // エラーが出れば const
    console.log("virtualBoard は let です！");
} catch (error) {
    console.error("virtualBoard は const です！", error);
}
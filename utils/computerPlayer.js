import { WebSocket } from 'ws';

class ComputerPlayer {
    constructor(rating = 1200) {
        this.userId = 'computer';
        this.username = 'コンピューター';
        this.rating = rating;
        this.isComputer = true;
    }

    // コンピューターの手を決定するメソッド
    calculateMove(board) {
        // ボードが未定義の場合、空のボードを作成
        const currentBoard = board || [...Array(6)].map(() => Array(7).fill(null));
        
        // 有効な手をリストアップ
        const validMoves = [];
        for (let col = 0; col < 7; col++) {
            if (currentBoard[0][col] === null) {
                validMoves.push(col);
            }
        }
        
        // 有効な手がない場合は0を返す
        if (validMoves.length === 0) {
            return 0;
        }
        
        // ランダムに手を選択
        const randomIndex = Math.floor(Math.random() * validMoves.length);
        return validMoves[randomIndex];
    }

    // WebSocketのインターフェースをエミュレート
    send(message) {
        try {
            // メッセージを受信した時の処理
            const data = JSON.parse(message);
            if (data.type === 'gameStart') {
                // ゲーム開始時の処理
                setTimeout(() => {
                    // 後手の場合は相手の手を待つ
                    if (data.isFirstMove) {
                        const initialMove = this.calculateMove();
                        this._onMove({ 
                            type: 'move', 
                            move: { col: initialMove },
                            roomId: data.roomId 
                        });
                    }
                }, 1000); // 1秒待ってから手を打つ
            }
        } catch (error) {
            console.error('コンピュータープレイヤーのメッセージ処理エラー:', error);
        }
    }

    // 手を打つ時のコールバックを設定
    set onMove(callback) {
        this._onMove = callback;
    }
}

export default ComputerPlayer; 
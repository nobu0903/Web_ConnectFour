import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path"; // Import path module
import { fileURLToPath } from "url"; // Import fileURLToPath

const __filename = fileURLToPath(import.meta.url); // Get the current file path
const __dirname = path.dirname(__filename); // Get the directory name

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let waitingPlayer = null;
let rooms = {}; // { roomId: [player1, player2] }

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '/public'))); // Serve static files from the public directory

// ルートエンドポイントを設定
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/index.html')); // Correct path to index.html
});

// WebSocket接続時の処理
wss.on("connection", (ws) => {
    console.log("新しいプレイヤーが接続");

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "findMatch") {
            if (waitingPlayer === null) {
                // 待機プレイヤーがいないなら、待機状態にする
                waitingPlayer = ws;
                console.log("プレイヤーがマッチング待機");
            } else {
                // すでに待機しているプレイヤーがいるなら、マッチング
                const player1 = waitingPlayer;
                const player2 = ws;
                waitingPlayer = null;

                const roomId = Math.random().toString(36).substr(2, 6);
                rooms[roomId] = [player1, player2];

                console.log(`マッチング成功: ルームID ${roomId}`);

                // ランダムに先手を決定（0または1）
                const firstPlayerIndex = Math.floor(Math.random() * 2);
                const [firstPlayer, secondPlayer] = firstPlayerIndex === 0 ? [player1, player2] : [player2, player1];

                console.log(`先手プレイヤーが決定されました`);

                // 両プレイヤーにゲーム開始を通知（プレイヤー番号とともに先手情報も送信）
                firstPlayer.send(JSON.stringify({ 
                    type: "gameStart", 
                    roomId, 
                    playerNumber: 1,
                    isFirstMove: true
                }));
                secondPlayer.send(JSON.stringify({ 
                    type: "gameStart", 
                    roomId, 
                    playerNumber: 2,
                    isFirstMove: false
                }));
            }
        }

        if (data.type === 'move') {
            const roomId = data.roomId;
            console.log('動きが受信されました:', data.move, 'ルームID:', roomId);
            
            // 同じルームのクライアントにのみ動きを送信
            if (rooms[roomId]) {
                rooms[roomId].forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'move',
                            move: data.move,
                            roomId: roomId
                        }));
                    }
                });
            }
        }
    });

    ws.on("close", () => {
        if (waitingPlayer === ws) {
            waitingPlayer = null;
        }
        // 部屋からプレイヤーを削除
        for (const roomId in rooms) {
            rooms[roomId] = rooms[roomId].filter(player => player !== ws);
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
            }
        }
        console.log("プレイヤーが切断");
    });
});

// サーバーをポート3000で起動
server.listen(3000, () => {
    console.log("サーバーがポート3000で起動");
});
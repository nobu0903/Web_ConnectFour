import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import cors from 'cors';
import User from './models/User.js';
import { calculateNewRatings } from './utils/rating.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// セキュリティ設定
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://web-connectfour.onrender.com'] 
        : '*'
}));

// レート制限の設定
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100 // IPアドレスごとのリクエスト数
});
app.use('/api/', limiter);

// MongoDBに接続
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB接続成功');
        console.log('接続URL:', process.env.MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@'));
    })
    .catch(err => {
        console.error('MongoDB接続エラー:', err);
        console.error('接続URL:', process.env.MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@'));
    });

app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

let waitingPlayer = null;
let rooms = {}; // { roomId: { players: [player1, player2], userIds: [userId1, userId2] } }

// ユーザー登録エンドポイント
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // ユーザー名が既に存在するかチェック
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'このユーザー名は既に使用されています' });
        }

        // 新しいユーザーを作成
        const user = new User({ username, password });
        await user.save();

        // JWTトークンを生成
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// ログインエンドポイント
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('ログイン試行:', { username });
        
        // ユーザーを検索
        const user = await User.findOne({ username });
        if (!user) {
            console.log('ユーザーが見つかりません:', username);
            return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
        }

        // パスワードを検証
        const isValidPassword = await user.comparePassword(password);
        console.log('パスワード検証結果:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('パスワードが一致しません:', username);
            return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
        }

        // JWTトークンを生成
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        console.log('ログイン成功:', username);
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ error: error.message });
    }
});

// ランキング取得エンドポイント
app.get('/api/rankings', async (req, res) => {
    try {
        const rankings = await User.find()
            .select('username rating wins losses')
            .sort({ rating: -1 })
            .limit(100);
        res.json(rankings);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/index.html'));
});

// WebSocket接続の認証
async function authenticateConnection(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(decoded.userId);
    } catch (error) {
        return null;
    }
}

wss.on("connection", async (ws, req) => {
    console.log("新しいプレイヤーが接続");
    
    // クエリパラメータからトークンを取得
    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    const user = await authenticateConnection(token);
    
    if (!user) {
        console.log("認証失敗: トークンが無効です");
        ws.close();
        return;
    }
    
    console.log("認証成功。ユーザーID:", user._id);
    ws.userId = user._id;
    ws.rating = user.rating;

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);
            console.log("受信したメッセージ:", data);

            if (data.type === "findMatch") {
                console.log("マッチング要求を受信。現在の待機プレイヤー状態:");
                console.log("- 待機プレイヤー存在:", waitingPlayer !== null);
                if (waitingPlayer) {
                    console.log("- 待機プレイヤーID:", waitingPlayer.userId);
                    console.log("- 要求元プレイヤーID:", ws.userId);
                }
                
                if (waitingPlayer === null) {
                    // 待機プレイヤーがいないなら、待機状態にする
                    waitingPlayer = ws;
                    console.log("プレイヤーをマッチング待機状態に設定。プレイヤーID:", ws.userId);
                } else if (waitingPlayer !== ws) {
                    // すでに待機しているプレイヤーがいるなら、マッチング
                    const player1 = waitingPlayer;
                    const player2 = ws;
                    console.log("マッチング成立。プレイヤー1:", player1.userId, "プレイヤー2:", player2.userId);
                    
                    waitingPlayer = null;

                    const roomId = Math.random().toString(36).substr(2, 6);
                    rooms[roomId] = {
                        players: [player1, player2],
                        userIds: [player1.userId, player2.userId]
                    };

                    console.log("新しいルームを作成:", roomId);
                    console.log("ルーム情報:", rooms[roomId]);

                    // ランダムに先手を決定（0または1）
                    const firstPlayerIndex = Math.floor(Math.random() * 2);
                    const [firstPlayer, secondPlayer] = firstPlayerIndex === 0 ? [player1, player2] : [player2, player1];

                    console.log("先手プレイヤー:", firstPlayer.userId);

                    try {
                        firstPlayer.send(JSON.stringify({ 
                            type: "gameStart", 
                            roomId, 
                            playerNumber: 1,
                            isFirstMove: true,
                            rating: firstPlayer.rating,
                            opponentRating: secondPlayer.rating
                        }));
                        console.log("先手プレイヤーにメッセージを送信");

                        secondPlayer.send(JSON.stringify({ 
                            type: "gameStart", 
                            roomId, 
                            playerNumber: 2,
                            isFirstMove: false,
                            rating: secondPlayer.rating,
                            opponentRating: firstPlayer.rating
                        }));
                        console.log("後手プレイヤーにメッセージを送信");
                    } catch (error) {
                        console.error("プレイヤーへのメッセージ送信中にエラー:", error);
                        // エラーが発生した場合、ルームをクリーンアップ
                        delete rooms[roomId];
                        waitingPlayer = null;
                    }
                } else {
                    console.log("同じプレイヤーからのマッチング要求を無視。プレイヤーID:", ws.userId);
                }
            }

            if (data.type === 'gameEnd') {
                const room = rooms[data.roomId];
                if (room) {
                    const player1 = await User.findById(room.userIds[0]);
                    const player2 = await User.findById(room.userIds[1]);
                    
                    const ratings = calculateNewRatings(player1.rating, player2.rating, data.result);
                    
                    // レーティングと戦績を更新
                    player1.rating = ratings.player1NewRating;
                    player2.rating = ratings.player2NewRating;
                    
                    if (data.result === 'win') {
                        player1.wins += 1;
                        player2.losses += 1;
                    } else if (data.result === 'loss') {
                        player1.losses += 1;
                        player2.wins += 1;
                    } else {
                        player1.draws += 1;
                        player2.draws += 1;
                    }
                    
                    await player1.save();
                    await player2.save();
                    
                    // 両プレイヤーに結果を通知
                    room.players.forEach((player, index) => {
                        player.send(JSON.stringify({
                            type: 'gameResult',
                            newRating: index === 0 ? ratings.player1NewRating : ratings.player2NewRating,
                            ratingChange: index === 0 ? ratings.ratingChange1 : ratings.ratingChange2
                        }));
                    });
                    
                    delete rooms[data.roomId];
                }
            }

            if (data.type === 'move') {
                const roomId = data.roomId;
                console.log('動きが受信されました:', data.move, 'ルームID:', roomId);
                
                // 同じルームのクライアントにのみ動きを送信
                if (rooms[roomId]) {
                    rooms[roomId].players.forEach((client) => {
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
        } catch (error) {
            console.error("メッセージ処理中にエラー:", error);
        }
    });

    ws.on("close", () => {
        console.log("プレイヤーが切断。プレイヤーID:", ws.userId);
        if (waitingPlayer === ws) {
            console.log("待機プレイヤーが切断したため、待機キューをリセット");
            waitingPlayer = null;
        }
        // 部屋からプレイヤーを削除
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const wasInRoom = room.players.includes(ws);
            room.players = room.players.filter(player => player !== ws);
            if (wasInRoom) {
                console.log(`プレイヤー(${ws.userId})をルーム${roomId}から削除`);
            }
            if (room.players.length === 0) {
                console.log(`ルーム${roomId}を削除（プレイヤーが不在）`);
                delete rooms[roomId];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;  // 環境変数 PORT を優先
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
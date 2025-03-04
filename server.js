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
const wss = new WebSocketServer({ 
    server,
    perMessageDeflate: {
        zlibDeflateOptions: {
            level: 6,  // 圧縮レベル（1-9）、6は速度とサイズのバランス
            memLevel: 8
        },
        clientTracking: true,
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        threshold: 1024 // 1KB以上のメッセージのみ圧縮
    },
    maxPayload: 50 * 1024 // 最大ペイロードサイズを50KBに制限
});

// プロキシの信頼設定
app.set('trust proxy', 1);

// セキュリティ設定
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "ws://localhost:3000", "wss://localhost:3000"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
}));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// レート制限の設定
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // IPアドレスごとのリクエスト数
    standardHeaders: true, // `RateLimit-*`ヘッダーを含める
    legacyHeaders: false, // `X-RateLimit-*`ヘッダーを無効化
    handler: (req, res) => {
        res.status(429).json({
            error: 'リクエスト制限を超過しました。しばらく待ってから再試行してください。'
        });
    }
});
app.use('/api/', limiter);

// MongoDBに接続
console.log('MongoDB接続を開始...');
const startTime = Date.now();

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 10, // 接続プールのサイズを設定
    minPoolSize: 2,  // 最小プールサイズ
    maxIdleTimeMS: 30000, // アイドル接続のタイムアウト
})
    .then(() => {
        const connectionTime = Date.now() - startTime;
        console.log(`MongoDB接続成功 (${connectionTime}ms)`);
        console.log('接続URL:', process.env.MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@'));
        
        // 接続成功後にインデックスを作成/更新
        return User.collection.getIndexes();
    })
    .then(indexes => {
        console.log('現在のインデックス:', indexes);
    })
    .catch(err => {
        console.error('MongoDB接続エラー:', err);
        console.error('接続URL:', process.env.MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@'));
    });

// MongoDBの接続監視
mongoose.connection.on('connected', () => {
    console.log('Mongoose: 接続完了');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose: 接続エラー:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose: 切断');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '/public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        const cacheControl = 'public, max-age=86400, immutable';
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', cacheControl);
            res.setHeader('X-Content-Type-Options', 'nosniff');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.setHeader('Cache-Control', cacheControl);
            res.setHeader('X-Content-Type-Options', 'nosniff');
        } else if (path.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            res.setHeader('Cache-Control', cacheControl);
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
    },
    immutable: true,
    cacheControl: true,
    dotfiles: 'ignore',
    index: false
}));

let waitingPlayer = null;
let rooms = {}; // { roomId: { players: [player1, player2], userIds: [userId1, userId2] } }

// ランキングキャッシュ
let rankingsCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 1分間キャッシュを保持

// 認証キャッシュ
const authCache = new Map();
const AUTH_CACHE_DURATION = 30 * 60 * 1000; // 30分

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
        
        if (!username || !password) {
            console.log('ユーザー名またはパスワードが未入力');
            return res.status(400).json({ error: 'ユーザー名とパスワードを入力してください' });
        }

        // MongoDBの接続状態を確認
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB接続エラー: 接続が確立されていません');
            return res.status(500).json({ error: 'データベース接続エラー' });
        }
        
        // ユーザーを検索
        const user = await User.findOne({ username }).catch(err => {
            console.error('ユーザー検索エラー:', err);
            return null;
        });

        if (!user) {
            console.log('ユーザーが見つかりません:', username);
            return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
        }

        // パスワードを検証
        let isValidPassword;
        try {
            isValidPassword = await user.comparePassword(password);
            console.log('パスワード検証結果:', isValidPassword);
        } catch (err) {
            console.error('パスワード検証エラー:', err);
            return res.status(500).json({ error: 'パスワード検証中にエラーが発生しました' });
        }
        
        if (!isValidPassword) {
            console.log('パスワードが一致しません:', username);
            return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
        }

        // JWT_SECRETの存在確認
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET環境変数が設定されていません');
            return res.status(500).json({ error: 'サーバー設定エラー' });
        }

        // JWTトークンを生成
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        console.log('ログイン成功:', username);
        res.json({ token });
    } catch (error) {
        console.error('ログインエラーの詳細:', error);
        res.status(500).json({ 
            error: 'サーバーエラーが発生しました',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ランキング取得エンドポイント
app.get('/api/rankings', async (req, res) => {
    try {
        const queryStartTime = Date.now();
        console.log('ランキング取得リクエストを受信');

        // MongoDBの接続状態を確認
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB接続エラー: 接続が確立されていません');
            return res.status(503).json({ 
                error: 'データベース接続エラー',
                message: 'サーバーが一時的に利用できません。しばらくしてから再試行してください。'
            });
        }

        // キャッシュが有効な場合はキャッシュを返す
        const now = Date.now();
        if (rankingsCache && (now - lastCacheTime) < CACHE_DURATION) {
            const responseTime = Date.now() - queryStartTime;
            console.log(`ランキングキャッシュヒット (${responseTime}ms)`);
            return res.json({
                success: true,
                data: rankingsCache,
                fromCache: true
            });
        }

        console.log('ランキングデータをDBから取得中...');
        const rankings = await User.find()
            .select('username rating wins losses -_id')
            .sort({ rating: -1, wins: -1 })
            .limit(100)
            .lean()
            .exec();

        if (!rankings || rankings.length === 0) {
            console.log('ランキングデータが空です');
            return res.json({
                success: true,
                data: [],
                message: 'ランキングデータがまだありません'
            });
        }

        // キャッシュを更新
        rankingsCache = rankings;
        lastCacheTime = now;

        const queryEndTime = Date.now() - queryStartTime;
        console.log(`ランキングデータ取得完了 (${queryEndTime}ms)`);
        console.log(`取得件数: ${rankings.length}`);

        res.json({
            success: true,
            data: rankings,
            fromCache: false,
            count: rankings.length
        });

    } catch (error) {
        console.error('ランキング取得エラー:', error);
        res.status(500).json({ 
            error: 'ランキングの取得に失敗しました',
            message: 'サーバーエラーが発生しました。しばらくしてから再試行してください。',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ユーザー数取得エンドポイント
app.get('/api/user-count', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('ユーザー数取得エラー:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/index.html'));
});

// WebSocket接続の認証
async function authenticateConnection(token) {
    try {
        // キャッシュをチェック
        const cachedAuth = authCache.get(token);
        if (cachedAuth && (Date.now() - cachedAuth.timestamp) < AUTH_CACHE_DURATION) {
            return cachedAuth.user;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (user) {
            // キャッシュを更新
            authCache.set(token, {
                user: user,
                timestamp: Date.now()
            });
        }
        
        return user;
    } catch (error) {
        return null;
    }
}

// 定期的にキャッシュをクリーンアップ
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of authCache.entries()) {
        if (now - data.timestamp > AUTH_CACHE_DURATION) {
            authCache.delete(token);
        }
    }
}, 60 * 60 * 1000); // 1時間ごとにクリーンアップ

// パフォーマンスモニタリング
let lastPingTime = new Map();
wss.on('connection', async (ws, req) => {
    // 接続時のタイムスタンプを記録
    const connectionStartTime = Date.now();
    console.log(`新しい接続を受信 (${connectionStartTime})`);

    // Pingインターバルの設定
    const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            const start = Date.now();
            lastPingTime.set(ws, start);
            ws.ping();
        }
    }, 30000); // 30秒ごとにping

    ws.on('pong', () => {
        const latency = Date.now() - lastPingTime.get(ws);
        console.log(`WebSocket接続レイテンシ: ${latency}ms`);
    });

    ws.on('close', () => {
        clearInterval(pingInterval);
        lastPingTime.delete(ws);
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
    ws.username = user.username;  // ユーザーネームを保存

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);
            console.log("受信したメッセージ:", data);

            if (data.type === "findMatch") {
                console.log("マッチング要求を受信。現在の待機プレイヤー状態:");
                console.log("- 待機プレイヤー存在:", waitingPlayer !== null);
                if (waitingPlayer) {
                    console.log("- 待機プレイヤーID:", waitingPlayer.userId);
                    console.log("- 待機プレイヤーユーザーネーム:", waitingPlayer.username);
                    console.log("- 要求元プレイヤーID:", ws.userId);
                    console.log("- 要求元プレイヤーユーザーネーム:", ws.username);
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
                            opponentRating: secondPlayer.rating,
                            myUsername: firstPlayer.username,
                            opponentUsername: secondPlayer.username
                        }));
                        console.log("先手プレイヤーにメッセージを送信");

                        secondPlayer.send(JSON.stringify({ 
                            type: "gameStart", 
                            roomId, 
                            playerNumber: 2,
                            isFirstMove: false,
                            rating: secondPlayer.rating,
                            opponentRating: firstPlayer.rating,
                            myUsername: secondPlayer.username,
                            opponentUsername: firstPlayer.username
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
                    
                    let result;
                    if (data.isDraw) {
                        result = 'draw';
                    } else {
                        // 勝者がplayer1かどうかを判定
                        const isPlayer1Winner = room.players[0].userId.toString() === ws.userId.toString() && data.winner === 'red' ||
                                             room.players[1].userId.toString() === ws.userId.toString() && data.winner === 'yellow';
                        result = isPlayer1Winner ? 'win' : 'loss';
                    }
                    
                    const oldRating1 = player1.rating;
                    const oldRating2 = player2.rating;
                    
                    const ratings = calculateNewRatings(oldRating1, oldRating2, result);
                    
                    // レーティングと戦績を更新
                    player1.rating = ratings.player1NewRating;
                    player2.rating = ratings.player2NewRating;
                    
                    if (result === 'win') {
                        player1.wins += 1;
                        player2.losses += 1;
                    } else if (result === 'loss') {
                        player1.losses += 1;
                        player2.wins += 1;
                    } else {
                        player1.draws += 1;
                        player2.draws += 1;
                    }
                    
                    await player1.save();
                    await player2.save();
                    
                    // ランキングキャッシュをクリア
                    clearRankingsCache();
                    
                    // 両プレイヤーに結果を通知
                    room.players.forEach((player, index) => {
                        const isFirstPlayer = index === 0;
                        const oldRating = isFirstPlayer ? oldRating1 : oldRating2;
                        const newRating = isFirstPlayer ? ratings.player1NewRating : ratings.player2NewRating;
                        
                        player.send(JSON.stringify({
                            type: 'gameResult',
                            oldRating: oldRating,
                            newRating: newRating,
                            ratingChange: newRating - oldRating,
                            result: isFirstPlayer ? result : (result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'draw')
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
});

// ゲーム終了時にキャッシュをクリア
function clearRankingsCache() {
    rankingsCache = null;
    lastCacheTime = 0;
}

const PORT = process.env.PORT || 3000;  // 環境変数 PORT を優先
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
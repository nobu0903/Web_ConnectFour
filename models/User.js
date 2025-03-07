import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 1500,  // 初期レーティング
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// レーティングのインデックス
userSchema.index({ rating: -1 });

// パフォーマンス監視のためのミドルウェア
userSchema.pre('find', function() {
    this._startTime = Date.now();
});

userSchema.post('find', function() {
    if (this._startTime) {
        console.log(`クエリ実行時間: ${Date.now() - this._startTime}ms`);
    }
});

// パスワードのハッシュ化
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// パスワード検証メソッド
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User; 
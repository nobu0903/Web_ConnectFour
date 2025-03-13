// Eloレーティングの計算
export function calculateNewRatings(player1Rating, player2Rating, result, isComputerMatch = false) {
    // 基本のK値を大きくする
    let K = 48;  // 32から48に増加
    
    if (isComputerMatch) {
        // コンピューター対戦時はさらに大きなK値を使用
        K = 64;
    } else {
        // 人間同士の対戦ではレート差に応じてK値を調整
        const ratingDiff = Math.abs(player1Rating - player2Rating);
        if (ratingDiff < 200) {
            K = 48;  // 標準的な変動
        } else if (ratingDiff < 400) {
            K = 56;  // レート差が大きい場合はより大きな変動
        } else {
            K = 64;  // レート差が非常に大きい場合は最大の変動
        }
    }

    // 期待勝率の計算
    const expectedScore1 = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));
    const expectedScore2 = 1 - expectedScore1;

    // 実際のスコア
    const actualScore1 = result ? 1 : 0;
    const actualScore2 = result ? 0 : 1;

    // 新しいレーティングを計算
    const player1NewRating = Math.round(player1Rating + K * (actualScore1 - expectedScore1));
    const player2NewRating = Math.round(player2Rating + K * (actualScore2 - expectedScore2));

    return {
        player1NewRating,
        player2NewRating
    };
} 
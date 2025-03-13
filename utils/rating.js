// Eloレーティングの計算
export function calculateNewRatings(player1Rating, player2Rating, result, isComputerMatch = false) {
    // レート差に応じてK値を調整
    const ratingDiff = Math.abs(player1Rating - player2Rating);
    let K;
    
    if (isComputerMatch) {
        // コンピューター対戦時は固定のK値を使用
        K = 64;
    } else {
        // レート差に応じてK値を調整
        if (ratingDiff < 200) {
            K = 64; // レート差が小さい場合は標準的な変動
        } else if (ratingDiff < 400) {
            K = 64; // レート差が中程度の場合は控えめな変動
        } else {
            K = 64; // レート差が大きい場合は小さな変動
        }
    }

    const expectedScore1 = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));
    const expectedScore2 = 1 - expectedScore1;

    let actualScore1, actualScore2;
    
    if (result === 'win') {
        actualScore1 = 1;
        actualScore2 = 0;
    } else if (result === 'loss') {
        actualScore1 = 0;
        actualScore2 = 1;
    } else { // draw
        actualScore1 = 0.5;
        actualScore2 = 0.5;
    }

    const newRating1 = Math.round(player1Rating + K * (actualScore1 - expectedScore1));
    const newRating2 = Math.round(player2Rating + K * (actualScore2 - expectedScore2));

    return {
        player1NewRating: newRating1,
        player2NewRating: newRating2
    };
} 
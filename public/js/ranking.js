// ランキングデータを取得する関数
async function fetchRankings() {
    try {
        const response = await fetch('/api/rankings');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rankings = await response.json();
        return rankings;
    } catch (error) {
        console.error('ランキング取得エラー:', error);
        return [];
    }
}

// ユーザー数を取得する関数
async function fetchUserCount() {
    try {
        const response = await fetch('/api/user-count');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.count;
    } catch (error) {
        console.error('ユーザー数取得エラー:', error);
        return 0;
    }
}

// ランキングテーブルを更新する関数
function updateRankingTable(rankings) {
    const tbody = document.getElementById('ranking-body');
    if (!tbody) {
        console.error('ランキングテーブルが見つかりません');
        return;
    }
    tbody.innerHTML = '';

    rankings.forEach((user, index) => {
        const row = document.createElement('tr');
        const totalGames = user.wins + user.losses;
        const winRate = totalGames > 0 ? ((user.wins / totalGames) * 100).toFixed(1) : '0.0';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.username}</td>
            <td>${user.rating}</td>
            <td>${user.wins}</td>
            <td>${user.losses}</td>
            <td class="win-rate">${winRate}%</td>
        `;
        
        tbody.appendChild(row);
    });
}

// ランキングを表示する関数
async function showRankings() {
    try {
        const userCount = await fetchUserCount();
        console.log('登録ユーザー数:', userCount);
        
        const rankings = await fetchRankings();
        if (rankings.length === 0) {
            const tbody = document.getElementById('ranking-body');
            tbody.innerHTML = '<tr><td colspan="6">ランキングデータがありません</td></tr>';
            return;
        }
        updateRankingTable(rankings);
    } catch (error) {
        console.error('ランキング表示エラー:', error);
    }
}

// ページ読み込み時にランキングを表示
document.addEventListener('DOMContentLoaded', () => {
    showRankings();
});


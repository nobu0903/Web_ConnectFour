// ランキングデータを取得する関数
async function fetchRankings() {
    try {
        const response = await fetch('/api/rankings');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'ランキングの取得に失敗しました');
        }
        return result.data;
    } catch (error) {
        console.error('ランキング取得エラー:', error);
        throw error;
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
    
    if (!rankings || rankings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">ランキングデータがありません</td></tr>';
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
    const loadingElement = document.createElement('div');
    loadingElement.id = 'ranking-loading';
    loadingElement.textContent = 'ランキングを読み込み中...';
    document.body.appendChild(loadingElement);

    try {
        const [userCount, rankings] = await Promise.all([
            fetchUserCount(),
            fetchRankings()
        ]);
        
        console.log('登録ユーザー数:', userCount);
        updateRankingTable(rankings);
        
    } catch (error) {
        console.error('ランキング表示エラー:', error);
        const tbody = document.getElementById('ranking-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="error-message">
                ランキングの読み込みに失敗しました。<br>
                ページを更新してください。
            </td></tr>`;
        }
    } finally {
        const loadingElement = document.getElementById('ranking-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}

// ページ読み込み時にランキングを表示
document.addEventListener('DOMContentLoaded', () => {
    showRankings();
});


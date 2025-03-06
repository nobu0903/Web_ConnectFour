const https = require('https');

exports.handler = async (event, context) => {
    const url = 'https://web-connectfour.onrender.com/ping/';

    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            // リダイレクトの処理
            if (res.statusCode === 301 || res.statusCode === 302) {
                const redirectUrl = res.headers.location;
                console.log(`リダイレクト先: ${redirectUrl}`);
                // リダイレクト先のURLで新しいリクエストを送信
                https.get(redirectUrl, (redirectRes) => {
                    if (redirectRes.statusCode === 200) {
                        resolve({
                            statusCode: 200,
                            body: 'サーバーが正常にPingされました',
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        reject(
                            new Error(`サーバーPing失敗: ステータスコード ${redirectRes.statusCode}`)
                        );
                    }
                }).on('error', (error) => {
                    reject(error);
                });
            } else if (res.statusCode === 200) {
                resolve({
                    statusCode: 200,
                    body: 'サーバーが正常にPingされました',
                    timestamp: new Date().toISOString()
                });
            } else {
                reject(
                    new Error(`サーバーPing失敗: ステータスコード ${res.statusCode}`)
                );
            }
        });
        //error handling
        req.on('error', (error) => {
            reject(error);
        });
        //error handling
        // タイムアウトを設定
        req.setTimeout(5000, () => {
            req.abort();
            reject(new Error('Pingリクエストがタイムアウトしました'));
        });

        req.end();
    });
}; 
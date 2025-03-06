const https = require('https');

exports.handler = async (event, context) => {
    const url = 'https://web-connectfour.onrender.com/ping';

    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            if (res.statusCode === 200) {
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
const https = require('https');

exports.handler = async (event, context) => {
    const url = 'https://web-connectfour.onrender.com/ping/';

    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';

            // レスポンスデータの収集
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const responseData = JSON.parse(data);
                        resolve({
                            statusCode: 200,
                            body: responseData,
                            timestamp: new Date().toISOString()
                        });
                    } catch (error) {
                        reject(new Error(`JSON解析エラー: ${error.message}`));
                    }
                } else {
                    reject(
                        new Error(`サーバーPing失敗: ステータスコード ${res.statusCode}, レスポンス: ${data}`)
                    );
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`リクエストエラー: ${error.message}`));
        });
        //error handling
        // タイムアウトを設定
        req.setTimeout(10000, () => {
            req.abort();
            reject(new Error('Pingリクエストがタイムアウトしました（10秒）'));
        });

        req.end();
    });
}; 
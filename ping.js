const https = require('https');

exports.handler = async (event, context) => {
    const url = 'https://web-connectfour.onrender.com/ping';

    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';

            // リダイレクトの処理
            if (res.statusCode === 301 || res.statusCode === 302) {
                const redirectUrl = res.headers.location;
                console.log(`リダイレクト先: ${redirectUrl}`);
                
                // リダイレクト先のURLで新しいリクエストを送信
                https.get(redirectUrl, (redirectRes) => {
                    let redirectData = '';
                    
                    redirectRes.on('data', (chunk) => {
                        redirectData += chunk;
                    });

                    redirectRes.on('end', () => {
                        if (redirectRes.statusCode === 200) {
                            try {
                                const responseData = JSON.parse(redirectData);
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
                                new Error(`サーバーPing失敗: ステータスコード ${redirectRes.statusCode}, レスポンス: ${redirectData}`)
                            );
                        }
                    });
                }).on('error', (error) => {
                    reject(new Error(`リダイレクトリクエストエラー: ${error.message}`));
                });
            } else {
                // 通常のレスポンス処理
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
            }
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
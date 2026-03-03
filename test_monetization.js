import https from 'https';

async function check(url) {
    let targetUrl = url;
    try {
        const response = await new Promise((req, rej) =>
            https.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }, res => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => req(d));
            }).on('error', rej)
        );

        let html = response;
        const isVideo = targetUrl.includes('/watch') || targetUrl.includes('youtu.be/');

        console.log(`Initial HTML Size: ${html.length}`);

        if (!isVideo) {
            // First try standard watch links
            let match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);

            // If that fails, try ytInitialData JSON structure
            if (!match) {
                console.log("Standard regex failed. Trying ytInitialData parser...");
                const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
                if (videoIdMatch) {
                    match = videoIdMatch;
                }
            }

            console.log('Found video match:', match ? match[1] : 'None');

            if (match) {
                const videoUrl = 'https://www.youtube.com/watch?v=' + match[1];
                console.log(`Fetching video: ${videoUrl}`);
                const videoRes = await new Promise((req, rej) =>
                    https.get(videoUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    }, res => {
                        let d = '';
                        res.on('data', c => d += c);
                        res.on('end', () => req(d))
                    }).on('error', rej)
                );
                html = videoRes;
                console.log(`Video HTML Size: ${html.length}`);
            }
        }

        const flags = [
            '"is_monetization_enabled":"true"',
            '"is_monetization_enabled":true',
            '"key":"yt_ad","value":"1"',
            '\\"yt_ad\\": \\"1\\"',
            '"adPlacements":[{',
            '{"key":"is_monetization_enabled","value":"true"}',
            'adPlacementRenderer'
        ];

        const results = flags.map(f => ({
            flag: f,
            found: html.includes(f)
        }));

        console.table(results);

    } catch (e) {
        console.error(e);
    }
}

check('https://www.youtube.com/@MrBeast');

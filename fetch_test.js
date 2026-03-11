const https = require('https');

function fetch(url) {
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`\n--- Status: ${res.statusCode} [${url}] ---`);
            console.log(data);
        });
    }).on('error', (e) => {
        console.error(e);
    });
}

fetch("https://morentiumapp.vercel.app/api/check-subscription?userId=999");
fetch("https://morentiumapp.vercel.app/api/leaderboard");

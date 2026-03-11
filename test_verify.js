const https = require('https');

const data = JSON.stringify({ key: 'test', hwid: 'test' });

const req = https.request({
    hostname: 'morentiumapp.vercel.app',
    port: 443,
    path: '/api/verify_key',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Status: ' + res.statusCode + '\nBody: ' + body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();

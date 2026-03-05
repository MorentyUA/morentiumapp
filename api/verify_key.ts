import { list, put } from '@vercel/blob';

export default async function handler(req: any, res: any) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const { key, hwid, userId } = req.body;

    if (!key || !hwid) {
        return res.status(400).json({ error: 'Missing key or hwid parameter' });
    }

    try {
        // 1. Check if key exists in Blob
        const { blobs } = await list({
            prefix: `morvoice/keys/${key}.json`,
            token: process.env.morespace_READ_WRITE_TOKEN
        });

        if (blobs.length === 0) {
            return res.status(404).json({ error: 'Ключ не знайдено або він недійсний.', valid: false });
        }

        const blobUrl = blobs[0].downloadUrl;
        const keyResponse = await fetch(blobUrl);
        const keyData = await keyResponse.json();

        // 2. HWID Verification Logic
        if (keyData.hwid === null) {
            // First time activation! Bind the HWID to this key.
            keyData.hwid = hwid;
            keyData.status = 'active';
            keyData.activatedAt = Date.now();

            await put(`morvoice/keys/${key}.json`, JSON.stringify(keyData), {
                access: 'public',
                addRandomSuffix: false,
                token: process.env.morespace_READ_WRITE_TOKEN
            });
            return res.status(200).json({ valid: true, message: 'Ключ успішно активовано на цьому пристрої!', status: 'newly_activated' });
        } else {
            // Key was already activated. Check if HWID matches.
            if (keyData.hwid !== hwid) {
                return res.status(403).json({ error: 'Цей ключ вже активовано на іншому комп\'ютері. Відмовлено у доступі.', valid: false });
            } else {
                // HWID matches, welcome back.
                return res.status(200).json({ valid: true, message: 'Доступ дозволено.', status: 'active' });
            }
        }

    } catch (error: any) {
        console.error("Error verifying key:", error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message || error.toString(), valid: false });
    }
}

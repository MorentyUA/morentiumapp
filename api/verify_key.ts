import { kv } from '@vercel/kv';

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
        // 1. Check if key exists in KV
        const keyData: any = await kv.get(`morvoice_key:${key}`);

        if (!keyData) {
            return res.status(404).json({ error: 'Ключ не знайдено або він недійсний.', valid: false });
        }

        // 2. HWID Verification Logic
        if (keyData.hwid === null) {
            // First time activation! Bind the HWID to this key.
            keyData.hwid = hwid;
            keyData.status = 'active';
            keyData.activatedAt = Date.now();

            await kv.set(`morvoice_key:${key}`, keyData);
            return res.status(200).json({ valid: true, message: 'Ключ успішно активовано на цьому пристрої!', status: 'newly_activated' });
        } else {
            // Key was already activated. Check if HWID matches.
            if (keyData.hwid !== hwid) {
                return res.status(403).json({ error: 'Цей ключ вже активовано на іншому комп\'ютері. Відмовлено у доступі.', valid: false });
            } else {
                // HWID matches, welcome back.

                // Optional: Re-verify Telegram Subscription every time they launch?
                // (Depends on how strict you want to be. For now let's just allow if HWID matches).
                return res.status(200).json({ valid: true, message: 'Доступ дозволено.', status: 'active' });
            }
        }

    } catch (error) {
        console.error("Error verifying key:", error);
        return res.status(500).json({ error: 'Internal Server Error', valid: false });
    }
}

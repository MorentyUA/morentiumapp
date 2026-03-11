import { Redis } from '@upstash/redis';

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

    const { key, hwid } = req.body;

    if (!key || !hwid) {
        return res.status(400).json({ error: 'Missing key or hwid parameter' });
    }

    const redis = Redis.fromEnv();

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const PRIVATE_GROUP_ID = process.env.PRIVATE_GROUP_ID || process.env.GROUP_ID || '-1003699693654';

    try {
        // 1. Check if key exists in Redis
        const keyData: any = await redis.get(`morvoice:keys:${key}`);

        if (!keyData) {
            return res.status(404).json({ error: 'Ключ не знайдено або він недійсний.', valid: false });
        }

        // 2. HWID Verification Logic
        if (keyData.hwid === null) {
            // First time activation! Bind the HWID to this key.
            keyData.hwid = hwid;
            keyData.status = 'active';
            keyData.activatedAt = Date.now();

            await redis.set(`morvoice:keys:${key}`, keyData);

            return res.status(200).json({ valid: true, message: 'Ключ успішно активовано на цьому пристрої!', status: 'newly_activated' });
        } else {
            // Key was already activated. Check if HWID matches.
            if (keyData.hwid !== hwid) {
                return res.status(403).json({ error: 'Цей ключ вже активовано на іншому комп\'ютері. Відмовлено у доступі.', valid: false });
            } else {
                // 3. Telegram Group Membership Check
                // If the key and HWID match, we still need to verify they haven't left the group.
                if (BOT_TOKEN && keyData.userId) {
                    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${PRIVATE_GROUP_ID}&user_id=${keyData.userId}`);
                    const tData = await response.json();

                    let isSubscribed = false;
                    if (tData.ok) {
                        const status = tData.result.status;
                        isSubscribed = ['member', 'administrator', 'creator', 'restricted'].includes(status);
                    }

                    if (!isSubscribed) {
                        return res.status(403).json({ error: 'Ви покинули закриту групу. Доступ до MOR VOICE призупинено.', valid: false });
                    }
                }

                // Return Welcome Back if everything is fine
                return res.status(200).json({ valid: true, message: 'Доступ дозволено.', status: 'active' });
            }
        }
    } catch (error: any) {
        console.error("Error verifying key:", error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message || error.toString(), valid: false });
    }
}

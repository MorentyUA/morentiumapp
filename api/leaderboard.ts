import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const STORE_FILE = 'leaderboard.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const redis = Redis.fromEnv();
        const data: any = await redis.get('twa:leaderboard');

        if (!data || !Array.isArray(data)) {
            return res.status(200).json([]);
        }

        // Returning top 10 for performance on client
        return res.status(200).json(data.slice(0, 10));

    } catch (e: any) {
        console.error('Leaderboard fetch error:', e);
        res.status(500).json({ error: e.message });
    }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list } from '@vercel/blob';

const STORE_FILE = 'leaderboard.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { blobs } = await list({ token: process.env.morespace_READ_WRITE_TOKEN });
        const storeBlobs = blobs.filter(b => b.pathname.includes('leaderboard'));
        storeBlobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        const existingBlob = storeBlobs[0];

        if (!existingBlob) {
            return res.status(200).json([]);
        }

        const cacheBusterUrl = `${existingBlob.url}?t=${Date.now()}`;
        const response = await fetch(cacheBusterUrl, {
            cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard data');
        }

        const data = await response.json();
        // Returning top 10 for performance on client
        return res.status(200).json(data.slice(0, 10));

    } catch (e: any) {
        console.error('Leaderboard fetch error:', e);
        res.status(500).json({ error: e.message });
    }
}

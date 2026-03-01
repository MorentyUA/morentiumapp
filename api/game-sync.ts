import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, list, del } from '@vercel/blob';

const STORE_FILE = 'leaderboard.json';
const MAX_LEADERBOARD_SIZE = 100;

export interface LeaderboardEntry {
    userId: number | string;
    firstName: string;
    score: number;
    levelName: string;
    levelIcon: string;
    updatedAt: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userId, firstName, score, levelName, levelIcon } = req.body;

        if (!userId || score === undefined) {
            return res.status(400).json({ error: 'Missing userId or score' });
        }

        let entries: LeaderboardEntry[] = [];
        const { blobs } = await list({ token: process.env.morespace_READ_WRITE_TOKEN });
        const storeBlobs = blobs.filter(b => b.pathname.includes('leaderboard'));
        storeBlobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        const existingBlob = storeBlobs[0];

        if (existingBlob) {
            const cacheBusterUrl = `${existingBlob.url}?t=${Date.now()}`;
            const response = await fetch(cacheBusterUrl, {
                cache: 'no-store'
            });
            if (response.ok) {
                entries = await response.json();
            }
        }

        // Update or Insert
        const timestamp = Date.now();
        const existingIndex = entries.findIndex(e => e.userId === userId);

        if (existingIndex > -1) {
            // Only update if the new score is strictly better (or same but we want fresh timestamp/level)
            if (score >= entries[existingIndex].score) {
                entries[existingIndex] = {
                    ...entries[existingIndex],
                    score,
                    firstName: firstName || entries[existingIndex].firstName,
                    levelName: levelName || entries[existingIndex].levelName,
                    levelIcon: levelIcon || entries[existingIndex].levelIcon,
                    updatedAt: timestamp
                };
            }
        } else {
            entries.push({
                userId,
                firstName: firstName || 'Анонім',
                score,
                levelName: levelName || "Дерев'яна кнопка",
                levelIcon: levelIcon || "text-[#8B5A2B]",
                updatedAt: timestamp
            });
        }

        // Sort descending by score
        entries.sort((a, b) => b.score - a.score);

        // Cap size
        if (entries.length > MAX_LEADERBOARD_SIZE) {
            entries = entries.slice(0, MAX_LEADERBOARD_SIZE);
        }

        // Save with random suffix to bypass Vercel Blob CDNs instantly
        const { url, pathname } = await put(STORE_FILE, JSON.stringify(entries), {
            access: 'public',
            addRandomSuffix: true,
            token: process.env.morespace_READ_WRITE_TOKEN
        });

        // Garbage Collect old blobs
        const oldBlobUrls = storeBlobs.filter(b => b.pathname !== pathname).map(b => b.url);
        if (oldBlobUrls.length > 0) {
            await del(oldBlobUrls, { token: process.env.morespace_READ_WRITE_TOKEN }).catch(e => console.error("GC Error", e));
        }

        res.status(200).json({ success: true, url, rank: entries.findIndex(e => e.userId === userId) + 1 });
    } catch (e: any) {
        console.error('Leaderboard sync error:', e);
        res.status(500).json({ error: e.message });
    }
}

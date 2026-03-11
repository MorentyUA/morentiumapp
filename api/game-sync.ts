import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

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

        const redis = Redis.fromEnv();

        // 1. Fetch current leaderboard from Redis
        let entries: LeaderboardEntry[] = [];
        const redisData = await redis.get('twa:leaderboard');

        if (redisData && Array.isArray(redisData)) {
            entries = redisData;
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

        // Save directly to Redis
        await redis.set('twa:leaderboard', entries);

        res.status(200).json({ success: true, rank: entries.findIndex(e => e.userId === userId) + 1 });
    } catch (e: any) {
        console.error('Leaderboard sync error:', e);
        res.status(500).json({ error: e.message });
    }
}

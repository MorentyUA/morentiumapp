import { list } from '@vercel/blob';
import { Redis } from '@upstash/redis';
import 'dotenv/config';

(async function migrate() {
    console.log("Starting Blob to Redis migration...");
    try {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            console.error("Missing Upstash Redis environment variables in .env.local");
            return;
        }

        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        let cursor;
        let totalMigrated = 0;

        do {
            const listResult: any = await list({
                prefix: 'morvoice/keys/',
                cursor,
                token: process.env.morespace_READ_WRITE_TOKEN
            });

            for (const blob of listResult.blobs) {
                const response = await fetch(blob.downloadUrl);
                const keyData = await response.json();
                const keyString = blob.pathname.split('/').pop()?.replace('.json', '');

                if (keyString && keyData) {
                    await redis.set(`morvoice:keys:${keyString}`, keyData);
                    totalMigrated++;
                }
            }

            cursor = listResult.cursor;
        } while (cursor);

        // --- MIGRATE LEADERBOARD ---
        let leaderboardMigrated = false;
        const leaderboardList = await list({
            prefix: 'leaderboard',
            token: process.env.morespace_READ_WRITE_TOKEN
        });

        if (leaderboardList.blobs.length > 0) {
            const storeBlobs = leaderboardList.blobs;
            storeBlobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            const newestLeaderboard = storeBlobs[0];

            const response = await fetch(newestLeaderboard.downloadUrl);
            const leaderboardData = await response.json();

            if (leaderboardData && Array.isArray(leaderboardData)) {
                await redis.set('twa:leaderboard', leaderboardData);
                leaderboardMigrated = true;
            }
        }

        console.log(`Migration completed successfully! Migrated ${totalMigrated} keys to Upstash Redis. Leaderboard migrated: ${leaderboardMigrated}`);

    } catch (error: any) {
        console.error("Migration Error:", error);
    }
})();

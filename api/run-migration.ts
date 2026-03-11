import { list } from '@vercel/blob';
import { Redis } from '@upstash/redis';

export default async function handler(req: any, res: any) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      // Security: only allow GET with a secret key
    const { secret } = req.query;
      if (secret !== 'migrate-morvoice-2024') {
                return res.status(401).json({ error: 'Unauthorized. Pass ?secret=migrate-morvoice-2024' });
      }
      const blobToken = process.env.morespace_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!blobToken) {
              return res.status(500).json({ error: 'Missing Blob token: morespace_READ_WRITE_TOKEN not found.' });
    }
      if (!redisUrl || !redisToken) {
                return res.status(500).json({ error: 'Missing Upstash Redis environment variables.' });
      }
      const redis = new Redis({ url: redisUrl, token: redisToken });
      const results: any = { keys_migrated: 0, keys_errors: [], leaderboard_migrated: false, leaderboard_entries: 0 };

    try {
              // === MIGRATE LICENSE KEYS ===
          let cursor: string | undefined;
              do {
                            const listResult: any = await list({
                                              prefix: 'morvoice/keys/',
                                              cursor,
                                              token: blobToken
                            });
                            for (const blob of listResult.blobs) {
                                              try {
                                                                    const response = await fetch(blob.downloadUrl);
                                                                    const keyData = await response.json();
                                                                    const keyString = blob.pathname.split('/').pop()?.replace('.json', '');

                                                  if (keyString && keyData) {
                                                                            await redis.set(`morvoice:keys:${keyString}`, keyData);
                                                                            results.keys_migrated++;
                                                  }
                                              } catch (e: any) {
                                                                    results.keys_errors.push({ blob: blob.pathname, error: e.message });
                                              }
                            }
                            cursor = listResult.cursor;
              } while (cursor);
              // === MIGRATE LEADERBOARD ===
          const leaderboardList: any = await list({
                        prefix: 'leaderboard',
                        token: blobToken
          });

          if (leaderboardList.blobs.length > 0) {
                        leaderboardList.blobs.sort((a: any, b: any) =>
                                          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                                                               );
                        const newestBlob = leaderboardList.blobs[0];
                        const response = await fetch(newestBlob.downloadUrl);
                        const leaderboardData = await response.json();

                  if (leaderboardData && Array.isArray(leaderboardData)) {
                                    await redis.set('twa:leaderboard', leaderboardData);
                                    results.leaderboard_migrated = true;
                                    results.leaderboard_entries = leaderboardData.length;
                  }
          }
              return res.status(200).json({
                            success: true,
                            message: `Migration complete! Migrated ${results.keys_migrated} license keys and leaderboard (${results.leaderboard_entries} entries).`,
                            ...results
              });

    } catch (error: any) {
              return res.status(500).json({ success: false, error: error.message, partial_results: results });
    }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface SuperSearchVideo {
    id: string;
    title: string;
    thumbnailUrl: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    subscriberCount: number;
    viewCount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, minSubs = '0', maxSubs = '10000', format = 'all', key } = req.query;
    const API_KEY = key || process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'YouTube API Key is missing' });
    }

    if (!query) {
        return res.status(400).json({ error: 'Введіть ключове слово для пошуку' });
    }

    try {
        const minS = parseInt(minSubs as string, 10) || 0;
        const maxS = parseInt(maxSubs as string, 10) || 10000;
        const fmt = format as string;

        // Date Boundary (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const publishedAfter = sevenDaysAgo.toISOString();

        // Build base search params
        // Removed &videoDuration because YouTube drops valid results when chained with publishedAfter
        let baseParams = `part=snippet&maxResults=50&q=${encodeURIComponent(query as string)}&type=video&order=viewCount&key=${API_KEY}`;

        if (fmt === 'stream') {
            baseParams += '&eventType=live';
        } else {
            baseParams += `&publishedAfter=${publishedAfter}`;
        }

        // STEP 1: Fetch Top 100 Videos via Pagination (2 calls)
        let videos: any[] = [];
        let pageToken = '';

        for (let i = 0; i < 2; i++) {
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?${baseParams}${pageToken ? `&pageToken=${pageToken}` : ''}`;
            const searchRes = await fetch(searchUrl);
            if (!searchRes.ok) break; // If second page fails or doesn't exist, just proceed with what we have

            const searchData = await searchRes.json();
            if (searchData.items && searchData.items.length > 0) {
                videos = videos.concat(searchData.items);
            }

            if (searchData.nextPageToken) {
                pageToken = searchData.nextPageToken;
            } else {
                break; // No more pages
            }
        }

        if (videos.length === 0) {
            return res.status(200).json({ results: [], scannedTotal: 0 });
        }

        // Extract unique Channel IDs and Video IDs
        const channelIds = [...new Set(videos.map((v: any) => v.snippet.channelId))];
        const videoIds = [...new Set(videos.map((v: any) => v.id.videoId))];

        // Ensure we don't break the YouTube API length limit (Max 50 comma separated IDs per request)
        // We will batch them into chunks of 50.
        const chunkArray = (arr: string[], size: number) =>
            Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
                arr.slice(i * size, i * size + size)
            );

        const channelIdChunks = chunkArray(channelIds, 50);
        const videoIdChunks = chunkArray(videoIds, 50);

        // STEP 2: Batch fetch Channel Statistics
        const channelStats: Record<string, number> = {};
        for (const chunk of channelIdChunks) {
            const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${chunk.join(',')}&key=${API_KEY}`;
            const channelsRes = await fetch(channelsUrl);
            if (!channelsRes.ok) continue;

            const channelsData = await channelsRes.json();
            channelsData.items?.forEach((channel: any) => {
                channelStats[channel.id] = parseInt(channel.statistics.subscriberCount || '0', 10);
            });
        }

        // STEP 3: Batch fetch exact Video View Counts & Durations
        const videoStats: Record<string, { viewCount: number, durationISO: string }> = {};
        for (const chunk of videoIdChunks) {
            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${chunk.join(',')}&key=${API_KEY}`;
            const videosRes = await fetch(videosUrl);
            if (!videosRes.ok) continue;

            const videosData = await videosRes.json();
            videosData.items?.forEach((vid: any) => {
                videoStats[vid.id] = {
                    viewCount: parseInt(vid.statistics?.viewCount || '0', 10),
                    durationISO: vid.contentDetails?.duration || ''
                };
            });
        }

        // Helper to parse ISO 8601 duration (e.g. PT1M30S) into seconds
        const parseDuration = (duration: string) => {
            const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
            if (!match) return 0;
            const hours = (parseInt(match[1]) || 0);
            const minutes = (parseInt(match[2]) || 0);
            const seconds = (parseInt(match[3]) || 0);
            return (hours * 3600) + (minutes * 60) + seconds;
        };

        // STEP 4: Filter & Format Final Results
        const filteredResults: SuperSearchVideo[] = [];

        for (const video of videos) {
            const vId = video.id.videoId;
            const cId = video.snippet.channelId;

            const subs = channelStats[cId] || 0;
            const stats = videoStats[vId] || { viewCount: 0, durationISO: '' };
            const views = stats.viewCount;

            // Apply Format Local Filtering
            const durationSeconds = parseDuration(stats.durationISO);
            const isLive = video.snippet?.liveBroadcastContent === 'live' || video.snippet?.liveBroadcastContent === 'upcoming';
            const isShort = durationSeconds > 0 && durationSeconds <= 61; // Strict 60s rule with 1s buffer

            if (fmt === 'shorts' && !isShort) continue;
            if (fmt === 'video' && (isShort || isLive)) continue;
            if (fmt === 'stream' && !isLive) continue;

            if (subs >= minS && subs <= maxS) {
                // Determine if it looks like a Short based on view/sub ratio or title heuristics if `videoDuration` wasn't perfectly strict
                // We rely entirely on the API parameters for format filtering, but we could add manual title checks here if needed.
                filteredResults.push({
                    id: vId,
                    title: video.snippet.title,
                    thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
                    publishedAt: video.snippet.publishedAt,
                    channelId: cId,
                    channelTitle: video.snippet.channelTitle,
                    subscriberCount: subs,
                    viewCount: views
                });
            }
        }

        // Deduplicate videos
        const uniqueResults = filteredResults.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

        // Sort explicitly by the true ViewCount we just fetched, descending
        uniqueResults.sort((a, b) => b.viewCount - a.viewCount);

        // Return the Top 15 matching "Diamonds"
        res.status(200).json({
            results: uniqueResults.slice(0, 15),
            scannedTotal: videos.length
        });

    } catch (e: any) {
        console.error('Super Search API error:', e);
        res.status(500).json({ error: e.message || 'Ой, сталася помилка при пошуку діамантів.' });
    }
}

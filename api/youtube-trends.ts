import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface TrendingVideo {
    id: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    viewCount: string;
    publishedAt: string;
    duration?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { regionCode = 'UA', categoryId = '0', key } = req.query;
    const API_KEY = key || process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'YouTube API Key is missing' });
    }

    try {
        let baseParams = `part=snippet,statistics,contentDetails&chart=mostPopular&maxResults=50&regionCode=${regionCode}&key=${API_KEY}`;
        if (categoryId !== '0') {
            baseParams += `&videoCategoryId=${categoryId}`;
        }

        let allItems: any[] = [];
        let pageToken = '';

        // Fetch up to 100 trending videos (50 per page max)
        for (let i = 0; i < 2; i++) {
            const url = `https://www.googleapis.com/youtube/v3/videos?${baseParams}${pageToken ? `&pageToken=${pageToken}` : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                // If the category is invalid for the region, YouTube throws a 400. Break gracefully if first page worked.
                if (i === 0) throw new Error('Failed to fetch trending videos');
                break;
            }

            const data = await response.json();
            if (data.items) {
                allItems = allItems.concat(data.items);
            }

            if (data.nextPageToken) {
                pageToken = data.nextPageToken;
            } else {
                break;
            }
        }

        if (allItems.length === 0) {
            return res.status(200).json({ trends: [], scannedTotal: 0 });
        }

        const parsedTrends: TrendingVideo[] = [];

        for (const item of allItems) {
            const durationISO = item.contentDetails?.duration || '';

            parsedTrends.push({
                id: item.id,
                title: item.snippet.title,
                channelTitle: item.snippet.channelTitle,
                thumbnailUrl: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                viewCount: item.statistics.viewCount,
                publishedAt: item.snippet.publishedAt,
                duration: durationISO
            });
        }

        res.status(200).json({
            trends: parsedTrends,
            scannedTotal: allItems.length
        });

    } catch (e: any) {
        console.error('YouTube Trends API error:', e);
        res.status(500).json({ error: e.message || 'Ой, щось пішло не так при завантаженні трендів.' });
    }
}

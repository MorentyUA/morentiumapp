import { VercelRequest, VercelResponse } from '@vercel/node;
import { fetchWithRotation } from './youtube-fetcher'.js;
const fetch = fetchWithRotation;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Метод не підтримується' });
    }

    const { query, apiKey, regionCode = 'US', maxResults = '10' } = req.query;

    let finalApiKey = apiKey as string;
    if (!finalApiKey || finalApiKey === 'undefined') {
        finalApiKey = process.env.YOUTUBE_API_KEY as string || "AIzaSyCyKZ9GPZqfALXnHfJRZZZ3qOQzHSX51c4";
    }

    if (!query || !finalApiKey) {
        return res.status(400).json({ error: 'Відсутній запит або API ключ' });
    }

    try {
        // Step 1: Search for top videos matching the query
        const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
        searchUrl.searchParams.append('part', 'id,snippet');
        searchUrl.searchParams.append('q', query as string);
        searchUrl.searchParams.append('type', 'video');
        searchUrl.searchParams.append('maxResults', maxResults as string);
        searchUrl.searchParams.append('regionCode', regionCode as string);
        searchUrl.searchParams.append('key', finalApiKey);

        const searchRes = await fetch(searchUrl.toString());
        const searchData = await searchRes.json();

        if (searchData.error) {
            return res.status(searchData.error.code || 500).json({ error: searchData.error.message });
        }

        const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean).join(',');

        if (!videoIds) {
            return res.status(200).json({ tags: [], topTitles: [] });
        }

        // Step 2: Fetch details (snippets) for those specific videos to extract tags
        const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        videosUrl.searchParams.append('part', 'snippet,statistics');
        videosUrl.searchParams.append('id', videoIds);
        videosUrl.searchParams.append('key', finalApiKey);

        const videosRes = await fetch(videosUrl.toString());
        const videosData = await videosRes.json();

        if (videosData.error) {
            return res.status(videosData.error.code || 500).json({ error: videosData.error.message });
        }

        // Aggregate tags
        const tagFrequency: Record<string, number> = {};
        const titles: Array<{ title: string, views: number, channel: string }> = [];

        videosData.items?.forEach((video: any) => {
            const tags = video.snippet?.tags || [];
            tags.forEach((tag: string) => {
                const lowerTag = tag.toLowerCase().trim();
                tagFrequency[lowerTag] = (tagFrequency[lowerTag] || 0) + 1;
            });

            titles.push({
                title: video.snippet?.title || '',
                views: parseInt(video.statistics?.viewCount || '0', 10),
                channel: video.snippet?.channelTitle || ''
            });
        });

        // Sort tags by frequency (desc)
        const sortedTags = Object.entries(tagFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => ({ tag, count }));

        // Sort titles by views and take top 5
        const topTitles = titles.sort((a, b) => b.views - a.views).slice(0, 5);

        res.status(200).json({
            tags: sortedTags,
            topTitles: topTitles
        });

    } catch (error) {
        console.error('YouTube Tags API Error:', error);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
}

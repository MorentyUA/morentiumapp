import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query, apiKey, regionCode = 'US', maxResults = '8' } = req.query;

    let finalApiKey = apiKey as string;
    if (!finalApiKey || finalApiKey === 'undefined') {
        finalApiKey = process.env.YOUTUBE_API_KEY as string;
    }

    if (!query || !finalApiKey) {
        return res.status(400).json({ error: 'Missing query or apiKey' });
    }

    try {
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

        const videos = searchData.items?.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet?.title || '',
            channelTitle: item.snippet?.channelTitle || '',
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
            publishedAt: item.snippet?.publishedAt || ''
        })) || [];

        res.status(200).json({ videos });

    } catch (error) {
        console.error('YouTube Thumbnails API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

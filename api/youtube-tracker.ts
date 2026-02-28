import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const query = req.query.q as string;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter (YouTube URL or Handle)' });
    }

    const customKey = req.query.key as string;
    const API_KEY = customKey || process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'YouTube API Key is missing on the server and no custom key was provided' });
    }

    try {
        let channelId = '';
        const cleanQuery = query.split('?')[0]; // Strip url parameters like ?si=

        // Case 1: Is it a direct Video or Short URL?
        let videoIdMatch = query.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]+)/);
        if (videoIdMatch && videoIdMatch[1]) {
            const videoId = videoIdMatch[1];
            // Fetch video details to get the parent channelId
            const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
            const videoRes = await fetch(videoUrl);
            const videoData = await videoRes.json();

            if (videoData.items && videoData.items.length > 0) {
                channelId = videoData.items[0].snippet.channelId;
            } else {
                return res.status(404).json({ error: 'Video found but could not resolve channel ID' });
            }
        }
        // Case 2: Is it a direct Channel ID URL?
        else if (cleanQuery.includes('channel/UC')) {
            const idMatch = cleanQuery.match(/channel\/(UC[\w-]+)/);
            if (idMatch && idMatch[1]) channelId = idMatch[1];
        }
        // Case 3: It's a Handle (e.g., @channel) or raw search term
        else {
            let searchTerm = cleanQuery;
            const handleMatch = cleanQuery.match(/@([\w.-]+)/);
            if (handleMatch && handleMatch[0]) {
                searchTerm = handleMatch[0]; // search specifically for the @handle
            }

            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchTerm)}&maxResults=1&key=${API_KEY}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (!searchData.items || searchData.items.length === 0) {
                return res.status(404).json({ error: 'Channel not found from search query' });
            }
            channelId = searchData.items[0].snippet.channelId;
        }

        if (!channelId) {
            return res.status(400).json({ error: 'Could not determine a valid YouTube Channel from the input' });
        }

        // Fetch channel stats and uploads playlist ID
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails,snippet&id=${channelId}&key=${API_KEY}`;
        const channelRes = await fetch(channelUrl);
        const channelData = await channelRes.json();

        if (!channelData.items || channelData.items.length === 0) {
            return res.status(404).json({ error: 'Channel structure not found' });
        }

        const channel = channelData.items[0];
        const stats = channel.statistics;
        const snippet = channel.snippet;
        const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

        // Fetch last 50 videos from uploads playlist
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}`;
        const playlistRes = await fetch(playlistUrl);
        const playlistData = await playlistRes.json();

        const videos = (playlistData.items || []).map((item: any) => ({
            id: item.contentDetails.videoId,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        }));

        res.status(200).json({
            channel: {
                id: channel.id,
                title: snippet.title,
                customUrl: snippet.customUrl,
                thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                subscriberCount: stats.subscriberCount,
                viewCount: stats.viewCount,
                videoCount: stats.videoCount,
            },
            videos,
        });

    } catch (error: any) {
        console.error('YouTube API Error:', error);
        res.status(500).json({ error: 'Failed to fetch YouTube data', details: error.message });
    }
}

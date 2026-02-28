import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const query = req.query.q as string;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter (YouTube URL)' });
    }

    const customKey = req.query.key as string;
    const API_KEY = customKey || process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'YouTube API Key is missing on the server and no custom key was provided' });
    }

    try {
        const cleanQuery = query.split('?si=')[0].split('&')[0]; // Strip generic shares

        // 1. Check for Channel URLs first
        let isChannel = false;
        let channelId = '';

        let idMatch = cleanQuery.match(/channel\/(UC[\w-]+)/);
        if (idMatch && idMatch[1]) {
            isChannel = true;
            channelId = idMatch[1];
        } else {
            let handleMatch = cleanQuery.match(/@([\w.-]+)/);
            if (handleMatch && handleMatch[1]) {
                isChannel = true;
                const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handleMatch[0])}&maxResults=1&key=${API_KEY}`;
                const searchRes = await fetch(searchUrl);
                const searchData = await searchRes.json();
                if (searchData.items && searchData.items.length > 0) {
                    channelId = searchData.items[0].snippet.channelId;
                }
            }
        }

        // --- CHANNEL PROCESSING WORKFLOW ---
        if (isChannel) {
            if (!channelId) {
                return res.status(404).json({ error: 'Не вдалося знайти канал за цим посиланням.' });
            }

            // Calculate "30 days ago" in ISO 8601 format
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const publishedAfter = thirtyDaysAgo.toISOString();

            // Find top 3 videos from the last 30 days sorted by view count
            // Note: YouTube `search` API order=viewCount combined with publishedAfter fetches exactly what we want
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&channelId=${channelId}&type=video&order=viewCount&publishedAfter=${publishedAfter}&maxResults=3&key=${API_KEY}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (!searchData.items || searchData.items.length === 0) {
                return res.status(404).json({ error: 'На цьому каналі не знайдено публічних відео за останні 30 днів.' });
            }

            const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
            const channelTitle = searchData.items[0].snippet.channelTitle; // Grab title from first result

            // Now fetch the full statistics for all 3 videos in one batch query
            const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${API_KEY}`;
            const statsRes = await fetch(statsUrl);
            const statsData = await statsRes.json();

            const processedVideos = statsData.items.map((video: any) => {
                const snippet = video.snippet;
                const stats = video.statistics;

                const viewCount = parseInt(stats.viewCount || '0', 10);
                const likeCount = parseInt(stats.likeCount || '0', 10);
                const commentCount = parseInt(stats.commentCount || '0', 10);

                let engagementRate = 0;
                if (viewCount > 0) {
                    engagementRate = ((likeCount + commentCount) / viewCount) * 100;
                }

                return {
                    id: video.id,
                    title: snippet.title,
                    thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                    publishedAt: snippet.publishedAt,
                    tags: snippet.tags || [],
                    stats: {
                        viewCount,
                        likeCount,
                        commentCount,
                        engagementRate: engagementRate.toFixed(2)
                    }
                };
            });

            return res.status(200).json({
                type: 'channel',
                channelTitle,
                videos: processedVideos
            });
        }

        // --- SINGLE VIDEO PROCESSING WORKFLOW ---
        let videoIdMatch = cleanQuery.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]+)/);
        let videoId = '';

        if (videoIdMatch && videoIdMatch[1]) {
            videoId = videoIdMatch[1];
        } else if (cleanQuery.length === 11 && !cleanQuery.includes('/') && !cleanQuery.includes('=')) {
            videoId = cleanQuery;
        }

        if (!videoId) {
            return res.status(400).json({ error: 'Будь ласка, вставте пряме посилання на ВІДЕО, Shorts або Канал.' });
        }

        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;
        const videoRes = await fetch(videoUrl);
        const videoData = await videoRes.json();

        if (!videoData.items || videoData.items.length === 0) {
            return res.status(404).json({ error: 'Video not found or is private' });
        }

        const video = videoData.items[0];
        const snippet = video.snippet;
        const stats = video.statistics;

        const viewCount = parseInt(stats.viewCount || '0', 10);
        const likeCount = parseInt(stats.likeCount || '0', 10);
        const commentCount = parseInt(stats.commentCount || '0', 10);

        let engagementRate = 0;
        if (viewCount > 0) {
            engagementRate = ((likeCount + commentCount) / viewCount) * 100;
        }

        return res.status(200).json({
            type: 'video',
            video: {
                id: video.id,
                title: snippet.title,
                channelTitle: snippet.channelTitle,
                thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                publishedAt: snippet.publishedAt,
                tags: snippet.tags || [],
                stats: {
                    viewCount,
                    likeCount,
                    commentCount,
                    engagementRate: engagementRate.toFixed(2)
                }
            }
        });

    } catch (error: any) {
        console.error('YouTube Spy API Error:', error);
        res.status(500).json({ error: 'Failed to fetch YouTube Video data', details: error.message });
    }
}

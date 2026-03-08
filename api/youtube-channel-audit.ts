import { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchWithRotation } from './youtube-fetcher';
const fetch = fetchWithRotation;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { input, apiKey } = req.query;

    let finalApiKey = apiKey as string;
    if (!finalApiKey || finalApiKey === 'undefined') {
        finalApiKey = process.env.YOUTUBE_API_KEY as string || "AIzaSyCyKZ9GPZqfALXnHfJRZZZ3qOQzHSX51c4";
    }

    if (!input || !finalApiKey) {
        return res.status(400).json({ error: 'Missing input or apiKey' });
    }

    let queryStr = input as string;
    let channelId = '';

    try {
        // --- STEP 1: RESOLVE CHANNEL ID ---

        // Is it a Video URL?
        if (queryStr.includes('youtube.com/watch') || queryStr.includes('youtu.be/')) {
            let videoId = '';
            try {
                const url = new URL(queryStr);
                videoId = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || '';
            } catch (e) {
                return res.status(400).json({ error: 'Недійсне посилання на відео' });
            }

            if (videoId) {
                const vidUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
                vidUrl.searchParams.append('part', 'snippet');
                vidUrl.searchParams.append('id', videoId);
                vidUrl.searchParams.append('key', finalApiKey);
                const vidRes = await fetch(vidUrl.toString());
                const vidData = await vidRes.json();
                if (vidData.items && vidData.items.length > 0) {
                    channelId = vidData.items[0].snippet.channelId;
                } else {
                    return res.status(404).json({ error: 'Відео не знайдено' });
                }
            }
        }
        // Is it a Channel Handle (@handle)?
        else if (queryStr.startsWith('@') || queryStr.includes('youtube.com/@')) {
            let handle = queryStr;
            if (handle.includes('youtube.com/@')) {
                const url = new URL(queryStr);
                handle = url.pathname.slice(1); // gets @handle
            }
            const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
            searchUrl.searchParams.append('part', 'id');
            searchUrl.searchParams.append('q', handle);
            searchUrl.searchParams.append('type', 'channel');
            searchUrl.searchParams.append('maxResults', '1');
            searchUrl.searchParams.append('key', finalApiKey);
            const searchRes = await fetch(searchUrl.toString());
            const searchData = await searchRes.json();
            if (searchData.items && searchData.items.length > 0) {
                channelId = searchData.items[0].id.channelId;
            } else {
                return res.status(404).json({ error: 'Канал за таким хендлом не знайдено' });
            }
        }
        // Is it a direct Channel ID? (starts with UC)
        else if (queryStr.startsWith('UC') && queryStr.length > 20) {
            channelId = queryStr;
        }
        // Is it a legacy Custom URL? (e.g. youtube.com/c/CreatorName) -- fallback search
        else {
            let q = queryStr;
            if (queryStr.includes('youtube.com/')) {
                const parts = new URL(queryStr).pathname.split('/');
                q = parts[parts.length - 1];
            }
            const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
            searchUrl.searchParams.append('part', 'id');
            searchUrl.searchParams.append('q', q);
            searchUrl.searchParams.append('type', 'channel');
            searchUrl.searchParams.append('maxResults', '1');
            searchUrl.searchParams.append('key', finalApiKey);
            const searchRes = await fetch(searchUrl.toString());
            const searchData = await searchRes.json();
            if (searchData.items && searchData.items.length > 0) {
                channelId = searchData.items[0].id.channelId;
            } else {
                return res.status(404).json({ error: 'Не вдалося визначити канал' });
            }
        }

        if (!channelId) {
            return res.status(404).json({ error: 'Не вдалося визначити Channel ID' });
        }


        // --- STEP 2: FETCH CHANNEL METADATA & UPLOADS PLAYLIST ---
        const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
        channelUrl.searchParams.append('part', 'snippet,statistics,contentDetails');
        channelUrl.searchParams.append('id', channelId);
        channelUrl.searchParams.append('key', finalApiKey);

        const channelRes = await fetch(channelUrl.toString());
        const channelData = await channelRes.json();

        if (channelData.error || !channelData.items || channelData.items.length === 0) {
            return res.status(500).json({ error: channelData.error?.message || 'Канал не знайдено' });
        }

        const channelItem = channelData.items[0];
        const uploadsPlaylistId = channelItem.contentDetails.relatedPlaylists.uploads;
        const totalSubs = parseInt(channelItem.statistics.subscriberCount || '0', 10);

        // --- STEP 3: FETCH RECENT 15 VIDEOS ---
        const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        playlistUrl.searchParams.append('part', 'contentDetails');
        playlistUrl.searchParams.append('playlistId', uploadsPlaylistId);
        playlistUrl.searchParams.append('maxResults', '15');
        playlistUrl.searchParams.append('key', finalApiKey);

        const playlistRes = await fetch(playlistUrl.toString());
        const playlistData = await playlistRes.json();

        const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId).join(',');

        let recentVideos: any[] = [];
        if (videoIds) {
            // Fetch stats for these videos
            const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
            videosUrl.searchParams.append('part', 'snippet,statistics');
            videosUrl.searchParams.append('id', videoIds);
            videosUrl.searchParams.append('key', finalApiKey);

            const videosRes = await fetch(videosUrl.toString());
            const videosData = await videosRes.json();

            recentVideos = videosData.items?.map((v: any) => {
                const views = parseInt(v.statistics.viewCount || '0', 10);
                const likes = parseInt(v.statistics.likeCount || '0', 10);
                const comments = parseInt(v.statistics.commentCount || '0', 10);
                const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

                return {
                    id: v.id,
                    title: v.snippet.title,
                    thumbnail: v.snippet.thumbnails?.medium?.url || '',
                    publishedAt: v.snippet.publishedAt,
                    views,
                    likes,
                    comments,
                    engagementRate
                };
            }) || [];
        }

        // --- STEP 4: CALCULATE AVERAGES AND ANOMALIES ---
        const totalViews = recentVideos.reduce((acc, v) => acc + v.views, 0);
        const avgViews = recentVideos.length > 0 ? totalViews / recentVideos.length : 0;

        const avgEngagementRate = recentVideos.length > 0
            ? recentVideos.reduce((acc, v) => acc + v.engagementRate, 0) / recentVideos.length
            : 0;

        // Flag anomalies: > 3x average views
        const anomalies = recentVideos
            .filter(v => v.views > avgViews * 3 && v.views > 1000)
            .sort((a, b) => b.views - a.views);

        // Calculate Grade (A, B, C, D, F) loosely based on Engagement and Sub/View Ratio
        let healthScore = 0;
        if (avgEngagementRate >= 5) healthScore += 40;
        else if (avgEngagementRate >= 3) healthScore += 30;
        else if (avgEngagementRate >= 1.5) healthScore += 20;

        const subViewRatio = totalSubs > 0 ? (avgViews / totalSubs) * 100 : 0;
        if (subViewRatio >= 20) healthScore += 40;
        else if (subViewRatio >= 10) healthScore += 30;
        else if (subViewRatio >= 5) healthScore += 20;

        if (recentVideos.length >= 15) {
            const oldestDate = new Date(recentVideos[recentVideos.length - 1].publishedAt).getTime();
            const timeDiffDays = (Date.now() - oldestDate) / (1000 * 3600 * 24);
            // 15 videos in 30 days is great (1 every 2 days)
            if (timeDiffDays <= 45) healthScore += 20;
            else if (timeDiffDays <= 90) healthScore += 10;
        }

        let grade = 'F';
        let verdict = 'Канал впав у сплячку або втратив зв\'язок з ядром аудиторії.';
        if (healthScore >= 90) { grade = 'A+'; verdict = 'Вибуховий ріст! Аудиторія залучена на 100%.'; }
        else if (healthScore >= 80) { grade = 'A'; verdict = 'Чудовий стан каналу. Стабільні перегляди та висока активність.'; }
        else if (healthScore >= 65) { grade = 'B'; verdict = 'Хороший робочий канал. Є куди рости в плані залучення.'; }
        else if (healthScore >= 50) { grade = 'C'; verdict = 'Середнячок. Можливо, варто змінити стратегію контенту.'; }
        else if (healthScore >= 35) { grade = 'D'; verdict = 'Є проблеми з утриманням та клікабельністю.'; }

        res.status(200).json({
            channel: {
                id: channelItem.id,
                title: channelItem.snippet.title,
                thumbnail: channelItem.snippet.thumbnails?.high?.url || channelItem.snippet.thumbnails?.default?.url,
                subs: totalSubs,
                totalUploads: parseInt(channelItem.statistics.videoCount || '0', 10),
            },
            audit: {
                avgViews: Math.round(avgViews),
                avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
                subViewRatio: parseFloat(subViewRatio.toFixed(1)),
                grade,
                verdict,
                anomalies
            },
            recentVideos
        });

    } catch (error) {
        console.error('YouTube Channel Audit API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

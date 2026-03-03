import type { VercelRequest, VercelResponse } from '@vercel/node';

// Constants for Revenue Estimation
// Per 1,000 views
const SHORTS_RPM_MIN = 0.02;
const SHORTS_RPM_MAX = 0.05;

const LONG_RPM_MIN = 1.00;
const LONG_RPM_MAX = 1.50;

/**
 * Heuristics rules:
 * We don't have exact metrics for how many views are shorts vs long form globally on the API.
 * However, we will use a 70/30 generic split, and look at the video counts vs view counts 
 * as a rough adjusting factor if needed. Let's start with a fixed split heuristic for simplicity.
 */
const SHORTS_VIEW_RATIO = 0.65; // Assume 65% of monthly views are from Shorts on modern channels
const LONG_VIEW_RATIO = 0.35; // Assume 35% are long form

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { channel, key } = req.query;

    if (!channel || typeof channel !== 'string') {
        return res.status(400).json({ error: 'Введіть посилання на канал або ID' });
    }

    const apiKey = key || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'YouTube API Key is missing' });
    }

    try {
        let channelId = channel;

        // 1. Resolve URL to Channel ID if necessary
        if (channel.includes('youtube.com/') || channel.includes('youtu.be/')) {
            if (channel.includes('/channel/')) {
                channelId = channel.split('/channel/')[1].split('/')[0];
            } else if (channel.includes('/c/') || channel.includes('/user/') || channel.includes('@')) {
                let handle = channel;
                if (channel.includes('@')) {
                    handle = '@' + channel.split('@')[1].split('/')[0].split('?')[0];
                } else if (channel.includes('/c/')) {
                    handle = channel.split('/c/')[1].split('/')[0];
                } else if (channel.includes('/user/')) {
                    handle = channel.split('/user/')[1].split('/')[0];
                }

                const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${apiKey}`);
                const searchData = await searchRes.json();

                if (searchData.items && searchData.items.length > 0) {
                    channelId = searchData.items[0].snippet.channelId;
                } else {
                    return res.status(404).json({ error: 'Канал не знайдено за цим посиланням' });
                }
            } else if (channel.includes('/watch?v=')) {
                // It's a video link, extract the channel from the video
                const videoId = channel.split('v=')[1].split('&')[0];
                const videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
                const videoData = await videoRes.json();
                if (videoData.items && videoData.items.length > 0) {
                    channelId = videoData.items[0].snippet.channelId;
                } else {
                    return res.status(404).json({ error: 'Відео або канал не знайдено' });
                }
            }
        }

        // 2. Fetch Channel Statistics
        const statRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`);
        const statData = await statRes.json();

        if (!statData.items || statData.items.length === 0) {
            return res.status(404).json({ error: 'Канал не знайдено в базі YouTube' });
        }

        const channelInfo = statData.items[0];
        const title = channelInfo.snippet.title;
        const thumbnail = channelInfo.snippet.thumbnails?.default?.url || channelInfo.snippet.thumbnails?.medium?.url;

        const totalViews = parseInt(channelInfo.statistics.viewCount || '0', 10);
        const subCount = parseInt(channelInfo.statistics.subscriberCount || '0', 10);
        const videoCount = parseInt(channelInfo.statistics.videoCount || '0', 10);

        const publishedAt = new Date(channelInfo.snippet.publishedAt);
        const now = new Date();
        const ageInMonths = Math.max(1, (now.getFullYear() - publishedAt.getFullYear()) * 12 + now.getMonth() - publishedAt.getMonth());

        // 3. Estimate Monthly Views
        // A simple average over lifetime is inaccurate for active channels, but without fetching 50 videos and parsing dates it's a fast baseline.
        // Let's use a dynamic velocity multiplier for active channels. We'll simulate a "current monthly velocity" by taking total / (age/2) if age > 24m
        let estimatedMonthlyViews = Math.round(totalViews / ageInMonths);

        // Boost for large established channels that got big recently
        if (ageInMonths > 36 && subCount > 1000000) {
            estimatedMonthlyViews = Math.round(totalViews / (ageInMonths * 0.4)); // Assumption: past few years account for most views
        } else if (ageInMonths > 12) {
            estimatedMonthlyViews = Math.round(totalViews / (ageInMonths * 0.6));
        }

        // 4. Calculate Revenue using RPM thresholds
        const monthlyShortsViews = estimatedMonthlyViews * SHORTS_VIEW_RATIO;
        const monthlyLongViews = estimatedMonthlyViews * LONG_VIEW_RATIO;

        const revShortsMin = (monthlyShortsViews / 1000) * SHORTS_RPM_MIN;
        const revShortsMax = (monthlyShortsViews / 1000) * SHORTS_RPM_MAX;

        const revLongMin = (monthlyLongViews / 1000) * LONG_RPM_MIN;
        const revLongMax = (monthlyLongViews / 1000) * LONG_RPM_MAX;

        const monthlyMin = revShortsMin + revLongMin;
        const monthlyMax = revShortsMax + revLongMax;

        const yearlyMin = monthlyMin * 12;
        const yearlyMax = monthlyMax * 12;

        res.status(200).json({
            channelId,
            title,
            thumbnail,
            stats: {
                totalViews,
                subCount,
                videoCount,
                estimatedMonthlyViews
            },
            revenue: {
                monthly: {
                    min: Math.round(monthlyMin),
                    max: Math.round(monthlyMax)
                },
                yearly: {
                    min: Math.round(yearlyMin),
                    max: Math.round(yearlyMax)
                }
            },
            config: {
                longRpm: `{LONG_RPM_MIN}-{LONG_RPM_MAX}`,
                shortsRpm: `{SHORTS_RPM_MIN}-{SHORTS_RPM_MAX}`,
                assumedSplit: '35% Long / 65% Shorts'
            }
        });

    } catch (e: any) {
        console.error('Revenue calculator error:', e);
        res.status(500).json({ error: e.message || 'Помилка при обчисленні доходу' });
    }
}

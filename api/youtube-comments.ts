import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface YoutubeComment {
    id: string;
    authorName: string;
    authorImage: string;
    textDisplay: string;
    likeCount: number;
    publishedAt: string;
}

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
        return res.status(500).json({ error: 'YouTube API Key is missing' });
    }

    try {
        const cleanQuery = query.split('?si=')[0].split('&')[0]; // Strip generic shares
        let videoId = '';

        // Extract Video ID
        let idMatch = cleanQuery.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([^&/?]+)/);
        if (idMatch && idMatch[1]) {
            videoId = idMatch[1];
        } else {
            return res.status(400).json({ error: 'Неможливо знайти Video ID у посиланні' });
        }

        // Fetch Top Comments (order=relevance is usually top likes/replies)
        const commentsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=30&order=relevance&key=${API_KEY}`
        );

        if (!commentsResponse.ok) {
            const errorData = await commentsResponse.json();
            throw new Error(errorData.error?.message || 'Failed to fetch comments');
        }

        const commentsData = await commentsResponse.json();

        if (!commentsData.items || commentsData.items.length === 0) {
            return res.status(200).json({ comments: [] });
        }

        const parsedComments: YoutubeComment[] = commentsData.items.map((item: any) => {
            const snippet = item.snippet.topLevelComment.snippet;
            return {
                id: item.id,
                authorName: snippet.authorDisplayName,
                authorImage: snippet.authorProfileImageUrl,
                textDisplay: snippet.textDisplay,
                likeCount: snippet.likeCount,
                publishedAt: snippet.publishedAt
            };
        });

        // Sort just in case relevance wasn't strictly likes
        parsedComments.sort((a, b) => b.likeCount - a.likeCount);

        res.status(200).json({
            videoId,
            comments: parsedComments.slice(0, 20) // Trim to top 20
        });

    } catch (e: any) {
        console.error('YouTube Comments API error:', e);
        res.status(500).json({ error: e.message || 'Ой, щось пішло не так при аналізі коментарів.' });
    }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import all sub-handlers dynamically to avoid packing them immediately
import channelAuditHandler from './_youtube/youtube-channel-audit';
import commentsHandler from './_youtube/youtube-comments';
import revenueHandler from './_youtube/youtube-revenue';
import spyHandler from './_youtube/youtube-spy';
import superSearchHandler from './_youtube/youtube-super-search';
import tagsHandler from './_youtube/youtube-tags';
import thumbnailsHandler from './_youtube/youtube-thumbnails';
import trackerHandler from './_youtube/youtube-tracker';
import trendsHandler from './_youtube/youtube-trends';

export default async function handler(req: VercelRequest, res: VercelResponse) {
        // Add CORS headers for local development testing
    res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader(
                    'Access-Control-Allow-Headers',
                    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
                );

    if (req.method === 'OPTIONS') {
                res.status(200).end();
                return;
    }

    const { endpoint } = req.query;

    if (!endpoint) {
                return res.status(400).json({ error: 'Missing YouTube endpoint parameter' });
    }

    try {
                switch (endpoint) {
                    case 'channel-audit':
                                        return await channelAuditHandler(req, res);
                    case 'comments':
                                        return await commentsHandler(req, res);
                    case 'revenue':
                                        return await revenueHandler(req, res);
                    case 'spy':
                                        return await spyHandler(req, res);
                    case 'super-search':
                                        return await superSearchHandler(req, res);
                    case 'tags':
                                        return await tagsHandler(req, res);
                    case 'thumbnails':
                                        return await thumbnailsHandler(req, res);
                    case 'tracker':
                                        return await trackerHandler(req, res);
                    case 'trends':

                        return await trendsHandler(req, res);
                    default:
                                        return res.status(404).json({ error: `Unknown YouTube endpoint: ${endpoint}` });
                }
    } catch (error: any) {
                console.error(`YouTube Master Router Error for /api/youtube?endpoint=${endpoint}:`, error);
                return res.status(500).json({ error: 'Internal Master Router Error', message: error.message });
    }
}

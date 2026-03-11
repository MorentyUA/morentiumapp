import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_IDS_KEY = 'twa:chat_ids';
function getRedis() {
        const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.morecraft_KV_REST_API_URL;
        const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.morecraft_KV_REST_API_TOKEN;
        if (!url || !token) throw new Error('Redis env vars not configured');
        return new Redis({ url, token });
}
async function sendTelegramMessage(chatId, text) {
        if (!BOT_TOKEN) return false;
        try {
                    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
                    });
                    return response.ok;
        } catch { return false; }
}
export default async function handler(req, res) {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const { message } = req.body || {};
        if (!message) return res.status(400).json({ error: 'Message is required' });
        try {
                    const redis = getRedis();
                    const chatIds = await redis.smembers(CHAT_IDS_KEY);
                    const results = { success: 0, failed: 0, total: chatIds.length };
                    for (const chatId of chatIds) {
                                    if (await sendTelegramMessage(chatId, message)) results.success++;
                                    else results.failed++;
                    }
                    return res.status(200).json({ status: 'Broadcast complete', results });
        } catch (error) { return res.status(500).json({ error: error.message }); }
}

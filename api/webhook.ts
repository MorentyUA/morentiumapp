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
        if (!BOT_TOKEN) return;
        await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }) });
}
export default async function handler(req, res) {
        if (req.method !== 'POST') return res.status(200).json({ status: 'Webhook is running.' });
        try {
                    const body = req.body;
                    if (!body || !body.message) return res.status(200).send('OK');
                    const message = body.message;
                    const chatId = message.chat?.id;
                    const text = message.text || '';
                    if (!chatId || message.chat?.type !== 'private') return res.status(200).send('OK');
                    try { const redis = getRedis(); await redis.sadd(CHAT_IDS_KEY, chatId); } catch (e) { console.error('Redis error:', e); }

            if (text === '/start') await sendTelegramMessage(chatId, '<b>Welcome!</b> Thanks for joining! We will notify you about updates.');
                    return res.status(200).send('OK');
        } catch (error) { return res.status(200).send('OK'); }
}

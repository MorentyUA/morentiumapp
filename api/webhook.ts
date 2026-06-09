import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PRIVATE_GROUP_ID = process.env.PRIVATE_GROUP_ID || '-1003699693654';
const CHAT_IDS_KEY = 'twa:chat_ids';
const WEBAPP_URL = 'https://morentiumapp.vercel.app';

function getRedis() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.morecraft_KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.morecraft_KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('Redis env vars not configured');
    return new Redis({ url, token });
}

async function tgApi(method: string, body: any) {
    if (!BOT_TOKEN) return null;
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}

async function sendMessage(chatId: number | string, text: string, replyMarkup?: any) {
    const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (replyMarkup) body.reply_markup = replyMarkup;
    return tgApi('sendMessage', body);
}

async function setupMenuButton() {
    return tgApi('setChatMenuButton', {
        menu_button: {
            type: 'web_app',
            text: '📱 Додаток',
            web_app: { url: WEBAPP_URL }
        }
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(200).json({ status: 'Webhook is running.' });

    try {
        const body = req.body;
        if (!body) return res.status(200).send('OK');

        // Handle chat_member updates (user joins/leaves private group)
        if (body.chat_member) {
            const cm = body.chat_member;
            const chatId = cm.chat?.id;
            if (chatId && String(chatId) === String(PRIVATE_GROUP_ID)) {
                const userId = cm.new_chat_member?.user?.id;
                const newStatus = cm.new_chat_member?.status;
                if (userId) {
                    const joined = ['member', 'administrator', 'creator'].includes(newStatus);
                    console.log(`[Webhook] User ${userId} ${joined ? 'joined' : 'left'} private group`);
                    // Optionally update morenty.xyz about group status
                    // (handled by cron for now)
                }
            }
            return res.status(200).send('OK');
        }

        // Handle messages
        if (!body.message) return res.status(200).send('OK');

        const message = body.message;
        const chatId = message.chat?.id;
        const text = message.text || '';
        const firstName = message.from?.first_name || 'друже';

        if (!chatId || message.chat?.type !== 'private') return res.status(200).send('OK');

        // Track chat ID in Redis for broadcasts
        try {
            const redis = getRedis();
            await redis.sadd(CHAT_IDS_KEY, chatId);
        } catch (e) {
            console.error('Redis error:', e);
        }

        if (text === '/start') {
            // Set persistent menu button
            await setupMenuButton();

            // Send welcome message with Web App button
            await sendMessage(chatId,
                `🔐 <b>MORENTY ПРИВАТКА</b>\n\nВітаю, ${firstName}! 👋\n\nЦе бот ПРИВАТКИ MORENTY!\nНатисни кнопку знизу зліва, щоб відкрити додаток 📱\n\nАбо натисни кнопку нижче:`,
                {
                    inline_keyboard: [[
                        { text: '🔓 Відкрити Додаток', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            );
        } else {
            // Any other message
            await sendMessage(chatId,
                `🤖 Друже, натисни на кнопки та почни!\nЗнизу зліва є кнопка 📱 <b>Додаток</b> — тисни! 👇🔥`
            );
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(200).send('OK');
    }
}

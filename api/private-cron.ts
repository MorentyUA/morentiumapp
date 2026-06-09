import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PRIVATE_GROUP_ID = process.env.PRIVATE_GROUP_ID || '-1003699693654';
const PRIVATE_API_SECRET = 'morenty-private-secret-2024';
const MORENTY_API = 'https://morenty.xyz';
const WEBAPP_URL = 'https://morentiumapp.vercel.app';

function getRedis() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.morecraft_KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.morecraft_KV_REST_API_TOKEN;
    if (!url || !token) return null;
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

async function kickUser(userId: number) {
    // Ban then unban to kick (allows rejoining later)
    await tgApi('banChatMember', { chat_id: PRIVATE_GROUP_ID, user_id: userId });
    // Small delay then unban
    await new Promise(r => setTimeout(r, 1000));
    await tgApi('unbanChatMember', { chat_id: PRIVATE_GROUP_ID, user_id: userId, only_if_banned: true });
}

function pluralizeDays(n: number): string {
    const abs = Math.abs(n);
    if (abs % 10 === 1 && abs % 100 !== 11) return `${n} день`;
    if ([2, 3, 4].includes(abs % 10) && ![12, 13, 14].includes(abs % 100)) return `${n} дні`;
    return `${n} днів`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // Fetch expiring subscriptions from morenty.xyz
        const response = await fetch(`${MORENTY_API}/api/private/expiring`, {
            headers: { 'x-private-secret': PRIVATE_API_SECRET }
        });

        if (!response.ok) {
            console.error('[Cron] Failed to fetch expiring:', response.status);
            return res.status(500).json({ error: 'Failed to fetch expiring subscriptions' });
        }

        const data = await response.json();
        const { expiringSoon = [], expired = [] } = data;

        let warned = 0;
        let kicked = 0;

        let redis: Redis | null = null;
        try {
            redis = getRedis();
        } catch (e) {
            console.error('[Cron] Redis init failed:', e);
        }

        // 1. Warn users with expiring subscriptions (2 days left)
        for (const sub of expiringSoon) {
            const daysLeft = Math.ceil(
                (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            // Skip warning if already warned today (within 20 hours)
            if (redis) {
                try {
                    const warnedToday = await redis.get(`twa:warned:${sub.telegram_id}`);
                    if (warnedToday) {
                        console.log(`[Cron] User ${sub.telegram_id} already warned today. Skipping.`);
                        continue;
                    }
                } catch (redisErr) {
                    console.error('[Cron] Redis get error:', redisErr);
                }
            }

            try {
                await sendMessage(sub.telegram_id,
                    `⚠️ Увага, ${sub.first_name || 'друже'}!\n\nТвоя підписка <b>ПРИВАТКА</b> закінчується через <b>${pluralizeDays(daysLeft)}</b>!\n\n🔄 Продовж підписку, щоб не втратити доступ до закритої групи.`,
                    {
                        inline_keyboard: [
                            [
                                { text: '📱 Продовжити в Додатку', web_app: { url: WEBAPP_URL } }
                            ],
                            [
                                { text: '🌐 Продовжити на Сайті', url: 'https://morenty.xyz/privat' }
                            ]
                        ]
                    }
                );

                // Track warning in Redis to prevent spamming
                if (redis) {
                    try {
                        await redis.set(`twa:warned:${sub.telegram_id}`, 'true', { ex: 20 * 60 * 60 });
                    } catch (redisErr) {
                        console.error('[Cron] Redis set error:', redisErr);
                    }
                }

                warned++;
                console.log(`[Cron] Warned user ${sub.telegram_id} — ${pluralizeDays(daysLeft)} left`);
            } catch (e: any) {
                console.error(`[Cron] Failed to warn ${sub.telegram_id}:`, e.message);
            }

            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 300));
        }

        // 2. Kick users with expired subscriptions
        for (const sub of expired) {
            try {
                // Kick from group
                await kickUser(sub.telegram_id);

                // Send expiry message
                await sendMessage(sub.telegram_id,
                    `😔 На жаль, твоя підписка <b>ПРИВАТКА</b> закінчилась.\n\nТебе було видалено з закритої групи.\n\n💳 Оформи підписку знову, щоб повернутися!`,
                    {
                        inline_keyboard: [
                            [
                                { text: '📱 Оформити в Додатку', web_app: { url: WEBAPP_URL } }
                            ],
                            [
                                { text: '🌐 Оформити на Сайті', url: 'https://morenty.xyz/privat' }
                            ]
                        ]
                    }
                );

                // Mark as expired in morenty.xyz DB
                await fetch(`${MORENTY_API}/api/private/expire`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-private-secret': PRIVATE_API_SECRET
                    },
                    body: JSON.stringify({ userId: sub.telegram_id })
                });

                kicked++;
                console.log(`[Cron] Kicked user ${sub.telegram_id} — subscription expired`);
            } catch (e: any) {
                console.error(`[Cron] Failed to kick ${sub.telegram_id}:`, e.message);
            }

            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`[Cron] Done: warned=${warned}, kicked=${kicked}`);
        return res.status(200).json({
            success: true,
            warned,
            kicked,
            expiringSoonCount: expiringSoon.length,
            expiredCount: expired.length
        });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

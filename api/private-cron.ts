import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PRIVATE_GROUP_ID = process.env.PRIVATE_GROUP_ID || '-1003699693654';
const PRIVATE_API_SECRET = 'morenty-private-secret-2024';
const MORENTY_API = 'https://morenty.xyz';
const WEBAPP_URL = 'https://morentiumapp.vercel.app/?v=1.0.5';

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
    await tgApi('banChatMember', { chat_id: PRIVATE_GROUP_ID, user_id: userId });
    await new Promise(r => setTimeout(r, 1000));
    await tgApi('unbanChatMember', { chat_id: PRIVATE_GROUP_ID, user_id: userId, only_if_banned: true });
}

function pluralizeDays(n: number): string {
    const abs = Math.abs(n);
    if (abs % 10 === 1 && abs % 100 !== 11) return `${n} день`;
    if ([2, 3, 4].includes(abs % 10) && ![12, 13, 14].includes(abs % 100)) return `${n} дні`;
    return `${n} днів`;
}

// 1. Cron handler
async function handleCron(req: VercelRequest, res: VercelResponse) {
    try {
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

        for (const sub of expiringSoon) {
            const daysLeft = Math.ceil(
                (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

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

                if (redis) {
                    try {
                        await redis.set(`twa:warned:${sub.telegram_id}`, 'true', { ex: 20 * 60 * 60 });
                    } catch (redisErr) {
                        console.error('[Cron] Redis set error:', redisErr);
                    }
                }

                warned++;
            } catch (e: any) {
                console.error(`[Cron] Failed to warn ${sub.telegram_id}:`, e.message);
            }

            await new Promise(r => setTimeout(r, 300));
        }

        for (const sub of expired) {
            try {
                await kickUser(sub.telegram_id);

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

                await fetch(`${MORENTY_API}/api/private/expire`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-private-secret': PRIVATE_API_SECRET
                    },
                    body: JSON.stringify({ userId: sub.telegram_id })
                });

                kicked++;
            } catch (e: any) {
                console.error(`[Cron] Failed to kick ${sub.telegram_id}:`, e.message);
            }

            await new Promise(r => setTimeout(r, 500));
        }

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

// 2. Sync handler
async function handleSync(req: VercelRequest, res: VercelResponse) {
    try {
        const { users } = req.body;
        if (!users || !Array.isArray(users)) {
            return res.status(400).json({ error: 'Missing users array' });
        }

        const kicked: any[] = [];
        const checked: any[] = [];
        const errors: any[] = [];

        // Get group administrators to exclude them
        let adminIds: number[] = [];
        try {
            const adminsRes = await tgApi('getChatAdministrators', { chat_id: PRIVATE_GROUP_ID });
            if (adminsRes && adminsRes.ok) {
                adminIds = adminsRes.result.map((adm: any) => adm.user.id);
            }
        } catch (err: any) {
            console.error('[Sync] Failed to fetch admins:', err.message);
        }

        for (const u of users) {
            const userId = parseInt(u.telegram_id);
            if (isNaN(userId)) continue;

            if (adminIds.includes(userId)) continue;

            try {
                const memberRes = await tgApi('getChatMember', { chat_id: PRIVATE_GROUP_ID, user_id: userId });
                if (!memberRes || !memberRes.ok) continue;

                const status = memberRes.result.status;
                const isInGroup = ['member', 'restricted'].includes(status);

                if (isInGroup) {
                    const subRes = await fetch(`${MORENTY_API}/api/private/user/${userId}`, {
                        headers: { 'x-private-secret': PRIVATE_API_SECRET }
                    });

                    if (subRes.ok) {
                        const subData = await subRes.json();
                        if (!subData.is_subscribed) {
                            await kickUser(userId);

                            await sendMessage(userId,
                                `😔 Твоя підписка <b>ПРИВАТКА</b> закінчилась.\n\nТебе було вилучено з закритої групи.\n\n💳 Оформи підписку знову, щоб повернутися: https://morenty.xyz/privat`
                            );

                            await fetch(`${MORENTY_API}/api/private/expire`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'x-private-secret': PRIVATE_API_SECRET
                                },
                                body: JSON.stringify({ userId })
                            });

                            kicked.push({ telegram_id: userId, username: u.username });
                        } else {
                            checked.push({ telegram_id: userId, username: u.username, active: true });
                        }
                    }
                }
            } catch (e: any) {
                errors.push({ telegram_id: userId, error: e.message });
            }

            await new Promise(r => setTimeout(r, 200));
        }

        return res.status(200).json({ success: true, kicked, checked, errors });
    } catch (error: any) {
        console.error('[Sync] Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action } = req.query;

    if (action === 'sync' || req.method === 'POST') {
        if (req.headers['x-private-secret'] !== PRIVATE_API_SECRET) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return handleSync(req, res);
    } else {
        return handleCron(req, res);
    }
}

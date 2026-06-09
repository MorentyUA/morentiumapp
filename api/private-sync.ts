import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PRIVATE_GROUP_ID = process.env.PRIVATE_GROUP_ID || '-1003699693654';
const PRIVATE_API_SECRET = 'morenty-private-secret-2024';
const MORENTY_API = 'https://morenty.xyz';

async function tgApi(method: string, body: any) {
    if (!BOT_TOKEN) return null;
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}

async function sendMessage(chatId: number | string, text: string) {
    return tgApi('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
}

async function kickUser(userId: number) {
    await tgApi('banChatMember', { chat_id: PRIVATE_GROUP_ID, user_id: userId });
    await new Promise(r => setTimeout(r, 1000));
    await tgApi('unbanChatMember', { chat_id: PRIVATE_GROUP_ID, user_id: userId, only_if_banned: true });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (req.headers['x-private-secret'] !== PRIVATE_API_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { users } = req.body;
    if (!users || !Array.isArray(users)) {
        return res.status(400).json({ error: 'Missing users array' });
    }

    const kicked: any[] = [];
    const checked: any[] = [];
    const errors: any[] = [];

    // Get list of group admins to exclude them from kicking
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

        // Skip telegram group admins
        if (adminIds.includes(userId)) {
            continue;
        }

        try {
            // Check if member of the group
            const memberRes = await tgApi('getChatMember', { chat_id: PRIVATE_GROUP_ID, user_id: userId });
            if (!memberRes || !memberRes.ok) continue;

            const status = memberRes.result.status;
            const isInGroup = ['member', 'restricted'].includes(status); // don't count administrator/creator

            if (isInGroup) {
                // Check subscription status on website
                const subRes = await fetch(`${MORENTY_API}/api/private/user/${userId}`, {
                    headers: { 'x-private-secret': PRIVATE_API_SECRET }
                });

                if (subRes.ok) {
                    const subData = await subRes.json();
                    if (!subData.is_subscribed) {
                        // Kick user
                        await kickUser(userId);

                        // Send expiry notification message
                        await sendMessage(userId,
                            `😔 Твоя підписка <b>ПРИВАТКА</b> закінчилась.\n\nТебе було вилучено з закритої групи.\n\n💳 Оформи підписку знову, щоб повернутися: https://morenty.xyz/privat`
                        );

                        // Tell site to mark as expired
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

        // Delay to prevent hitting Telegram rate limits
        await new Promise(r => setTimeout(r, 200));
    }

    return res.status(200).json({ success: true, kicked, checked, errors });
}

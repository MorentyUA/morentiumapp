import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, list, del } from '@vercel/blob';

const BOT_TOKEN = process.env.BOT_TOKEN;
const STORE_FILE = 'chat_ids.json';

// Utility to send standard messages via Telegram's native HTTP API
async function sendTelegramMessage(chatId: number, text: string) {
    if (!BOT_TOKEN) return;
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML'
        }),
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Telegram webhooks only use POST. Return 200 on GET to allow easy testing.
    if (req.method !== 'POST') {
        return res.status(200).json({ status: 'Webhook is running.' });
    }

    try {
        const body = req.body;

        // Validate Telegram payload
        if (!body || !body.message) {
            return res.status(200).send('OK');
        }

        const message = body.message;
        const chatId = message.chat?.id;
        const text = message.text || '';

        // If it's a channel post or something without a proper chat ID, ignore.
        // We strictly only want to message individual users (private chats).
        if (!chatId || message.chat?.type !== 'private') {
            return res.status(200).send('OK');
        }

        // 1. Load existing chat IDs from Vercel Blob
        let chatIds: number[] = [];
        let storeBlobs: any[] = [];

        try {
            // Because Vercel Blob URLs are hashed, we use `list` to find our specific file.
            const { blobs } = await list({ token: process.env.morespace_READ_WRITE_TOKEN });
            storeBlobs = blobs.filter(b => b.pathname.includes('chat_ids'));
            storeBlobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            const fileBlob = storeBlobs[0];

            if (fileBlob) {
                const response = await fetch(`${fileBlob.url}?t=${Date.now()}`, {
                    cache: 'no-store'
                });
                if (response.ok) {
                    chatIds = await response.json();
                }
            }
        } catch (e) {
            console.error('Error fetching chat_ids from Blob. Assuming file is empty or missing.', e);
        }

        // 2. Add new chat ID if it doesn't already exist in our database
        if (!chatIds.includes(chatId)) {
            chatIds.push(chatId);

            // Upload the patched array back to Vercel Blob
            // addRandomSuffix: true generates a fresh CDN URL to bypass edge caching
            const { url, pathname } = await put(STORE_FILE, JSON.stringify(chatIds), {
                access: 'public',
                addRandomSuffix: true,
                contentType: 'application/json',
                token: process.env.morespace_READ_WRITE_TOKEN
            });

            // Garbage Collection
            const oldBlobUrls = storeBlobs.filter((b: any) => b.pathname !== pathname).map((b: any) => b.url);
            if (oldBlobUrls.length > 0) {
                await del(oldBlobUrls, { token: process.env.morespace_READ_WRITE_TOKEN }).catch(e => console.error("GC Error", e));
            }
            console.log(`[Webhook] Added new user chatId: ${chatId}`);
        }

        // 3. Send an onboarding welcome message strictly when they start the bot
        if (text === '/start') {
            await sendTelegramMessage(
                chatId,
                "👋 <b>Привіт!</b>\n\nЯ офіційний бот додатку. Дякуємо, що приєднались! \n\nТут ми будемо повідомляти вас про важливі оновлення, анонси та події проекта. Залишайтесь на зв'язку!"
            );
        }

        // Always return 200 so Telegram's servers know we received the update and don't retry.
        return res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Runtime Error:', error);
        return res.status(200).send('OK');
    }
}

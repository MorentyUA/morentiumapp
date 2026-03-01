import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list } from '@vercel/blob';

const BOT_TOKEN = process.env.BOT_TOKEN;
const STORE_FILE = 'chat_ids.json';

// Helper function to dispatch messages cleanly
async function sendTelegramMessage(chatId: number, text: string) {
    if (!BOT_TOKEN) return false;
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
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
        return response.ok;
    } catch {
        return false;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, secret } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Повідомлення не може бути пустим.' });
    }

    try {
        // 1. Retrieve the master list of user chat IDs
        let chatIds: number[] = [];
        const { blobs } = await list({ token: process.env.morespace_READ_WRITE_TOKEN });
        const storeBlobs = blobs.filter(b => b.pathname.includes('chat_ids'));
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

        if (chatIds.length === 0) {
            return res.status(404).json({ error: 'База користувачів порожня. Нікому надсилати.' });
        }

        let successCount = 0;
        let failCount = 0;

        // 2. Broadcast in batches
        // Telegram restricts to ~30 messages per second. A batch size of 20 keeps us safely under the limit.
        const batchSize = 20;
        for (let i = 0; i < chatIds.length; i += batchSize) {
            const batch = chatIds.slice(i, i + batchSize);

            // Fire batch messages concurrently
            const results = await Promise.all(batch.map(id => sendTelegramMessage(id, message)));

            results.forEach(ok => {
                if (ok) successCount++;
                else failCount++;
            });

            // If we have more batches to go, sleep for 1 second to adhere to the rate limit
            if (i + batchSize < chatIds.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return res.status(200).json({
            success: true,
            message: `Розсилку завершено! Вдало: ${successCount}. Помилок: ${failCount}.`
        });

    } catch (error: any) {
        console.error('Broadcast Output Error:', error);
        return res.status(500).json({ error: 'Помилка розсилки', details: error.message });
    }
}

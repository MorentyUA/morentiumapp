import { kv } from '@vercel/kv';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter in body' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const PRIVATE_GROUP_ID = process.env.PRIVATE_GROUP_ID || process.env.GROUP_ID || '-1003699693654';

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'BOT_TOKEN is not configured on server' });
  }

  try {
    // 1. Check if user is actually in the group
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${PRIVATE_GROUP_ID}&user_id=${userId}`);
    const data = await response.json();
    
    let isSubscribed = false;
    if (data.ok) {
      const status = data.result.status;
      isSubscribed = ['member', 'administrator', 'creator', 'restricted'].includes(status);
    }

    if (!isSubscribed) {
      return res.status(403).json({ error: 'Access Denied. You are not a member of the private group.' });
    }

    // 2. Generate Key (Format: MOR-XXXX-YYYY-ZZZZ)
    const generateSegment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `MOR-${generateSegment()}-${generateSegment()}-${generateSegment()}`;

    // 3. Save to Vercel KV
    // Store mapping: key -> { userId, status, hwid }
    await kv.set(`morvoice_key:${newKey}`, {
      userId: userId,
      status: 'pending_activation', // Will change to 'active' when first used on PC
      hwid: null,
      createdAt: Date.now()
    });
    
    // Also save a reference from the user to the key (so we know if they already have one)
    await kv.set(`morvoice_user:${userId}`, newKey);

    return res.status(200).json({ key: newKey });

  } catch (error) {
    console.error("Error generating key:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

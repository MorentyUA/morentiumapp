import { Redis } from '@upstash/redis';

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
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.MORSPACE_KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.MORSPACE_KV_REST_API_TOKEN;

    if (!redisUrl || !redisToken) {
      return res.status(500).json({ error: 'Server Configuration Error: Upstash/KV Database URL is missing.' });
    }
    const redis = new Redis({ url: redisUrl, token: redisToken });
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

    // 3. Save to Upstash Redis Key-Value
    const keyData = {
      userId: userId,
      status: 'pending_activation',
      hwid: null,
      createdAt: Date.now()
    };

    await redis.set(`morvoice:keys:${newKey}`, keyData);

    return res.status(200).json({ key: newKey });

  } catch (error: any) {
    console.error("Error generating key:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message || error.toString() });
  }
}

export default async function handler(req: any, res: any) {
  // Add CORS headers for local development testing
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

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  // We read the bot token from Vercel Environment variables.
  const BOT_TOKEN = process.env.BOT_TOKEN;
  // Read Group/Channel ID from env.
  const PUBLIC_CHANNEL_ID = process.env.PUBLIC_CHANNEL_ID;
  const PRIVATE_GROUP_ID = process.env.PRIVATE_GROUP_ID || process.env.GROUP_ID || '-1003699693654';

  // If no bot token is set up on the server yet, we'll bypass the check so the app doesn't break.
  if (!BOT_TOKEN) {
    console.warn("BOT_TOKEN is not set in environment variables. Bypassing subscription check.");
    return res.status(200).json({ isPublicSubscribed: true, isPrivateSubscribed: true, bypassed: true });
  }

  const checkStatus = async (channelId: string | undefined) => {
    if (!channelId) return { isSubscribed: false, debug: `No channel ID provided` };
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${channelId}&user_id=${userId}`);
      const data = await response.json();
      if (data.ok) {
        const status = data.result.status;
        const isSubscribed = ['member', 'administrator', 'creator', 'restricted'].includes(status);
        return { isSubscribed, debug: !isSubscribed ? `User status: "${status}"` : null };
      } else {
        return { isSubscribed: false, debug: `Telegram API Error: ${data.description}` };
      }
    } catch (error: any) {
      return { isSubscribed: false, debug: `Fetch error: ${error.message}` };
    }
  };

  try {
    const [publicResult, privateResult] = await Promise.all([
      checkStatus(PUBLIC_CHANNEL_ID),
      checkStatus(PRIVATE_GROUP_ID)
    ]);

    return res.status(200).json({
      isPublicSubscribed: publicResult.isSubscribed,
      isPrivateSubscribed: privateResult.isSubscribed,
      debug: {
        public: publicResult.debug,
        private: privateResult.debug
      }
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

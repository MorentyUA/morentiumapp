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
  // Use the specific channel requested by the user
  const CHANNEL_ID = '@morentube';

  // If no bot token is set up on the server yet, we'll bypass the check so the app doesn't break.
  if (!BOT_TOKEN) {
    console.warn("BOT_TOKEN is not set in environment variables. Bypassing subscription check.");
    return res.status(200).json({ isSubscribed: true, bypassed: true });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${userId}`);
    const data = await response.json();

    if (data.ok) {
      const status = data.result.status;
      // Valid statuses for a subscriber: 'member', 'administrator', 'creator', 'restricted'
      const isSubscribed = ['member', 'administrator', 'creator', 'restricted'].includes(status);
      return res.status(200).json({ isSubscribed });
    } else {
      // If the API call fails (e.g., bot not an admin in the channel), we might want to log it
      // but let's default to not subscribed or bypass depending on strictness.
      console.error("Telegram API Error:", data.description);
      return res.status(200).json({ isSubscribed: false, error: data.description });
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

import { get } from '@vercel/edge-config';

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

    // --- GET DATA ---
    if (req.method === 'GET') {
        try {
            const categories = await get('categories') || null;
            const items = await get('items') || null;

            return res.status(200).json({ categories, items });
        } catch (error) {
            console.error("Error reading edge config:", error);
            return res.status(500).json({ error: 'Failed to read data' });
        }
    }

    // --- SAVE DATA (POST) ---
    if (req.method === 'POST') {
        try {
            const { categories, items, adminId } = req.body;

            // Note: Ideally, validate adminId securely matching the bot's known admin
            // For this simplified version, we process the update.

            // We need VERCEL_API_TOKEN, VERCEL_TEAM_ID (or user ID), and EDGE_CONFIG_ID 
            // to hit the Vercel REST API and update the Edge Config.
            const API_TOKEN = process.env.VERCEL_API_TOKEN;
            const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
            const TEAM_ID = process.env.VERCEL_TEAM_ID;

            if (!API_TOKEN || !EDGE_CONFIG_ID) {
                return res.status(500).json({ error: 'Missing Vercel API credentials in environment variables.' });
            }

            // Build the Vercel API URL
            let url = `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`;
            if (TEAM_ID) {
                url += `?teamId=${TEAM_ID}`;
            }

            // Vercel Edge Config Patch payload
            const payload = {
                items: [
                    {
                        operation: 'upsert',
                        key: 'categories',
                        value: categories
                    },
                    {
                        operation: 'upsert',
                        key: 'items',
                        value: items
                    }
                ]
            };

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                return res.status(200).json({ success: true, message: 'Data saved globally.' });
            } else {
                console.error("Vercel API Error:", data);
                return res.status(response.status).json({ error: data });
            }

        } catch (error) {
            console.error("Error saving to edge config:", error);
            return res.status(500).json({ error: 'Failed to save data' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

import { list } from '@vercel/blob';

export default async function handler(req: any, res: any) {
    try {
        const { blobs } = await list({
            token: process.env.morespace_READ_WRITE_TOKEN
        });
        return res.status(200).json({ blobs });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

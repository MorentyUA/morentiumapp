require('dotenv').config({ path: '.env.prod' });
const { Redis } = require('@upstash/redis');

async function test_verify() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    console.log("URL:", redisUrl);
    console.log("Token:", redisToken ? "Exists" : "Missing");

    const redis = new Redis({ url: redisUrl, token: redisToken });
    const key = 'test-key';

    try {
        console.log("Fetching key...");
        const keyData = await redis.get(`morvoice:keys:${key}`);
        console.log("Result:", keyData);
    } catch (e) {
        console.log("Exception:", e);
    }
}

test_verify();

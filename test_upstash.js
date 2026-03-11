const { Redis } = require('@upstash/redis');

try {
    // Simulate missing environment variable
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';

    const redis = Redis.fromEnv();
    redis.get('test').catch(e => {
        console.log("Error caught during get:", e.message);
    });
} catch (e) {
    console.log("Error caught during init:", e.message);
}

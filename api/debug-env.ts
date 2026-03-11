export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Only list KEY NAMES (not values!) for security
    const allKeys = Object.keys(process.env);
    const dbKeys = allKeys.filter(key =>
        key.toLowerCase().includes('kv') ||
        key.toLowerCase().includes('redis') ||
        key.toLowerCase().includes('upstash') ||
        key.toLowerCase().includes('morspace')
    );

    return res.status(200).json({
        found_db_keys: dbKeys,
        total_env_vars: allKeys.length
    });
}

export default async function handler(req: any, res: any) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        try {
            const { categories, items } = req.body;

            // We need GITHUB_TOKEN set in Vercel Environment Variables
            const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
            if (!GITHUB_TOKEN) {
                return res.status(500).json({
                    error: 'GITHUB_TOKEN is missing in Vercel Environment Variables. Please create a Classic Token with "repo" scope and add it.'
                });
            }

            const REPO_OWNER = 'MorentyUA';
            const REPO_NAME = 'morentiumapp';
            const FILE_PATH = 'src/data.json';
            const BRANCH = 'main';

            const githubApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

            // Step 1: Get the current SHA of the file (required to update it)
            const getRes = await fetch(`${githubApiUrl}?ref=${BRANCH}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Vercel-Admin-Panel'
                }
            });

            if (!getRes.ok) {
                const errData = await getRes.json();
                return res.status(getRes.status).json({
                    error: `Failed to fetch file SHA from GitHub: ${errData.message}`
                });
            }

            const getJson = await getRes.json();
            const currentSha = getJson.sha;

            // Step 2: Prepare new file content in Base64
            // We stringify the payload neatly
            const newFileContentString = JSON.stringify({ categories, items }, null, 2);
            // Convert to base64 properly handling unicode
            const newFileContentBase64 = Buffer.from(newFileContentString, 'utf-8').toString('base64');

            // Step 3: Commit the update to GitHub
            const putRes = await fetch(githubApiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Vercel-Admin-Panel'
                },
                body: JSON.stringify({
                    message: `Content update via Admin Panel (${new Date().toLocaleString('uk-UA')})`,
                    content: newFileContentBase64,
                    sha: currentSha,
                    branch: BRANCH
                })
            });

            if (!putRes.ok) {
                const putErrData = await putRes.json();
                return res.status(putRes.status).json({
                    error: `Failed to push commit to GitHub: ${putErrData.message}`
                });
            }

            // Success
            return res.status(200).json({
                success: true,
                message: 'Успішно збережено! Github commit створено. Оновлення сайту займе ~30-60 секунд.'
            });

        } catch (error: any) {
            console.error("Github Save Error:", error);
            return res.status(500).json({ error: error.message || 'Server error pushing to GitHub' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

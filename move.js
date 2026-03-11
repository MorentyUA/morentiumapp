const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'api');
const targetDir = path.join(apiDir, '_youtube');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
}

const files = fs.readdirSync(apiDir);
files.forEach(file => {
    if (file.startsWith('youtube-') && file.endsWith('.ts')) {
        const oldPath = path.join(apiDir, file);
        const newPath = path.join(targetDir, file);
        fs.renameSync(oldPath, newPath);
        console.log(`Moved ${file} to _youtube/`);
    }
});

const toDelete = ['blobs.ts', 'migrate-blobs-to-redis.ts'];
toDelete.forEach(file => {
    const fPath = path.join(apiDir, file);
    if (fs.existsSync(fPath)) {
        fs.unlinkSync(fPath);
        console.log(`Deleted ${file}`);
    }
});

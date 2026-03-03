import fs from 'fs';
import path from 'path';

const files = [
    'YoutubeSpy.tsx', 'YoutubeTracker.tsx', 'YoutubeComments.tsx',
    'YoutubeTrends.tsx', 'YoutubeSuperSearch.tsx', 'YoutubeTagsGenerator.tsx',
    'YoutubeChannelAudit.tsx', 'YoutubeThumbnailSimulator.tsx', 'YoutubeRevenue.tsx'
];

files.forEach(f => {
    const full = path.join(process.cwd(), 'src', 'components', f);
    if (fs.existsSync(full)) {
        let content = fs.readFileSync(full, 'utf8');
        content = content.replace(/absolute right-\[4\.5rem\]/g, 'absolute right-[7rem]');
        content = content.replace(/absolute right-\[6\.5rem\]/g, 'absolute right-[7rem]');
        content = content.replace(/absolute right-\[8\.5rem\]/g, 'absolute right-[7rem]');
        content = content.replace(/absolute right-\[7\.5rem\]/g, 'absolute right-[7rem]');
        fs.writeFileSync(full, content);
    }
});
console.log('Replaced correctly!');

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
        content = content.replace(/className="absolute right-\[8\.5rem\] top-1\/2 -translate-y-1\/2 p-1\.5 bg-slate-800/g, 'className="absolute right-[4.5rem] top-1/2 -translate-y-1/2 p-1.5 bg-slate-800');
        fs.writeFileSync(full, content);
    }
});
console.log('Replaced correctly!');

const fs = require('fs');
const path = require('path');

const files = [
    'YoutubeSpy.tsx', 'YoutubeTracker.tsx', 'YoutubeComments.tsx',
    'YoutubeTrends.tsx', 'YoutubeSuperSearch.tsx', 'YoutubeTagsGenerator.tsx',
    'YoutubeChannelAudit.tsx', 'YoutubeThumbnailSimulator.tsx', 'YoutubeRevenue.tsx'
];

files.forEach(f => {
    const full = path.join(__dirname, 'src', 'components', f);
    if (fs.existsSync(full)) {
        let content = fs.readFileSync(full, 'utf8');
        content = content.replace(/className="absolute right-\[8\.5rem\] top-1\/2 -translate-y-1\/2 p-1\.5 bg-slate-800/g, 'className="absolute right-[6.5rem] top-1/2 -translate-y-1/2 p-1.5 bg-slate-800');
        content = content.replace(/className="absolute right-\[8\.5rem\] top-1\/2 -translate-y-1\/2 pb-1\.5 bg-slate-800/g, 'className="absolute right-[6.5rem] top-1/2 -translate-y-1/2 p-1.5 bg-slate-800');
        fs.writeFileSync(full, content);
    }
});
console.log('Replaced correctly!');

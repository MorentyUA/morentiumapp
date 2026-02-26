import React from 'react';
import { ExternalLink, FileText, Play } from 'lucide-react';
import { type Item } from '../types';

interface ItemCardProps {
    item: Item;
    isSelected?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isSelected }) => {
    const selectedStyle = isSelected ? "ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "border border-white/5";
    if (item.type === 'youtube' && item.url) {
        // Extract video ID safely
        let videoId = '';
        let isShort = false;
        try {
            if (item.url.includes('youtu.be/')) {
                videoId = item.url.split('youtu.be/')[1].split('?')[0];
            } else if (item.url.includes('youtube.com/watch')) {
                videoId = item.url.split('v=')[1]?.split('&')[0];
            } else if (item.url.includes('youtube.com/shorts/')) {
                videoId = item.url.split('shorts/')[1]?.split('?')[0];
                isShort = true;
            }
        } catch (e) {
            console.error('Invalid Youtube URL', item.url);
        }

        return (
            <div className={`glass-card p-5 space-y-4 transition-all hover:bg-white/5 ${selectedStyle}`}>
                <div className="flex items-center space-x-3 text-red-500 mb-2">
                    <div className="p-2 bg-red-500/10 rounded-xl">
                        <Play className="w-5 h-5 fill-current" />
                    </div>
                    <h4 className="font-bold text-xl text-white">{item.title}</h4>
                </div>
                <div className={`${isShort ? 'aspect-[9/16] max-h-[70vh] mx-auto w-auto' : 'aspect-video w-full'} rounded-xl overflow-hidden bg-[#0f172a] border border-white/10 shadow-inner flex justify-center`}>
                    {videoId ? (
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={item.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
                            <Play className="w-8 h-8 mb-2 opacity-50" />
                            <span>Video Unavailable</span>
                        </div>
                    )}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{item.content}</p>
            </div>
        );
    }

    if (item.type === 'link') {
        return (
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`glass-card p-5 flex items-center justify-between group hover:bg-white/10 transition-colors block border-l-4 border-l-blue-500 ${selectedStyle}`}
            >
                <div className="pr-4">
                    <h4 className="font-bold text-xl text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {item.title}
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.content}</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-full text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg">
                    <ExternalLink className="w-6 h-6" />
                </div>
            </a>
        );
    }

    // text type
    return (
        <div className={`glass-card p-6 border-t border-t-emerald-500/30 ${selectedStyle}`}>
            <div className="flex items-center space-x-3 mb-4 text-emerald-400">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xl text-white">{item.title}</h4>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {item.content}
            </p>
        </div>
    );
};

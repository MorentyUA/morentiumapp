import React, { useState } from 'react';
import { ExternalLink, FileText, Play } from 'lucide-react';
import { type Item } from '../types';

interface ItemCardProps {
    item: Item;
    isSelected?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isSelected }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const selectedStyle = isSelected ? "ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "border border-white/5";

    const renderContent = () => {
        if (!item.content) return null;

        const lines = item.content.split('\n');
        // Define "long" as > 150 chars or > 4 lines
        const isLongText = item.content.length > 150 || lines.length > 4;

        let displayText = item.content;
        if (!isExpanded && isLongText) {
            if (lines.length > 4) {
                displayText = lines.slice(0, 4).join('\n') + '...';
            } else {
                displayText = item.content.slice(0, 150) + '...';
            }
        }

        return (
            <div className="mt-2">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {displayText}
                </p>
                {isLongText && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsExpanded(!isExpanded);
                        }}
                        className="mt-2 text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors"
                    >
                        {isExpanded ? 'Згорнути' : 'Читати повністю...'}
                    </button>
                )}
            </div>
        );
    };
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
                {renderContent()}
            </div>
        );
    }

    if (item.type === 'link') {
        return (
            <div className={`glass-card p-5 block border-l-4 border-l-blue-500 ${selectedStyle}`}>
                <div className="flex flex-col">
                    <div className="flex items-center space-x-3 text-blue-400 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <ExternalLink className="w-5 h-5 fill-current" />
                        </div>
                        <h4 className="font-bold text-xl text-white">
                            {item.title}
                        </h4>
                    </div>
                    {renderContent()}
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center shadow-lg"
                    >
                        <ExternalLink className="w-5 h-5 mr-2" /> Відкрити посилання
                    </a>
                </div>
            </div>
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
            {renderContent()}
        </div>
    );
};

import React, { useState } from 'react';
import { ExternalLink, FileText, Play, CheckCircle2, Circle, Bookmark } from 'lucide-react';
import { type Item } from '../types';
import { useBookmarks } from '../hooks/useBookmarks';

interface ItemCardProps {
    item: Item;
    isSelected?: boolean;
    isCompleted?: boolean;
    onToggleCompletion?: (e: React.MouseEvent) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isSelected, isCompleted, onToggleCompletion }) => {
    const tg = (window as any).Telegram?.WebApp;
    const [isExpanded, setIsExpanded] = useState(false);
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const isSaved = isBookmarked(item.id);

    // Base styles + Selection Rings + Completed Dimming
    const baseStyle = isSelected ? "ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "border border-white/5";
    const completedStyle = isCompleted ? "ring-2 ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] bg-cyan-500/5" : "hover:bg-white/5";
    // If both are true, cyan wins because it's appended later, which is fine since completion is a stronger state.
    const selectedStyle = `${baseStyle} ${completedStyle}`;

    const renderToggle = () => (
        <div className="ml-auto flex items-center gap-1 -mr-2 shrink-0">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onToggleCompletion) onToggleCompletion(e);
                }}
                className="p-2 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                {isCompleted && (
                    <span className="text-sm font-bold text-cyan-400 tracking-wide uppercase drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">
                        Пройдено
                    </span>
                )}
                {isCompleted ? <CheckCircle2 className="w-8 h-8 text-cyan-400 fill-cyan-400/20 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" /> : <Circle className="w-8 h-8 opacity-50 stroke-2" />}
            </button>
        </div>
    );

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

        const renderTextWithLinks = (text: string) => {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const parts = text.split(urlRegex);
            return parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    return (
                        <a
                            key={i}
                            href={part}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (tg) {
                                    if (part.includes('t.me/') || part.includes('telegram.me/')) {
                                        tg.openTelegramLink(part);
                                    } else {
                                        tg.openLink(part);
                                    }
                                } else {
                                    window.open(part, '_blank');
                                }
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors underline break-all"
                        >
                            {part}
                        </a>
                    );
                }
                return part;
            });
        };

        return (
            <div className="mt-2">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {renderTextWithLinks(displayText)}
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
            <div className={`glass-card p-5 space-y-4 transition-all relative ${selectedStyle}`}>
                <div className="absolute bottom-4 right-4 z-10">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleBookmark(item.id);
                        }}
                        className="p-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-black/40 backdrop-blur-md rounded-full shadow-lg"
                    >
                        <Bookmark className={`w-5 h-5 transition-all ${isSaved ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-slate-400 hover:text-yellow-400 stroke-[1.5]'}`} />
                    </button>
                </div>

                <div className="flex items-start gap-3 mb-2">
                    <div className="p-2 bg-red-500/10 rounded-xl text-red-500 shrink-0 mt-0.5">
                        <Play className="w-5 h-5 fill-current" />
                    </div>
                    <h4 className="font-bold text-xl text-white flex-1 min-w-0 pr-2">{item.title}</h4>
                    {renderToggle()}
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
            <div className={`glass-card p-5 block border-l-4 border-l-blue-500 transition-all relative ${selectedStyle}`}>
                <div className="absolute bottom-4 right-4 z-10">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleBookmark(item.id);
                        }}
                        className="p-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-black/40 backdrop-blur-md rounded-full shadow-lg"
                    >
                        <Bookmark className={`w-5 h-5 transition-all ${isSaved ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-slate-400 hover:text-yellow-400 stroke-[1.5]'}`} />
                    </button>
                </div>

                <div className="flex flex-col">
                    <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 shrink-0 mt-0.5">
                            <ExternalLink className="w-5 h-5 fill-current" />
                        </div>
                        <h4 className="font-bold text-xl text-white flex-1 min-w-0 pr-2">
                            {item.title}
                        </h4>
                        {renderToggle()}
                    </div>
                    {renderContent()}
                    <button
                        onClick={() => {
                            if (!item.url) return;
                            if (tg) {
                                if (item.url.includes('t.me/') || item.url.includes('telegram.me/')) {
                                    tg.openTelegramLink(item.url);
                                } else {
                                    tg.openLink(item.url);
                                }
                            } else {
                                window.open(item.url, '_blank');
                            }
                        }}
                        className="mt-4 w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center shadow-lg"
                    >
                        <ExternalLink className="w-5 h-5 mr-2" /> Відкрити посилання
                    </button>
                </div>
            </div>
        );
    }

    // text type
    return (
        <div className={`glass-card p-6 transition-all border-t border-t-emerald-500/30 relative ${selectedStyle}`}>
            <div className="absolute bottom-4 right-4 z-10">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleBookmark(item.id);
                    }}
                    className="p-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-black/40 backdrop-blur-md rounded-full shadow-lg"
                >
                    <Bookmark className={`w-5 h-5 transition-all ${isSaved ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-slate-400 hover:text-yellow-400 stroke-[1.5]'}`} />
                </button>
            </div>

            <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xl text-white flex-1 min-w-0 pr-2">{item.title}</h4>
                {renderToggle()}
            </div>
            {renderContent()}
        </div>
    );
};

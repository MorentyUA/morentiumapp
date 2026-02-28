import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, ThumbsUp, MessageSquare, Eye, Key, Settings, Tag, TrendingUp, AlertCircle } from 'lucide-react';

interface SpyStats {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    engagementRate: string;
}

interface VideoData {
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    publishedAt: string;
    tags: string[];
    stats: SpyStats;
}

type SpyData =
    | { type: 'video'; video: VideoData }
    | { type: 'channel'; channelTitle: string; videos: VideoData[] };

export const YoutubeSpy: React.FC = () => {
    const [query, setQuery] = useState('');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('youtube_api_key') || '');
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<SpyData | null>(null);
    const [copiedTag, setCopiedTag] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        setData(null);

        try {
            const url = `/api/youtube-spy?q=${encodeURIComponent(query)}${apiKey ? `&key=${apiKey}` : ''}`;
            const res = await fetch(url);
            const resData = await res.json();

            if (!res.ok) {
                throw new Error(resData.error || 'Failed to fetch video data');
            }

            setData(resData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (isNaN(num)) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const handleSaveKey = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setApiKey(val);
        localStorage.setItem('youtube_api_key', val);
    };

    const copyTag = (tag: string, index: number) => {
        navigator.clipboard.writeText(tag);
        setCopiedTag(`${index}-${tag}`);
        setTimeout(() => setCopiedTag(null), 1500);
    };

    const copyAllTags = (tags: string[], index: number) => {
        navigator.clipboard.writeText(tags.join(', '));
        setCopiedTag(`${index}-all`);
        setTimeout(() => setCopiedTag(null), 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 sm:p-6 mb-24 min-h-screen"
        >
            {/* Header & Settings */}
            <div className="mb-8 pt-4 flex flex-col items-center justify-center relative">
                <div className="text-center w-full px-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 mb-2 drop-shadow-md tracking-tight flex items-center justify-center">
                        SEO Шпигун <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 ml-2 sm:ml-3 text-indigo-500" />
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base">Аналізуйте приховані теги та реальне залучення будь-якого YouTube відео.</p>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="absolute top-2 right-0 p-3 bg-white/5 hover:bg-white/15 rounded-xl transition-colors border border-white/10 text-slate-400 hover:text-white"
                >
                    <Settings className="w-6 h-6" />
                </button>
            </div>

            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl relative">
                            <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 block">
                                Власний YouTube API Key (Опціонально)
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                                <input
                                    type="password"
                                    placeholder="AIzaSy..."
                                    value={apiKey}
                                    onChange={handleSaveKey}
                                    className="w-full bg-black/40 border border-emerald-500/20 rounded-xl py-3 pl-10 pr-4 text-emerald-100 placeholder-emerald-800/50 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                                />
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <p className="text-[10px] sm:text-xs text-emerald-400/60 leading-tight flex-1 pr-4">
                                    Якщо ключ не вказано, використовується ключ адміністратора. Ваш ключ зберігається лише на вашому пристрої.
                                </p>
                                <a
                                    href="https://developers.google.com/youtube/v3/getting-started"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] sm:text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap"
                                >
                                    Як отримати ключ?
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="mb-8 relative">
                <input
                    type="text"
                    placeholder="Посилання на ВІДЕО, Shorts або КАНАЛ"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-black/40 border border-indigo-500/30 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors shadow-inner"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
            </form>

            {/* Results Area */}
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6 text-sm flex items-center"
                    >
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}

                {data && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-8"
                    >
                        {data.type === 'channel' && (
                            <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-2xl p-4 text-center">
                                <h2 className="text-xl font-bold text-white mb-1">🔥 Топ-3 найпопулярніших відео за місяць</h2>
                                <p className="text-indigo-300 text-sm">Канал: <span className="font-bold text-white">{data.channelTitle}</span></p>
                            </div>
                        )}

                        {(data.type === 'channel' ? data.videos : [data.video]).map((videoData, vIndex) => (
                            <div key={videoData.id} className="space-y-6">
                                {/* Video Metadata & Engagement */}
                                <div className="glass-card p-6 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full -mr-20 -mt-20" />

                                    <div className="flex flex-col sm:flex-row gap-6 relative z-10 mb-6">
                                        <img
                                            src={videoData.thumbnail}
                                            alt={videoData.title}
                                            className="w-full sm:w-48 aspect-video rounded-xl border border-white/10 shadow-lg object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight">{videoData.title}</h2>
                                            <p className="text-sm font-medium text-slate-300 mb-4">{videoData.channelTitle}</p>

                                            <div className="flex items-center gap-3">
                                                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-xl font-black text-xl shadow-lg shadow-indigo-500/20 flex flex-col items-center justify-center">
                                                    {videoData.stats.engagementRate}%
                                                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Рівень Залучення</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Raw Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
                                        <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center border border-white/5">
                                            <Eye className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                            <p className="text-lg sm:text-2xl font-bold text-white mb-1">{formatNumber(videoData.stats.viewCount)}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Перегляди</p>
                                        </div>
                                        <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center border border-white/5">
                                            <ThumbsUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                                            <p className="text-lg sm:text-2xl font-bold text-white mb-1">{formatNumber(videoData.stats.likeCount)}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Лайки</p>
                                        </div>
                                        <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center border border-white/5">
                                            <MessageSquare className="w-5 h-5 text-pink-400 mx-auto mb-2" />
                                            <p className="text-lg sm:text-2xl font-bold text-white mb-1">{formatNumber(videoData.stats.commentCount)}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Коментарі</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Extracted Tags Area */}
                                <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                        <h3 className="text-lg font-bold text-white flex items-center">
                                            <Tag className="w-5 h-5 mr-2 text-indigo-400" />
                                            Приховані Теги
                                            <span className="ml-3 bg-white/10 text-white/60 text-xs px-2 py-1 rounded-full font-medium">
                                                {videoData.tags.length}
                                            </span>
                                        </h3>

                                        {videoData.tags.length > 0 && (
                                            <button
                                                onClick={() => copyAllTags(videoData.tags, vIndex)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${copiedTag === `${vIndex}-all`
                                                    ? 'bg-emerald-500 text-white scale-95'
                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                                    }`}
                                            >
                                                {copiedTag === `${vIndex}-all` ? 'Скопійовано!' : 'Копіювати всі теги'}
                                            </button>
                                        )}
                                    </div>

                                    {videoData.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {videoData.tags.map((tag, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => copyTag(tag, vIndex)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${copiedTag === `${vIndex}-${tag}`
                                                        ? 'bg-emerald-500 border-emerald-400 text-white'
                                                        : 'bg-black/40 border-white/10 text-slate-300 hover:border-indigo-500 hover:text-white'
                                                        }`}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-8">
                                            У цього відео немає прихованих тегів.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

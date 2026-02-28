import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Users, Eye, Video, Settings, Key } from 'lucide-react';
import { CalendarView } from './CalendarView';
import { type YoutubeChannel, type YoutubeVideo } from '../types';

export const YoutubeTracker: React.FC = () => {
    const [query, setQuery] = useState('');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('youtube_api_key') || '');
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [channel, setChannel] = useState<YoutubeChannel | null>(null);
    const [videos, setVideos] = useState<YoutubeVideo[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        setChannel(null);
        setVideos([]);

        try {
            const url = `/api/youtube-tracker?q=${encodeURIComponent(query)}${apiKey ? `&key=${apiKey}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch channel');
            }

            setChannel(data.channel);
            setVideos(data.videos);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatNumber = (num: string) => {
        const n = parseInt(num, 10);
        if (isNaN(n)) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    };

    const handleSaveKey = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setApiKey(val);
        localStorage.setItem('youtube_api_key', val);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 sm:p-6 mb-24 min-h-screen"
        >
            <div className="mb-8 pt-4 flex flex-col items-center justify-center relative">
                <div className="text-center w-full px-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600 mb-2 drop-shadow-md tracking-tight">
                        YouTube Tracker
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base">Відстежуйте графік публікацій будь-якого YouTube каналу.</p>
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

            <form onSubmit={handleSearch} className="mb-8 relative">
                <input
                    type="text"
                    placeholder="Посилання на ВІДЕО або ID Каналу"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white p-2 rounded-xl transition-colors"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
            </form>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6 text-sm flex items-center"
                    >
                        {error}
                    </motion.div>
                )}

                {channel && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-6"
                    >
                        {/* Dashboard Stats Card */}
                        <div className="glass-card p-6 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-10 -mt-10" />

                            <div className="flex items-center space-x-4 mb-6 relative z-10">
                                <img src={channel.thumbnail} alt={channel.title} className="w-16 h-16 rounded-full border-2 border-white/10 shadow-lg object-cover" />
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{channel.title}</h2>
                                    <p className="text-sm text-slate-400">{channel.customUrl}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
                                <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center border border-white/5">
                                    <Users className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-lg sm:text-2xl font-bold text-white mb-1">{formatNumber(channel.subscriberCount)}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Підписники</p>
                                </div>
                                <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center border border-white/5">
                                    <Eye className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                    <p className="text-lg sm:text-2xl font-bold text-white mb-1">{formatNumber(channel.viewCount)}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Перегляди</p>
                                </div>
                                <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center border border-white/5">
                                    <Video className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                                    <p className="text-lg sm:text-2xl font-bold text-white mb-1">{formatNumber(channel.videoCount)}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold">Відео</p>
                                </div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <CalendarView videos={videos} />

                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

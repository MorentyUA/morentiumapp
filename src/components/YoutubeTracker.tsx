import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Users, Eye, Video, Settings, Key, Save, X } from 'lucide-react';
import { CalendarView } from './CalendarView';
import { type YoutubeChannel, type YoutubeVideo } from '../types';

export const YoutubeTracker: React.FC = () => {
    const [query, setQuery] = useState('');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('youtube_api_key') || '');
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
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

    const handleSaveKey = () => {
        if (apiKey.trim()) {
            localStorage.setItem('youtube_api_key', apiKey.trim());
        } else {
            localStorage.removeItem('youtube_api_key');
        }
        setIsApiModalOpen(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6 pb-24 relative pt-4 sm:pt-6 px-4"
        >
            <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl">

                <div className="relative flex items-center justify-center mb-8">
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600 mb-2 drop-shadow-md tracking-tight flex items-center justify-center">
                            YouTube Tracker
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Відстежуйте графік публікацій відео</p>
                    </div>
                    <button
                        onClick={() => setIsApiModalOpen(true)}
                        className="absolute right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        placeholder="Посилання: відео або ID каналу"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full text-sm sm:text-base bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
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
            </div>

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

            {/* API Key Modal */}
            <AnimatePresence>
                {isApiModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-800 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center">
                                    <Key className="w-5 h-5 mr-2 text-red-500" />
                                    Налаштування API
                                </h3>
                                <button
                                    onClick={() => setIsApiModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Власний Google Cloud API Key</label>
                                    <input
                                        type="text"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono text-sm"
                                    />
                                    <div className="flex justify-between items-start mt-2 space-x-2">
                                        <p className="text-xs text-slate-500 flex-1">
                                            Залиште пустим, щоб використовувати загальний ключ. Свій ключ обходить ліміти.
                                        </p>
                                        <a
                                            href="https://developers.google.com/youtube/v3/getting-started"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] sm:text-xs font-bold text-white bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            Як отримати ключ?
                                        </a>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveKey}
                                    className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl transition-colors font-medium mt-4"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Зберегти налаштування</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

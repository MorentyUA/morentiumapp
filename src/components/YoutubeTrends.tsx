import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Loader2, Globe, LayoutGrid, Eye, Calendar, ExternalLink, AlertCircle, Settings, Key, Save, X } from 'lucide-react';
import type { TrendingVideo } from '../../api/youtube-trends';

interface YoutubeTrendsProps {
    globalApiKey: string;
}

const REGIONS = [
    { code: 'UA', name: '🌍 Україна' },
    { code: 'US', name: '🌎 Весь світ (США)' },
    { code: 'GB', name: '🇬🇧 Велика Британія' },
    { code: 'PL', name: '🇵🇱 Польща' },
    { code: 'DE', name: '🇩🇪 Німеччина' }
];

const CATEGORIES = [
    { id: '0', name: '🔥 Всі категорії' },
    { id: '20', name: '🎮 Ігри' },
    { id: '10', name: '🎵 Музика' },
    { id: '24', name: '🎬 Розваги' },
    { id: '28', name: '💻 Технології' },
    { id: '22', name: '🗣️ Люди та Блоги' },
    { id: '17', name: '⚽ Спорт' }
];

export const YoutubeTrends: React.FC<YoutubeTrendsProps> = ({ globalApiKey }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trends, setTrends] = useState<TrendingVideo[] | null>(null);

    // Custom API Key Logic
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [customApiKey, setCustomApiKey] = useState('');

    useEffect(() => {
        const storedKey = localStorage.getItem('youtube_api_key');
        if (storedKey) setCustomApiKey(storedKey);
    }, []);

    const handleSaveApiKey = () => {
        if (customApiKey.trim()) {
            localStorage.setItem('youtube_api_key', customApiKey.trim());
        } else {
            localStorage.removeItem('youtube_api_key');
        }
        setIsApiModalOpen(false);
    };

    const [selectedRegion, setSelectedRegion] = useState('UA');
    const [selectedCategory, setSelectedCategory] = useState('0');

    const fetchTrends = async () => {
        setIsLoading(true);
        setError(null);
        setTrends(null);

        try {
            const activeKey = customApiKey || globalApiKey;
            const endpoint = `/api/youtube-trends?regionCode=${selectedRegion}&categoryId=${selectedCategory}${activeKey ? `&key=${activeKey}` : ''}`;
            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Помилка завантаження трендів');
            }

            if (!data.trends || data.trends.length === 0) {
                setError('В даному регіоні та категорії трендів не знайдено.');
            } else {
                setTrends(data.trends);
            }
        } catch (err: any) {
            setError(err.message || 'Сталася невідома помилка');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch on mount or filter change
    useEffect(() => {
        fetchTrends();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRegion, selectedCategory]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('uk-UA', {
            day: 'numeric',
            month: 'long'
        }).format(date);
    };

    const formatViews = (viewsStr: string) => {
        const views = parseInt(viewsStr, 10);
        if (isNaN(views)) return "0";
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
        if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
        return views.toString();
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 pb-24 relative">
            <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl">

                <div className="relative flex items-center justify-center mb-8">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white flex items-center justify-center">
                            <Flame className="w-5 h-5 mr-2 text-orange-400" /> Сканер Трендів
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Огляд найпопулярніших відео YouTube</p>
                    </div>
                    <button
                        onClick={() => setIsApiModalOpen(true)}
                        className="absolute right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                            <Globe className="w-3 h-3 mr-1" /> Регіон
                        </label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm appearance-none cursor-pointer"
                        >
                            {REGIONS.map(r => (
                                <option key={r.code} value={r.code}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                            <LayoutGrid className="w-3 h-3 mr-1" /> Категорія
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm appearance-none cursor-pointer"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-start space-x-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {isLoading && !trends && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Скануємо YouTube тренди...</p>
                </div>
            )}

            <AnimatePresence>
                {trends && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-bold text-white">Топ {trends.length} у трендах</h3>
                            {isLoading && <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {trends.map((video, index) => (
                                <motion.div
                                    key={video.id + index}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-slate-800/80 backdrop-blur-md border border-white/10 overflow-hidden rounded-3xl flex flex-col sm:flex-row group hover:border-orange-500/50 transition-colors"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0 overflow-hidden bg-black">
                                        <img
                                            src={video.thumbnailUrl}
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-black text-white border border-white/10 uppercase tracking-widest shadow-lg">
                                            #{index + 1}
                                        </div>
                                        <a
                                            href={`https://youtube.com/watch?v=${video.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <div className="bg-red-600 text-white p-3 rounded-full flex items-center">
                                                <ExternalLink className="w-5 h-5" />
                                            </div>
                                        </a>
                                    </div>

                                    {/* Content Info */}
                                    <div className="p-5 flex flex-col flex-1 min-w-0">
                                        <h4 className="font-bold text-white text-base leading-tight mb-2 line-clamp-2">
                                            {video.title}
                                        </h4>
                                        <div className="text-slate-400 text-sm font-medium mb-4 truncate">
                                            {video.channelTitle}
                                        </div>

                                        <div className="mt-auto flex items-center space-x-3">
                                            <div className="flex items-center text-xs font-semibold text-orange-100 bg-orange-500/20 border border-orange-500/30 px-2.5 py-1 rounded-xl">
                                                <Eye className="w-3.5 h-3.5 mr-1 text-orange-400" />
                                                {formatViews(video.viewCount)}
                                            </div>
                                            <div className="flex items-center text-xs text-slate-400">
                                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                                {formatDate(video.publishedAt)}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
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
                                    <Key className="w-5 h-5 mr-2 text-indigo-400" />
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
                                        value={customApiKey}
                                        onChange={(e) => setCustomApiKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                                    />
                                    <div className="flex justify-between items-start mt-2 space-x-2">
                                        <p className="text-xs text-slate-500 flex-1">
                                            Залиште пустим, щоб використовувати загальний ключ з адмін-панелі. Власний ключ дозволяє обходити ліміти системи.
                                        </p>
                                        <a
                                            href="https://developers.google.com/youtube/v3/getting-started"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] sm:text-xs font-bold text-white bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            Як отримати ключ?
                                        </a>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveApiKey}
                                    className="w-full flex items-center justify-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl transition-colors font-medium"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Зберегти налаштування</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

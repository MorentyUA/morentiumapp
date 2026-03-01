import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Diamond, Users, Calendar, ExternalLink, AlertCircle, SlidersHorizontal, Eye, Video, PlaySquare, Radio, Settings, Key, Save, X } from 'lucide-react';
import type { SuperSearchVideo } from '../../api/youtube-super-search';

interface YoutubeSuperSearchProps {
    globalApiKey: string;
}

export const YoutubeSuperSearch: React.FC<YoutubeSuperSearchProps> = ({ globalApiKey }) => {
    const [query, setQuery] = useState('');
    const [minSubs, setMinSubs] = useState<number>(0);
    const [maxSubs, setMaxSubs] = useState<number>(10000);
    const [format, setFormat] = useState<'all' | 'video' | 'shorts' | 'stream'>('all');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<SuperSearchVideo[] | null>(null);
    const [scannedTotal, setScannedTotal] = useState<number>(0);

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

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!query.trim()) {
            setError('Будь ласка, введіть ключове слово');
            return;
        }

        if (minSubs > maxSubs) {
            setError('Мінімальна кількість не може бути більшою за максимальну');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults(null);
        setScannedTotal(0);

        try {
            const activeKey = customApiKey || globalApiKey;
            const endpoint = `/api/youtube-super-search?query=${encodeURIComponent(query)}&minSubs=${minSubs}&maxSubs=${maxSubs}&format=${format}${activeKey ? `&key=${activeKey}` : ''}`;
            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Помилка пошуку відео');
            }

            if (!data.results || data.results.length === 0) {
                setError(`Проскановано ${data.scannedTotal} найпопулярніших відео, але жоден канал не підпадає під фільтр від ${minSubs} до ${maxSubs} підписників.`);
            } else {
                setResults(data.results);
                setScannedTotal(data.scannedTotal);
            }
        } catch (err: any) {
            setError(err.message || 'Сталася невідома помилка');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('uk-UA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 pb-24 relative">
            <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl">
                <div className="relative flex items-center justify-center mb-8">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white flex items-center justify-center">
                            <Diamond className="w-5 h-5 mr-2 text-cyan-400" /> Пошук Діамантів
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Тренди від маленьких каналів (за 7 днів)</p>
                    </div>
                    <button
                        onClick={() => setIsApiModalOpen(true)}
                        className="absolute right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="🔍 Ключове слово (напр. 'Майнкрафт')"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                        />
                    </div>

                    {/* Format Selector */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setFormat('all')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors border ${format === 'all' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-700/50'}`}
                        >
                            Усі формати
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormat('video')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors border ${format === 'video' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-700/50'}`}
                        >
                            <Video className="w-3 h-3 mr-1.5" /> Довгі
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormat('shorts')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors border ${format === 'shorts' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-700/50'}`}
                        >
                            <PlaySquare className="w-3 h-3 mr-1.5" /> Shorts
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormat('stream')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors border ${format === 'stream' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-700/50'}`}
                        >
                            <Radio className="w-3 h-3 mr-1.5" /> Стріми
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/30 p-4 rounded-2xl border border-white/5">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <Users className="w-3 h-3 mr-1" /> Від (Підписників)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={minSubs}
                                onChange={(e) => setMinSubs(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                            />
                        </div>
                        <div className="flex items-center justify-center pt-5 hidden sm:flex">
                            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <Users className="w-3 h-3 mr-1" /> До (Підписників)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={maxSubs}
                                onChange={(e) => setMaxSubs(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold tracking-wide"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Шукаю діаманти...' : 'Шукати'}
                    </button>
                </form>

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

            <AnimatePresence>
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-2 text-sm">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <Diamond className="w-4 h-4 text-cyan-400 mr-2" />
                                Знайдено: {results.length}
                            </h3>
                            <span className="text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                Проаналізовано {scannedTotal} свіжих відео
                            </span>
                        </div>

                        <div className="grid gap-4">
                            {results.map((video, index) => (
                                <motion.div
                                    key={video.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-slate-800/80 backdrop-blur-md border border-cyan-500/20 p-4 rounded-3xl flex flex-col sm:flex-row gap-4 group hover:border-cyan-400 transition-colors relative overflow-hidden"
                                >
                                    {/* Thumbnail Wrap */}
                                    <div className="relative w-full sm:w-40 h-40 sm:h-28 rounded-2xl overflow-hidden shrink-0">
                                        <img
                                            src={video.thumbnailUrl}
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-black text-cyan-400 border border-cyan-500/30 tracking-wider">
                                            #{index + 1}
                                        </div>
                                    </div>

                                    {/* Video Meta */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-bold text-white text-sm line-clamp-2 leading-snug mb-1 group-hover:text-cyan-300 transition-colors">
                                                {video.title}
                                            </h4>
                                            <p className="text-slate-400 text-xs font-medium truncate mb-2">
                                                {video.channelTitle}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <div className="flex items-center text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                                                <Users className="w-3 h-3 mr-1" />
                                                {formatNumber(video.subscriberCount)} підписників
                                            </div>
                                            <div className="flex items-center text-[11px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg">
                                                <Eye className="w-3 h-3 mr-1" />
                                                {formatNumber(video.viewCount || 0)}
                                            </div>
                                            <div className="flex items-center text-[10px] text-slate-400 bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {formatDate(video.publishedAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Link */}
                                    <a
                                        href={`https://youtube.com/watch?v=${video.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2 w-full sm:w-auto bg-slate-700/50 hover:bg-cyan-600 text-white p-3 rounded-xl transition-colors flex items-center justify-center border border-white/5"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
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

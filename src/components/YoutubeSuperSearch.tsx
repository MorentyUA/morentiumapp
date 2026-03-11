import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Diamond, Users, Calendar, ExternalLink, AlertCircle, SlidersHorizontal, Eye, Video, PlaySquare, Radio, X } from 'lucide-react';
import type { SuperSearchVideo } from '../../api/_youtube/youtube-super-search';

interface YoutubeSuperSearchProps {
    globalApiKey: string;
}

export const YoutubeSuperSearch: React.FC<YoutubeSuperSearchProps> = () => {
    const [query, setQuery] = useState('');
    const [minSubs, setMinSubs] = useState<number | ''>(0);
    const [maxSubs, setMaxSubs] = useState<number | ''>(10000);
    const [minViews, setMinViews] = useState<number | ''>(0);
    const [maxViews, setMaxViews] = useState<number | ''>(1000000000);
    const [region, setRegion] = useState<string>('');
    const [format, setFormat] = useState<'all' | 'video' | 'shorts' | 'stream'>('all');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<SuperSearchVideo[] | null>(null);
    const [scannedTotal, setScannedTotal] = useState<number>(0);



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
            const endpoint = `/api/youtube?endpoint=super-search&query=${encodeURIComponent(query)}&minSubs=${minSubs || 0}&maxSubs=${maxSubs || 0}&minViews=${minViews || 0}&maxViews=${maxViews || 0}&region=${region}&format=${format}`;
            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Помилка пошуку відео');
            }

            if (!data.results || data.results.length === 0) {
                setError(`Проскановано ${data.scannedTotal} найпопулярніших відео, але жоден канал не підпадає під фільтр від ${minSubs || 0} до ${maxSubs || 0} підписників.`);
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

                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ключове слово..."
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-4 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-xs sm:text-sm"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-full text-slate-400 hover:text-white transition-colors z-10"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
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
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    value={minSubs === '' ? '' : minSubs}
                                    onChange={(e) => setMinSubs(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                                />
                                {minSubs !== '' && (
                                    <button
                                        type="button"
                                        onClick={() => setMinSubs('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-center pt-5 hidden sm:flex">
                            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <Users className="w-3 h-3 mr-1" /> До (Підписників)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    value={maxSubs === '' ? '' : maxSubs}
                                    onChange={(e) => setMaxSubs(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                                />
                                {maxSubs !== '' && (
                                    <button
                                        type="button"
                                        onClick={() => setMaxSubs('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/30 p-4 rounded-2xl border border-white/5">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <Eye className="w-3 h-3 mr-1" /> Від (Переглядів)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    value={minViews === '' ? '' : minViews}
                                    onChange={(e) => setMinViews(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                                />
                                {minViews !== '' && (
                                    <button
                                        type="button"
                                        onClick={() => setMinViews('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-center pt-5 hidden sm:flex">
                            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <Eye className="w-3 h-3 mr-1" /> До (Переглядів)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    value={maxViews === '' ? '' : maxViews}
                                    onChange={(e) => setMaxViews(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                                />
                                {maxViews !== '' && (
                                    <button
                                        type="button"
                                        onClick={() => setMaxViews('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                            Географія (Регіон)
                        </label>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm appearance-none"
                        >
                            <option value="">🌍 Весь світ (Без фільтру)</option>
                            <option value="UA">🇺🇦 Україна</option>
                            <option value="US">🇺🇸 США</option>
                            <option value="GB">🇬🇧 Велика Британія</option>
                            <option value="PL">🇵🇱 Польща</option>
                            <option value="DE">🇩🇪 Німеччина</option>
                            <option value="KZ">🇰🇿 Казахстан</option>
                            <option value="IN">🇮🇳 Індія</option>
                        </select>
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


        </div>
    );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, DollarSign, ExternalLink, AlertCircle, Link as LinkIcon, Info, Settings, Save, Key, X, TrendingUp, Presentation } from 'lucide-react';

export const YoutubeRevenue: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        channelId: string;
        title: string;
        thumbnail: string;
        stats: {
            totalViews: number;
            subCount: number;
            videoCount: number;
            estimatedMonthlyViews: number;
        };
        revenue: {
            monthly: { min: number; max: number };
            yearly: { min: number; max: number };
        };
        config: any;
    } | null>(null);

    // API Key State
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [customApiKey, setCustomApiKey] = useState('');

    React.useEffect(() => {
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

    const handleCheck = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!url.trim()) {
            setError('Будь ласка, введіть посилання на YouTube канал або ID');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const apiKeyParam = customApiKey ? `&key=${customApiKey}` : '';
            const endpoint = `/api/youtube-revenue?channel=${encodeURIComponent(url.trim())}${apiKeyParam}`;
            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Помилка при перевірці');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Сталася невідома помилка');
        } finally {
            setIsLoading(false);
        }
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
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
                            <DollarSign className="w-5 h-5 mr-2 text-emerald-400" /> Калькулятор Доходів
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Оцінка можливого заробітку каналу</p>
                    </div>
                    <button
                        onClick={() => setIsApiModalOpen(true)}
                        className="absolute right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleCheck} className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="🔗 https://youtube.com/@MrBeast"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 pl-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                        />
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold tracking-wide"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Аналізую перегляди...' : 'Розрахувати'}
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
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-800/80 backdrop-blur-md border border-emerald-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden"
                    >
                        {/* Status Background Glow */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] pointer-events-none bg-emerald-500/20"></div>

                        <div className="relative z-10">
                            <div className="flex items-center space-x-4 mb-6">
                                {result.thumbnail && (
                                    <img src={result.thumbnail} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-slate-700" />
                                )}
                                <div>
                                    <h3 className="text-xl font-black text-white leading-tight">
                                        {result.title}
                                    </h3>
                                    <a
                                        href={`https://youtube.com/channel/${result.channelId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors mt-1"
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" /> Відкрити канал
                                    </a>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-slate-900/50 rounded-2xl p-3 border border-white/5 text-center">
                                    <div className="text-xs text-slate-500 mb-1">Підписники</div>
                                    <div className="font-bold text-slate-200">{formatNumber(result.stats.subCount)}</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-2xl p-3 border border-white/5 text-center">
                                    <div className="text-xs text-slate-500 mb-1">Відео</div>
                                    <div className="font-bold text-slate-200">{formatNumber(result.stats.videoCount)}</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-2xl p-3 border border-white/5 text-center">
                                    <div className="text-xs text-emerald-500/70 mb-1 flex items-center justify-center">
                                        <TrendingUp className="w-3 h-3 mr-1" /> Перегляди/міс
                                    </div>
                                    <div className="font-bold text-emerald-400">{formatNumber(result.stats.estimatedMonthlyViews)}</div>
                                </div>
                            </div>

                            {/* Revenue Cards */}
                            <div className="space-y-3">
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
                                            <DollarSign className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400 font-medium">Дохід за місяць</div>
                                            <div className="text-emerald-50 text-xs opacity-70 mt-0.5">Орієнтовно</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-emerald-400 tracking-tight">
                                            {formatMoney(result.revenue.monthly.min)} - {formatMoney(result.revenue.monthly.max)}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mr-4 border border-white/5">
                                            <Presentation className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400 font-medium">Дохід за рік</div>
                                            <div className="text-slate-500 text-xs mt-0.5">Орієнтовно</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-white tracking-tight">
                                            {formatMoney(result.revenue.yearly.min)} - {formatMoney(result.revenue.yearly.max)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start space-x-3 text-xs text-slate-400 leading-relaxed">
                                <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-400/70" />
                                <div>
                                    <p className="mb-2">
                                        <strong>Як це працює:</strong> Цей інструмент робить приблизну оцінку можливого доходу на основі глобальної відкритої статистики каналу.
                                    </p>
                                    <p className="opacity-80">
                                        Дані базуються на середніх показниках дохідності (RPM) та швидкості переглядів за останній час. Усі цифри є суто орієнтовними і можуть відрізнятися від реальних заробітків автора через безліч факторів (тема відео, країна глядачів, наявність сторонньої реклами).
                                    </p>
                                </div>
                            </div>
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
                            className="bg-slate-800 border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-md relative"
                        >
                            <button
                                onClick={() => setIsApiModalOpen(false)}
                                className="absolute right-4 top-4 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 p-1.5 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-3 bg-blue-500/20 rounded-xl">
                                    <Key className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Власний API Ключ</h3>
                                    <p className="text-sm text-slate-400">Налаштування доступу</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        YouTube Data API v3 Key
                                    </label>
                                    <input
                                        type="text"
                                        value={customApiKey}
                                        onChange={(e) => setCustomApiKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    />
                                    <p className="mt-2 text-xs text-slate-400">
                                        Зберігається лише у вашому браузері.
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setIsApiModalOpen(false)}
                                        className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
                                    >
                                        Скасувати
                                    </button>
                                    <button
                                        onClick={handleSaveApiKey}
                                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Зберегти
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

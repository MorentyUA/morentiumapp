import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Key, AlertCircle, Save, X, Activity, Award, TrendingUp, Users, Video, Settings } from 'lucide-react';

interface Anomaly {
    id: string;
    title: string;
    thumbnail: string;
    views: number;
    engagementRate: number;
}

interface AuditData {
    channel: {
        id: string;
        title: string;
        thumbnail: string;
        subs: number;
        totalUploads: number;
    };
    audit: {
        avgViews: number;
        avgEngagementRate: number;
        subViewRatio: number;
        grade: string;
        verdict: string;
        anomalies: Anomaly[];
    };
    recentVideos: any[];
}

interface Props {
    globalApiKey: string;
}

export const YoutubeChannelAudit: React.FC<Props> = ({ globalApiKey }) => {
    const [query, setQuery] = useState('');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('youtube_api_key') || '');
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<AuditData | null>(null);

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        setData(null);

        try {
            const activeKey = apiKey || globalApiKey;
            const url = `/api/youtube-channel-audit?input=${encodeURIComponent(query)}${activeKey ? `&apiKey=${activeKey}` : ''}`;
            const res = await fetch(url);
            const resData = await res.json();

            if (!res.ok) {
                throw new Error(resData.error || 'Помилка аудиту каналу');
            }

            setData(resData);

            // Auto scroll to results
            setTimeout(() => {
                document.getElementById('audit-results')?.scrollIntoView({ behavior: 'smooth' });
            }, 300);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveKey = () => {
        if (apiKey.trim()) {
            localStorage.setItem('youtube_api_key', apiKey.trim());
        } else {
            localStorage.removeItem('youtube_api_key');
        }
        setIsApiModalOpen(false);
    };

    const formatNumber = (num: number) => {
        if (isNaN(num)) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const getGradeColor = (grade: string) => {
        if (grade.includes('A')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        if (grade.includes('B')) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        if (grade.includes('C')) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl mx-auto space-y-6 pb-24 relative pt-4 sm:pt-6 px-4"
        >
            {/* Header & Input */}
            <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl">
                <div className="relative flex items-center justify-center mb-8">
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center mb-2 tracking-tight">
                            Аудит Каналу <Activity className="w-6 h-6 sm:w-8 sm:h-8 ml-2 sm:ml-3 text-orange-500" />
                        </h1>
                        <p className="text-sm text-slate-400 font-medium">Швидка оцінка "здоров'я" та залученості</p>
                    </div>

                    <button
                        onClick={() => setIsApiModalOpen(true)}
                        className="absolute right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleAudit} className="relative group max-w-2xl mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-orange-400 group-focus-within:text-orange-300 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Вставте посилання на канал, відео або @nickname..."
                        className="block w-full pl-12 pr-32 py-4 bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="absolute right-2 top-2 bottom-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center tracking-wider text-xs sm:text-sm"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Пошук'}
                    </button>
                </form>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-start text-red-400 text-sm">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </motion.div>
                )}
            </div>

            {/* Results Board */}
            <AnimatePresence>
                {data && (
                    <motion.div
                        id="audit-results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Channel Header */}
                        <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                            <img src={data.channel.thumbnail} alt={data.channel.title} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-slate-700 shadow-2xl relative z-10" />

                            <div className="flex-1 text-center sm:text-left relative z-10 w-full">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{data.channel.title}</h2>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-4">
                                    <span className="bg-slate-900/80 text-slate-300 px-3 py-1 rounded-lg text-sm font-medium flex items-center border border-white/5">
                                        <Users className="w-4 h-4 mr-2 text-indigo-400" /> {formatNumber(data.channel.subs)} підп.
                                    </span>
                                    <span className="bg-slate-900/80 text-slate-300 px-3 py-1 rounded-lg text-sm font-medium flex items-center border border-white/5">
                                        <Video className="w-4 h-4 mr-2 text-rose-400" /> {formatNumber(data.channel.totalUploads)} відео
                                    </span>
                                </div>
                                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-2xl">
                                    <p className="text-slate-200 text-sm leading-relaxed"><span className="font-bold text-slate-400">Висновок ШІ:</span> {data.audit.verdict}</p>
                                </div>
                            </div>

                            {/* Huge Grade Badge */}
                            <div className={`flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex flex-col items-center justify-center border-2 shadow-xl ${getGradeColor(data.audit.grade)} rotate-3`}>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Оцінка</span>
                                <span className="text-4xl sm:text-5xl font-black drop-shadow-md">{data.audit.grade}</span>
                            </div>
                        </div>

                        {/* Core Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mb-4">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <span className="text-3xl font-black text-white mb-1">{formatNumber(data.audit.avgViews)}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Сер. перегляди (15 відео)</span>
                            </div>

                            <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl flex items-center justify-center mb-4">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <span className="text-3xl font-black text-white mb-1">{data.audit.avgEngagementRate}%</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Сер. залученість (Лайки+Коменти)</span>
                            </div>

                            <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-4">
                                    <Users className="w-6 h-6" />
                                </div>
                                <span className="text-3xl font-black text-white mb-1">{data.audit.subViewRatio}%</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Співвідношення Пер/Підп</span>
                            </div>
                        </div>

                        {/* Anomalies (Viral Videos) */}
                        {data.audit.anomalies.length > 0 && (
                            <div className="bg-slate-800/80 flex flex-col backdrop-blur-md border border-orange-500/30 p-6 rounded-3xl shadow-xl relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                                <h3 className="text-xl font-bold text-white flex items-center mb-6">
                                    <Award className="w-6 h-6 mr-2 text-orange-400" />
                                    Аномалії / Вибухові Відео
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data.audit.anomalies.map((video, idx) => (
                                        <div key={idx} className="bg-slate-900/80 border border-orange-500/20 rounded-2xl overflow-hidden shadow-lg group">
                                            <div className="relative aspect-video">
                                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded border border-orange-400/50 shadow-lg flex items-center">
                                                    🔥 ХІТ
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h4 className="font-bold text-sm text-white line-clamp-2 mb-2" title={video.title}>{video.title}</h4>
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span className="text-orange-400">{formatNumber(video.views)} пер.</span>
                                                    <span className="text-slate-400">ER: {video.engagementRate.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>

            {/* API Key Modal Component */}
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
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
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
                                    onClick={handleSaveKey}
                                    className="w-full flex items-center justify-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl transition-colors font-medium mt-4"
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

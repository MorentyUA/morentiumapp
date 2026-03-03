import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Key, Tag, Copy, AlertCircle, Save, X, Hash, TrendingUp, Eye, Settings } from 'lucide-react';

interface TagData {
    tag: string;
    count: number;
}

interface TitleData {
    title: string;
    views: number;
    channel: string;
}

interface GeneratorData {
    tags: TagData[];
    topTitles: TitleData[];
}

interface Props {
    globalApiKey: string;
}

export const YoutubeTagsGenerator: React.FC<Props> = ({ globalApiKey }) => {
    const [query, setQuery] = useState('');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('youtube_api_key') || '');
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<GeneratorData | null>(null);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        setData(null);

        try {
            const activeKey = apiKey || globalApiKey;
            const url = `/api/youtube-tags?query=${encodeURIComponent(query)}${activeKey ? `&apiKey=${activeKey}` : ''}`;
            const res = await fetch(url);
            const resData = await res.json();

            if (!res.ok) {
                throw new Error(resData.error || 'Не вдалося завантажити теги');
            }

            setData(resData);
        } catch (err: any) {
            setError(err.message || 'Сталася невідома помилка');
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

    const handleCopyAll = () => {
        if (!data?.tags.length) return;
        const allTagsStr = data.tags.map(t => t.tag).join(', ');
        navigator.clipboard.writeText(allTagsStr);
        setCopiedStates(prev => ({ ...prev, 'all': true }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, 'all': false })), 2000);
    };

    const handleCopySingle = (tag: string) => {
        navigator.clipboard.writeText(tag);
        setCopiedStates(prev => ({ ...prev, [tag]: true }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [tag]: false })), 2000);
    };

    const formatNumber = (num: number) => {
        if (isNaN(num)) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
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
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center mb-2 tracking-tight">
                            Генератор Тегів <Hash className="w-6 h-6 sm:w-8 sm:h-8 ml-2 sm:ml-3 text-red-500" />
                        </h1>
                        <p className="text-sm text-slate-400 font-medium">Аналіз конкурентів та підбір SEO-тегів</p>
                    </div>

                    <button
                        onClick={() => setIsApiModalOpen(true)}
                        className="absolute right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-red-400 group-focus-within:text-red-300 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="youtube.com/watch..."
                        className="block w-full pl-12 pr-32 py-4 bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-xs sm:text-sm shadow-inner"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-[7rem] top-1/2 -translate-y-1/2 p-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-full text-slate-400 hover:text-white transition-colors z-10"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="absolute right-2 top-2 bottom-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center uppercase tracking-wider text-xs sm:text-sm"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Генерувати'}
                    </button>
                </form>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-start text-red-400 text-sm">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {data && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Tags Section */}
                        <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-5 rounded-3xl shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <Tag className="w-5 h-5 mr-2 text-red-400" />
                                    Топ Теги Конкурентів ({data.tags.length})
                                </h3>
                                <button
                                    onClick={handleCopyAll}
                                    className="flex items-center text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                                >
                                    {copiedStates['all'] ? (
                                        <span className="text-emerald-400 flex items-center"><Copy className="w-3 h-3 mr-1" /> Скопійовано!</span>
                                    ) : (
                                        <span className="flex items-center"><Copy className="w-3 h-3 mr-1 text-red-400" /> Копіювати Всі</span>
                                    )}
                                </button>
                            </div>

                            {data.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {data.tags.map((tagObj, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleCopySingle(tagObj.tag)}
                                            className="group relative flex items-center bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-1.5 cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-colors overflow-hidden"
                                        >
                                            <span className="text-sm text-slate-200 mr-2">{tagObj.tag}</span>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-md self-center">
                                                {tagObj.count}
                                            </span>

                                            {/* Hover Copy Overlay */}
                                            <div className="absolute inset-0 bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Copy className="w-4 h-4 text-white" />
                                            </div>

                                            {/* Copied state */}
                                            <AnimatePresence>
                                                {copiedStates[tagObj.tag] && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="absolute inset-0 bg-emerald-500 flex items-center justify-center"
                                                    >
                                                        <span className="text-xs font-bold text-white">Скопійовано!</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
                                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>Теги не знайдено для цього запиту.</p>
                                </div>
                            )}
                        </div>

                        {/* Top Titles Section */}
                        <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-5 rounded-3xl shadow-xl">
                            <h3 className="text-lg font-bold text-white flex items-center mb-4">
                                <TrendingUp className="w-5 h-5 mr-2 text-red-400" />
                                Найкращі Назви
                            </h3>
                            <div className="space-y-3">
                                {data.topTitles.map((item, idx) => (
                                    <div key={idx} className="bg-slate-900/80 border border-white/5 p-3 rounded-2xl flex flex-col gap-1">
                                        <p className="text-sm font-bold text-white line-clamp-2">{item.title}</p>
                                        <div className="flex items-center text-[10px] text-slate-400 gap-3 uppercase font-bold tracking-wider">
                                            <span>{item.channel}</span>
                                            <span className="flex items-center text-red-400/80">
                                                <Eye className="w-3 h-3 mr-1" />
                                                {formatNumber(item.views)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

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

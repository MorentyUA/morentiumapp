import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Loader2, ThumbsUp, Calendar, ExternalLink, AlertCircle, Settings, Key, Save, X } from 'lucide-react';
import type { YoutubeComment } from '../../api/youtube-comments';

interface YoutubeCommentsProps {
    globalApiKey: string;
}

export const YoutubeComments: React.FC<YoutubeCommentsProps> = ({ globalApiKey }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<YoutubeComment[] | null>(null);
    const [videoId, setVideoId] = useState<string | null>(null);

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

        if (!url.trim()) {
            setError('Будь ласка, введіть посилання на відео');
            return;
        }

        setIsLoading(true);
        setError(null);
        setComments(null);
        setVideoId(null);

        try {
            const activeKey = customApiKey || globalApiKey;
            const endpoint = `/api/youtube-comments?q=${encodeURIComponent(url)}${activeKey ? `&key=${activeKey}` : ''}`;
            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Помилка аналізу коментарів');
            }

            if (!data.comments || data.comments.length === 0) {
                setError('Коментарів не знайдено (або вони вимкнені).');
            } else {
                setVideoId(data.videoId);
                setComments(data.comments);
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

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 pb-24 relative">
            <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl">

                <div className="relative flex items-center justify-center mb-8">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-indigo-400" /> Радар Ідей
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Парсинг популярних коментарів</p>
                    </div>
                    <button
                        onClick={() => setIsApiModalOpen(true)}
                        className="absolute right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSearch} className="flex space-x-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="🔗 Посилання на відео..."
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[54px]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
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
                {comments && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-bold text-white">Топ {comments.length} коментарів</h3>
                            {videoId && (
                                <a
                                    href={`https://youtube.com/watch?v=${videoId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <span>Відкрити відео</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>

                        <div className="grid gap-4">
                            {comments.map((comment, index) => (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-5 rounded-3xl flex space-x-4"
                                >
                                    <img
                                        src={comment.authorImage}
                                        alt={comment.authorName}
                                        className="w-10 h-10 rounded-full bg-slate-700 shrink-0 border border-white/5"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-white text-sm truncate pr-2">
                                                {comment.authorName}
                                            </span>
                                            <div className="flex items-center space-x-3 shrink-0">
                                                <div className="flex items-center text-xs text-slate-400">
                                                    <Calendar className="w-3 h-3 mr-1 opacity-70" />
                                                    {formatDate(comment.publishedAt)}
                                                </div>
                                                <div className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                                    <ThumbsUp className="w-3 h-3 mr-1" />
                                                    {comment.likeCount > 0 ? comment.likeCount.toLocaleString('uk-UA') : '0'}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Injecting raw HTML because YouTube API returns formatted comments (bold/links) */}
                                        <div
                                            className="text-slate-300 text-sm leading-relaxed prose prose-invert prose-p:my-1 prose-a:text-indigo-400 max-w-none break-words"
                                            dangerouslySetInnerHTML={{ __html: comment.textDisplay }}
                                        />
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

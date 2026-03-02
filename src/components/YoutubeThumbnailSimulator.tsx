import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Key, Image as ImageIcon, Upload, X, Save, AlertCircle, LayoutGrid, Monitor, Smartphone, CheckCircle, Settings } from 'lucide-react';

interface MockVideo {
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    publishedAt: string;
    isMock?: boolean;
}

interface Props {
    globalApiKey: string;
}

export const YoutubeThumbnailSimulator: React.FC<Props> = ({ globalApiKey }) => {
    // Inputs
    const [nicheQuery, setNicheQuery] = useState('');
    const [customTitle, setCustomTitle] = useState('');
    const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // API & State
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('youtube_api_key') || '');
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [videos, setVideos] = useState<MockVideo[]>([]);

    // View state
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCustomThumbnail(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSimulate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nicheQuery.trim() || !customThumbnail || !customTitle.trim()) {
            setError('Заповніть всі поля та завантажте прев\'ю!');
            return;
        }

        setIsLoading(true);
        setError('');
        setVideos([]);

        try {
            const activeKey = apiKey || globalApiKey;
            const url = `/api/youtube-thumbnails?query=${encodeURIComponent(nicheQuery)}${activeKey ? `&apiKey=${activeKey}` : ''}&maxResults=7`;
            const res = await fetch(url);
            const resData = await res.json();

            if (!res.ok) {
                throw new Error(resData.error || 'Failed to fetch competitors');
            }

            const realVideos: MockVideo[] = resData.videos.map((v: any) => ({ ...v, isMock: false }));

            // Insert mock video at a random position (usually top 3)
            const mockVideo: MockVideo = {
                id: 'mock-123',
                title: customTitle,
                channelTitle: 'Ваш Канал',
                thumbnail: customThumbnail,
                publishedAt: new Date().toISOString(),
                isMock: true
            };

            const insertIndex = Math.floor(Math.random() * 3); // 0, 1, or 2
            const combinedVideos = [...realVideos];
            combinedVideos.splice(insertIndex, 0, mockVideo);

            setVideos(combinedVideos);

            // Auto scroll to results
            setTimeout(() => {
                document.getElementById('simulator-results')?.scrollIntoView({ behavior: 'smooth' });
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

    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return '1 тиж. тому';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Сьогодні';
        if (diffDays === 1) return 'Вчора';
        if (diffDays < 7) return `${diffDays} дн. тому`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} тиж. тому`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} міс. тому`;
        return `${Math.floor(diffDays / 365)} р. тому`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl mx-auto space-y-6 pb-24 relative pt-4 sm:pt-6 px-4"
        >
            {/* Control Panel */}
            <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl">
                <div className="relative flex items-center justify-center mb-6">
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center mb-2 tracking-tight">
                            Симулятор Прев'ю <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 ml-2 sm:ml-3 text-blue-500" />
                        </h1>
                        <p className="text-sm text-slate-400 font-medium">A/B тест клікабельності в реальному оточенні</p>
                    </div>

                    <button
                        onClick={() => setIsApiModalOpen(true)}
                        className="absolute right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSimulate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Thumbnail Upload */}
                        <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 hover:border-blue-500/50 transition-colors rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group min-h-[160px]">
                            {customThumbnail ? (
                                <>
                                    <img src={customThumbnail} alt="Custom Preview" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all backdrop-blur-sm">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-md transition-colors">
                                            <Upload className="w-6 h-6" />
                                        </button>
                                        <button type="button" onClick={() => setCustomThumbnail(null)} className="p-3 bg-red-500/80 hover:bg-red-500 rounded-xl text-white backdrop-blur-md transition-colors">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 text-center cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-300 block">Завантажити Прев'ю</span>
                                    <span className="text-xs text-slate-500 mt-1 block">Рекомендовано 1280x720</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>

                        {/* Title & Query Inputs */}
                        <div className="space-y-4 flex flex-col justify-center">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Назва вашого відео</label>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    placeholder="Напишіть клікбейтну назву..."
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Ніша (хто ваші конкуренти?)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={nicheQuery}
                                        onChange={(e) => setNicheQuery(e.target.value)}
                                        placeholder="Напр: 'react tutorial'"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-xl flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !customThumbnail || !customTitle.trim() || !nicheQuery.trim()}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <LayoutGrid className="w-5 h-5 mr-2" />}
                        Згенерувати Стрічку YouTube
                    </button>
                </form>
            </div>

            {/* Results Area */}
            <AnimatePresence>
                {videos.length > 0 && (
                    <motion.div
                        id="simulator-results"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-4"
                    >
                        {/* Simulation Controls */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-lg">
                            <div className="flex bg-slate-900/80 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('mobile')}
                                    className={`px-4 py-2 rounded-lg flex items-center text-sm font-bold transition-colors ${viewMode === 'mobile' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Smartphone className="w-4 h-4 mr-2" /> Мобільний
                                </button>
                                <button
                                    onClick={() => setViewMode('desktop')}
                                    className={`px-4 py-2 rounded-lg flex items-center text-sm font-bold transition-colors ${viewMode === 'desktop' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Monitor className="w-4 h-4 mr-2" /> ПК
                                </button>
                            </div>

                            <div className="flex bg-slate-900/80 p-1 rounded-xl">
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${theme === 'dark' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Dark
                                </button>
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${theme === 'light' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Light
                                </button>
                            </div>
                        </div>

                        {/* YouTube Mock Environment */}
                        <div className={`rounded-3xl overflow-hidden shadow-2xl transition-colors duration-500 border border-white/5 ${theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-[#ffffff]'}`}>

                            {/* Mock YouTube Header */}
                            <div className={`p-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
                                <div className="flex items-center gap-1">
                                    <div className={`w-8 h-6 bg-red-600 rounded-lg flex items-center justify-center`}>
                                        <div className="w-2 h-2 bg-white rounded-sm" />
                                    </div>
                                    <span className={`font-bold tracking-tighter text-xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}>YouTube</span>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full border text-xs font-medium ${theme === 'dark' ? 'bg-[#222222] border-[#303030] text-white' : 'bg-gray-100 border-gray-300 text-black'}`}>
                                    {nicheQuery}
                                </div>
                                <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'} text-white flex items-center justify-center font-bold text-xs`}>
                                    ТЫ
                                </div>
                            </div>

                            {/* Feed Grid */}
                            <div className={`p-4 grid gap-y-6 gap-x-4 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                                {videos.map((video, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 group">
                                        {/* Thumbnail Container */}
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800">
                                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />

                                            {/* Mock Badging */}
                                            {video.isMock && (
                                                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded border border-green-400/50 shadow-lg flex items-center">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> ВАШЕ
                                                </div>
                                            )}

                                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                                                {video.isMock ? '10:00' : `${Math.floor(Math.random() * 15) + 1}:${Math.floor(Math.random() * 50) + 10}`}
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex gap-3 pr-4">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex flex-col items-start overflow-hidden">
                                                <h3 className={`font-semibold text-sm leading-tight line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-[#0f0f0f]'}`}>
                                                    {video.title}
                                                </h3>
                                                <span className={`text-[12px] mt-1 line-clamp-1 ${theme === 'dark' ? 'text-[#aaaaaa]' : 'text-[#606060]'}`}>
                                                    {video.channelTitle}
                                                </span>
                                                <span className={`text-[12px] ${theme === 'dark' ? 'text-[#aaaaaa]' : 'text-[#606060]'}`}>
                                                    {video.isMock ? '0 переглядів' : `${Math.floor(Math.random() * 900) + 10} тис. переглядів`} • {formatTimeAgo(video.publishedAt)}
                                                </span>
                                            </div>
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

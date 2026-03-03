import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { useProgress } from '../hooks/useProgress';
import { useStreak } from '../hooks/useStreak';
import { ShieldCheck, User as UserIcon, Award, Star, BookOpen, Target, Flame, Play } from 'lucide-react';
import { useGame } from '../hooks/useGame';
import { motion } from 'framer-motion';
import type { Item } from '../types';

interface ProfileProps {
    isPublicSubscribed: boolean | null;
    isPrivateSubscribed: boolean;
    isAdmin: boolean;
    items: Item[];
}

export const Profile: React.FC<ProfileProps> = ({ isPrivateSubscribed, isAdmin, items }) => {
    const { user, tg } = useTelegram();
    const { completedItemIds } = useProgress();
    const { streak } = useStreak();
    const { score, currentLevel } = useGame();

    // Event listener for real-time game updates while Profile is open
    const [, forceRender] = useState({});
    useEffect(() => {
        const handleGameUpdate = () => forceRender({});
        window.addEventListener('game_state_updated', handleGameUpdate);
        return () => window.removeEventListener('game_state_updated', handleGameUpdate);
    }, []);

    // Progress Bar Math
    const totalItems = items.length;
    const completedCount = completedItemIds.length;
    // Cap at 100% just in case of localStorage anomalies
    const progressPercentage = totalItems > 0 ? Math.min(100, Math.round((completedCount / totalItems) * 100)) : 0;

    const getLearningStatus = (pct: number): { rank: string, color: string } => {
        if (pct === 100) return { rank: "👑 Гуру YouTube", color: "text-yellow-400" };
        if (pct >= 81) return { rank: "🔥 Експерт", color: "text-orange-400" };
        if (pct >= 51) return { rank: "🎓 Знавець", color: "text-purple-400" };
        if (pct >= 21) return { rank: "📖 Студент", color: "text-blue-400" };
        return { rank: "🚀 Новачок", color: "text-slate-400" };
    };

    const status = getLearningStatus(progressPercentage);

    const renderBadge = () => {
        if (isAdmin) {
            return (
                <div className="inline-flex items-center px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-500/10">
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Адміністратор
                </div>
            );
        }
        if (isPrivateSubscribed) {
            return (
                <div className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-yellow-950 rounded-full border-2 border-yellow-200/50 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse-slow">
                    <Star className="w-4 h-4 mr-1 fill-yellow-900" />
                    VIP КОРИСТУВАЧ
                </div>
            );
        }
        return (
            <div className="inline-flex items-center px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full border border-slate-600/50 text-xs font-bold uppercase tracking-wider">
                <UserIcon className="w-4 h-4 mr-1" />
                Стандарт
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 mb-24 min-h-screen space-y-8"
        >
            {/* Header / Avatar Section */}
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-xl shadow-blue-500/20">
                        {user?.photo_url ? (
                            <img src={user.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-[#0f172a]" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-[#1e293b] flex items-center justify-center border-2 border-[#0f172a]">
                                <UserIcon className="w-10 h-10 text-slate-400" />
                            </div>
                        )}
                    </div>
                    {/* Floating VIP Badge (Bottom Right) */}
                    <div className="absolute -bottom-2 -right-2">
                        {isPrivateSubscribed ? (
                            <div className="bg-yellow-400 p-1.5 rounded-full shadow-lg border-2 border-[#0f172a]">
                                <Award className="w-5 h-5 text-yellow-900" />
                            </div>
                        ) : (
                            <div className="bg-slate-600 p-1.5 rounded-full shadow-lg border-2 border-[#0f172a]">
                                <Award className="w-5 h-5 text-slate-300" />
                            </div>
                        )}
                    </div>
                    {/* Floating Streak Badge (Top Right) */}
                    {streak > 0 && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full shadow-lg border-2 border-[#0f172a] px-2 py-0.5 flex items-center gap-1 z-20">
                            <Flame className="w-3 h-3 fill-orange-200" />
                            <span className="text-xs font-black">{streak}</span>
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">
                    {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-blue-400 text-sm mb-4 font-medium">
                    @{user?.username || 'користувач'}
                </p>

                {renderBadge()}
            </div>

            {/* Creator Academy Progress Bar */}
            <div className="glass-card p-6 border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-500/20 rounded-xl">
                                <Target className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-white">Академія Креатора</h3>
                                <p className="text-sm text-slate-400 font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
                                    Статус: <span className={`font-bold ${status.color}`}>{status.rank}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                {progressPercentage}%
                            </p>
                        </div>
                    </div>

                    <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 1.5, type: 'spring', bounce: 0.2 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full relative"
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </motion.div>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-xs text-slate-400 font-medium">
                        <span className="flex items-center"><BookOpen className="w-3 h-3 mr-1" /> База знань</span>
                        <span>Пройдено {completedCount} з {totalItems} матеріалів</span>
                    </div>

                    {progressPercentage === 100 && totalItems > 0 && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="mt-5 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-center text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/50"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-2xl mb-1">👑</span>
                                <h4 className="font-black tracking-wider uppercase">Майстерність Досягнуто</h4>
                                <p className="text-xs text-emerald-100 font-medium mt-1">Ви вивчили абсолютно всі матеріали!</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Tap-to-Earn Game Stats */}
            <div className="glass-card p-6 border border-purple-500/20 bg-purple-500/5 relative overflow-hidden group">
                {/* Visual Flair */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 pr-2">
                        <div className={`p-3 rounded-2xl shadow-inner bg-opacity-20 shrink-0 ${currentLevel.icon.replace('text-', 'bg-')}`}>
                            <Play className={`w-6 h-6 sm:w-8 sm:h-8 fill-current drop-shadow-md ${currentLevel.icon}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-purple-400 font-bold uppercase tracking-widest mb-1 truncate">Клікер Ранг</p>
                            <h3 className={`font-black text-sm sm:text-lg leading-tight whitespace-normal break-words ${currentLevel.icon} drop-shadow-md`}>
                                {currentLevel.name}
                            </h3>
                        </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                        <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide mb-1 whitespace-nowrap">Кліки</p>
                        <p
                            className="font-black text-white whitespace-nowrap"
                            style={{
                                fontSize: score.toLocaleString('uk-UA').length > 13 ? '0.9rem' : score.toLocaleString('uk-UA').length > 9 ? '1.1rem' : score.toLocaleString('uk-UA').length > 7 ? '1.3rem' : '1.5rem',
                                lineHeight: '1.2',
                                letterSpacing: '0.05em'
                            }}
                        >
                            {score.toLocaleString('uk-UA')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Subscribe Box for standard users */}
            {!isPrivateSubscribed && !isAdmin && (
                <div className="glass-card p-6 border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Star className="w-24 h-24 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-yellow-500 mb-2">Станьте VIP учасником</h3>
                    <p className="text-sm text-slate-300 mb-6 max-w-sm relative z-10 leading-relaxed">
                        Отримайте доступ до закритого контенту, секретних YouTube інструментів та прямих розборів вашого каналу.
                    </p>
                    <button
                        onClick={() => tg.openTelegramLink(import.meta.env.VITE_INVITE_LINK || "https://t.me/morentube/183")}
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-yellow-950 font-black py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/25 active:scale-95 uppercase tracking-wider text-sm"
                    >
                        Отримати VIP Доступ
                    </button>
                </div>
            )}
        </motion.div>
    );
};

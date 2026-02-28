import React from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { useProgress } from '../hooks/useProgress';
import { useStreak } from '../hooks/useStreak';
import { ShieldCheck, User as UserIcon, Award, Star, BookOpen, Target, Flame } from 'lucide-react';
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

    // Progress Bar Math
    const totalItems = items.length;
    const completedCount = completedItemIds.length;
    // Cap at 100% just in case of localStorage anomalies
    const progressPercentage = totalItems > 0 ? Math.min(100, Math.round((completedCount / totalItems) * 100)) : 0;

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
                    {/* Floating Badge */}
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
                                <p className="text-sm text-emerald-400 font-medium tracking-wide">Ваш прогрес навчання</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                            {streak > 0 && (
                                <div className="flex flex-col items-center justify-center bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-lg">
                                    <div className="flex items-center gap-1">
                                        <Flame className="w-4 h-4 text-orange-500 fill-orange-500/50 animate-pulse-slow" />
                                        <span className="font-bold text-orange-400 text-sm">{streak}</span>
                                    </div>
                                    <span className="text-[8px] text-orange-500/70 font-bold uppercase tracking-widest mt-0.5">Днів підряд</span>
                                </div>
                            )}
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
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center text-sm text-emerald-300 font-bold"
                        >
                            🎉 Вітаємо! Ви вивчили весь доступний контент!
                        </motion.div>
                    )}
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

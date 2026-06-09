import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { useProgress } from '../hooks/useProgress';
import { useStreak } from '../hooks/useStreak';
import { ShieldCheck, User as UserIcon, Award, Star, BookOpen, Target, Flame, Play, Lock, Calendar, Clock, ExternalLink } from 'lucide-react';
import { useGame } from '../hooks/useGame';
import { formatScoreDisplay } from '../utils/format';
import { motion } from 'framer-motion';
import type { Item } from '../types';
import { Copy, CheckCircle2 } from 'lucide-react';

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

    const openPrivatLink = () => {
        try {
            tg.openLink('https://morenty.xyz/privat');
        } catch (e) {
            window.open('https://morenty.xyz/privat', '_blank');
        }
    };

    // PRIVATKA subscription state
    const [privateSub, setPrivateSub] = useState<any>(null);
    const [privateLoading, setPrivateLoading] = useState(true);

    // MOR VOICE Key Generation State
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);
    const [morVoiceKey, setMorVoiceKey] = useState<string | null>(null);
    const [keyError, setKeyError] = useState<string>('');
    const [isCopied, setIsCopied] = useState(false);

    // Event listener for real-time game updates while Profile is open
    const [, forceRender] = useState({});
    useEffect(() => {
        const handleGameUpdate = () => forceRender({});
        window.addEventListener('game_state_updated', handleGameUpdate);
        return () => window.removeEventListener('game_state_updated', handleGameUpdate);
    }, []);

    // Fetch PRIVATKA subscription data
    useEffect(() => {
        if (!user?.id) { setPrivateLoading(false); return; }
        fetch(`https://morenty.xyz/api/private/user/${user.id}`, {
            headers: { 'x-private-secret': 'morenty-private-secret-2024' }
        })
        .then(r => r.json())
        .then(data => { setPrivateSub(data); setPrivateLoading(false); })
        .catch(() => setPrivateLoading(false));
    }, [user?.id]);

    const generateMorVoiceKey = async () => {
        if (!user?.id) return;
        setIsGeneratingKey(true);
        setKeyError('');
        try {
            const res = await fetch('/api/generate_key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            const data = await res.json();
            if (data.key) {
                setMorVoiceKey(data.key);
            } else {
                setKeyError(data.error + (data.details ? `: ${data.details}` : ''));
            }
        } catch (e) {
            setKeyError('Помилка з\'єднання. Спробуйте пізніше.');
        } finally {
            setIsGeneratingKey(false);
        }
    };

    const copyKey = () => {
        if (morVoiceKey) {
            navigator.clipboard.writeText(morVoiceKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };



    // Progress Bar Math
    const totalItems = items.length;
    const validCompletedItemIds = completedItemIds.filter(id => items.some(item => item.id === id));
    const completedCount = validCompletedItemIds.length;
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

            {/* PRIVATKA Subscription Section */}
            {!privateLoading && (
                privateSub?.is_subscribed ? (
                    <div className="glass-card p-6 border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-amber-500/20 rounded-xl">
                                    <Lock className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-white">ПРИВАТКА</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span
                                            className="px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border"
                                            style={{
                                                color: privateSub.profile?.role_color || '#4ade80',
                                                borderColor: (privateSub.profile?.role_color || '#4ade80') + '40',
                                                backgroundColor: (privateSub.profile?.role_color || '#4ade80') + '15',
                                                boxShadow: `0 0 12px ${(privateSub.profile?.role_color || '#4ade80')}30`
                                            }}
                                        >
                                            {privateSub.profile?.emoji} {privateSub.profile?.role || 'Новачок'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Next role progress */}
                        {privateSub.profile?.next_role && (
                            <div className="mb-4 relative z-10">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>{privateSub.profile.emoji} {privateSub.profile.role}</span>
                                    <span>{privateSub.profile.next_role.name}</span>
                                </div>
                                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, ((privateSub.profile.total_months || 0) / privateSub.profile.next_role.monthsNeeded) * 100)}%` }}
                                        transition={{ duration: 1, type: 'spring' }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: privateSub.profile.role_color || '#4ade80' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                    <Calendar className="w-3 h-3" /> Оплачено до
                                </div>
                                <p className="text-white font-bold">
                                    {privateSub.subscription?.expires_at
                                        ? new Date(privateSub.subscription.expires_at).toLocaleDateString('uk-UA')
                                        : '—'}
                                </p>
                            </div>
                            <div className={`bg-black/30 rounded-xl p-3 border ${
                                (privateSub.subscription?.days_left || 0) <= 7
                                    ? 'border-red-500/30'
                                    : 'border-white/5'
                            }`}>
                                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                    <Clock className="w-3 h-3" /> Залишилось
                                </div>
                                <p className={`font-bold ${
                                    (privateSub.subscription?.days_left || 0) <= 7
                                        ? 'text-red-400'
                                        : (privateSub.subscription?.days_left || 0) <= 14
                                            ? 'text-amber-400'
                                            : 'text-emerald-400'
                                }`}>
                                    {privateSub.subscription?.days_left || 0} днів
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 relative z-10">
                            <button
                                onClick={() => {
                                    try { tg.openTelegramLink('https://t.me/+bogAUlE0j284MmEy'); } catch { window.open('https://t.me/+bogAUlE0j284MmEy'); }
                                }}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-yellow-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-sm flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" /> Увійти в чат
                            </button>
                            <button
                                onClick={openPrivatLink}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-amber-500/30 text-amber-400 font-bold py-3 rounded-xl transition-all active:scale-95 text-sm"
                            >
                                🔄 Продовжити
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card p-6 border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Lock className="w-24 h-24 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold text-purple-400 mb-2">🔐 MORENTY ПРИВАТКА</h3>
                        <p className="text-sm text-slate-300 mb-4 max-w-sm relative z-10 leading-relaxed">
                            Закрита група з ексклюзивним контентом, спілкуванням з однодумцями та раннім доступом до нових продуктів.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-5 text-xs text-slate-400 relative z-10">
                            <div className="flex items-center gap-1.5">🔒 Закрита група</div>
                            <div className="flex items-center gap-1.5">💬 Спілкування</div>
                            <div className="flex items-center gap-1.5">🎯 Ранній доступ</div>
                            <div className="flex items-center gap-1.5">⚡ Підтримка</div>
                        </div>
                        <button
                            onClick={openPrivatLink}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25 active:scale-95 uppercase tracking-wider text-sm relative z-10"
                        >
                            Оформити підписку
                        </button>
                    </div>
                )
            )}

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
                                fontSize: score >= 1000000000 ? '0.9rem' : score >= 10000000 ? '1.1rem' : score >= 1000000 ? '1.3rem' : '1.5rem',
                                lineHeight: '1.2',
                                letterSpacing: '0.05em'
                            }}
                        >
                            {formatScoreDisplay(score)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Subscribe Box for standard users */}
            {!isPrivateSubscribed && !isAdmin ? (
                <div className="glass-card p-6 border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Star className="w-24 h-24 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-yellow-500 mb-2">Станьте VIP учасником</h3>
                    <p className="text-sm text-slate-300 mb-6 max-w-sm relative z-10 leading-relaxed">
                        Отримайте доступ до закритого контенту, секретних YouTube інструментів, десктопного софту створення контенту MOR CRAFT та прямих розборів вашого каналу.
                    </p>
                    <button
                        onClick={openPrivatLink}
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-yellow-950 font-black py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/25 active:scale-95 uppercase tracking-wider text-sm"
                    >
                        Отримати VIP Доступ
                    </button>
                </div>
            ) : (
                /* MOR CRAFT Key Section for VIPs */
                <div className="glass-card p-6 border border-blue-500/30 bg-gradient-to-b from-blue-500/10 to-transparent relative overflow-hidden group mt-4">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck className="w-24 h-24 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Доступ до СОФТІВ!</h3>
                    <p className="text-sm text-slate-300 mb-6 relative z-10 leading-relaxed max-w-[90%]">
                        Згенеруйте унікальний ключ для доступу до десктопного софту створення та моніторингу контенту.
                        <br /><span className="text-xs text-slate-400">Цей ключ прив'яжеться до одного комп'ютера після активації.</span>
                    </p>

                    {morVoiceKey ? (
                        <div className="bg-[#0f172a] border border-blue-500/30 p-4 rounded-xl relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <code className="text-blue-300 font-mono text-lg tracking-wider font-bold select-all bg-blue-500/10 px-3 py-1.5 rounded-lg w-full sm:w-auto text-center">
                                {morVoiceKey}
                            </code>
                            <button
                                onClick={copyKey}
                                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${isCopied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
                            >
                                {isCopied ? <><CheckCircle2 className="w-4 h-4" /> Скопійовано!</> : <><Copy className="w-4 h-4" /> Копіювати</>}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={generateMorVoiceKey}
                            disabled={isGeneratingKey}
                            className="w-full relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95 uppercase tracking-wider text-sm disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {isGeneratingKey ? (
                                <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Генеруємо...</>
                            ) : 'Згенерувати ключ доступу'}
                        </button>
                    )}

                    {keyError && (
                        <p className="text-red-400 text-sm mt-3 relative z-10 bg-red-500/10 p-2 rounded border border-red-500/20 text-center">
                            {keyError}
                        </p>
                    )}
                </div>
            )}
        </motion.div>
    );
};

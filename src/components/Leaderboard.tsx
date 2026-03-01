import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Medal, Play } from 'lucide-react';
import type { LeaderboardEntry } from '../../api/game-sync';
import { useTelegram } from '../hooks/useTelegram';

interface LeaderboardProps {
    isOpen: boolean;
    onClose: () => void;
    currentScore: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose, currentScore }) => {
    const { user } = useTelegram();
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const fetchLeaders = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/leaderboard');
                if (res.ok) {
                    const data = await res.json();
                    setLeaders(data);
                }
            } catch (e) {
                console.error('Failed to fetch leaderboard:', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaders();
    }, [isOpen]);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Medal className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
            case 1: return <Medal className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.8)]" />;
            case 2: return <Medal className="w-5 h-5 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]" />;
            default: return <span className="font-bold text-slate-500 w-5 text-center">{index + 1}</span>;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 pb-24 sm:pb-4 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+6rem)]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-[#1e293b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between relative shrink-0">
                            <div className="flex items-center">
                                <Trophy className="w-6 h-6 text-yellow-500 mr-3" />
                                <h2 className="text-xl font-black text-white tracking-wide">ТОП 10 Клікерів</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3">
                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : leaders.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    Ще немає записів. Станьте першим!
                                </div>
                            ) : (
                                leaders.map((leader, index) => {
                                    const isMe = leader.userId == user?.id;

                                    return (
                                        <div
                                            key={`${leader.userId}-${index}`}
                                            className={`flex items-center justify-between p-3 rounded-2xl border ${isMe ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-800/50 border-white/5'}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center justify-center w-6">
                                                    {getRankIcon(index)}
                                                </div>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner bg-opacity-20 ${leader.levelIcon.replace('text-', 'bg-')}`}>
                                                    <Play className={`w-5 h-5 fill-current drop-shadow-md ${leader.levelIcon}`} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`font-bold ${isMe ? 'text-yellow-400' : 'text-slate-200'} truncate max-w-[120px]`}>
                                                        {isMe ? 'Ви' : leader.firstName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{leader.levelName}</span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className={`font-black ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                                                    {leader.score.toLocaleString('uk-UA')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Personal Stats */}
                        <div className="p-4 bg-slate-900 border-t border-white/5 flex justify-between items-center shrink-0">
                            <span className="text-slate-400 text-sm font-medium">Ваш рекорд:</span>
                            <span className="text-white font-black text-lg">{currentScore.toLocaleString('uk-UA')}</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

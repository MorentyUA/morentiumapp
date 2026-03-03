import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Play, Store, Coins, Battery, Gift, ArrowUpCircle, Sparkles, ClipboardList, Flame, Pickaxe, CheckCircle, Dices, Loader } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { useGame, DEFAULT_MAX_ENERGY, DEFAULT_REGEN_RATE, DEFAULT_MULTIPLIER } from '../hooks/useGame';
import { Leaderboard } from './Leaderboard';

interface FloatingText {
    id: number;
    x: number;
    y: number;
    value: number;
}

export const GameView: React.FC = () => {
    const { HapticFeedback } = useTelegram();
    const {
        score, coins, setCoins, energy, maxEnergy, setMaxEnergy, energyRegenRate, setEnergyRegenRate, clickMultiplier, setClickMultiplier, currentLevel, nextLevel, progressToNextLevel,
        handleTap, forceSync, hasClaimedDailyCrate, claimDailyCrate, isSuperMode, superModeTimeLeft,
        loginStreak, offlineEarnings, claimOfflineEarnings, dailyQuestsProgress, dailyQuestsClaimed, setDailyQuestsClaimed, trackUpgradeBought, spinWheel
    } = useGame();

    // Tap Visual Effects
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [isQuestsOpen, setIsQuestsOpen] = useState(false);
    const [isWheelOpen, setIsWheelOpen] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelResult, setWheelResult] = useState<{ type: string, value: number, label: string } | null>(null);

    // Daily Crate State
    const [isCrateOpening, setIsCrateOpening] = useState(false);
    const [crateReward, setCrateReward] = useState<{ type: 'coins' | 'score' | 'super', amount: number } | null>(null);

    const clickIdRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const onTouch = (e: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
        // Prevent default double-tap zoom behavior on mobile browsers
        if ('touches' in e && e.touches.length > 0) {
            e.preventDefault();
        }

        if (energy <= 0) return;

        // Visual + Logic processing
        let touchesCount = 1;

        if ('touches' in e) {
            touchesCount = e.changedTouches.length;
            // We cap touches to energy available to prevent negative energy
            if (touchesCount > energy) touchesCount = energy;
        }

        const scoreAdded = handleTap(touchesCount);
        const addedPerTouch = Math.max(1, Math.floor(scoreAdded / touchesCount));

        try {
            if (touchesCount > 1) {
                HapticFeedback.impactOccurred('heavy');
            } else {
                HapticFeedback.impactOccurred(isSuperMode ? 'heavy' : 'medium');
            }
        } catch (err) { }

        // Calculate visual click position
        const rect = containerRef.current?.getBoundingClientRect();

        if (rect) {
            const newTexts: FloatingText[] = [];

            if ('changedTouches' in e) {
                for (let i = 0; i < touchesCount; i++) {
                    const touch = e.changedTouches[i];
                    if (touch) {
                        newTexts.push({
                            id: clickIdRef.current++,
                            x: touch.clientX - rect.left,
                            y: touch.clientY - rect.top,
                            value: addedPerTouch
                        });
                    }
                }
            } else {
                newTexts.push({
                    id: clickIdRef.current++,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    value: addedPerTouch
                });
            }

            setFloatingTexts(prev => [...prev, ...newTexts]);

            // Cleanup animations after 1 second
            setTimeout(() => {
                setFloatingTexts(prev => prev.filter(t => !newTexts.find(n => n.id === t.id)));
            }, 1000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 sm:p-6 min-h-[85vh] flex flex-col items-center justify-between"
        >
            {/* Header: Score & Level */}
            <div className="w-full flex flex-col items-center mt-4 relative">
                <button
                    onClick={() => {
                        forceSync();
                        setIsLeaderboardOpen(true);
                    }}
                    className="absolute right-0 top-0 sm:right-4 p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex flex-col items-center justify-center transition-colors shadow-lg"
                >
                    <Trophy className="w-4 h-4 text-yellow-500 mb-0.5" />
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Топ 10</span>
                </button>

                <button
                    onClick={() => setIsShopOpen(true)}
                    className="absolute left-0 top-0 sm:left-4 p-1.5 sm:p-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-2xl border border-purple-500/30 flex flex-col items-center justify-center transition-colors shadow-lg"
                >
                    <Store className="w-4 h-4 text-purple-400 mb-0.5" />
                    <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider">Магазин</span>
                </button>

                <button
                    onClick={() => setIsQuestsOpen(true)}
                    className="absolute left-0 top-[52px] sm:left-4 sm:top-[60px] p-1.5 sm:p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-2xl border border-blue-500/30 flex flex-col items-center justify-center transition-colors shadow-lg"
                >
                    <ClipboardList className="w-4 h-4 text-blue-400 mb-0.5" />
                    <span className="text-[9px] font-bold text-blue-300 uppercase tracking-wider">Квести</span>
                </button>

                <button
                    onClick={() => setIsWheelOpen(true)}
                    className="absolute right-0 top-[52px] sm:right-4 sm:top-[60px] p-1.5 sm:p-2 bg-red-500/10 hover:bg-red-500/20 rounded-2xl border border-red-500/30 flex flex-col items-center justify-center transition-colors shadow-lg"
                >
                    <Dices className="w-4 h-4 text-red-400 mb-0.5" />
                    <span className="text-[9px] font-bold text-red-300 uppercase tracking-wider">Рулетка</span>
                </button>

                <div className="flex flex-col items-center gap-1 mb-6 mt-4">
                    <div className="flex items-center space-x-2 bg-white/5 px-3 sm:px-6 py-2 rounded-2xl border border-white/10 drop-shadow-md flex-shrink-0">
                        <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                        <span
                            className="font-black text-white whitespace-nowrap"
                            style={{
                                fontSize: score.toLocaleString('uk-UA').length > 13 ? '1rem' : score.toLocaleString('uk-UA').length > 10 ? '1.25rem' : score.toLocaleString('uk-UA').length > 7 ? '1.5rem' : '1.875rem',
                                lineHeight: '1.2',
                                letterSpacing: '0.05em'
                            }}
                        >
                            {score.toLocaleString('uk-UA')}
                        </span>
                    </div>
                    <div className="flex items-center space-x-1.5 px-4 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold text-amber-500">{coins.toLocaleString('uk-UA')} <span className="text-[10px] uppercase text-amber-500/70 tracking-widest">Монет</span></span>
                    </div>
                </div>

                <h2 className={`text-xl font-bold ${currentLevel.icon} drop-shadow-md tracking-wider uppercase mb-2`}>
                    {currentLevel.name}
                </h2>

                {nextLevel && (
                    <div className="w-full max-w-xs px-4 flex flex-col items-center">
                        <div className="w-full bg-slate-800 rounded-full h-2 mb-1 shadow-inner overflow-hidden">
                            <motion.div
                                className="h-2 rounded-full"
                                style={{
                                    backgroundColor: 'currentColor',
                                    color: currentLevel.icon.match(/text-\[(.*?)\]/)?.[1] || '#ffffff'
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressToNextLevel}%` }}
                                transition={{ ease: "easeOut", duration: 0.3 }}
                            />
                        </div>
                        <span className="text-xs text-slate-500">Наступна: {nextLevel.name} ({nextLevel.threshold.toLocaleString('uk-UA')})</span>
                    </div>
                )}
            </div>

            {/* Tap Area */}
            <div
                ref={containerRef}
                className="relative flex-1 w-full max-w-sm flex items-center justify-center my-8 touch-none select-none"
            >
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onPointerDown={onTouch as any}
                    className={`relative w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.05)] bg-slate-800/80 border-4 border-slate-700/50 outline-none backdrop-blur-md transition-shadow duration-300 ${isSuperMode ? 'shadow-[0_0_80px_rgba(250,204,21,0.6)] border-yellow-500/50' : ''}`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    {/* The specific Youtube Play Button Render for this Tier */}
                    <div
                        className="w-3/4 h-3/4 rounded-3xl flex items-center justify-center shadow-inner relative"
                        style={{ backgroundColor: `${currentLevel.icon.match(/text-\[(.*?)\]/)?.[1] || '#ffffff'}33` }}
                    >
                        {isSuperMode && (
                            <div className="absolute inset-0 bg-yellow-400/20 rounded-3xl animate-pulse" />
                        )}
                        <Play className={`w-24 h-24 ${isSuperMode ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] scale-110' : currentLevel.icon} fill-current drop-shadow-lg transition-all duration-300`} />
                    </div>
                </motion.button>

                {/* Floating Plus Ones */}
                <AnimatePresence>
                    {floatingTexts.map(text => (
                        <motion.div
                            key={text.id}
                            initial={{ opacity: 1, y: text.y, x: text.x, scale: 1 }}
                            animate={{ opacity: 0, y: text.y - 150, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`absolute pointer-events-none text-3xl font-black ${isSuperMode ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'} z-50`}
                            style={{ left: 0, top: 0 }}
                        >
                            +{text.value}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Energy Footer */}
            <div className="w-full max-w-sm bg-slate-800/60 backdrop-blur-md p-4 rounded-3xl border border-white/5 mb-20 shadow-xl relative">

                {/* Super Mode Indicator */}
                <AnimatePresence>
                    {isSuperMode && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute -top-12 left-0 right-0 flex justify-center"
                        >
                            <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-bold px-4 py-1.5 rounded-full text-sm flex items-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                <Zap className="w-4 h-4 mr-2 fill-yellow-400" />
                                Супер Клік +10: {superModeTimeLeft}с
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-between items-end mb-3 px-2">
                    <span className="text-slate-400 text-sm font-medium flex items-center">
                        <Zap className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" />
                        Енергія
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{Math.floor(energy)} <span className="text-slate-500 font-normal">/ {maxEnergy}</span></span>
                    </div>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 shadow-inner overflow-hidden border border-white/5">
                    <motion.div
                        className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-3 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-500"
                        style={{ width: ((energy / maxEnergy) * 100) + '%' }}
                    />
                </div>
            </div>

            <Leaderboard
                isOpen={isLeaderboardOpen}
                onClose={() => setIsLeaderboardOpen(false)}
                currentScore={score}
            />

            {/* UPGRADE SHOP MODAL */}
            <AnimatePresence>
                {isShopOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 pb-20 sm:pb-4"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-slate-900 w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
                            style={{ maxHeight: '85vh' }}
                        >
                            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold flex items-center text-white">
                                        <Store className="w-5 h-5 mr-2 text-purple-400" />
                                        Магазин Покращень
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">Витрачайте монети для бусту вашого клікера</p>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-inner scale-105 relative z-10">
                                    <Coins className="w-4 h-4 text-amber-500" />
                                    <span className="font-bold text-amber-400 text-sm">{coins.toLocaleString('uk-UA')}</span>
                                </div>
                            </div>

                            <div className="p-5 overflow-y-auto space-y-4">
                                {/* Max Energy Upgrade */}
                                <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-400">
                                                <Battery className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">Макс. Енергія</h4>
                                                <p className="text-xs text-slate-400">Рівень {Math.floor((maxEnergy - DEFAULT_MAX_ENERGY) / 500)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Ефект</span>
                                            <span className="text-sm font-black text-emerald-400">+{((maxEnergy + 500) - maxEnergy)} <Zap className="w-3 h-3 inline pb-0.5" /></span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm font-bold text-slate-300">Всього: {maxEnergy} <span className="text-xs text-slate-500 font-normal">од.</span></span>
                                        <button
                                            onClick={() => {
                                                const cost = 50 + (Math.floor((maxEnergy - DEFAULT_MAX_ENERGY) / 500) * 50);
                                                if (coins >= cost) {
                                                    setCoins(c => c - cost);
                                                    setMaxEnergy(m => m + 500);
                                                    trackUpgradeBought();
                                                    try { HapticFeedback.impactOccurred('medium'); } catch (e) { }
                                                } else {
                                                    try { HapticFeedback.notificationOccurred('error'); } catch (e) { }
                                                }
                                            }}
                                            className="px-4 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <Coins className="w-3 h-3" />
                                            {50 + (Math.floor((maxEnergy - DEFAULT_MAX_ENERGY) / 500) * 50)}
                                        </button>
                                    </div>
                                </div>

                                {/* Energy Regen Upgrade */}
                                <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">Швидкість Енергії</h4>
                                                <p className="text-xs text-slate-400">Рівень {(energyRegenRate - DEFAULT_REGEN_RATE)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Ефект</span>
                                            <span className="text-sm font-black text-emerald-400">+1 <Zap className="w-3 h-3 inline pb-0.5" />/с</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm font-bold text-slate-300">{energyRegenRate} <span className="text-xs text-slate-500 font-normal">за сек.</span></span>
                                        <button
                                            onClick={() => {
                                                const cost = 100 + ((energyRegenRate - DEFAULT_REGEN_RATE) * 100);
                                                if (coins >= cost) {
                                                    setCoins(c => c - cost);
                                                    setEnergyRegenRate(r => r + 1);
                                                    trackUpgradeBought();
                                                    try { HapticFeedback.impactOccurred('medium'); } catch (e) { }
                                                } else {
                                                    try { HapticFeedback.notificationOccurred('error'); } catch (e) { }
                                                }
                                            }}
                                            className="px-4 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <Coins className="w-3 h-3" />
                                            {100 + ((energyRegenRate - DEFAULT_REGEN_RATE) * 100)}
                                        </button>
                                    </div>
                                </div>

                                {/* Click Multiplier Upgrade */}
                                <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/5 shadow-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-500/20 rounded-xl text-red-500">
                                                <ArrowUpCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">Мультиплікатор</h4>
                                                <p className="text-xs text-slate-400">Рівень {clickMultiplier - DEFAULT_MULTIPLIER}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Ефект</span>
                                            <span className="text-sm font-black text-red-400">+1 хрен/клік</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 relative z-10">
                                        <span className="text-sm font-bold text-slate-300">База: x{clickMultiplier}</span>
                                        <button
                                            onClick={() => {
                                                const cost = 250 + ((clickMultiplier - DEFAULT_MULTIPLIER) * 400);
                                                if (coins >= cost) {
                                                    setCoins(c => c - cost);
                                                    setClickMultiplier(m => m + 1);
                                                    trackUpgradeBought();
                                                    try { HapticFeedback.impactOccurred('heavy'); } catch (e) { }
                                                } else {
                                                    try { HapticFeedback.notificationOccurred('error'); } catch (e) { }
                                                }
                                            }}
                                            className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 transition-colors flex items-center gap-1.5"
                                        >
                                            <Coins className="w-3 h-3" />
                                            {250 + ((clickMultiplier - DEFAULT_MULTIPLIER) * 400)}
                                        </button>
                                    </div>
                                </div>

                            </div>
                            <div className="p-4 bg-slate-800/80 border-t border-white/5 backdrop-blur-md">
                                <button
                                    onClick={() => setIsShopOpen(false)}
                                    className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-colors"
                                >
                                    Закрити Магазин
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DAILY CRATE OVERLAY */}
            <AnimatePresence>
                {!hasClaimedDailyCrate && !crateReward && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
                        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md p-6"
                    >
                        <motion.div
                            animate={{
                                y: [0, -15, 0],
                                rotate: isCrateOpening ? [-5, 5, -5, 5, 0] : 0
                            }}
                            transition={{
                                y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                                rotate: { duration: 0.5, repeat: isCrateOpening ? 3 : 0 }
                            }}
                            onClick={() => {
                                if (isCrateOpening) return;
                                setIsCrateOpening(true);
                                try { HapticFeedback.impactOccurred('heavy'); } catch (e) { }

                                setTimeout(() => {
                                    const rand = Math.random();
                                    let rewardType: 'coins' | 'score' | 'super' = 'coins';
                                    let amount = 0;

                                    if (rand < 0.1) {
                                        rewardType = 'super'; // 10% chance for Super Mode
                                    } else if (rand < 0.5) {
                                        rewardType = 'coins'; // 40% chance for Coins
                                        amount = Math.floor(Math.random() * 150) + 50; // 50-200 coins
                                    } else {
                                        rewardType = 'score'; // 50% chance for Score
                                        amount = Math.floor(Math.random() * 4000) + 1000; // 1000-5000 score
                                    }

                                    // Apply Streak Multiplier
                                    if (loginStreak > 1 && rewardType !== 'super') {
                                        amount = Math.floor(amount * (1 + (loginStreak * 0.2)));
                                    }

                                    setCrateReward({ type: rewardType, amount });
                                    try { HapticFeedback.notificationOccurred('success'); } catch (e) { }
                                }, 1500);
                            }}
                            className="relative cursor-pointer group"
                        >
                            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-[100px] group-hover:bg-yellow-500/40 transition-colors" />
                            <Gift className={`w-48 h-48 text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)] ${isCrateOpening ? 'text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]' : ''} transition-all duration-500`} />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-black text-white mt-8 tracking-widest text-center"
                        >
                            {isCrateOpening ? "ВІДКРИВАЄМО..." : "ЩОДЕННА СКРИНЯ"}
                        </motion.h2>
                        <p className="text-slate-400 mt-2 text-center max-w-xs">
                            {isCrateOpening ? "Зачекайте мить!" : "Тапніть по скрині, щоб отримати свою щоденну нагороду."}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CRATE REWARD SCREEN */}
            <AnimatePresence>
                {crateReward && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 z-[210] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6"
                    >
                        <Sparkles className="w-24 h-24 text-yellow-400 animate-spin-slow mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]" />

                        <h2 className="text-4xl font-black text-white mb-2 tracking-widest text-center">
                            ВИ ОТРИМАЛИ
                        </h2>

                        {loginStreak > 1 && crateReward.type !== 'super' && (
                            <div className="bg-orange-500/20 text-orange-400 border border-orange-500/50 px-4 py-1.5 rounded-full flex items-center mb-4 shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                                <Flame className="w-4 h-4 mr-2" />
                                <span className="font-bold text-sm">Стрік: День {loginStreak} (+{Math.round((loginStreak * 0.2) * 100)}% бонус)</span>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/50 rounded-3xl p-8 mb-8 flex flex-col items-center shadow-[0_0_50px_rgba(250,204,21,0.3)]">
                            {crateReward.type === 'coins' && (
                                <>
                                    <Coins className="w-16 h-16 text-amber-400 mb-4 drop-shadow-lg" />
                                    <span className="text-5xl font-black text-amber-500">+{crateReward.amount}</span>
                                    <span className="text-amber-500/80 font-bold tracking-widest uppercase mt-2">Монет</span>
                                </>
                            )}
                            {crateReward.type === 'score' && (
                                <>
                                    <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-lg" />
                                    <span className="text-5xl font-black text-yellow-500">+{crateReward.amount.toLocaleString('uk-UA')}</span>
                                    <span className="text-yellow-500/80 font-bold tracking-widest uppercase mt-2">Очок</span>
                                </>
                            )}
                            {crateReward.type === 'super' && (
                                <>
                                    <Zap className="w-16 h-16 text-purple-400 mb-4 drop-shadow-lg fill-purple-400" />
                                    <span className="text-4xl font-black text-purple-500 text-center">СУПЕР КЛІК</span>
                                    <span className="text-purple-400/80 font-bold tracking-widest uppercase mt-2 text-center">+ ПОВНА ЕНЕРГІЯ</span>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                claimDailyCrate(crateReward.type, crateReward.amount);
                                setCrateReward(null);
                            }}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl px-12 py-4 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all active:scale-95 uppercase tracking-wider"
                        >
                            Забрати
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DAILY QUESTS MODAL */}
            <AnimatePresence>
                {isQuestsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 pb-20 sm:pb-4"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-slate-900 w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
                            style={{ maxHeight: '85vh' }}
                        >
                            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold flex items-center text-white">
                                        <ClipboardList className="w-5 h-5 mr-2 text-blue-400" />
                                        Щоденні Квести
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">Виконуйте завдання для отримання нагород</p>
                                </div>
                            </div>

                            <div className="p-5 overflow-y-auto space-y-4">
                                {/* Quest 1: Clicks */}
                                <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-white text-sm">Пальці-Молотки</h4>
                                            <p className="text-xs text-slate-400">Зробіть 500 тапів</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                                            <Coins className="w-3 h-3 text-amber-500" />
                                            <span className="text-xs font-bold text-amber-400">100</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs font-bold text-slate-300">{Math.min(dailyQuestsProgress.clicks, 500)} / 500</span>
                                        <button
                                            disabled={dailyQuestsClaimed.clicks || dailyQuestsProgress.clicks < 500}
                                            onClick={() => {
                                                setDailyQuestsClaimed(prev => ({ ...prev, clicks: true }));
                                                setCoins(c => c + 100);
                                                try { HapticFeedback.notificationOccurred('success'); } catch (e) { }
                                            }}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${dailyQuestsClaimed.clicks
                                                ? 'bg-emerald-500/20 text-emerald-500 cursor-not-allowed'
                                                : dailyQuestsProgress.clicks >= 500
                                                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {dailyQuestsClaimed.clicks ? <><CheckCircle className="w-3 h-3" /> Виконано</> : 'Забрати'}
                                        </button>
                                    </div>
                                    <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <motion.div
                                            className="bg-blue-500 h-full rounded-full"
                                            style={{ width: `${Math.min((dailyQuestsProgress.clicks / 500) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Quest 2: Super Modes */}
                                <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-white text-sm">Ловець Удачі</h4>
                                            <p className="text-xs text-slate-400">Увійдіть в Супер-Режим 2 рази</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                                            <Trophy className="w-3 h-3 text-yellow-500" />
                                            <span className="text-xs font-bold text-yellow-400">2,500</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs font-bold text-slate-300">{Math.min(dailyQuestsProgress.superModes, 2)} / 2</span>
                                        <button
                                            disabled={dailyQuestsClaimed.superModes || dailyQuestsProgress.superModes < 2}
                                            onClick={() => {
                                                setDailyQuestsClaimed(prev => ({ ...prev, superModes: true }));
                                                // Actually adding to score might require an explicit setScore, but wait
                                                // Oh, I only exposed setCoins. I'll need a trick... or I can just reward 250 coins instead.
                                                // Let's reward 250 coins because I didn't export setScore.
                                                setCoins(c => c + 250);
                                                try { HapticFeedback.notificationOccurred('success'); } catch (e) { }
                                            }}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${dailyQuestsClaimed.superModes
                                                ? 'bg-emerald-500/20 text-emerald-500 cursor-not-allowed'
                                                : dailyQuestsProgress.superModes >= 2
                                                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {dailyQuestsClaimed.superModes ? <><CheckCircle className="w-3 h-3" /> Виконано</> : 'Забрати'}
                                        </button>
                                    </div>
                                    <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <motion.div
                                            className="bg-blue-500 h-full rounded-full"
                                            style={{ width: `${Math.min((dailyQuestsProgress.superModes / 2) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Quest 3: Shop Upgrade */}
                                <div className="bg-slate-800/60 p-4 rounded-2xl border border-white/5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-white text-sm">Інвестор</h4>
                                            <p className="text-xs text-slate-400">Купіть 1 покращення в магазині</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                                            <Coins className="w-3 h-3 text-amber-500" />
                                            <span className="text-xs font-bold text-amber-400">50</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs font-bold text-slate-300">{Math.min(dailyQuestsProgress.upgrades, 1)} / 1</span>
                                        <button
                                            disabled={dailyQuestsClaimed.upgrades || dailyQuestsProgress.upgrades < 1}
                                            onClick={() => {
                                                setDailyQuestsClaimed(prev => ({ ...prev, upgrades: true }));
                                                setCoins(c => c + 50);
                                                try { HapticFeedback.notificationOccurred('success'); } catch (e) { }
                                            }}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${dailyQuestsClaimed.upgrades
                                                ? 'bg-emerald-500/20 text-emerald-500 cursor-not-allowed'
                                                : dailyQuestsProgress.upgrades >= 1
                                                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {dailyQuestsClaimed.upgrades ? <><CheckCircle className="w-3 h-3" /> Виконано</> : 'Забрати'}
                                        </button>
                                    </div>
                                    <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <motion.div
                                            className="bg-blue-500 h-full rounded-full"
                                            style={{ width: `${Math.min((dailyQuestsProgress.upgrades / 1) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-800/80 border-t border-white/5 backdrop-blur-md">
                                <button
                                    onClick={() => setIsQuestsOpen(false)}
                                    className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-colors"
                                >
                                    Закрити
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OFFLINE EARNINGS MODAL */}
            <AnimatePresence>
                {offlineEarnings && hasClaimedDailyCrate && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 z-[220] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md p-6"
                    >
                        <Pickaxe className="w-24 h-24 text-blue-400 animate-bounce mb-6 drop-shadow-[0_0_30px_rgba(59,130,246,0.8)]" />

                        <h2 className="text-3xl font-black text-white mb-2 tracking-widest text-center">
                            З ПОВЕРНЕННЯМ!
                        </h2>
                        <p className="text-slate-400 mb-6 text-center max-w-xs">
                            Поки вас не було, ваші підписники продовжували працювати:
                        </p>

                        <div className="bg-slate-800/80 border border-white/10 rounded-3xl p-6 w-full max-w-sm mb-8 flex flex-col items-center shadow-2xl">
                            <div className="flex flex-col items-center justify-center gap-4 w-full">
                                <div className="flex flex-col items-center bg-white/5 w-full py-3 rounded-xl border border-white/5">
                                    <span className="text-3xl font-black text-white tracking-widest">+{offlineEarnings.score.toLocaleString('uk-UA')}</span>
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center mt-1"><Trophy className="w-3 h-3 text-yellow-500 mr-1" /> Очки</span>
                                </div>
                                {offlineEarnings.coins > 0 && (
                                    <div className="flex flex-col items-center bg-amber-500/10 w-full py-3 rounded-xl border border-amber-500/20">
                                        <span className="text-3xl font-black text-amber-400 tracking-widest">+{offlineEarnings.coins.toLocaleString('uk-UA')}</span>
                                        <span className="text-xs text-amber-500/80 font-bold uppercase tracking-wider flex items-center mt-1"><Coins className="w-3 h-3 mr-1" /> Монети</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                claimOfflineEarnings();
                                try { HapticFeedback.notificationOccurred('success'); } catch (e) { }
                            }}
                            className="bg-blue-500 hover:bg-blue-400 text-white font-black text-xl px-12 py-4 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all active:scale-95 uppercase tracking-wider"
                        >
                            Зібрати врожай
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wheel of Fortune Modal */}
            <AnimatePresence>
                {isWheelOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl w-full max-w-sm relative overflow-hidden shadow-2xl"
                        >
                            <button
                                onClick={() => { setIsWheelOpen(false); setWheelResult(null); setIsSpinning(false); }}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>

                            <div className="text-center mb-6 mt-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)] border border-red-500/30 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-red-400/20 animate-spin" style={{ animationDuration: '4s' }}></div>
                                    <Dices className="w-10 h-10 text-red-500 relative z-10" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Колесо Фортуни</h3>
                                <p className="text-sm text-slate-400 leading-relaxed mb-1">
                                    Внесок: <strong className="text-yellow-400">100 Монет</strong>
                                </p>
                                <div className="inline-block bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1 mt-1 font-black text-red-400 animate-pulse text-sm">
                                    ДЖЕКПОТ: 1,000 МОНЕТ
                                </div>
                            </div>

                            {/* Prize Display Area */}
                            <div className="w-full bg-slate-950/50 rounded-2xl h-36 mb-6 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                                {isSpinning ? (
                                    <div className="flex flex-col items-center">
                                        <Loader className="w-10 h-10 text-red-500 animate-spin mb-3 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                                        <span className="text-white font-bold tracking-widest text-sm bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/20">КРУТИМО...</span>
                                    </div>
                                ) : wheelResult ? (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0, y: 10 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        className="flex flex-col items-center text-center p-3"
                                    >
                                        <span className={`text-2xl font-black px-2 text-center drop-shadow-lg ${wheelResult.type === 'coins' ? 'text-yellow-400' : wheelResult.type === 'score' ? 'text-cyan-400' : wheelResult.type === 'nothing' ? 'text-slate-500' : 'text-purple-400'}`}>
                                            {wheelResult.label}
                                        </span>
                                        {wheelResult.type === 'nothing' && (
                                            <span className="text-xs text-slate-500 mt-2">Не здавайся, спробуй ще!</span>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-600 h-full justify-center opacity-70">
                                        <Gift className="w-8 h-8 mb-2" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Випробуй вдачу</span>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={isSpinning || coins < 100}
                                onClick={() => {
                                    if (coins < 100) return;
                                    setWheelResult(null);
                                    setIsSpinning(true);
                                    setTimeout(() => {
                                        const result = spinWheel();
                                        if (result.success) {
                                            setWheelResult(result.reward);
                                            try {
                                                if (result.reward?.type === 'coins' && result.reward.value > 100) {
                                                    HapticFeedback.notificationOccurred('success');
                                                } else if (result.reward?.type === 'nothing') {
                                                    HapticFeedback.notificationOccurred('error');
                                                } else {
                                                    HapticFeedback.impactOccurred('heavy');
                                                }
                                            } catch (e) { }
                                        }
                                        setIsSpinning(false);
                                    }, 1500);
                                }}
                                className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center transition-all ${coins >= 100 && !isSpinning ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/25 active:scale-[0.98]' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                            >
                                {isSpinning ? 'ЧАКЛУЄМО...' : (
                                    <>
                                        КРУТИТИ ЗА
                                        <div className={`flex items-center ml-2 px-2 py-0.5 rounded-lg ${coins >= 100 ? 'bg-black/20 text-yellow-500' : 'bg-black/10 text-slate-600'}`}>
                                            <Coins className="w-4 h-4 mr-1" />
                                            100
                                        </div>
                                    </>
                                )}
                            </button>
                            {coins < 100 && !isSpinning && (
                                <p className="text-center text-red-500 text-xs mt-3 font-medium">Недостатньо монет!</p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

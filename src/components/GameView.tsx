import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Play, BatteryCharging } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { useGame } from '../hooks/useGame';
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
        score, energy, MAX_ENERGY, currentLevel, nextLevel, progressToNextLevel,
        handleTap, forceSync, dailyBoosts, triggerBoost, isSuperMode, superModeTimeLeft
    } = useGame();

    // Tap Visual Effects
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
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
                    className="absolute right-0 top-0 sm:right-4 p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex flex-col items-center justify-center transition-colors shadow-lg"
                >
                    <Trophy className="w-5 h-5 text-yellow-500 mb-1" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Топ 10</span>
                </button>

                <div className="flex items-center space-x-2 bg-white/5 px-6 py-2 rounded-2xl border border-white/10 mb-6 drop-shadow-md">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <span className="text-3xl font-black text-white tracking-widest">{score.toLocaleString('uk-UA')}</span>
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
                                Супер Клік 2x: {superModeTimeLeft}с
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
                        <span className="text-white font-bold">{Math.floor(energy)} <span className="text-slate-500 font-normal">/ {MAX_ENERGY}</span></span>

                        {/* Daily Boost Button */}
                        <button
                            onClick={triggerBoost}
                            disabled={dailyBoosts <= 0 || energy === MAX_ENERGY}
                            className={`flex items-center text-xs font-bold px-2 py-1.5 rounded-lg transition-colors border ${dailyBoosts > 0 && energy < MAX_ENERGY
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                                    : 'bg-slate-700/50 text-slate-500 border-slate-600/50 cursor-not-allowed'
                                }`}
                        >
                            <BatteryCharging className="w-3 h-3 mr-1" />
                            {dailyBoosts}/3 Буст
                        </button>
                    </div>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 shadow-inner overflow-hidden border border-white/5">
                    <motion.div
                        className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-3 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                        style={{ width: ((energy / MAX_ENERGY) * 100) + '%' }}
                    />
                </div>
            </div>

            <Leaderboard
                isOpen={isLeaderboardOpen}
                onClose={() => setIsLeaderboardOpen(false)}
                currentScore={score}
            />
        </motion.div>
    );
};

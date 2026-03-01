import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';

const GAME_STORAGE_KEY = 'morentube_clicker_state';
export const MAX_ENERGY = 1000;
const ENERGY_REGEN_RATE = 1; // 1 energy per second

export interface LevelInfo {
    id: number;
    name: string;
    threshold: number;
    icon: string; // Tailwind color class or emoji
}

export const LEVELS: LevelInfo[] = [
    { id: 1, name: "Картонна кнопка", threshold: 0, icon: "text-[#D2B48C]" },
    { id: 2, name: "Дерев'яна кнопка", threshold: 500, icon: "text-[#8B5A2B]" },
    { id: 3, name: "Кам'яна кнопка", threshold: 1500, icon: "text-[#888C8D]" },
    { id: 4, name: "Мідна кнопка", threshold: 3500, icon: "text-[#B87333]" },
    { id: 5, name: "Бронзова кнопка", threshold: 7500, icon: "text-[#CD7F32]" },
    { id: 6, name: "Залізна кнопка", threshold: 15000, icon: "text-[#A19D94]" },
    { id: 7, name: "Срібна кнопка", threshold: 30000, icon: "text-[#C0C0C0]" },
    { id: 8, name: "Золота кнопка", threshold: 60000, icon: "text-[#FFD700]" },
    { id: 9, name: "Платинова кнопка", threshold: 100000, icon: "text-[#E5E4E2]" },
    { id: 10, name: "Кварцова кнопка", threshold: 150000, icon: "text-[#F7F7F7]" },
    { id: 11, name: "Нефритова кнопка", threshold: 225000, icon: "text-[#00A86B]" },
    { id: 12, name: "Аметистова кнопка", threshold: 325000, icon: "text-[#9966CC]" },
    { id: 13, name: "Смарагдова кнопка", threshold: 450000, icon: "text-[#50C878]" },
    { id: 14, name: "Сапфірова кнопка", threshold: 600000, icon: "text-[#0F52BA]" },
    { id: 15, name: "Рубінова кнопка", threshold: 800000, icon: "text-[#E0115F]" },
    { id: 16, name: "Обсидіанова кнопка", threshold: 1000000, icon: "text-[#302E39]" },
    { id: 17, name: "Діамантова кнопка", threshold: 1500000, icon: "text-[#b9f2ff]" },
    { id: 18, name: "Кібер-кнопка", threshold: 3000000, icon: "text-[#00FF00]" },
    { id: 19, name: "Плазмова кнопка", threshold: 5000000, icon: "text-[#B026FF]" },
    { id: 20, name: "Космічна кнопка", threshold: 10000000, icon: "text-[#0B3D91]" }
];

export const LEVEL_THRESHOLDS = LEVELS;

export const useGame = () => {
    const { user } = useTelegram();
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(MAX_ENERGY);
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    // Phase 17 Gamification States
    const [dailyBoosts, setDailyBoosts] = useState(3);
    const [lastBoostResetDate, setLastBoostResetDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [isSuperMode, setIsSuperMode] = useState(false);
    const [superModeTimeLeft, setSuperModeTimeLeft] = useState(0);

    const lastSyncedScore = useRef(0);

    // Initialize from LocalStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(GAME_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setScore(parsed.score || 0);

                const today = new Date().toISOString().split('T')[0];
                if (parsed.lastBoostResetDate !== today) {
                    setDailyBoosts(3);
                    setLastBoostResetDate(today);
                } else {
                    setDailyBoosts(parsed.dailyBoosts ?? 3);
                    setLastBoostResetDate(parsed.lastBoostResetDate);
                }

                // Calculate offline energy regeneration
                const now = Date.now();
                const passedSeconds = Math.floor((now - (parsed.lastUpdate || now)) / 1000);
                const regeneratedEnergy = passedSeconds * ENERGY_REGEN_RATE;

                // Cap at MAX_ENERGY
                const newEnergy = Math.min((parsed.energy ?? MAX_ENERGY) + regeneratedEnergy, MAX_ENERGY);

                setEnergy(newEnergy);
                setLastUpdate(now);
            }
        } catch (e) {
            console.error("Failed to load game state", e);
        }
    }, []);

    // Passive Energy Regeneration Tick (Every 1 Second)
    useEffect(() => {
        const interval = setInterval(() => {
            setEnergy(prev => {
                if (prev >= MAX_ENERGY) return prev;
                return Math.min(prev + ENERGY_REGEN_RATE, MAX_ENERGY);
            });
            setLastUpdate(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Save to LocalStorage whenever critical values change
    useEffect(() => {
        try {
            localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({
                score,
                energy,
                lastUpdate,
                dailyBoosts,
                lastBoostResetDate
            }));

            // Broadcast so Profile can update instantly if open
            window.dispatchEvent(new Event('game_state_updated'));
        } catch (e) {
            console.error("Failed to save game state", e);
        }
    }, [score, energy, lastUpdate, dailyBoosts, lastBoostResetDate]);

    // Calculate Current Level
    const currentLevel = LEVELS.slice().reverse().find(lvl => score >= lvl.threshold) || LEVELS[0];

    const syncTimeoutRef = useRef<any>(null);

    const forceSync = useCallback(() => {
        const uId = user?.id || 'local_test_user';
        if (score === 0 || score === lastSyncedScore.current) return;

        lastSyncedScore.current = score;
        fetch('/api/game-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: uId,
                firstName: user?.first_name || 'Гість ' + Math.floor(Math.random() * 100),
                score: score,
                levelName: currentLevel.name,
                levelIcon: currentLevel.icon
            })
        }).catch(e => console.error("Game Sync Failed", e));
    }, [score, currentLevel, user]);

    // Remote Sync (5s after last tap)
    useEffect(() => {
        if (score === 0) return;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(() => {
            forceSync();
        }, 5000);

        return () => clearTimeout(syncTimeoutRef.current);
    }, [score, forceSync]);

    const handleTap = useCallback((baseCount = 1) => {
        let actualCount = baseCount;

        setIsSuperMode(currentSuperMode => {
            if (currentSuperMode) {
                actualCount = baseCount * 2;
                return true;
            }

            // 5% Chance to trigger Super Mode if not active
            if (Math.random() < 0.05) {
                actualCount = baseCount * 2;
                setSuperModeTimeLeft(10);
                return true;
            }
            return false;
        });

        setEnergy(currentEnergy => {
            if (currentEnergy < baseCount) return currentEnergy; // Not enough energy based on base cost

            // Increase score
            setScore(s => s + actualCount);
            setLastUpdate(Date.now());

            // Deduct energy
            return currentEnergy - baseCount;
        });

        // Return actual score added for UI overlay (floating text)
        return actualCount;
    }, []);

    // Super Mode Countdown Effect
    useEffect(() => {
        if (superModeTimeLeft > 0) {
            const timer = setTimeout(() => {
                setSuperModeTimeLeft(t => t - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isSuperMode) {
            setIsSuperMode(false);
        }
    }, [superModeTimeLeft, isSuperMode]);

    const triggerBoost = useCallback(() => {
        if (dailyBoosts > 0) {
            setEnergy(MAX_ENERGY);
            setDailyBoosts(prev => prev - 1);
            setLastUpdate(Date.now());
        }
    }, [dailyBoosts]);

    // Calculate Next Level Progress

    // Calculate Next Level Progress
    const nextLevel = LEVELS.find(lvl => lvl.id === currentLevel.id + 1);
    const progressToNextLevel = nextLevel
        ? Math.min(100, Math.max(0, ((score - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100))
        : 100; // Max level reached

    return {
        score,
        energy,
        MAX_ENERGY,
        currentLevel,
        nextLevel,
        progressToNextLevel,
        handleTap,
        forceSync,
        dailyBoosts,
        triggerBoost,
        isSuperMode,
        superModeTimeLeft
    };
};

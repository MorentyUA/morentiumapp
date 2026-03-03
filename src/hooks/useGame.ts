import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';

const GAME_STORAGE_KEY = 'morentube_clicker_state';
export const DEFAULT_MAX_ENERGY = 1000;
export const DEFAULT_REGEN_RATE = 1; // 1 energy per second
export const DEFAULT_MULTIPLIER = 1;

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
    { id: 20, name: "Космічна кнопка", threshold: 10000000, icon: "text-[#0B3D91]" },
    // Phase 28: 20 New God-Tier Levels
    { id: 21, name: "Метеоритна кнопка", threshold: 15000000, icon: "text-[#8C3A3A]" },
    { id: 22, name: "Зоряна кнопка", threshold: 25000000, icon: "text-[#FFFACD]" },
    { id: 23, name: "Пульсарова кнопка", threshold: 40000000, icon: "text-[#4B0082]" },
    { id: 24, name: "Квазарова кнопка", threshold: 65000000, icon: "text-[#FF4500]" },
    { id: 25, name: "Галактична кнопка", threshold: 100000000, icon: "text-[#8A2BE2]" },
    { id: 26, name: "Антиматерієва кнопка", threshold: 150000000, icon: "text-[#000000]" },
    { id: 27, name: "Сингулярна кнопка", threshold: 250000000, icon: "text-[#191970]" },
    { id: 28, name: "Екзопланетна кнопка", threshold: 400000000, icon: "text-[#20B2AA]" },
    { id: 29, name: "Супернова кнопка", threshold: 600000000, icon: "text-[#FF8C00]" },
    { id: 30, name: "Гіпернова кнопка", threshold: 900000000, icon: "text-[#FF1493]" },
    // God Levels (1B+)
    { id: 31, name: "Просторова кнопка", threshold: 1500000000, icon: "text-[#00CED1]" },
    { id: 32, name: "Часова кнопка", threshold: 2500000000, icon: "text-[#DDA0DD]" },
    { id: 33, name: "Квантова кнопка", threshold: 4000000000, icon: "text-[#7FFFD4]" },
    { id: 34, name: "Хроно-кнопка", threshold: 6000000000, icon: "text-[#B8860B]" },
    { id: 35, name: "Ефірна кнопка", threshold: 9000000000, icon: "text-[#E6E6FA]" },
    { id: 36, name: "Астральна кнопка", threshold: 13000000000, icon: "text-[#FFB6C1]" },
    { id: 37, name: "Небесна кнопка", threshold: 20000000000, icon: "text-[#F0F8FF]" },
    { id: 38, name: "Божественна кнопка", threshold: 30000000000, icon: "text-[#FFD700]" },
    { id: 39, name: "Омні-кнопка", threshold: 50000000000, icon: "text-[#FFFAFA]" },
    { id: 40, name: "Кнопка Творця", threshold: 100000000000, icon: "text-[#FFFFFF]" }
];

export const LEVEL_THRESHOLDS = LEVELS;

export const useGame = () => {
    const { user } = useTelegram();
    const [score, setScore] = useState(0);
    const [coins, setCoins] = useState(0);
    const [energy, setEnergy] = useState(DEFAULT_MAX_ENERGY);
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    // Upgrades
    const [maxEnergy, setMaxEnergy] = useState(DEFAULT_MAX_ENERGY);
    const [energyRegenRate, setEnergyRegenRate] = useState(DEFAULT_REGEN_RATE);
    const [clickMultiplier, setClickMultiplier] = useState(DEFAULT_MULTIPLIER);

    // Phase 24 Gamification States
    const [hasClaimedDailyCrate, setHasClaimedDailyCrate] = useState(false);
    const [lastBoostResetDate, setLastBoostResetDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [isSuperMode, setIsSuperMode] = useState(false);
    const [superModeTimeLeft, setSuperModeTimeLeft] = useState(0);
    const [lastSuperModeTime, setLastSuperModeTime] = useState(0);

    // Phase 25 Retention Gamification
    const [loginStreak, setLoginStreak] = useState(1);
    const [offlineEarnings, setOfflineEarnings] = useState<{ score: number, coins: number } | null>(null);
    const [dailyQuestsProgress, setDailyQuestsProgress] = useState({ clicks: 0, superModes: 0, upgrades: 0 });
    const [dailyQuestsClaimed, setDailyQuestsClaimed] = useState({ clicks: false, superModes: false, upgrades: false });
    const [lastQuestResetTime, setLastQuestResetTime] = useState(Date.now());

    const lastSyncedScore = useRef(0);

    // Initialize from LocalStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(GAME_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setScore(parsed.score || 0);
                setCoins(parsed.coins || 0);

                // Load Upgrades
                const savedMaxEnergy = parsed.maxEnergy || DEFAULT_MAX_ENERGY;
                setMaxEnergy(savedMaxEnergy);
                const savedRegenRate = parsed.energyRegenRate || DEFAULT_REGEN_RATE;
                setEnergyRegenRate(savedRegenRate);
                setClickMultiplier(parsed.clickMultiplier || DEFAULT_MULTIPLIER);
                setLastSuperModeTime(parsed.lastSuperModeTime || 0);

                setLoginStreak(parsed.loginStreak || 1);

                // Quest Reset Logic (10 minutes = 600,000 ms)
                const now = Date.now();
                const savedQuestResetTime = parsed.lastQuestResetTime || now;
                const timeSinceQuestReset = now - savedQuestResetTime;

                if (timeSinceQuestReset >= 600000) {
                    setDailyQuestsProgress({ clicks: 0, superModes: 0, upgrades: 0 });
                    setDailyQuestsClaimed({ clicks: false, superModes: false, upgrades: false });
                    setLastQuestResetTime(now);
                } else {
                    setDailyQuestsProgress(parsed.dailyQuestsProgress || { clicks: 0, superModes: 0, upgrades: 0 });
                    setDailyQuestsClaimed(parsed.dailyQuestsClaimed || { clicks: false, superModes: false, upgrades: false });
                    setLastQuestResetTime(savedQuestResetTime);
                }

                const today = new Date().toISOString().split('T')[0];
                if (parsed.lastBoostResetDate !== today) {
                    setHasClaimedDailyCrate(false);

                    // Streak Logic
                    if (parsed.lastBoostResetDate) {
                        const lastDate = new Date(parsed.lastBoostResetDate);
                        const currentDate = new Date(today);
                        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays === 1) {
                            setLoginStreak(prev => Math.min(prev + 1, 7)); // Cap streak at 7
                        } else {
                            setLoginStreak(1);
                        }
                    }

                    setLastBoostResetDate(today);
                } else {
                    setHasClaimedDailyCrate(parsed.hasClaimedDailyCrate ?? false);
                    setLastBoostResetDate(parsed.lastBoostResetDate);
                }

                // Calculate offline energy regeneration and MINING
                const currentTime = Date.now();
                const passedSeconds = Math.floor((currentTime - (parsed.lastUpdate || currentTime)) / 1000);

                // Offline Mining Logic (Cap at 3 hours = 10800 seconds)
                const offlineMiningSeconds = Math.min(passedSeconds, 3 * 3600);
                if (offlineMiningSeconds > 60) { // Only show modal if away for more than 1 minute
                    // 1 score per second base * clickMultiplier
                    const offlineScore = offlineMiningSeconds * 1 * (parsed.clickMultiplier || DEFAULT_MULTIPLIER);
                    const offlineCoins = Math.floor(offlineScore / 100);

                    if (offlineScore > 0) {
                        setOfflineEarnings({ score: offlineScore, coins: offlineCoins });
                    }
                }

                const regeneratedEnergy = passedSeconds * savedRegenRate;

                // Cap at MAX_ENERGY
                const newEnergy = Math.min((parsed.energy ?? savedMaxEnergy) + regeneratedEnergy, savedMaxEnergy);

                setEnergy(newEnergy);
                setLastUpdate(currentTime);
            }
        } catch (e) {
            console.error("Failed to load game state", e);
        }
    }, []);

    // Passive Energy Regeneration Tick (Every 1 Second)
    useEffect(() => {
        const interval = setInterval(() => {
            setEnergy(prev => {
                if (prev >= maxEnergy) return prev;
                return Math.min(prev + energyRegenRate, maxEnergy);
            });
            setLastUpdate(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [maxEnergy, energyRegenRate]);

    // Save to LocalStorage whenever critical values change
    useEffect(() => {
        try {
            localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({
                score,
                coins,
                energy,
                maxEnergy,
                energyRegenRate,
                clickMultiplier,
                lastUpdate,
                hasClaimedDailyCrate,
                lastBoostResetDate,
                lastSuperModeTime,
                loginStreak,
                dailyQuestsProgress,
                dailyQuestsClaimed,
                lastQuestResetTime
            }));

            // Broadcast so Profile can update instantly if open
            window.dispatchEvent(new Event('game_state_updated'));
        } catch (e) {
            console.error("Failed to save game state", e);
        }
    }, [score, coins, energy, maxEnergy, energyRegenRate, clickMultiplier, lastUpdate, hasClaimedDailyCrate, lastBoostResetDate, lastSuperModeTime, loginStreak, dailyQuestsProgress, dailyQuestsClaimed, lastQuestResetTime]);

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
        let totalBaseCount = baseCount * clickMultiplier;

        // Add flat +10 multiplier if super mode is active
        if (isSuperMode) {
            totalBaseCount = totalBaseCount + 10;
        }

        let actualCount = totalBaseCount;

        setDailyQuestsProgress(prev => ({ ...prev, clicks: prev.clicks + baseCount }));

        if (!isSuperMode) {
            // 1% Chance to trigger Super Mode if not active AND 5-minute cooldown has passed
            const now = Date.now();
            const timeSinceLastSuper = now - lastSuperModeTime;
            const cooldownPassed = timeSinceLastSuper >= (5 * 60 * 1000);

            if (cooldownPassed && Math.random() < 0.05) {
                // Instantly apply the super mode bonus to this first click
                actualCount = actualCount + 10;
                setIsSuperMode(true);
                setSuperModeTimeLeft(10);
                setLastSuperModeTime(now);
                setDailyQuestsProgress(prev => ({ ...prev, superModes: prev.superModes + 1 }));
            }
        }

        setEnergy(currentEnergy => {
            if (currentEnergy < baseCount) return currentEnergy; // Not enough energy based on raw base cost

            // Increase score and calculate fractional coins (1 coin per 100 score increment)
            setScore(prevScore => {
                const newScore = prevScore + actualCount;
                // Add coins based on the exact increment
                // For a smooth experience, if actualCount > 0, we can add fractional coins internally,
                // but since coins are whole numbers, we track the crossing of hundred-boundaries
                const previousHundreds = Math.floor(prevScore / 100);
                const currentHundreds = Math.floor(newScore / 100);

                if (currentHundreds > previousHundreds) {
                    const coinsAdded = currentHundreds - previousHundreds;
                    setCoins(c => c + coinsAdded);
                }

                return newScore;
            });

            setLastUpdate(Date.now());

            // Deduct raw energy (Multiplier doesn't cost extra energy)
            return currentEnergy - baseCount;
        });

        // Return actual score added for UI overlay (floating text)
        return actualCount;
    }, [clickMultiplier, lastSuperModeTime, isSuperMode]);

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

    const claimDailyCrate = useCallback((rewardType: 'coins' | 'score' | 'super', amount: number = 0) => {
        if (hasClaimedDailyCrate) return;

        if (rewardType === 'coins') setCoins(c => c + amount);
        if (rewardType === 'score') setScore(s => s + amount);
        if (rewardType === 'super') {
            setIsSuperMode(true);
            setSuperModeTimeLeft(15); // Crate super mode lasts 15s instead of 10
            setLastSuperModeTime(Date.now());
            setDailyQuestsProgress(prev => ({ ...prev, superModes: prev.superModes + 1 }));
        }

        setEnergy(maxEnergy); // Also refills energy as a bonus
        setHasClaimedDailyCrate(true);
    }, [hasClaimedDailyCrate, maxEnergy]);

    const trackUpgradeBought = useCallback(() => {
        setDailyQuestsProgress(prev => ({ ...prev, upgrades: prev.upgrades + 1 }));
    }, []);

    const claimOfflineEarnings = useCallback(() => {
        if (!offlineEarnings) return;
        setScore(s => s + offlineEarnings.score);
        setCoins(c => c + offlineEarnings.coins);
        setOfflineEarnings(null);
    }, [offlineEarnings]);

    const spinWheel = useCallback(() => {
        if (coins < 100) return { success: false, reward: null };

        setCoins(c => c - 100);

        const rand = Math.random() * 100;
        let reward: { type: string, value: number, label: string } | null = null;

        if (rand < 0.1) {
            setCoins(c => c + 1000);
            reward = { type: 'coins', value: 1000, label: '🎰 ДЖЕКПОТ! 1,000 Монет!' };
        } else if (rand < 1.1) {
            setScore(s => s + 5000);
            reward = { type: 'score', value: 5000, label: '🔥 5,000 Сили!' };
        } else if (rand < 6.1) {
            setIsSuperMode(true);
            setSuperModeTimeLeft(15);
            setLastSuperModeTime(Date.now());
            reward = { type: 'super', value: 15, label: '⚡ Супер Режим (15с)!' };
        } else if (rand < 16.1) {
            setEnergy(maxEnergy);
            setScore(s => s + 1000);
            reward = { type: 'energy', value: 1000, label: '🔋 Повна Енергія + 1000 Сили' };
        } else if (rand < 36.1) {
            setCoins(c => c + 250);
            reward = { type: 'coins', value: 250, label: '💰 250 Монет' };
        } else if (rand < 56.1) {
            setScore(s => s + 2500);
            reward = { type: 'score', value: 2500, label: '🤌 2,500 Сили' };
        } else {
            // Nothing
            reward = { type: 'nothing', value: 0, label: '😢 Упс... Нічого' };
        }

        return { success: true, reward };
    }, [coins, maxEnergy]);

    // Calculate Next Level Progress
    const nextLevel = LEVELS.find(lvl => lvl.id === currentLevel.id + 1);
    const progressToNextLevel = nextLevel
        ? Math.min(100, Math.max(0, ((score - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100))
        : 100; // Max level reached

    return {
        score,
        coins,
        setCoins,
        energy,
        maxEnergy,
        setMaxEnergy,
        energyRegenRate,
        setEnergyRegenRate,
        clickMultiplier,
        setClickMultiplier,
        currentLevel,
        nextLevel,
        progressToNextLevel,
        handleTap,
        forceSync,
        hasClaimedDailyCrate,
        claimDailyCrate,
        isSuperMode,
        superModeTimeLeft,
        loginStreak,
        offlineEarnings,
        setOfflineEarnings,
        claimOfflineEarnings,
        dailyQuestsProgress,
        dailyQuestsClaimed,
        setDailyQuestsClaimed,
        trackUpgradeBought,
        spinWheel
    };
};

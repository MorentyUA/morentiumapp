import { useState, useEffect } from 'react';

// Use a standardized prefix for localStorage keys to avoid collisions
const STREAK_KEY = 'morentube_current_streak';
const LAST_LOGIN_KEY = 'morentube_last_login_date';

export const useStreak = () => {
    const [streak, setStreak] = useState<number>(1);
    const [hasCheckedToday, setHasCheckedToday] = useState<boolean>(false);

    useEffect(() => {
        // Prevent double-checking on StrictMode mounts
        if (hasCheckedToday) return;

        const checkStreak = () => {
            try {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

                // Get timezone-aware 'yesterday' string
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                const storedStreak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
                const lastLoginStr = localStorage.getItem(LAST_LOGIN_KEY);

                if (!lastLoginStr) {
                    // First time ever using the app or first time with this feature
                    setStreak(1);
                    localStorage.setItem(STREAK_KEY, '1');
                    localStorage.setItem(LAST_LOGIN_KEY, todayStr);
                } else if (lastLoginStr === todayStr) {
                    // Already logged in today, keep the current streak
                    setStreak(storedStreak || 1);
                } else if (lastLoginStr === yesterdayStr) {
                    // Logged in yesterday, increment the streak!
                    const newStreak = (storedStreak || 0) + 1;
                    setStreak(newStreak);
                    localStorage.setItem(STREAK_KEY, newStreak.toString());
                    localStorage.setItem(LAST_LOGIN_KEY, todayStr);
                } else {
                    // Missed a day or more, reset streak to 1
                    setStreak(1);
                    localStorage.setItem(STREAK_KEY, '1');
                    localStorage.setItem(LAST_LOGIN_KEY, todayStr);
                }

                setHasCheckedToday(true);
            } catch (err) {
                console.error("Failed to parse or save streak logic to localStorage:", err);
                setStreak(1); // Failsafe
            }
        };

        checkStreak();
    }, [hasCheckedToday]);

    // Optional manual helper if we ever need to forcefully test or manipulate the streak
    const debugResetStreak = () => {
        localStorage.removeItem(STREAK_KEY);
        localStorage.removeItem(LAST_LOGIN_KEY);
        setHasCheckedToday(false);
    };

    return {
        streak,
        debugResetStreak
    };
};

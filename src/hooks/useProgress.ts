import { useState, useEffect } from 'react';

// Key used to store the array of completed item IDs in the browser's localStorage
const PROGRESS_STORAGE_KEY = 'twa_user_progress_items';
const PROGRESS_EVENT = 'progress_updated';

export function useProgress() {
    const [completedItemIds, setCompletedItemIds] = useState<string[]>([]);

    useEffect(() => {
        const loadProgress = () => {
            try {
                const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
                if (stored) {
                    setCompletedItemIds(JSON.parse(stored));
                } else {
                    setCompletedItemIds([]);
                }
            } catch (e) {
                console.error("Failed to parse progress from localStorage", e);
                setCompletedItemIds([]);
            }
        };

        // Initial load
        loadProgress();

        // Listen for internal CustomEvent
        window.addEventListener(PROGRESS_EVENT, loadProgress);

        return () => {
            window.removeEventListener(PROGRESS_EVENT, loadProgress);
        };
    }, []);

    // Action to toggle an item's completion status
    const toggleItemCompletion = (id: string) => {
        setCompletedItemIds((prev) => {
            const updated = prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id];

            try {
                localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(updated));
                window.dispatchEvent(new Event(PROGRESS_EVENT));
            } catch (e) {
                console.error("Failed to save progress to localStorage", e);
            }

            return updated;
        });
    };

    return {
        completedItemIds,
        toggleItemCompletion,
    };
}

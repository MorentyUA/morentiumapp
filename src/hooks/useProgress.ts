import { useState, useEffect } from 'react';

// Key used to store the array of completed item IDs in the browser's localStorage
const PROGRESS_STORAGE_KEY = 'twa_user_progress_items';

export function useProgress() {
    // Initialize state from localStorage if available, otherwise empty array
    const [completedItemIds, setCompletedItemIds] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to parse progress from localStorage", e);
            return [];
        }
    });

    // Synchronize state changes back to localStorage whenever the array updates
    useEffect(() => {
        try {
            localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(completedItemIds));
        } catch (e) {
            console.error("Failed to save progress to localStorage", e);
        }
    }, [completedItemIds]);

    // Action to toggle an item's completion status
    const toggleItemCompletion = (id: string) => {
        setCompletedItemIds((prev) => {
            if (prev.includes(id)) {
                // Remove if already marked as done
                return prev.filter(itemId => itemId !== id);
            } else {
                // Add if not marked as done
                return [...prev, id];
            }
        });
    };

    return {
        completedItemIds,
        toggleItemCompletion,
    };
}

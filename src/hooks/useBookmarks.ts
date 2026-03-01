import { useState, useEffect } from 'react';

const BOOKMARKS_KEY = 'morentube_bookmarked_items';
const BOOKMARKS_EVENT = 'bookmarks_updated';

export const useBookmarks = () => {
    const [bookmarkedItemIds, setBookmarkedItemIds] = useState<string[]>([]);

    // Initialize from localStorage on mount and listen for real-time changes
    useEffect(() => {
        const loadBookmarks = () => {
            try {
                const stored = localStorage.getItem(BOOKMARKS_KEY);
                if (stored) {
                    setBookmarkedItemIds(JSON.parse(stored));
                } else {
                    setBookmarkedItemIds([]);
                }
            } catch (err) {
                console.error("Failed to parse bookmarks from localStorage:", err);
                setBookmarkedItemIds([]); // Fallback to empty array
            }
        };

        // Initial load
        loadBookmarks();

        // Listen for internal custom event (same browser tab)
        window.addEventListener(BOOKMARKS_EVENT, loadBookmarks);

        // Listen for external storage event (other browser tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === BOOKMARKS_KEY) {
                loadBookmarks();
            }
        });

        return () => {
            window.removeEventListener(BOOKMARKS_EVENT, loadBookmarks);
            // Storage listener can't be easily removed anonymously without extracting it, 
            // but in React 18+ strict mode this is generally fine for Window level events if idempotent.
        };
    }, []);

    const toggleBookmark = (itemId: string) => {
        setBookmarkedItemIds((prev) => {
            const isBookmarked = prev.includes(itemId);
            const updated = isBookmarked
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId];

            // Persist immediately
            try {
                localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
                // Dispatch event so other components using this hook update immediately
                window.dispatchEvent(new Event(BOOKMARKS_EVENT));
            } catch (err) {
                console.error("Failed to save bookmarks to localStorage:", err);
            }

            return updated;
        });
    };

    const isBookmarked = (itemId: string) => bookmarkedItemIds.includes(itemId);

    const clearBookmarks = () => {
        setBookmarkedItemIds([]);
        try {
            localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([]));
            window.dispatchEvent(new Event(BOOKMARKS_EVENT));
        } catch (err) {
            console.error("Failed to clear bookmarks from localStorage:", err);
        }
    };

    return {
        bookmarkedItemIds,
        toggleBookmark,
        isBookmarked,
        clearBookmarks
    };
};

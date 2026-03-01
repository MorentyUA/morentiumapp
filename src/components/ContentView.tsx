import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { type Category, type Item } from '../types';
import { ItemCard } from './ItemCard';
import { useTelegram } from '../hooks/useTelegram';
import { useProgress } from '../hooks/useProgress';
import { useBookmarks } from '../hooks/useBookmarks';
import { Trash2 } from 'lucide-react';

interface ContentViewProps {
    category: Category;
    items: Item[];
    onBack: () => void;
}

export const ContentView: React.FC<ContentViewProps> = ({ category, items, onBack }) => {
    const { BackButton, MainButton, HapticFeedback, tg } = useTelegram();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const { completedItemIds, toggleItemCompletion } = useProgress();
    const { clearBookmarks } = useBookmarks();

    useEffect(() => {
        try {
            BackButton.show();
            BackButton.onClick(handleBack);
        } catch (e) { }

        return () => {
            try {
                BackButton.offClick(handleBack);
                BackButton.hide();
                MainButton.hide();
            } catch (e) { }
        };
    }, []);

    const handleBack = () => {
        try { HapticFeedback.impactOccurred('light'); } catch (e) { }
        onBack();
    };

    useEffect(() => {
        const selectedItem = items.find(i => i.id === selectedItemId);
        const handleMainBtnClick = () => {
            if (selectedItem?.url) {
                try { tg.openLink(selectedItem.url); }
                catch (e) { window.open(selectedItem.url, '_blank'); }
            }
        };

        if (selectedItem && selectedItem.url) {
            try {
                MainButton.setParams({
                    text: selectedItem.type === 'youtube' ? 'ВІДКРИТИ ВІДЕО' : 'ВІДКРИТИ ПОСИЛАННЯ',
                    is_visible: true,
                });
                MainButton.onClick(handleMainBtnClick);
            } catch (e) { }
        } else {
            try { MainButton.hide(); } catch (e) { }
        }

        return () => {
            try { MainButton.offClick(handleMainBtnClick); } catch (e) { }
        }
    }, [selectedItemId, items, MainButton, tg]);

    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="min-h-screen pb-24"
        >
            <div className="relative h-56 sm:h-72 w-full">
                {category.coverImage.startsWith('bg-') ? (
                    <div className={`w-full h-full ${category.coverImage}`} />
                ) : (
                    <img src={category.coverImage} alt={category.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />

                <div className="absolute top-4 left-4 z-10 block sm:hidden">
                    <button onClick={handleBack} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80 hover:bg-black/60 hover:text-white transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 p-6 w-full">
                    <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md tracking-tight">{category.title}</h1>
                    <p className="text-slate-300 text-sm max-w-lg leading-relaxed">{category.description}</p>
                </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
                {category.id === 'bookmarks' && items.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-end mb-2"
                    >
                        <button
                            onClick={() => {
                                try { HapticFeedback.impactOccurred('medium'); } catch { }
                                if (window.confirm('Ви впевнені, що хочете видалити всі збережені матеріали?')) {
                                    clearBookmarks();
                                    onBack(); // Return to dashboard since category is now empty
                                }
                            }}
                            className="flex items-center text-sm font-semibold text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 shadow-sm"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Очистити все
                        </button>
                    </motion.div>
                )}

                {items.length === 0 ? (
                    <div className="text-center p-8 glass-card border border-white/5">
                        <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📭</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Категорія порожня</h3>
                        <p className="text-slate-400">В цій категорії ще немає контенту. Загляньте сюди пізніше!</p>
                    </div>
                ) : (
                    items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                            onClick={() => {
                                try { HapticFeedback.selectionChanged(); } catch (e) { }
                                setSelectedItemId(selectedItemId === item.id ? null : item.id);
                            }}
                            className="cursor-pointer"
                        >
                            <ItemCard
                                item={item}
                                isSelected={selectedItemId === item.id}
                                isCompleted={completedItemIds.includes(item.id)}
                                onToggleCompletion={() => {
                                    try { HapticFeedback.impactOccurred('light'); } catch { }
                                    toggleItemCompletion(item.id);
                                }}
                            />
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

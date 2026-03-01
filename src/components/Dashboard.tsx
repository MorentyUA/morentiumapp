import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Bookmark, BookOpen } from 'lucide-react';
import { type Category } from '../types';
import { CategoryCard } from './CategoryCard';
import { useStreak } from '../hooks/useStreak';

interface DashboardProps {
    categories: Category[];
    isPrivateSubscribed: boolean;
    hasBookmarks: boolean;
    hasUncompleted?: boolean;
    uncompletedCount?: number;
    onSelectCategory: (category: Category) => void;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export const Dashboard: React.FC<DashboardProps> = ({
    categories,
    isPrivateSubscribed,
    hasBookmarks,
    hasUncompleted,
    uncompletedCount,
    onSelectCategory
}) => {
    const { streak } = useStreak();

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="p-4 sm:p-6 mb-24 min-h-screen"
        >
            <div className="mb-8 pt-4 flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2 drop-shadow-md tracking-tight">
                        Відкривай
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base">Оберіть категорію, щоб переглянути преміум-контент.</p>
                </div>

                {streak > 0 && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.15)]"
                    >
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500/50 animate-pulse-slow" />
                        <span className="font-bold text-orange-400 text-sm">{streak}</span>
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {hasBookmarks && (
                    <motion.div variants={item}>
                        <div
                            onClick={() => onSelectCategory({
                                id: 'bookmarks',
                                title: 'Збережене',
                                description: 'Ваші улюблені статті та відео, збережені для швидкого доступу.',
                                coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2564&auto=format&fit=crop', // Deep vibrant red abstract paint
                                isPrivate: false
                            })}
                            className="glass-card cursor-pointer overflow-hidden group relative hover:border-red-500/50 transition-all shadow-[0_4px_20px_rgba(239,68,68,0.15)] border-red-500/20"
                        >
                            <div className="absolute top-0 right-0 p-4 z-20">
                                <div className="bg-red-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-red-500/30 flex items-center shadow-lg">
                                    <span className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center">
                                        <Bookmark className="w-4 h-4 mr-1 stroke-[1.5]" />
                                        Колекція
                                    </span>
                                </div>
                            </div>

                            <div className="h-40 relative group-hover:scale-105 transition-transform duration-500 z-0">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                <div className="w-full h-full bg-red-900/40 flex items-center justify-center">
                                    <Bookmark className="w-16 h-16 text-red-500 opacity-20" />
                                </div>
                            </div>

                            <div className="p-5 relative z-20 -mt-10 bg-gradient-to-b from-transparent to-[#0f172a]">
                                <h3 className="text-xl font-bold text-red-400 mb-2 drop-shadow-md">🔖 Ваші Збереження</h3>
                                <p className="text-slate-300 text-sm line-clamp-2">Швидкий доступ до відкладеного контенту без пошуку по категоріях.</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {hasUncompleted && (
                    <motion.div variants={item}>
                        <div
                            onClick={() => onSelectCategory({
                                id: 'uncompleted',
                                title: 'Ще не вивчено',
                                description: 'Всі матеріали, які ви ще не відмітили як пройдені, зібрані тут у зручному списку.',
                                coverImage: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?q=80&w=2564&auto=format&fit=crop', // Dark striking red texture
                                isPrivate: false
                            })}
                            className="glass-card cursor-pointer overflow-hidden group relative hover:border-emerald-500/50 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.15)] border-emerald-500/20"
                        >
                            <div className="absolute top-0 right-0 p-4 z-20">
                                <div className="bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 flex items-center shadow-lg">
                                    <span className="text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center">
                                        <BookOpen className="w-4 h-4 mr-1 stroke-[1.5]" />
                                        Залишилось: {uncompletedCount}
                                    </span>
                                </div>
                            </div>

                            <div className="h-40 relative group-hover:scale-105 transition-transform duration-500 z-0">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                <div className="w-full h-full bg-emerald-900/40 flex items-center justify-center">
                                    <BookOpen className="w-16 h-16 text-emerald-500 opacity-20" />
                                </div>
                            </div>

                            <div className="p-5 relative z-20 -mt-10 bg-gradient-to-b from-transparent to-[#0f172a]">
                                <h3 className="text-xl font-bold text-emerald-400 mb-2 drop-shadow-md">📘 Невивчене</h3>
                                <p className="text-slate-300 text-sm line-clamp-2">Новий контент та інструкції, які ви ще не пройшли.</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {categories.map(category => (
                    <motion.div key={category.id} variants={item}>
                        <CategoryCard
                            category={category}
                            isLocked={category.isPrivate && !isPrivateSubscribed}
                            onClick={() => onSelectCategory(category)}
                        />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

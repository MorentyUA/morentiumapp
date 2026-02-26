import React from 'react';
import { motion } from 'framer-motion';
import { type Category } from '../types';
import { CategoryCard } from './CategoryCard';

interface DashboardProps {
    categories: Category[];
    isPrivateSubscribed: boolean;
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

export const Dashboard: React.FC<DashboardProps> = ({ categories, isPrivateSubscribed, onSelectCategory }) => {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="p-4 sm:p-6 mb-24 min-h-screen"
        >
            <div className="mb-8 pt-4">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2 drop-shadow-md tracking-tight">
                    Відкривай
                </h1>
                <p className="text-slate-400 text-sm sm:text-base">Оберіть категорію, щоб переглянути преміум-контент.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

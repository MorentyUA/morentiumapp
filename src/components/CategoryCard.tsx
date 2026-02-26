import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Lock } from 'lucide-react';
import { type Category } from '../types';

interface CategoryCardProps {
    category: Category;
    isLocked?: boolean;
    onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, isLocked, onClick }) => {
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="glass-card cursor-pointer group relative overflow-hidden"
        >
            <div className={`relative h-48 w-full bg-slate-800 ${isLocked ? 'grayscale opacity-75' : ''}`}>
                {!imgLoaded && <div className="absolute inset-0 shimmer" />}
                <img
                    src={category.coverImage}
                    alt={category.title}
                    onLoad={() => setImgLoaded(true)}
                    className={`h-full w-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent/20" />

                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-slate-900/80 p-4 rounded-full border border-white/10 shadow-xl">
                            <Lock className="w-8 h-8 text-slate-400" />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-5 relative -mt-8">
                <h3 className={`text-2xl font-bold mb-2 transition-colors drop-shadow-md flex items-center ${isLocked ? 'text-slate-400' : 'text-white group-hover:text-blue-400'}`}>
                    {isLocked && <Lock className="w-5 h-5 mr-2 text-slate-500 shrink-0" />}
                    {category.title}
                </h3>
                <p className={`text-sm line-clamp-2 mb-4 leading-relaxed ${isLocked ? 'text-slate-500' : 'text-slate-300'}`}>
                    {category.description}
                </p>

                <div className={`flex items-center text-sm font-semibold uppercase tracking-wider ${isLocked ? 'text-slate-500' : 'text-blue-400'}`}>
                    <span>{isLocked ? 'Тільки VIP' : 'Дивитись'}</span>
                    {!isLocked && <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />}
                </div>
            </div>
        </motion.div>
    );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { type Category } from '../types';

interface CategoryCardProps {
    category: Category;
    onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="glass-card cursor-pointer group relative overflow-hidden"
        >
            <div className="relative h-48 w-full bg-slate-800">
                {!imgLoaded && <div className="absolute inset-0 shimmer" />}
                <img
                    src={category.coverImage}
                    alt={category.title}
                    onLoad={() => setImgLoaded(true)}
                    className={`h-full w-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent/20" />
            </div>

            <div className="p-5 relative -mt-8">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors drop-shadow-md">
                    {category.title}
                </h3>
                <p className="text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                    {category.description}
                </p>

                <div className="flex items-center text-blue-400 text-sm font-semibold uppercase tracking-wider">
                    <span>Explore</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
            </div>
        </motion.div>
    );
};

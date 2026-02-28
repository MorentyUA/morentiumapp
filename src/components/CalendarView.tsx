import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
import { type YoutubeVideo } from '../types';
import { useTelegram } from '../hooks/useTelegram';

interface CalendarViewProps {
    videos: YoutubeVideo[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ videos }) => {
    const { tg, HapticFeedback } = useTelegram();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => {
        let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1; // Make Monday = 0
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString('uk-UA', { month: 'long', year: 'numeric' });

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Group videos by YYYY-MM-DD
    const videosByDate = videos.reduce((acc, video) => {
        const dateStr = video.publishedAt.split('T')[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(video);
        return acc;
    }, {} as Record<string, YoutubeVideo[]>);

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const formatToDateStr = (day: number) => {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return d.toISOString().split('T')[0];
    };

    const handleDateClick = (day: number) => {
        const dateStr = formatToDateStr(day);
        if (videosByDate[dateStr] && videosByDate[dateStr].length > 0) {
            try { HapticFeedback.impactOccurred('light'); } catch (e) { }
            setSelectedDateStr(dateStr);
        }
    };

    const selectedVideos = selectedDateStr ? videosByDate[selectedDateStr] : [];

    return (
        <div className="space-y-4">
            <div className="glass-card p-4 sm:p-6 mb-6 relative">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <h2 className="text-xl font-bold text-white capitalize">{monthName}</h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
                        <div key={d} className="text-xs font-semibold text-slate-400 py-2">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {days.map((day, index) => {
                        if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;

                        const dateStr = formatToDateStr(day);
                        const dayVideos = videosByDate[dateStr] || [];
                        const hasVideos = dayVideos.length > 0;
                        const isToday = formatToDateStr(new Date().getDate()) === dateStr && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

                        return (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                key={day}
                                onClick={() => handleDateClick(day)}
                                disabled={!hasVideos}
                                className={`aspect-square relative rounded-xl flex items-center justify-center flex-col
                                    ${hasVideos ? 'bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer border border-blue-500/30' : 'bg-white/5 cursor-default'}
                                    ${isToday ? 'ring-2 ring-emerald-500' : ''}
                                `}
                            >
                                <span className={`text-sm sm:text-base font-semibold ${hasVideos ? 'text-blue-400' : 'text-slate-500'}`}>
                                    {day}
                                </span>
                                {hasVideos && (
                                    <div className="absolute bottom-1 flex space-x-0.5">
                                        {dayVideos.slice(0, 3).map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                        ))}
                                        {dayVideos.length > 3 && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full opacity-50" />}
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {selectedDateStr && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="glass-card p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                Контент за {new Date(selectedDateStr).toLocaleDateString('uk-UA')}
                                <span className="ml-3 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                    {selectedVideos.length} відео
                                </span>
                            </h3>
                            <button onClick={() => setSelectedDateStr(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {selectedVideos.map(video => {
                                const time = new Date(video.publishedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                                return (
                                    <div key={video.id} className="flex gap-4 p-3 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => {
                                            const url = `https://youtube.com/watch?v=${video.id}`;
                                            if (tg) tg.openLink(url);
                                            else window.open(url, '_blank');
                                        }}
                                    >
                                        <div className="relative w-24 h-16 sm:w-32 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-800">
                                            <img src={video.thumbnail} alt="thumb" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <Play className="w-6 h-6 text-white opacity-80" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="text-sm font-bold text-white line-clamp-2 leading-tight mb-1">{video.title}</p>
                                            <p className="text-xs font-semibold text-emerald-400">{time}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

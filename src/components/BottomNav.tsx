import React from 'react';
import { Home, Wrench, User } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

interface BottomNavProps {
    activeTab: 'dashboard' | 'tools' | 'profile';
    onChange: (tab: 'dashboard' | 'tools' | 'profile') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChange }) => {
    const { HapticFeedback } = useTelegram();

    const tabs = [
        { id: 'dashboard', label: 'Головна', icon: Home },
        { id: 'tools', label: 'Інструменти', icon: Wrench },
        { id: 'profile', label: 'Профіль', icon: User }
    ] as const;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]">
            <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-around p-2 shadow-2xl">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (!isActive) {
                                    try { HapticFeedback.impactOccurred('light'); } catch (e) { }
                                    onChange(tab.id);
                                }
                            }}
                            className={`flex flex-col items-center justify-center p-2 sm:px-8 rounded-xl transition-all duration-300 w-1/3 ${isActive ? 'text-blue-400 bg-white/5 shadow-inner' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'scale-100'}`} />
                            <span className={`text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, RefreshCw } from 'lucide-react';

interface SubscriptionGateProps {
    onRetry: () => Promise<void>;
    error?: string;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ onRetry, error }) => {
    const [isChecking, setIsChecking] = useState(false);

    const handleRetry = async () => {
        setIsChecking(true);
        await onRetry();
        setIsChecking(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#0f172a] text-white">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-panel p-8 rounded-3xl max-w-sm w-full text-center space-y-6 flex flex-col items-center border border-white/10 shadow-2xl"
            >
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                    <Lock className="w-10 h-10 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-2">Доступ закрыт</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Чтобы использовать это приложение, вы должны состоять в нашей закрытой группе.
                    </p>
                </div>
                <a
                    href={import.meta.env.VITE_INVITE_LINK || "https://t.me/morentube/183"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors block shadow-lg"
                >
                    Вступить
                </a>
                <button
                    onClick={handleRetry}
                    disabled={isChecking}
                    className="text-sm text-slate-500 hover:text-white transition-colors flex items-center justify-center space-x-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                    <span>Я уже вступил</span>
                </button>
                {error && (
                    <p className="text-xs text-red-400 mt-2 break-words max-w-full px-4 text-center">
                        Детали ошибки: {error}
                    </p>
                )}
            </motion.div>
        </div>
    );
};

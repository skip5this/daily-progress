import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

interface BottomNavProps {
    currentScreen: 'today' | 'trends';
    onNavigate: (screen: 'today' | 'trends') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 pb-8">
            <div className="flex justify-around items-center h-16">
                <button
                    onClick={() => onNavigate('today')}
                    className={clsx(
                        'flex flex-col items-center justify-center w-full h-full space-y-1',
                        currentScreen === 'today' ? 'text-blue-500' : 'text-gray-400'
                    )}
                >
                    <Calendar size={24} />
                    <span className="text-xs font-medium">Today</span>
                </button>
                <button
                    onClick={() => onNavigate('trends')}
                    className={clsx(
                        'flex flex-col items-center justify-center w-full h-full space-y-1',
                        currentScreen === 'trends' ? 'text-blue-500' : 'text-gray-400'
                    )}
                >
                    <TrendingUp size={24} />
                    <span className="text-xs font-medium">Trends</span>
                </button>
            </div>
        </nav>
    );
};

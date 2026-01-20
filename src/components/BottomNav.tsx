import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

interface BottomNavProps {
    currentScreen: 'today' | 'trends';
    onNavigate: (screen: 'today' | 'trends') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 pb-8"
            style={{
                background: 'var(--background)',
                borderTop: '1px solid var(--border)'
            }}
        >
            <div className="flex justify-around items-center h-16">
                <button
                    onClick={() => onNavigate('today')}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1"
                    style={{ color: currentScreen === 'today' ? 'var(--accent)' : 'var(--muted)' }}
                >
                    <Calendar size={24} />
                    <span className="text-xs font-medium">Today</span>
                </button>
                <button
                    onClick={() => onNavigate('trends')}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1"
                    style={{ color: currentScreen === 'trends' ? 'var(--accent)' : 'var(--muted)' }}
                >
                    <TrendingUp size={24} />
                    <span className="text-xs font-medium">Trends</span>
                </button>
            </div>
        </nav>
    );
};

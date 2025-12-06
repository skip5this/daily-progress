import React from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
    children: React.ReactNode;
    currentScreen: 'today' | 'trends';
    onNavigate: (screen: 'today' | 'trends') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentScreen, onNavigate }) => {
    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white pb-20">
            <main className="max-w-md mx-auto min-h-screen relative">
                {children}
            </main>
            <BottomNav currentScreen={currentScreen} onNavigate={onNavigate} />
        </div>
    );
};

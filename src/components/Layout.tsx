import React from 'react';
import { LogOut } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
    currentScreen: 'today' | 'trends';
    onNavigate: (screen: 'today' | 'trends') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentScreen, onNavigate }) => {
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white pb-20">
            <header className="sticky top-0 z-10 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-gray-100">Daily Progress</h1>
                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors p-2 -mr-2"
                        title={user?.email || 'Sign out'}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>
            <main className="max-w-md mx-auto min-h-screen relative">
                {children}
            </main>
            <BottomNav currentScreen={currentScreen} onNavigate={onNavigate} />
        </div>
    );
};

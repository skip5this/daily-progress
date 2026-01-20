import React from 'react';
import { LogOut } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
    currentScreen: 'today' | 'trends';
    onNavigate: (screen: 'today' | 'trends') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentScreen, onNavigate }) => {
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen pb-20" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
            <header className="sticky top-0 z-10 backdrop-blur-sm" style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Daily Progress</h1>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 text-sm transition-colors p-2 -mr-2"
                            style={{ color: 'var(--muted)' }}
                            title={user?.email || 'Sign out'}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-md mx-auto min-h-screen relative">
                {children}
            </main>
            <BottomNav currentScreen={currentScreen} onNavigate={onNavigate} />
        </div>
    );
};

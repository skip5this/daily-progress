import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { INITIAL_STATE } from '../types';
import type { AppState, DailyMetricsEntry, Workout, Settings } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AppContextType {
    state: AppState;
    updateDailyMetrics: (date: string, metrics: Partial<DailyMetricsEntry>) => void;
    addWorkout: (workout: Workout) => void;
    updateWorkout: (workout: Workout) => void;
    deleteWorkout: (workoutId: string) => void;
    updateSettings: (settings: Partial<Settings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useLocalStorage<AppState>('daily-progress-v1', INITIAL_STATE);

    // Migration: Force weight unit to 'lb' if it's currently 'kg'
    React.useEffect(() => {
        if (state.settings.weightUnitLabel === 'kg') {
            setState(prev => ({
                ...prev,
                settings: { ...prev.settings, weightUnitLabel: 'lb' }
            }));
        }
    }, [state.settings.weightUnitLabel, setState]);

    const updateDailyMetrics = (date: string, metrics: Partial<DailyMetricsEntry>) => {
        setState((prev) => {
            const currentEntry = prev.dailyMetrics[date] || { date, weight: null, steps: null };
            return {
                ...prev,
                dailyMetrics: {
                    ...prev.dailyMetrics,
                    [date]: { ...currentEntry, ...metrics },
                },
            };
        });
    };

    const addWorkout = (workout: Workout) => {
        setState((prev) => ({
            ...prev,
            workouts: [...prev.workouts, workout],
        }));
    };

    const updateWorkout = (updatedWorkout: Workout) => {
        setState((prev) => ({
            ...prev,
            workouts: prev.workouts.map((w) => (w.id === updatedWorkout.id ? updatedWorkout : w)),
        }));
    };

    const deleteWorkout = (workoutId: string) => {
        setState((prev) => ({
            ...prev,
            workouts: prev.workouts.filter((w) => w.id !== workoutId),
        }));
    };

    const updateSettings = (newSettings: Partial<Settings>) => {
        setState((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...newSettings },
        }));
    };

    return (
        <AppContext.Provider
            value={{
                state,
                updateDailyMetrics,
                addWorkout,
                updateWorkout,
                deleteWorkout,
                updateSettings,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

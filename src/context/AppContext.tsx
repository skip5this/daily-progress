import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Types matching the old structure for compatibility
export type WorkoutSet = {
    id: string;
    note: string;
};

export type Exercise = {
    id: string;
    name: string;
    sets: WorkoutSet[];
};

export type Workout = {
    id: string;
    date: string;
    name?: string;
    exercises: Exercise[];
};

export type DailyMetricsEntry = {
    date: string;
    weight: number | null;
    steps: number | null;
};

export type Settings = {
    weightUnitLabel: 'kg' | 'lb';
};

export type AppState = {
    dailyMetrics: { [date: string]: DailyMetricsEntry };
    workouts: Workout[];
    settings: Settings;
};

const DEFAULT_SETTINGS: Settings = {
    weightUnitLabel: 'lb',
};

const INITIAL_STATE: AppState = {
    dailyMetrics: {},
    workouts: [],
    settings: DEFAULT_SETTINGS,
};

interface AppContextType {
    state: AppState;
    loading: boolean;
    updateDailyMetrics: (date: string, metrics: Partial<DailyMetricsEntry>) => void;
    addWorkout: (workout: Workout) => void;
    updateWorkout: (workout: Workout) => void;
    deleteWorkout: (workoutId: string) => void;
    updateSettings: (settings: Partial<Settings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const [loading, setLoading] = useState(true);

    // Fetch all data on mount
    useEffect(() => {
        if (!user) {
            setState(INITIAL_STATE);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch profile/settings
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('weight_unit')
                    .eq('id', user.id)
                    .single();

                // Fetch daily metrics
                const { data: metricsData } = await supabase
                    .from('daily_metrics')
                    .select('*')
                    .eq('user_id', user.id);

                // Fetch workouts with exercises and sets
                const { data: workoutsData } = await supabase
                    .from('workouts')
                    .select(`
                        id,
                        date,
                        name,
                        exercises (
                            id,
                            name,
                            order_index,
                            workout_sets (
                                id,
                                note,
                                order_index
                            )
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('date', { ascending: false });

                // Transform metrics to dictionary
                const dailyMetrics: { [date: string]: DailyMetricsEntry } = {};
                metricsData?.forEach((m) => {
                    dailyMetrics[m.date] = {
                        date: m.date,
                        weight: m.weight,
                        steps: m.steps,
                    };
                });

                // Transform workouts to match old structure
                const workouts: Workout[] = (workoutsData || []).map((w) => ({
                    id: w.id,
                    date: w.date,
                    name: w.name || undefined,
                    exercises: (w.exercises || [])
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((e) => ({
                            id: e.id,
                            name: e.name,
                            sets: (e.workout_sets || [])
                                .sort((a, b) => a.order_index - b.order_index)
                                .map((s) => ({
                                    id: s.id,
                                    note: s.note,
                                })),
                        })),
                }));

                setState({
                    dailyMetrics,
                    workouts,
                    settings: {
                        weightUnitLabel: (profile?.weight_unit as 'kg' | 'lb') || 'lb',
                    },
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const updateDailyMetrics = useCallback(async (date: string, metrics: Partial<DailyMetricsEntry>) => {
        if (!user) return;

        // Optimistic update
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

        // Sync to Supabase
        const { error } = await supabase
            .from('daily_metrics')
            .upsert({
                user_id: user.id,
                date,
                weight: metrics.weight ?? state.dailyMetrics[date]?.weight ?? null,
                steps: metrics.steps ?? state.dailyMetrics[date]?.steps ?? null,
            }, {
                onConflict: 'user_id,date',
            });

        if (error) {
            console.error('Error updating metrics:', error);
        }
    }, [user, state.dailyMetrics]);

    const addWorkout = useCallback(async (workout: Workout) => {
        if (!user) return;

        // Optimistic update
        setState((prev) => ({
            ...prev,
            workouts: [...prev.workouts, workout],
        }));

        // Insert workout
        const { error: workoutError } = await supabase
            .from('workouts')
            .insert({
                id: workout.id,
                user_id: user.id,
                date: workout.date,
                name: workout.name || null,
            });

        if (workoutError) {
            console.error('Error adding workout:', workoutError);
        }
    }, [user]);

    const updateWorkout = useCallback(async (updatedWorkout: Workout) => {
        if (!user) return;

        // Optimistic update
        setState((prev) => ({
            ...prev,
            workouts: prev.workouts.map((w) => (w.id === updatedWorkout.id ? updatedWorkout : w)),
        }));

        // Update workout name
        await supabase
            .from('workouts')
            .update({ name: updatedWorkout.name || null })
            .eq('id', updatedWorkout.id);

        // Get existing exercises
        const { data: existingExercises } = await supabase
            .from('exercises')
            .select('id')
            .eq('workout_id', updatedWorkout.id);

        const existingExerciseIds = new Set(existingExercises?.map(e => e.id) || []);
        const newExerciseIds = new Set(updatedWorkout.exercises.map(e => e.id));

        // Delete removed exercises
        const exercisesToDelete = [...existingExerciseIds].filter(id => !newExerciseIds.has(id));
        if (exercisesToDelete.length > 0) {
            await supabase
                .from('exercises')
                .delete()
                .in('id', exercisesToDelete);
        }

        // Upsert exercises and sets
        for (let i = 0; i < updatedWorkout.exercises.length; i++) {
            const exercise = updatedWorkout.exercises[i];

            // Upsert exercise
            await supabase
                .from('exercises')
                .upsert({
                    id: exercise.id,
                    workout_id: updatedWorkout.id,
                    name: exercise.name,
                    order_index: i,
                });

            // Get existing sets
            const { data: existingSets } = await supabase
                .from('workout_sets')
                .select('id')
                .eq('exercise_id', exercise.id);

            const existingSetIds = new Set(existingSets?.map(s => s.id) || []);
            const newSetIds = new Set(exercise.sets.map(s => s.id));

            // Delete removed sets
            const setsToDelete = [...existingSetIds].filter(id => !newSetIds.has(id));
            if (setsToDelete.length > 0) {
                await supabase
                    .from('workout_sets')
                    .delete()
                    .in('id', setsToDelete);
            }

            // Upsert sets
            if (exercise.sets.length > 0) {
                await supabase
                    .from('workout_sets')
                    .upsert(
                        exercise.sets.map((set, j) => ({
                            id: set.id,
                            exercise_id: exercise.id,
                            note: set.note,
                            order_index: j,
                        }))
                    );
            }
        }
    }, [user]);

    const deleteWorkout = useCallback(async (workoutId: string) => {
        if (!user) return;

        // Optimistic update
        setState((prev) => ({
            ...prev,
            workouts: prev.workouts.filter((w) => w.id !== workoutId),
        }));

        // Delete from Supabase (cascade will handle exercises and sets)
        const { error } = await supabase
            .from('workouts')
            .delete()
            .eq('id', workoutId);

        if (error) {
            console.error('Error deleting workout:', error);
        }
    }, [user]);

    const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
        if (!user) return;

        // Optimistic update
        setState((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...newSettings },
        }));

        // Sync to Supabase
        if (newSettings.weightUnitLabel) {
            await supabase
                .from('profiles')
                .update({ weight_unit: newSettings.weightUnitLabel })
                .eq('id', user.id);
        }
    }, [user]);

    return (
        <AppContext.Provider
            value={{
                state,
                loading,
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

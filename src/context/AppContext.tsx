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
    customMetrics: Record<string, number | null>;
};

export type MetricDefinition = {
    id: string;
    name: string;
    orderIndex: number;
    isActive: boolean;
};

export type Settings = {
    weightUnitLabel: 'kg' | 'lb';
};

export type AppState = {
    dailyMetrics: { [date: string]: DailyMetricsEntry };
    workouts: Workout[];
    settings: Settings;
    metricDefinitions: MetricDefinition[];
};

const DEFAULT_SETTINGS: Settings = {
    weightUnitLabel: 'lb',
};

const INITIAL_STATE: AppState = {
    dailyMetrics: {},
    workouts: [],
    settings: DEFAULT_SETTINGS,
    metricDefinitions: [],
};

interface AppContextType {
    state: AppState;
    loading: boolean;
    updateDailyMetrics: (date: string, metrics: Partial<DailyMetricsEntry>) => void;
    addWorkout: (workout: Workout) => void;
    updateWorkout: (workout: Workout) => void;
    deleteWorkout: (workoutId: string) => void;
    updateSettings: (settings: Partial<Settings>) => void;
    addMetricDefinition: (name: string) => Promise<void>;
    removeMetricDefinition: (id: string) => Promise<void>;
    hasMetricData: (metricName: string) => boolean;
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

                // Fetch metric definitions
                const { data: metricDefsData } = await supabase
                    .from('metric_definitions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('order_index', { ascending: true });

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
                        customMetrics: (m.custom_metrics as Record<string, number | null>) || {},
                    };
                });

                // Transform metric definitions
                const metricDefinitions: MetricDefinition[] = (metricDefsData || []).map((md) => ({
                    id: md.id,
                    name: md.name,
                    orderIndex: md.order_index,
                    isActive: md.is_active,
                }));

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
                    metricDefinitions,
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
            const currentEntry = prev.dailyMetrics[date] || { date, weight: null, steps: null, customMetrics: {} };
            const updatedEntry = { ...currentEntry, ...metrics };
            if (metrics.customMetrics) {
                updatedEntry.customMetrics = { ...currentEntry.customMetrics, ...metrics.customMetrics };
            }
            return {
                ...prev,
                dailyMetrics: {
                    ...prev.dailyMetrics,
                    [date]: updatedEntry,
                },
            };
        });

        // Merge custom metrics
        const currentCustomMetrics = state.dailyMetrics[date]?.customMetrics || {};
        const updatedCustomMetrics = metrics.customMetrics
            ? { ...currentCustomMetrics, ...metrics.customMetrics }
            : currentCustomMetrics;

        // Sync to Supabase
        const { error } = await supabase
            .from('daily_metrics')
            .upsert({
                user_id: user.id,
                date,
                weight: metrics.weight ?? state.dailyMetrics[date]?.weight ?? null,
                steps: metrics.steps ?? state.dailyMetrics[date]?.steps ?? null,
                custom_metrics: updatedCustomMetrics,
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

    const addMetricDefinition = useCallback(async (name: string) => {
        if (!user) return;

        const newOrderIndex = state.metricDefinitions.length;
        const tempId = crypto.randomUUID();

        // Optimistic update
        setState((prev) => ({
            ...prev,
            metricDefinitions: [
                ...prev.metricDefinitions,
                { id: tempId, name, orderIndex: newOrderIndex, isActive: true },
            ],
        }));

        // Sync to Supabase
        const { data, error } = await supabase
            .from('metric_definitions')
            .insert({
                user_id: user.id,
                name,
                order_index: newOrderIndex,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding metric definition:', error);
            // Rollback on error
            setState((prev) => ({
                ...prev,
                metricDefinitions: prev.metricDefinitions.filter((md) => md.id !== tempId),
            }));
            return;
        }

        // Update with real ID from server
        if (data) {
            setState((prev) => ({
                ...prev,
                metricDefinitions: prev.metricDefinitions.map((md) =>
                    md.id === tempId ? { ...md, id: data.id } : md
                ),
            }));
        }
    }, [user, state.metricDefinitions.length]);

    const removeMetricDefinition = useCallback(async (id: string) => {
        if (!user) return;

        const metricDef = state.metricDefinitions.find((md) => md.id === id);
        if (!metricDef) return;

        // Optimistic update - remove from definitions
        setState((prev) => ({
            ...prev,
            metricDefinitions: prev.metricDefinitions.filter((md) => md.id !== id),
        }));

        // Delete from Supabase
        const { error } = await supabase
            .from('metric_definitions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error removing metric definition:', error);
            return;
        }

        // Remove metric data from all daily_metrics entries
        const metricName = metricDef.name;
        const entriesToUpdate = Object.values(state.dailyMetrics).filter(
            (entry) => entry.customMetrics && metricName in entry.customMetrics
        );

        // Update local state to remove metric data
        setState((prev) => {
            const updatedMetrics = { ...prev.dailyMetrics };
            for (const entry of entriesToUpdate) {
                const { [metricName]: _, ...remainingCustomMetrics } = entry.customMetrics;
                updatedMetrics[entry.date] = {
                    ...entry,
                    customMetrics: remainingCustomMetrics,
                };
            }
            return { ...prev, dailyMetrics: updatedMetrics };
        });

        // Update Supabase for each affected entry
        for (const entry of entriesToUpdate) {
            const { [metricName]: _, ...remainingCustomMetrics } = entry.customMetrics;
            await supabase
                .from('daily_metrics')
                .update({ custom_metrics: remainingCustomMetrics })
                .eq('user_id', user.id)
                .eq('date', entry.date);
        }
    }, [user, state.metricDefinitions, state.dailyMetrics]);

    const hasMetricData = useCallback((metricName: string): boolean => {
        // Check if "Weight" built-in metric has data
        if (metricName === 'Weight') {
            return Object.values(state.dailyMetrics).some((entry) => entry.weight !== null);
        }
        // Check custom metrics
        return Object.values(state.dailyMetrics).some(
            (entry) => entry.customMetrics && entry.customMetrics[metricName] !== null && entry.customMetrics[metricName] !== undefined
        );
    }, [state.dailyMetrics]);

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
                addMetricDefinition,
                removeMetricDefinition,
                hasMetricData,
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

export type DailyMetricsEntry = {
    date: string;        // ISO date, e.g. "2025-11-18"
    weight: number | null;
    steps: number | null;
};

export type WorkoutSet = {
    id: string;
    note: string;        // e.g. "12 x 135", "AMRAP @ BW"
};

export type Exercise = {
    id: string;
    name: string;
    sets: WorkoutSet[];
};

export type Workout = {
    id: string;
    date: string;        // ISO date
    name?: string;
    exercises: Exercise[];
};

export type Settings = {
    weightUnitLabel: "kg" | "lb";
};

export type AppState = {
    dailyMetrics: { [date: string]: DailyMetricsEntry };
    workouts: Workout[];
    settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
    weightUnitLabel: "lb",
};

export const INITIAL_STATE: AppState = {
    dailyMetrics: {},
    workouts: [],
    settings: DEFAULT_SETTINGS,
};

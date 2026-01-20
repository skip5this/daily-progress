import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';

interface WorkoutDetailScreenProps {
    workoutId: string;
    onClose: () => void;
}

export const WorkoutDetailScreen: React.FC<WorkoutDetailScreenProps> = ({ workoutId, onClose }) => {
    const { state, updateWorkout, deleteWorkout } = useApp();
    const workout = state.workouts.find((w) => w.id === workoutId);

    if (!workout) {
        return <div className="p-4" style={{ color: 'var(--foreground)' }}>Workout not found</div>;
    }

    const handleNameChange = (name: string) => {
        updateWorkout({ ...workout, name });
    };

    const handleDeleteWorkout = () => {
        if (confirm('Are you sure you want to delete this workout?')) {
            deleteWorkout(workoutId);
            onClose();
        }
    };

    const handleAddExercise = () => {
        const newExercise = {
            id: uuidv4(),
            name: '',
            sets: [],
        };
        updateWorkout({
            ...workout,
            exercises: [...workout.exercises, newExercise],
        });
    };

    const updateExercise = (exerciseId: string, updates: Partial<typeof workout.exercises[0]>) => {
        const updatedExercises = workout.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, ...updates } : ex
        );
        updateWorkout({ ...workout, exercises: updatedExercises });
    };

    const deleteExercise = (exerciseId: string) => {
        const updatedExercises = workout.exercises.filter((ex) => ex.id !== exerciseId);
        updateWorkout({ ...workout, exercises: updatedExercises });
    };

    const addSet = (exerciseId: string) => {
        const exercise = workout.exercises.find((ex) => ex.id === exerciseId);
        if (!exercise) return;

        const newSet = {
            id: uuidv4(),
            note: '',
        };

        updateExercise(exerciseId, { sets: [...exercise.sets, newSet] });
    };

    const updateSet = (exerciseId: string, setId: string, note: string) => {
        const exercise = workout.exercises.find((ex) => ex.id === exerciseId);
        if (!exercise) return;

        const updatedSets = exercise.sets.map((s) =>
            s.id === setId ? { ...s, note } : s
        );
        updateExercise(exerciseId, { sets: updatedSets });
    };

    const deleteSet = (exerciseId: string, setId: string) => {
        const exercise = workout.exercises.find((ex) => ex.id === exerciseId);
        if (!exercise) return;

        const updatedSets = exercise.sets.filter((s) => s.id !== setId);
        updateExercise(exerciseId, { sets: updatedSets });
    };

    return (
        <div className="p-4 pb-24 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onClose}
                    className="p-2 -ml-2 rounded-full transition-colors"
                    style={{ color: 'var(--muted)' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="text-center">
                    <h2 className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                        {format(parseISO(workout.date), 'MMM d, yyyy')}
                    </h2>
                </div>
                <button
                    onClick={handleDeleteWorkout}
                    className="p-2 -mr-2 rounded-full transition-colors"
                    style={{ color: 'var(--muted)' }}
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Workout Name */}
            <div>
                <Input
                    value={workout.name || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Workout Name (Optional)"
                    className="text-lg font-bold bg-transparent border-none focus:ring-0"
                    style={{ color: 'var(--foreground)', paddingLeft: '1rem' }}
                />
            </div>

            {/* Exercises */}
            <div className="space-y-6">
                {workout.exercises.map((exercise) => (
                    <Card key={exercise.id} className="relative group">
                        <div className="flex items-center mb-4 gap-4 group/header">
                            <Input
                                value={exercise.name}
                                onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                                placeholder="Exercise Name"
                                className="font-semibold bg-transparent border-none focus:ring-0 w-full text-base"
                                style={{ color: 'var(--foreground)', paddingLeft: '1rem' }}
                            />
                            <button
                                onClick={() => deleteExercise(exercise.id)}
                                className="w-8 h-8 flex items-center justify-center transition-colors flex-shrink-0"
                                style={{ color: 'var(--muted)' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {exercise.sets.map((set, index) => (
                                <div key={set.id} className="flex items-center gap-4 group/set">
                                    <span
                                        className="text-xs w-4 text-center"
                                        style={{ color: 'var(--muted)' }}
                                    >
                                        {index + 1}
                                    </span>
                                    <Input
                                        value={set.note}
                                        onChange={(e) => updateSet(exercise.id, set.id, e.target.value)}
                                        placeholder="Set details (e.g. 12 x 135)"
                                        className="w-full py-1.5 text-base border-transparent"
                                        style={{ color: 'var(--foreground)' }}
                                    />
                                    <button
                                        onClick={() => deleteSet(exercise.id, set.id)}
                                        className="w-8 h-8 flex items-center justify-center opacity-0 pointer-events-none group-focus-within/set:opacity-100 group-focus-within/set:pointer-events-auto group-hover/set:opacity-100 group-hover/set:pointer-events-auto transition-opacity"
                                        style={{ color: 'var(--muted)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addSet(exercise.id)}
                                className="flex items-center gap-4 text-xs mt-2 py-1.5 pl-2 pr-2.5 -ml-2 rounded-full transition-all hover:bg-[var(--muted-bg)] active:bg-[var(--border)] active:scale-95"
                                style={{ color: 'var(--accent)' }}
                            >
                                <span className="w-4 flex justify-center">
                                    <Plus size={14} />
                                </span>
                                Add Set
                            </button>
                        </div>
                    </Card>
                ))}

                <Button onClick={handleAddExercise} variant="secondary" className="w-full flex items-center justify-center gap-2">
                    <Plus size={18} />
                    Add Exercise
                </Button>
            </div>
        </div>
    );
};

import { useState } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Dumbbell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { v4 as uuidv4 } from 'uuid';

interface TodayScreenProps {
    onOpenWorkout: (workoutId: string) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ onOpenWorkout }) => {
    const { state, updateDailyMetrics, addWorkout } = useApp();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const currentDateMetrics = state.dailyMetrics[selectedDate] || { weight: '', steps: '' };
    const currentWorkouts = state.workouts.filter((w) => w.date === selectedDate);

    const handleDateChange = (days: number) => {
        const newDate = addDays(parseISO(selectedDate), days);
        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    };

    const handleMetricChange = (metric: 'weight' | 'steps', value: string) => {
        const numValue = value === '' ? null : Number(value);
        updateDailyMetrics(selectedDate, { [metric]: numValue });
    };

    const handleAddWorkout = () => {
        const newWorkout = {
            id: uuidv4(),
            date: selectedDate,
            exercises: [],
        };
        addWorkout(newWorkout);
        onOpenWorkout(newWorkout.id);
    };

    return (
        <div className="p-4 space-y-6">
            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-gray-800 rounded-full">
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <h2 className="text-lg font-bold text-white">
                        {isSameDay(parseISO(selectedDate), new Date()) ? 'Today' : format(parseISO(selectedDate), 'MMM d, yyyy')}
                    </h2>
                    <p className="text-xs text-gray-400">{format(parseISO(selectedDate), 'EEEE')}</p>
                </div>
                <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-gray-800 rounded-full">
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Daily Metrics */}
            <Card title="Daily Metrics">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={`Weight (${state.settings.weightUnitLabel})`}
                        type="number"
                        placeholder="0.0"
                        value={currentDateMetrics.weight ?? ''}
                        onChange={(e) => handleMetricChange('weight', e.target.value)}
                    />
                    <Input
                        label="Steps"
                        type="number"
                        placeholder="0"
                        value={currentDateMetrics.steps ?? ''}
                        onChange={(e) => handleMetricChange('steps', e.target.value)}
                    />
                </div>
            </Card>

            {/* Workouts */}
            <Card
                title="Workouts"
                action={
                    <Button size="sm" variant="ghost" onClick={handleAddWorkout}>
                        <Plus size={16} />
                    </Button>
                }
            >
                {currentWorkouts.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <p className="text-sm mb-3">No workouts logged</p>
                        <Button variant="secondary" size="sm" onClick={handleAddWorkout}>
                            Add Workout
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {currentWorkouts.map((workout) => (
                            <button
                                key={workout.id}
                                onClick={() => onOpenWorkout(workout.id)}
                                className="w-full flex items-center p-3 bg-[#1a1a1a] rounded-lg hover:bg-gray-800 transition-colors text-left group"
                            >
                                <div className="p-2 bg-blue-500/10 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors">
                                    <Dumbbell size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-200">
                                        {workout.name || 'Untitled Workout'}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        {workout.exercises.length} exercises
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

import { useState, useRef, useEffect } from 'react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { Plus, Dumbbell } from 'lucide-react';
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

    // Generate dates for the timeline (past 14 days + next 7 days)
    const timelineDates = Array.from({ length: 22 }, (_, i) => {
        const d = subDays(new Date(), 14 - i);
        return format(d, 'yyyy-MM-dd');
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (todayRef.current) {
            todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
        }
    }, []);

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
    };

    return (
        <div className="p-4 space-y-6">
            {/* Date Timeline */}
            <div ref={scrollContainerRef} className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-2 no-scrollbar">
                {timelineDates.map((dateStr) => {
                    const date = parseISO(dateStr);
                    const isSelected = dateStr === selectedDate;
                    const isToday = isSameDay(date, new Date());

                    return (
                        <button
                            key={dateStr}
                            ref={isToday ? todayRef : null}
                            onClick={() => handleDateSelect(dateStr)}
                            className={`flex flex-col items-center justify-center min-w-[60px] h-[70px] rounded-xl transition-all ${isSelected
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'text-gray-400 hover:bg-[#2a2a2a]'
                                } ${isToday && !isSelected ? 'border border-blue-500/30' : ''}`}
                        >
                            <span className="text-xs font-medium mb-1">{format(date, 'EEE')}</span>
                            <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                {format(date, 'd')}
                            </span>
                            {isToday && (
                                <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                            )}
                        </button>
                    );
                })}
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

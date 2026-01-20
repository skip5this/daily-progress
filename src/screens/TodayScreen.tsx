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
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    useEffect(() => {
        if (todayRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const element = todayRef.current;

            // Calculate scroll position to align right edge + 16px offset
            const scrollLeft = element.offsetLeft + element.offsetWidth - container.clientWidth + 16;

            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    }, []);

    const handleDateSelect = (date: string) => {
        if (!isDragging) {
            setSelectedDate(date);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div className="px-4 pt-6 pb-4 space-y-4">
            {/* Date Timeline */}
            <div
                ref={scrollContainerRef}
                className={`flex overflow-x-auto py-4 -mx-4 px-4 space-x-2 no-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {timelineDates.map((dateStr) => {
                    const date = parseISO(dateStr);
                    const isSelected = dateStr === selectedDate;
                    const isToday = isSameDay(date, new Date());

                    const hasData = (state.dailyMetrics[dateStr] && (state.dailyMetrics[dateStr].weight || state.dailyMetrics[dateStr].steps)) ||
                        state.workouts.some(w => w.date === dateStr);

                    return (
                        <button
                            key={dateStr}
                            ref={isToday ? todayRef : null}
                            onClick={() => handleDateSelect(dateStr)}
                            className="flex flex-col items-center justify-start pt-3 min-w-[60px] h-[80px] rounded-xl transition-all"
                            style={{
                                background: isSelected ? 'var(--accent)' : 'transparent',
                                color: isSelected ? '#1a1a1a' : 'var(--muted)',
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                border: isToday && !isSelected ? '1px solid var(--border)' : 'none',
                            }}
                        >
                            <span className="text-xs font-medium mb-1">{format(date, 'EEE')}</span>
                            <span
                                className="text-lg font-bold"
                                style={{ color: isSelected ? '#1a1a1a' : 'var(--foreground)' }}
                            >
                                {format(date, 'd')}
                            </span>
                            {hasData ? (
                                <div
                                    className="w-1 h-1 rounded-full mt-1"
                                    style={{ background: isSelected ? '#1a1a1a' : 'var(--accent)' }}
                                />
                            ) : null}
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
                    <div className="text-center py-6" style={{ color: 'var(--muted)' }}>
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
                                className="w-full flex items-center p-3 rounded-lg transition-colors text-left group"
                                style={{
                                    background: 'var(--muted-bg)',
                                }}
                            >
                                <div
                                    className="p-2 rounded-lg mr-3 transition-colors"
                                    style={{ background: 'var(--card-hover)' }}
                                >
                                    <Dumbbell size={20} style={{ color: 'var(--accent)' }} />
                                </div>
                                <div>
                                    <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>
                                        {workout.name || 'Untitled Workout'}
                                    </h4>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
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

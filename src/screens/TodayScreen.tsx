import { useState, useRef, useEffect } from 'react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { Plus, Dumbbell, Pencil, Check, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { v4 as uuidv4 } from 'uuid';

interface TodayScreenProps {
    onOpenWorkout: (workoutId: string) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ onOpenWorkout }) => {
    const { state, updateDailyMetrics, addWorkout, addMetricDefinition, removeMetricDefinition, hasMetricData } = useApp();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isEditMode, setIsEditMode] = useState(false);
    const [newMetricName, setNewMetricName] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [metricToDelete, setMetricToDelete] = useState<{ id: string; name: string } | null>(null);

    const currentDateMetrics = state.dailyMetrics[selectedDate] || { weight: null, steps: null, customMetrics: {} };
    const currentWorkouts = state.workouts.filter((w) => w.date === selectedDate);

    const handleMetricChange = (metricName: string, value: string) => {
        const numValue = value === '' ? null : Number(value);
        if (metricName === 'Weight') {
            updateDailyMetrics(selectedDate, { weight: numValue });
        } else {
            updateDailyMetrics(selectedDate, {
                customMetrics: { [metricName]: numValue },
            });
        }
    };

    const handleAddMetric = async () => {
        const trimmedName = newMetricName.trim();
        if (!trimmedName) return;
        // Check if name already exists
        if (state.metricDefinitions.some((md) => md.name.toLowerCase() === trimmedName.toLowerCase())) {
            return;
        }
        await addMetricDefinition(trimmedName);
        setNewMetricName('');
    };

    const handleDeleteMetric = (id: string, name: string) => {
        if (hasMetricData(name)) {
            setMetricToDelete({ id, name });
            setDeleteModalOpen(true);
        } else {
            removeMetricDefinition(id);
        }
    };

    const handleConfirmDelete = async () => {
        if (metricToDelete) {
            await removeMetricDefinition(metricToDelete.id);
            setMetricToDelete(null);
            setDeleteModalOpen(false);
        }
    };

    const getMetricValue = (metricName: string): number | null => {
        if (metricName === 'Weight') {
            return currentDateMetrics.weight;
        }
        return currentDateMetrics.customMetrics?.[metricName] ?? null;
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

                    const metricsEntry = state.dailyMetrics[dateStr];
                    const hasCustomMetricData = metricsEntry?.customMetrics && Object.values(metricsEntry.customMetrics).some(v => v !== null);
                    const hasData = (metricsEntry && (metricsEntry.weight || metricsEntry.steps || hasCustomMetricData)) ||
                        state.workouts.some(w => w.date === dateStr);

                    return (
                        <button
                            key={dateStr}
                            ref={isToday ? todayRef : null}
                            onClick={() => handleDateSelect(dateStr)}
                            className={`flex flex-col items-center justify-start pt-3 min-w-[60px] h-[80px] rounded-xl transition-all ${isSelected
                                ? 'text-primary-950 bg-primary-200 scale-105'
                                : 'text-gray-400 hover:bg-gray-800'
                                } ${isToday && !isSelected ? 'border border-gray-700' : ''}`}
                        >
                            <span className="text-xs font-medium mb-1">{format(date, 'EEE')}</span>
                            <span className={`text-lg font-bold ${isSelected ? 'text-primary-950' : 'text-gray-200'}`}>
                                {format(date, 'd')}
                            </span>
                            {hasData ? (
                                <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-primary-900' : 'bg-primary-200'}`} />
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {/* Daily Metrics */}
            <Card
                title="Daily Metrics"
                action={
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditMode(!isEditMode)}
                    >
                        {isEditMode ? <Check size={16} /> : <Pencil size={16} />}
                    </Button>
                }
            >
                <div className="space-y-3">
                    {isEditMode && (
                        <div className="flex items-end gap-3 pb-2 border-b border-gray-800">
                            <div className="flex-1">
                                <Input
                                    label="New metric"
                                    type="text"
                                    placeholder="Metric name..."
                                    value={newMetricName}
                                    onChange={(e) => setNewMetricName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddMetric();
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleAddMetric}
                                disabled={!newMetricName.trim()}
                                className="mb-0.5"
                            >
                                <Plus size={16} />
                            </Button>
                        </div>
                    )}
                    {state.metricDefinitions.map((metric) => (
                        <div key={metric.id} className="flex items-center gap-3">
                            <div className="flex-1">
                                <Input
                                    label={metric.name === 'Weight' ? `Weight (${state.settings.weightUnitLabel})` : metric.name}
                                    type="number"
                                    placeholder="0"
                                    value={getMetricValue(metric.name) ?? ''}
                                    onChange={(e) => handleMetricChange(metric.name, e.target.value)}
                                    disabled={isEditMode}
                                />
                            </div>
                            {isEditMode && (
                                <button
                                    onClick={() => handleDeleteMetric(metric.id, metric.name)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors mt-5"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                    {state.metricDefinitions.length === 0 && !isEditMode && (
                        <p className="text-gray-500 text-sm text-center py-4">
                            No metrics configured. Tap the pencil to add one.
                        </p>
                    )}
                </div>
            </Card>

            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                metricName={metricToDelete?.name || ''}
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setMetricToDelete(null);
                }}
            />

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
                                className="w-full flex items-center p-3 bg-[#1a1a1a] rounded-lg hover:bg-primary-900/20 transition-colors text-left group"
                            >
                                <div className="p-2 bg-gray-800 rounded-lg mr-3 group-hover:bg-gray-700 transition-colors">
                                    <Dumbbell size={20} className="text-primary-200" />
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

import { useState, useRef, useEffect, useMemo } from 'react';
import { format, isSameDay, parseISO, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, min, subWeeks } from 'date-fns';
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

    // Generate weeks based on data range
    const weeks = useMemo(() => {
        const today = new Date();
        const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

        // Find oldest date with data
        const allDates = [
            ...Object.keys(state.dailyMetrics),
            ...state.workouts.map(w => w.date)
        ].filter(Boolean).map(d => parseISO(d));

        // Default to 8 weeks back if no data, otherwise 1 week before oldest data
        const oldestDate = allDates.length > 0
            ? min(allDates)
            : subWeeks(today, 8);

        const oldestWeekStart = subWeeks(startOfWeek(oldestDate, { weekStartsOn: 1 }), 1);

        // Calculate number of weeks from oldest to current + 2 future weeks
        const futureWeekEnd = endOfWeek(addWeeks(currentWeekStart, 2), { weekStartsOn: 1 });

        const allWeeks: Date[][] = [];
        let weekStart = oldestWeekStart;

        while (weekStart <= futureWeekEnd) {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
            allWeeks.push(daysInWeek);
            weekStart = addWeeks(weekStart, 1);
        }

        return allWeeks;
    }, [state.dailyMetrics, state.workouts]);

    // Find current week index
    const currentWeekIndex = useMemo(() => {
        const today = new Date();
        return weeks.findIndex(week =>
            week.some(day => isSameDay(day, today))
        );
    }, [weeks]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftStart, setScrollLeftStart] = useState(0);
    const [hasDragged, setHasDragged] = useState(false);
    const [visibleWeekIndex, setVisibleWeekIndex] = useState(currentWeekIndex);

    // Get month name from the Monday of the visible week
    const visibleMonth = useMemo(() => {
        if (weeks.length === 0 || visibleWeekIndex < 0 || visibleWeekIndex >= weeks.length) {
            return format(new Date(), 'MMMM');
        }
        const monday = weeks[visibleWeekIndex][0];
        return format(monday, 'MMMM');
    }, [weeks, visibleWeekIndex]);

    // Scroll to current week on mount
    useEffect(() => {
        if (scrollContainerRef.current && currentWeekIndex >= 0) {
            const container = scrollContainerRef.current;
            const weekWidth = container.clientWidth;
            container.scrollLeft = currentWeekIndex * weekWidth;
            setVisibleWeekIndex(currentWeekIndex);
        }
    }, [currentWeekIndex, weeks.length]);

    // Track visible week on scroll
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const weekWidth = container.clientWidth;
        const newIndex = Math.round(container.scrollLeft / weekWidth);
        if (newIndex !== visibleWeekIndex && newIndex >= 0 && newIndex < weeks.length) {
            setVisibleWeekIndex(newIndex);
        }
    };

    const snapToNearestWeek = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const weekWidth = container.clientWidth;
        const targetScroll = Math.round(container.scrollLeft / weekWidth) * weekWidth;
        container.style.scrollSnapType = 'none';
        container.scrollTo({ left: targetScroll, behavior: 'smooth' });
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
            }
        }, 300);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        // Disable snap while dragging
        scrollContainerRef.current.style.scrollSnapType = 'none';
        setIsDragging(true);
        setHasDragged(false);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeftStart(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            if (hasDragged) {
                snapToNearestWeek();
            } else if (scrollContainerRef.current) {
                scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
            }
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            if (hasDragged) {
                snapToNearestWeek();
            } else if (scrollContainerRef.current) {
                scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const diff = Math.abs(x - startX);
        // Only count as drag if moved more than 5px
        if (diff > 5) {
            e.preventDefault();
            setHasDragged(true);
            const walk = (x - startX) * 2;
            scrollContainerRef.current.scrollLeft = scrollLeftStart - walk;
        }
    };

    const handleDateSelect = (date: string) => {
        if (!hasDragged) {
            setSelectedDate(date);
        }
    };

    return (
        <div className="px-4 pt-6 pb-4 space-y-4">
            {/* Month Label */}
            <div className="text-sm font-medium text-gray-400 -mb-2">
                {visibleMonth}
            </div>

            {/* Week Timeline */}
            <div
                ref={scrollContainerRef}
                className={`flex overflow-x-auto no-scrollbar snap-x snap-mandatory ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {weeks.map((week, weekIndex) => (
                    <div
                        key={weekIndex}
                        className="flex-shrink-0 w-full flex justify-between px-1 pt-4 pb-2 snap-start"
                    >
                        {week.map((date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isSelected = dateStr === selectedDate;
                            const isToday = isSameDay(date, new Date());

                            const hasWorkout = state.workouts.some(w => w.date === dateStr);

                            return (
                                <div key={dateStr} className="flex flex-col items-center flex-1 mx-0.5">
                                    <button
                                        onClick={() => handleDateSelect(dateStr)}
                                        className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all ${isSelected
                                            ? 'text-primary-950 bg-primary-200'
                                            : 'text-gray-400 hover:bg-gray-800'
                                            } ${isToday && !isSelected ? 'border border-gray-700' : ''}`}
                                    >
                                        <span className="text-xs font-medium mb-0.5">{format(date, 'EEE')}</span>
                                        <span className={`text-lg font-bold ${isSelected ? 'text-primary-950' : 'text-gray-200'}`}>
                                            {format(date, 'd')}
                                        </span>
                                    </button>
                                    <div className="h-5 flex items-end justify-center pb-1">
                                        {hasWorkout && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-200" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
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
                        <div className="flex items-end gap-3 pb-3 mb-1 border-b border-gray-800">
                            <div className="flex-1">
                                <div className="flex flex-col space-y-1 w-full">
                                    <label className="text-xs text-white font-medium">Add new metric</label>
                                    <input
                                        type="text"
                                        placeholder="Metric name..."
                                        value={newMetricName}
                                        onChange={(e) => setNewMetricName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddMetric();
                                            }
                                        }}
                                        className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddMetric}
                                disabled={!newMetricName.trim()}
                                className="w-10 h-[42px] flex items-center justify-center bg-primary text-primary-foreground rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    )}
                    {state.metricDefinitions.map((metric) => (
                        <div key={metric.id} className="flex items-end gap-3">
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
                                <div className="w-10 h-[42px] flex items-center justify-center">
                                    <button
                                        onClick={() => handleDeleteMetric(metric.id, metric.name)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
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

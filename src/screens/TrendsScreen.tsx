import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, parseISO, format, isAfter } from 'date-fns';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';

type Timeframe = '30' | '90' | 'all';

const CHART_COLORS = [
    '#C9F2D0', // primary green
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f97316', // orange
];

export const TrendsScreen: React.FC = () => {
    const { state } = useApp();
    const [timeframe, setTimeframe] = useState<Timeframe>('30');

    const chartData = useMemo(() => {
        const entries = Object.values(state.dailyMetrics)
            .sort((a, b) => a.date.localeCompare(b.date));

        if (timeframe === 'all') return entries;

        const cutoffDate = subDays(new Date(), Number(timeframe));
        return entries.filter((entry) => isAfter(parseISO(entry.date), cutoffDate));
    }, [state.dailyMetrics, timeframe]);

    const formatDateTick = (dateStr: string) => {
        return format(parseISO(dateStr), 'MMM d');
    };

    const getMetricData = (metricName: string) => {
        if (metricName === 'Weight') {
            return chartData.map((entry) => ({
                date: entry.date,
                value: entry.weight,
            }));
        }
        return chartData.map((entry) => ({
            date: entry.date,
            value: entry.customMetrics?.[metricName] ?? null,
        }));
    };

    const hasMetricData = (metricName: string) => {
        const data = getMetricData(metricName);
        return data.some((d) => d.value !== null);
    };

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Trends</h2>
                <div className="flex bg-[#2a2a2a] rounded-lg p-1">
                    {(['30', '90', 'all'] as Timeframe[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeframe === tf
                                ? 'bg-primary text-primary-foreground'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {tf === 'all' ? 'All' : `${tf} Days`}
                        </button>
                    ))}
                </div>
            </div>

            {state.metricDefinitions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p>No metrics configured yet.</p>
                    <p className="text-sm mt-1">Add metrics from the Today screen to see trends.</p>
                </div>
            ) : (
                state.metricDefinitions.map((metric, index) => {
                    const metricData = getMetricData(metric.name);
                    const chartColor = CHART_COLORS[index % CHART_COLORS.length];
                    const title = metric.name === 'Weight'
                        ? `Weight (${state.settings.weightUnitLabel})`
                        : metric.name;

                    return (
                        <Card key={metric.id} title={title}>
                            <div className="h-64 w-full">
                                {hasMetricData(metric.name) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={metricData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDateTick}
                                                stroke="#666"
                                                tick={{ fontSize: 12 }}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                stroke="#666"
                                                tick={{ fontSize: 12 }}
                                                width={40}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                                labelFormatter={(label) => format(parseISO(label), 'MMM d, yyyy')}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke={chartColor}
                                                strokeWidth={2}
                                                dot={{ r: 3, fill: chartColor }}
                                                activeDot={{ r: 6 }}
                                                connectNulls
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                        No {metric.name.toLowerCase()} data available
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })
            )}
        </div>
    );
};

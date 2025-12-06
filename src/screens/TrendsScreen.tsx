import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, parseISO, format, isAfter } from 'date-fns';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';

type Timeframe = '30' | '90' | 'all';

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
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {tf === 'all' ? 'All' : `${tf} Days`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weight Chart */}
            <Card title={`Weight (${state.settings.weightUnitLabel})`}>
                <div className="h-64 w-full">
                    {chartData.filter(d => d.weight !== null).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
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
                                    width={30}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                    labelFormatter={(label) => format(parseISO(label), 'MMM d, yyyy')}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#3b82f6' }}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                            No weight data available
                        </div>
                    )}
                </div>
            </Card>

            {/* Steps Chart */}
            <Card title="Steps">
                <div className="h-64 w-full">
                    {chartData.filter(d => d.steps !== null).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDateTick}
                                    stroke="#666"
                                    tick={{ fontSize: 12 }}
                                    minTickGap={30}
                                />
                                <YAxis
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
                                    dataKey="steps"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#10b981' }}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                            No steps data available
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

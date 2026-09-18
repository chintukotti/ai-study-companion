import React from 'react';
import { useMastery } from '@/hooks/useMastery';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export const ConceptMasteryChart = ({ projectId }: { projectId: string }) => {
  const { data: masteryData, isLoading } = useMastery(projectId);

  if (isLoading) {
    return <Skeleton className="w-full h-[300px] rounded-xl" />;
  }

  if (!masteryData || masteryData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">Complete some quizzes to see mastery data</p>
      </div>
    );
  }

  const getColor = (value: number) => {
    if (value <= 30) return '#EF4444'; // red-500
    if (value <= 60) return '#F97316'; // orange-500
    return '#22C55E'; // green-500
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          <p className="text-sm font-bold" style={{ color: getColor(data.mastery) }}>
            Mastery: {data.mastery}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Attempts: {data.attempts}</p>
        </div>
      );
    }
    return null;
  };

  const chartData = (masteryData || []).map((m: any) => ({
    conceptName: m.conceptName || m.concept?.name || m.name || 'General',
    mastery: Math.round(Number(m.mastery ?? m.mastery_level ?? 0)),
    attempts: m.attempts ?? m.total_attempts ?? 0,
  }));

  return (
    <div className="w-full h-[300px] bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Concept Mastery</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
          <XAxis 
            dataKey="conceptName" 
            tick={{ fontSize: 10, fill: '#6B7280' }} 
            angle={-45} 
            textAnchor="end" 
            height={60} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: '#6B7280' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
          <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
            {chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.mastery)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

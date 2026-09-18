import React from 'react';
import { useGrowth } from '@/hooks/useMastery';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export const GrowthGraph = ({ projectId }: { projectId: string }) => {
  const { data: growthData, isLoading } = useGrowth(projectId);

  if (isLoading) {
    return <Skeleton className="w-full h-[300px] rounded-xl" />;
  }

  if (!growthData || growthData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">Study more to see your growth over time</p>
      </div>
    );
  }

  const formattedData = (growthData || []).map((d: any, idx: number) => {
    const rawDate = d.created_at || d.date;
    let label = `Check ${idx + 1}`;
    if (rawDate) {
      try {
        label = format(new Date(rawDate), 'MMM d, h:mm a');
      } catch {}
    }
    return {
      ...d,
      dateFormatted: label,
      mastery: Math.round(Number(d.overall_mastery ?? d.mastery ?? 0)),
    };
  });

  return (
    <div className="w-full h-[300px] bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Overall Growth</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="dateFormatted" 
            tick={{ fontSize: 10, fill: '#6B7280' }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: '#6B7280' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}
            itemStyle={{ color: '#111827', fontSize: '14px', fontWeight: 'bold' }}
            formatter={(value: any) => [`${value}%`, 'Mastery']}
          />
          <Area 
            type="monotone" 
            dataKey="mastery" 
            stroke="#3B82F6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorMastery)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

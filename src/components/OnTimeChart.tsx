import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { OnTimeDataPoint } from '../types';

interface OnTimeChartProps {
  data: OnTimeDataPoint[];
}

export const OnTimeChart: React.FC<OnTimeChartProps> = ({ data }) => {
  // Format data for chart
  const chartData = data.map(point => ({
    time: new Date(point.time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    'On-Time %': point.onTimePercentage,
    'Total Arrivals': point.totalArrivals,
  }));

  return (
    <div className="vx-card p-6">
      <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--vx-text)' }}>
        On-Time Performance % per Hour
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--vx-border)" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            stroke="var(--vx-text-muted)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'var(--vx-text-muted)' }}
          />
          <YAxis 
            stroke="var(--vx-text-muted)"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            tick={{ fill: 'var(--vx-text-muted)' }}
            label={{ value: 'On-Time %', angle: -90, position: 'insideLeft', fill: 'var(--vx-text-muted)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--vx-surface)', 
              border: '1px solid var(--vx-border)',
              borderRadius: '8px',
              color: 'var(--vx-text)',
            }}
            labelStyle={{ color: 'var(--vx-text)' }}
          />
          <Legend wrapperStyle={{ color: 'var(--vx-text-muted)' }} />
          <Bar 
            dataKey="On-Time %" 
            fill="var(--vx-green)" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


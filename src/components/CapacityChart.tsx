import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CapacityDataPoint } from '../types';

interface CapacityChartProps {
  data: CapacityDataPoint[];
}

export const CapacityChart: React.FC<CapacityChartProps> = ({ data }) => {
  // Format data for chart
  const chartData = data.map(point => ({
    time: new Date(point.time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    utilization: point.utilization,
  }));

  return (
    <div className="vx-card p-6">
      <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--vx-text)' }}>
        Hourly Capacity Utilization %
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
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
            label={{ value: 'Utilization %', angle: -90, position: 'insideLeft', fill: 'var(--vx-text-muted)' }}
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
          <Line 
            type="monotone" 
            dataKey="utilization" 
            stroke="var(--vx-primary)" 
            strokeWidth={2}
            dot={{ fill: 'var(--vx-primary)', r: 4 }}
            name="Capacity Utilization %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


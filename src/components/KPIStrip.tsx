import React from 'react';
import { KPIValues } from '../types';

interface KPIStripProps {
  kpis: KPIValues;
}

export const KPIStrip: React.FC<KPIStripProps> = ({ kpis }) => {
  const kpiCards = [
    {
      label: 'Average Headway',
      value: `${kpis.averageHeadway.toFixed(1)} min`,
      icon: '⏱️',
      valueColor: 'var(--vx-primary)',
      borderColor: 'var(--vx-primary)',
    },
    {
      label: 'Trains in Service',
      value: kpis.trainsInService.toString(),
      icon: '🚇',
      valueColor: 'var(--vx-green)',
      borderColor: 'var(--vx-green)',
    },
    {
      label: 'On-Time Performance',
      value: `${kpis.overallOnTimePerformance.toFixed(1)}%`,
      icon: '✅',
      valueColor: 'var(--vx-purple)',
      borderColor: 'var(--vx-purple)',
    },
    {
      label: 'Average Load',
      value: `${kpis.averageLoad.toFixed(1)}%`,
      icon: '📊',
      valueColor: 'var(--vx-orange)',
      borderColor: 'var(--vx-orange)',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => (
        <div
          key={index}
          className="vx-stat-tile"
          style={{
            borderLeft: `4px solid ${card.borderColor}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{card.icon}</span>
            <span 
              className="text-3xl font-bold tracking-tight"
              style={{ color: card.valueColor }}
            >
              {card.value}
            </span>
          </div>
          <div className="vx-stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
};


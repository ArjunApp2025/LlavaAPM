import React, { useState, useMemo } from 'react';
import { Train, FilterState } from '../types';
import { getTrainLoadPercentage } from '../mockData';

interface TrainTableProps {
  trains: Train[];
  filters: FilterState;
}

type SortField = 'load' | 'eta' | null;
type SortDirection = 'asc' | 'desc';

export const TrainTable: React.FC<TrainTableProps> = ({ trains, filters }) => {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter trains
  const filteredTrains = useMemo(() => {
    let filtered = [...trains];

    if (filters.direction !== 'All') {
      filtered = filtered.filter(t => t.direction === filters.direction);
    }

    if (filters.segment !== 'All') {
      filtered = filtered.filter(t => t.currentSegment === filters.segment);
    }

    return filtered;
  }, [trains, filters]);

  // Sort trains
  const sortedTrains = useMemo(() => {
    if (!sortField) return filteredTrains;

    const sorted = [...filteredTrains].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      if (sortField === 'load') {
        aValue = getTrainLoadPercentage(a);
        bValue = getTrainLoadPercentage(b);
      } else {
        aValue = a.etaToNextStop;
        bValue = b.etaToNextStop;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [filteredTrains, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getStatusColor = (status: string) => {
    if (status === 'On Time') return 'var(--vx-green)';
    return 'var(--vx-red)';
  };

  const getLoadColor = (load: number) => {
    if (load > 80) return 'var(--vx-red)';
    if (load > 50) return 'var(--vx-orange)';
    return 'var(--vx-green)';
  };

  return (
    <div className="vx-card p-6">
      <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--vx-text)' }}>Train Status</h2>
      
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="vx-table">
          <thead>
            <tr>
              <th>Train ID</th>
              <th>Current Location</th>
              <th 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleSort('load')}
              >
                Load % {getSortIcon('load')}
              </th>
              <th 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleSort('eta')}
              >
                ETA (min) {getSortIcon('eta')}
              </th>
              <th>Status</th>
              <th>Next Stop</th>
            </tr>
          </thead>
          <tbody>
            {sortedTrains.map((train) => {
              const loadPercentage = getTrainLoadPercentage(train);
              const isOverloaded = loadPercentage > 90;
              
              return (
                <tr key={train.id}>
                  <td className="font-semibold" style={{ color: 'var(--vx-text)' }}>{train.id}</td>
                  <td className="font-medium" style={{ color: 'var(--vx-text-muted)' }}>
                    {train.currentStation || train.currentSegment}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-semibold"
                        style={{ color: getLoadColor(loadPercentage) }}
                      >
                        {loadPercentage.toFixed(1)}%
                      </span>
                      {isOverloaded && (
                        <span 
                          className="text-xs px-2 py-1 rounded-lg font-medium"
                          style={{ 
                            backgroundColor: 'rgba(192, 94, 56, 0.2)',
                            color: 'var(--vx-red)'
                          }}
                        >
                          Overloaded
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-medium" style={{ color: 'var(--vx-text-muted)' }}>{train.etaToNextStop}</td>
                  <td>
                    <span 
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{
                        backgroundColor: `${getStatusColor(train.status)}20`,
                        color: getStatusColor(train.status)
                      }}
                    >
                      {train.status}
                    </span>
                  </td>
                  <td className="font-medium" style={{ color: 'var(--vx-text-muted)' }}>{train.nextStop}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {sortedTrains.length === 0 && (
        <div className="text-center py-12 text-sm font-medium" style={{ color: 'var(--vx-text-muted)' }}>
          No trains match the current filters.
        </div>
      )}
    </div>
  );
};


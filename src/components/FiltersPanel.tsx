import React from 'react';
import { FilterState, Direction } from '../types';
import { SEGMENTS } from '../mockData';

interface FiltersPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ filters, onFilterChange }) => {
  const handleTimeRangeChange = (timeRange: '30min' | '1hr' | '4hr') => {
    onFilterChange({ ...filters, timeRange });
  };

  const handleDirectionChange = (direction: Direction | 'All') => {
    onFilterChange({ ...filters, direction });
  };

  const handleSegmentChange = (segment: string) => {
    onFilterChange({ ...filters, segment });
  };

  return (
    <div className="vx-card p-6 h-full">
      <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--vx-text)' }}>Filters</h2>
      
      {/* Time Range */}
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--vx-text-muted)' }}>
          Time Range
        </label>
        <div className="space-y-2">
          {(['30min', '1hr', '4hr'] as const).map((range) => (
            <label 
              key={range} 
              className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                filters.timeRange === range 
                  ? 'border-2' 
                  : 'border-2 border-transparent hover:opacity-80'
              }`}
              style={{
                backgroundColor: filters.timeRange === range 
                  ? 'rgba(17, 216, 247, 0.15)' 
                  : 'var(--vx-bg-alt)',
                borderColor: filters.timeRange === range ? 'var(--vx-primary)' : 'transparent'
              }}
            >
              <input
                type="radio"
                name="timeRange"
                value={range}
                checked={filters.timeRange === range}
                onChange={() => handleTimeRangeChange(range)}
                className="mr-3 w-4 h-4"
                style={{ accentColor: 'var(--vx-primary)' }}
              />
              <span 
                className="text-sm font-medium"
                style={{ 
                  color: filters.timeRange === range ? 'var(--vx-text)' : 'var(--vx-text-muted)'
                }}
              >
                {range === '30min' ? 'Last 30 min' : range === '1hr' ? 'Last 1 hr' : 'Last 4 hr'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--vx-text-muted)' }}>
          Direction
        </label>
        <div className="space-y-2">
          {(['All', 'Inbound', 'Outbound'] as const).map((dir) => (
            <label 
              key={dir} 
              className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                filters.direction === dir 
                  ? 'border-2' 
                  : 'border-2 border-transparent hover:opacity-80'
              }`}
              style={{
                backgroundColor: filters.direction === dir 
                  ? 'rgba(17, 216, 247, 0.15)' 
                  : 'var(--vx-bg-alt)',
                borderColor: filters.direction === dir ? 'var(--vx-primary)' : 'transparent'
              }}
            >
              <input
                type="radio"
                name="direction"
                value={dir}
                checked={filters.direction === dir}
                onChange={() => handleDirectionChange(dir as Direction | 'All')}
                className="mr-3 w-4 h-4"
                style={{ accentColor: 'var(--vx-primary)' }}
              />
              <span 
                className="text-sm font-medium"
                style={{ 
                  color: filters.direction === dir ? 'var(--vx-text)' : 'var(--vx-text-muted)'
                }}
              >
                {dir}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Segment/Station */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--vx-text-muted)' }}>
          Line Segment
        </label>
        <select
          value={filters.segment}
          onChange={(e) => handleSegmentChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all"
          style={{
            backgroundColor: 'var(--vx-bg-alt)',
            border: '1px solid var(--vx-border)',
            color: 'var(--vx-text)',
            '--tw-ring-color': 'var(--vx-primary)'
          } as React.CSSProperties}
        >
          <option value="All">All Segments</option>
          {SEGMENTS.map((segment) => (
            <option key={segment.id} value={segment.id}>
              {segment.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};


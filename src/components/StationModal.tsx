import React from 'react';
import { Station } from '../types';
import { StationWaitingData, getStationWaitingData } from '../mockData';

interface StationModalProps {
  station: Station | null;
  onClose: () => void;
}

export const StationModal: React.FC<StationModalProps> = ({ station, onClose }) => {
  if (!station) return null;

  const waitingData: StationWaitingData = getStationWaitingData(station.id);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="vx-card p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--vx-text)' }}>{station.name}</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold transition-opacity hover:opacity-70"
            style={{ color: 'var(--vx-text-muted)' }}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Camera Feed Status */}
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: waitingData.cameraFeedStatus === 'active' 
                  ? 'var(--vx-green)' 
                  : 'var(--vx-red)'
              }}
            ></div>
            <span className="text-sm" style={{ color: 'var(--vx-text-muted)' }}>
              Camera Feed: {waitingData.cameraFeedStatus === 'active' ? 'Active' : 'Offline'}
            </span>
          </div>

          {/* Waiting Count */}
          <div 
            className="rounded-lg p-4"
            style={{ 
              backgroundColor: 'rgba(17, 216, 247, 0.15)',
              border: '1px solid var(--vx-primary)'
            }}
          >
            <div className="text-sm mb-1" style={{ color: 'var(--vx-text-muted)' }}>People Waiting</div>
            <div className="text-4xl font-bold" style={{ color: 'var(--vx-primary)' }}>
              {waitingData.waitingCount}
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--vx-text-muted)' }}>
              Last updated: {waitingData.lastUpdated.toLocaleTimeString()}
            </div>
          </div>

          {/* Info */}
          <div 
            className="text-xs p-3 rounded"
            style={{ 
              backgroundColor: 'var(--vx-bg-alt)',
              color: 'var(--vx-text-muted)'
            }}
          >
            <p>
              <strong>Data Source:</strong> Camera feed analysis using computer vision
            </p>
            <p className="mt-1">
              This count represents the number of people detected waiting at the platform.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="vx-btn-primary mt-6 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};



import React, { useState } from 'react';
import { Train, Station } from '../types';
import { STATIONS, getStationWaitingData } from '../mockData';
import { TerminalHeatmapModal } from './TerminalHeatmapModal';

interface MapViewProps {
  trains: Train[];
}

export const MapView: React.FC<MapViewProps> = ({ trains }) => {
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  
  const mapWidth = 800;
  const mapHeight = 280; // Made taller (from 200 to 280)
  const padding = 80;
  const trackWidth = mapWidth - 2 * padding;
  const trackHeight = mapHeight - 2 * padding;
  const cornerRadius = 20;
  const stationRadius = 10;
  const iconSize = 24; // Increased from 16 to 24 for bigger, more professional look
  const trackOffset = 15; // Offset between outer and inner tracks

  // Calculate position on rectangular track (0-100% along the track)
  // trackType: 'outer' for clockwise (trains 1-4), 'inner' for anticlockwise (trains 5-8)
  const getPositionOnRectangularTrack = (position: number, trackType: 'outer' | 'inner' = 'outer') => {
    // Track path: Top (0-25%), Right (25-33.33%), Bottom (33.33-66.67%), Left (66.67-100%)
    const totalLength = 2 * (trackWidth + trackHeight);
    const topLength = trackWidth;
    const rightLength = trackHeight;
    const bottomLength = trackWidth;
    
    let currentLength = (position / 100) * totalLength;
    
    const offset = trackType === 'inner' ? trackOffset : -trackOffset;
    
    if (currentLength <= topLength) {
      // Top edge (left to right)
      const x = padding + currentLength;
      const y = padding + offset;
      return { x, y, angle: 0 };
    } else if (currentLength <= topLength + rightLength) {
      // Right edge (top to bottom)
      const x = padding + trackWidth - offset;
      const y = padding + (currentLength - topLength);
      return { x, y, angle: 90 };
    } else if (currentLength <= topLength + rightLength + bottomLength) {
      // Bottom edge (right to left)
      const x = padding + trackWidth - (currentLength - topLength - rightLength) - offset;
      const y = padding + trackHeight - offset;
      return { x, y, angle: 180 };
    } else {
      // Left edge (bottom to top)
      const x = padding + offset;
      const y = padding + trackHeight - (currentLength - topLength - rightLength - bottomLength);
      return { x, y, angle: 270 };
    }
  };

  // Get heatmap color based on waiting count - using VisionX colors
  const getStationHeatmapColor = (waitingCount: number): string => {
    if (waitingCount <= 20) return '#00C853'; // vx-green
    if (waitingCount <= 40) return '#EA570B'; // vx-orange
    if (waitingCount <= 60) return '#C05E38'; // vx-red
    return '#C05E38'; // vx-red
  };

  return (
    <div className="vx-card p-6">
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--vx-text)' }}>APM Line Map</h2>
      
      {/* Map Container */}
      <div className="relative w-full flex justify-center" style={{ height: `${mapHeight}px` }}>
        <svg 
          width={mapWidth} 
          height={mapHeight} 
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="absolute"
        >
          {/* Outer Rounded Rectangle Train Track (Clockwise - Trains 1-4) */}
          <rect
            x={padding - trackOffset}
            y={padding - trackOffset}
            width={trackWidth + 2 * trackOffset}
            height={trackHeight + 2 * trackOffset}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="none"
            stroke="var(--vx-purple)"
            strokeWidth="3"
            opacity="0.9"
          />
          
          {/* Inner Rounded Rectangle Train Track (Anticlockwise - Trains 5-8) */}
          <rect
            x={padding + trackOffset}
            y={padding + trackOffset}
            width={trackWidth - 2 * trackOffset}
            height={trackHeight - 2 * trackOffset}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="none"
            stroke="var(--vx-primary)"
            strokeWidth="3"
          />

          {/* Train Stations on Track (on outer track) */}
          {STATIONS.map((station) => {
            const trackPos = getPositionOnRectangularTrack(station.position, 'outer');
            const waitingData = getStationWaitingData(station.id);
            const heatmapColor = getStationHeatmapColor(waitingData.waitingCount);
            
            return (
              <g key={station.id}>
                {/* Station circle on track */}
                <circle
                  cx={trackPos.x}
                  cy={trackPos.y}
                  r={stationRadius}
                  fill={heatmapColor}
                  stroke="#fff"
                  strokeWidth="2"
                  className="cursor-pointer transition-all hover:r-12"
                  onMouseEnter={() => setHoveredStation(station)}
                  onMouseLeave={() => setHoveredStation(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStation(station);
                  }}
                />
              </g>
            );
          })}

          {/* Terminal Labels - aligned with station circles */}
          {STATIONS.map((station) => {
            const trackPos = getPositionOnRectangularTrack(station.position, 'outer');
            const labelOffset = 20; // Distance from station circle to label (adjusted for smaller height)
            
            // Determine label position based on track edge
            let labelX = trackPos.x;
            let labelY = trackPos.y;
            
            // Position label outside the track, away from center
            if (trackPos.angle === 0) {
              // Top edge - label above
              labelY = trackPos.y - labelOffset;
            } else if (trackPos.angle === 90) {
              // Right edge - label to the right
              labelX = trackPos.x + labelOffset;
            } else if (trackPos.angle === 180) {
              // Bottom edge - label below
              labelY = trackPos.y + labelOffset;
            } else {
              // Left edge - label to the left
              labelX = trackPos.x - labelOffset;
            }
            
            // Get full terminal name - use station.name which already has proper names
            const terminalName = station.name;
            
            return (
              <g key={`terminal-${station.id}`}>
                {/* Terminal label - clear and bold, positioned outside track */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none"
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: '700',
                    fill: '#FFFFFF',
                    fontFamily: 'Inter, Poppins, system-ui, sans-serif',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)',
                    letterSpacing: '0.5px'
                  }}
                >
                  {terminalName}
                </text>
              </g>
            );
          })}

          {/* Train Icons - Map Pin with Train on rectangular track */}
          {trains.map((train) => {
            // Determine track type based on train number
            const trainNumber = parseInt(train.id.split('-')[1]);
            const trackType = trainNumber <= 4 ? 'outer' : 'inner';
            const isClockwise = train.direction === 'Outbound';
            
            // Position train on appropriate track
            const trackPos = getPositionOnRectangularTrack(train.currentPosition, trackType);
            
            // Calculate train angle - point in direction of travel
            // For clockwise: use track angle
            // For anticlockwise: reverse direction (add 180)
            let trainAngle = trackPos.angle;
            if (!isClockwise) {
              trainAngle = (trackPos.angle + 180) % 360;
            }
            
            // Normalize angle to 0-360
            if (trainAngle < 0) trainAngle += 360;
            if (trainAngle >= 360) trainAngle -= 360;
            
            // Ensure train is always top-to-bottom oriented (not inverted/upside down)
            // If the angle would make the train upside down (180-360), adjust it
            // Keep trains pointing in their travel direction but ensure they're upright
            if (trainAngle >= 180 && trainAngle < 360) {
              // Train would be upside down, so flip it but keep pointing in travel direction
              trainAngle = trainAngle - 180;
            }
            
            return (
              <g key={train.id}>
                {/* Flat Design Train Icon - based on the provided icon style */}
                <g transform={`translate(${trackPos.x}, ${trackPos.y}) rotate(${trainAngle})`}>
                  {/* Dark grey circular background */}
                  <circle
                    cx={0}
                    cy={0}
                    r={iconSize * 0.65}
                    fill="#4B5563"
                  />
                  
                  {/* Long shadow effect - diagonal shadow extending to bottom right */}
                  <path
                    d={`M ${-iconSize * 0.3} ${iconSize * 0.2} 
                        L ${iconSize * 0.4} ${iconSize * 0.5} 
                        L ${iconSize * 0.5} ${iconSize * 0.45} 
                        L ${iconSize * 0.3} ${iconSize * 0.3} 
                        L ${iconSize * 0.2} ${iconSize * 0.4} 
                        L ${-iconSize * 0.2} ${iconSize * 0.25} Z`}
                    fill="#374151"
                    opacity="0.8"
                  />
                  
                  {/* Main train body - white, rounded corners, front-facing */}
                  <rect
                    x={-iconSize * 0.35}
                    y={-iconSize * 0.25}
                    width={iconSize * 0.7}
                    height={iconSize * 0.5}
                    rx={iconSize * 0.08}
                    fill="#fff"
                  />
                  
                  {/* Windshield/Window - large rectangular, dark grey/black */}
                  <rect
                    x={-iconSize * 0.2}
                    y={-iconSize * 0.2}
                    width={iconSize * 0.4}
                    height={iconSize * 0.15}
                    rx={iconSize * 0.03}
                    fill="#1f2937"
                  />
                  
                  {/* Headlights - two circular shapes below windshield */}
                  <circle
                    cx={-iconSize * 0.12}
                    cy={iconSize * 0.05}
                    r={iconSize * 0.05}
                    fill="#1f2937"
                  />
                  <circle
                    cx={iconSize * 0.12}
                    cy={iconSize * 0.05}
                    r={iconSize * 0.05}
                    fill="#1f2937"
                  />
                  
                  {/* Tracks/Lower structure - two trapezoidal shapes extending downward */}
                  <path
                    d={`M ${-iconSize * 0.25} ${iconSize * 0.25} 
                        L ${-iconSize * 0.15} ${iconSize * 0.4} 
                        L ${-iconSize * 0.05} ${iconSize * 0.4} 
                        L ${-iconSize * 0.1} ${iconSize * 0.25} Z`}
                    fill="#fff"
                  />
                  <path
                    d={`M ${iconSize * 0.25} ${iconSize * 0.25} 
                        L ${iconSize * 0.15} ${iconSize * 0.4} 
                        L ${iconSize * 0.05} ${iconSize * 0.4} 
                        L ${iconSize * 0.1} ${iconSize * 0.25} Z`}
                    fill="#fff"
                  />
                </g>
                {/* Train ID label - always below, not rotated */}
                <text
                  x={trackPos.x}
                  y={trackPos.y + iconSize + 10}
                  textAnchor="middle"
                  className="text-xs font-semibold"
                  style={{ 
                    fontSize: '11px',
                    fill: 'var(--vx-text)'
                  }}
                >
                  {trainNumber}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredStation && (() => {
          const trackPos = getPositionOnRectangularTrack(hoveredStation.position, 'outer');
          return (
            <div
              className="absolute rounded-lg shadow-lg p-3 z-10 pointer-events-none min-w-[180px]"
              style={{
                left: `${(trackPos.x / mapWidth) * 100}%`,
                top: `${(trackPos.y / mapHeight) * 100 - 15}%`,
                transform: 'translate(-50%, -100%)',
                backgroundColor: 'var(--vx-surface)',
                border: '1px solid var(--vx-border)',
              }}
            >
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--vx-text)' }}>{hoveredStation.name}</div>
              <div className="text-xs mb-1" style={{ color: 'var(--vx-text-muted)' }}>
                People Waiting: <span className="font-bold" style={{ color: 'var(--vx-primary)' }}>{getStationWaitingData(hoveredStation.id).waitingCount}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--vx-text-muted)' }}>
                Camera Feed: <span className="font-medium" style={{ color: 'var(--vx-red)' }}>Offline</span>
              </div>
            </div>
          );
        })()}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--vx-green)' }}></div>
          <span className="text-sm" style={{ color: 'var(--vx-text)' }}>Low Load (&lt;50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--vx-orange)' }}></div>
          <span className="text-sm" style={{ color: 'var(--vx-text)' }}>Medium Load (50-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--vx-red)' }}></div>
          <span className="text-sm" style={{ color: 'var(--vx-text)' }}>High Load (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--vx-text)' }}>Station Heatmap:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--vx-green)' }}></div>
            <span className="text-xs" style={{ color: 'var(--vx-text-muted)' }}>0-20</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--vx-orange)' }}></div>
            <span className="text-xs" style={{ color: 'var(--vx-text-muted)' }}>21-40</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--vx-orange)' }}></div>
            <span className="text-xs" style={{ color: 'var(--vx-text-muted)' }}>41-60</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--vx-red)' }}></div>
            <span className="text-xs" style={{ color: 'var(--vx-text-muted)' }}>61+</span>
          </div>
        </div>
      </div>

      {/* Terminal Heatmap Modal */}
      <TerminalHeatmapModal 
        station={selectedStation} 
        onClose={() => setSelectedStation(null)} 
      />
    </div>
  );
};

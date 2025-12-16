// Mock data generators and simulation logic for APM Dashboard

import { Station, Segment, Train, Direction, CapacityDataPoint, OnTimeDataPoint, KPIValues } from './types';

// Mock stations along the APM line - Rectangular layout
// Position is a value 0-100 representing progress along the rectangular track
// Track path (clockwise from top-right): Top (T1->T2->T3->TBI - 4 terminals starting from top right), Right (Parking), Bottom (T5->T6->T7->T8->T9 - 5 terminals), Left (T4)
// Layout: 4 terminals on top (T1 at top right where Parking was), 5 terminals on bottom, Parking on right, T4 on left
// All terminals equidistantly spaced (11 stations total, ~9.09% apart)
export const STATIONS: Station[] = [
  { id: 'TBI', name: 'TBI', position: 5 },       // Top right - start (where Parking was)
  { id: 'T3', name: 'T3', position: 14 },   // Top - equidistant
  { id: 'T2', name: 'T2', position: 23 },  // Top - equidistant
  { id: 'T1', name: 'T1', position: 32 },  // Top left - equidistant
  { id: 'PARK', name: 'Parking', position: 45 }, // Right side middle
  { id: 'T9', name: 'T9', position: 54 },   // Bottom right - 1st of 5
  { id: 'T8', name: 'T8', position: 62 },   // Bottom - 2nd of 5 (equidistant)
  { id: 'T7', name: 'T7', position: 70 },  // Bottom - 3rd of 5 (equidistant)
  { id: 'T6', name: 'T6', position: 77 },  // Bottom - 4th of 5 (equidistant)
  { id: 'T5', name: 'T5', position: 85 },  // Bottom left - 5th of 5 (equidistant)
  { id: 'T4', name: 'T4', position: 96.91 },  // Left side middle
];

// Station waiting data (from camera feed simulation)
export interface StationWaitingData {
  stationId: string;
  waitingCount: number;
  lastUpdated: Date;
  cameraFeedStatus: 'active' | 'offline';
}

// Generate mock waiting data for stations based on camera feed
export function getStationWaitingData(stationId: string): StationWaitingData {
  // Simulate camera feed data - random but realistic waiting counts
  const baseCounts: Record<string, number> = {
    'T1': 45,
    'T2': 62,
    'T3': 38,
    'T4': 55,
    'TBI': 35,
    'T5': 48,
    'T6': 52,
    'T7': 41,
    'T8': 44,
    'T9': 50,
    'PARK': 28,
  };
  
  const baseCount = baseCounts[stationId] || 30;
  // Add some variation (±20%)
  const variation = (Math.random() - 0.5) * 0.4;
  const waitingCount = Math.max(0, Math.floor(baseCount * (1 + variation)));
  
  return {
    stationId,
    waitingCount,
    lastUpdated: new Date(),
    cameraFeedStatus: 'offline', // Always offline for now
  };
}

// Mock segments between stations (rectangular track - positions are 0-100)
// Equidistantly spaced segments
export const SEGMENTS: Segment[] = [
  { id: 'S1', name: 'T1-T2', startStation: 'T1', endStation: 'T2', startPosition: 0, endPosition: 9.09 },
  { id: 'S2', name: 'T2-T3', startStation: 'T2', endStation: 'T3', startPosition: 9.09, endPosition: 18.18 },
  { id: 'S3', name: 'T3-TBI', startStation: 'T3', endStation: 'TBI', startPosition: 18.18, endPosition: 27.27 },
  { id: 'S4', name: 'TBI-PARK', startStation: 'TBI', endStation: 'PARK', startPosition: 27.27, endPosition: 36.36 },
  { id: 'S5', name: 'PARK-T5', startStation: 'PARK', endStation: 'T5', startPosition: 36.36, endPosition: 45.45 },
  { id: 'S6', name: 'T5-T6', startStation: 'T5', endStation: 'T6', startPosition: 45.45, endPosition: 54.55 },
  { id: 'S7', name: 'T6-T7', startStation: 'T6', endStation: 'T7', startPosition: 54.55, endPosition: 63.64 },
  { id: 'S8', name: 'T7-T8', startStation: 'T7', endStation: 'T8', startPosition: 63.64, endPosition: 72.73 },
  { id: 'S9', name: 'T8-T9', startStation: 'T8', endStation: 'T9', startPosition: 72.73, endPosition: 81.82 },
  { id: 'S10', name: 'T9-T4', startStation: 'T9', endStation: 'T4', startPosition: 81.82, endPosition: 90.91 },
  { id: 'S11', name: 'T4-T1', startStation: 'T4', endStation: 'T1', startPosition: 90.91, endPosition: 100 },
];

const TRAIN_CAPACITY = 200; // passengers per train

// Generate initial mock trains - 8 trains: 1-4 clockwise, 5-8 anticlockwise
export function generateInitialTrains(): Train[] {
  const trains: Train[] = [];
  
  // Trains 1-4: Clockwise (Outbound), equidistantly spaced
  // Trains 5-8: Anticlockwise (Inbound), equidistantly spaced
  const clockwisePositions = [0, 25, 50, 75]; // 4 trains, 25% apart
  const anticlockwisePositions = [0, 25, 50, 75]; // 4 trains, 25% apart (but moving opposite direction)
  
  // Generate clockwise trains (1-4)
  for (let i = 0; i < 4; i++) {
    const direction: Direction = 'Outbound'; // Clockwise
    const position = clockwisePositions[i];
    const segment = getSegmentForPosition(position);
    const passengers = Math.floor(Math.random() * TRAIN_CAPACITY);
    const isDelayed = Math.random() < 0.15; // 15% chance of delay
    
    trains.push({
      id: `TRAIN-${(i + 1).toString().padStart(3, '0')}`,
      currentPosition: position,
      currentSegment: segment.id,
      currentStation: getStationAtPosition(position)?.id,
      passengers,
      capacity: TRAIN_CAPACITY,
      direction,
      status: isDelayed ? 'Delayed' : 'On Time',
      nextStop: getNextStop(position, direction),
      etaToNextStop: Math.floor(Math.random() * 5) + 1,
      scheduledArrivalTime: new Date(Date.now() + (Math.random() * 30 + 5) * 60000),
      actualArrivalTime: isDelayed 
        ? new Date(Date.now() + (Math.random() * 30 + 10) * 60000)
        : undefined,
    });
  }
  
  // Generate anticlockwise trains (5-8)
  for (let i = 0; i < 4; i++) {
    const direction: Direction = 'Inbound'; // Anticlockwise
    const position = anticlockwisePositions[i];
    const segment = getSegmentForPosition(position);
    const passengers = Math.floor(Math.random() * TRAIN_CAPACITY);
    const isDelayed = Math.random() < 0.15; // 15% chance of delay
    
    trains.push({
      id: `TRAIN-${(i + 5).toString().padStart(3, '0')}`,
      currentPosition: position,
      currentSegment: segment.id,
      currentStation: getStationAtPosition(position)?.id,
      passengers,
      capacity: TRAIN_CAPACITY,
      direction,
      status: isDelayed ? 'Delayed' : 'On Time',
      nextStop: getNextStop(position, direction),
      etaToNextStop: Math.floor(Math.random() * 5) + 1,
      scheduledArrivalTime: new Date(Date.now() + (Math.random() * 30 + 5) * 60000),
      actualArrivalTime: isDelayed 
        ? new Date(Date.now() + (Math.random() * 30 + 10) * 60000)
        : undefined,
    });
  }
  
  return trains;
}

// Get segment for a given position (rectangular - position is 0-100)
function getSegmentForPosition(position: number): Segment {
  // Normalize position to 0-100
  const normalizedPos = ((position % 100) + 100) % 100;
  
  // Find which segment this position falls into
  for (const segment of SEGMENTS) {
    const start = segment.startPosition;
    const end = segment.endPosition;
    
    if (start <= end) {
      // Normal case
      if (normalizedPos >= start && normalizedPos <= end) {
        return segment;
      }
    } else {
      // Wraps around (e.g., 75 to 100, then 0 to 8.33)
      if (normalizedPos >= start || normalizedPos <= end) {
        return segment;
      }
    }
  }
  return SEGMENTS[0]; // fallback
}

// Get station at a given position (rectangular - position is 0-100)
function getStationAtPosition(position: number): Station | null {
  const tolerance = 5; // within 5% of station
  const normalizedPos = ((position % 100) + 100) % 100;
  
  return STATIONS.find(s => {
    const stationPos = ((s.position % 100) + 100) % 100;
    const diff = Math.abs(normalizedPos - stationPos);
    return Math.min(diff, 100 - diff) < tolerance; // Handle wrap-around
  }) || null;
}

// Get next stop based on position and direction (rectangular track)
function getNextStop(position: number, direction: Direction): string {
  const normalizedPos = ((position % 100) + 100) % 100;
  
  if (direction === 'Inbound') {
    // Counter-clockwise - find next station going backwards
    const sortedStations = [...STATIONS].sort((a, b) => b.position - a.position);
    for (const station of sortedStations) {
      const stationPos = ((station.position % 100) + 100) % 100;
      if (stationPos < normalizedPos || (normalizedPos < 10 && stationPos > 90)) {
        return station.name;
      }
    }
    return STATIONS[STATIONS.length - 1].name;
  } else {
    // Clockwise - find next station going forwards
    const sortedStations = [...STATIONS].sort((a, b) => a.position - b.position);
    for (const station of sortedStations) {
      const stationPos = ((station.position % 100) + 100) % 100;
      if (stationPos > normalizedPos || (normalizedPos > 90 && stationPos < 10)) {
        return station.name;
      }
    }
    return STATIONS[0].name;
  }
}

// Simulate train movement and updates - maintain equidistant spacing on rectangular track
export function simulateTrainUpdates(trains: Train[]): Train[] {
  const speed = 0.2; // % per update (rectangular track)
  // Note: numTrains is determined by trains.length
  
  // Separate trains by direction
  const clockwiseTrains = trains.filter(t => t.direction === 'Outbound').sort((a, b) => {
    const posA = ((a.currentPosition % 100) + 100) % 100;
    const posB = ((b.currentPosition % 100) + 100) % 100;
    return posA - posB;
  });
  
  const anticlockwiseTrains = trains.filter(t => t.direction === 'Inbound').sort((a, b) => {
    const posA = ((a.currentPosition % 100) + 100) % 100;
    const posB = ((b.currentPosition % 100) + 100) % 100;
    return posB - posA; // Reverse sort for anticlockwise
  });
  
  // Update clockwise trains (1-4)
  const updatedClockwise = clockwiseTrains.map((train, index) => {
    let newPosition = train.currentPosition;
    
    // Move train clockwise
    newPosition = (newPosition + speed) % 100;
    if (newPosition < 0) newPosition += 100;
    
    // Maintain equidistant spacing: 4 trains, 25% apart
    const targetPositions = [0, 25, 50, 75];
    const targetPosition = targetPositions[index];
    
    const normalizedPos = ((newPosition % 100) + 100) % 100;
    const normalizedTarget = ((targetPosition % 100) + 100) % 100;
    
    let diff = normalizedPos - normalizedTarget;
    if (diff > 50) diff -= 100;
    if (diff < -50) diff += 100;
    
    if (Math.abs(diff) > 12.5 / 2) {
      if (diff > 0) {
        newPosition = (newPosition - speed * 0.5) % 100;
      } else {
        newPosition = (newPosition + speed * 0.5) % 100;
      }
      if (newPosition < 0) newPosition += 100;
    }
    
    // Maintain spacing with adjacent trains
    if (index > 0) {
      const prevTrain = clockwiseTrains[index - 1];
      const prevPos = ((prevTrain.currentPosition % 100) + 100) % 100;
      const currPos = ((newPosition % 100) + 100) % 100;
      let spacing = currPos - prevPos;
      if (spacing < 0) spacing += 100;
      if (spacing < 20) {
        newPosition = (prevPos + 20) % 100;
      }
    }
    if (index < clockwiseTrains.length - 1) {
      const nextTrain = clockwiseTrains[index + 1];
      const nextPos = ((nextTrain.currentPosition % 100) + 100) % 100;
      const currPos = ((newPosition % 100) + 100) % 100;
      let spacing = nextPos - currPos;
      if (spacing < 0) spacing += 100;
      if (spacing < 20) {
        newPosition = (nextPos - 20 + 100) % 100;
      }
    }
    
    // Update passengers (simulate boarding/alighting)
    const passengerChange = Math.floor(Math.random() * 20) - 10;
    const newPassengers = Math.max(0, Math.min(TRAIN_CAPACITY, train.passengers + passengerChange));
    
    // Update segment and station
    const newSegment = getSegmentForPosition(newPosition);
    const newStation = getStationAtPosition(newPosition);
    
    // Update ETA (rectangular distance with wrap-around)
    const nextStation = STATIONS.find(s => s.name === train.nextStop);
    let distanceToNext = 0;
    if (nextStation) {
      const currPos = ((newPosition % 100) + 100) % 100;
      const nextPos = ((nextStation.position % 100) + 100) % 100;
      distanceToNext = Math.abs(nextPos - currPos);
      if (distanceToNext > 50) distanceToNext = 100 - distanceToNext; // Take shorter path
    }
    const newEta = Math.max(1, Math.floor(distanceToNext / speed));
    
    // Update status (occasionally change delay status)
    let newStatus = train.status;
    if (Math.random() < 0.05) { // 5% chance to change status
      newStatus = Math.random() < 0.15 ? 'Delayed' : 'On Time';
    }
    
    return {
      ...train,
      currentPosition: newPosition,
      currentSegment: newSegment.id,
      currentStation: newStation?.id,
      passengers: newPassengers,
      nextStop: getNextStop(newPosition, train.direction),
      etaToNextStop: newEta,
      status: newStatus,
    };
  });
  
  // Update anticlockwise trains (5-8)
  const updatedAnticlockwise = anticlockwiseTrains.map((train, index) => {
    let newPosition = train.currentPosition;
    
    // Move train anticlockwise (decrease position)
    newPosition = (newPosition - speed) % 100;
    if (newPosition < 0) newPosition += 100;
    
    // Maintain equidistant spacing: 4 trains, 25% apart
    const targetPositions = [0, 25, 50, 75];
    const targetPosition = targetPositions[index];
    
    const normalizedPos = ((newPosition % 100) + 100) % 100;
    const normalizedTarget = ((targetPosition % 100) + 100) % 100;
    
    let diff = normalizedPos - normalizedTarget;
    if (diff > 50) diff -= 100;
    if (diff < -50) diff += 100;
    
    if (Math.abs(diff) > 12.5 / 2) {
      if (diff > 0) {
        newPosition = (newPosition - speed * 0.5) % 100;
      } else {
        newPosition = (newPosition + speed * 0.5) % 100;
      }
      if (newPosition < 0) newPosition += 100;
    }
    
    // Maintain spacing with adjacent trains (anticlockwise)
    if (index > 0) {
      const prevTrain = anticlockwiseTrains[index - 1];
      const prevPos = ((prevTrain.currentPosition % 100) + 100) % 100;
      const currPos = ((newPosition % 100) + 100) % 100;
      let spacing = prevPos - currPos; // Reversed for anticlockwise
      if (spacing < 0) spacing += 100;
      if (spacing < 20) {
        newPosition = (prevPos - 20 + 100) % 100;
      }
    }
    if (index < anticlockwiseTrains.length - 1) {
      const nextTrain = anticlockwiseTrains[index + 1];
      const nextPos = ((nextTrain.currentPosition % 100) + 100) % 100;
      const currPos = ((newPosition % 100) + 100) % 100;
      let spacing = currPos - nextPos; // Reversed for anticlockwise
      if (spacing < 0) spacing += 100;
      if (spacing < 20) {
        newPosition = (nextPos + 20) % 100;
      }
    }
    
    // Update passengers (simulate boarding/alighting)
    const passengerChange = Math.floor(Math.random() * 20) - 10;
    const newPassengers = Math.max(0, Math.min(TRAIN_CAPACITY, train.passengers + passengerChange));
    
    // Update segment and station
    const newSegment = getSegmentForPosition(newPosition);
    const newStation = getStationAtPosition(newPosition);
    
    // Update ETA (rectangular distance with wrap-around)
    const nextStation = STATIONS.find(s => s.name === train.nextStop);
    let distanceToNext = 0;
    if (nextStation) {
      const currPos = ((newPosition % 100) + 100) % 100;
      const nextPos = ((nextStation.position % 100) + 100) % 100;
      distanceToNext = Math.abs(nextPos - currPos);
      if (distanceToNext > 50) distanceToNext = 100 - distanceToNext; // Take shorter path
    }
    const newEta = Math.max(1, Math.floor(distanceToNext / speed));
    
    // Update status (occasionally change delay status)
    let newStatus = train.status;
    if (Math.random() < 0.05) { // 5% chance to change status
      newStatus = Math.random() < 0.15 ? 'Delayed' : 'On Time';
    }
    
    return {
      ...train,
      currentPosition: newPosition,
      currentSegment: newSegment.id,
      currentStation: newStation?.id,
      passengers: newPassengers,
      nextStop: getNextStop(newPosition, train.direction),
      etaToNextStop: newEta,
      status: newStatus,
    };
  });
  
  // Return all updated trains
  return [...updatedClockwise, ...updatedAnticlockwise];
}

// Calculate train load percentage
// Train Load % = (Passengers on train / Train capacity) × 100
export function getTrainLoadPercentage(train: Train): number {
  return (train.passengers / train.capacity) * 100;
}

// Get load color based on percentage
export function getLoadColor(loadPercentage: number): string {
  if (loadPercentage < 50) return 'bg-green-500';
  if (loadPercentage < 80) return 'bg-amber-500';
  return 'bg-red-500';
}

// Generate capacity utilization data points with smooth trending
// Segment Capacity Utilization % = (Total passengers moved in period / (Train capacity × number of trips)) × 100
export function generateCapacityData(
  timeRange: '30min' | '1hr' | '4hr', 
  trains: Train[], 
  previousData?: CapacityDataPoint[]
): CapacityDataPoint[] {
  const hours = timeRange === '30min' ? 0.5 : timeRange === '1hr' ? 1 : 4;
  const points: CapacityDataPoint[] = [];
  const now = new Date();
  
  // Calculate current utilization based on train loads
  const totalPassengers = trains.reduce((sum, t) => sum + t.passengers, 0);
  const totalCapacity = trains.length * TRAIN_CAPACITY;
  const currentUtilization = (totalPassengers / totalCapacity) * 100;
  
  // If we have previous data, use it to create smooth trending
  if (previousData && previousData.length > 0) {
    const lastPoint = previousData[previousData.length - 1];
    const lastUtilization = lastPoint.utilization;
    
    // Calculate smooth transition - move 10-15% towards target (trending behavior)
    const targetUtilization = Math.max(0, Math.min(100, currentUtilization));
    const trendFactor = 0.12; // 12% movement per update for smooth trending
    const newUtilization = lastUtilization + (targetUtilization - lastUtilization) * trendFactor;
    
    // Add very small random variation (±1%) for natural fluctuation
    const smallVariation = (Math.random() * 2 - 1); // -1 to +1
    const smoothedUtilization = Math.max(0, Math.min(100, newUtilization + smallVariation));
    
    // Shift previous data points forward and add new point
    const dataPointInterval = 30 * 60000; // 30 minutes in milliseconds
    const maxPoints = Math.floor(hours * 2) + 1;
    
    // Keep previous points, shift times forward
    previousData.forEach((point, index) => {
      if (index < maxPoints - 1) {
        const pointTime = new Date(point.time);
        const timeDiff = now.getTime() - pointTime.getTime();
        
        // Only keep points within the time range
        if (timeDiff <= hours * 60 * 60 * 1000) {
          points.push({
            time: point.time,
            utilization: point.utilization,
          });
        }
      }
    });
    
    // Add new current point
    points.push({
      time: now.toISOString(),
      utilization: Math.round(smoothedUtilization * 10) / 10,
    });
    
    // Ensure we have enough points for the time range
    while (points.length < maxPoints) {
      const missingIndex = points.length;
      const time = new Date(now.getTime() - (maxPoints - missingIndex - 1) * dataPointInterval);
      const baseUtil = currentUtilization + (Math.random() * 4 - 2); // Small variation
      points.unshift({
        time: time.toISOString(),
        utilization: Math.round(Math.max(0, Math.min(100, baseUtil)) * 10) / 10,
      });
    }
  } else {
    // Initial generation - create historical trend
    let trendDirection = Math.random() > 0.5 ? 1 : -1; // Start trending up or down
    let baseValue = currentUtilization;
    
    for (let i = hours * 2; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 30 * 60000);
      
      // Create smooth trend - gradually change direction occasionally
      if (Math.random() < 0.15) {
        trendDirection *= -1; // Occasionally reverse trend
      }
      
      // Small incremental changes for trending
      const trendChange = trendDirection * (Math.random() * 0.8 + 0.2); // 0.2-1.0 per step
      baseValue = Math.max(20, Math.min(90, baseValue + trendChange)); // Keep within reasonable bounds
      
      // Add small random variation
      const utilization = baseValue + (Math.random() * 2 - 1); // ±1% variation
      
      points.push({
        time: time.toISOString(),
        utilization: Math.round(Math.max(0, Math.min(100, utilization)) * 10) / 10,
      });
    }
  }
  
  return points;
}

// Generate on-time performance data
// On-Time Performance % = (On-time arrivals / Total scheduled arrivals) × 100
export function generateOnTimeData(timeRange: '30min' | '1hr' | '4hr', trains: Train[]): OnTimeDataPoint[] {
  const hours = timeRange === '30min' ? 0.5 : timeRange === '1hr' ? 1 : 4;
  const points: OnTimeDataPoint[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60000);
    const hourKey = time.toISOString().slice(0, 13) + ':00';
    
    // Count on-time vs delayed trains
    const onTimeCount = trains.filter(t => t.status === 'On Time').length;
    const totalCount = trains.length;
    const onTimePercentage = totalCount > 0 ? (onTimeCount / totalCount) * 100 : 0;
    
    points.push({
      time: hourKey,
      onTimePercentage: Math.round(onTimePercentage * 10) / 10,
      totalArrivals: totalCount,
      onTimeArrivals: onTimeCount,
    });
  }
  
  return points;
}

// Calculate KPIs
export function calculateKPIs(trains: Train[]): KPIValues {
  // Average Headway (min) = Sum of intervals between trains / (Number of intervals)
  // Simplified: assume trains are evenly spaced
  const averageHeadway = trains.length > 1 ? Math.round((60 / trains.length) * 10) / 10 : 0;
  
  // Trains in Service
  const trainsInService = trains.length;
  
  // Overall On-Time Performance %
  const onTimeCount = trains.filter(t => t.status === 'On Time').length;
  const overallOnTimePerformance = trains.length > 0 
    ? Math.round((onTimeCount / trains.length) * 100 * 10) / 10 
    : 0;
  
  // Average Load %
  const totalLoad = trains.reduce((sum, t) => sum + getTrainLoadPercentage(t), 0);
  const averageLoad = trains.length > 0 
    ? Math.round((totalLoad / trains.length) * 10) / 10 
    : 0;
  
  return {
    averageHeadway,
    trainsInService,
    overallOnTimePerformance,
    averageLoad,
  };
}


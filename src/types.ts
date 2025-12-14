// Type definitions for APM Capacity Dashboard

export type Direction = 'Inbound' | 'Outbound';

export type TrainStatus = 'On Time' | 'Delayed';

export interface Station {
  id: string;
  name: string;
  position: number; // Position along the track (0-100%)
}

export interface Segment {
  id: string;
  name: string;
  startStation: string;
  endStation: string;
  startPosition: number;
  endPosition: number;
}

export interface Train {
  id: string;
  currentPosition: number; // Position along track (0-100%)
  currentSegment: string;
  currentStation?: string;
  passengers: number;
  capacity: number;
  direction: Direction;
  status: TrainStatus;
  nextStop: string;
  etaToNextStop: number; // minutes
  scheduledArrivalTime?: Date;
  actualArrivalTime?: Date;
}

export interface CapacityDataPoint {
  time: string; // ISO timestamp
  utilization: number; // percentage
}

export interface OnTimeDataPoint {
  time: string; // hour bucket
  onTimePercentage: number;
  totalArrivals: number;
  onTimeArrivals: number;
}

export interface KPIValues {
  averageHeadway: number; // minutes
  trainsInService: number;
  overallOnTimePerformance: number; // percentage
  averageLoad: number; // percentage
}

export interface FilterState {
  timeRange: '30min' | '1hr' | '4hr';
  direction: Direction | 'All';
  segment: string | 'All';
}

// Deep Dive Types - Flow Management
export interface PassengerJourney {
  id: string;
  timestamp: Date;
  zones: string[]; // Sequence of zones visited
  entryZone: string;
  exitZone: string;
  totalTime: number; // minutes
}

export interface FlowTimeSeriesPoint {
  time: string; // ISO timestamp
  [areaName: string]: string | number; // Dynamic area names as keys
}

export interface SankeyNode {
  id: string;
  label: string;
  nodeColor?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number; // passenger count
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// Deep Dive Types - Queue Management
export interface QueueEvent {
  timestamp: Date;
  zoneId: string;
  deskGroup: string;
  carrier: string;
  queueLength: number;
  waitTime: number; // minutes
  transactions: number;
  flight?: string;
}

export interface TransactionTimeRecord {
  carrier: string;
  allocationStart: Date;
  allocationEnd: Date;
  medianTime: string; // hh:mm:ss
  avgTime: string; // hh:mm:ss
  totalPax: number;
}

export interface PredictedQueueRecord {
  timestamp: Date;
  deskGroup: string;
  flights: string[];
  carriers: string[];
  allocStart: Date;
  allocEnd: Date;
  predictedQueueLength: number;
  predictedWaitTime: string; // hh:mm:ss
  slaStatus: 'OK' | 'WARNING' | 'BREACHED';
}

export interface QueueTimeRecord {
  timestamp: Date;
  queueName: string;
  carriers: string[];
  actualQueueLength: number;
  actualWaitTime: string; // hh:mm:ss
  sampleCount: number;
}

export interface FloorZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'desk' | 'zone' | 'area';
}

export type TimeAggregation = '5min' | '15min' | '1hr';
export type QueueMetric = 'Queue Length' | 'Wait Time' | 'Transactions';

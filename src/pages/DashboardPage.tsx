import React, { useState, useEffect, useRef } from 'react';
import { Train, FilterState, KPIValues, CapacityDataPoint, OnTimeDataPoint } from '../types';
import {
  generateInitialTrains,
  simulateTrainUpdates,
  generateCapacityData,
  generateOnTimeData,
  calculateKPIs,
} from '../mockData';
import { Navigation } from '../components/Navigation';
import { MapView } from '../components/MapView';
import { FiltersPanel } from '../components/FiltersPanel';
import { TrainTable } from '../components/TrainTable';
import { KPIStrip } from '../components/KPIStrip';
import { CapacityChart } from '../components/CapacityChart';
import { OnTimeChart } from '../components/OnTimeChart';

export const DashboardPage: React.FC = () => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    timeRange: '1hr',
    direction: 'All',
    segment: 'All',
  });
  const [kpis, setKpis] = useState<KPIValues>({
    averageHeadway: 0,
    trainsInService: 0,
    overallOnTimePerformance: 0,
    averageLoad: 0,
  });
  const [capacityData, setCapacityData] = useState<CapacityDataPoint[]>([]);
  const [onTimeData, setOnTimeData] = useState<OnTimeDataPoint[]>([]);
  const trainsRef = useRef<Train[]>([]);

  // Initialize trains
  useEffect(() => {
    const initialTrains = generateInitialTrains();
    setTrains(initialTrains);
    trainsRef.current = initialTrains;
    
    // Calculate initial KPIs and chart data
    setKpis(calculateKPIs(initialTrains));
    setCapacityData(generateCapacityData(filters.timeRange, initialTrains));
    setOnTimeData(generateOnTimeData(filters.timeRange, initialTrains));
  }, []);

  // Real-time simulation: update trains every 2 seconds, but capacity data slower
  useEffect(() => {
    if (trains.length === 0) return;

    const trainInterval = setInterval(() => {
      setTrains((prevTrains) => {
        const updatedTrains = simulateTrainUpdates(prevTrains);
        trainsRef.current = updatedTrains;
        
        // Update KPIs when trains update
        setKpis(calculateKPIs(updatedTrains));
        
        return updatedTrains;
      });
    }, 2000); // Update trains every 2 seconds

    // Update capacity data separately with slower, smoother updates
    const capacityInterval = setInterval(() => {
      const currentTrains = trainsRef.current;
      if (currentTrains.length === 0) return;
      
      // Update capacity data with trending (pass previous data for smooth transitions)
      setCapacityData((prevCapacityData) => {
        return generateCapacityData(filters.timeRange, currentTrains, prevCapacityData);
      });
    }, 8000); // Update capacity chart every 8 seconds for smoother trending

    // Update on-time data
    const onTimeInterval = setInterval(() => {
      const currentTrains = trainsRef.current;
      if (currentTrains.length === 0) return;
      setOnTimeData(generateOnTimeData(filters.timeRange, currentTrains));
    }, 5000); // Update on-time data every 5 seconds

    return () => {
      clearInterval(trainInterval);
      clearInterval(capacityInterval);
      clearInterval(onTimeInterval);
    };
  }, [trains.length, filters.timeRange]);

  // Update chart data when time range filter changes
  useEffect(() => {
    if (trains.length > 0) {
      // Reset capacity data when time range changes (fresh start)
      setCapacityData(generateCapacityData(filters.timeRange, trains));
      setOnTimeData(generateOnTimeData(filters.timeRange, trains));
    }
  }, [filters.timeRange]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--vx-bg-alt)' }}>
      {/* VisionX Navigation Header */}
      <Navigation activeTab="Dashboard" />

      {/* Main Content - VisionX Style */}
      <main className="max-w-full mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--vx-text)' }}>
            APM Operations Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--vx-text-muted)' }}>
            Real-time capacity & location tracking
          </p>
        </div>

        {/* Top: Map View */}
        <div className="mb-8">
          <MapView trains={trains} />
        </div>

        {/* Middle: Filters + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Left Sidebar: Filters */}
          <div className="lg:col-span-1">
            <FiltersPanel filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Center: Train Table */}
          <div className="lg:col-span-3">
            <TrainTable trains={trains} filters={filters} />
          </div>
        </div>

        {/* Bottom: KPIs and Charts */}
        <div className="mb-8">
          <KPIStrip kpis={kpis} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CapacityChart data={capacityData} />
          <OnTimeChart data={onTimeData} />
        </div>
      </main>
    </div>
  );
};


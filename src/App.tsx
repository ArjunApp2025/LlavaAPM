/**
 * APM Capacity & Real-Time Location Tracking Dashboard
 * 
 * Real-time train tracking and capacity monitoring dashboard
 * following Apple Human Interface Guidelines for clean, intuitive design.
 * 
 * INTEGRATING WITH REAL API:
 * See DashboardPage component for API integration instructions.
 */

import React from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--vx-bg)' }}>
        <DashboardPage />
      </div>
    </ErrorBoundary>
  );
}

export default App;


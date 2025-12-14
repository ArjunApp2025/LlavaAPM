# APM Capacity & Real-Time Location Tracking Dashboard

A comprehensive airport operations dashboard with real-time APM train tracking and deep-dive terminal analytics, built with React, TypeScript, and Tailwind CSS.

## Features

### APM Dashboard
- **Real-time Train Tracking**: Visual map showing train positions along the APM line, colored by load percentage
- **Interactive Filters**: Filter by time range, direction, and line segments
- **Train Status Table**: Sortable table with train details, load percentages, ETAs, and status
- **KPI Dashboard**: Key performance indicators including headway, on-time performance, and average load
- **Analytics Charts**: Capacity utilization and on-time performance visualizations

### Terminal Deep Dive
- **Flow Management**: 
  - Time-series line chart showing median time in different terminal areas
  - Sankey diagram visualizing passenger flow patterns through entry, intermediate, and exit zones
  - Area multi-select and smoothing controls
- **Queue Management**:
  - Interactive floor plan heat maps with dot and heatmap visualization modes
  - Animated time slider with play/pause controls
  - Three comprehensive data tables:
    - Transaction Times per Carrier
    - Predicted Queue Times per Desk Group (with SLA status)
    - Queue Times per Queue
  - Filters for desk groups, carriers, and metrics

## Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for line/bar charts
- **@nivo/sankey** for Sankey flow diagrams
- **Vite** for build tooling

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/              # React components
│   ├── MapView.tsx         # Top map with train icons
│   ├── FiltersPanel.tsx   # Left sidebar filters
│   ├── TrainTable.tsx     # Center train status table
│   ├── KPIStrip.tsx       # KPI cards
│   ├── CapacityChart.tsx  # Capacity utilization chart
│   ├── OnTimeChart.tsx    # On-time performance chart
│   ├── Navigation.tsx     # Navigation bar
│   └── deepDive/          # Deep dive components
│       ├── FlowTimeSeriesChart.tsx
│       ├── FlowSankeyDiagram.tsx
│       ├── FlowManagementSection.tsx
│       ├── CheckinFloorMap.tsx
│       ├── TimeSlider.tsx
│       ├── KpiTable.tsx
│       └── QueueManagementSection.tsx
├── pages/                  # Page components
│   ├── DashboardPage.tsx  # Main APM dashboard
│   └── DeepDivePage.tsx    # Terminal deep dive analytics
├── types.ts                # TypeScript type definitions
├── mockData.ts             # Mock data for APM dashboard
├── mockDeepDiveData.ts     # Mock data for deep dive views
├── App.tsx                 # Main router component
└── main.tsx                # Entry point
```

## Dashboard Layout

1. **Top Area**: Schematic airport/track map with moving train icons
2. **Left Sidebar**: Filters for time range, direction, and segments
3. **Center Panel**: Train status table with sorting
4. **Bottom Area**: KPI cards and analytics charts

## KPI Formulas

- **Train Load %** = (Passengers on train / Train capacity) × 100
- **Segment Capacity Utilization %** = (Total passengers moved in period / (Train capacity × number of trips)) × 100
- **On-Time Performance %** = (On-time arrivals / Total scheduled arrivals) × 100
- **Average Headway (min)** = Sum of intervals between trains / (Number of intervals)

## Integrating with Real API

The dashboard currently uses mock data for simulation. To connect to a real VisionX ingestion → analytics service → dashboard API:

### APM Dashboard
1. **Replace API Calls**: Update `mockData.ts` functions to fetch from your API endpoints
2. **Update DashboardPage.tsx**: Replace the simulation interval with API polling or WebSocket connection
3. **Expected Endpoints**:
   - `GET /api/trains` - Current train states
   - `GET /api/capacity?timeRange=...` - Capacity utilization data
   - `GET /api/on-time?timeRange=...` - On-time performance data
   - `GET /api/kpis` - Calculated KPI values

### Terminal Deep Dive
1. **Flow Management**: Replace `generatePassengerJourneys()` with `GET /api/passenger-journeys?startDate=...&endDate=...`
2. **Queue Management**: Replace `generateQueueEvents()` with `GET /api/queue-events?startDate=...&endDate=...`
3. **Real-time Updates**: Use WebSocket connections or polling for live queue and flow data

See the detailed comments in `src/pages/DeepDivePage.tsx` for integration instructions.

## License

MIT


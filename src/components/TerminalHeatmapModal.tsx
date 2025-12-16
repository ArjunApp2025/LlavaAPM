import React, { useState, useEffect } from 'react';
import { Station } from '../types';
import { getStationWaitingData } from '../mockData';

interface TerminalHeatmapModalProps {
  station: Station | null;
  onClose: () => void;
}

interface Person {
  id: string;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  targetX: number; // target position x
  targetY: number; // target position y
  status: 'waiting' | 'moving' | 'boarding';
  zone: string;
  nextZone?: string; // zone person is moving towards
  waitTime: number; // time to wait before moving again
}

interface FloorPlanZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'waiting' | 'corridor' | 'gate' | 'service' | 'apm';
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CONFIG = {
  // People counts
  STANDARD_TERMINAL_PEOPLE: 150,
  TERMINAL2_PEOPLE: 150, // ~150 people for Terminal 2
  MIN_WAITING_PEOPLE: 50,
  
  // Distribution percentages (standard terminals)
  DISTRIBUTION: {
    security: 0.12,
    corridor: 0.35,
    gates: 0.35,
    waiting: 0.15,
    apm: 0.03,
  },
  
  // Terminal 2 specific distribution
  TERMINAL2_DISTRIBUTION: {
    corridor: 0.4,
    shop12: 18,
    shop13: 20,
    shop67: 12,
    activeGate: 15,
    delayedGate: 12,
    newGate: 6,
    otherGates: 0.02,
  },
  
  // Movement settings
  MOVEMENT: {
    baseSpeed: 0.12,
    boardingSpeed: 0.18,
    animationFrameRate: 16, // ~60fps
    minDistance: 2,
    zonePadding: 5,
    gatePadding: 8,
    // Terminal 2 specific - faster movement
    terminal2: {
      baseSpeed: 0.25, // Faster base speed for Terminal 2
      boardingSpeed: 0.35, // Faster boarding speed
    },
  },
  
  // Wait times (milliseconds)
  WAIT_TIMES: {
    waiting: { min: 2000, max: 5000 },
    moving: { min: 1000, max: 3000 },
    boarding: { min: 300, max: 1000 },
    delayed: { min: 5000, max: 8000 },
    newGate: { min: 1000, max: 2000 },
  },
  
  // Terminal bounds
  BOUNDS: {
    standard: { minX: 50, maxX: 750, minY: 50, maxY: 540 },
    terminal2: { minX: 50, maxX: 1150, minY: 50, maxY: 550 },
  },
  
  // ViewBox dimensions
  VIEWBOX: {
    standard: '0 0 800 550',
    terminal2: '0 0 1200 600',
  },
  
  // Count adjustment
  COUNT_ADJUSTMENT: {
    targetUpdateInterval: 4000,
    countAdjustInterval: 2500,
    variationPercent: { min: 0.10, max: 0.15 },
    incrementPercent: { min: 0.10, max: 0.15 },
    minChangeThreshold: 0.05,
  },
  
  // Heatmap
  HEATMAP: {
    gridSize: 20,
    intensityMultiplier: 6, // Reduced to show more moderate traffic
    minIntensity: 2, // Lower threshold to show low traffic areas
    thresholds: {
      low: 25, // Lower threshold to show more low traffic
      moderate: 80, // Higher threshold - red hot spots only for very heavy congestion
    },
    // Terminal 2 specific - adjusted to show mix of traffic levels
    terminal2: {
      intensityMultiplier: 4, // Reduced multiplier for better distribution
      minIntensity: 3, // Lower threshold to show low traffic areas
      thresholds: {
        low: 20, // Lower threshold for low traffic
        moderate: 75, // Higher threshold - red hot spots only for very heavy congestion
      },
    },
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Clamp a value within bounds
const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

// Clamp person position to zone bounds
const clampToZone = (person: Person, zone: FloorPlanZone, padding: number = CONFIG.MOVEMENT.zonePadding): void => {
  person.x = clamp(person.x, zone.x + padding, zone.x + zone.width - padding);
  person.y = clamp(person.y, zone.y + padding, zone.y + zone.height - padding);
  person.targetX = clamp(person.targetX, zone.x + padding, zone.x + zone.width - padding);
  person.targetY = clamp(person.targetY, zone.y + padding, zone.y + zone.height - padding);
};

// Get random position within zone
const getRandomPositionInZone = (zone: FloorPlanZone, padding: number = CONFIG.MOVEMENT.zonePadding): { x: number; y: number } => {
  return {
    x: zone.x + padding + Math.random() * (zone.width - padding * 2),
    y: zone.y + padding + Math.random() * (zone.height - padding * 2),
  };
};

// Get random wait time based on status
const getWaitTime = (status: Person['status'], isDelayed: boolean = false): number => {
  if (isDelayed) {
    const { min, max } = CONFIG.WAIT_TIMES.delayed;
    return Math.random() * (max - min) + min;
  }
  
  const times = CONFIG.WAIT_TIMES[status];
  return Math.random() * (times.max - times.min) + times.min;
};

// Terminal 2 specific layout based on the detailed floor plan image
const getTerminal2FloorPlan = (): FloorPlanZone[] => {
  // Based on the LA Terminal 2 floor plan image
  // Central grey walkway with gates on top and bottom, shops/services as colored boxes
  // ViewBox: 0 0 1200 600 (scaled to fit)
  
  return [
    // Central grey walkway (main corridor) - WALKABLE
    { id: 'main-corridor', name: 'Main Corridor', x: 50, y: 250, width: 1100, height: 100, type: 'corridor' },
    
    // Top gates (North side) - WALKABLE areas near gates
    { id: 'gate20-area', name: 'Gate 20 Area', x: 50, y: 50, width: 120, height: 150, type: 'gate' },
    { id: 'gate22-area', name: 'Gate 22 Area', x: 250, y: 50, width: 120, height: 150, type: 'gate' },
    { id: 'gate24-area', name: 'Gate 24 Area', x: 450, y: 50, width: 120, height: 150, type: 'gate' },
    { id: 'gate26b-area', name: 'Gate 26B Area', x: 650, y: 50, width: 120, height: 150, type: 'gate' },
    { id: 'gate26a-area', name: 'Gate 26A Area', x: 800, y: 50, width: 120, height: 150, type: 'gate' },
    { id: 'gate28-area', name: 'Gate 28 Area', x: 1000, y: 50, width: 120, height: 150, type: 'gate' },
    
    // Bottom gates (South side) - WALKABLE areas near gates
    { id: 'gate21b-area', name: 'Gate 21B Area', x: 50, y: 400, width: 120, height: 150, type: 'gate' },
    { id: 'gate21a-area', name: 'Gate 21A Area', x: 150, y: 400, width: 120, height: 150, type: 'gate' },
    { id: 'gate23a-area', name: 'Gate 23A Area', x: 300, y: 400, width: 120, height: 150, type: 'gate' },
    { id: 'gate23b-area', name: 'Gate 23B Area', x: 400, y: 400, width: 120, height: 150, type: 'gate' },
    { id: 'gate25b-area', name: 'Gate 25B Area', x: 600, y: 400, width: 120, height: 150, type: 'gate' },
    { id: 'gate25a-area', name: 'Gate 25A Area', x: 700, y: 400, width: 120, height: 150, type: 'gate' },
    { id: 'gate27-area', name: 'Gate 27 Area', x: 950, y: 400, width: 120, height: 150, type: 'gate' },
    
    // Shop/Service zones - NON-WALKABLE (colored boxes) but people cluster near them
    // Orange areas
    { id: 'shop-1', name: 'Shop Area 1', x: 50, y: 200, width: 80, height: 50, type: 'service' },
    { id: 'shop-3', name: 'Shop Area 3', x: 200, y: 50, width: 50, height: 80, type: 'service' },
    { id: 'shop-6', name: 'Shop Area 6', x: 500, y: 400, width: 80, height: 50, type: 'service' },
    { id: 'shop-7', name: 'Shop Area 7', x: 580, y: 400, width: 80, height: 50, type: 'service' },
    { id: 'shop-13', name: 'Shop Area 13', x: 900, y: 400, width: 80, height: 50, type: 'service' },
    
    // Green areas
    { id: 'shop-2', name: 'Shop Area 2', x: 150, y: 50, width: 50, height: 80, type: 'service' },
    { id: 'shop-4', name: 'Shop Area 4', x: 50, y: 350, width: 80, height: 50, type: 'service' },
    { id: 'shop-8', name: 'Shop Area 8', x: 450, y: 50, width: 80, height: 50, type: 'service' },
    { id: 'shop-10', name: 'Shop Area 10', x: 650, y: 50, width: 80, height: 50, type: 'service' },
    { id: 'shop-11', name: 'Shop Area 11', x: 730, y: 50, width: 80, height: 50, type: 'service' },
    { id: 'shop-12', name: 'Shop Area 12', x: 850, y: 400, width: 80, height: 50, type: 'service' }, // Important cluster zone
    { id: 'shop-14', name: 'Shop Area 14', x: 810, y: 50, width: 80, height: 50, type: 'service' },
    { id: 'shop-15', name: 'Shop Area 15', x: 1000, y: 50, width: 50, height: 50, type: 'service' },
    
    // Purple areas
    { id: 'shop-5-top', name: 'Shop Area 5 (Top)', x: 300, y: 50, width: 80, height: 50, type: 'service' },
    { id: 'shop-5-bottom', name: 'Shop Area 5 (Bottom)', x: 300, y: 400, width: 80, height: 50, type: 'service' },
    
    // Blue service area (large)
    { id: 'service-area', name: 'Service Area', x: 450, y: 350, width: 200, height: 50, type: 'service' },
    
    // Walkable zones near shops (people can stand near but not inside shops)
    { id: 'near-shop-12', name: 'Near Shop 12', x: 850, y: 350, width: 100, height: 50, type: 'waiting' },
    { id: 'near-shop-13', name: 'Near Shop 13', x: 900, y: 350, width: 100, height: 50, type: 'waiting' },
    { id: 'near-shop-6-7', name: 'Near Shops 6-7', x: 500, y: 350, width: 160, height: 50, type: 'waiting' },
  ];
};

// Standard terminal layout (for non-T2 terminals)
const getStandardTerminalFloorPlan = (): FloorPlanZone[] => {
  // Layout: Main terminal building with gates on top and bottom
  // Top gates: 28, 27, 26, 25, 24, 23 (left to right)
  // Bottom gates: 24A, 23A, 22, 21B, 22A, 21, 21A (left to right)
  
  return [
    // Main terminal building (light blue background)
    { id: 'terminal', name: 'Terminal Building', x: 100, y: 100, width: 600, height: 300, type: 'waiting' },
    
    // Top gates (from left to right)
    { id: 'gate28', name: 'Gate 28', x: 100, y: 50, width: 80, height: 50, type: 'gate' },
    { id: 'gate27', name: 'Gate 27', x: 190, y: 50, width: 80, height: 50, type: 'gate' },
    { id: 'gate26', name: 'Gate 26', x: 280, y: 50, width: 80, height: 50, type: 'gate' },
    { id: 'gate25', name: 'Gate 25', x: 370, y: 50, width: 80, height: 50, type: 'gate' },
    { id: 'gate24', name: 'Gate 24', x: 460, y: 50, width: 80, height: 50, type: 'gate' },
    { id: 'gate23', name: 'Gate 23', x: 550, y: 50, width: 80, height: 50, type: 'gate' },
    
    // Bottom gates (from left to right)
    { id: 'gate24a', name: 'Gate 24A', x: 100, y: 400, width: 80, height: 50, type: 'gate' },
    { id: 'gate23a', name: 'Gate 23A', x: 190, y: 400, width: 80, height: 50, type: 'gate' },
    { id: 'gate22', name: 'Gate 22', x: 280, y: 400, width: 80, height: 50, type: 'gate' },
    { id: 'gate21b', name: 'Gate 21B', x: 370, y: 400, width: 80, height: 50, type: 'gate' },
    { id: 'gate22a', name: 'Gate 22A', x: 460, y: 400, width: 80, height: 50, type: 'gate' },
    { id: 'gate21', name: 'Gate 21', x: 550, y: 400, width: 80, height: 50, type: 'gate' },
    { id: 'gate21a', name: 'Gate 21A', x: 640, y: 400, width: 60, height: 50, type: 'gate' },
    
    // Main corridor (center of terminal, horizontal)
    { id: 'corridor', name: 'Main Corridor', x: 100, y: 200, width: 600, height: 80, type: 'corridor' },
    
    // Security checkpoint (center left)
    { id: 'security', name: 'Security', x: 100, y: 150, width: 120, height: 50, type: 'service' },
    
    // Lounge area (center right)
    { id: 'lounge', name: 'Lounge', x: 580, y: 150, width: 120, height: 50, type: 'waiting' },
    
    // APM Platform (bottom, below gates)
    { id: 'apm', name: 'APM Platform', x: 100, y: 500, width: 600, height: 40, type: 'apm' },
    
    // Waiting areas (distributed in terminal)
    { id: 'wait1', name: 'Waiting Area 1', x: 250, y: 120, width: 100, height: 60, type: 'waiting' },
    { id: 'wait2', name: 'Waiting Area 2', x: 400, y: 120, width: 100, height: 60, type: 'waiting' },
    { id: 'wait3', name: 'Waiting Area 3', x: 250, y: 320, width: 100, height: 60, type: 'waiting' },
    { id: 'wait4', name: 'Waiting Area 4', x: 400, y: 320, width: 100, height: 60, type: 'waiting' },
  ];
};

// Get terminal floor plan - Terminal 2 uses special layout
const getTerminalFloorPlan = (stationId: string): FloorPlanZone[] => {
  if (stationId === 'T2') {
    return getTerminal2FloorPlan();
  }
  return getStandardTerminalFloorPlan();
};

// Generate people with initial positions and movement targets
const generatePeople = (zones: FloorPlanZone[], stationId: string): Person[] => {
  const people: Person[] = [];
  const waitingData = getStationWaitingData(stationId);
  const isTerminal2 = stationId === 'T2';
  const totalPeople = isTerminal2 ? CONFIG.TERMINAL2_PEOPLE : CONFIG.STANDARD_TERMINAL_PEOPLE;

  // Terminal 2 specific zones
  const mainCorridor = zones.find(z => z.id === 'main-corridor');
  const corridorZone = zones.find(z => z.id === 'corridor' || z.id === 'main-corridor');
  const securityZone = zones.find(z => z.id === 'security');
  const gateZones = zones.filter(z => z.type === 'gate');
  const waitingZones = zones.filter(z => z.type === 'waiting');
  const apmZone = zones.find(z => z.id === 'apm');
  
  // Terminal 2 specific: zones near shops 12 and 13 (important clustering areas)
  const nearShop12 = zones.find(z => z.id === 'near-shop-12');
  const nearShop13 = zones.find(z => z.id === 'near-shop-13');
  const nearShop67 = zones.find(z => z.id === 'near-shop-6-7');

  const distribution = CONFIG.DISTRIBUTION;

  // Track waiting count to ensure at least 50 waiting
  let waitingCount = 0;

  // Helper to create person with movement properties
  const createPerson = (
    id: string,
    zone: FloorPlanZone,
    status: 'waiting' | 'moving' | 'boarding',
    zoneId: string,
    clampToBounds: boolean = true
  ): Person => {
    const pos = getRandomPositionInZone(zone, clampToBounds ? CONFIG.MOVEMENT.zonePadding : 0);
    const person: Person = {
      id,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      targetX: pos.x,
      targetY: pos.y,
      status,
      zone: zoneId,
      waitTime: status === 'waiting' ? getWaitTime('waiting') : 0,
    };
    
    if (clampToBounds) {
      clampToZone(person, zone);
    }
    
    return person;
  };
  
  // Helper to add people to a zone with clustering
  const addPeopleToZone = (
    zone: FloorPlanZone | undefined,
    count: number,
    status: Person['status'],
    zoneId: string,
    prefix: string,
    isDelayed: boolean = false
  ): void => {
    if (!zone) return;
    
    for (let i = 0; i < count; i++) {
      const person = createPerson(`${prefix}-${i}`, zone, status, zoneId);
      person.waitTime = getWaitTime(status, isDelayed);
      people.push(person);
      if (status === 'waiting') waitingCount++;
    }
  };

  // Security area
  if (securityZone) {
    const count = Math.floor(totalPeople * distribution.security);
    addPeopleToZone(securityZone, count, 'waiting', 'security', 'security');
  }

  // Terminal 2 specific generation - only in grey walkable areas, ~100 people
  if (isTerminal2) {
    // 1. BOARDING ACTIVITY AT GATE 23A - 20-40 people, organized queue, high density
    const gate23A = gateZones.find(z => z.id === 'gate23a-area');
    if (gate23A) {
      const boardingCount = 30; // 20-40 people for boarding cluster
      const gateCenterX = gate23A.x + gate23A.width / 2;
      const gateCenterY = gate23A.y + gate23A.height / 2;
      
      for (let i = 0; i < boardingCount; i++) {
        // Create organized queue - people aligned toward gate entrance
        // Position people in a semi-structured cluster near the gate
        const angle = (i / boardingCount) * Math.PI * 2; // Circular distribution
        const radius = 15 + (i % 3) * 8; // Tighter grouping with slight spread
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        
        const person = createPerson(`boarding-23a-${i}`, gate23A, 'boarding', 'gate23a-area');
        // Position people in organized cluster near gate entrance
        person.x = clamp(
          gateCenterX + offsetX,
          gate23A.x + 10,
          gate23A.x + gate23A.width - 10
        );
        person.y = clamp(
          gateCenterY + offsetY,
          gate23A.y + 10,
          gate23A.y + gate23A.height - 10
        );
        // Movement vector toward gate entrance (top of gate area)
        person.targetX = gateCenterX;
        person.targetY = gate23A.y + 15; // Gate entrance direction
        person.vx = (person.targetX - person.x) * 0.08; // Faster movement toward gate (increased from 0.02)
        person.vy = (person.targetY - person.y) * 0.08; // Faster movement toward gate (increased from 0.02)
        person.waitTime = getWaitTime('boarding');
        people.push(person);
      }
    }

    // 2. COFFEE SHOP WAITING CLUSTERS - 5-15 people each, mostly stationary, yellow/orange heatmap
    // Cluster near shop 12
    if (nearShop12) {
      const shopClusterCount = 10; // 5-15 people
      const shopCenterX = nearShop12.x + nearShop12.width / 2;
      const shopCenterY = nearShop12.y + nearShop12.height / 2;
      
      for (let i = 0; i < shopClusterCount; i++) {
        // Organic circular grouping
        const angle = (i / shopClusterCount) * Math.PI * 2;
        const radius = 20 + Math.random() * 15; // Organic spread
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        
        const person = createPerson(`shop12-${i}`, nearShop12, 'waiting', 'near-shop-12');
        person.x = clamp(
          shopCenterX + offsetX,
          nearShop12.x + 5,
          nearShop12.x + nearShop12.width - 5
        );
        person.y = clamp(
          shopCenterY + offsetY,
          nearShop12.y + 5,
          nearShop12.y + nearShop12.height - 5
        );
        person.targetX = person.x; // Stationary
        person.targetY = person.y;
        person.waitTime = getWaitTime('waiting') * 2; // Longer wait times (mostly stationary)
        people.push(person);
        waitingCount++;
      }
    }

    // Cluster near shop 13
    if (nearShop13) {
      const shopClusterCount = 12; // 5-15 people
      const shopCenterX = nearShop13.x + nearShop13.width / 2;
      const shopCenterY = nearShop13.y + nearShop13.height / 2;
      
      for (let i = 0; i < shopClusterCount; i++) {
        const angle = (i / shopClusterCount) * Math.PI * 2;
        const radius = 20 + Math.random() * 15;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        
        const person = createPerson(`shop13-${i}`, nearShop13, 'waiting', 'near-shop-13');
        person.x = clamp(
          shopCenterX + offsetX,
          nearShop13.x + 5,
          nearShop13.x + nearShop13.width - 5
        );
        person.y = clamp(
          shopCenterY + offsetY,
          nearShop13.y + 5,
          nearShop13.y + nearShop13.height - 5
        );
        person.targetX = person.x; // Stationary
        person.targetY = person.y;
        person.waitTime = getWaitTime('waiting') * 2;
        people.push(person);
        waitingCount++;
      }
    }

    // Cluster near shops 6-7
    if (nearShop67) {
      const shopClusterCount = 8; // 5-15 people
      const shopCenterX = nearShop67.x + nearShop67.width / 2;
      const shopCenterY = nearShop67.y + nearShop67.height / 2;
      
      for (let i = 0; i < shopClusterCount; i++) {
        const angle = (i / shopClusterCount) * Math.PI * 2;
        const radius = 20 + Math.random() * 15;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        
        const person = createPerson(`shop67-${i}`, nearShop67, 'waiting', 'near-shop-6-7');
        person.x = clamp(
          shopCenterX + offsetX,
          nearShop67.x + 5,
          nearShop67.x + nearShop67.width - 5
        );
        person.y = clamp(
          shopCenterY + offsetY,
          nearShop67.y + 5,
          nearShop67.y + nearShop67.height - 5
        );
        person.targetX = person.x; // Stationary
        person.targetY = person.y;
        person.waitTime = getWaitTime('waiting') * 2;
        people.push(person);
        waitingCount++;
      }
    }

    // 3. GENERAL DISTRIBUTION - Main corridor and other gates
    // Main corridor - LOTS of people waiting in corridor pathways
    if (mainCorridor) {
      const corridorCount = Math.floor(totalPeople * 0.65); // ~65% in corridor (lots of people)
      for (let i = 0; i < corridorCount; i++) {
        // Most people in corridor are waiting (70% waiting, 30% moving)
        const isWaiting = Math.random() > 0.3; // 70% waiting
        const person = createPerson(`corridor-${i}`, mainCorridor, isWaiting ? 'waiting' : 'moving', 'main-corridor');
        const targetPos = getRandomPositionInZone(mainCorridor);
        person.targetX = targetPos.x;
        person.targetY = targetPos.y;
        if (isWaiting) {
          // Waiting people - mostly stationary
          person.targetX = person.x; // Stay in place
          person.targetY = person.y;
          person.waitTime = getWaitTime('waiting') * 2; // Longer wait times
        } else {
          // Moving people - faster movement for Terminal 2
          person.vx = (Math.random() - 0.5) * 0.3; // Increased from 0.15 to 0.3
          person.vy = (Math.random() - 0.5) * 0.3; // Increased from 0.15 to 0.3
          person.waitTime = getWaitTime('moving');
        }
        people.push(person);
        if (isWaiting) waitingCount++;
      }
    }

    // Other gates - smaller distribution (excluding Gate 23A which has boarding cluster)
    gateZones.forEach((zone) => {
      if (zone.id !== 'gate23a-area') {
        const count = Math.floor(totalPeople * 0.01); // ~1% per other gate
        for (let i = 0; i < count; i++) {
          const person = createPerson(`gate-${zone.id}-${i}`, zone, 'waiting', zone.id);
          person.waitTime = getWaitTime('waiting');
          people.push(person);
          waitingCount++;
        }
      }
    });

    // Fill remaining slots to reach ~100 people, ensuring at least 30 waiting
    const walkableZones = [mainCorridor, ...gateZones, nearShop12, nearShop13, nearShop67].filter(Boolean);
    while (people.length < totalPeople) {
      const randomZone = walkableZones[Math.floor(Math.random() * walkableZones.length)];
      if (randomZone) {
        const status: Person['status'] = waitingCount < 30 ? 'waiting' : (Math.random() > 0.5 ? 'waiting' : 'moving');
        const person = createPerson(`extra-${people.length}`, randomZone, status, randomZone.id);
        person.waitTime = getWaitTime(status);
        people.push(person);
        if (status === 'waiting') waitingCount++;
      } else {
        break;
      }
    }

    return people;
  }

  // Standard terminal generation (non-T2)
  // Main corridor - moving people
  if (corridorZone) {
    const count = Math.floor(totalPeople * distribution.corridor);
    for (let i = 0; i < count; i++) {
      const person = createPerson(`corridor-${i}`, corridorZone, 'moving', 'corridor');
      const targetPos = getRandomPositionInZone(corridorZone);
      person.targetX = targetPos.x;
      person.targetY = targetPos.y;
      person.vx = (Math.random() - 0.5) * 0.3;
      person.vy = (Math.random() - 0.5) * 0.3;
      people.push(person);
    }
  }

  // Gates - Gate 24 is the active boarding gate with cluster activity
  const activeBoardingGate = gateZones.find(z => z.id === 'gate24');
  const busyGates = ['gate23', 'gate22', 'gate21'];
  
  gateZones.forEach(zone => {
    if (zone.id === 'gate24' && activeBoardingGate) {
      // Active boarding gate - high density cluster
      const boardingCount = 45;
      for (let i = 0; i < boardingCount; i++) {
        const status: Person['status'] = i < 15 ? 'boarding' : (i < 30 ? 'moving' : 'waiting');
        const person = createPerson(`${zone.id}-${i}`, zone, status, zone.id);
        
        // Cluster people near gate entrance
        const centerX = activeBoardingGate.x + activeBoardingGate.width / 2;
        const centerY = activeBoardingGate.y + activeBoardingGate.height / 2;
        person.x = clamp(centerX + (Math.random() - 0.5) * 35, activeBoardingGate.x + 5, activeBoardingGate.x + activeBoardingGate.width - 5);
        person.y = clamp(centerY + (Math.random() - 0.5) * 25, activeBoardingGate.y + 5, activeBoardingGate.y + activeBoardingGate.height - 5);
        person.targetX = person.x;
        person.targetY = person.y;
        person.waitTime = getWaitTime(status);
        
        people.push(person);
        if (status === 'waiting') waitingCount++;
      }
    } else {
      const isBusy = busyGates.includes(zone.id);
      const baseCount = Math.floor(totalPeople * distribution.gates / gateZones.length);
      const count = isBusy ? Math.floor(baseCount * 1.5) : Math.floor(baseCount * 0.7);
      addPeopleToZone(zone, count, 'waiting', zone.id, zone.id);
    }
  });

  // Waiting areas
  waitingZones.forEach(zone => {
    const count = Math.floor(totalPeople * distribution.waiting / waitingZones.length);
    addPeopleToZone(zone, count, 'waiting', zone.id, zone.id);
  });

  // APM platform
  if (apmZone) {
    const count = Math.floor(totalPeople * distribution.apm);
    addPeopleToZone(apmZone, count, 'boarding', 'apm', 'apm');
  }

  // Ensure at least 50 waiting - add more if needed
  const availableZones = [...waitingZones, ...gateZones.filter(z => z.id !== 'gate24')];
  while (waitingCount < CONFIG.MIN_WAITING_PEOPLE && people.length < totalPeople) {
    const randomZone = availableZones[Math.floor(Math.random() * availableZones.length)];
    if (randomZone) {
      const person = createPerson(`extra-waiting-${people.length}`, randomZone, 'waiting', randomZone.id);
      people.push(person);
      waitingCount++;
    } else {
      break;
    }
  }

  return people;
};

// Update person positions smoothly - keep people within bounds
const updatePeopleMovement = (
  people: Person[],
  zones: FloorPlanZone[],
  stationId?: string
): Person[] => {
  const isTerminal2 = stationId === 'T2';
  
  // Terminal 2 specific zones
  const mainCorridor = zones.find(z => z.id === 'main-corridor');
  const nearShop12 = zones.find(z => z.id === 'near-shop-12');
  const nearShop13 = zones.find(z => z.id === 'near-shop-13');
  const nearShop67 = zones.find(z => z.id === 'near-shop-6-7');
  
  // Standard terminal zones
  const securityZone = zones.find(z => z.id === 'security');
  const corridorZone = zones.find(z => z.id === 'corridor' || z.id === 'main-corridor');
  const gateZones = zones.filter(z => z.type === 'gate');
  const waitingZones = zones.filter(z => z.type === 'waiting');
  const apmZone = zones.find(z => z.id === 'apm');
  const activeBoardingGate = zones.find(z => z.id === 'gate24' || z.id === 'gate24-area');
  
  // Terminal bounds to keep people within frame
  const TERMINAL_BOUNDS = isTerminal2 ? {
    minX: 50,
    maxX: 1150,
    minY: 50,
    maxY: 550,
  } : {
    minX: 50,
    maxX: 750,
    minY: 50,
    maxY: 540,
  };
  
  // Terminal 2: Only walkable zones (corridor, gates, waiting areas near shops)
  const walkableZones = isTerminal2 
    ? [mainCorridor, ...gateZones, nearShop12, nearShop13, nearShop67].filter(Boolean)
    : zones.filter(z => z.type !== 'service' || z.id === 'security');

  return people.map(person => {
    const newPerson = { ...person };

    // Decrease wait time
    if (newPerson.waitTime > 0) {
      newPerson.waitTime -= CONFIG.MOVEMENT.animationFrameRate;
      return newPerson;
    }

    // Special handling for active boarding gate - people move out and disappear slowly
    if (newPerson.zone === 'gate24' && activeBoardingGate) {
      const currentZone = activeBoardingGate;
      
      if (newPerson.status === 'boarding' && newPerson.waitTime <= 0) {
        // Boarding people move out of gate faster and disappear
        const exitThreshold = currentZone.y + currentZone.height + 10;
        if (newPerson.y < exitThreshold) {
          // Still moving out - faster movement
          const centerX = currentZone.x + currentZone.width / 2;
          newPerson.targetX = centerX + (Math.random() - 0.5) * 20;
          newPerson.targetY = currentZone.y + currentZone.height + 25;
          newPerson.status = 'boarding';
          newPerson.waitTime = getWaitTime('boarding');
        } else {
          // Person has exited - mark for removal
          newPerson.targetX = currentZone.x + currentZone.width / 2;
          newPerson.targetY = currentZone.y + currentZone.height + 40;
          newPerson.status = 'boarding';
          newPerson.waitTime = 2000; // Shorter wait before removal
        }
      } else if (newPerson.status === 'moving' && newPerson.waitTime <= 0) {
        // Moving people approach the gate - cluster near center
        const centerX = currentZone.x + currentZone.width / 2;
        const centerY = currentZone.y + currentZone.height / 2;
        newPerson.targetX = clamp(centerX + (Math.random() - 0.5) * 30, currentZone.x + 10, currentZone.x + currentZone.width - 10);
        newPerson.targetY = clamp(centerY + (Math.random() - 0.5) * 20, currentZone.y + 10, currentZone.y + currentZone.height - 10);
        newPerson.waitTime = getWaitTime('moving');
        if (Math.random() > 0.5) {
          newPerson.status = 'boarding';
        }
      } else if (newPerson.status === 'waiting' && newPerson.waitTime <= 0) {
        // Waiting people stay clustered near gate
        const centerX = currentZone.x + currentZone.width / 2;
        const centerY = currentZone.y + currentZone.height / 2;
        newPerson.targetX = clamp(centerX + (Math.random() - 0.5) * 35, currentZone.x + 10, currentZone.x + currentZone.width - 10);
        newPerson.targetY = clamp(centerY + (Math.random() - 0.5) * 25, currentZone.y + 10, currentZone.y + currentZone.height - 10);
        newPerson.waitTime = getWaitTime('waiting');
        if (Math.random() > 0.65) {
          newPerson.status = Math.random() > 0.4 ? 'moving' : 'boarding';
        }
      }
    }

    // Update position based on velocity (smooth movement)
    const isBoardingAtGate24 = (newPerson.zone === 'gate24' || newPerson.zone === 'gate24-area') && newPerson.status === 'boarding';
    // Terminal 2 uses faster speeds
    const isBoardingAtGate23A = isTerminal2 && (newPerson.zone === 'gate23a-area') && newPerson.status === 'boarding';
    const speed = isTerminal2
      ? (isBoardingAtGate23A || isBoardingAtGate24 
          ? CONFIG.MOVEMENT.terminal2.boardingSpeed 
          : CONFIG.MOVEMENT.terminal2.baseSpeed)
      : (isBoardingAtGate24 
          ? CONFIG.MOVEMENT.boardingSpeed 
          : CONFIG.MOVEMENT.baseSpeed);
    const dx = newPerson.targetX - newPerson.x;
    const dy = newPerson.targetY - newPerson.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > CONFIG.MOVEMENT.minDistance) {
      // Move towards target - same smooth movement for all terminals
      newPerson.vx = (dx / distance) * speed;
      newPerson.vy = (dy / distance) * speed;
      newPerson.x += newPerson.vx;
      newPerson.y += newPerson.vy;
      newPerson.status = 'moving';
      
      // Clamp position to terminal bounds - same for all terminals
      newPerson.x = clamp(newPerson.x, TERMINAL_BOUNDS.minX, TERMINAL_BOUNDS.maxX);
      newPerson.y = clamp(newPerson.y, TERMINAL_BOUNDS.minY, TERMINAL_BOUNDS.maxY);
    } else {
      // Reached target, decide next move
      newPerson.x = newPerson.targetX;
      newPerson.y = newPerson.targetY;
      newPerson.vx = 0;
      newPerson.vy = 0;

      // Movement logic - same smooth pattern for all terminals, but Terminal 2 only selects targets in walkable zones
      if (isTerminal2) {
        // Terminal 2: Special handling for boarding gate and coffee shop clusters
        const isBoardingGate23A = newPerson.zone === 'gate23a-area' && newPerson.status === 'boarding';
        const isCoffeeShopCluster = newPerson.zone.startsWith('near-shop');
        
        if (isBoardingGate23A) {
          // Boarding gate 23A - organized queue movement toward gate entrance
          const gate23A = gateZones.find(g => g.id === 'gate23a-area');
          if (gate23A) {
            const gateCenterX = gate23A.x + gate23A.width / 2;
            const gateEntranceY = gate23A.y + 15; // Gate entrance direction
            
            // Movement vector toward gate entrance - tighter grouping, reduced wandering
            newPerson.targetX = gateCenterX + (Math.random() - 0.5) * 10; // Tighter spread
            newPerson.targetY = gateEntranceY + (Math.random() - 0.5) * 5;
            newPerson.status = 'boarding';
            newPerson.waitTime = getWaitTime('boarding');
          }
        } else if (isCoffeeShopCluster) {
          // Coffee shop clusters - mostly stationary, minimal movement
          const shopZone = walkableZones.find(z => z.id === newPerson.zone);
          if (shopZone) {
            // Very slow, minimal movement - mostly stay in place
            if (Math.random() > 0.8) {
              // Occasionally small movement within cluster
              const shopCenterX = shopZone.x + shopZone.width / 2;
              const shopCenterY = shopZone.y + shopZone.height / 2;
              const angle = Math.random() * Math.PI * 2;
              const radius = 10 + Math.random() * 10;
              newPerson.targetX = shopCenterX + Math.cos(angle) * radius;
              newPerson.targetY = shopCenterY + Math.sin(angle) * radius;
              newPerson.waitTime = getWaitTime('waiting') * 3; // Very long wait (mostly stationary)
            } else {
              // Stay in place
              newPerson.targetX = newPerson.x;
              newPerson.targetY = newPerson.y;
              newPerson.waitTime = getWaitTime('waiting') * 3;
            }
            newPerson.status = 'waiting';
          }
        } else if (newPerson.zone === 'main-corridor' && mainCorridor) {
          // Main corridor - slow-moving, balanced distribution
          if (Math.random() > 0.7 && gateZones.length > 0) {
            const randomGate = gateZones[Math.floor(Math.random() * gateZones.length)];
            newPerson.zone = randomGate.id;
            const targetPos = getRandomPositionInZone(randomGate);
            newPerson.targetX = targetPos.x;
            newPerson.targetY = targetPos.y;
            newPerson.status = 'moving';
            newPerson.waitTime = getWaitTime('moving');
          } else {
            // Stay in corridor - slow random movement
            const targetPos = getRandomPositionInZone(mainCorridor);
            newPerson.targetX = targetPos.x;
            newPerson.targetY = targetPos.y;
            newPerson.waitTime = getWaitTime('waiting');
          }
        } else if (newPerson.zone.startsWith('gate') && gateZones.some(g => g.id === newPerson.zone)) {
          // Other gates - can move back to corridor or stay
          if (Math.random() > 0.6 && mainCorridor) {
            newPerson.zone = 'main-corridor';
            const targetPos = getRandomPositionInZone(mainCorridor);
            newPerson.targetX = targetPos.x;
            newPerson.targetY = targetPos.y;
            newPerson.status = 'moving';
            newPerson.waitTime = getWaitTime('moving');
          } else {
            // Stay at gate
            const gateZone = gateZones.find(g => g.id === newPerson.zone);
            if (gateZone) {
              const targetPos = getRandomPositionInZone(gateZone);
              newPerson.targetX = targetPos.x;
              newPerson.targetY = targetPos.y;
              newPerson.waitTime = getWaitTime('waiting');
            }
          }
        } else {
          // Fallback: move to main corridor
          if (mainCorridor) {
            newPerson.zone = 'main-corridor';
            const targetPos = getRandomPositionInZone(mainCorridor);
            newPerson.targetX = targetPos.x;
            newPerson.targetY = targetPos.y;
            newPerson.status = 'moving';
            newPerson.waitTime = getWaitTime('moving');
          }
        }
      } else {
        // Standard terminal movement flow: security -> corridor -> gates -> APM
        if (newPerson.zone === 'security' && corridorZone) {
          // Move to corridor
          newPerson.zone = 'corridor';
          newPerson.targetX = Math.max(
            corridorZone.x + 5,
            Math.min(corridorZone.x + corridorZone.width - 5, corridorZone.x + Math.random() * corridorZone.width)
          );
          newPerson.targetY = Math.max(
            corridorZone.y + 5,
            Math.min(corridorZone.y + corridorZone.height - 5, corridorZone.y + Math.random() * corridorZone.height)
          );
          newPerson.status = 'moving';
        } else if (newPerson.zone === 'corridor' && gateZones.length > 0) {
          // Move to a random gate (prefer non-boarding gates, but allow some to gate24)
          const availableGates = gateZones.filter(g => g.id !== 'gate24' || Math.random() > 0.85);
          const randomGate = availableGates[Math.floor(Math.random() * availableGates.length)];
          if (randomGate) {
            newPerson.zone = randomGate.id;
            const targetPos = getRandomPositionInZone(randomGate, CONFIG.MOVEMENT.gatePadding);
            newPerson.targetX = targetPos.x;
            newPerson.targetY = targetPos.y;
            newPerson.status = 'moving';
            newPerson.waitTime = getWaitTime('waiting');
          }
        } else if (newPerson.zone.startsWith('gate') && newPerson.zone !== 'gate24' && apmZone && Math.random() > 0.7) {
          // Some people move to APM after gate (but not from active boarding gate)
          newPerson.zone = 'apm';
          const targetPos = getRandomPositionInZone(apmZone);
          newPerson.targetX = targetPos.x;
          newPerson.targetY = targetPos.y;
          newPerson.status = 'boarding';
          newPerson.waitTime = getWaitTime('boarding');
        } else {
          // Random movement within current zone - ensure within bounds
          const currentZone = zones.find(z => z.id === newPerson.zone);
          if (currentZone) {
            const padding = currentZone.type === 'gate' ? CONFIG.MOVEMENT.gatePadding : CONFIG.MOVEMENT.zonePadding;
            const targetPos = getRandomPositionInZone(currentZone, padding);
            newPerson.targetX = targetPos.x;
            newPerson.targetY = targetPos.y;
            newPerson.waitTime = getWaitTime('waiting');
            newPerson.status = 'waiting';
          }
        }
      }
      
      // Ensure target is within terminal bounds AND zone bounds
      const currentZone = zones.find(z => z.id === newPerson.zone);
      if (currentZone) {
        const padding = currentZone.type === 'gate' ? CONFIG.MOVEMENT.gatePadding : CONFIG.MOVEMENT.zonePadding;
        newPerson.targetX = clamp(
          newPerson.targetX,
          Math.max(TERMINAL_BOUNDS.minX, currentZone.x + padding),
          Math.min(TERMINAL_BOUNDS.maxX, currentZone.x + currentZone.width - padding)
        );
        newPerson.targetY = clamp(
          newPerson.targetY,
          Math.max(TERMINAL_BOUNDS.minY, currentZone.y + padding),
          Math.min(TERMINAL_BOUNDS.maxY, currentZone.y + currentZone.height - padding)
        );
      } else {
        // Fallback to terminal bounds only
        newPerson.targetX = clamp(newPerson.targetX, TERMINAL_BOUNDS.minX, TERMINAL_BOUNDS.maxX);
        newPerson.targetY = clamp(newPerson.targetY, TERMINAL_BOUNDS.minY, TERMINAL_BOUNDS.maxY);
      }
    }
    
    // Final clamp of position to ensure never outside bounds - same for all terminals
    newPerson.x = clamp(newPerson.x, TERMINAL_BOUNDS.minX, TERMINAL_BOUNDS.maxX);
    newPerson.y = clamp(newPerson.y, TERMINAL_BOUNDS.minY, TERMINAL_BOUNDS.maxY);
    
    // For Terminal 2, only do a gentle check - if way outside walkable zones, gently nudge back
    // But allow smooth overlapping movement like standard terminals
    if (isTerminal2) {
      const isInWalkableZone = walkableZones.some(z => {
        // Use a more lenient check - allow some overlap outside zones for smooth movement
        const margin = 20; // Allow 20px margin for smooth transitions
        return newPerson.x >= z.x - margin && newPerson.x <= z.x + z.width + margin &&
               newPerson.y >= z.y - margin && newPerson.y <= z.y + z.height + margin;
      });
      
      // Only correct if way outside (more than 50px from any walkable zone)
      if (!isInWalkableZone) {
        let nearestZone = walkableZones[0];
        let minDistance = Infinity;
        
        walkableZones.forEach(zone => {
          const zoneCenterX = zone.x + zone.width / 2;
          const zoneCenterY = zone.y + zone.height / 2;
          const distance = Math.sqrt(
            Math.pow(newPerson.x - zoneCenterX, 2) + 
            Math.pow(newPerson.y - zoneCenterY, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestZone = zone;
          }
        });
        
        // Only snap if really far away (more than 50px)
        if (minDistance > 50 && nearestZone) {
          // Gently move towards nearest zone instead of snapping
          const zoneCenterX = nearestZone.x + nearestZone.width / 2;
          const zoneCenterY = nearestZone.y + nearestZone.height / 2;
          const dx = zoneCenterX - newPerson.x;
          const dy = zoneCenterY - newPerson.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            // Move 10% towards the zone center (smooth correction)
            newPerson.x += dx * 0.1;
            newPerson.y += dy * 0.1;
            newPerson.targetX = zoneCenterX;
            newPerson.targetY = zoneCenterY;
            newPerson.zone = nearestZone.id;
          }
        }
      }
    }

    return newPerson;
  });
};

export const TerminalHeatmapModal: React.FC<TerminalHeatmapModalProps> = ({ station, onClose }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [zones, setZones] = useState<FloorPlanZone[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [targetPeopleCount, setTargetPeopleCount] = useState(0);
  const [initialPeopleCount, setInitialPeopleCount] = useState(0); // Store initial count for variation
  const [lastCountUpdate, setLastCountUpdate] = useState(Date.now());

  useEffect(() => {
    if (!station) return;

    const floorPlanZones = getTerminalFloorPlan(station.id);
    setZones(floorPlanZones);

    // Get target count - keep around 150 people
    const targetCount = 150;
    setTargetPeopleCount(targetCount);

    // Generate initial people
    const initialPeople = generatePeople(floorPlanZones, station.id);
    setPeople(initialPeople);
    setInitialPeopleCount(initialPeople.length); // Store initial count for variation
    setLastCountUpdate(Date.now());
  }, [station]);

  // Gradually adjust people count towards target (10-15% increments with delay)
  useEffect(() => {
    if (!isLive || !station) return;

    // Update target count periodically - vary by 10-15% from initial
    const updateTargetInterval = setInterval(() => {
      setTargetPeopleCount(prev => {
        if (prev === 0 || initialPeopleCount === 0) return prev;
        
        const { min, max } = CONFIG.COUNT_ADJUSTMENT.variationPercent;
        const variationPercent = min + (Math.random() * (max - min));
        const variation = Math.floor(initialPeopleCount * variationPercent);
        const sign = Math.random() > 0.5 ? 1 : -1;
        const newTargetCount = initialPeopleCount + (sign * variation);
        
        const change = Math.abs(newTargetCount - prev) / Math.max(prev, 1);
        if (change > CONFIG.COUNT_ADJUSTMENT.minChangeThreshold) {
          const baseCount = station.id === 'T2' ? CONFIG.TERMINAL2_PEOPLE : CONFIG.STANDARD_TERMINAL_PEOPLE;
          return clamp(newTargetCount, baseCount * 0.8, baseCount * 1.2);
        }
        return prev;
      });
    }, CONFIG.COUNT_ADJUSTMENT.targetUpdateInterval);

    // Gradually adjust actual count towards target with 10-15% increments
    const adjustInterval = setInterval(() => {
      setPeople(prevPeople => {
        const currentCount = prevPeople.length;
        const difference = targetPeopleCount - currentCount;

        if (Math.abs(difference) <= 2) {
          return prevPeople;
        }

        const { min, max } = CONFIG.COUNT_ADJUSTMENT.incrementPercent;
        const incrementPercent = min + (Math.random() * (max - min));
        const maxChange = Math.max(1, Math.floor(currentCount * incrementPercent));
        const changeAmount = Math.sign(difference) * Math.min(Math.abs(difference), maxChange);

        if (Math.abs(changeAmount) < 1) {
          return prevPeople;
        }

        const floorPlanZones = getTerminalFloorPlan(station.id);

        if (changeAmount > 0) {
          // Add people gradually - spawn them at security or entrance
          const securityZone = floorPlanZones.find(z => z.id === 'security');
          const spawnZone = securityZone || floorPlanZones.find(z => z.type === 'waiting') || floorPlanZones[0];
          
          const peopleToAdd = Math.floor(changeAmount);
          const addedPeople: Person[] = [];
          
          for (let i = 0; i < peopleToAdd; i++) {
            const x = Math.max(
              spawnZone.x + 5,
              Math.min(spawnZone.x + spawnZone.width - 5, spawnZone.x + Math.random() * spawnZone.width)
            );
            const y = Math.max(
              spawnZone.y + 5,
              Math.min(spawnZone.y + spawnZone.height - 5, spawnZone.y + Math.random() * spawnZone.height)
            );
            addedPeople.push({
              id: `new-${Date.now()}-${Math.random()}`,
              x,
              y,
              vx: 0,
              vy: 0,
              targetX: x,
              targetY: y,
              status: 'waiting',
              zone: spawnZone.id,
              waitTime: Math.random() * 2000 + 1000, // Wait 1-3 seconds before moving
            });
          }
          
          return [...prevPeople, ...addedPeople];
        } else {
          // Remove people gradually - prefer removing those who have exited gate24 or are at APM
          const peopleToRemove = Math.floor(Math.abs(changeAmount));
          
          // Prefer removing people who have moved out of gate24 (exited) or are at APM
          const gate24 = floorPlanZones.find(z => z.id === 'gate24');
          const sortedPeople = [...prevPeople].sort((a, b) => {
            // People who have exited gate24 (moved significantly below gate) get highest priority
            const aExited = a.zone === 'gate24' && gate24 && a.y > gate24.y + gate24.height + 20;
            const bExited = b.zone === 'gate24' && gate24 && b.y > gate24.y + gate24.height + 20;
            if (aExited && !bExited) return -1;
            if (!aExited && bExited) return 1;
            // People at gate24 who are boarding and moving out
            const aExiting = a.zone === 'gate24' && a.status === 'boarding' && gate24 && a.y > gate24.y + gate24.height + 10;
            const bExiting = b.zone === 'gate24' && b.status === 'boarding' && gate24 && b.y > gate24.y + gate24.height + 10;
            if (aExiting && !bExiting) return -1;
            if (!aExiting && bExiting) return 1;
            if (a.zone === 'apm' && b.zone !== 'apm') return -1;
            if (a.zone !== 'apm' && b.zone === 'apm') return 1;
            if (a.status === 'boarding' && b.status !== 'boarding') return -1;
            if (a.status !== 'boarding' && b.status === 'boarding') return 1;
            return Math.random() - 0.5; // Random for others
          });
          
          return sortedPeople.slice(peopleToRemove);
        }
      });
    }, CONFIG.COUNT_ADJUSTMENT.countAdjustInterval);

    return () => {
      clearInterval(updateTargetInterval);
      clearInterval(adjustInterval);
    };
  }, [station, isLive, targetPeopleCount, initialPeopleCount]);

  // Smooth continuous movement using requestAnimationFrame
  useEffect(() => {
    if (!station || !isLive) return;

    const floorPlanZones = getTerminalFloorPlan(station.id);
    let animationFrameId: number;

    const animate = () => {
      // Update people movement smoothly (60fps)
      setPeople(prevPeople => {
        if (prevPeople.length === 0) return prevPeople;
        return updatePeopleMovement(prevPeople, floorPlanZones, station.id);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [station, isLive, people.length]);

  if (!station) return null;

  // Get person color based on status
  const getPersonColor = (person: Person): string => {
    // Terminal 2: All people are blue dots
    if (station?.id === 'T2') {
      return '#3b82f6'; // blue - all people in Terminal 2
    }
    // Standard terminals: Color by status
    if (person.status === 'boarding') return '#fbbf24'; // yellow/amber - boarding
    if (person.status === 'moving') return '#3b82f6'; // blue - moving
    return '#10b981'; // green - waiting
  };

  // Calculate heatmap intensity for a zone based on people count
  const getZoneIntensity = (zone: FloorPlanZone): number => {
    const zonePeople = people.filter(p => p.zone === zone.id);
    // Calculate density: people per square unit
    const area = zone.width * zone.height;
    const density = zonePeople.length / (area / 1000); // Normalize by area
    return Math.min(100, density * 10); // Scale to 0-100
  };

  // Generate heatmap grid for smooth visualization
  const generateHeatmapGrid = (): Array<{ x: number; y: number; intensity: number }> => {
    const isTerminal2 = station?.id === 'T2';
    const gridSize = 20;
    const viewWidth = isTerminal2 ? 1200 : 800;
    const viewHeight = isTerminal2 ? 600 : 550;
    const grid: Array<{ x: number; y: number; intensity: number }> = [];
    const cellWidth = viewWidth / gridSize;
    const cellHeight = viewHeight / gridSize;

    const startX = isTerminal2 ? 0 : 50;
    const startY = isTerminal2 ? 0 : 50;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = startX + i * cellWidth;
        const y = startY + j * cellHeight;
        
        // For Terminal 2, only show heatmap in grey walkable areas
        if (isTerminal2) {
          const mainCorridor = zones.find(z => z.id === 'main-corridor');
          const gateZones = zones.filter(z => z.type === 'gate');
          const nearShopZones = zones.filter(z => z.id.startsWith('near-shop'));
          
          // Check if this grid cell is in a walkable zone
          const isInWalkableZone = 
            (mainCorridor && x >= mainCorridor.x && x <= mainCorridor.x + mainCorridor.width &&
             y >= mainCorridor.y && y <= mainCorridor.y + mainCorridor.height) ||
            gateZones.some(g => x >= g.x && x <= g.x + g.width && y >= g.y && y <= g.y + g.height) ||
            nearShopZones.some(s => x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height);
          
          if (!isInWalkableZone) continue; // Skip non-walkable areas
        }
        
        // Count people near this grid cell
        const radius = Math.max(cellWidth, cellHeight) * 1.5;
        const nearbyPeople = people.filter(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < radius;
        });
        
        // Calculate intensity - Terminal 2 uses less sensitive settings for heavy clustering only
        const intensityMultiplier = isTerminal2 
          ? CONFIG.HEATMAP.terminal2.intensityMultiplier 
          : CONFIG.HEATMAP.intensityMultiplier;
        const minIntensity = isTerminal2 
          ? CONFIG.HEATMAP.terminal2.minIntensity 
          : CONFIG.HEATMAP.minIntensity;
        
        const intensity = Math.min(100, nearbyPeople.length * intensityMultiplier);
        
        // Terminal 2: Only show heavy clusters (higher threshold)
        // Standard terminals: Show all cells above minimum
        if (intensity > minIntensity) {
          grid.push({ x, y, intensity });
        }
      }
    }
    
    return grid;
  };

  const getHeatmapColor = (intensity: number, isTerminal2?: boolean, zoneId?: string): string => {
    // Terminal 2: Special color coding with higher thresholds for heavy clustering only
    if (isTerminal2) {
      const { low, moderate } = CONFIG.HEATMAP.terminal2.thresholds;
      
      // Boarding gate 23A - red/orange for very high density only
      if (zoneId === 'gate23a-area') {
        if (intensity < moderate) return '#fb923c'; // orange
        return '#ef4444'; // red - only for very high density boarding
      }
      // Coffee shop clusters - yellow/orange (not red), higher thresholds
      if (zoneId && zoneId.startsWith('near-shop')) {
        if (intensity < low) return '#fde047'; // brighter light yellow
        if (intensity < moderate) return '#facc15'; // brighter yellow
        return '#fb923c'; // orange (not red)
      }
      // General areas - higher thresholds to show only heavy clustering
      if (intensity < low) return '#fde047'; // brighter light yellow - Low Traffic
      if (intensity < moderate) return '#facc15'; // brighter yellow - Moderate Traffic
      return '#ef4444'; // red - Hot Spots (only very heavy clusters)
    }
    
    // Standard terminals: 3 levels with normal thresholds
    const { low, moderate } = CONFIG.HEATMAP.thresholds;
    if (intensity < low) return '#fde047'; // brighter light yellow - Low Traffic
    if (intensity < moderate) return '#facc15'; // brighter yellow - Moderate Traffic
    return '#ef4444'; // red - Hot Spots
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 shadow-xl max-h-[95vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{station.name} - Real-Time Heatmap</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">{isLive ? 'LIVE' : 'PAUSED'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="relative border border-gray-300 rounded-lg bg-blue-50 overflow-hidden" style={{ height: '700px' }}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox={station?.id === 'T2' ? CONFIG.VIEWBOX.terminal2 : CONFIG.VIEWBOX.standard} 
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Terminal 2: Load actual floor plan image as background */}
            {station?.id === 'T2' && (
              <image
                href="/terminal-2-floor-plan.png"
                x="0"
                y="0"
                width="1200"
                height="600"
                preserveAspectRatio="xMidYMid meet"
                opacity="0.9"
              />
            )}
            
            {/* Standard terminal: Terminal building background (light blue) */}
            {station?.id !== 'T2' && (
              <rect
                x="100"
                y="50"
                width="600"
                height="400"
                fill="#bfdbfe"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
            )}

            {/* Heatmap overlay - smooth gradient circles with Gaussian smoothing */}
            {generateHeatmapGrid().map((cell, index) => {
              const isTerminal2 = station?.id === 'T2';
              // For Terminal 2, determine zone for color coding
              let zoneId: string | undefined;
              if (isTerminal2) {
                const gate23A = zones.find(z => z.id === 'gate23a-area');
                const nearShopZones = zones.filter(z => z.id.startsWith('near-shop'));
                
                // Check if cell is in boarding gate area
                if (gate23A && 
                    cell.x >= gate23A.x && cell.x <= gate23A.x + gate23A.width &&
                    cell.y >= gate23A.y && cell.y <= gate23A.y + gate23A.height) {
                  zoneId = 'gate23a-area';
                } else {
                  // Check if cell is in coffee shop cluster area
                  const shopZone = nearShopZones.find(s => 
                    cell.x >= s.x && cell.x <= s.x + s.width &&
                    cell.y >= s.y && cell.y <= s.y + s.height
                  );
                  if (shopZone) {
                    zoneId = shopZone.id;
                  }
                }
              }
              
              const color = getHeatmapColor(cell.intensity, isTerminal2, zoneId);
              // Semi-transparent circles - size reflects density, Gaussian smoothing effect
              const opacity = isTerminal2 
                ? Math.min(0.5, cell.intensity / 120) // More subtle for Terminal 2
                : Math.min(0.6, cell.intensity / 150);
              // Circle size reflects local density - reduced to 60% of original size
              const radius = isTerminal2 
                ? 12 + (cell.intensity / 100) * 9 // 12-21px for Terminal 2 (60% of 20-35px)
                : 15; // 15px for standard terminals (60% of 25px)
              
              return (
                <circle
                  key={`heat-${index}`}
                  cx={cell.x}
                  cy={cell.y}
                  r={radius}
                  fill={color}
                  opacity={opacity}
                />
              );
            })}

            {/* Floor plan zones - Only show for non-T2 terminals (T2 uses actual image) */}
            {station?.id !== 'T2' && zones.map(zone => {
              if (zone.id === 'terminal') return null; // Skip main terminal rect, already drawn
              
              const intensity = getZoneIntensity(zone);
              const heatmapColor = getHeatmapColor(intensity);
              const isGate = zone.type === 'gate';
              const isActiveBoarding = zone.id === 'gate24';
              
              return (
                <g key={zone.id}>
                  <rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.width}
                    height={zone.height}
                    fill={isGate ? (isActiveBoarding ? '#fee2e2' : '#ffffff') : heatmapColor}
                    opacity={isGate ? 0.8 : Math.min(0.4, intensity / 200)}
                    stroke={isGate ? (isActiveBoarding ? '#ef4444' : '#1f2937') : '#6b7280'}
                    strokeWidth={isGate ? (isActiveBoarding ? '3' : '2') : '1.5'}
                    strokeDasharray={isGate ? '0' : '3,3'}
                  />
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + zone.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`${isGate ? 'text-xs font-bold' : 'text-xs'} ${isActiveBoarding ? 'fill-red-700' : 'fill-gray-800'} pointer-events-none`}
                  >
                    {zone.name}
                  </text>
                  {isActiveBoarding && (
                    <text
                      x={zone.x + zone.width / 2}
                      y={zone.y - 8}
                      textAnchor="middle"
                      className="text-xs font-bold fill-red-600 pointer-events-none"
                    >
                      BOARDING
                    </text>
                  )}
                </g>
              );
            })}

            {/* People as dots - show on top */}
            {people.map(person => (
              <circle
                key={person.id}
                cx={person.x}
                cy={person.y}
                r="3"
                fill={getPersonColor(person)}
                stroke="#fff"
                strokeWidth="0.5"
                opacity="0.9"
              />
            ))}
          </svg>
        </div>

        {/* Controls and Legend */}
        <div className="mt-4 space-y-3">
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded font-medium ${
                isLive 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isLive ? '⏸ Pause' : '▶ Play'}
            </button>
            <div className="text-sm text-gray-600">
              People Count: <span className="font-bold text-blue-700">{people.length}</span>
            </div>
          </div>

          {/* Legend and Controls */}
          <div className="mt-4 space-y-3">
            {/* Congestion Heatmap Legend */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-800 mb-2">Congestion Heatmap:</div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-yellow-200 border border-yellow-400"></div>
                  <span className="text-xs text-gray-700 font-medium">Low Traffic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-yellow-400 border border-yellow-500"></div>
                  <span className="text-xs text-gray-700 font-medium">Moderate Traffic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-600 border border-red-700"></div>
                  <span className="text-xs text-gray-700 font-medium">Hot Spots</span>
                </div>
              </div>
            </div>

            {/* People Status and Info */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">People Status:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">Waiting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">Moving</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span className="text-xs text-gray-600">Boarding</span>
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  Total: <span className="font-bold">{people.length}</span> people
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Data Source: Camera feed analysis • Updates every 1.5s
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

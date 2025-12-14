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

// LAX Terminal 2 layout based on the map
const getTerminalFloorPlan = (stationId: string): FloorPlanZone[] => {
  // Use LAX Terminal 2 layout for all terminals (can be customized per terminal)
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
    { id: 'apm', name: 'APM Platform', x: 100, y: 460, width: 600, height: 40, type: 'apm' },

    // Waiting areas (distributed in terminal)
    { id: 'wait1', name: 'Waiting Area 1', x: 250, y: 120, width: 100, height: 60, type: 'waiting' },
    { id: 'wait2', name: 'Waiting Area 2', x: 400, y: 120, width: 100, height: 60, type: 'waiting' },
    { id: 'wait3', name: 'Waiting Area 3', x: 250, y: 320, width: 100, height: 60, type: 'waiting' },
    { id: 'wait4', name: 'Waiting Area 4', x: 400, y: 320, width: 100, height: 60, type: 'waiting' },
  ];
};

// Generate people with initial positions and movement targets
const generatePeople = (zones: FloorPlanZone[], stationId: string): Person[] => {
  const people: Person[] = [];
  const waitingData = getStationWaitingData(stationId);
  const totalPeople = 200; // Keep around 200 people

  const securityZone = zones.find(z => z.id === 'security');
  const corridorZone = zones.find(z => z.id === 'corridor');
  const gateZones = zones.filter(z => z.type === 'gate');
  const waitingZones = zones.filter(z => z.type === 'waiting');
  const apmZone = zones.find(z => z.id === 'apm');

  const distribution = {
    security: 0.12,
    corridor: 0.35, // Increased from 0.25 to show more people in corridor
    gates: 0.35,
    waiting: 0.15,
    apm: 0.03, // Reduced from 0.05 to show fewer people in APM
  };

  // Track waiting count to ensure at least 50 waiting
  let waitingCount = 0;

  // Helper to create person with movement properties
  const createPerson = (
    id: string,
    zone: FloorPlanZone,
    status: 'waiting' | 'moving' | 'boarding',
    zoneId: string
  ): Person => {
    const x = zone.x + Math.random() * zone.width;
    const y = zone.y + Math.random() * zone.height;
    return {
      id,
      x,
      y,
      vx: 0,
      vy: 0,
      targetX: x,
      targetY: y,
      status,
      zone: zoneId,
      waitTime: status === 'waiting' ? Math.random() * 3000 + 2000 : 0, // Wait 2-5 seconds
    };
  };

  // Security area
  if (securityZone) {
    const count = Math.floor(totalPeople * distribution.security);
    for (let i = 0; i < count; i++) {
      const person = createPerson(`security-${i}`, securityZone, 'waiting', 'security');
      // Ensure within bounds
      person.x = Math.max(securityZone.x + 5, Math.min(securityZone.x + securityZone.width - 5, person.x));
      person.y = Math.max(securityZone.y + 5, Math.min(securityZone.y + securityZone.height - 5, person.y));
      person.targetX = person.x;
      person.targetY = person.y;
      people.push(person);
      waitingCount++;
    }
  }

  // Main corridor - moving people
  if (corridorZone) {
    const count = Math.floor(totalPeople * distribution.corridor);
    for (let i = 0; i < count; i++) {
      const person = createPerson(`corridor-${i}`, corridorZone, 'moving', 'corridor');
      // Set target to move along corridor - ensure within bounds
      person.x = Math.max(corridorZone.x + 5, Math.min(corridorZone.x + corridorZone.width - 5, person.x));
      person.y = Math.max(corridorZone.y + 5, Math.min(corridorZone.y + corridorZone.height - 5, person.y));
      person.targetX = Math.max(corridorZone.x + 5, Math.min(corridorZone.x + corridorZone.width - 5, corridorZone.x + Math.random() * corridorZone.width));
      person.targetY = Math.max(corridorZone.y + 5, Math.min(corridorZone.y + corridorZone.height - 5, corridorZone.y + Math.random() * corridorZone.height));
      person.vx = (Math.random() - 0.5) * 0.3; // Slow movement
      person.vy = (Math.random() - 0.5) * 0.3;
      people.push(person);
    }
  }

  // Gates - Gate 24 is the active boarding gate with cluster activity
  const activeBoardingGate = gateZones.find(z => z.id === 'gate24');
  const busyGates = ['gate23', 'gate22', 'gate21'];
  
  gateZones.forEach(zone => {
    if (zone.id === 'gate24' && activeBoardingGate) {
      // Active boarding gate - high density cluster (40+ people)
      // Mix of boarding, moving, and waiting
      const boardingCount = 45;
      for (let i = 0; i < boardingCount; i++) {
        let status: 'waiting' | 'moving' | 'boarding';
        if (i < 15) {
          status = 'boarding'; // Actively boarding
        } else if (i < 30) {
          status = 'moving'; // Moving towards gate
        } else {
          status = 'waiting'; // Waiting near gate
          waitingCount++;
        }
        
        const person = createPerson(`${zone.id}-${i}`, zone, status, zone.id);
        // Cluster people near gate entrance
        person.x = Math.max(
          activeBoardingGate.x + 5,
          Math.min(
            activeBoardingGate.x + activeBoardingGate.width - 5,
            activeBoardingGate.x + activeBoardingGate.width / 2 + (Math.random() - 0.5) * 35
          )
        );
        person.y = Math.max(
          activeBoardingGate.y + 5,
          Math.min(
            activeBoardingGate.y + activeBoardingGate.height - 5,
            activeBoardingGate.y + activeBoardingGate.height / 2 + (Math.random() - 0.5) * 25
          )
        );
        person.targetX = person.x;
        person.targetY = person.y;
        
        if (person.status === 'boarding') {
          person.waitTime = Math.random() * 2000 + 500; // Short wait before moving out
        } else if (person.status === 'moving') {
          person.waitTime = Math.random() * 1500 + 500;
        } else {
          person.waitTime = Math.random() * 5000 + 3000; // Longer wait for those waiting
        }
        people.push(person);
      }
    } else {
      const isBusy = busyGates.includes(zone.id);
      const baseCount = Math.floor(totalPeople * distribution.gates / gateZones.length);
      const count = isBusy ? Math.floor(baseCount * 1.5) : Math.floor(baseCount * 0.7);
      
      for (let i = 0; i < count; i++) {
        const person = createPerson(`${zone.id}-${i}`, zone, 'waiting', zone.id);
        // Ensure people stay within gate bounds
        person.x = Math.max(zone.x + 5, Math.min(zone.x + zone.width - 5, person.x));
        person.y = Math.max(zone.y + 5, Math.min(zone.y + zone.height - 5, person.y));
        person.targetX = person.x;
        person.targetY = person.y;
        people.push(person);
        waitingCount++;
      }
    }
  });

  // Waiting areas
  waitingZones.forEach(zone => {
    const count = Math.floor(totalPeople * distribution.waiting / waitingZones.length);
    for (let i = 0; i < count; i++) {
      const person = createPerson(`${zone.id}-${i}`, zone, 'waiting', zone.id);
      // Ensure within bounds
      person.x = Math.max(zone.x + 5, Math.min(zone.x + zone.width - 5, person.x));
      person.y = Math.max(zone.y + 5, Math.min(zone.y + zone.height - 5, person.y));
      person.targetX = person.x;
      person.targetY = person.y;
      people.push(person);
      waitingCount++;
    }
  });

  // APM platform
  if (apmZone) {
    const count = Math.floor(totalPeople * distribution.apm);
    for (let i = 0; i < count; i++) {
      const person = createPerson(`apm-${i}`, apmZone, 'boarding', 'apm');
      // Ensure within bounds
      person.x = Math.max(apmZone.x + 5, Math.min(apmZone.x + apmZone.width - 5, person.x));
      person.y = Math.max(apmZone.y + 5, Math.min(apmZone.y + apmZone.height - 5, person.y));
      person.targetX = person.x;
      person.targetY = person.y;
      people.push(person);
    }
  }

  // Ensure at least 50 waiting - add more if needed
  while (waitingCount < 50 && people.length < totalPeople) {
    const randomZone = [...waitingZones, ...gateZones.filter(z => z.id !== 'gate24')][
      Math.floor(Math.random() * ([...waitingZones, ...gateZones.filter(z => z.id !== 'gate24')].length))
    ];
    if (randomZone) {
      const person = createPerson(`extra-waiting-${people.length}`, randomZone, 'waiting', randomZone.id);
      person.x = Math.max(randomZone.x + 5, Math.min(randomZone.x + randomZone.width - 5, person.x));
      person.y = Math.max(randomZone.y + 5, Math.min(randomZone.y + randomZone.height - 5, person.y));
      person.targetX = person.x;
      person.targetY = person.y;
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
  zones: FloorPlanZone[]
): Person[] => {
  const securityZone = zones.find(z => z.id === 'security');
  const corridorZone = zones.find(z => z.id === 'corridor');
  const gateZones = zones.filter(z => z.type === 'gate');
  const apmZone = zones.find(z => z.id === 'apm');
  const activeBoardingGate = zones.find(z => z.id === 'gate24');
  
  // Terminal bounds to keep people within frame
  const TERMINAL_BOUNDS = {
    minX: 50,
    maxX: 750,
    minY: 50,
    maxY: 540,
  };

  return people.map(person => {
    const newPerson = { ...person };

    // Decrease wait time
    if (newPerson.waitTime > 0) {
      newPerson.waitTime -= 16; // ~60fps update
      return newPerson;
    }

    // Special handling for active boarding gate - people move out and disappear slowly
    if (newPerson.zone === 'gate24' && activeBoardingGate) {
      const currentZone = activeBoardingGate;
      
      if (newPerson.status === 'boarding' && newPerson.waitTime <= 0) {
        // Boarding people move out of gate slowly and disappear
        // Move towards the bottom edge of the gate (exiting)
        if (newPerson.y < currentZone.y + currentZone.height + 10) {
          // Still moving out
          newPerson.targetX = currentZone.x + currentZone.width / 2 + (Math.random() - 0.5) * 20;
          newPerson.targetY = currentZone.y + currentZone.height + 25; // Move out below gate
          newPerson.status = 'boarding';
          newPerson.waitTime = Math.random() * 1500 + 500; // Slow movement out
        } else {
          // Person has exited - mark for removal by moving further out
          newPerson.targetX = currentZone.x + currentZone.width / 2;
          newPerson.targetY = currentZone.y + currentZone.height + 40; // Further out
          newPerson.status = 'boarding';
          newPerson.waitTime = 5000; // Wait before removal
        }
      } else if (newPerson.status === 'moving' && newPerson.waitTime <= 0) {
        // Moving people approach the gate
        newPerson.targetX = Math.max(
          currentZone.x + 10,
          Math.min(
            currentZone.x + currentZone.width - 10,
            currentZone.x + currentZone.width / 2 + (Math.random() - 0.5) * 30
          )
        );
        newPerson.targetY = Math.max(
          currentZone.y + 10,
          Math.min(
            currentZone.y + currentZone.height - 10,
            currentZone.y + currentZone.height / 2 + (Math.random() - 0.5) * 20
          )
        );
        newPerson.waitTime = Math.random() * 3000 + 1000;
        // Some moving people transition to boarding
        if (Math.random() > 0.6) {
          newPerson.status = 'boarding';
        }
      } else if (newPerson.status === 'waiting' && newPerson.waitTime <= 0) {
        // Waiting people stay clustered near gate
        newPerson.targetX = Math.max(
          currentZone.x + 10,
          Math.min(
            currentZone.x + currentZone.width - 10,
            currentZone.x + currentZone.width / 2 + (Math.random() - 0.5) * 35
          )
        );
        newPerson.targetY = Math.max(
          currentZone.y + 10,
          Math.min(
            currentZone.y + currentZone.height - 10,
            currentZone.y + currentZone.height / 2 + (Math.random() - 0.5) * 25
          )
        );
        newPerson.waitTime = Math.random() * 5000 + 3000;
        // Some waiting people transition to moving/boarding
        if (Math.random() > 0.7) {
          newPerson.status = Math.random() > 0.5 ? 'moving' : 'boarding';
        }
      }
    }

    // Update position based on velocity (smooth movement)
    const speed = 0.12; // Slow movement speed
    const dx = newPerson.targetX - newPerson.x;
    const dy = newPerson.targetY - newPerson.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) {
      // Move towards target
      newPerson.vx = (dx / distance) * speed;
      newPerson.vy = (dy / distance) * speed;
      newPerson.x += newPerson.vx;
      newPerson.y += newPerson.vy;
      newPerson.status = 'moving';
      
      // Clamp position to terminal bounds
      newPerson.x = Math.max(TERMINAL_BOUNDS.minX, Math.min(TERMINAL_BOUNDS.maxX, newPerson.x));
      newPerson.y = Math.max(TERMINAL_BOUNDS.minY, Math.min(TERMINAL_BOUNDS.maxY, newPerson.y));
    } else {
      // Reached target, decide next move
      newPerson.x = newPerson.targetX;
      newPerson.y = newPerson.targetY;
      newPerson.vx = 0;
      newPerson.vy = 0;

      // Movement flow: security -> corridor -> gates -> APM
      // But keep people within terminal bounds
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
          // Strictly enforce gate boundaries
          newPerson.targetX = Math.max(
            randomGate.x + 8,
            Math.min(randomGate.x + randomGate.width - 8, randomGate.x + 8 + Math.random() * (randomGate.width - 16))
          );
          newPerson.targetY = Math.max(
            randomGate.y + 8,
            Math.min(randomGate.y + randomGate.height - 8, randomGate.y + 8 + Math.random() * (randomGate.height - 16))
          );
          newPerson.status = 'moving';
          newPerson.waitTime = Math.random() * 5000 + 3000; // Wait 3-8 seconds at gate
        }
      } else if (newPerson.zone.startsWith('gate') && newPerson.zone !== 'gate24' && apmZone && Math.random() > 0.7) {
        // Some people move to APM after gate (but not from active boarding gate)
        newPerson.zone = 'apm';
        newPerson.targetX = Math.max(
          apmZone.x + 5,
          Math.min(apmZone.x + apmZone.width - 5, apmZone.x + Math.random() * apmZone.width)
        );
        newPerson.targetY = Math.max(
          apmZone.y + 5,
          Math.min(apmZone.y + apmZone.height - 5, apmZone.y + Math.random() * apmZone.height)
        );
        newPerson.status = 'boarding';
        newPerson.waitTime = Math.random() * 2000 + 1000; // Wait 1-3 seconds
      } else {
        // Random movement within current zone - ensure within bounds
        const currentZone = zones.find(z => z.id === newPerson.zone);
        if (currentZone) {
          // For gates, use stricter bounds (8px padding)
          const padding = currentZone.type === 'gate' ? 8 : 5;
          newPerson.targetX = Math.max(
            currentZone.x + padding,
            Math.min(
              currentZone.x + currentZone.width - padding,
              currentZone.x + padding + Math.random() * (currentZone.width - padding * 2)
            )
          );
          newPerson.targetY = Math.max(
            currentZone.y + padding,
            Math.min(
              currentZone.y + currentZone.height - padding,
              currentZone.y + padding + Math.random() * (currentZone.height - padding * 2)
            )
          );
          newPerson.waitTime = Math.random() * 3000 + 2000; // Wait before next move
          newPerson.status = 'waiting';
        }
      }
      
      // Ensure target is within terminal bounds AND zone bounds
      const currentZone = zones.find(z => z.id === newPerson.zone);
      if (currentZone) {
        const padding = currentZone.type === 'gate' ? 8 : 5;
        newPerson.targetX = Math.max(
          Math.max(TERMINAL_BOUNDS.minX, currentZone.x + padding),
          Math.min(
            Math.min(TERMINAL_BOUNDS.maxX, currentZone.x + currentZone.width - padding),
            newPerson.targetX
          )
        );
        newPerson.targetY = Math.max(
          Math.max(TERMINAL_BOUNDS.minY, currentZone.y + padding),
          Math.min(
            Math.min(TERMINAL_BOUNDS.maxY, currentZone.y + currentZone.height - padding),
            newPerson.targetY
          )
        );
      } else {
        // Fallback to terminal bounds only
        newPerson.targetX = Math.max(TERMINAL_BOUNDS.minX, Math.min(TERMINAL_BOUNDS.maxX, newPerson.targetX));
        newPerson.targetY = Math.max(TERMINAL_BOUNDS.minY, Math.min(TERMINAL_BOUNDS.maxY, newPerson.targetY));
      }
    }
    
    // Final clamp of position to ensure never outside bounds
    newPerson.x = Math.max(TERMINAL_BOUNDS.minX, Math.min(TERMINAL_BOUNDS.maxX, newPerson.x));
    newPerson.y = Math.max(TERMINAL_BOUNDS.minY, Math.min(TERMINAL_BOUNDS.maxY, newPerson.y));

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

    // Get target count - keep around 200 people
    const targetCount = 200;
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

    // Update target count periodically (every 3-4 seconds) - vary by 10-15% from initial
    const updateTargetInterval = setInterval(() => {
      setTargetPeopleCount(prev => {
        if (prev === 0 || initialPeopleCount === 0) return prev;
        
        // Calculate 10-15% variation from initial count
        const variationPercent = 0.10 + (Math.random() * 0.05); // 10-15% range
        const variation = Math.floor(initialPeopleCount * variationPercent);
        const sign = Math.random() > 0.5 ? 1 : -1; // Randomly increase or decrease
        const newTargetCount = initialPeopleCount + (sign * variation);
        
        // Only update if there's a meaningful change from current target
        const change = Math.abs(newTargetCount - prev) / Math.max(prev, 1);
        if (change > 0.05) { // Update if change is more than 5%
          return Math.max(150, Math.min(250, newTargetCount)); // Clamp between 150-250
        }
        return prev;
      });
    }, 4000); // Check for count changes every 4 seconds

    // Gradually adjust actual count towards target (every 2.5 seconds with 10-15% increments)
    const adjustInterval = setInterval(() => {
      setPeople(prevPeople => {
        const currentCount = prevPeople.length;
        const difference = targetPeopleCount - currentCount;

        // If already at target (within 2 people), no change needed
        if (Math.abs(difference) <= 2) {
          return prevPeople;
        }

        // Calculate increment (10-15% of current count, or 12% as middle ground)
        const incrementPercent = 0.12 + (Math.random() * 0.06 - 0.03); // 10-15% range
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
    }, 2500); // Adjust count every 2.5 seconds

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
        return updatePeopleMovement(prevPeople, floorPlanZones);
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
    if (person.status === 'boarding') return '#ef4444'; // red - boarding
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
    const gridSize = 20;
    const grid: Array<{ x: number; y: number; intensity: number }> = [];
    const cellWidth = 800 / gridSize;
    const cellHeight = 550 / gridSize;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = 50 + i * cellWidth;
        const y = 50 + j * cellHeight;
        
        // Count people near this grid cell
        const radius = Math.max(cellWidth, cellHeight) * 1.5;
        const nearbyPeople = people.filter(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < radius;
        });
        
        // Calculate intensity based on nearby people
        const intensity = Math.min(100, nearbyPeople.length * 8);
        if (intensity > 5) { // Only show cells with some activity
          grid.push({ x, y, intensity });
        }
      }
    }
    
    return grid;
  };

  const getHeatmapColor = (intensity: number): string => {
    if (intensity < 20) return '#fef3c7'; // light yellow
    if (intensity < 40) return '#fde68a'; // yellow
    if (intensity < 60) return '#fbbf24'; // amber
    if (intensity < 80) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 shadow-xl max-h-[90vh] overflow-auto"
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

        <div className="relative border border-gray-300 rounded-lg bg-blue-50 overflow-hidden" style={{ height: '600px' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 550" preserveAspectRatio="xMidYMid meet">
            {/* Terminal building background (light blue) */}
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

            {/* Heatmap overlay - smooth gradient circles */}
            {generateHeatmapGrid().map((cell, index) => {
              const color = getHeatmapColor(cell.intensity);
              const opacity = Math.min(0.6, cell.intensity / 150);
              return (
                <circle
                  key={`heat-${index}`}
                  cx={cell.x}
                  cy={cell.y}
                  r="25"
                  fill={color}
                  opacity={opacity}
                />
              );
            })}

            {/* Floor plan zones */}
            {zones.map(zone => {
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
                  <div className="w-6 h-6 rounded bg-amber-400 border border-amber-500"></div>
                  <span className="text-xs text-gray-700 font-medium">Moderate Traffic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-orange-500 border border-orange-600"></div>
                  <span className="text-xs text-gray-700 font-medium">High Traffic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-600 border border-red-700"></div>
                  <span className="text-xs text-gray-700 font-medium">Hot Spot (High Congestion)</span>
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
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
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



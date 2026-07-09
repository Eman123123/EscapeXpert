// [FIXED] hooks/useDisaster.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { PathFinder } from '../utils/pathFinder';

export const useDisaster = () => {
  const [isDisasterActive, setIsDisasterActive] = useState(false);
  const [currentDisaster, setCurrentDisaster] = useState(null);
  const [disasterParams, setDisasterParams] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [evacuationPath, setEvacuationPath] = useState(null);
  const [pathDistance, setPathDistance] = useState(null);
  const [nearestExit, setNearestExit] = useState(null);
  
  const timerRef = useRef(null);
  const pathFinderRef = useRef(null);
  const wallsRef = useRef([]);
  const furnitureRef = useRef([]);
  const doorsRef = useRef([]);
  const windowsRef = useRef([]); // ADD: windows ref
  const userPositionRef = useRef({ x: 0, z: 0 });
  
  // Cache to prevent recalculations
  const lastPathHashRef = useRef('');

  // Function to format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate hash to detect changes
  const generateHash = useCallback(() => {
    const posStr = `${userPositionRef.current.x.toFixed(2)}|${userPositionRef.current.z.toFixed(2)}`;
    const doorsStr = doorsRef.current.map(d => 
      `${d.id}-${d.isExterior}`
    ).join('|');
    const windowsStr = windowsRef.current.map(w => 
      `${w.id}-${w.isExterior}`
    ).join('|'); // ADD: windows to hash
    const furnitureStr = furnitureRef.current.map(f => 
      `${f.id}-${f.position?.x}-${f.position?.z}`
    ).join('|');
    return posStr + doorsStr + windowsStr + furnitureStr;
  }, []);

  // Initialize PathFinder with ALL data
  const initializePathFinder = useCallback(() => {
    try {
      // Filter out doors and windows from furniture
      const otherFurniture = furnitureRef.current.filter(f => 
        f.type !== 'door' && f.type !== 'window'
      );
      
      
      // Pass windows as the 4th parameter
      pathFinderRef.current = new PathFinder(
        wallsRef.current,
        otherFurniture,
        doorsRef.current,
        windowsRef.current // CRITICAL: Pass windows array
      );
      return true;
    } catch (error) {
      console.error('Failed to initialize PathFinder:', error);
      return false;
    }
  }, []);

  // =====================================================
  // FIXED: Update environment with doors AND windows
  // =====================================================
  const updateEnvironment = useCallback((walls, furniture, doors, windows = []) => {
    wallsRef.current = walls || [];
    furnitureRef.current = furniture || [];
    doorsRef.current = doors || [];
    windowsRef.current = windows || []; // Store windows
  
    
    // Reset pathfinder - will be recreated when needed
    pathFinderRef.current = null;
    lastPathHashRef.current = '';
    
  }, []);

  // Set user position
  const setUserPosition = useCallback((x, z) => {
    userPositionRef.current = { x, z };
  }, []);

  // =====================================================
  // FIXED: Calculate evacuation path to ANY exterior exit
  // =====================================================
  const calculateEvacuationPath = useCallback(() => {
    // Check if anything changed
    const currentHash = generateHash();
    if (currentHash === lastPathHashRef.current && evacuationPath) {
      return evacuationPath; // Return cached path
    }
    
    // Safety check - ensure pathFinder exists
    if (!pathFinderRef.current) {
      const initialized = initializePathFinder();
      if (!initialized) {
        console.warn('❌ Failed to initialize PathFinder');
        return null;
      }
    }
    
    const { x, z } = userPositionRef.current;
    
    // Check for exterior exits (doors AND windows)
    const exteriorDoors = doorsRef.current.filter(door => door.isExterior === true);
    const exteriorWindows = windowsRef.current.filter(window => window.isExterior === true);
    const totalExits = exteriorDoors.length + exteriorWindows.length;
    
    if (totalExits === 0) {
      console.warn('❌ No exterior exits found');
      setEvacuationPath(null);
      setPathDistance(null);
      setNearestExit(null);
      lastPathHashRef.current = currentHash;
      return null;
    }
        
    // Set start point in pathfinder
    if (pathFinderRef.current.setStartPoint) {
      pathFinderRef.current.setStartPoint(x, z);
    }
    
    // Find path to nearest exit
    const path = pathFinderRef.current.findPathToNearestExit(x, z);
    
    if (path && path.length >= 2) {
      const distance = path.distance || pathFinderRef.current.calculatePathDistance(path);
      
      
      // Only update state if path actually changed
      if (JSON.stringify(path) !== JSON.stringify(evacuationPath)) {
        setEvacuationPath(path);
        setPathDistance(distance);
        
        // Store exit info
        if (path.exitType && path.exitId) {
          let exitObj = null;
          if (path.exitType === 'door') {
            exitObj = doorsRef.current.find(d => d.id === path.exitId);
          } else if (path.exitType === 'window') {
            exitObj = windowsRef.current.find(w => w.id === path.exitId);
          }
          setNearestExit(exitObj || { type: path.exitType, id: path.exitId });
        }
      }
      
      lastPathHashRef.current = currentHash;
      return path;
    }
    
    console.warn('❌ No path found to any exterior exit');
    setEvacuationPath(null);
    setPathDistance(null);
    setNearestExit(null);
    lastPathHashRef.current = currentHash;
    return null;
  }, [generateHash, initializePathFinder, evacuationPath]);

  // =====================================================
  // Start simulation
  // =====================================================
  const startSimulation = useCallback((disasterType, params) => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setCurrentDisaster(disasterType);
    setDisasterParams(params);
    setIsDisasterActive(true);
    
    // Set timer if duration is provided
    const duration = params.duration || 60;
    setTimeRemaining(duration);
    
    // Reset cache on new simulation
    lastPathHashRef.current = '';
    
    // Calculate evacuation path immediately
    setTimeout(() => {
      calculateEvacuationPath();
    }, 100);
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          stopSimulation();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
    
  }, [calculateEvacuationPath]);

  // =====================================================
  // Stop simulation
  // =====================================================
  const stopSimulation = useCallback(() => {
    setIsDisasterActive(false);
    setCurrentDisaster(null);
    setDisasterParams({});
    setTimeRemaining(0);
    setEvacuationPath(null);
    setPathDistance(null);
    setNearestExit(null);
    lastPathHashRef.current = '';
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateParams = useCallback((newParams) => {
    setDisasterParams(prev => ({ ...prev, ...newParams }));
    
    if (isDisasterActive && newParams.duration) {
      setTimeRemaining(newParams.duration);
    }
  }, [isDisasterActive]);

  const resetTimer = useCallback(() => {
    if (isDisasterActive && disasterParams.duration) {
      setTimeRemaining(disasterParams.duration);
    }
  }, [isDisasterActive, disasterParams.duration]);

  const toggleTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else if (isDisasterActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            stopSimulation();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
  }, [isDisasterActive, timeRemaining, stopSimulation]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    isDisasterActive,
    currentDisaster,
    disasterParams,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    evacuationPath,
    pathDistance,
    nearestExit,
    startSimulation,
    stopSimulation,
    updateParams,
    resetTimer,
    toggleTimer,
    updateEnvironment,
    setUserPosition,
    calculateEvacuationPath
  };
};
// Check if two line segments intersect (Standard algorithm)
const lineIntersectsLine = (p1, p2, p3, p4) => {
  const ccw = (a, b, c) => {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  };
  
  return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && 
         (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
};

// Helper: Cast a ray and check if it hits ANY wall (except the one we started from)
const doesRayHitWall = (startX, startY, dirX, dirY, walls, sourceWallId) => {
  // Use a large length to ensure the ray crosses the whole building plan
  const rayLength = 10000; 
  
  const endX = startX + dirX * rayLength;
  const endY = startY + dirY * rayLength;

  for (const wall of walls) {
    // Don't check intersection with the wall the opening is attached to
    if (wall.id === sourceWallId) continue;

    if (lineIntersectsLine(
      { x: startX, y: startY },
      { x: endX, y: endY },
      wall.points[0],
      wall.points[1]
    )) {
      return true; // Collision detected
    }
  }
  
  return false; // No collision (Empty space/Outside)
};

// =====================================================
// DOOR FUNCTIONS
// =====================================================

// Main function: Determine if door is exterior via Raycasting
export const isExteriorDoor = (door, walls) => {
  if (!door.wallId) return false;
  
  const wall = walls.find(w => w.id === door.wallId);
  if (!wall) return false;
  
  // 1. Get Door Position
  const doorX = door.position2D?.x || (wall.points[0].x + wall.points[1].x) / 2;
  const doorY = door.position2D?.y || (wall.points[0].y + wall.points[1].y) / 2;
  
  // 2. Calculate Wall Normal Vectors (Perpendicular directions)
  const [p1, p2] = wall.points;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return false;

  // Calculate the two directions perpendicular to the wall
  // Normal A points 90 degrees one way
  const nAx = -dy / length;
  const nAy = dx / length;
  
  // Normal B points 90 degrees the other way (opposite)
  const nBx = dy / length;
  const nBy = -dx / length;
  
  // 3. Start rays slightly away from the wall to avoid self-intersection
  const epsilon = 1.0; // Small offset
  const start1X = doorX + nAx * epsilon;
  const start1Y = doorY + nAy * epsilon;
  const start2X = doorX + nBx * epsilon;
  const start2Y = doorY + nBy * epsilon;

  // 4. Cast Rays in both directions
  const hitsWallSideA = doesRayHitWall(start1X, start1Y, nAx, nAy, walls, wall.id);
  const hitsWallSideB = doesRayHitWall(start2X, start2Y, nBx, nBy, walls, wall.id);

  // 5. Determine Exterior vs Interior
  // - Interior: Blocked on BOTH sides (Wall is between two rooms)
  // - Exterior: Blocked on ONE side, Clear on the OTHER (Wall is on the edge)
  // - Standalone: Clear on both sides (Treat as Exterior for safety)
  
  const isExterior = !(hitsWallSideA && hitsWallSideB);
  
  return isExterior;
};

// Get detailed door statistics
export const getDoorStats = (doors, walls) => {
  const doorItems = doors.filter(d => d.type === 'door');
  const totalDoors = doorItems.length;
  
  let exteriorDoors = 0;
  let interiorDoors = 0;
  const details = [];
  
  doorItems.forEach(door => {
    const isExterior = isExteriorDoor(door, walls);
    if (isExterior) exteriorDoors++;
    else interiorDoors++;
    
    details.push({
      id: door.id,
      position: door.position2D,
      isExterior
    });
  });
    
  return { totalDoors, exteriorDoors, interiorDoors, details };
};

// Find all exterior doors
export const findExteriorDoors = (doors, walls) => {
  return doors.filter(door => 
    door.type === 'door' && isExteriorDoor(door, walls)
  );
};

// Enhance door data with exterior detection
export const enhanceDoorData = (doorData, walls) => {
  return {
    ...doorData,
    isExterior: isExteriorDoor(doorData, walls)
  };
};

// =====================================================
// WINDOW FUNCTIONS (NEW)
// =====================================================

// Main function: Determine if window is exterior via Raycasting
export const isExteriorWindow = (window, walls) => {
  if (!window.wallId) return false;
  
  const wall = walls.find(w => w.id === window.wallId);
  if (!wall) return false;
  
  // Get Window Position
  const windowX = window.position2D?.x || (wall.points[0].x + wall.points[1].x) / 2;
  const windowY = window.position2D?.y || (wall.points[0].y + wall.points[1].y) / 2;
  
  // Calculate Wall Normal Vectors
  const [p1, p2] = wall.points;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return false;

  const nAx = -dy / length;
  const nAy = dx / length;
  const nBx = dy / length;
  const nBy = -dx / length;
  
  const epsilon = 1.0;
  const start1X = windowX + nAx * epsilon;
  const start1Y = windowY + nAy * epsilon;
  const start2X = windowX + nBx * epsilon;
  const start2Y = windowY + nBy * epsilon;

  const hitsWallSideA = doesRayHitWall(start1X, start1Y, nAx, nAy, walls, wall.id);
  const hitsWallSideB = doesRayHitWall(start2X, start2Y, nBx, nBy, walls, wall.id);

  const isExterior = !(hitsWallSideA && hitsWallSideB);  
  return isExterior;
};

// Get detailed window statistics
export const getWindowStats = (windows, walls) => {
  const windowItems = windows.filter(w => w.type === 'window');
  const totalWindows = windowItems.length;
  
  let exteriorWindows = 0;
  let interiorWindows = 0;
  const details = [];
  
  windowItems.forEach(window => {
    const isExterior = isExteriorWindow(window, walls);
    if (isExterior) exteriorWindows++;
    else interiorWindows++;
    
    details.push({
      id: window.id,
      position: window.position2D,
      isExterior
    });
  });
    
  return { totalWindows, exteriorWindows, interiorWindows, details };
};

// Find all exterior windows
export const findExteriorWindows = (windows, walls) => {
  return windows.filter(window => 
    window.type === 'window' && isExteriorWindow(window, walls)
  );
};

// Enhance window data with exterior detection
export const enhanceWindowData = (windowData, walls) => {
  return {
    ...windowData,
    isExterior: isExteriorWindow(windowData, walls)
  };
};

// =====================================================
// COMBINED FUNCTIONS (For convenience)
// =====================================================

// Find all exterior openings (doors AND windows)
export const findExteriorOpenings = (doors, windows, walls) => {
  const exteriorDoors = findExteriorDoors(doors, walls);
  const exteriorWindows = findExteriorWindows(windows, walls);
  
  console.log(`🚪 Found ${exteriorDoors.length} exterior doors, ${exteriorWindows.length} exterior windows (Total: ${exteriorDoors.length + exteriorWindows.length})`);
  
  return {
    doors: exteriorDoors,
    windows: exteriorWindows,
    total: exteriorDoors.length + exteriorWindows.length
  };
};

// Get combined stats for all openings
export const getAllOpeningsStats = (doors, windows, walls) => {
  const doorStats = getDoorStats(doors, walls);
  const windowStats = getWindowStats(windows, walls);
  
  console.log(`📊 TOTAL: ${doorStats.totalDoors + windowStats.totalWindows} openings | ✅ Exterior: ${doorStats.exteriorDoors + windowStats.exteriorWindows} | ⛔ Interior: ${doorStats.interiorDoors + windowStats.interiorWindows}`);
  
  return {
    doors: doorStats,
    windows: windowStats,
    totalOpenings: doorStats.totalDoors + windowStats.totalWindows,
    totalExterior: doorStats.exteriorDoors + windowStats.exteriorWindows,
    totalInterior: doorStats.interiorDoors + windowStats.interiorWindows
  };
};
// Wall3D.jsx - Enhanced version with proper top wall window placement
import React, { useMemo } from "react";
import * as THREE from "three";

const CANVAS_TO_3D_SCALE = 0.03;
const CANVAS_CENTER_OFFSET = 500;

// Enhanced configuration
const WALL_CONFIG = {
  HEIGHT: 2.0,
  THICKNESS: 0.15,
  DEFAULT_COLOR: "#95a5a6",
  WINDOW: {
    DEFAULT_WIDTH: 1.2,
    DEFAULT_HEIGHT: 0.8,
    FRAME_COLOR: "#8B4513",
    GLASS_COLOR: "#87CEEB",
    GLASS_OPACITY: 0.6
  },
  DOOR: {
    DEFAULT_WIDTH: 0.9,
    DEFAULT_HEIGHT: 2.0,
    COLOR: "#7a4a28"
  }
};

export const convertCanvasTo3D = (p) => ({
  x: (p.x - CANVAS_CENTER_OFFSET) * CANVAS_TO_3D_SCALE,
  y: 0,
  z: (p.y - CANVAS_CENTER_OFFSET) * CANVAS_TO_3D_SCALE
});

const projectPointOntoWall = (pt3, start3, end3) => {
  const wx = end3.x - start3.x;
  const wz = end3.z - start3.z;
  const vx = pt3.x - start3.x;
  const vz = pt3.z - start3.z;
  const wallLenSq = wx * wx + wz * wz;
  if (wallLenSq === 0) return 0;
  return (vx * wx + vz * wz) / wallLenSq;
};

const isTopWall = (start3D, end3D) => {
  // Check if wall is approximately horizontal and at the top
  const isHorizontal = Math.abs(start3D.z - end3D.z) < 0.1;
  const isTopPosition = start3D.z < -1.0 && end3D.z < -1.0; // Adjust based on your room layout
  return isHorizontal && isTopPosition;
};

const createWallSegment = (
  start3D,
  end3D,
  startOffset,
  segmentLength,
  totalLength,
  height,
  thickness,
  angle,
  color,
  wallId,
  segmentType = "full"
) => {
  const frac = (startOffset + segmentLength / 2) / totalLength;
  const centerX = start3D.x + (end3D.x - start3D.x) * frac;
  const centerZ = start3D.z + (end3D.z - start3D.z) * frac;

  const geometry = new THREE.BoxGeometry(segmentLength, height, thickness);

  return {
    geometry,
    position: [centerX, height / 2, centerZ],
    rotation: [0, -angle, 0],
    color: color || WALL_CONFIG.DEFAULT_COLOR,
    userData: { isWall: true, wallId, segmentType }
  };
};

const createWindowOpening = (
  start3D,
  end3D,
  startOffset,
  openingWidth,
  totalLength,
  wallHeight,
  windowBottomHeight,
  windowHeight,
  thickness,
  angle,
  color,
  wallId,
  isTopWall = false
) => {
  const segments = [];
  const frac = (startOffset + openingWidth / 2) / totalLength;
  const centerX = start3D.x + (end3D.x - start3D.x) * frac;
  const centerZ = start3D.z + (end3D.z - start3D.z) * frac;

  if (isTopWall) {
    // For top wall, create side segments only (no bottom piece)
    if (startOffset > 0.01) {
      // Left segment
      const leftSegment = createWallSegment(
        start3D, end3D, 0, startOffset, totalLength,
        wallHeight, thickness, angle, color, wallId, 'left_of_window'
      );
      segments.push(leftSegment);
    }

    if (totalLength - (startOffset + openingWidth) > 0.01) {
      // Right segment
      const rightSegment = createWallSegment(
        start3D, end3D, startOffset + openingWidth, 
        totalLength - (startOffset + openingWidth), totalLength,
        wallHeight, thickness, angle, color, wallId, 'right_of_window'
      );
      segments.push(rightSegment);
    }
  } else {
    // For other walls, create bottom segment only
    if (windowBottomHeight > 0.01) {
      const bottomGeometry = new THREE.BoxGeometry(openingWidth, windowBottomHeight, thickness);
      segments.push({
        geometry: bottomGeometry,
        position: [centerX, windowBottomHeight / 2, centerZ],
        rotation: [0, -angle, 0],
        color: color || WALL_CONFIG.DEFAULT_COLOR,
        userData: { isWall: true, wallId, part: "below_window" }
      });
    }
  }

  return segments;
};

const createWindowModel = (
  start3D, 
  end3D, 
  centerDist, 
  width, 
  height, 
  wallThickness, 
  angle, 
  windowId, 
  wallHeight,
  isTopWall = false
) => {
  const wallLength = Math.sqrt((end3D.x - start3D.x) ** 2 + (end3D.z - start3D.z) ** 2);
  const frac = centerDist / wallLength;
  const centerX = start3D.x + (end3D.x - start3D.x) * frac;
  const centerZ = start3D.z + (end3D.z - start3D.z) * frac;

  const wallDirX = end3D.x - start3D.x;
  const wallDirZ = end3D.z - start3D.z;
  const wallLen = Math.sqrt(wallDirX * wallDirX + wallDirZ * wallDirZ) || 1;
  const perpX = -wallDirZ / wallLen;
  const perpZ = wallDirX / wallLen;

  const inset = 0.001; // Small inset to prevent z-fighting
  const windowPosX = centerX + perpX * inset;
  const windowPosZ = centerZ + perpZ * inset;

  let windowCenterY;
  if (isTopWall) {
    // For top wall, position window higher
    windowCenterY = wallHeight - height / 2 - 0.1; // Slightly below top
  } else {
    // For other walls, center vertically
    const remainingHeight = wallHeight - height;
    const windowBottomHeight = remainingHeight / 2;
    windowCenterY = windowBottomHeight + height / 2;
  }

  const components = [];

  // Enhanced frame with more detail
  const frameThickness = Math.max(0.025, wallThickness * 0.6);
  const frameDepth = 0.03;
  const frameGeom = new THREE.BoxGeometry(width + 0.03, height + 0.03, frameDepth);
  components.push({
    geometry: frameGeom,
    position: [windowPosX, windowCenterY, windowPosZ],
    rotation: [0, -angle, 0],
    color: WALL_CONFIG.WINDOW.FRAME_COLOR,
    userData: { isWindow: true, windowId, type: "frame", isTopWall }
  });

  // Enhanced glass with better transparency
  const glassGeom = new THREE.BoxGeometry(width * 0.85, height * 0.85, 0.015);
  components.push({
    geometry: glassGeom,
    position: [windowPosX, windowCenterY, windowPosZ + 0.01],
    rotation: [0, -angle, 0],
    color: WALL_CONFIG.WINDOW.GLASS_COLOR,
    userData: { isWindow: true, windowId, type: "glass", isTopWall }
  });

  // Add window sill for top wall
  if (isTopWall) {
    const sillGeom = new THREE.BoxGeometry(width + 0.1, 0.05, 0.08);
    components.push({
      geometry: sillGeom,
      position: [windowPosX, windowCenterY - height/2 - 0.025, windowPosZ + 0.04],
      rotation: [0, -angle, 0],
      color: "#a0522d",
      userData: { isWindow: true, windowId, type: "sill", isTopWall }
    });
  }

  return components;
};

const createDoorModel = (start3D, end3D, centerDist, width, height, wallThickness, angle, doorId) => {
  const wallLength = Math.sqrt((end3D.x - start3D.x) ** 2 + (end3D.z - start3D.z) ** 2);
  const frac = centerDist / wallLength;
  const centerX = start3D.x + (end3D.x - start3D.x) * frac;
  const centerZ = start3D.z + (end3D.z - start3D.z) * frac;

  const perpX = -(end3D.z - start3D.z) / (wallLength || 1);
  const perpZ = (end3D.x - start3D.x) / (wallLength || 1);
  const inset = 0.001;
  const doorPosX = centerX + perpX * inset;
  const doorPosZ = centerZ + perpZ * inset;

  const doorGeom = new THREE.BoxGeometry(width, height, Math.max(0.035, wallThickness * 0.95));
  
  // Add door handle
  const handleGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8);
  
  return [
    {
      geometry: doorGeom,
      position: [doorPosX, height / 2, doorPosZ],
      rotation: [0, -angle, 0],
      color: WALL_CONFIG.DOOR.COLOR,
      userData: { isDoor: true, doorId, type: "door" }
    },
    {
      geometry: handleGeom,
      position: [doorPosX + perpX * 0.02, height * 0.9, doorPosZ + 0.02],
      rotation: [Math.PI / 2, 0, -angle],
      color: "#d4af37",
      userData: { isDoor: true, doorId, type: "handle" }
    }
  ];
};

const Wall3D = ({ wall, furniture = [], isSelected = false, onSelect, roomLayout = {} }) => {
  if (!wall || !wall.points || wall.points.length < 2) return null;

  const wallFurniture = useMemo(
    () => furniture.filter(item => item.wallId === wall.id && (item.type === "door" || item.type === "window")),
    [furniture, wall.id]
  );

  const wallParts = useMemo(() => {
    const [start2D, end2D] = wall.points;
    const start3D = convertCanvasTo3D(start2D);
    const end3D = convertCanvasTo3D(end2D);

    const wallLength = Math.sqrt((end3D.x - start3D.x) ** 2 + (end3D.z - start3D.z) ** 2);
    const wallHeight = wall.height || WALL_CONFIG.HEIGHT;
    const thickness = wall.thickness || WALL_CONFIG.THICKNESS;
    const angle = Math.atan2(end3D.z - start3D.z, end3D.x - start3D.x);
    
    const topWall = isTopWall(start3D, end3D);

    // Single full wall when no openings
    if (!wallFurniture || wallFurniture.length === 0) {
      const geometry = new THREE.BoxGeometry(wallLength, wallHeight, thickness);
      const cx = (start3D.x + end3D.x) / 2;
      const cz = (start3D.z + end3D.z) / 2;
      return {
        fullWall: {
          geometry,
          position: [cx, wallHeight / 2, cz],
          rotation: [0, -angle, 0],
          color: isSelected ? "#f39c12" : (wall.color || WALL_CONFIG.DEFAULT_COLOR),
          userData: { isWall: true, wallId: wall.id, isTopWall: topWall }
        }
      };
    }

    const segments = [];
    const windowModels = [];
    const doorModels = [];

    const enriched = wallFurniture.map(item => {
      let width = item.size?.width ?? (item.type === "door" ? WALL_CONFIG.DOOR.DEFAULT_WIDTH : WALL_CONFIG.WINDOW.DEFAULT_WIDTH);
      if (width > 10) width = width * CANVAS_TO_3D_SCALE;

      let centerDistMeters;
      if (typeof item.positionAlongWall === "number") {
        centerDistMeters = Math.max(0, Math.min(wallLength, item.positionAlongWall * wallLength));
      } else if (item.point) {
        const p3 = convertCanvasTo3D(item.point);
        const frac = projectPointOntoWall(p3, start3D, end3D);
        centerDistMeters = Math.max(0, Math.min(1, frac)) * wallLength;
      } else if (item.canvasPoint) {
        const p3 = convertCanvasTo3D(item.canvasPoint);
        const frac = projectPointOntoWall(p3, start3D, end3D);
        centerDistMeters = Math.max(0, Math.min(1, frac)) * wallLength;
      } else {
        // Default to center for windows, quarter for doors
        centerDistMeters = item.type === "door" ? wallLength * 0.25 : wallLength / 2;
      }

      let openingHeight;
      let windowBottomHeight = 0;

      if (item.type === "door") {
        openingHeight = item.size?.height ?? WALL_CONFIG.DOOR.DEFAULT_HEIGHT;
        if (openingHeight > 10) openingHeight = openingHeight * CANVAS_TO_3D_SCALE;

        const doorModelComponents = createDoorModel(
          start3D, end3D, centerDistMeters, width, openingHeight,
          thickness, angle, item.id
        );
        doorModels.push(...doorModelComponents);
      } else {
        openingHeight = item.size?.height ?? WALL_CONFIG.WINDOW.DEFAULT_HEIGHT;
        if (openingHeight > 10) openingHeight = openingHeight * CANVAS_TO_3D_SCALE;

        if (topWall) {
          windowBottomHeight = wallHeight - openingHeight;
        } else {
          const remainingHeight = wallHeight - openingHeight;
          windowBottomHeight = remainingHeight / 2;
        }

        const windowModelComponents = createWindowModel(
          start3D, end3D, centerDistMeters, width, openingHeight,
          thickness, angle, item.id, wallHeight, topWall
        );
        windowModels.push(...windowModelComponents);
      }

      return {
        ...item,
        width,
        centerDistMeters,
        openingHeight,
        windowBottomHeight,
        isTopWall: topWall
      };
    });

    // Sort by location along wall
    enriched.sort((a, b) => a.centerDistMeters - b.centerDistMeters);

    // Build segments between openings
    let cursor = 0;
    for (const it of enriched) {
      const startOfOpening = Math.max(0, it.centerDistMeters - it.width / 2);
      const endOfOpening = Math.min(wallLength, it.centerDistMeters + it.width / 2);

      // Segment before opening
      if (startOfOpening - cursor > 0.02) {
        const segLen = startOfOpening - cursor;
        segments.push(createWallSegment(
          start3D, end3D, cursor, segLen, wallLength,
          wallHeight, thickness, angle, wall.color, wall.id, 'full'
        ));
      }

      if (it.type === "door") {
        // Door: leave opening empty (no wall there)
      } else {
        // Window: create appropriate segments based on wall type
        const windowSegments = createWindowOpening(
          start3D, end3D,
          startOfOpening, it.width, wallLength,
          wallHeight, it.windowBottomHeight, it.openingHeight, thickness, angle,
          wall.color, wall.id, it.isTopWall
        );
        segments.push(...windowSegments);
      }

      cursor = endOfOpening;
    }

    // Trailing segment after last opening
    if (wallLength - cursor > 0.02) {
      const segLen = wallLength - cursor;
      segments.push(createWallSegment(
        start3D, end3D, cursor, segLen, wallLength,
        wallHeight, thickness, angle, wall.color, wall.id, 'full'
      ));
    }

    return { segments, windowModels, doorModels, isTopWall: topWall };
  }, [wall, wallFurniture, isSelected]);

  const handleClick = (e) => {
    e.stopPropagation?.();
    onSelect?.(wall.id);
  };

  const wallColor = isSelected ? "#f39c12" : (wall.color || WALL_CONFIG.DEFAULT_COLOR);

  // Render fullWall if exists
  if (wallParts?.fullWall) {
    const w = wallParts.fullWall;
    return (
      <mesh
        geometry={w.geometry}
        position={w.position}
        rotation={w.rotation}
        onClick={handleClick}
        castShadow
        receiveShadow
        userData={w.userData}
      >
        <meshStandardMaterial color={wallColor} />
      </mesh>
    );
  }

  // Otherwise render segments + window + door models
  return (
    <group>
      {wallParts.segments?.map((s, idx) => (
        <mesh
          key={`seg-${wall.id}-${idx}`}
          geometry={s.geometry}
          position={s.position}
          rotation={s.rotation}
          castShadow
          receiveShadow
          userData={s.userData}
          onClick={handleClick}
        >
          <meshStandardMaterial color={wallColor} />
        </mesh>
      ))}

      {wallParts.windowModels?.map((window, idx) => (
        <mesh
          key={`window-${wall.id}-${idx}`}
          geometry={window.geometry}
          position={window.position}
          rotation={window.rotation}
          castShadow
          receiveShadow
          userData={window.userData}
        >
          <meshStandardMaterial
            color={window.color}
            transparent={window.userData.type === 'glass'}
            opacity={window.userData.type === 'glass' ? WALL_CONFIG.WINDOW.GLASS_OPACITY : 1.0}
          />
        </mesh>
      ))}

      {wallParts.doorModels?.map((door, idx) => (
        <mesh
          key={`door-${wall.id}-${idx}`}
          geometry={door.geometry}
          position={door.position}
          rotation={door.rotation}
          castShadow
          receiveShadow
          userData={door.userData}
        >
          <meshStandardMaterial color={door.color} />
        </mesh>
      ))}
    </group>
  );
};

export { WALL_CONFIG };
export default Wall3D;
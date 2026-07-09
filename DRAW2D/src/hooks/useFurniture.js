import { useState, useCallback } from 'react';

export const useFurniture = () => {
  const [furniture, setFurniture] = useState([]);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(null);

  // Constants for coordinate conversion (must match Wall3D.js)
  const CANVAS_TO_3D_SCALE = 0.03;
  const CANVAS_CENTER_OFFSET = 500;

  // Updated addFurniture - marks regular furniture as obstacles
  const addFurniture = useCallback((type, defaultSize, color, position = { x: 0, z: 0 }) => {
    const id = `furniture-${Date.now()}`;
    
    // Handle different parameter formats
    let furnitureData;
    
    if (typeof type === 'object') {
      // New format: single object parameter
      furnitureData = {
        ...type,
        id,
        isWallMounted: false,
        isObstacle: true
      };
    } else {
      // Old format: multiple parameters
      furnitureData = {
        id,
        type,
        size: { ...defaultSize },
        color,
        position: { 
          x: position.x, 
          y: 0,
          z: position.z 
        },
        rotation: 0,
        isWallMounted: false,
        isObstacle: true
      };
    }
    
    console.log('🪑 Adding furniture OBSTACLE:', furnitureData.type, 'at', furnitureData.position);
    setFurniture(prev => [...prev, furnitureData]);
    setSelectedFurnitureId(id);
    return id;
  }, []);

  // Updated function for the placement system - marks as obstacle
  const addFurnitureAtPosition = useCallback((furnitureData) => {
    const id = `furniture-${Date.now()}`;
    
    const newFurniture = {
      id,
      type: furnitureData.type,
      size: furnitureData.size || { width: 2, height: 0.5, depth: 1 },
      color: furnitureData.color || '#8B4513',
      position: furnitureData.position || { x: 0, y: 0, z: 0 },
      rotation: furnitureData.rotation || 0,
      isWallMounted: false,
      isObstacle: true
    };
    
    console.log('🪑 Adding furniture OBSTACLE at position:', newFurniture.type, 'at', newFurniture.position);
    setFurniture(prev => [...prev, newFurniture]);
    setSelectedFurnitureId(id);
    return id;
  }, []);

  // 🎯 Add wall-mounted item (door/window) - NOT obstacles
  const addWallMountedItem = useCallback((itemData) => {
    console.log('🚪 Adding wall-mounted item (PASSABLE):', itemData.type);
    
    // Extract parameters from the object
    const { type, wallId, positionAlongWall, wallPoints } = itemData;
    
    // Validate input data
    if (!wallPoints || wallPoints.length < 2) {
      console.error('❌ Invalid wall points for wall-mounted item:', wallPoints);
      return null;
    }

    if (typeof positionAlongWall !== 'number' || isNaN(positionAlongWall)) {
      console.error('❌ Invalid position along wall:', positionAlongWall);
      return null;
    }

    const [p1, p2] = wallPoints;
    
    // Validate point coordinates
    if (!p1 || !p2 || typeof p1.x !== 'number' || typeof p1.y !== 'number' || 
        typeof p2.x !== 'number' || typeof p2.y !== 'number') {
      console.error('❌ Invalid point coordinates:', { p1, p2 });
      return null;
    }
    
    // Ensure positionAlongWall is between 0 and 1
    const validPosition = Math.max(0, Math.min(1, positionAlongWall));
    
    // Calculate the 2D position from positionAlongWall (0-1)
    const wallDirX = p2.x - p1.x;
    const wallDirY = p2.y - p1.y;
    
    // Calculate the exact 2D position on the wall
    const position2D = {
      x: p1.x + validPosition * wallDirX,
      y: p1.y + validPosition * wallDirY
    };
    
    // Convert to 3D coordinates using the same scale as walls
    const start3D = {
      x: (p1.x - CANVAS_CENTER_OFFSET) * CANVAS_TO_3D_SCALE,
      z: (p1.y - CANVAS_CENTER_OFFSET) * CANVAS_TO_3D_SCALE
    };
    
    const end3D = {
      x: (p2.x - CANVAS_CENTER_OFFSET) * CANVAS_TO_3D_SCALE,
      z: (p2.y - CANVAS_CENTER_OFFSET) * CANVAS_TO_3D_SCALE
    };
    
    // Calculate 3D position along the wall
    const position3D = {
      x: start3D.x + validPosition * (end3D.x - start3D.x),
      y: 0,
      z: start3D.z + validPosition * (end3D.z - start3D.z)
    };
    
    // Calculate wall angle for proper orientation
    const wallAngle = Math.atan2(end3D.z - start3D.z, end3D.x - start3D.x);
    
    // Set appropriate height based on item type
    let height, itemSize;
    if (type === 'door') {
      height = 2.0;
      itemSize = { width: 0.9, height: 2.0, depth: 0.1 };
      position3D.y = height / 2;
    } else { // window
      height = 1.2;
      itemSize = { width: 1.2, height: 0.8, depth: 0.1 };
      position3D.y = height + (itemSize.height / 2);
    }
    
    const newItem = {
      id: `furniture-${Date.now()}`,
      type: type,
      size: itemSize,
      color: type === 'door' ? '#8B4513' : '#87CEEB',
      position: position3D,
      rotation: wallAngle,
      isWallMounted: true,
      isObstacle: false, // Doors and windows are NOT obstacles
      wallId: wallId,
      positionAlongWall: validPosition,
      position2D: position2D,
      wallPoints: wallPoints,
      wallOffset: {
        height: position3D.y,
        wallAngle: wallAngle
      }
    };
    
    console.log('✅ Created PASSABLE item:', newItem.type, 'at', position2D);
    
    setFurniture(prev => [...prev, newItem]);
    setSelectedFurnitureId(newItem.id);
    return newItem.id;
  }, []);

  // Get furniture items for a specific wall
  const getFurnitureOnWall = useCallback((wallId) => {
    return furniture.filter(item => item.wallId === wallId && item.isWallMounted);
  }, [furniture]);

  // Get default sizes for furniture types
  const getDefaultSize = (type) => {
    const sizes = {
      door: { width: 0.9, height: 2.0, depth: 0.1 },
      window: { width: 1.2, height: 0.5, depth: 0.1 },
      chair: { width: 0.5, height: 0.8, depth: 0.5 },
      table: { width: 1.2, height: 0.75, depth: 0.8 },
      bed: { width: 1.9, height: 0.1, depth: 1.0 },
      sofa: { width: 1.8, height: 0.8, depth: 0.9 },
      cabinet: { width: 0.6, height: 1.8, depth: 0.4 }
    };
    return sizes[type] || { width: 1, height: 1, depth: 1 };
  };

  // Get default colors for furniture types
  const getDefaultColor = (type) => {
    const colors = {
      door: '#8B4513',
      window: '#87CEEB',
      chair: '#FF6B6B',
      table: '#D4A76A',
      bed: '#8fe5e0ff',
      sofa: '#45B7D1',
      cabinet: '#96CEB4'
    };
    return colors[type] || '#CCCCCC';
  };

  const updateFurniturePosition = useCallback((id, newPosition) => {
    setFurniture(prev => prev.map(item =>
      item.id === id ? { 
        ...item, 
        position: { ...item.position, ...newPosition } 
      } : item
    ));
  }, []);

  const updateFurnitureRotation = useCallback((id, rotation) => {
    setFurniture(prev => prev.map(item =>
      item.id === id ? { ...item, rotation } : item
    ));
  }, []);

  const updateFurnitureSize = useCallback((id, newSize) => {
    setFurniture(prev => prev.map(item =>
      item.id === id ? { 
        ...item, 
        size: { ...newSize }
      } : item
    ));
  }, []);

  const updateFurnitureColor = useCallback((id, color) => {
    setFurniture(prev => prev.map(item =>
      item.id === id ? { ...item, color } : item
    ));
  }, []);

  const deleteFurniture = useCallback((id) => {
    setFurniture(prev => prev.filter(item => item.id !== id));
    if (selectedFurnitureId === id) {
      setSelectedFurnitureId(null);
    }
  }, [selectedFurnitureId]);

  const clearAllFurniture = useCallback(() => {
    setFurniture([]);
    setSelectedFurnitureId(null);
  }, []);

  const selectFurniture = useCallback((id) => {
    setSelectedFurnitureId(id);
  }, []);

  const getSelectedFurniture = useCallback(() => {
    return furniture.find(item => item.id === selectedFurnitureId) || null;
  }, [furniture, selectedFurnitureId]);

  return {
    furniture,
    selectedFurnitureId,
    addFurniture,
    addFurnitureAtPosition,
    addWallMountedItem,
    getFurnitureOnWall,
    updateFurniturePosition,
    updateFurnitureRotation,
    updateFurnitureSize,
    updateFurnitureColor,
    deleteFurniture,
    clearAllFurniture,
    selectFurniture,
    getSelectedFurniture
  };
};
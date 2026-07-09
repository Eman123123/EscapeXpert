import React, { useRef, useState, useCallback, useEffect } from 'react'
import Wall2D from './Wall2D'
//import PathOverlay from './PathOverlay'
import '../styles/components.css'

const CANVAS_TO_3D_SCALE = 0.03;
const CANVAS_CENTER_OFFSET = 500; 

const convertCanvasTo3D = (canvasPoint) => {
  return {
    x: (canvasPoint.x - CANVAS_CENTER_OFFSET) * CANVAS_TO_3D_SCALE,
    y: 0, // Walls start at floor level
    z: (canvasPoint.y - CANVAS_CENTER_OFFSET) * CANVAS_TO_3D_SCALE
  };
};

const convert3DToCanvas = (worldPoint) => {
  return {
    x: (worldPoint.x / CANVAS_TO_3D_SCALE) + CANVAS_CENTER_OFFSET,
    y: (worldPoint.z / CANVAS_TO_3D_SCALE) + CANVAS_CENTER_OFFSET
  };
};

const DrawingCanvas = ({ 
  walls, 
  currentWall, 
  selectedWallId,
  onCanvasClick, 
  onWallSelect,
  onContinueFromWall,
  onDeleteWall,
  onAddDoor,
  onAddWindow,
  furniture,
  evacuationPath,
  currentDisaster
}) => {
  const canvasRef = useRef()
  const containerRef = useRef()
  const [contextMenu, setContextMenu] = useState(null)
  const [placementMode, setPlacementMode] = useState(null)
  const [showExitMarkers, setShowExitMarkers] = useState(false)

  // NEW: Check if door/window placement is available
  const canAddDoorsWindows = onAddDoor && onAddWindow

  // Get wall-mounted furniture items
  const getWallFurniture = useCallback((wallId) => {
    return furniture.filter(item => item.wallId === wallId && item.isWallMounted)
  }, [furniture])

  // Find exterior doors (marked as isExterior)
  const getExteriorDoors = useCallback(() => {
    return furniture.filter(item => 
      item.type === 'door' && item.isExterior === true
    )
  }, [furniture])

  // Show exit markers when disaster is active
  useEffect(() => {
    setShowExitMarkers(!!evacuationPath || (currentDisaster && getExteriorDoors().length > 0))
  }, [evacuationPath, currentDisaster, getExteriorDoors])

  // Calculate adjusted menu position to stay within viewport
  const getAdjustedMenuPosition = useCallback((clickPosition) => {
    if (!clickPosition) return { x: 0, y: 0 };
    
    const menuWidth = 280; // Approximate width of the menu
    const menuHeight = 350; // Approximate height of the menu
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = clickPosition.x;
    let y = clickPosition.y;
    
    // Adjust horizontal position if menu would go off right edge
    if (x + menuWidth > viewportWidth - 10) {
      x = viewportWidth - menuWidth - 10;
    }
    
    // Adjust vertical position if menu would go off bottom edge
    if (y + menuHeight > viewportHeight - 10) {
      y = viewportHeight - menuHeight - 10;
    }
    
    // Ensure minimum distance from edges
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    return { x, y };
  }, []);

  // 🎯 FIXED: Enhanced click handler with CORRECT door/window placement parameters
  const handleCanvasClick = useCallback((e) => {
    if (contextMenu) {
      setContextMenu(null)
      return
    }

    // If in door/window placement mode, handle placement
    if (placementMode && !currentWall) {
      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      
      const rawClickPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }

      // Find if clicking on a wall for door/window placement
      const clickedWallPoint = findPointOnAnyWall(rawClickPoint, walls)
      
      if (clickedWallPoint) {
        const clickedWall = walls.find(wall => wall.id === clickedWallPoint.wallId)
        if (clickedWall) {
          console.log(`🎯 Placing ${placementMode} on wall:`, clickedWall.id)
          
          // 🎯 FIXED: Calculate the exact position along the wall
          const [p1, p2] = clickedWall.points;
          
          // Calculate the position as a percentage along the wall (0 to 1)
          const wallLength = Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + 
            Math.pow(p2.y - p1.y, 2)
          );
          
          const distanceFromStart = Math.sqrt(
            Math.pow(clickedWallPoint.point.x - p1.x, 2) + 
            Math.pow(clickedWallPoint.point.y - p1.y, 2)
          );
          
          const positionAlongWall = distanceFromStart / wallLength;
          
          console.log(`📏 Position along wall: ${positionAlongWall.toFixed(2)} (${distanceFromStart.toFixed(0)}px of ${wallLength.toFixed(0)}px)`);
          
          // 🎯 FIXED: Pass ALL required parameters including clickPoint
          if (placementMode === 'door' && onAddDoor) {
            onAddDoor(clickedWall.id, positionAlongWall, clickedWallPoint.point, clickedWall.points)
          } else if (placementMode === 'window' && onAddWindow) {
            onAddWindow(clickedWall.id, positionAlongWall, clickedWallPoint.point, clickedWall.points)
          }
          
          setPlacementMode(null)
          return
        }
      } else {
        console.log('❌ Clicked outside wall - canceling placement')
        setPlacementMode(null)
        return
      }
    }

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    const rawClickPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    console.log('🖱️ Raw click at:', rawClickPoint)

    // Check if clicking on existing wall
    const clickedWallPoint = findPointOnAnyWall(rawClickPoint, walls)
    
    // If clicking on existing wall and not currently drawing, show context menu
    if (clickedWallPoint && !currentWall && !placementMode) {
      const clickedWall = walls.find(wall => wall.id === clickedWallPoint.wallId)
      if (clickedWall) {
        console.log('🎯 Wall clicked - showing context menu')
        setContextMenu({
          wall: clickedWall,
          position: { x: e.clientX, y: e.clientY },
          clickPoint: clickedWallPoint.point
        })
        return
      }
    }

    const finalClickPoint = clickedWallPoint ? clickedWallPoint.point : rawClickPoint

    console.log('🎯 Final point to use:', finalClickPoint, 'Snapped to wall:', !!clickedWallPoint)

    // 🎯 CONVERT POINT FOR 3D BEFORE PASSING TO HANDLERS
    const convertedPoint = finalClickPoint;

    // If we're currently drawing, always add points
    if (currentWall) {
      console.log('➕ Adding point to current wall')
      console.log(`📏 Point converted - 2D: ${convertedPoint.x},${convertedPoint.y}`);
      onCanvasClick(convertedPoint)
      return
    }

    // If NOT drawing and not clicking on wall, handle the click
    if (clickedWallPoint) {
      // Clicked on existing wall - start new wall from that exact point
      console.log('🔗 Starting new wall from existing wall point')
      onContinueFromWall(convertedPoint, clickedWallPoint.wallId)
      onWallSelect(null)
    } else {
      // Check if clicking on wall segment for selection
      const clickedWall = walls.find(wall => 
        isPointOnSingleWallSegment(rawClickPoint, wall)
      )
      
      if (clickedWall) {
        console.log('🎯 Wall segment clicked for selection:', clickedWall.id)
        onWallSelect(clickedWall.id)
      } else {
        // Clicked on empty space - start a new wall
        console.log('🆕 Starting new wall from empty space')
        console.log(`📏 Starting new wall at - 2D: ${convertedPoint.x},${convertedPoint.y}`);
        onCanvasClick(convertedPoint)
        onWallSelect(null)
      }
    }
  }, [currentWall, walls, onCanvasClick, onWallSelect, onContinueFromWall, contextMenu, placementMode, onAddDoor, onAddWindow])

  // Handle context menu actions
  const handleContinueDrawing = useCallback(() => {
    if (contextMenu) {
      console.log('🔗 Continuing drawing from wall')
      onContinueFromWall(contextMenu.clickPoint, contextMenu.wall.id)
      onWallSelect(null)
      setContextMenu(null)
    }
  }, [contextMenu, onContinueFromWall, onWallSelect])

  const handleDeleteWall = useCallback(() => {
    if (contextMenu) {
      console.log('🗑️ Attempting to delete wall:', contextMenu.wall.id)
      console.log('🗑️ onDeleteWall function available:', !!onDeleteWall)
      
      if (onDeleteWall) {
        console.log('🗑️ Calling onDeleteWall with ID:', contextMenu.wall.id)
        onDeleteWall(contextMenu.wall.id)
      } else {
        console.error('❌ onDeleteWall function is not available!')
      }
      setContextMenu(null)
    }
  }, [contextMenu, onDeleteWall])

  // 🎯 ENHANCED: Updated door placement handler with better visual feedback
  const handleAddDoor = useCallback(() => {
    if (contextMenu && canAddDoorsWindows) {
      console.log('🚪 Entering door placement mode for wall:', contextMenu.wall.id);
      setPlacementMode('door');
      setContextMenu(null);
      
      // Enhanced visual feedback for the selected wall
      const selectedWall = contextMenu.wall;
      console.log('🎯 Selected wall for door placement:', {
        wallId: selectedWall.id,
        points: selectedWall.points,
        length: Math.sqrt(
          Math.pow(selectedWall.points[1].x - selectedWall.points[0].x, 2) + 
          Math.pow(selectedWall.points[1].y - selectedWall.points[0].y, 2)
        )
      });
    }
  }, [contextMenu, canAddDoorsWindows]);

  // 🎯 ENHANCED: Updated window placement handler with better visual feedback
  const handleAddWindow = useCallback(() => {
    if (contextMenu && canAddDoorsWindows) {
      console.log('🪟 Entering window placement mode for wall:', contextMenu.wall.id);
      setPlacementMode('window');
      setContextMenu(null);
      
      // Enhanced visual feedback for the selected wall
      const selectedWall = contextMenu.wall;
      console.log('🎯 Selected wall for window placement:', {
        wallId: selectedWall.id,
        points: selectedWall.points,
        length: Math.sqrt(
          Math.pow(selectedWall.points[1].x - selectedWall.points[0].x, 2) + 
          Math.pow(selectedWall.points[1].y - selectedWall.points[0].y, 2)
        )
      });
    }
  }, [contextMenu, canAddDoorsWindows]);

  const handleCancelContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleCancelPlacement = useCallback(() => {
    setPlacementMode(null)
  }, [])

  // Find if click is on ANY point along an existing wall (not just endpoints)
  const findPointOnAnyWall = useCallback((clickPoint, walls) => {
    let closestPoint = null
    let minDistance = 15 // 15px tolerance

    for (const wall of walls) {
      if (!wall.points || wall.points.length !== 2) continue
      
      const [p1, p2] = wall.points
      
      // Find the closest point on this wall segment to the click
      const pointOnWall = findClosestPointOnLine(clickPoint, p1, p2)
      const distance = Math.sqrt(
        Math.pow(clickPoint.x - pointOnWall.x, 2) + 
        Math.pow(clickPoint.y - pointOnWall.y, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = {
          wallId: wall.id,
          point: pointOnWall, // The exact point on the wall
          distance: distance
        }
      }
    }

    if (closestPoint) {
      console.log('🎯 Found point on wall:', closestPoint.wallId, 'at:', closestPoint.point)
    }
    
    return closestPoint
  }, [])

  // Find the closest point on a line segment to a given point
  const findClosestPointOnLine = useCallback((point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    
    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    return { x: xx, y: yy }
  }, [])

  // Check if point is on a wall segment for selection
  const isPointOnSingleWallSegment = useCallback((clickPoint, wall) => {
    if (!wall.points || wall.points.length !== 2) return false
    
    const [p1, p2] = wall.points
    
    // Check if we're on the line segment
    const distance = pointToLineDistance(clickPoint, p1, p2)
    return distance < 10 // Tolerance for selection
  }, [])

  const pointToLineDistance = useCallback((point, lineStart, lineEnd) => {
    const closestPoint = findClosestPointOnLine(point, lineStart, lineEnd)
    const dx = point.x - closestPoint.x
    const dy = point.y - closestPoint.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [findClosestPointOnLine])

  // 🎯 NEW: Calculate and display room dimensions
  const calculateRoomDimensions = useCallback(() => {
    if (walls.length === 0) return 'No walls';
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    walls.forEach(wall => {
      wall.points.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    const width2D = maxX - minX;
    const height2D = maxY - minY;
    const width3D = width2D * CANVAS_TO_3D_SCALE;
    const height3D = height2D * CANVAS_TO_3D_SCALE;
    
    return {
      width2D: Math.round(width2D),
      height2D: Math.round(height2D),
      width3D: width3D.toFixed(1),
      height3D: height3D.toFixed(1)
    };
  }, [walls]);

  // Render exit markers for exterior doors
  const renderExitMarkers = useCallback(() => {
    if (!showExitMarkers) return null;
    
    const exteriorDoors = getExteriorDoors();
    
    return exteriorDoors.map(door => {
      if (!door.position2D) return null;
      
      return (
        <div
          key={`exit-${door.id}`}
          className="exit-marker"
          style={{
            position: 'absolute',
            left: door.position2D.x - 20,
            top: door.position2D.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#00ff00',
            border: '3px solid white',
            boxShadow: '0 0 20px rgba(0,255,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'black',
            fontWeight: 'bold',
            fontSize: '14px',
            animation: 'pulse 1.5s infinite',
            zIndex: 30,
            pointerEvents: 'none'
          }}
        >
          EXIT
        </div>
      );
    });
  }, [showExitMarkers, getExteriorDoors]);

  // Render current wall segments being drawn
  const renderCurrentWallSegments = useCallback(() => {
    if (!currentWall || currentWall.points.length < 2) return null

    const segments = []
    for (let i = 1; i < currentWall.points.length; i++) {
      const segment = {
        id: `current-${i}`,
        points: [currentWall.points[i - 1], currentWall.points[i]],
        color: currentWall.color
      }
      segments.push(
        <Wall2D 
          key={segment.id} 
          wall={segment} 
          isDrawing={true}
        />
      )
    }
    return segments
  }, [currentWall])

  // Render door/window symbols on walls
  const renderWallFurniture = useCallback(() => {
    return walls.map(wall => {
      const wallFurniture = getWallFurniture(wall.id)
      return wallFurniture.map(item => (
        <WallFurnitureSymbol
          key={item.id}
          item={item}
          wall={wall}
        />
      ))
    })
  }, [walls, getWallFurniture])

  // Show snap points on existing walls when not drawing
  const renderWallSnapPoints = useCallback(() => {
    if (currentWall || placementMode) return null // Don't show when drawing or placing

    return walls.map(wall => (
      <div key={`snap-${wall.id}`}>
        {/* Show the entire wall as a snap target */}
        <div
          style={{
            position: 'absolute',
            left: Math.min(wall.points[0].x, wall.points[1].x) - 5,
            top: Math.min(wall.points[0].y, wall.points[1].y) - 5,
            width: Math.abs(wall.points[0].x - wall.points[1].x) + 10,
            height: Math.abs(wall.points[0].y - wall.points[1].y) + 10,
            backgroundColor: 'transparent',
            border: '2px dashed rgba(39, 174, 96, 0.3)',
            pointerEvents: 'none',
            borderRadius: '3px'
          }}
        />
      </div>
    ))
  }, [walls, currentWall, placementMode])

  // Show placement targets when in door/window mode
  const renderPlacementTargets = useCallback(() => {
    if (!placementMode) return null

    return walls.map(wall => (
      <div key={`placement-${wall.id}`}>
        <div
          style={{
            position: 'absolute',
            left: Math.min(wall.points[0].x, wall.points[1].x) - 8,
            top: Math.min(wall.points[0].y, wall.points[1].y) - 8,
            width: Math.abs(wall.points[0].x - wall.points[1].x) + 16,
            height: Math.abs(wall.points[0].y - wall.points[1].y) + 16,
            backgroundColor: placementMode === 'door' ? 'rgba(139, 69, 19, 0.2)' : 'rgba(135, 206, 235, 0.2)',
            border: placementMode === 'door' ? '2px dashed #8B4513' : '2px dashed #87CEEB',
            pointerEvents: 'none',
            borderRadius: '4px'
          }}
        />
      </div>
    ))
  }, [walls, placementMode])

  const roomDimensions = calculateRoomDimensions();

  return (
    <div className="drawing-canvas-container" ref={containerRef}>
      <div className="drawing-instructions">
        {placementMode ? (
          <div className="instruction-placement">
            🎯 <strong>{placementMode === 'door' ? 'Door' : 'Window'} Placement</strong> - Click on any wall to place a {placementMode}
            <button className="cancel-btn-small" onClick={handleCancelPlacement}>
              Cancel
            </button>
          </div>
        ) : currentWall ? (
          <div className="instruction-active">
            🎯 <strong>Drawing Mode</strong> - Click to add points
            {currentWall.continuingFrom && " (Connected to existing wall)"}
          </div>
        ) : selectedWallId ? (
          <div className="instruction-selected">
            ⚡ <strong>Wall Selected</strong> - Click "Delete Wall" to remove
          </div>
        ) : (
          <div className="instruction-idle">
             <strong>Draw Walls</strong> - Click anywhere to start, click on existing walls for options
          </div>
        )}
      </div>
      
      <div 
        ref={canvasRef}
        className="drawing-canvas"
        onClick={handleCanvasClick}
        style={{ cursor: placementMode ? 'crosshair' : 'default' }}
      >
        <div className="grid" />
        
        {/* Render all completed wall segments */}
        {walls.map(wall => (
          <Wall2D 
            key={wall.id} 
            wall={wall} 
            isSelected={wall.id === selectedWallId}
          />
        ))}
        
        {/* Render door/window symbols on walls */}
        {renderWallFurniture()}
        
        {/* Render evacuation path overlay if available */}
        {evacuationPath && (
          <PathOverlay 
            path={evacuationPath}
            color={currentDisaster === 'fire' ? '#ff6600' : '#00ff00'}
            width={4}
          />
        )}
        
        {/* Render exit markers when disaster is active */}
        {renderExitMarkers()}
        
        {/* Show placement targets when in door/window mode */}
        {renderPlacementTargets()}
        
        {/* Show snap targets on existing walls when not drawing or placing */}
        {renderWallSnapPoints()}
        
        {/* Render current wall segments being drawn */}
        {renderCurrentWallSegments()}
        
        {/* Render current wall points */}
        {currentWall && currentWall.points.map((point, index) => (
          <div 
            key={index}
            style={{
              position: 'absolute',
              left: point.x - 6,
              top: point.y - 6,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: index === 0 && currentWall.continuingFrom ? '#2ecc71' : '#e74c3c',
              border: '2px solid white',
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>

      {/* Context Menu for Wall Actions - UPDATED WITH SCROLLABLE CONTENT */}
      {contextMenu && (
        <div 
          className="wall-context-menu"
          style={{
            position: 'fixed',
            left: getAdjustedMenuPosition(contextMenu.position).x,
            top: getAdjustedMenuPosition(contextMenu.position).y,
            zIndex: 1000
          }}
        >
          <div className="context-menu-content">
            <div className="context-menu-header">
              <h4>Wall Options</h4>
              <button className="close-btn" onClick={handleCancelContextMenu}>×</button>
            </div>
            
            {/* Scrollable actions container */}
            <div className="context-menu-actions-scrollable">
              <div className="context-menu-actions">
                <button 
                  className="context-btn continue-btn"
                  onClick={handleContinueDrawing}
                >
                  🎯 Continue Drawing from Here
                </button>
                
                {/* Only show door/window options if the functions are available */}
                {canAddDoorsWindows && (
                  <>
                    <button 
                      className="context-btn door-btn"
                      onClick={handleAddDoor}
                    >
                      🚪 Add Door
                    </button>
                    <button 
                      className="context-btn window-btn"
                      onClick={handleAddWindow}
                    >
                      🪟 Add Window
                    </button>
                  </>
                )}
                
                <button 
                  className="context-btn delete-btn"
                  onClick={handleDeleteWall}
                >
                  🗑️ Delete This Wall
                </button>
                <button 
                  className="context-btn cancel-btn"
                  onClick={handleCancelContextMenu}
                >
                  ✋ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add animation styles */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(0,255,0,0.8);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 30px rgba(0,255,0,1);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(0,255,0,0.8);
          }
        }
      `}</style>
    </div>
  )
}

// Component to render door/window symbols on walls
const WallFurnitureSymbol = ({ item, wall }) => {
  const [p1, p2] = wall.points
  
  // Calculate position along the wall
  const wallDirX = p2.x - p1.x
  const wallDirY = p2.y - p1.y
  const wallLength = Math.sqrt(wallDirX * wallDirX + wallDirY * wallDirY)
  
  const normX = wallDirX / wallLength
  const normY = wallDirY / wallLength
  
  const dotProduct = (item.position2D.x - p1.x) * normX + (item.position2D.y - p1.y) * normY
  const positionAlongWall = Math.max(0, Math.min(1, dotProduct / wallLength))
  
  // Calculate symbol position
  const symbolX = p1.x + positionAlongWall * wallDirX
  const symbolY = p1.y + positionAlongWall * wallDirY
  
  // Calculate perpendicular offset to show symbol above/below wall
  const perpX = -normY * 15 // 15px offset
  const perpY = normX * 15
  
  const isDoor = item.type === 'door'
  
  // Add green glow for exterior doors during disaster
  const isExterior = item.isExterior === true
  
  return (
    <div
      style={{
        position: 'absolute',
        left: symbolX + perpX - 12,
        top: symbolY + perpY - 12,
        width: 24,
        height: 24,
        borderRadius: isDoor ? '4px' : '50%',
        backgroundColor: isDoor ? '#8B4513' : '#87CEEB',
        border: isExterior ? '3px solid #00ff00' : '2px solid white',
        boxShadow: isExterior ? '0 0 15px rgba(0,255,0,0.8)' : '0 2px 4px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: 'white',
        fontWeight: 'bold',
        pointerEvents: 'none',
        zIndex: isExterior ? 25 : 5,
        animation: isExterior ? 'pulse 1.5s infinite' : 'none'
      }}
      title={`${item.type} on wall${isExterior ? ' (EXIT)' : ''}`}
    >
      {isDoor ? '🚪' : '🪟'}
    </div>
  )
}

// 🎯 EXPORT THE CONVERSION FUNCTIONS FOR USE IN OTHER COMPONENTS
export { convertCanvasTo3D, convert3DToCanvas, CANVAS_TO_3D_SCALE };
export default DrawingCanvas;
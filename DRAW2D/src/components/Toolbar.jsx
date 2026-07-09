import React from 'react'
import '../styles/components.css'

const Toolbar = ({ 
  mode, 
  setMode, 
  walls, 
  furniture,
  currentWall, 
  selectedWallId,
  selectedFurnitureId,
  onFinishWall, 
  onClearWalls,
  onClearFurniture,
  onDeleteWall,
  onDeleteFurniture,
  isPlacingFurniture,
  onCancelPlacement,
  isPlacingDoor,
  isPlacingWindow,
  onStartDoorPlacement,
  onStartWindowPlacement,
  onCancelDoorWindowPlacement,
  isDisasterActive,
  currentDisaster,
  onStartDisasterSimulation,
  onStopDisasterSimulation
}) => {
  
  const handleDeleteClick = () => {
    if (selectedWallId) {
      onDeleteWall()
    } else if (selectedFurnitureId) {
      onDeleteFurniture(selectedFurnitureId)
    }
  }

  const getSelectedItemName = () => {
    if (selectedWallId) return 'Wall'
    if (selectedFurnitureId) return 'Furniture'
    return null
  }
  const handleDisasterToggle = () => {
    if (isDisasterActive) {
      onStopDisasterSimulation?.()
    } else {
      // Default to earthquake simulation when starting
      onStartDisasterSimulation?.('earthquake', { magnitude: 5.0, duration: 10, intensity: 1.0 })
    }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button 
          onClick={() => setMode('draw')}
          className={`toolbar-btn ${mode === 'draw' ? 'active' : ''}`}
          disabled={isDisasterActive}
        >
          🎨 Draw Mode
        </button>
        <button 
          onClick={() => setMode('view3d')}
          className={`toolbar-btn ${mode === 'view3d' ? 'active' : ''}`}
          disabled={(walls.length === 0 && furniture.length === 0) || isDisasterActive}
        >
          🏗️ 3D View
        </button>
        <button 
          onClick={() => setMode('furniture')}
          className={`toolbar-btn ${mode === 'furniture' ? 'active' : ''}`}
          disabled={isDisasterActive}
        >
          🛋️ Furniture Mode
        </button>
      </div>
      
      {/* Furniture Placement Section - Only in Furniture Mode */}
      {mode === 'furniture' && isPlacingFurniture && (
        <div className="toolbar-section">
          <button 
            onClick={onCancelPlacement}
            className="toolbar-btn danger"
            disabled={isDisasterActive}
          >
            ❌ Cancel Placement
          </button>
        </div>
      )}
      
      <div className="toolbar-section">
        {mode === 'draw' && (
          <button 
            onClick={onFinishWall} 
            className="toolbar-btn secondary"
            disabled={!currentWall || currentWall.points.length < 2 || isDisasterActive}
          >
            ✅ Finish Wall
          </button>
        )}
        
        <button 
          onClick={handleDeleteClick}
          className="toolbar-btn danger"
          disabled={(!selectedWallId && !selectedFurnitureId) || isDisasterActive}
        >
          🗑️ Delete {getSelectedItemName() || 'Item'}
        </button>
        
        <button 
          onClick={onClearWalls}
          className="toolbar-btn danger"
          disabled={walls.length === 0 || isDisasterActive}
        >
          🧹 Clear Walls
        </button>
        
        <button 
          onClick={onClearFurniture}
          className="toolbar-btn danger"
          disabled={furniture.length === 0 || isDisasterActive}
        >
          🧹 Clear Furniture
        </button>
      </div>
      
      <div className="toolbar-info">
        <span>Walls: {walls.length}</span>
        <span>Furniture: {furniture.length}</span>
        <span>Mode: {mode.toUpperCase()}</span>
        {(selectedWallId || selectedFurnitureId) && <span>Selected: ✓</span>}
        
        {/* NEW: Placement status indicators */}
        {(isPlacingDoor || isPlacingWindow || isPlacingFurniture) && (
          <span className="placement-status">
            Placing: {isPlacingDoor ? 'Door' : isPlacingWindow ? 'Window' : 'Furniture'}
          </span>
        )}
        
        {/* ✅ NEW: Disaster status indicator */}
        {isDisasterActive && (
          <span className="disaster-status">
            🌋 {currentDisaster || 'Disaster'} Active
          </span>
        )}
      </div>
    </div>
  )
}

export default Toolbar
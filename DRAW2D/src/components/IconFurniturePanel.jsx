import React, { useState, useEffect, useRef, useCallback } from 'react'; // 🎯 ADDED useCallback import
import { FURNITURE_ICONS, FURNITURE_CATEGORIES } from '../data/furnitureIcons';
import '../styles/components.css';

const IconFurniturePanel = ({
  onAddFurniture,
  onStartFurniturePlacement,
  selectedFurniture,
  onUpdateSize,
  onUpdateColor,
  onUpdateRotation,
  onDeleteFurniture,
  isPlacingFurniture = false,
  currentFurnitureType = null
}) => {
  const [selectedCategory, setSelectedCategory] = useState('bed');
  const [localSize, setLocalSize] = useState({ width: 1.2, height: 0.1, depth: 1 });
  const [localColor, setLocalColor] = useState('#8b135f');
  const [localRotation, setLocalRotation] = useState(0);
  const panelRef = useRef(null);
  const controlsRef = useRef(null);

  // Update local state when selected furniture changes
  useEffect(() => {
    if (selectedFurniture) {
      setLocalSize(selectedFurniture.size || { width: 1.2, height: 0.1, depth: 1 });
      setLocalColor(selectedFurniture.color || '#8b135f');
      setLocalRotation(Math.round((selectedFurniture.rotation || 0) * 180 / Math.PI));
    } else {
      setLocalSize({ width: 1.2, height: 0.1, depth: 1 });
      setLocalColor('#8b135f');
      setLocalRotation(0);
    }
  }, [selectedFurniture]);

  // 🎯 FIXED: Proper furniture click handler
  const handleFurnitureClick = useCallback((item) => {
    console.log('Furniture item clicked:', item);
    if (onStartFurniturePlacement) {
      onStartFurniturePlacement(item.type, item.defaultSize || { width: 1.2, height: 0.1, depth: 1 }, item.color || '#8b135f');
    } else if (onAddFurniture) {
      // Fallback to direct addition if placement not available
      onAddFurniture(item.type, item.defaultSize || { width: 1.2, height: 0.1, depth: 1 }, item.color || '#8b135f');
    }
  }, [onStartFurniturePlacement, onAddFurniture]);

  const handleSizeChange = (dimension, value) => {
    const newSize = { ...localSize, [dimension]: parseFloat(value) || 0.1 };
    setLocalSize(newSize);
    if (selectedFurniture) {
      onUpdateSize(selectedFurniture.id, newSize);
    }
  };

  const handleColorChange = (color) => {
    setLocalColor(color);
    if (selectedFurniture) {
      onUpdateColor(selectedFurniture.id, color);
    }
  };

  const handleDeleteClick = () => {
    if (selectedFurniture) {
      onDeleteFurniture(selectedFurniture.id);
    }
  };

  const handleRotationChange = (degrees) => {
    setLocalRotation(degrees);
    if (selectedFurniture) {
      const radians = degrees * (Math.PI / 180);
      onUpdateRotation(selectedFurniture.id, radians);
    }
  };

  const handleRotationInputChange = (degrees) => {
    const deg = parseInt(degrees) || 0;
    const normalizedDeg = ((deg % 360) + 360) % 360;
    handleRotationChange(normalizedDeg);
  };

  return (
    <div className="furniture-panel" ref={panelRef}>
      {/* Placement Mode Banner */}
      {isPlacingFurniture && (
        <div className="placement-mode-banner">
          <div className="placement-mode-content">
            <div className="placement-icon">🎯</div>
            <div className="placement-text">
              <strong>Placement Mode Active</strong>
              <span>Click in 3D view to place {currentFurnitureType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="furniture-content">
        <div className="furniture-categories">
          <h3>Categories</h3>
          <div className="category-buttons">
            {FURNITURE_CATEGORIES.map(category => (
              <button
                key={category.key}
                className={`category-btn ${selectedCategory === category.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.key)}
                disabled={isPlacingFurniture}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="furniture-items">
          <h3>Furniture</h3>
          <div className="furniture-grid">
            {FURNITURE_ICONS[selectedCategory]?.map(item => (
              <button
                key={item.id}
                className={`furniture-item-btn ${
                  isPlacingFurniture && currentFurnitureType === item.type ? 'placing-active' : ''
                }`}
                onClick={() => handleFurnitureClick(item)}
                title={item.name}
                disabled={isPlacingFurniture && currentFurnitureType !== item.type}
              >
                <span className="furniture-icon">{item.icon}</span>
                <span className="furniture-name">{item.name}</span>
                {isPlacingFurniture && currentFurnitureType === item.type && (
                  <div className="placing-indicator">Click in 3D view</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Edit Panel - Only show when furniture is selected */}
        {selectedFurniture ? (
          <div className="furniture-controls" ref={controlsRef}>
            <h3>Edit {selectedFurniture.type}</h3>
            
            {/* Size Controls */}
            <div className="control-group">
              <h4>Size</h4>
              <div className="size-controls-column">
                <div className="size-input-column">
                  <label>Width:</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={localSize.width}
                      onChange={(e) => handleSizeChange('width', e.target.value)}
                      disabled={isPlacingFurniture}
                    />
                    <span className="unit">m</span>
                  </div>
                </div>
                <div className="size-input-column">
                  <label>Height:</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={localSize.height}
                      onChange={(e) => handleSizeChange('height', e.target.value)}
                      disabled={isPlacingFurniture}
                    />
                    <span className="unit">m</span>
                  </div>
                </div>
                <div className="size-input-column">
                  <label>Depth:</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={localSize.depth}
                      onChange={(e) => handleSizeChange('depth', e.target.value)}
                      disabled={isPlacingFurniture}
                    />
                    <span className="unit">m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Controls */}
            <div className="control-group">
              <h4>Color</h4>
              <div className="color-control">
                <input
                  type="color"
                  value={localColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={isPlacingFurniture}
                />
                <span className="color-value">{localColor}</span>
              </div>
            </div>

            {/* Rotation Controls */}
            <div className="control-group">
              <h4>Rotation</h4>
              <div className="rotation-controls">
                <div className="rotation-input-with-unit">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="359"
                    value={localRotation}
                    onChange={(e) => handleRotationInputChange(e.target.value)}
                    disabled={isPlacingFurniture}
                  />
                  <span className="unit">°</span>
                </div>
                <div className="rotation-presets">
                  {[0, 90, 180, 270].map(angle => (
                    <button 
                      key={angle}
                      className={`rotation-preset-btn ${localRotation === angle ? 'active' : ''}`}
                      onClick={() => handleRotationChange(angle)}
                      disabled={isPlacingFurniture}
                      type="button"
                    >
                      {angle}°
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-selection-message">
            <p>Select a furniture item to edit its properties</p>
          </div>
        )}
      </div>

      {/* Fixed Delete Button - Always at bottom and visible */}
      {selectedFurniture && (
        <div className="fixed-delete-section">
          <button
            className="delete-btn fixed"
            onClick={handleDeleteClick}
            disabled={isPlacingFurniture}
            type="button"
          >
            🗑️ Delete {selectedFurniture.type}
          </button>
        </div>
      )}
    </div>
  );
};

export default IconFurniturePanel;
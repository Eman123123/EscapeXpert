import React, { useState, useEffect, useCallback, useRef } from 'react'
import Toolbar from './components/Toolbar'
import DrawingCanvas from './components/DrawingCanvas'
import ThreeDView from './components/ThreeDView'
import IconFurniturePanel from './components/IconFurniturePanel'
import Header from './components/Header' 
import { useWalls } from './hooks/useWalls'
import { useFurniture } from './hooks/useFurniture'
import { useDisaster } from './hooks/useDisaster' 
import SafetyGuidelines from './components/SafetyGuidelines'
import PathFinder from './utils/pathFinder.js'; 
import './App.css'
import { 
  isExteriorDoor, 
  isExteriorWindow, 
  enhanceDoorData, 
  enhanceWindowData,
  findExteriorOpenings,
  getAllOpeningsStats
} from './utils/doorUtils';

function App() {
  // =====================================================
  // USER STATE (for Header)
  // =====================================================
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load user data from localStorage (set by main app during login)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLoggedIn(true);
        console.log('✅ User loaded in Draw2D module:', userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    console.log('Logging out from Draw2D module');
    
    // Notify main module about logout
    try {
      fetch('http://localhost:5000/api/auth/logout-from-vr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      });
    } catch (error) {
      console.error('Logout notification error:', error);
    }
    
    // Clear localStorage
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    
    // Redirect to main module's login page
    window.location.href = 'http://localhost:3000/login';
  };

  const goToDashboard = () => {
    window.location.href = 'http://localhost:3000/dashboard';
  };

  const [mode, setMode] = useState('draw')
  const [isPlacingFurniture, setIsPlacingFurniture] = useState(false)
  const [currentFurnitureType, setCurrentFurnitureType] = useState(null)
  const [currentFurnitureSize, setCurrentFurnitureSize] = useState(null)
  const [currentFurnitureColor, setCurrentFurnitureColor] = useState(null)
  const [showSafetyGuidelines, setShowSafetyGuidelines] = useState(false)
  const [showNoPathWarning, setShowNoPathWarning] = useState(false)
  const [showNoPathPopup, setShowNoPathPopup] = useState(false)
  
  // =====================================================
  // START POINT SELECTION STATE
  // =====================================================
  const [isSelectingStartPoint, setIsSelectingStartPoint] = useState(false);
  const [selectedStartPoint, setSelectedStartPoint] = useState(null);
  const [pendingDisaster, setPendingDisaster] = useState(null); 
  const [pendingParams, setPendingParams] = useState(null); 
  // NEW: State for invalid location error
  const [showInvalidLocationError, setShowInvalidLocationError] = useState(false);

  const pathFinderRef = useRef(null);
  
  const { 
    walls, currentWall, selectedWallId, updateCurrentWall, continueFromWall,
    clearWalls, finishWall, deleteWall, deleteWallById, selectWall
  } = useWalls()

  const {
    furniture, selectedFurnitureId, addFurniture, addFurnitureAtPosition,
    addWallMountedItem, updateFurniturePosition, updateFurnitureSize,
    updateFurnitureRotation, updateFurnitureColor, deleteFurniture,
    clearAllFurniture, selectFurniture, getSelectedFurniture
  } = useFurniture()

  const disaster = useDisaster()

  useEffect(() => {
    const doors = furniture.filter(item => item.type === 'door').map(d => ({
        ...d,
        isExterior: isExteriorDoor(d, walls)
    }));
    pathFinderRef.current = new PathFinder(walls, furniture, doors);
  }, [walls, furniture]);

  const calculateBuildingBounds = useCallback((walls) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    walls.forEach(wall => {
      wall.points.forEach(p => {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      });
    });
    return { minX, maxX, minY, maxY };
  }, []);

  useEffect(() => {
    let timeoutId;
    if (disaster.isDisasterActive) {
      const hasPath = !!disaster.evacuationPath;
      if (hasPath) {
        setShowNoPathWarning(false);
        setShowNoPathPopup(false);
        if (timeoutId) clearTimeout(timeoutId);
      } else {
        timeoutId = setTimeout(() => {
          setShowNoPathWarning(true);
          setShowNoPathPopup(true);
        }, 1500);
      }
    } else {
      setShowNoPathWarning(false);
      setShowNoPathPopup(false);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [disaster.isDisasterActive, disaster.evacuationPath]);
  
  useEffect(() => {
    const doors = furniture.filter(item => item.type === 'door').map(door => ({
      ...door, isExterior: isExteriorDoor(door, walls)
    }));
    const windows = furniture.filter(item => item.type === 'window').map(window => ({
      ...window, isExterior: isExteriorWindow ? isExteriorWindow(window, walls) : false
    }));
    
    disaster.updateEnvironment(walls, furniture, doors, windows);
    
    if (walls.length > 0 && !selectedStartPoint) {
      const bounds = calculateBuildingBounds(walls);
      const centerX2D = (bounds.minX + bounds.maxX) / 2;
      const centerY2D = (bounds.minY + bounds.maxY) / 2;
      const scale = 0.03; const offset = 500;
      disaster.setUserPosition((centerX2D - offset) * scale, (centerY2D - offset) * scale);
    }
  }, [walls.length, furniture.length, disaster, calculateBuildingBounds, selectedStartPoint]);


  useEffect(() => {
  // Parse URL parameters first (when launched from dashboard)
  const urlParams = new URLSearchParams(window.location.search);
  const userParam = urlParams.get('user');
  const tokenParam = urlParams.get('token');
  
  console.log('🔍 Draw3D Module - Checking for user data...');
  console.log('URL user param:', userParam ? '✅ Present' : '❌ Missing');
  console.log('URL token param:', tokenParam ? '✅ Present' : '❌ Missing');
  
  if (userParam && tokenParam && userParam !== 'undefined' && tokenParam !== 'undefined' && userParam !== '' && tokenParam !== '') {
    try {
      // Decode and parse user data
      const userData = JSON.parse(decodeURIComponent(userParam));
      console.log('✅ Draw3D Module - User data loaded from URL:', userData);
      
      // Store in localStorage for persistence
      localStorage.setItem('user', userParam);
      localStorage.setItem('token', tokenParam);
      
      // Update state
      setUser(userData);
      setIsLoggedIn(true);
      
      // Clean URL by removing parameters (optional)
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    } catch (e) {
      console.error('❌ Draw3D Module - Error parsing user data from URL:', e);
    }
  }
  
  // Fallback to localStorage (in case user came directly)
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  
  console.log('Draw3D Module - Checking localStorage:', { 
    storedUser: storedUser ? '✅ Found' : '❌ Not found', 
    storedToken: storedToken ? '✅ Found' : '❌ Not found' 
  });
  
  if (storedToken && storedUser && storedUser !== 'undefined' && storedToken !== 'undefined') {
    try {
      const userData = JSON.parse(storedUser);
      console.log('✅ Draw3D Module - User data loaded from localStorage:', userData);
      setUser(userData);
      setIsLoggedIn(true);
    } catch (e) {
      console.error('❌ Draw3D Module - Error parsing user data from localStorage:', e);
    }
  } else {
    console.log('❌ Draw3D Module - No user data found - user is not logged in');
  }
}, []);

  const handleAddDoor = useCallback((wallId, positionAlongWall, doorPosition, wallPoints) => {
    const doorData = { type: 'door', wallId, positionAlongWall, wallPoints, position2D: doorPosition };
    addWallMountedItem(enhanceDoorData(doorData, walls));
  }, [addWallMountedItem, walls]);

  const handleAddWindow = useCallback((wallId, positionAlongWall, windowPosition, wallPoints) => {
    const windowData = { type: 'window', wallId, positionAlongWall, wallPoints, position2D: windowPosition };
    if (typeof enhanceWindowData === 'function') addWallMountedItem(enhanceWindowData(windowData, walls));
    else addWallMountedItem(windowData);
  }, [addWallMountedItem, walls]);

  const handleStartFurniturePlacement = (type, defaultSize, color) => {
    setIsPlacingFurniture(true); setCurrentFurnitureType(type);
    setCurrentFurnitureSize(defaultSize); setCurrentFurnitureColor(color);
    selectFurniture(null); selectWall(null);
  }

  const handleCancelPlacement = () => {
    setIsPlacingFurniture(false); setCurrentFurnitureType(null);
    setCurrentFurnitureSize(null); setCurrentFurnitureColor(null);
  }

  const handleAddFurnitureAtPosition = (position) => {
    if (!isPlacingFurniture || !currentFurnitureType) return;
    const furnitureData = {
      type: currentFurnitureType,
      size: currentFurnitureSize || { width: 2, height: 0.5, depth: 1 },
      color: currentFurnitureColor || '#8B4513', position, rotation: 0
    };
    if (addFurnitureAtPosition) addFurnitureAtPosition(furnitureData);
    else addFurniture(currentFurnitureType, currentFurnitureSize, currentFurnitureColor, position);
    handleCancelPlacement()
  }

  const handleAddFurniture = (type, defaultSize, color) => {
    addFurniture(type, defaultSize, color, { x: 2, z: 2 });
  }

  const handleDeleteItem = () => {
    if (selectedWallId) deleteWall()
    else if (selectedFurnitureId) deleteFurniture(selectedFurnitureId)
  }

  const handleModeChange = (newMode) => {
    if (disaster.isDisasterActive) disaster.stopSimulation();
    setMode(newMode)
    if (isPlacingFurniture) handleCancelPlacement()
  }

  // =====================================================
  // START POINT HANDLERS WITH VALIDATION
  // =====================================================
  const handleStartPointSelection = useCallback((disasterType, params) => {
    setPendingDisaster(disasterType);
    setPendingParams(params);
    setIsSelectingStartPoint(true);
    // Reset error state when starting selection
    setShowInvalidLocationError(false);
  }, []);

  const handleStartPointSelected = useCallback((point) => {
    if (pathFinderRef.current) {
      const isValid = pathFinderRef.current.isValidStartPosition(point.x, point.z);
      
      if (!isValid) {
        // Show error message
        setShowInvalidLocationError(true);
        // Hide after 2.5 seconds
        setTimeout(() => setShowInvalidLocationError(false), 2500);
        return; 
      }
    }

    setSelectedStartPoint(point);
    disaster.setUserPosition(point.x, point.z);
    setIsSelectingStartPoint(false);
    setShowInvalidLocationError(false); // Clear error on success
    
    if (pendingDisaster && pendingParams) {
      disaster.startSimulation(pendingDisaster, pendingParams);
      setShowSafetyGuidelines(true);
      setPendingDisaster(null);
      setPendingParams(null);
    }
  }, [disaster, pendingDisaster, pendingParams]);

  const handleCancelSelection = useCallback(() => {
    setIsSelectingStartPoint(false);
    setPendingDisaster(null);
    setPendingParams(null);
    setShowInvalidLocationError(false);
  }, []);

  const handleDisasterSimulationStart = useCallback((disasterType, params) => {
    handleStartPointSelection(disasterType, params);
  }, [handleStartPointSelection]);

  const handleDisasterSimulationStop = useCallback(() => {
    disaster.stopSimulation();
    setShowNoPathPopup(false);
    setSelectedStartPoint(null);
    setPendingDisaster(null);
    setPendingParams(null);
    setIsSelectingStartPoint(false);
    setShowInvalidLocationError(false);
  }, [disaster]);

  const handleCloseGuidelines = useCallback(() => { setShowSafetyGuidelines(false); }, []);
  const handleClosePopup = useCallback(() => { setShowNoPathPopup(false); }, []);

  return (
    <div className="app">
      {/* Main EscapeXpert Header - ADD THIS */}
      <Header 
        isLoggedIn={isLoggedIn}
        user={user}
        handleLogout={handleLogout}
        isAuthPage={false}
      />

      <Toolbar
        mode={mode} setMode={handleModeChange} walls={walls} furniture={furniture}
        currentWall={currentWall} selectedWallId={selectedWallId} selectedFurnitureId={selectedFurnitureId}
        onFinishWall={finishWall} onClearWalls={clearWalls} onClearFurniture={clearAllFurniture}
        onDeleteWall={handleDeleteItem} onDeleteFurniture={deleteFurniture}
        isPlacingFurniture={isPlacingFurniture} onCancelPlacement={handleCancelPlacement}
        isDisasterActive={disaster.isDisasterActive} currentDisaster={disaster.currentDisaster}
        timeRemaining={disaster.timeRemaining} formattedTime={disaster.formattedTime}
        onStartDisasterSimulation={handleDisasterSimulationStart} onStopDisasterSimulation={handleDisasterSimulationStop}
      />
      
      {/* Added padding-top to account for both headers */}
      <div className="main-content" style={{ paddingTop: '140px' }}>
        {mode === 'draw' && (
          <DrawingCanvas
            walls={walls} currentWall={currentWall} selectedWallId={selectedWallId}
            onCanvasClick={updateCurrentWall} onWallSelect={selectWall} onContinueFromWall={continueFromWall}
            onDeleteWall={deleteWallById} onAddDoor={handleAddDoor} onAddWindow={handleAddWindow}
            furniture={furniture} evacuationPath={disaster.evacuationPath} currentDisaster={disaster.currentDisaster}
          />
        )}
        
        {mode === 'view3d' && (
          <ThreeDView 
            walls={walls} furniture={furniture} selectedWallId={selectedWallId}
            selectedFurnitureId={selectedFurnitureId} onWallSelect={selectWall}
            onFurnitureSelect={selectFurniture} onFurniturePositionUpdate={updateFurniturePosition}
            onFurnitureRotationUpdate={updateFurnitureRotation} onAddFurnitureAtPosition={handleAddFurnitureAtPosition}
            isPlacingFurniture={isPlacingFurniture} currentFurnitureType={currentFurnitureType}
            currentFurnitureSize={currentFurnitureSize} isDisasterActive={disaster.isDisasterActive}
            currentDisaster={disaster.currentDisaster} disasterParams={disaster.disasterParams}
            timeRemaining={disaster.timeRemaining} formattedTime={disaster.formattedTime}
            evacuationPath={disaster.evacuationPath} nearestExit={disaster.nearestExit}
            onSimulationStart={handleDisasterSimulationStart} onSimulationStop={handleDisasterSimulationStop}
            isSelectingStartPoint={isSelectingStartPoint}
            onStartPointSelected={handleStartPointSelected}
            startPoint={selectedStartPoint}
          />
        )}
        
        {mode === 'furniture' && (
          <div className="furniture-mode">
            <IconFurniturePanel
              onAddFurniture={handleAddFurniture} onStartFurniturePlacement={handleStartFurniturePlacement}
              selectedFurniture={getSelectedFurniture()} onUpdateSize={updateFurnitureSize}
              onUpdateColor={updateFurnitureColor} onUpdateRotation={updateFurnitureRotation}
              onDeleteFurniture={deleteFurniture} isPlacingFurniture={isPlacingFurniture}
              currentFurnitureType={currentFurnitureType} isDisasterActive={disaster.isDisasterActive}
            />
            <div className="furniture-preview">
              <ThreeDView 
                walls={walls} furniture={furniture} selectedWallId={selectedWallId}
                selectedFurnitureId={selectedFurnitureId} onWallSelect={selectWall}
                onFurnitureSelect={selectFurniture} onFurniturePositionUpdate={updateFurniturePosition}
                onFurnitureRotationUpdate={updateFurnitureRotation} onAddFurnitureAtPosition={handleAddFurnitureAtPosition}
                isPlacingFurniture={isPlacingFurniture} currentFurnitureType={currentFurnitureType}
                currentFurnitureSize={currentFurnitureSize} isDisasterActive={disaster.isDisasterActive}
                currentDisaster={disaster.currentDisaster} disasterParams={disaster.disasterParams}
                timeRemaining={disaster.timeRemaining} formattedTime={disaster.formattedTime}
                evacuationPath={disaster.evacuationPath} nearestExit={disaster.nearestExit}
                onSimulationStart={handleDisasterSimulationStart} onSimulationStop={handleDisasterSimulationStop}
                isSelectingStartPoint={isSelectingStartPoint}
                onStartPointSelected={handleStartPointSelected}
                startPoint={selectedStartPoint}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Selection Instruction - adjusted top position */}
      {isSelectingStartPoint && (
        <div style={{
          position: 'fixed', top: '140px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.95)', color: 'white', padding: '15px 30px',
          borderRadius: '50px', fontSize: '18px', fontWeight: 'bold', zIndex: 10000,
          display: 'flex', alignItems: 'center', gap: '15px', border: '2px solid #ffaa00',
          boxShadow: '0 0 30px rgba(255, 170, 0, 0.5)', animation: 'pulse 1.5s infinite'
        }}>
          <span style={{ fontSize: '24px' }}>👆</span>
          <span>Click on ground to select starting point</span>
          <button onClick={handleCancelSelection} style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', marginLeft: '10px', padding: '5px 10px', borderRadius: '20px' }}>✕ Cancel</button>
        </div>
      )}

      {/* Invalid Location Error Message - adjusted top position */}
      {showInvalidLocationError && (
        <div style={{
          position: 'fixed', top: '140px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255, 68, 68, 0.95)', color: 'white', padding: '12px 25px',
          borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', zIndex: 10001,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)', animation: 'shake 0.5s ease-in-out'
        }}>
          ⚠️ Select starting point inside building
        </div>
      )}
      
      <SafetyGuidelines disasterType={disaster.currentDisaster} isVisible={showSafetyGuidelines} onClose={handleCloseGuidelines} />
      
      {showNoPathPopup && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255, 68, 68, 0.95)', color: 'white', padding: '20px 40px', borderRadius: '15px', zIndex: 10000, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '18px', fontWeight: 'bold', animation: 'popIn 0.3s ease' }}>
          <span style={{ fontSize: '24px' }}>🚫</span> <span>Path not found</span>
          <button onClick={handleClosePopup} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', marginLeft: '10px' }}>✕</button>
        </div>
      )}
      
      {disaster.isDisasterActive && disaster.evacuationPath && (
        <div className="evacuation-info" style={{ position: 'fixed', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '15px 25px', borderRadius: '10px', borderLeft: `4px solid ${disaster.currentDisaster === 'fire' ? '#ff6600' : '#00ff00'}`, zIndex: 2000, boxShadow: '0 4px 15px rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>🚪 Exit found • {disaster.formattedTime} remaining </div>
        </div>
      )}
      
      <style>{` 
        @keyframes popIn { from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } } 
        @keyframes pulse { 0% { opacity: 0.9; transform: translateX(-50%) scale(1); } 50% { opacity: 1; transform: translateX(-50%) scale(1.02); } 100% { opacity: 0.9; transform: translateX(-50%) scale(1); } } 
        @keyframes shake { 0% { transform: translateX(-50%) translateX(0); } 25% { transform: translateX(-50%) translateX(-10px); } 50% { transform: translateX(-50%) translateX(10px); } 75% { transform: translateX(-50%) translateX(-10px); } 100% { transform: translateX(-50%) translateX(0); } }
      `}</style>
    </div>
  )
}

export default App
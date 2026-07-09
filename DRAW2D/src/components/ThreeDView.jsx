import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Plane } from '@react-three/drei';
import * as THREE from 'three';
import Wall3D from './Wall3D';
import EnhancedFurniture3D from './EnhancedFurniture3D';
import DisasterControlPanel from './DisasterControlPanel';
import EvacuationPath from './EvacuationPath';

// Define floor boundaries based on the actual wall positions
const FLOOR_SIZE = 100;
const FLOOR_HALF_SIZE = FLOOR_SIZE / 2;

// =====================================================
// FIXED: Click Handler Component
// =====================================================
const ClickHandler = ({ isSelectingStartPoint, onStartPointSelected }) => {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const handleCanvasClick = useCallback((event) => {
    if (!isSelectingStartPoint || !onStartPointSelected) return;
    
    // Get canvas bounds
    const rect = gl.domElement.getBoundingClientRect();
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera);
    
    // Create a plane at y=0 (ground level)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const targetPoint = new THREE.Vector3();
    
    // Find intersection
    if (raycaster.current.ray.intersectPlane(plane, targetPoint)) {
      console.log('📍 Raw intersection:', targetPoint.clone());
      
      // Constrain to floor bounds
      targetPoint.x = Math.max(-FLOOR_HALF_SIZE + 1, Math.min(FLOOR_HALF_SIZE - 1, targetPoint.x));
      targetPoint.z = Math.max(-FLOOR_HALF_SIZE + 1, Math.min(FLOOR_HALF_SIZE - 1, targetPoint.z));
      targetPoint.y = 0;
      
      console.log(' Selected start point:', targetPoint.clone());
      onStartPointSelected(targetPoint.clone());
    }
  }, [isSelectingStartPoint, onStartPointSelected, camera, gl]);

  // Add and remove event listener
  useEffect(() => {
    if (!gl || !gl.domElement) return;
    
    const canvas = gl.domElement;
    
    if (isSelectingStartPoint) {
      canvas.addEventListener('click', handleCanvasClick);
      canvas.style.cursor = 'crosshair';
      console.log(' Selection mode active - click on ground');
    } else {
      canvas.style.cursor = 'default';
    }
    
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [isSelectingStartPoint, handleCanvasClick, gl]);

  return null;
};

// =====================================================
// Start Point Marker Component
// =====================================================
const StartPointMarker = ({ position }) => {
  if (!position) return null;
  
  return (
    <group position={position}>
      {/* Center sphere */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ffaa00" emissive="#442200" />
      </mesh>
      
      {/* Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <torusGeometry args={[0.8, 0.05, 16, 32]} />
        <meshStandardMaterial color="#ffaa00" />
      </mesh>
      
      {/* Light */}
      <pointLight color="#ffaa00" intensity={1} distance={5} />
    </group>
  );
};

const FurniturePreview = ({ 
  isPlacing, 
  furnitureType, 
  furnitureSize,
  onPlace,
  isEarthquakeActive = false
}) => {
  const previewRef = useRef();
  const { scene, camera, mouse, raycaster } = useThree();
  
  useFrame((state, delta) => {
    if (!isPlacing || !previewRef.current) return;
    
    try {
      raycaster.setFromCamera(mouse, camera);
      
      const floorObjects = [];
      scene.traverse((child) => {
        if (child.userData && child.userData.isFloor) {
          floorObjects.push(child);
        }
      });

      const intersects = raycaster.intersectObjects(floorObjects);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        
        const margin = furnitureSize ? Math.max(furnitureSize.width, furnitureSize.depth) / 2 : 1;
        const constrainedX = Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, point.x));
        const constrainedZ = Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, point.z));
        
        if (isEarthquakeActive) {
          const time = state.clock.getElapsedTime();
          const shakeX = Math.sin(time * 15) * 0.02;
          const shakeZ = Math.cos(time * 12) * 0.02;
          previewRef.current.position.set(
            constrainedX + shakeX, 
            0.1, 
            constrainedZ + shakeZ
          );
        } else {
          previewRef.current.position.set(constrainedX, 0.1, constrainedZ);
        }
        
        previewRef.current.visible = true;
      } else {
        previewRef.current.visible = false;
      }
    } catch (error) {
      console.error('Error in furniture preview:', error);
    }
  });

  const handleClick = useCallback((event) => {
    if (!isPlacing) return;
    
    event.stopPropagation();
    
    try {
      raycaster.setFromCamera(mouse, camera);
      
      const floorObjects = [];
      scene.traverse((child) => {
        if (child.userData && child.userData.isFloor) {
          floorObjects.push(child);
        }
      });

      const intersects = raycaster.intersectObjects(floorObjects);
      
      if (intersects.length > 0 && onPlace) {
        const point = intersects[0].point;
        
        const margin = furnitureSize ? Math.max(furnitureSize.width, furnitureSize.depth) / 2 : 1;
        const constrainedX = Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, point.x));
        const constrainedZ = Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, point.z));
        
        onPlace({
          x: constrainedX,
          y: 0,
          z: constrainedZ
        });
      }
    } catch (error) {
      console.error('Error placing furniture:', error);
    }
  }, [isPlacing, mouse, camera, raycaster, scene, onPlace, furnitureSize]);

  if (!isPlacing) return null;

  const size = furnitureSize || { width: 2, height: 0.5, depth: 1 };

  return (
    <>
      <mesh 
        ref={previewRef} 
        visible={false}
        onClick={handleClick}
        userData={{ isPreview: true }}
      >
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshBasicMaterial 
          color="cyan" 
          transparent 
          opacity={0.6} 
          wireframe={false}
        />
      </mesh>
    </>
  );
};

// Earthquake Effects Component
const EarthquakeEffects = ({ 
  isActive, 
  params,
  originalPositions,
  originalRotations,
  onStoreOriginalPosition
}) => {
  const { scene } = useThree();
  
  useFrame((state, delta) => {
    if (!isActive) return;
    
    const time = state.clock.getElapsedTime();
    const { magnitude = 5.0, intensity = 1.0 } = params;
    const baseIntensity = magnitude * 0.1 * intensity;

    scene.traverse((child) => {
      if (child.userData?.isFloor || child.userData?.isPreview || 
          child.type === 'Light' || child.type === 'GridHelper' || 
          child.type === 'Camera' || child.type === 'DirectionalLight' ||
          child.type === 'AmbientLight') {
        return;
      }

      const isWallItem = child.userData?.isWall || child.userData?.isDoor || child.userData?.isWindow;
      
      if (child.userData?.id && onStoreOriginalPosition) {
        onStoreOriginalPosition(child.userData.id, child);
      }

      let originalPos = null;
      let originalRot = null;
      if (isWallItem && child.userData?.id) {
        originalPos = originalPositions?.get(child.userData.id);
        originalRot = originalRotations?.get(child.userData.id);
      }

      if (isWallItem && originalPos) {
        child.position.copy(originalPos);
        
        if (magnitude > 4.0 && originalRot) {
          const rotShake = baseIntensity * 0.02;
          const rotXShake = Math.sin(time * 8 + child.userData.id?.length || 0) * rotShake * delta;
          const rotZShake = Math.cos(time * 6 + child.userData.id?.length || 0) * rotShake * delta;
          
          child.rotation.x = originalRot.x + rotXShake;
          child.rotation.z = originalRot.z + rotZShake;
          child.rotation.y = originalRot.y;
        } else if (originalRot) {
          child.rotation.copy(originalRot);
        }
      } else {
        let shakeMultiplier = 1.0;
        
        if (child.userData?.isFurniture) {
          shakeMultiplier = 1.5;
          
          if (child.userData.furnitureData?.type === 'cabinet' || 
              child.userData.furnitureData?.type === 'table') {
            shakeMultiplier = 0.8;
          }
        } else if (child.type === 'Mesh' || child.type === 'Group') {
          shakeMultiplier = 0.5;
        }

        const objectSeed = child.userData?.id?.length || Math.random() * 1000;
        
        const shakeX = Math.sin(time * 20 + objectSeed) * baseIntensity * 0.1 * shakeMultiplier;
        const shakeZ = Math.cos(time * 18 + objectSeed) * baseIntensity * 0.1 * shakeMultiplier;
        const shakeY = Math.sin(time * 15 + objectSeed) * baseIntensity * 0.05 * shakeMultiplier;
        
        const newX = child.position.x + shakeX * delta;
        const newZ = child.position.z + shakeZ * delta;
        const newY = child.position.y + shakeY * delta;
        
        const margin = 0.5;
        const constrainedX = Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, newX));
        const constrainedZ = Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, newZ));
        
        child.position.set(constrainedX, newY, constrainedZ);

        if (magnitude > 4.0) {
          const rotShake = baseIntensity * 0.1 * shakeMultiplier;
          child.rotation.x += Math.sin(time * 12 + objectSeed) * rotShake * delta;
          child.rotation.z += Math.cos(time * 10 + objectSeed) * rotShake * delta;
          
          if (magnitude > 6.0) {
            child.rotation.y += Math.sin(time * 8 + objectSeed) * rotShake * 0.5 * delta;
          }
        }
        
        if (child.userData?.isFurniture && magnitude > 7.5 && Math.random() < 0.01 * delta) {
          child.rotation.x = Math.PI / 2;
        }
      }
    });
  });

  return null;
};

// Flood Effects Component
const FloodEffects = ({ 
  isActive, 
  params,
  originalPositions,
  originalRotations,
  onStoreOriginalPosition 
}) => {
  const { scene } = useThree();
  const waterRef = useRef();
  const [waterLevel, setWaterLevel] = useState(0);
  
  useFrame((state, delta) => {
    if (!isActive || !waterRef.current) return;
    
    const { waterLevel: targetLevel, flowDirection, speed } = params;
    
    setWaterLevel(prev => {
      const newLevel = prev + (targetLevel - prev) * 0.1 * delta;
      if (waterRef.current) {
        waterRef.current.position.y = newLevel - 0.1;
      }
      return newLevel;
    });
    
    scene.traverse((child) => {
      if (child.userData && child.userData.isFurniture) {
        if (child.userData.id && onStoreOriginalPosition) {
          onStoreOriginalPosition(child.userData.id, child);
        }
        
        if (child.position.y < waterLevel) {
          const flowForce = 0.1 * speed * delta;
          let flowX = 0;
          let flowZ = 0;
          
          switch (flowDirection) {
            case 'north': flowZ = -flowForce; break;
            case 'south': flowZ = flowForce; break;
            case 'east': flowX = flowForce; break;
            case 'west': flowX = -flowForce; break;
          }
          
          const newX = child.position.x + flowX;
          const newZ = child.position.z + flowZ;
          
          const margin = 0.5;
          const constrainedX = Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, newX));
          const constrainedZ = Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, newZ));
          
          child.position.x = constrainedX;
          child.position.z = constrainedZ;
          
          const buoyancy = 0.5 * delta;
          child.position.y = Math.min(child.position.y + buoyancy, waterLevel - 0.1);
          
          child.rotation.x += Math.sin(state.clock.elapsedTime) * 0.01 * delta;
          child.rotation.z += Math.cos(state.clock.elapsedTime) * 0.01 * delta;
          
          const driftIntensity = 0.02 * speed * delta;
          child.rotation.y += flowX * driftIntensity + flowZ * driftIntensity;
        }
      }
    });
  });

  if (!isActive) return null;

  return (
    <>
      <mesh 
        ref={waterRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshBasicMaterial color="#1E90FF" transparent opacity={0.6} />
      </mesh>
      
      {waterLevel > 0.1 && (
        <mesh position={[0, waterLevel + 0.1, 0]}>
          <arrowHelper 
            args={[
              new THREE.Vector3(
                params.flowDirection === 'east' ? 1 : params.flowDirection === 'west' ? -1 : 0,
                0,
                params.flowDirection === 'south' ? 1 : params.flowDirection === 'north' ? -1 : 0
              ),
              new THREE.Vector3(0, 0, 0),
              5,
              0x0000FF,
              1,
              0.5
            ]}
          />
        </mesh>
      )}
    </>
  );
};

// Floor with Effects
const FloorWithEffects = ({ 
  isEarthquakeActive, 
  earthquakeIntensity,
  isFloodActive,
  floodWaterLevel 
}) => {
  const floorRef = useRef();
  const [crackProgress, setCrackProgress] = useState(0);
  
  useFrame((state, delta) => {
    if (!floorRef.current) return;
    
    if (isEarthquakeActive) {
      const time = state.clock.getElapsedTime();
      const intensity = earthquakeIntensity || 1.0;
      
      floorRef.current.rotation.x = -Math.PI / 2 + Math.sin(time * 8) * 0.001 * intensity;
      floorRef.current.rotation.z = Math.cos(time * 6) * 0.001 * intensity;
      
      const magnitude = earthquakeIntensity * 10;
      const shrinkFactor = Math.min(0.2, magnitude * 0.02);
      const crackProgressTarget = Math.min(1.0, magnitude * 0.1);
      
      const currentScale = floorRef.current.scale.x;
      const targetScale = 1.0 - shrinkFactor;
      floorRef.current.scale.set(
        currentScale + (targetScale - currentScale) * 0.1 * delta,
        1,
        currentScale + (targetScale - currentScale) * 0.1 * delta
      );
      
      setCrackProgress(prev => prev + (crackProgressTarget - prev) * 0.05 * delta);
      
    } else if (isFloodActive) {
      floorRef.current.rotation.x = -Math.PI / 2;
      floorRef.current.rotation.z = 0;
      floorRef.current.scale.set(1, 1, 1);
      setCrackProgress(0);
    } else {
      floorRef.current.rotation.x = -Math.PI / 2;
      floorRef.current.rotation.z = 0;
      floorRef.current.scale.set(1, 1, 1);
      setCrackProgress(0);
    }
  });

  return (
    <mesh 
      ref={floorRef}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
      receiveShadow
      userData={{ isFloor: true }}
    >
      <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
      <meshStandardMaterial color="#e8e8e8" />
      
      {isEarthquakeActive && crackProgress > 0.1 && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[FLOOR_SIZE * crackProgress, 0.2]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, Math.PI / 4, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[FLOOR_SIZE * crackProgress, 0.15]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </>
      )}
    </mesh>
  );
};

// Scene Content Component
const SceneContent = ({
  walls,
  furniture,
  selectedWallId,
  selectedFurnitureId,
  onWallSelect,
  onFurnitureSelect,
  onFurniturePositionUpdate,
  onFurnitureRotationUpdate,
  onAddFurnitureAtPosition,
  isPlacingFurniture,
  currentFurnitureType,
  currentFurnitureSize,
  isDisasterActive,
  currentDisaster,
  disasterParams,
  evacuationPath,
  nearestExit,
  onSimulationStart,
  onSimulationStop,
  // NEW PROPS for start point selection
  isSelectingStartPoint = false,
  onStartPointSelected,
  startPoint
}) => {
  const originalPositions = useRef(new Map());
  const originalRotations = useRef(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const { scene } = useThree();

  const [localDisasterActive, setLocalDisasterActive] = useState(false);
  const [localCurrentDisaster, setLocalCurrentDisaster] = useState(null);
  const [localDisasterParams, setLocalDisasterParams] = useState({});
  const [localEvacuationPath, setLocalEvacuationPath] = useState(null);
  const [localNearestExit, setLocalNearestExit] = useState(null);

  const isWithinFloor = useCallback((x, z, margin = 0) => {
    return x >= -FLOOR_HALF_SIZE + margin && x <= FLOOR_HALF_SIZE - margin &&
           z >= -FLOOR_HALF_SIZE + margin && z <= FLOOR_HALF_SIZE - margin;
  }, []);

  const constrainToFloor = useCallback((position, margin = 0) => {
    return {
      x: Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, position.x)),
      y: position.y,
      z: Math.max(-FLOOR_HALF_SIZE + margin, Math.min(FLOOR_HALF_SIZE - margin, position.z))
    };
  }, []);

  const handleFurniturePlace = useCallback((position) => {
    try {
      const margin = currentFurnitureSize ? Math.max(currentFurnitureSize.width, currentFurnitureSize.depth) / 2 : 1;
      const constrainedPosition = constrainToFloor(position, margin);
      
      if (onAddFurnitureAtPosition && currentFurnitureType) {
        onAddFurnitureAtPosition(constrainedPosition);
      }
    } catch (error) {
      console.error('Error in furniture placement:', error);
    }
  }, [onAddFurnitureAtPosition, currentFurnitureType, currentFurnitureSize, constrainToFloor]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const storeOriginalPosition = useCallback((id, mesh) => {
    if (mesh && !originalPositions.current.has(id)) {
      originalPositions.current.set(id, mesh.position.clone());
      originalRotations.current.set(id, mesh.rotation.clone());
    }
  }, []);

  const resetObject = useCallback((id, mesh) => {
    const originalPos = originalPositions.current.get(id);
    const originalRot = originalRotations.current.get(id);
    if (mesh && originalPos && originalRot) {
      mesh.position.copy(originalPos);
      mesh.rotation.copy(originalRot);
      mesh.visible = true;
    }
  }, []);

  const resetAllWalls = useCallback(() => {
    scene.traverse((child) => {
      if (child.userData?.id && (child.userData?.isWall || child.userData?.isDoor || child.userData?.isWindow)) {
        resetObject(child.userData.id, child);
      }
    });
  }, [scene, resetObject]);

  useEffect(() => {
    if (isDisasterActive && currentDisaster) {
      setLocalDisasterActive(true);
      setLocalCurrentDisaster(currentDisaster);
      setLocalDisasterParams(disasterParams || {});
      
      scene.traverse((child) => {
        if (child.userData?.id && 
            (child.userData?.isWall || child.userData?.isDoor || 
             child.userData?.isWindow || child.userData?.isFurniture)) {
          if (!originalPositions.current.has(child.userData.id)) {
            originalPositions.current.set(child.userData.id, child.position.clone());
            originalRotations.current.set(child.userData.id, child.rotation.clone());
          }
        }
      });
    } else {
      setLocalDisasterActive(false);
      setLocalCurrentDisaster(null);
      setLocalDisasterParams({});
      resetAllWalls();
    }
  }, [isDisasterActive, currentDisaster, disasterParams, scene, resetAllWalls]);
  
  useEffect(() => {
    setLocalEvacuationPath(evacuationPath);
    setLocalNearestExit(nearestExit);
  }, [evacuationPath, nearestExit]);

  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
      
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* FIXED: Click Handler Component */}
      <ClickHandler 
        isSelectingStartPoint={isSelectingStartPoint}
        onStartPointSelected={onStartPointSelected}
      />
      
      {/* Start Point Marker */}
      {startPoint && <StartPointMarker position={startPoint} />}
      
      {localCurrentDisaster === 'earthquake' && (
        <EarthquakeEffects
          isActive={localDisasterActive}
          params={localDisasterParams}
          originalPositions={originalPositions.current}
          originalRotations={originalRotations.current}
          onStoreOriginalPosition={storeOriginalPosition}
        />
      )}
      
      {localCurrentDisaster === 'flood' && (
        <FloodEffects
          isActive={localDisasterActive}
          params={localDisasterParams}
          originalPositions={originalPositions.current}
          originalRotations={originalRotations.current}
          onStoreOriginalPosition={storeOriginalPosition}
        />
      )}
      
      <FurniturePreview
        isPlacing={isPlacingFurniture}
        furnitureType={currentFurnitureType}
        furnitureSize={currentFurnitureSize}
        onPlace={handleFurniturePlace}
        isEarthquakeActive={localDisasterActive && localCurrentDisaster === 'earthquake'}
      />
      
      <FloorWithEffects 
        isEarthquakeActive={localDisasterActive && localCurrentDisaster === 'earthquake'}
        earthquakeIntensity={localDisasterParams.intensity}
        isFloodActive={localDisasterActive && localCurrentDisaster === 'flood'}
        floodWaterLevel={localDisasterParams.waterLevel}
      />
      
      <gridHelper args={[FLOOR_SIZE, FLOOR_SIZE / 5, 0x444444, 0x222222]} position={[0, 0.01, 0]} />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
      />
      
      {/* Walls */}
      {walls.map(wall => (
        <Wall3D 
          key={wall.id} 
          wall={wall} 
          furniture={furniture}
          isSelected={wall.id === selectedWallId}
          onSelect={onWallSelect}
          floorSize={FLOOR_SIZE}
        />
      ))}
      
      {/* Furniture */}
      {furniture.map(item => (
        <EnhancedFurniture3D
          key={item.id}
          furniture={item}
          isSelected={item.id === selectedFurnitureId}
          onSelect={onFurnitureSelect}
          onPositionUpdate={onFurniturePositionUpdate}
          onRotationUpdate={onFurnitureRotationUpdate}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          floorSize={FLOOR_SIZE}
          constrainToFloor={constrainToFloor}
        />
      ))}
      
      {/* Evacuation Path */}
      {localDisasterActive && localEvacuationPath && (
        <>
          <EvacuationPath 
            path={localEvacuationPath}
            color={localCurrentDisaster === 'fire' ? '#ff6600' : '#00ff00'}
            width={0.3}
          />
          
          {localNearestExit && localNearestExit.position2D && (
            <mesh position={[
              (localNearestExit.position2D.x - 500) * 0.03,
              2.0,
              (localNearestExit.position2D.y - 500) * 0.03
            ]}>
              <Text
                color="white"
                fontSize={0.5}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="black"
              >
                EXIT
              </Text>
            </mesh>
          )}
          
          {localEvacuationPath.length > 0 && (
            <>
              <mesh position={[localEvacuationPath[0].x, 0.5, localEvacuationPath[0].z]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#ff0000" emissive="#330000" />
              </mesh>
              <mesh position={[localEvacuationPath[localEvacuationPath.length - 1].x, 0.8, localEvacuationPath[localEvacuationPath.length - 1].z]}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color="#00ff00" emissive="#003300" />
              </mesh>
            </>
          )}
        </>
      )}
    </>
  );
};

// Main ThreeDView Component
const ThreeDView = ({ 
  walls, 
  furniture,
  selectedWallId, 
  selectedFurnitureId,
  onWallSelect,
  onFurnitureSelect,
  onFurniturePositionUpdate,
  onFurnitureRotationUpdate,
  onAddFurnitureAtPosition,
  isPlacingFurniture = false,
  currentFurnitureType = null,
  currentFurnitureSize = null,
  isDisasterActive = false,
  currentDisaster = null,
  disasterParams = {},
  evacuationPath = null,
  nearestExit = null,
  onSimulationStart,
  onSimulationStop,
  // NEW PROPS for start point selection
  isSelectingStartPoint = false,
  onStartPointSelected,
  startPoint = null
}) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
  }, [isPlacingFurniture]);

  return (
    <div className="threed-view" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas 
        shadows 
        camera={{ position: [15, 15, 15], fov: 50 }}
        style={{ 
          width: '100%', 
          height: '100%',
          cursor: isSelectingStartPoint ? 'crosshair' : 'default'
        }}
      >
        <SceneContent
          walls={walls}
          furniture={furniture}
          selectedWallId={selectedWallId}
          selectedFurnitureId={selectedFurnitureId}
          onWallSelect={onWallSelect}
          onFurnitureSelect={onFurnitureSelect}
          onFurniturePositionUpdate={onFurniturePositionUpdate}
          onFurnitureRotationUpdate={onFurnitureRotationUpdate}
          onAddFurnitureAtPosition={onAddFurnitureAtPosition}
          isPlacingFurniture={isPlacingFurniture}
          currentFurnitureType={currentFurnitureType}
          currentFurnitureSize={currentFurnitureSize}
          isDisasterActive={isDisasterActive}
          currentDisaster={currentDisaster}
          disasterParams={disasterParams}
          evacuationPath={evacuationPath}
          nearestExit={nearestExit}
          onSimulationStart={onSimulationStart}
          onSimulationStop={onSimulationStop}
          // NEW PROPS
          isSelectingStartPoint={isSelectingStartPoint}
          onStartPointSelected={onStartPointSelected}
          startPoint={startPoint}
        />
      </Canvas>
      
      <DisasterControlPanel
        onSimulationStart={onSimulationStart}
        onSimulationStop={onSimulationStop}
        isSimulationActive={isDisasterActive}
      />
      
      {error && (
        <div className="error-message" style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          ❌ {error}
        </div>
      )}
      
      {isPlacingFurniture && (
        <div className="placement-mode-indicator" style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '30px',
          fontSize: '16px',
          fontWeight: 'bold',
          zIndex: 1000,
          border: '2px solid cyan',
          boxShadow: '0 0 20px rgba(0,255,255,0.5)',
          pointerEvents: 'none'
        }}>
          🎯 Click to place {currentFurnitureType}
        </div>
      )}
    </div>
  );
};

export default ThreeDView;
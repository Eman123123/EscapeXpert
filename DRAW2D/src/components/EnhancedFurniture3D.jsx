import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// New component for wall-mounted items
const WallMountedFurniture3D = ({ furniture, isSelected, onSelect }) => {
  const meshRef = useRef();
  const outlineRef = useRef();
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(furniture.id);
    }
  };
  
  const { type, size, color, position, rotation, wallOffset } = furniture;
    
  // For wall-mounted items, position them properly on the wall
  const adjustedPosition = [
    position.x,
    wallOffset ? wallOffset.height : (size.height / 2), // Use wall offset or center
    position.z
  ];
  
  // Create geometry for wall-mounted items
  const createWallMountedGeometry = () => {
    const group = new THREE.Group();
    
    if (type === 'door') {
      createDoorGeometry(group, size.width, size.depth, size.height, color);
    } else if (type === 'window') {
      createWindowGeometry(group, size.width, size.depth, size.height, color);
    } else {
      createDefaultWallGeometry(group, size.width, size.depth, size.height, color);
    }
    
    return group;
  };

  // Door geometry
  const createDoorGeometry = (group, width, depth, height, color) => {
    const doorGeometry = new THREE.BoxGeometry(width, height, depth);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.castShadow = true;
    door.receiveShadow = true;
    group.add(door);
    
    // Add door handle
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(width * 0.4, 0, depth * 0.6);
    handle.rotation.x = Math.PI / 2;
    group.add(handle);
  };

  // Window with frame and glass
  const createWindowGeometry = (group, width, depth, height, color) => {
    // Window frame
    const frameGeometry = new THREE.BoxGeometry(width, height, depth);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.6,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    group.add(frame);
    
    // Glass
    const glassGeometry = new THREE.BoxGeometry(width - 0.2, height - 0.2, depth * 0.5);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.3
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(0, 0, depth * 0.25);
    group.add(glass);
  };

  // Default wall-mounted geometry
  const createDefaultWallGeometry = (group, width, depth, height, color) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  };

  // Initialize geometry
  useEffect(() => {
    if (meshRef.current) {
      // Clear existing children
      while (meshRef.current.children.length > 0) {
        meshRef.current.remove(meshRef.current.children[0]);
      }
      
      // Create new geometry
      const furnitureGroup = createWallMountedGeometry();
      meshRef.current.add(furnitureGroup);
    }
  }, [furniture]);

  // Update selection outline
  useEffect(() => {
    if (outlineRef.current && meshRef.current) {
      if (isSelected) {
        // Create outline
        const outlineGeometry = new THREE.BoxGeometry(
          size.width * 1.1,
          size.height * 1.1,
          size.depth * 1.1
        );
        const outlineMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.5
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outlineRef.current.add(outline);
        
        // Position outline to match furniture
        outlineRef.current.position.copy(meshRef.current.position);
        outlineRef.current.rotation.copy(meshRef.current.rotation);
      } else {
        // Remove outline
        while (outlineRef.current.children.length > 0) {
          outlineRef.current.remove(outlineRef.current.children[0]);
        }
      }
    }
  }, [isSelected, size]);

  return (
    <>
      <group
        ref={meshRef}
        position={adjustedPosition}
        rotation={[0, rotation, 0]}
        onClick={handleClick}
        castShadow
        userData={{ 
          isFurniture: true,
          id: furniture.id,
          furnitureData: furniture,
          isWallMounted: true
        }}
      />
      <group ref={outlineRef} />
    </>
  );
};

// Main EnhancedFurniture3D Component
const EnhancedFurniture3D = ({ 
  furniture, 
  isSelected, 
  onSelect, 
  onPositionUpdate,
  onRotationUpdate,
  onDragStart,
  onDragEnd 
}) => {
  const groupRef = useRef();
  const outlineRef = useRef();
  const { camera, mouse, raycaster } = useThree();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState(new THREE.Vector3());

  // Handle wall-mounted items differently - THEY CANNOT BE DRAGGED
  if (furniture.isWallMounted) {
    return <WallMountedFurniture3D 
      furniture={furniture}
      isSelected={isSelected}
      onSelect={onSelect}
    />;
  }

  // Create furniture geometry based on type for regular furniture
  const createFurnitureGeometry = () => {
    const { type, size, color } = furniture;
    const { width, depth, height } = size;
    
    const group = new THREE.Group();

    switch (type) {
      case 'bed':
        createBedGeometry(group, width, depth, height, color);
        break;
      case 'sofa':
        createSofaGeometry(group, width, depth, height, color);
        break;
      case 'chair':
        createChairGeometry(group, width, depth, height, color);
        break;
      case 'table':
        createTableGeometry(group, width, depth, height, color);
        break;
      case 'dining':
        createDiningTableGeometry(group, width, depth, height, color);
        break;
      case 'cabinet':
        createCabinetGeometry(group, width, depth, height, color);
        break;
      case 'shelf':
        createShelfGeometry(group, width, depth, height, color);
        break;
      default:
        createDefaultGeometry(group, width, depth, height, color);
    }

    return group;
  };

  // Bed with mattress and headboard
  const createBedGeometry = (group, width, depth, height, color) => {
    // Bed base
    const bedGeometry = new THREE.BoxGeometry(width, height, depth);
    const bedMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
    });
    const bed = new THREE.Mesh(bedGeometry, bedMaterial);
    bed.position.set(0, height / 2, 0);
    bed.castShadow = true;
    bed.receiveShadow = true;
    group.add(bed);
    
    // Mattress
    const mattressGeometry = new THREE.BoxGeometry(width - 0.2, 0.3, depth - 0.2);
    const mattressMaterial = new THREE.MeshStandardMaterial({
      color: 0x4169E1,
      roughness: 0.8,
    });
    const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
    mattress.position.set(0, height + 0.15, 0);
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    group.add(mattress);
    
    // Headboard
    const headboardGeometry = new THREE.BoxGeometry(width, height * 1.2, 0.1);
    const headboardMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.6,
    });
    const headboard = new THREE.Mesh(headboardGeometry, headboardMaterial);
    headboard.position.set(0, height * 0.6, -depth / 2 + 0.05);
    headboard.castShadow = true;
    group.add(headboard);
  };

  // Sofa with back and arms
  const createSofaGeometry = (group, width, depth, height, color) => {
    const sofaColor = new THREE.Color(color);
    
    // Seat base
    const seatGeometry = new THREE.BoxGeometry(width, height * 0.4, depth * 0.8);
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: sofaColor,
      roughness: 0.8,
    });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, height * 0.2, depth * 0.1);
    seat.castShadow = true;
    seat.receiveShadow = true;
    group.add(seat);
    
    // Back
    const backGeometry = new THREE.BoxGeometry(width, height * 0.8, 0.2);
    const back = new THREE.Mesh(backGeometry, seatMaterial);
    back.position.set(0, height * 0.6, -depth * 0.4 + 0.1);
    back.castShadow = true;
    group.add(back);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.3, height * 0.8, depth * 0.8);
    const leftArm = new THREE.Mesh(armGeometry, seatMaterial);
    leftArm.position.set(-width / 2 + 0.15, height * 0.4, depth * 0.1);
    leftArm.castShadow = true;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, seatMaterial);
    rightArm.position.set(width / 2 - 0.15, height * 0.4, depth * 0.1);
    rightArm.castShadow = true;
    group.add(rightArm);
  };

  // Chair with backrest and legs
  const createChairGeometry = (group, width, depth, height, color) => {
    const chairColor = new THREE.Color(color);
    
    // Seat
    const seatGeometry = new THREE.BoxGeometry(width, 0.1, depth);
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: chairColor,
      roughness: 0.7,
    });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, height * 0.3, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    group.add(seat);
    
    // Back
    const backGeometry = new THREE.BoxGeometry(width, height * 0.6, 0.1);
    const back = new THREE.Mesh(backGeometry, seatMaterial);
    back.position.set(0, height * 0.6, -depth / 2 + 0.05);
    back.castShadow = true;
    group.add(back);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.1, height * 0.3, 0.1);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    
    const legPositions = [
      [-width/2 + 0.05, height * 0.15, -depth/2 + 0.05],
      [width/2 - 0.05, height * 0.15, -depth/2 + 0.05],
      [-width/2 + 0.05, height * 0.15, depth/2 - 0.05],
      [width/2 - 0.05, height * 0.15, depth/2 - 0.05],
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      group.add(leg);
    });
  };

  // Table with legs
  const createTableGeometry = (group, width, depth, height, color) => {
    // Table top
    const tableTopGeometry = new THREE.BoxGeometry(width, 0.3, depth);
    const tableTopMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.6,
    });
    const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
    tableTop.position.set(0, height, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);
    
    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.3, height, 0.3);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    
    const positions = [
      [-width/2 + 0.3, height/2, -depth/2 + 0.3],
      [width/2 - 0.3, height/2, -depth/2 + 0.3],
      [-width/2 + 0.3, height/2, depth/2 - 0.3],
      [width/2 - 0.3, height/2, depth/2 - 0.3],
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    });
  };

  // Dining table (larger with thicker legs)
  const createDiningTableGeometry = (group, width, depth, height, color) => {
    // Table top
    const tableTopGeometry = new THREE.BoxGeometry(width, 0.3, depth);
    const tableTopMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.6,
    });
    const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
    tableTop.position.set(0, height, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);
    
    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.4, height, 0.4);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
    });
    
    const positions = [
      [-width/2 + 0.5, height/2, -depth/2 + 0.5],
      [width/2 - 0.5, height/2, -depth/2 + 0.5],
      [-width/2 + 0.5, height/2, depth/2 - 0.5],
      [width/2 - 0.5, height/2, depth/2 - 0.5],
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    });
  };

  // Cabinet/Wardrobe
  const createCabinetGeometry = (group, width, depth, height, color) => {
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, height / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Doors
    const doorGeometry = new THREE.BoxGeometry(width / 2 - 0.1, height - 0.2, 0.05);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.6,
    });
    
    const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    leftDoor.position.set(-width / 4, height / 2, depth / 2 + 0.025);
    group.add(leftDoor);
    
    const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    rightDoor.position.set(width / 4, height / 2, depth / 2 + 0.025);
    group.add(rightDoor);
  };

  // Shelf with multiple levels
  const createShelfGeometry = (group, width, depth, height, color) => {
    const shelfColor = new THREE.Color(color);
    const shelfMaterial = new THREE.MeshStandardMaterial({
      color: shelfColor,
      roughness: 0.6,
    });
    
    // Multiple shelves
    const shelfCount = 3;
    const shelfHeight = height / shelfCount;
    
    for (let i = 0; i < shelfCount; i++) {
      const shelfGeometry = new THREE.BoxGeometry(width, 0.1, depth);
      const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
      shelf.position.set(0, shelfHeight * i + shelfHeight / 2, 0);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      group.add(shelf);
    }
    
    // Side supports
    const supportGeometry = new THREE.BoxGeometry(0.1, height, 0.1);
    const leftSupport = new THREE.Mesh(supportGeometry, shelfMaterial);
    leftSupport.position.set(-width / 2 + 0.05, height / 2, 0);
    group.add(leftSupport);
    
    const rightSupport = new THREE.Mesh(supportGeometry, shelfMaterial);
    rightSupport.position.set(width / 2 - 0.05, height / 2, 0);
    group.add(rightSupport);
  };

  // Default fallback
  const createDefaultGeometry = (group, width, depth, height, color) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  };

  // Drag and rotation handlers for REGULAR furniture only
  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
    
    if (e.button === 0) { // Left click - move
      setIsDragging(true);
      if (onDragStart) onDragStart();
      onSelect(furniture.id);
      
      // Calculate offset between click point and furniture center
      const intersection = e.intersections[0];
      if (intersection) {
        const worldPosition = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPosition);
        const offset = worldPosition.sub(intersection.point);
        setDragOffset(offset);
      }
    }
    
    if (e.button === 2) { // Right click - rotate
      setIsRotating(true);
      if (onDragStart) onDragStart();
      onSelect(furniture.id);
      e.preventDefault();
    }
  }, [furniture.id, onSelect, onDragStart]);

  const handlePointerMove = useCallback((e) => {
    if (!isSelected) return;
    
    if (isDragging) {
      e.stopPropagation();
      
      // Cast ray from mouse to floor
      raycaster.setFromCamera(mouse, camera);
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();
      
      if (raycaster.ray.intersectPlane(floorPlane, intersectionPoint)) {
        // Apply the offset to keep furniture under cursor
        const newPosition = intersectionPoint.add(dragOffset);
        
        onPositionUpdate(furniture.id, {
          x: newPosition.x,
          z: newPosition.z
        });
      }
    }
    
    if (isRotating) {
      e.stopPropagation();
      
      const rotationSpeed = 0.01;
      const newRotation = furniture.rotation + e.movementX * rotationSpeed;
      
      onRotationUpdate(furniture.id, newRotation);
    }
  }, [
    isSelected, isDragging, isRotating, furniture.id, furniture.rotation, 
    mouse, camera, raycaster, dragOffset, onPositionUpdate, onRotationUpdate
  ]);

  const handlePointerUp = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(false);
    setIsRotating(false);
    if (onDragEnd) onDragEnd();
  }, [onDragEnd]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Update cursor based on interaction
  useFrame(() => {
    if (groupRef.current) {
      if (isDragging) {
        document.body.style.cursor = 'grabbing';
      } else if (isSelected) {
        document.body.style.cursor = 'grab';
      } else {
        document.body.style.cursor = 'default';
      }
    }
  });

  // Initialize furniture geometry for REGULAR furniture
  useEffect(() => {
    if (groupRef.current) {
      // Clear existing children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      
      // Create new furniture geometry
      const furnitureGroup = createFurnitureGeometry();
      groupRef.current.add(furnitureGroup);
      
      // Set position and rotation
      groupRef.current.position.set(
        furniture.position.x,
        furniture.position.y,
        furniture.position.z
      );
      groupRef.current.rotation.y = furniture.rotation || 0;
      
      // Add user data for selection
      groupRef.current.userData = {
        type: 'furniture',
        furnitureId: furniture.id,
        selectable: true,
        isFurniture: true,
        id: furniture.id
      };
    }
  }, [furniture]);

  // Update selection outline for REGULAR furniture
  useEffect(() => {
    if (outlineRef.current && groupRef.current) {
      if (isSelected) {
        // Create outline
        const outlineGeometry = new THREE.BoxGeometry(
          furniture.size.width * 1.1,
          furniture.size.height * 1.1,
          furniture.size.depth * 1.1
        );
        const outlineMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.5
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outlineRef.current.add(outline);
        
        // Position outline to match furniture
        outlineRef.current.position.copy(groupRef.current.position);
        outlineRef.current.rotation.copy(groupRef.current.rotation);
      } else {
        // Remove outline
        while (outlineRef.current.children.length > 0) {
          outlineRef.current.remove(outlineRef.current.children[0]);
        }
      }
    }
  }, [isSelected, furniture.size]);

  // Handle position updates for REGULAR furniture
  useFrame(() => {
    if (groupRef.current) {
      const currentPos = groupRef.current.position;
      const targetPos = furniture.position;
      
      if (currentPos.x !== targetPos.x || currentPos.z !== targetPos.z) {
        groupRef.current.position.set(targetPos.x, targetPos.y, targetPos.z);
      }
      
      groupRef.current.rotation.y = furniture.rotation || 0;
      
      // Update outline position
      if (outlineRef.current && isSelected) {
        outlineRef.current.position.copy(groupRef.current.position);
        outlineRef.current.rotation.copy(groupRef.current.rotation);
      }
    }
  });

  return (
    <>
      <group 
        ref={groupRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={handleContextMenu}
        position={[furniture.position.x, furniture.position.y, furniture.position.z]}
        rotation={[0, furniture.rotation || 0, 0]}
      />
      <group ref={outlineRef} />
    </>
  );
};
export default EnhancedFurniture3D;
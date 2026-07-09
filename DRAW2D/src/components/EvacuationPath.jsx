// [NEW FILE] components/EvacuationPath.jsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

const EvacuationPath = ({ path, color = '#00ff00', width = 0.2 }) => {
  const { scene } = useThree();
  const lineRef = useRef();
  const arrowsRef = useRef([]);
  
  useEffect(() => {
    if (!path || path.length < 2) return;
    
    // Clean up previous arrows
    arrowsRef.current.forEach(arrow => {
      if (arrow.parent) scene.remove(arrow);
    });
    arrowsRef.current = [];
    
    // Create path line
    const points = path.map(point => new THREE.Vector3(point.x, 0.15, point.z));
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    
    // Add line to scene
    if (lineRef.current) {
      scene.remove(lineRef.current);
    }
    scene.add(line);
    lineRef.current = line;
    
    // Add direction arrows
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const distance = start.distanceTo(end);
      
      // Place arrows at intervals
      const numArrows = Math.max(1, Math.floor(distance / 2));
      for (let j = 1; j <= numArrows; j++) {
        const t = j / (numArrows + 1);
        const position = new THREE.Vector3().lerpVectors(start, end, t);
        position.y = 0.3; // Slightly above the path
        
        const arrowHelper = new THREE.ArrowHelper(
          direction,
          position,
          0.5,
          color,
          0.3,
          0.2
        );
        
        scene.add(arrowHelper);
        arrowsRef.current.push(arrowHelper);
      }
    }
    
    // Add start marker (red)
    const startMarkerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const startMarkerMaterial = new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: '#330000' });
    const startMarker = new THREE.Mesh(startMarkerGeometry, startMarkerMaterial);
    startMarker.position.set(points[0].x, 0.2, points[0].z);
    scene.add(startMarker);
    arrowsRef.current.push(startMarker);
    
    // Add end marker (green with glow)
    const endMarkerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const endMarkerMaterial = new THREE.MeshStandardMaterial({ color: '#00ff00', emissive: '#003300' });
    const endMarker = new THREE.Mesh(endMarkerGeometry, endMarkerMaterial);
    endMarker.position.set(points[points.length - 1].x, 0.3, points[points.length - 1].z);
    scene.add(endMarker);
    arrowsRef.current.push(endMarker);
    
    // Add distance label
    const distance = calculatePathDistance(path);
    const labelPosition = points[Math.floor(points.length / 2)];
    labelPosition.y = 1.0;
    
    // Cleanup
    return () => {
      if (lineRef.current) {
        scene.remove(lineRef.current);
      }
      arrowsRef.current.forEach(arrow => {
        if (arrow.parent) scene.remove(arrow);
      });
      arrowsRef.current = [];
    };
  }, [path, color, scene]);
  
  // Helper function to calculate path distance
  const calculatePathDistance = (path) => {
    let distance = 0;
    for (let i = 1; i < path.length; i++) {
      distance += Math.sqrt(
        Math.pow(path[i].x - path[i-1].x, 2) + 
        Math.pow(path[i].z - path[i-1].z, 2)
      );
    }
    return distance;
  };
  
  return null; // This component adds directly to scene
};

export default EvacuationPath;
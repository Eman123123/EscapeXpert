import { useState, useCallback } from 'react'

export const useWalls = () => {
  const [walls, setWalls] = useState([])
  const [currentWall, setCurrentWall] = useState(null)
  const [selectedWallId, setSelectedWallId] = useState(null)

  const addWall = useCallback((wall) => {
    if (wall.points.length < 2) {
      console.log('Cannot add wall - needs at least 2 points')
      return
    }
    
    console.log('Adding wall with points:', wall.points)
    
    // Create separate walls for each segment
    const wallSegments = []
    for (let i = 1; i < wall.points.length; i++) {
      const segment = {
        id: `wall-${Date.now()}-${i}`,
        points: [wall.points[i - 1], wall.points[i]],
        color: wall.color || getRandomColor(),
        isSegment: true
      }
      wallSegments.push(segment)
    }
    
    setWalls(prev => {
      const newWalls = [...prev, ...wallSegments]
      console.log('Total walls after add:', newWalls.length)
      return newWalls
    })
    
    // Clear current wall but don't auto-select
    setCurrentWall(null)
    console.log('Wall segments added:', wallSegments.length)
  }, [])

  const updateCurrentWall = useCallback((point) => {
    console.log('Updating current wall with point:', point)
    
    setCurrentWall(prev => {
      if (!prev) {
        const newWall = { points: [point], color: getRandomColor() }
        console.log('Starting new wall:', newWall)
        return newWall
      }
      
      const updatedWall = { ...prev, points: [...prev.points, point] }
      console.log('Adding point to existing wall. Total points:', updatedWall.points.length)
      return updatedWall
    })
  }, [])

  // FIXED: Continue from ANY point on existing wall
  const continueFromWall = useCallback((point, wallId) => {
    console.log('🔗 Continuing from wall:', wallId, 'at exact point:', point)
    
    // Start new wall from the EXACT point that was clicked on the existing wall
    const newWall = {
      points: [point], // Use the exact snapped point
      color: getRandomColor(),
      continuingFrom: wallId
    }
    setCurrentWall(newWall)
    setSelectedWallId(null)
    console.log('Started new wall from existing wall point')
  }, []) // Removed walls dependency since we're passing the exact point

  const finishWall = useCallback(() => {
    console.log('Finishing wall. Current wall points:', currentWall?.points?.length)
    
    if (currentWall && currentWall.points.length > 1) {
      addWall(currentWall)
    } else {
      console.log('Cannot finish - wall has insufficient points')
      setCurrentWall(null)
    }
    setSelectedWallId(null)
  }, [currentWall, addWall])

  const clearWalls = useCallback(() => {
    console.log('Clearing all walls')
    setWalls([])
    setCurrentWall(null)
    setSelectedWallId(null)
  }, [])

  const deleteWall = useCallback(() => {
    if (selectedWallId) {
      console.log('Deleting selected wall:', selectedWallId)
      setWalls(prev => {
        const newWalls = prev.filter(wall => wall.id !== selectedWallId)
        console.log('Walls after deletion:', newWalls.length)
        return newWalls
      })
      setSelectedWallId(null)
    } else {
      console.log('No wall selected to delete')
    }
  }, [selectedWallId])

  // NEW: Delete specific wall by ID (for context menu)
  const deleteWallById = useCallback((wallId) => {
    if (wallId) {
      console.log('🗑️ Deleting wall by ID:', wallId)
      setWalls(prev => {
        const newWalls = prev.filter(wall => wall.id !== wallId)
        console.log('Walls after deletion:', newWalls.length)
        return newWalls
      })
      setSelectedWallId(null)
    } else {
      console.log('No wall ID provided to delete')
    }
  }, [])

  const selectWall = useCallback((wallId) => {
    // Only allow selection if we're NOT currently drawing
    if (!currentWall) {
      console.log('Wall selected:', wallId)
      setSelectedWallId(wallId)
    } else {
      console.log('Cannot select wall while drawing - finish current wall first')
    }
  }, [currentWall])

  // Get all wall points for 3D conversion
  const getAllWallPoints = useCallback(() => {
    const allPoints = []
    walls.forEach(wall => {
      if (wall.points && wall.points.length === 2) {
        allPoints.push(wall.points[0], wall.points[1])
      }
    })
    return allPoints
  }, [walls])

  // Get wall segments for 3D conversion
  const getWallSegments = useCallback(() => {
    return walls.map(wall => ({
      id: wall.id,
      start: wall.points[0],
      end: wall.points[1],
      color: wall.color
    }))
  }, [walls])

  return {
    walls,
    currentWall,
    selectedWallId,
    addWall,
    updateCurrentWall,
    continueFromWall,
    finishWall,
    clearWalls,
    deleteWall, // For selected wall deletion
    deleteWallById, // NEW: For context menu deletion
    selectWall,
    getAllWallPoints,
    getWallSegments,
    // Helper for debugging
    getStats: () => ({
      totalWalls: walls.length,
      currentWallPoints: currentWall?.points?.length || 0,
      selectedWall: selectedWallId
    })
  }
}

const getRandomColor = () => {
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', 
    '#9b59b6', '#1abc9c', '#34495e'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
} 
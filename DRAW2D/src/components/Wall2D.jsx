import React from 'react'

const Wall2D = ({ wall, isDrawing = false, isSelected = false }) => {
  // Each wall should have exactly 2 points now
  if (!wall.points || wall.points.length !== 2) return null

  const [p1, p2] = wall.points
  
  const strokeColor = isSelected ? "#f39c12" : (isDrawing ? "#e74c3c" : "#2c3e50")
  const strokeWidth = isSelected ? 6 : (isDrawing ? 4 : 3)
  const pointRadius = isSelected ? 7 : (isDrawing ? 5 : 4)

  return (
    <svg 
      className="wall-2d" 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        pointerEvents: 'none' // Important: don't block clicks
      }}
    >
      {/* Single connecting line between the two points */}
      <line 
        x1={p1.x} 
        y1={p1.y} 
        x2={p2.x} 
        y2={p2.y} 
        stroke={strokeColor} 
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={isDrawing ? "8,4" : "none"}
      />
      
      {/* Point circles - only show for the two endpoints */}
      <circle 
        cx={p1.x} 
        cy={p1.y} 
        r={pointRadius} 
        fill={isSelected ? "#f39c12" : (isDrawing ? "#e74c3c" : "#2c3e50")} 
        stroke="#fff"
        strokeWidth={2}
      />
      <circle 
        cx={p2.x} 
        cy={p2.y} 
        r={pointRadius} 
        fill={isSelected ? "#f39c12" : (isDrawing ? "#e74c3c" : "#2c3e50")} 
        stroke="#fff"
        strokeWidth={2}
      />
    </svg>
  )
}

export default Wall2D
export const FURNITURE_ICONS = {
  bed: [
    {
      id: 'bed-1',
      name: 'Double Bed',
      icon: '🛏️',
      type: 'bed',
      defaultSize: { width: 2.0, height: 0.1, depth: 1.5 },
      color: '#4ECDC4'
    },
    {
      id: 'bed-2',
      name: 'Single Bed',
      icon: '🛌',
      type: 'bed',
      defaultSize: { width: 1.2, height: 0.1, depth: 1.2 },
      color: '#8B4513'
    }
  ],
  sofa: [
    {
      id: 'sofa-1',
      name: '3-Seater Sofa',
      icon: '🛋️',
      type: 'sofa',
      defaultSize: { width: 2.2, height: 0.9, depth: 0.9 },
      color: '#FF6B6B'
    },
    {
      id: 'sofa-2',
      name: 'L-Shaped Sofa',
      icon: '📺',
      type: 'sofa',
      defaultSize: { width: 2.5, height: 0.8, depth: 1.2 },
      color: '#3498DB'
    }
  ],
  chair: [
    {
      id: 'chair-1',
      name: 'Dining Chair',
      icon: '🪑',
      type: 'chair',
      defaultSize: { width: 0.5, height: 0.9, depth: 0.5 },
      color: '#8B4513'
    },
    {
      id: 'chair-2',
      name: 'Office Chair',
      icon: '💼',
      type: 'chair',
      defaultSize: { width: 0.6, height: 1.0, depth: 0.6 },
      color: '#34495E'
    }
  ],
  table: [
    {
      id: 'table-1',
      name: 'Coffee Table',
      icon: '☕',
      type: 'table',
      defaultSize: { width: 1.0, height: 0.4, depth: 0.6 },
      color: '#D2B48C'
    },
    {
      id: 'table-2',
      name: 'Side Table',
      icon: '💡',
      type: 'table',
      defaultSize: { width: 0.5, height: 0.5, depth: 0.5 },
      color: '#A0522D'
    }
  ],
  dining: [
    {
      id: 'dining-1',
      name: 'Dining Table',
      icon: '🍽️',
      type: 'dining',
      defaultSize: { width: 1.8, height: 0.75, depth: 0.9 },
      color: '#8B4513'
    }
  ],
  cabinet: [
    {
      id: 'cabinet-1',
      name: 'Wardrobe',
      icon: '👔',
      type: 'cabinet',
      defaultSize: { width: 1.2, height: 2.0, depth: 0.6 },
      color: '#A0A0A0'
    },
    {
      id: 'cabinet-2',
      name: 'Storage Cabinet',
      icon: '📦',
      type: 'cabinet',
      defaultSize: { width: 0.8, height: 1.8, depth: 0.4 },
      color: '#2C3E50'
    }
  ],
  shelf: [
    {
      id: 'shelf-1',
      name: 'Bookshelf',
      icon: '📚',
      type: 'shelf',
      defaultSize: { width: 0.8, height: 1.8, depth: 0.3 },
      color: '#8B4513'
    }
  ]
}

export const FURNITURE_CATEGORIES = [
  { key: 'bed', name: 'Beds', icon: '🛏️' },
  { key: 'sofa', name: 'Sofas', icon: '🛋️' },
  { key: 'chair', name: 'Chairs', icon: '🪑' },
  { key: 'table', name: 'Tables', icon: '☕' },
  { key: 'dining', name: 'Dining', icon: '🍽️' },
  { key: 'cabinet', name: 'Cabinets', icon: '👔' },
  { key: 'shelf', name: 'Shelves', icon: '📚' }
]
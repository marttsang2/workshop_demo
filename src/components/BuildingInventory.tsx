import { useState } from 'react'

interface BuildingInventoryProps {
  onSelectBuilding: (buildingKey: string) => void
}

const BuildingInventory: React.FC<BuildingInventoryProps> = ({ onSelectBuilding }) => {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  
  const buildings = [
    { key: 'apartment_Blue_1x1_Level1', icon: '🏠', color: '#3498db' },
    { key: 'apartment_Green_1x1_Level1', icon: '🏡', color: '#27ae60' },
    { key: 'apartment_Red_1x1_Level1', icon: '🏘️', color: '#e74c3c' },
    { key: 'apartment_Yellow_1x1_Level1', icon: '🏢', color: '#f39c12' }
  ]

  const handleSelectBuilding = (buildingKey: string) => {
    setSelectedBuilding(buildingKey)
    onSelectBuilding(buildingKey)
  }

  return (
    <div className="inventory-bar">
      {buildings.map((building) => (
        <button
          key={building.key}
          className={`inventory-item ${selectedBuilding === building.key ? 'selected' : ''}`}
          onClick={() => handleSelectBuilding(building.key)}
          style={{ backgroundColor: building.color }}
        >
          <span className="building-icon">{building.icon}</span>
        </button>
      ))}
      <button className="inventory-item special">
        <span className="building-icon">🌐</span>
      </button>
    </div>
  )
}

export default BuildingInventory
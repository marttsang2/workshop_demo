import { useState } from 'react'
import './App.css'
import PhaserGame from './components/PhaserGame'
import BuildingInventory from './components/BuildingInventory'

function App() {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)

  return (
    <div className="app-container">
      <div className="game-wrapper">
        <PhaserGame selectedBuilding={selectedBuilding} />
        <BuildingInventory onSelectBuilding={setSelectedBuilding} />
      </div>
    </div>
  )
}

export default App
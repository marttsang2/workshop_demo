import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import IsometricScene from '../game/scenes/IsometricScene'
import BuildingMenu from './BuildingMenu'
import PathwayMenu from './PathwayMenu'
import WorkshopMenu from './WorkshopMenu'

const PhaserGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentScene, setCurrentScene] = useState<IsometricScene | null>(null)
  const [showPathwayMenu, setShowPathwayMenu] = useState(false)
  const [showWorkshopMenu, setShowWorkshopMenu] = useState(false)
  const [workshopCompletionTrigger, setWorkshopCompletionTrigger] = useState(0)
  const [buildingPlacementTrigger, setBuildingPlacementTrigger] = useState(0)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: '100%',
      height: '100%',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [IsometricScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false  // Enable for sharper text
      },
      callbacks: {
        postBoot: (game) => {
          const scene = game.scene.getScene('IsometricScene') as IsometricScene
          setCurrentScene(scene)
          // Set up workshop menu callback
          scene.setWorkshopMenuCallback(() => setShowWorkshopMenu(true))
          // Set up building placement callback
          scene.setBuildingPlacementCallback(() => handleBuildingPlaced())
        }
      }
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  const handleBuildingSelect = (buildingKey: string) => {
    if (currentScene) {
      currentScene.selectBuildingFromReact(buildingKey)
    }
  }

  const handleCategoryChange = (category: string) => {
    if (currentScene) {
      currentScene.setCategoryFromReact(category)
    }
  }

  const handleDeleteMode = () => {
    if (currentScene) {
      currentScene.setDeleteModeFromReact()
    }
  }

  const handlePathwayMenuOpen = () => {
    setShowPathwayMenu(true)
  }

  const handlePathwaySelect = (pathwayKey: string) => {
    if (currentScene) {
      currentScene.selectBuildingFromReact(pathwayKey)
    }
  }

  const handleWorkshopCompleted = () => {
    // Trigger BuildingMenu to refresh when workshops are completed
    setWorkshopCompletionTrigger(prev => prev + 1)
  }

  const handleBuildingPlaced = useCallback(() => {
    // Trigger BuildingMenu to refresh when buildings are placed
    setBuildingPlacementTrigger(prev => prev + 1)
  }, [])


  return (
    <>
      <div ref={containerRef} className="phaser-container" />
      {currentScene && (
        <>
          <BuildingMenu
            onBuildingSelect={handleBuildingSelect}
            onCategoryChange={handleCategoryChange}
            onDeleteMode={handleDeleteMode}
            onPathwayMenuOpen={handlePathwayMenuOpen}
            gameScene={currentScene}
            refreshTrigger={workshopCompletionTrigger + buildingPlacementTrigger}
          />
          <PathwayMenu
            onPathwaySelect={handlePathwaySelect}
            gameScene={currentScene}
            isOpen={showPathwayMenu}
            onClose={() => setShowPathwayMenu(false)}
          />
          <WorkshopMenu
            gameScene={currentScene}
            isOpen={showWorkshopMenu}
            onClose={() => setShowWorkshopMenu(false)}
            onWorkshopCompleted={handleWorkshopCompleted}
          />
        </>
      )}
    </>
  )
}


export default PhaserGame
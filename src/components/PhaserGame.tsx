import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import IsometricScene from '../game/scenes/IsometricScene'
import BuildingMenu from './BuildingMenu'

const PhaserGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentScene, setCurrentScene] = useState<IsometricScene | null>(null)

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

  return (
    <>
      <div ref={containerRef} className="phaser-container" />
      {currentScene && (
        <BuildingMenu
          onBuildingSelect={handleBuildingSelect}
          onCategoryChange={handleCategoryChange}
          onDeleteMode={handleDeleteMode}
          gameScene={currentScene}
        />
      )}
    </>
  )
}


export default PhaserGame
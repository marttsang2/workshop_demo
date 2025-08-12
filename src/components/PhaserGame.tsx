import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import IsometricScene from '../game/scenes/IsometricScene'

interface PhaserGameProps {
  selectedBuilding: string | null
}

const PhaserGame: React.FC<PhaserGameProps> = ({ selectedBuilding }) => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      scene: [IsometricScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
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

  useEffect(() => {
    if (gameRef.current && selectedBuilding) {
      const scene = gameRef.current.scene.getScene('IsometricScene') as IsometricScene
      if (scene && scene.scene.isActive()) {
        scene.setSelectedBuilding(selectedBuilding)
      }
    }
  }, [selectedBuilding])

  return <div ref={containerRef} className="phaser-container" />
}

export default PhaserGame
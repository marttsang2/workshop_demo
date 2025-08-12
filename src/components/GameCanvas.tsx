import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameObjectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize game animations
    if (gameObjectRef.current) {
      // Create a floating animation for the game object
      gsap.to(gameObjectRef.current, {
        y: -20,
        duration: 2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      })

      // Add rotation animation
      gsap.to(gameObjectRef.current, {
        rotation: 360,
        duration: 8,
        ease: "none",
        repeat: -1
      })
    }
  }, [])

  const handleTap = () => {
    if (gameObjectRef.current) {
      // Create tap feedback animation
      gsap.to(gameObjectRef.current, {
        scale: 1.2,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      })
    }
  }

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main game object */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={gameObjectRef}
          onClick={handleTap}
          className="w-20 h-20 bg-gradient-to-r from-game-accent to-game-secondary rounded-full shadow-2xl cursor-pointer active:scale-110 transition-all duration-75"
          style={{
            boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)'
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-t from-transparent to-white opacity-30" />
        </div>
      </div>

      {/* Particle effects container */}
      <div className="absolute inset-0 pointer-events-none" />
    </div>
  )
}

export default GameCanvas 
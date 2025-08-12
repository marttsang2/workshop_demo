import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const GameUI: React.FC = () => {
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const scoreRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Animate UI elements on mount
    if (scoreRef.current && buttonRef.current) {
      gsap.fromTo([scoreRef.current, buttonRef.current], 
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: "back.out(1.7)" }
      )
    }
  }, [])

  useEffect(() => {
    // Animate score changes
    if (scoreRef.current && score > 0) {
      gsap.fromTo(scoreRef.current,
        { scale: 1 },
        { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }
      )
    }
  }, [score])

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      setScore(0)
    }
    
    // Button animation feedback
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      })
    }
  }

  const incrementScore = () => {
    setScore(prev => prev + 10)
  }

  return (
    <div className="game-ui">
      {/* Top UI - Score */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div 
          ref={scoreRef}
          className="game-score bg-black bg-opacity-50 rounded-lg px-4 py-2"
        >
          Score: {score}
        </div>
        
        <div className="flex space-x-2">
          <button className="touch-button w-12 h-12 text-xl">
            ⚙️
          </button>
          <button className="touch-button w-12 h-12 text-xl">
            🔊
          </button>
        </div>
      </div>

      {/* Bottom UI - Controls */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex flex-col space-y-4">
          {/* Action buttons */}
          <div className="flex justify-center space-x-4">
            <button 
              onClick={incrementScore}
              className="touch-button px-6 py-3 text-lg font-bold bg-game-accent hover:bg-yellow-500"
            >
              Tap +10
            </button>
          </div>
          
          {/* Play/Pause button */}
          <div className="flex justify-center">
            <button
              ref={buttonRef}
              onClick={handlePlayToggle}
              className={`touch-button px-8 py-4 text-xl font-bold transition-colors duration-200 ${
                isPlaying 
                  ? 'bg-game-danger hover:bg-red-500' 
                  : 'bg-game-success hover:bg-green-500'
              }`}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
          </div>
        </div>
      </div>

      {/* Side UI - Mobile controls */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
        <button className="touch-button w-14 h-14 rounded-full bg-game-secondary text-2xl">
          ⬆️
        </button>
        <button className="touch-button w-14 h-14 rounded-full bg-game-secondary text-2xl">
          ⬇️
        </button>
      </div>

      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
        <button className="touch-button w-14 h-14 rounded-full bg-game-primary text-2xl">
          🚀
        </button>
        <button className="touch-button w-14 h-14 rounded-full bg-game-primary text-2xl">
          💎
        </button>
      </div>

      {/* Game status overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Mobile Game Demo</h1>
            <p className="text-lg mb-6">Tap Play to start your adventure!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameUI 
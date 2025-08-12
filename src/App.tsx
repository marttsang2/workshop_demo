import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './App.css'
import GameMap from './components/GameMap'

function App() {
  const appRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize GSAP animations for app entrance
    if (appRef.current) {
      gsap.fromTo(appRef.current, 
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
      )
    }
  }, [])

  return (
    <div ref={appRef} className="game-container no-select no-drag">
      <GameMap />
    </div>
  )
}

export default App

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import Character from './Character'

// Register the MotionPath plugin
gsap.registerPlugin(MotionPathPlugin)

interface Position {
  x: number
  y: number
}

interface Workshop {
  title: string
  description: string
  picture: string
}

// Workshop data for specific positions
const workshopData: Record<string, Workshop> = {
  '3,1': {
    title: 'Advanced AI Workshop',
    description: 'Explore cutting-edge artificial intelligence techniques and machine learning algorithms. Learn how to build intelligent systems that can solve complex problems.',
    picture: '/map.jpg'
  },
  '1,4': {
    title: 'Web Development Bootcamp',
    description: 'Master modern web development with React, TypeScript, and the latest frontend technologies. Build responsive and interactive web applications.',
    picture: '/map.jpg'
  },
  '1,3': {
    title: 'Data Science & Analytics',
    description: 'Dive deep into data analysis, visualization, and statistical modeling. Learn to extract meaningful insights from complex datasets.',
    picture: '/map.jpg'
  },
  '3,0': {
    title: 'Mobile App Development',
    description: 'Create stunning mobile applications for iOS and Android. Learn native development and cross-platform frameworks.',
    picture: '/map.jpg'
  },
  '2,2': {
    title: 'Cybersecurity Fundamentals',
    description: 'Understand the principles of cybersecurity, ethical hacking, and system protection. Learn to secure digital assets and networks.',
    picture: '/map.jpg'
  }
}

const GameMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const characterRef = useRef<HTMLDivElement>(null)
  const [characterPosition, setCharacterPosition] = useState<Position>({ x: 2, y: 2 })
  const [isMoving, setIsMoving] = useState(false)
  const [previewPath, setPreviewPath] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [currentWorkshop, setCurrentWorkshop] = useState<Workshop | null>(null)

  // Grid configuration for mobile vertical layout
  const GRID_COLS = 5
  const GRID_ROWS = 5
  const BLOCK_SIZE = 80 // 80px blocks for better mobile touch targets

  useEffect(() => {
    // Initialize character position animation - center it in the block
    if (characterRef.current) {
      gsap.set(characterRef.current, {
        x: characterPosition.x * BLOCK_SIZE + BLOCK_SIZE / 2,
        y: characterPosition.y * BLOCK_SIZE + BLOCK_SIZE / 2,
        scale: 1,
        rotation: -45,
        xPercent: -50, // Center the character horizontally
        yPercent: -50  // Center the character vertically
      })

      // Entrance animation
      gsap.fromTo(characterRef.current,
        { scale: 0, rotation: 135 },
        { scale: 1, rotation: -45, duration: 0.8, ease: "back.out(1.7)" }
      )
    }

    // Check if character starts on a workshop position
    const initialPositionKey = `${characterPosition.x},${characterPosition.y}`
    const initialWorkshop = workshopData[initialPositionKey]
    if (initialWorkshop) {
      setCurrentWorkshop(initialWorkshop)
    }
  }, [])

  // Debug effect to monitor currentWorkshop state
  useEffect(() => {
    console.log('Current workshop state changed:', currentWorkshop)
  }, [currentWorkshop])

  const createPath = (startX: number, startY: number, endX: number, endY: number): string => {
    const startPixelX = startX * BLOCK_SIZE + BLOCK_SIZE / 2
    const startPixelY = startY * BLOCK_SIZE + BLOCK_SIZE / 2
    const endPixelX = endX * BLOCK_SIZE + BLOCK_SIZE / 2
    const endPixelY = endY * BLOCK_SIZE + BLOCK_SIZE / 2

    // Calculate distance for curve intensity
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
    const curveIntensity = Math.min(distance * 15, 60) // Max curve of 60px

    // Create control points for a smooth curve
    const midX = (startPixelX + endPixelX) / 2
    const midY = (startPixelY + endPixelY) / 2
    
    // Add perpendicular offset for curve
    const deltaX = endPixelX - startPixelX
    const deltaY = endPixelY - startPixelY
    const perpX = -deltaY
    const perpY = deltaX
    const length = Math.sqrt(perpX * perpX + perpY * perpY)
    
    let controlX = midX
    let controlY = midY
    
    if (length > 0) {
      controlX += (perpX / length) * curveIntensity * 0.5
      controlY += (perpY / length) * curveIntensity * 0.5
    }

    // Create SVG path with quadratic curve
    return `M ${startPixelX} ${startPixelY} Q ${controlX} ${controlY} ${endPixelX} ${endPixelY}`
  }

  const moveCharacter = (targetX: number, targetY: number) => {
    if (isMoving || !characterRef.current) return

    setIsMoving(true)

    // Create curved path between current and target positions
    const path = createPath(characterPosition.x, characterPosition.y, targetX, targetY)
    
    // Calculate movement distance for duration
    const distance = Math.sqrt(
      Math.pow(targetX - characterPosition.x, 2) + 
      Math.pow(targetY - characterPosition.y, 2)
    )
    const duration = Math.max(0.8, distance * 0.3) // Minimum 0.8s, scale with distance

    // Create movement timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // Ensure character is exactly centered in the target block
        if (characterRef.current) {
          gsap.set(characterRef.current, {
            x: targetX * BLOCK_SIZE + BLOCK_SIZE / 2,
            y: targetY * BLOCK_SIZE + BLOCK_SIZE / 2,
            xPercent: -50,
            yPercent: -50,
            rotation: -45
          })
        }
        setCharacterPosition({ x: targetX, y: targetY })
        
        // Check if character entered a workshop position
        const positionKey = `${targetX},${targetY}`
        const workshop = workshopData[positionKey]
        console.log('Position:', positionKey, 'Workshop:', workshop) // Debug log
        if (workshop) {
          setCurrentWorkshop(workshop)
        } else {
          setCurrentWorkshop(null)
        }
        
        setIsMoving(false)
      }
    })

    // Character bounce animation at start
    tl.to(characterRef.current, {
      scale: 1.2,
      duration: 0.15,
      ease: "power2.out"
    })
    .to(characterRef.current, {
      scale: 1,
      duration: 0.15,
      ease: "power2.in"
    })
    
    // Motion path animation without autoRotate to maintain direction
    .to(characterRef.current, {
      motionPath: {
        path: path,
        autoRotate: false,
        alignOrigin: [0.5, 0.5],
      },
      rotation: -45, // Explicitly maintain rotation at -45 degrees
      duration: duration,
      ease: "power2.inOut"
    }, "-=0.1")
    
    // Landing bounce
    .to(characterRef.current, {
      scale: 1.1,
      duration: 0.1,
      ease: "power2.out"
    })
    .to(characterRef.current, {
      scale: 1,
      rotation: -45, // Reset rotation to -45 degrees after movement
      duration: 0.2,
      ease: "back.out(1.7)"
    })
  }

  const handleBlockClick = (blockX: number, blockY: number) => {
    if (blockX === characterPosition.x && blockY === characterPosition.y) return
    setShowPreview(false)
    moveCharacter(blockX, blockY)
  }

  const handleBlockHover = (blockX: number, blockY: number) => {
    if (isMoving || (blockX === characterPosition.x && blockY === characterPosition.y)) {
      setShowPreview(false)
      return
    }
    
    const path = createPath(characterPosition.x, characterPosition.y, blockX, blockY)
    setPreviewPath(path)
    setShowPreview(true)
  }

  const handleBlockLeave = () => {
    setShowPreview(false)
  }



  const renderGrid = () => {
    const blocks = []
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const isCharacterBlock = x === characterPosition.x && y === characterPosition.y
        const isClickable = !isMoving

        blocks.push(
          <div
            key={`${x}-${y}`}
            className={`
              absolute transition-all duration-200 cursor-pointer overflow-hidden
              ${isCharacterBlock 
                ? '' 
                : 'hover:bg-game-primary hover:bg-opacity-25 rounded-lg'
              }
              ${isClickable ? 'active:scale-95' : 'pointer-events-none opacity-50'}
            `}
            style={{
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              left: x * BLOCK_SIZE,
              top: y * BLOCK_SIZE,
            }}
            onClick={() => handleBlockClick(x, y)}
            onMouseEnter={() => handleBlockHover(x, y)}
            onMouseLeave={handleBlockLeave}
            onTouchStart={() => handleBlockHover(x, y)}
          >
            {/* Grass block background image */}
            <img 
              src="/test_grid.png"
              alt="Grass block"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'rotate(-45deg)', scale: 1.2 }}
              draggable={false}
            />
            {/* Block coordinates for debugging */}
            {/* <div className="text-xs text-white opacity-50 p-1 relative z-10">
              {x},{y}
            </div> */}
          </div>
        )
      }
    }
    return blocks
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-800 via-slate-700 to-slate-600 relative overflow-hidden flex items-center justify-center">
      
      <div className="flex items-center justify-center gap-28 max-w-7xl mx-auto px-4">
        {/* Game map container */}
        <div
          ref={mapRef}
          className="relative flex-shrink-0"
          style={{
            width: GRID_COLS * BLOCK_SIZE,
            height: GRID_ROWS * BLOCK_SIZE,
            transform: 'rotate(45deg)'
          }}
        >
          {/* Grid blocks */}
          {renderGrid()}

          {/* Path preview overlay */}
          {showPreview && (
            <svg
              className="absolute inset-0 pointer-events-none z-5"
              width={GRID_COLS * BLOCK_SIZE}
              height={GRID_ROWS * BLOCK_SIZE}
            >
              <path
                d={previewPath}
                stroke="#F59E0B"
                strokeWidth="3"
                strokeDasharray="8,4"
                fill="none"
                opacity="0.8"
              />
              {/* Add animated dots along the path */}
              <circle r="4" fill="#F59E0B" opacity="0.6">
                <animateMotion dur="2s" repeatCount="indefinite">
                  <mpath href={`#path-${Date.now()}`} />
                </animateMotion>
              </circle>
              <path id={`path-${Date.now()}`} d={previewPath} stroke="none" fill="none" />
            </svg>
          )}

          {/* Character */}
          <Character
            ref={characterRef}
            isMoving={isMoving}
            style={{
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
            }}
          />
        </div>

        {/* Workshop Information Card */}
        {currentWorkshop && (
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-80 flex-shrink-0 border border-gray-200">
            <div className="mb-4">
              <img
                src={currentWorkshop.picture}
                alt={currentWorkshop.title}
                className="w-full h-48 object-cover rounded-lg shadow-md"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              {currentWorkshop.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {currentWorkshop.description}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">WORKSHOP INFO</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 rounded-2xl p-3">
        <p className="text-white text-sm text-center">
          {isMoving 
            ? '🌟 Following curved path...' 
            : showPreview 
              ? '✨ Curved path preview - tap to move!' 
              : currentWorkshop
                ? '📚 Workshop discovered! Move to explore more.'
                : '👆 Hover/tap blocks to see curved paths'
          }
        </p>
      </div>

      {/* Position indicator */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-2">
        <p className="text-white text-xs">
          Position: ({characterPosition.x}, {characterPosition.y})
        </p>
      </div>
    </div>
  )
}

export default GameMap 
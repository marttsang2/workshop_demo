import { useEffect, useRef, useState, useCallback } from 'react'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tileImageRef = useRef<HTMLImageElement | null>(null)
  const [currentWorkshop, setCurrentWorkshop] = useState<Workshop | null>(null)
  const [hoveredTile, setHoveredTile] = useState<Position | null>(null)
  const [selectedTile, setSelectedTile] = useState<Position | null>(null)

  // Isometric configuration
  const GRID_COLS = 7
  const GRID_ROWS = 7
  const TILE_WIDTH = 128  // Width of the isometric tile for drawing
  const TILE_HEIGHT = 64  // Height of the isometric tile for drawing
  const TILE_DEPTH = 40   // Depth of the tile (3D part)
  // Actual spacing between tiles for the flat map effect
  const TILE_SPACING_X = 64  // Horizontal spacing between tile centers
  const TILE_SPACING_Y = 30  // Vertical spacing between tile centers

  // Convert tile coordinates to screen coordinates
  const tileToScreen = useCallback((tileX: number, tileY: number) => {
    const screenX = (tileX - tileY) * TILE_SPACING_X + canvasRef.current!.width / 2
    const screenY = (tileX + tileY) * TILE_SPACING_Y + 150  // Adjusted offset
    return { x: screenX, y: screenY }
  }, [])

  // Convert screen coordinates to tile coordinates
  const screenToTile = useCallback((screenX: number, screenY: number) => {
    const offsetX = screenX - canvasRef.current!.width / 2
    const offsetY = screenY - 150  // Match the offset in tileToScreen
    // Use the exact same spacing values for accurate detection
    const tileX = Math.round((offsetX / TILE_SPACING_X + offsetY / TILE_SPACING_Y) / 2)
    const tileY = Math.round((offsetY / TILE_SPACING_Y - offsetX / TILE_SPACING_X) / 2)
    return { x: tileX, y: tileY }
  }, [])

  // Draw the isometric map
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !tileImageRef.current) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw tiles in correct order for isometric depth
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const screenPos = tileToScreen(x, y)
        
        // Check if this tile is hovered or selected
        const isHovered = hoveredTile && hoveredTile.x === x && hoveredTile.y === y
        const isSelected = selectedTile && selectedTile.x === x && selectedTile.y === y
        
        // Draw tile image
        ctx.save()
        if (isHovered) {
          ctx.globalAlpha = 0.8
        }
        // Draw tiles with their original size but tighter spacing
        ctx.drawImage(
          tileImageRef.current,
          screenPos.x - 64,  // Use original half-width for drawing
          screenPos.y - TILE_DEPTH,
          TILE_WIDTH,
          TILE_HEIGHT + TILE_DEPTH
        )
        ctx.restore()

        // Draw hover or selection effect at the base of the tile
        if (isHovered || isSelected) {
          ctx.save()
          ctx.strokeStyle = isSelected ? '#10B981' : '#F59E0B'
          ctx.lineWidth = isSelected ? 4 : 3
          ctx.beginPath()
          // Draw diamond outline at the base (ground level)
          ctx.moveTo(screenPos.x, screenPos.y)
          ctx.lineTo(screenPos.x + 64, screenPos.y + 32)
          ctx.lineTo(screenPos.x, screenPos.y + 64)
          ctx.lineTo(screenPos.x - 64, screenPos.y + 32)
          ctx.closePath()
          ctx.stroke()
          ctx.restore()
        }

        // Check for workshop marker
        const posKey = `${x},${y}`
        if (workshopData[posKey]) {
          // Draw workshop indicator
          ctx.save()
          ctx.fillStyle = '#F59E0B'
          ctx.beginPath()
          ctx.arc(screenPos.x, screenPos.y + TILE_SPACING_Y, 8, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }
    }
  }, [hoveredTile, tileToScreen])

  // Load tile image
  useEffect(() => {
    const img = new Image()
    img.src = '/test_grid.png'
    img.onload = () => {
      tileImageRef.current = img
      drawMap()
    }
  }, [])

  // Redraw when hover or selection changes
  useEffect(() => {
    drawMap()
  }, [hoveredTile, selectedTile, drawMap])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = 800
    canvas.height = 600
    
    // Disable image smoothing for pixel-perfect rendering
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.imageSmoothingEnabled = false
    }

    // Initial draw
    drawMap()
  }, [])



  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const tile = screenToTile(x, y)
    if (tile.x >= 0 && tile.x < GRID_COLS && tile.y >= 0 && tile.y < GRID_ROWS) {
      setSelectedTile(tile)
      
      // Check if clicked on a workshop position
      const positionKey = `${tile.x},${tile.y}`
      const workshop = workshopData[positionKey]
      if (workshop) {
        setCurrentWorkshop(workshop)
      } else {
        setCurrentWorkshop(null)
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const tile = screenToTile(x, y)
    if (tile.x >= 0 && tile.x < GRID_COLS && tile.y >= 0 && tile.y < GRID_ROWS) {
      setHoveredTile(tile)
    } else {
      setHoveredTile(null)
    }
  }

  const handleCanvasMouseLeave = () => {
    setHoveredTile(null)
  }


  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-800 via-slate-700 to-slate-600 relative overflow-hidden flex items-center justify-center">
      
      <div className="flex items-center justify-center gap-28 max-w-7xl mx-auto px-4">
        {/* Game map container */}
        <div className="relative flex-shrink-0">
          {/* Canvas for isometric map */}
          <canvas
            ref={canvasRef}
            className="cursor-pointer"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
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
          {currentWorkshop
            ? 'Workshop discovered! Click other tiles to explore more.'
            : 'Click on tiles to explore the isometric map'
          }
        </p>
      </div>

      {/* Position indicator */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-2">
        <p className="text-white text-xs">
          {selectedTile ? `Selected: (${selectedTile.x}, ${selectedTile.y})` : 'No tile selected'}
        </p>
      </div>
    </div>
  )
}

export default GameMap 
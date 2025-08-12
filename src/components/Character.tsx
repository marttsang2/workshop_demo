import { forwardRef } from 'react'

interface CharacterProps {
  isMoving?: boolean
  className?: string
  style?: React.CSSProperties
}

const Character = forwardRef<HTMLDivElement, CharacterProps>(
  ({ isMoving = false, className = '', style = {} }, ref) => {
    return (
      <div
        ref={ref}
        className={`absolute z-10 flex items-center justify-center pointer-events-none ${className}`}
        style={style}
      >
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Base body layer */}
          <img
            src="/test_bodybody.gif"
            alt="Character body"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              imageRendering: 'pixelated', // Preserve pixel art quality
              zIndex: 1
            }}
          />
          
          {/* Clothes layer on top */}
          <img
            src="/test_bodyclothes.gif"
            alt="Character clothes"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              imageRendering: 'pixelated', // Preserve pixel art quality
              zIndex: 2
            }}
          />
          
          {/* Shadow and border effect */}
          <div 
            className="absolute inset-0 rounded-full shadow-lg"
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
              zIndex: 3,
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>
    )
  }
)

Character.displayName = 'Character'

export default Character 
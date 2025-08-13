import { useEffect, useRef, useState } from 'react'

interface PhaserTextureDisplayProps {
  textureKey: string
  gameScene: any
  width?: number
  height?: number
  scale?: number
  className?: string
}

const PhaserTextureDisplay: React.FC<PhaserTextureDisplayProps> = ({
  textureKey,
  gameScene,
  width = 64,
  height = 64,
  scale = 1,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!gameScene || !textureKey || !canvasRef.current) return

    try {
      // Get the texture from Phaser
      const texture = gameScene.textures.get(textureKey)
      if (!texture || texture.key === '__MISSING') {
        console.warn(`Texture not found: ${textureKey}`)
        return
      }

      const frame = texture.get()
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size
      canvas.width = width
      canvas.height = height

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Get the source image
      const source = frame.source.image
      if (source) {
        // Calculate scaled dimensions
        const scaledWidth = frame.width * scale
        const scaledHeight = frame.height * scale

        // Center the image
        const x = (width - scaledWidth) / 2
        const y = (height - scaledHeight) / 2

        // Draw the texture
        ctx.drawImage(
          source,
          frame.cutX,
          frame.cutY,
          frame.cutWidth,
          frame.cutHeight,
          x,
          y,
          scaledWidth,
          scaledHeight
        )

        // Convert to data URL for better performance
        const dataUrl = canvas.toDataURL()
        setImageUrl(dataUrl)
      }
    } catch (error) {
      console.error(`Error loading texture ${textureKey}:`, error)
    }
  }, [textureKey, gameScene, width, height, scale])

  if (imageUrl) {
    return <img src={imageUrl} className={className} alt={textureKey} />
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  )
}

export default PhaserTextureDisplay
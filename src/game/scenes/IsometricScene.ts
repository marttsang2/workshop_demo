import Phaser from 'phaser'

interface TileData {
  x: number
  y: number
  occupied: boolean
  building?: Phaser.GameObjects.Image
  tile: Phaser.GameObjects.Image
}

export default class IsometricScene extends Phaser.Scene {
  private gridSize = 7
  private tileWidth = 130
  private tileHeight = 80
  private tiles: TileData[][] = []
  private selectedBuilding: string | null = null
  private highlightGraphics: Phaser.GameObjects.Graphics | null = null
  private gridContainer: Phaser.GameObjects.Container | null = null

  constructor() {
    super({ key: 'IsometricScene' })
  }

  preload() {
    this.load.image('ground_tile', 'test_grid.png')
    
    const apartmentTypes = ['Blue', 'Green', 'Grey', 'Pink', 'Red', 'Yellow']
    const sizes = ['1x1', '1x2', '2x2']
    const levels = ['Level1', 'Level2', 'Level3']
    
    apartmentTypes.forEach(color => {
      sizes.forEach(size => {
        levels.forEach(level => {
          const key = `apartment_${color}_${size}_${level}`
          const path = `GiantCityBuilder/Appartments/Appartment_${color}_${size}_${level}.png`
          this.load.image(key, path)
        })
      })
    })
  }

  create() {
    this.cameras.main.setBackgroundColor('#5DADE2')
    
    this.gridContainer = this.add.container(0, 0)
    this.highlightGraphics = this.add.graphics()
    
    this.initializeGrid()
    this.createIsometricGrid()
    this.setupInteraction()
    
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2 - 50
    this.gridContainer.setPosition(centerX, centerY)
  }

  private initializeGrid() {
    for (let y = 0; y < this.gridSize; y++) {
      this.tiles[y] = []
      for (let x = 0; x < this.gridSize; x++) {
        this.tiles[y][x] = {
          x: x,
          y: y,
          occupied: false,
          tile: null as any
        }
      }
    }
  }

  private createIsometricGrid() {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const isoX = (col - row) * (this.tileWidth / 2)
        const isoY = (col + row) * (this.tileHeight / 2)

        const tile = this.add.image(isoX, isoY, 'ground_tile')
        tile.setOrigin(0.5, 0.5)
        
        const tileScale = this.tileWidth / tile.width
        tile.setScale(tileScale)
        
        // Correct depth calculation for isometric view
        // In isometric: lower visual position (higher row+col sum) should be in front
        // This creates proper back-to-front rendering
        const depth = (row + col) * 100
        tile.setDepth(depth)
        
        tile.setInteractive()
        tile.setData('gridX', col)
        tile.setData('gridY', row)
        
        this.tiles[row][col].tile = tile
        this.gridContainer?.add(tile)
      }
    }
  }

  private setupInteraction() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.gridContainer || !this.highlightGraphics) return
      
      const localX = pointer.x - this.gridContainer.x
      const localY = pointer.y - this.gridContainer.y
      
      const tile = this.getTileAtPosition(localX, localY)
      
      this.highlightGraphics.clear()
      
      if (tile && this.selectedBuilding && !tile.occupied) {
        const tileSprite = tile.tile
        const worldPos = this.gridContainer.getWorldTransformMatrix().transformPoint(tileSprite.x, tileSprite.y)
        
        this.highlightGraphics.lineStyle(3, 0x00ff00, 1)
        this.drawTileHighlight(worldPos.x, worldPos.y - 10)
      }
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.gridContainer) return
      
      const localX = pointer.x - this.gridContainer.x
      const localY = pointer.y - this.gridContainer.y
      
      const tile = this.getTileAtPosition(localX, localY)
      
      if (tile && this.selectedBuilding && !tile.occupied) {
        this.placeBuilding(tile)
      }
    })
  }

  private drawTileHighlight(x: number, y: number) {
    if (!this.highlightGraphics) return
    
    const w = this.tileWidth / 2
    const h = this.tileHeight / 2
    
    this.highlightGraphics.beginPath()
    this.highlightGraphics.moveTo(x, y - h)
    this.highlightGraphics.lineTo(x + w, y)
    this.highlightGraphics.lineTo(x, y + h)
    this.highlightGraphics.lineTo(x - w, y)
    this.highlightGraphics.closePath()
    this.highlightGraphics.strokePath()
  }

  private getTileAtPosition(x: number, y: number): TileData | null {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const tile = this.tiles[row][col].tile
        const tileX = tile.x
        const tileY = tile.y
        
        const dx = Math.abs(x - tileX)
        const dy = Math.abs(y - tileY)
        
        const w = this.tileWidth / 2
        const h = this.tileHeight / 2
        
        if (dx / w + dy / h <= 1) {
          return this.tiles[row][col]
        }
      }
    }
    return null
  }

  private placeBuilding(tileData: TileData) {
    if (!this.selectedBuilding || !this.gridContainer) return
    
    const tile = tileData.tile
    // Place building on the tile surface with container offset
    const containerX = this.gridContainer.x
    const containerY = this.gridContainer.y
    const building = this.add.image(containerX + tile.x, containerY + tile.y, this.selectedBuilding)
    building.setOrigin(0.5, 0.7)
    
    // Scale building to match tile size
    // Use the same scale as tiles so they appear consistent
    const tileScale = tile.scaleX // Get the tile's scale
    building.setScale(tileScale)
    
    // Get the actual grid coordinates from the tile data
    const gridRow = tile.getData('gridY')
    const gridCol = tile.getData('gridX')
    
    // Calculate depth: same formula as tiles but with building offset
    // row + col gives us the diagonal, multiply by 100 for spacing, add 50 for building layer
    const depth = (gridRow + gridCol) * 100 + 50
    building.setDepth(depth)
    
    // Don't add to container - let depth sorting work at scene level
    tileData.occupied = true
    tileData.building = building
  }

  public setSelectedBuilding(buildingKey: string) {
    this.selectedBuilding = buildingKey
  }
}
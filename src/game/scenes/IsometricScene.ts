import Phaser from 'phaser'

interface TileData {
  x: number
  y: number
  occupied: boolean
  building?: Phaser.GameObjects.Image
  tile: Phaser.GameObjects.Image
}

interface BuildingButton {
  bg: Phaser.GameObjects.Rectangle
  icon: Phaser.GameObjects.Text
  key: string
}

export default class IsometricScene extends Phaser.Scene {
  private gridSize = 7
  private tileWidth = 130
  private tileHeight = 80
  private tiles: TileData[][] = []
  private selectedBuilding: string | null = null
  private highlightGraphics: Phaser.GameObjects.Graphics | null = null
  private gridContainer: Phaser.GameObjects.Container | null = null
  private uiContainer: Phaser.GameObjects.Container | null = null
  private buildingButtons: BuildingButton[] = []
  private buildings: Phaser.GameObjects.Image[] = []
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private containerStartX = 0
  private containerStartY = 0

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
    this.createUI()
    
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2 - 50
    this.gridContainer.setPosition(centerX, centerY)
    
    // Handle window resize
    this.scale.on('resize', this.resize, this)
    this.resize()
  }

  private resize() {
    const width = this.scale.width
    const height = this.scale.height
    
    // Reposition UI container at bottom
    if (this.uiContainer) {
      this.uiContainer.setPosition(width / 2, height - 80)
    }
    
    // Center grid if not being dragged
    if (!this.isDragging && this.gridContainer) {
      this.gridContainer.setPosition(width / 2, height / 2 - 50)
    }
  }

  private createUI() {
    const width = this.scale.width
    const height = this.scale.height
    
    // Create UI container for building menu
    this.uiContainer = this.add.container(width / 2, height - 80)
    
    // Create semi-transparent background bar
    const bgBar = this.add.rectangle(0, 0, width, 120, 0x000000, 0.7)
    this.uiContainer.add(bgBar)
    
    // Create building buttons
    const buildings = [
      { key: 'apartment_Blue_1x1_Level1', icon: '🏠', color: 0x3498db },
      { key: 'apartment_Green_1x1_Level1', icon: '🏡', color: 0x27ae60 },
      { key: 'apartment_Red_1x1_Level1', icon: '🏘️', color: 0xe74c3c },
      { key: 'apartment_Yellow_1x1_Level1', icon: '🏢', color: 0xf39c12 },
      { key: 'apartment_Pink_1x1_Level1', icon: '🏛️', color: 0xe91e63 },
      { key: 'apartment_Grey_1x1_Level1', icon: '🏗️', color: 0x95a5a6 }
    ]
    
    buildings.forEach((building, index) => {
      const x = (index - 2.5) * 80
      
      // Button background
      const button = this.add.rectangle(x, 0, 60, 60, building.color, 0.9)
      button.setInteractive({ useHandCursor: true })
      button.setStrokeStyle(3, 0xffffff, 0.5)
      
      // Button icon
      const icon = this.add.text(x, 0, building.icon, {
        fontSize: '28px',
        align: 'center'
      }).setOrigin(0.5)
      
      this.uiContainer.add([button, icon])
      
      // Store button reference
      const btnData: BuildingButton = {
        bg: button,
        icon: icon,
        key: building.key
      }
      this.buildingButtons.push(btnData)
      
      // Button interactions
      button.on('pointerover', () => {
        button.setScale(1.1)
        icon.setScale(1.1)
      })
      
      button.on('pointerout', () => {
        if (this.selectedBuilding !== building.key) {
          button.setScale(1)
          icon.setScale(1)
        }
      })
      
      button.on('pointerdown', () => {
        this.selectBuilding(building.key)
        // Update all buttons visual state
        this.buildingButtons.forEach(btn => {
          if (btn.key === building.key) {
            btn.bg.setScale(1.1)
            btn.bg.setStrokeStyle(3, 0xffd700, 1)
            btn.icon.setScale(1.1)
          } else {
            btn.bg.setScale(1)
            btn.bg.setStrokeStyle(3, 0xffffff, 0.5)
            btn.icon.setScale(1)
          }
        })
      })
    })
    
    // Make UI always on top
    this.uiContainer.setDepth(10000)
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
    let pointerDownTime = 0
    let hasDraggedEnough = false
    const MIN_DRAG_DISTANCE = 5 // Minimum pixels to move before considering it a drag
    
    // Drag to pan
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't start drag if clicking on UI
      if (pointer.y > this.scale.height - 140) return
      
      pointerDownTime = Date.now()
      hasDraggedEnough = false
      this.dragStartX = pointer.x
      this.dragStartY = pointer.y
      if (this.gridContainer) {
        this.containerStartX = this.gridContainer.x
        this.containerStartY = this.gridContainer.y
      }
    })
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Check if we've moved enough to consider it a drag
      const dx = pointer.x - this.dragStartX
      const dy = pointer.y - this.dragStartY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > MIN_DRAG_DISTANCE && pointerDownTime > 0) {
        hasDraggedEnough = true
        this.isDragging = true
      }
      
      // Handle dragging
      if (this.isDragging && this.gridContainer) {
        this.gridContainer.x = this.containerStartX + dx
        this.gridContainer.y = this.containerStartY + dy
        
        // Update all building positions to follow the container
        this.updateBuildingPositions()
      }
      
      // Handle tile highlighting
      if (!this.isDragging && this.gridContainer && this.highlightGraphics) {
        // Convert pointer position to local container space, accounting for scale
        const localX = (pointer.x - this.gridContainer.x) / this.gridContainer.scale
        const localY = (pointer.y - this.gridContainer.y) / this.gridContainer.scale
        
        const tile = this.getTileAtPosition(localX, localY)
        
        this.highlightGraphics.clear()
        
        if (tile && this.selectedBuilding && !tile.occupied) {
          const tileSprite = tile.tile
          // Calculate world position considering container position and scale
          const worldX = this.gridContainer.x + tileSprite.x * this.gridContainer.scale
          const worldY = this.gridContainer.y + tileSprite.y * this.gridContainer.scale
          
          this.highlightGraphics.lineStyle(3, 0x00ff00, 1)
          this.drawTileHighlight(worldX, worldY - 10 * this.gridContainer.scale, this.gridContainer.scale)
        }
      }
    })
    
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // Place building if it was a click (not a drag)
      if (!hasDraggedEnough && this.gridContainer) {
        // Convert pointer position to local container space, accounting for scale
        const localX = (pointer.x - this.gridContainer.x) / this.gridContainer.scale
        const localY = (pointer.y - this.gridContainer.y) / this.gridContainer.scale
        
        const tile = this.getTileAtPosition(localX, localY)
        
        if (tile && this.selectedBuilding && !tile.occupied) {
          this.placeBuilding(tile)
        }
      }
      
      this.isDragging = false
      hasDraggedEnough = false
      pointerDownTime = 0
    })
    
    // Mouse wheel zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      if (this.gridContainer) {
        const zoom = this.gridContainer.scale
        const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.5, 2)
        this.gridContainer.setScale(newZoom)
        
        // Update building positions and scales when zooming
        this.updateBuildingPositions()
      }
    })
  }
  
  private updateBuildingPositions() {
    if (!this.gridContainer) return
    
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const tileData = this.tiles[row][col]
        if (tileData.building && tileData.tile) {
          const tile = tileData.tile
          const building = tileData.building
          
          // Update building position based on container position and scale
          building.x = this.gridContainer.x + tile.x * this.gridContainer.scale
          building.y = this.gridContainer.y + tile.y * this.gridContainer.scale
          
          // Update building scale
          building.setScale(tile.scaleX * this.gridContainer.scale)
        }
      }
    }
  }

  private drawTileHighlight(x: number, y: number, scale: number = 1) {
    if (!this.highlightGraphics) return
    
    const w = (this.tileWidth / 2) * scale
    const h = (this.tileHeight / 2) * scale
    
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
    // Place building at world position (accounting for container transform)
    const worldX = this.gridContainer.x + tile.x * this.gridContainer.scale
    const worldY = this.gridContainer.y + tile.y * this.gridContainer.scale
    
    const building = this.add.image(worldX, worldY, this.selectedBuilding)
    building.setOrigin(0.5, 0.7)
    
    // Scale building to match tile size and container scale
    const tileScale = tile.scaleX * this.gridContainer.scale
    building.setScale(tileScale)
    
    // Get the actual grid coordinates from the tile data
    const gridRow = tile.getData('gridY')
    const gridCol = tile.getData('gridX')
    
    // Calculate depth - buildings stay at scene level with proper depth sorting
    const depth = (gridRow + gridCol) * 100 + 50
    building.setDepth(depth)
    
    // Store reference but don't add to container
    tileData.occupied = true
    tileData.building = building
    this.buildings.push(building)
  }

  private selectBuilding(buildingKey: string) {
    this.selectedBuilding = buildingKey
  }

  public setSelectedBuilding(buildingKey: string) {
    this.selectedBuilding = buildingKey
  }
}
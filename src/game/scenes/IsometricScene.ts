import Phaser from 'phaser'

interface TileData {
  x: number
  y: number
  occupied: boolean
  building?: Phaser.GameObjects.Image
  tile: Phaser.GameObjects.Image
  groundType: string // 'grass', 'road_1', 'road_2', etc.
}

interface BuildingSize {
  width: number
  height: number
}

interface CategoryButton {
  bg: Phaser.GameObjects.Rectangle
  icon: Phaser.GameObjects.Text
  category: string
}

export default class IsometricScene extends Phaser.Scene {
  private gridSize = 8
  private tileWidth = 130
  private tileHeight = 80
  private tiles: TileData[][] = []
  private selectedBuilding: string | null = null
  private highlightGraphics: Phaser.GameObjects.Graphics | null = null
  private gridContainer: Phaser.GameObjects.Container | null = null
  private uiContainer: Phaser.GameObjects.Container | null = null
  private categoryButtons: CategoryButton[] = []
  private currentCategory = 'apartments'
  private buildings: Phaser.GameObjects.Image[] = []
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private containerStartX = 0
  private containerStartY = 0
  private dialogOpen = false

  constructor() {
    super({ key: 'IsometricScene' })
  }

  preload() {
    this.load.image('ground_tile', 'test_grid.png')
    
    // Load apartments
    const apartmentTypes = ['Blue', 'Green', 'Grey', 'Pink', 'Red', 'Yellow']
    const sizes = ['1x1', '2x2']  // Removed 1x2 and 2x1
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
    
    // Load road tiles
    for (let i = 1; i <= 9; i++) {
      this.load.image(`road_${i}`, `GiantCityBuilder/Tiles/Road_Tile${i}.png`)
    }
    
    // Load grass road tiles
    for (let i = 1; i <= 9; i++) {
      this.load.image(`grass_road_${i}`, `GiantCityBuilder/Tiles/GrassRoad_Tile${i}.png`)
    }
    
    // Load signature buildings (all 2x2) from public folder
    this.load.image('signature_hospital', 'GiantCityBuilder/Public/Doctor_Hospital.png')
    this.load.image('signature_university', 'GiantCityBuilder/Public/Education_University.png')
    // this.load.image('signature_cinema', 'GiantCityBuilder/Public/Leasure_Cinema.png')
  }

  create() {
    this.cameras.main.setBackgroundColor('#5DADE2')
    
    // Create and position container FIRST
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2
    this.gridContainer = this.add.container(centerX, centerY)
    this.highlightGraphics = this.add.graphics()
    
    this.initializeGrid()
    this.createIsometricGrid()
    this.setupInteraction()
    this.createUI()
    
    // Initialize with University in center and roads around it
    // This must happen AFTER container is positioned
    this.initializeStartingBuildings()
    
    // Handle window resize
    this.scale.on('resize', this.resize, this)
    this.resize()
  }
  

  private resize() {
    const width = this.scale.width
    const height = this.scale.height
    
    // Reposition UI container at bottom
    if (this.uiContainer) {
      this.uiContainer.setPosition(width / 2, height - 60)
    }
    
    // Center grid if not being dragged
    if (!this.isDragging && this.gridContainer) {
      this.gridContainer.setPosition(width / 2, height / 2)
    }
  }

  private createUI() {
    const width = this.scale.width
    const height = this.scale.height
    
    // Create UI container for building menu
    this.uiContainer = this.add.container(width / 2, height - 60)
    
    // Create semi-transparent background bar
    const bgBar = this.add.rectangle(0, 0, width, 80, 0x000000, 0.7)
    this.uiContainer.add(bgBar)
    
    // Create category buttons
    const categories = [
      { category: 'apartments', icon: '🏠', color: 0x3498db },
      { category: 'signature', icon: '🏛️', color: 0x9b59b6 },
      { category: 'roads', icon: '🛤️', color: 0x95a5a6 },
      { category: 'delete', icon: '❌', color: 0xe74c3c },
      { category: 'world', icon: '🌐', color: 0xf39c12 }
    ]
    
    categories.forEach((cat, index) => {
      const x = (index - 2.5) * 70 - 250  // Adjusted for 6 categories
      
      // Category button
      const button = this.add.rectangle(x, 0, 55, 55, cat.color, 0.9)
      button.setInteractive({ useHandCursor: true })
      button.setStrokeStyle(2, 0xffffff, 0.5)
      
      // Category icon
      const icon = this.add.text(x, 0, cat.icon, {
        fontSize: '24px',
        align: 'center'
      }).setOrigin(0.5)
      
      this.uiContainer?.add([button, icon])
      
      // Store category button
      const catBtn: CategoryButton = {
        bg: button,
        icon: icon,
        category: cat.category
      }
      this.categoryButtons.push(catBtn)
      
      // Category button interactions
      button.on('pointerdown', () => {
        this.showBuildingPanel(cat.category)
        this.updateCategoryButtons(cat.category)
      })
      
      button.on('pointerover', () => {
        button.setScale(1.1)
        icon.setScale(1.1)
      })
      
      button.on('pointerout', () => {
        if (this.currentCategory !== cat.category) {
          button.setScale(1)
          icon.setScale(1)
        }
      })
    })
    
    // Make UI always on top
    this.uiContainer.setDepth(10000)
    
  }
  
  private showBuildingPanel(category: string) {
    this.currentCategory = category
    
    if (category === 'delete') {
      // Delete mode
      this.selectedBuilding = null
      return
    }
    
    if (category === 'world') {
      // World options - for future implementation
      return
    }
    
    // Create dialog container
    const width = this.scale.width
    const height = this.scale.height
    
    // Set dialog open flag
    this.dialogOpen = true
    
    // Create fullscreen overlay
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7)
    overlay.setInteractive() // Block clicks underneath
    overlay.setDepth(20000)
    
    // Create dialog container
    const dialogContainer = this.add.container(width/2, height/2)
    dialogContainer.setDepth(20001)
    
    // Dialog background
    const dialogWidth = 700
    const dialogHeight = 500
    const dialogBg = this.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x2c3e50, 1)
    dialogBg.setStrokeStyle(3, 0xffffff, 0.8)
    dialogContainer.add(dialogBg)
    
    // Title bar
    const titleBar = this.add.rectangle(0, -dialogHeight/2 + 30, dialogWidth, 60, 0x34495e, 1)
    dialogContainer.add(titleBar)
    
    // Title text
    let titleString = '🏠 Select Apartment'
    if (category === 'roads') titleString = '🛤️ Select Road'
    if (category === 'signature') titleString = '🏛️ Select Signature Building'
    
    const titleText = this.add.text(0, -dialogHeight/2 + 30, titleString, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    dialogContainer.add(titleText)
    
    // Close button
    const closeBtn = this.add.rectangle(dialogWidth/2 - 30, -dialogHeight/2 + 30, 40, 40, 0xe74c3c, 1)
    closeBtn.setInteractive({ useHandCursor: true })
    closeBtn.setStrokeStyle(2, 0xffffff, 0.5)
    dialogContainer.add(closeBtn)
    
    const closeText = this.add.text(dialogWidth/2 - 30, -dialogHeight/2 + 30, '✕', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5)
    dialogContainer.add(closeText)
    
    // Content area
    const contentY = -dialogHeight/2 + 100
    const gridCols = 4
    const gridRows = 3
    const itemSize = 120
    const spacing = 20
    
    if (category === 'apartments') {
      // All apartment combinations
      const colors = ['Blue', 'Green', 'Red', 'Yellow', 'Pink', 'Grey']
      const sizes = [
        { size: '1x1', level: 'Level1', label: 'Small' },
        { size: '2x2', level: 'Level1', label: 'Large' }
      ]
      
      let itemIndex = 0
      colors.forEach(color => {
        sizes.forEach(sizeInfo => {
          const row = Math.floor(itemIndex / gridCols)
          const col = itemIndex % gridCols
          
          if (row < gridRows) {
            const x = (col - gridCols/2 + 0.5) * (itemSize + spacing)
            const y = contentY + row * (itemSize + spacing) + 50
            
            // Item background
            const itemBg = this.add.rectangle(x, y, itemSize, itemSize, 0x465669, 1)
            itemBg.setStrokeStyle(2, 0x667788, 0.5)
            itemBg.setInteractive({ useHandCursor: true })
            dialogContainer.add(itemBg)
            
            // Building image
            const key = `apartment_${color}_${sizeInfo.size}_${sizeInfo.level}`
            const img = this.add.image(x, y - 10, key)
            
            // Scale based on building size to fit in box
            let scale = 0.12 // Default for 1x1
            if (sizeInfo.size === '2x2') {
              scale = 0.06 // Smaller for large buildings
            }
            img.setScale(scale)
            dialogContainer.add(img)
            
            // Label
            const label = this.add.text(x, y + 45, `${color} ${sizeInfo.label}`, {
              fontSize: '12px',
              color: '#ffffff',
              align: 'center'
            }).setOrigin(0.5)
            dialogContainer.add(label)
            
            // Interactions
            itemBg.on('pointerover', () => {
              itemBg.setFillStyle(0x556983)
              img.setScale(scale * 1.1) // Scale up by 10% on hover
            })
            
            itemBg.on('pointerout', () => {
              itemBg.setFillStyle(0x465669)
              img.setScale(scale) // Return to original scale
            })
            
            itemBg.on('pointerdown', () => {
              this.selectBuilding(key)
              this.dialogOpen = false
              overlay.destroy()
              dialogContainer.destroy(true)
            })
          }
          itemIndex++
        })
      })
    } else if (category === 'signature') {
      const signatures = [
        { key: 'signature_hospital', name: '🏥 Hospital', description: 'Medical Center' },
        { key: 'signature_university', name: '🎓 University', description: 'Education' },
        // { key: 'signature_cinema', name: '🎬 Cinema', description: 'Entertainment' }
      ]
      
      signatures.forEach((building, index) => {
        const row = Math.floor(index / gridCols)
        const col = index % gridCols
        
        const x = (col - gridCols/2 + 0.5) * (itemSize + spacing)
        const y = contentY + row * (itemSize + spacing) + 50
        
        // Item background
        const itemBg = this.add.rectangle(x, y, itemSize, itemSize, 0x465669, 1)
        itemBg.setStrokeStyle(2, 0x667788, 0.5)
        itemBg.setInteractive({ useHandCursor: true })
        dialogContainer.add(itemBg)
        
        // Building image
        const img = this.add.image(x, y - 10, building.key)
        img.setScale(0.06) // Small scale for 2x2 buildings
        dialogContainer.add(img)
        
        // Label with emoji
        const label = this.add.text(x, y + 35, building.name, {
          fontSize: '11px',
          color: '#ffffff',
          align: 'center'
        }).setOrigin(0.5)
        dialogContainer.add(label)
        
        // Description
        const desc = this.add.text(x, y + 48, building.description, {
          fontSize: '9px',
          color: '#aaaaaa',
          align: 'center'
        }).setOrigin(0.5)
        dialogContainer.add(desc)
        
        // Interactions
        itemBg.on('pointerover', () => {
          itemBg.setFillStyle(0x556983)
          img.setScale(0.065) // Slightly larger on hover
        })
        
        itemBg.on('pointerout', () => {
          itemBg.setFillStyle(0x465669)
          img.setScale(0.06) // Back to original
        })
        
        itemBg.on('pointerdown', () => {
          this.selectBuilding(building.key)
          this.dialogOpen = false
          overlay.destroy()
          dialogContainer.destroy(true)
        })
      })
    } else if (category === 'roads') {
      const roads = [
        { key: 'road_1', name: 'Straight →' },
        { key: 'road_2', name: 'Straight ↓' },
        { key: 'road_3', name: 'Turn ↘' },
        { key: 'road_4', name: 'Turn ↙' },
        { key: 'road_5', name: 'Turn ↗' },
        { key: 'road_6', name: 'Turn ↖' },
        { key: 'road_7', name: 'T-Junction ⊥' },
        { key: 'road_8', name: 'Cross ✚' },
        { key: 'road_9', name: 'End Cap' }
      ]
      
      roads.forEach((road, index) => {
        const row = Math.floor(index / gridCols)
        const col = index % gridCols
        
        const x = (col - gridCols/2 + 0.5) * (itemSize + spacing)
        const y = contentY + row * (itemSize + spacing) + 50
        
        // Item background
        const itemBg = this.add.rectangle(x, y, itemSize, itemSize, 0x465669, 1)
        itemBg.setStrokeStyle(2, 0x667788, 0.5)
        itemBg.setInteractive({ useHandCursor: true })
        dialogContainer.add(itemBg)
        
        // Road image
        const img = this.add.image(x, y - 10, road.key)
        img.setScale(0.18) // Smaller scale to fit in box
        dialogContainer.add(img)
        
        // Label
        const label = this.add.text(x, y + 45, road.name, {
          fontSize: '12px',
          color: '#ffffff',
          align: 'center'
        }).setOrigin(0.5)
        dialogContainer.add(label)
        
        // Interactions
        itemBg.on('pointerover', () => {
          itemBg.setFillStyle(0x556983)
          img.setScale(0.2) // Slightly larger on hover
        })
        
        itemBg.on('pointerout', () => {
          itemBg.setFillStyle(0x465669)
          img.setScale(0.18) // Back to original
        })
        
        itemBg.on('pointerdown', () => {
          this.selectBuilding(road.key)
          this.dialogOpen = false
          overlay.destroy()
          dialogContainer.destroy(true)
        })
      })
    }
    
    // Close button functionality
    closeBtn.on('pointerover', () => {
      closeBtn.setFillStyle(0xc0392b)
      closeBtn.setScale(1.1)
      closeText.setScale(1.1)
    })
    
    closeBtn.on('pointerout', () => {
      closeBtn.setFillStyle(0xe74c3c)
      closeBtn.setScale(1)
      closeText.setScale(1)
    })
    
    closeBtn.on('pointerdown', () => {
      this.dialogOpen = false
      overlay.destroy()
      dialogContainer.destroy(true)
    })
  }
  
  private updateCategoryButtons(activeCategory: string) {
    this.categoryButtons.forEach(btn => {
      if (btn.category === activeCategory) {
        btn.bg.setScale(1.1)
        btn.bg.setStrokeStyle(3, 0xffd700, 1)
        btn.icon.setScale(1.1)
      } else {
        btn.bg.setScale(1)
        btn.bg.setStrokeStyle(2, 0xffffff, 0.5)
        btn.icon.setScale(1)
      }
    })
  }

  private initializeGrid() {
    for (let y = 0; y < this.gridSize; y++) {
      this.tiles[y] = []
      for (let x = 0; x < this.gridSize; x++) {
        this.tiles[y][x] = {
          x: x,
          y: y,
          occupied: false,
          tile: null as any,
          groundType: 'grass'
        }
      }
    }
  }

  private createIsometricGrid() {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const isoX = (col - row) * (this.tileWidth / 2) + col * 2
        const isoY = (col + row) * (this.tileHeight / 2) - row * 2

        const tile = this.add.image(isoX, isoY, 'ground_tile')
        tile.setOrigin(0.5, 0.5)
        
        const tileScale = this.tileWidth / tile.width
        tile.setScale(tileScale)
        
        // Depth calculation for isometric view
        // Objects further down and to the right should appear on top
        // Use row as primary sort, column as secondary
        const depth = row * 1000 + col * 8
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
      
      // Don't handle input if a dialog is open
      if (this.dialogOpen) return
      
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
      // Don't handle input if a dialog is open
      if (this.dialogOpen) return
      
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
        
        if (tile) {
          // Delete mode highlighting
          if (this.currentCategory === 'delete') {
            if (tile.occupied && tile.building) {
              // Show red highlight for deletable buildings
              this.highlightGraphics.lineStyle(3, 0xff0000, 1)
              const tileSprite = tile.tile
              const worldX = this.gridContainer.x + tileSprite.x * this.gridContainer.scale
              const worldY = this.gridContainer.y + tileSprite.y * this.gridContainer.scale
              this.drawTileHighlight(worldX, worldY - 10 * this.gridContainer.scale, this.gridContainer.scale)
            }
          } else if (this.selectedBuilding) {
            const isGroundTile = this.selectedBuilding.includes('road_') || this.selectedBuilding.includes('grass_road_')
          
            if (isGroundTile) {
              // Ground tiles always show green highlight (they replace grass)
              this.highlightGraphics.lineStyle(3, 0x00ff00, 1)
              const tileSprite = tile.tile
              const worldX = this.gridContainer.x + tileSprite.x * this.gridContainer.scale
              const worldY = this.gridContainer.y + tileSprite.y * this.gridContainer.scale
              this.drawTileHighlight(worldX, worldY - 10 * this.gridContainer.scale, this.gridContainer.scale)
            } else {
              // Buildings need to check for space
              const buildingSize = this.getBuildingSize(this.selectedBuilding)
              const canPlace = this.canPlaceBuilding(tile.x, tile.y, buildingSize)
              
              // Set color based on whether we can place
              this.highlightGraphics.lineStyle(3, canPlace ? 0x00ff00 : 0xff0000, 1)
              
              // Draw highlight for all tiles the building will occupy
              for (let dy = 0; dy < buildingSize.height; dy++) {
                for (let dx = 0; dx < buildingSize.width; dx++) {
                  const highlightY = tile.y + dy
                  const highlightX = tile.x + dx
                  
                  if (highlightX < this.gridSize && highlightY < this.gridSize) {
                    const highlightTile = this.tiles[highlightY][highlightX].tile
                    const worldX = this.gridContainer.x + highlightTile.x * this.gridContainer.scale
                    const worldY = this.gridContainer.y + highlightTile.y * this.gridContainer.scale
                    
                    this.drawTileHighlight(worldX, worldY - 10 * this.gridContainer.scale, this.gridContainer.scale)
                  }
                }
              }
            }
          }
        }
      }
    })
    
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // Don't handle input if a dialog is open
      if (this.dialogOpen) return
      
      // Place building if it was a click (not a drag)
      if (!hasDraggedEnough && this.gridContainer) {
        // Convert pointer position to local container space, accounting for scale
        const localX = (pointer.x - this.gridContainer.x) / this.gridContainer.scale
        const localY = (pointer.y - this.gridContainer.y) / this.gridContainer.scale
        
        const tile = this.getTileAtPosition(localX, localY)
        
        if (tile) {
          // Check if we're in delete mode
          if (this.currentCategory === 'delete' && tile.occupied && tile.building) {
            this.deleteBuilding(tile)
          } else if (this.selectedBuilding && !tile.occupied) {
            this.placeBuilding(tile)
          }
        }
      }
      
      this.isDragging = false
      hasDraggedEnough = false
      pointerDownTime = 0
    })
    
    // Mouse wheel zoom
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number) => {
      // Don't handle input if a dialog is open
      if (this.dialogOpen) return
      
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
    // Buildings are now in the container, so they scale and move automatically
    // No need to manually update their positions or scales
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
    
    const gridX = tileData.x
    const gridY = tileData.y
    
    // Check if this is a ground tile (road or sidewalk)
    const isGroundTile = this.selectedBuilding.includes('road_') || 
                         this.selectedBuilding.includes('grass_road_') ||
                         this.selectedBuilding.includes('sidewalk_')
    
    if (isGroundTile) {
      // Ground tiles replace the grass tile
      this.placeGroundTile(tileData)
      return
    }
    
    // Regular building placement
    const buildingSize = this.getBuildingSize(this.selectedBuilding)
    
    // Check if we can place the building
    if (!this.canPlaceBuilding(gridX, gridY, buildingSize)) {
      console.log('Cannot place building here - not enough space')
      return
    }
    
    // Calculate the center position based on all tiles the building will occupy
    let totalX = 0
    let totalY = 0
    let tileCount = 0
    
    // Sum up all tile positions
    for (let dy = 0; dy < buildingSize.height; dy++) {
      for (let dx = 0; dx < buildingSize.width; dx++) {
        const tileY = gridY + dy
        const tileX = gridX + dx
        const tile = this.tiles[tileY][tileX].tile
        totalX += tile.x
        totalY += tile.y
        tileCount++
      }
    }
    
    // Get average position (center of all occupied tiles)
    const localX = totalX / tileCount
    let localY = totalY / tileCount
    
    if (buildingSize.height === 1) {
      localY -= 32
    } else {
      localY -= 8
    }

    // Calculate world position
    const worldX = this.gridContainer.x + localX * this.gridContainer.scale
    const worldY = this.gridContainer.y + localY * this.gridContainer.scale
    
    const building = this.add.image(worldX, worldY, this.selectedBuilding)
    building.setOrigin(0.5, 0.65)
    
    // Add building to the container so it moves with the grid
    this.gridContainer.add(building)
    
    // Store local position for reference
    building.setData('localX', localX)
    building.setData('localY', localY)
    
    // Scale building to match tile size
    const baseTile = this.tiles[gridY][gridX].tile
    const tileScale = baseTile.scaleX
    building.setScale(tileScale)
    
    // Calculate depth for isometric view
    // For multi-tile buildings, use the furthest point (bottom-right) for depth
    // This ensures proper sorting with other objects
    const depthY = gridY + buildingSize.height - 1  // Bottom row of building
    const depthX = gridX + buildingSize.width - 1   // Right column of building
    const depth = depthY * 1000 + depthX * 10 + 5  // +5 to be above ground tile
    building.setDepth(depth)
    
    // Mark all covered tiles as occupied
    for (let dy = 0; dy < buildingSize.height; dy++) {
      for (let dx = 0; dx < buildingSize.width; dx++) {
        const occupyY = gridY + dy
        const occupyX = gridX + dx
        this.tiles[occupyY][occupyX].occupied = true
        // Store building reference in primary tile only
        if (dx === 0 && dy === 0) {
          this.tiles[occupyY][occupyX].building = building
        }
      }
    }
    
    this.buildings.push(building)
  }
  
  private placeGroundTile(tileData: TileData) {
    if (!this.selectedBuilding || !this.gridContainer) return
    
    const gridX = tileData.x
    const gridY = tileData.y
    
    // Check if there's a building on this tile - if so, can't place road
    if (tileData.occupied) {
      console.log('Cannot place ground tile - tile has a building')
      return
    }
    
    // Check if already has the same ground type
    if (tileData.groundType === this.selectedBuilding) {
      console.log('Already has this ground type')
      return
    }
    
    // Simply change the texture of the existing tile
    const tile = tileData.tile
    tile.setTexture(this.selectedBuilding)
    
    // Keep the same depth as before (no need to change depth when changing texture)
    // Depth is already set correctly based on grid position
    
    // Update tile data to track ground type
    this.tiles[gridY][gridX].groundType = this.selectedBuilding
    
    // Roads don't occupy the tile for buildings
  }

  private getBuildingSize(buildingKey: string): BuildingSize {
    // Default size for roads and other tiles
    let size: BuildingSize = { width: 1, height: 1 }
    
    // Parse building sizes from key
    if (buildingKey.includes('apartment')) {
      if (buildingKey.includes('2x2')) {
        size = { width: 2, height: 2 }
      }
      // 1x1 is already default
    } else if (buildingKey.includes('signature_')) {
      // All signature buildings are 2x2
      size = { width: 2, height: 2 }
    }
    
    return size
  }
  
  private canPlaceBuilding(gridX: number, gridY: number, size: BuildingSize): boolean {
    // Check if all required tiles are available
    for (let dy = 0; dy < size.height; dy++) {
      for (let dx = 0; dx < size.width; dx++) {
        const checkY = gridY + dy
        const checkX = gridX + dx
        
        // Check bounds
        if (checkX < 0 || checkX >= this.gridSize || 
            checkY < 0 || checkY >= this.gridSize) {
          return false
        }
        
        // Check if tile is occupied
        if (this.tiles[checkY][checkX].occupied) {
          return false
        }
      }
    }
    
    return true
  }
  
  private selectBuilding(buildingKey: string) {
    this.selectedBuilding = buildingKey
  }

  public setSelectedBuilding(buildingKey: string) {
    this.selectedBuilding = buildingKey
  }
  
  private initializeStartingBuildings() {
    // Place University in the center of the grid (3,3 for 8x8 grid, as it's 2x2)
    const centerRow = 3
    const centerCol = 3
    
    // Place the University building
    this.selectedBuilding = 'signature_university'
    const centerTile = this.tiles[centerRow][centerCol]
    this.placeBuilding(centerTile)
    
    // Add bouncing animation to the University building
    const universityBuilding = this.buildings[this.buildings.length - 1]
    if (universityBuilding) {
      const baseY = universityBuilding.y
      
      // Create a bouncing tween animation
      this.tweens.add({
        targets: universityBuilding,
        y: baseY - 8, // Bounce up by 8 pixels
        duration: 1000, // 1 second up
        ease: 'Sine.easeInOut',
        yoyo: true, // Return to original position
        repeat: -1 // Infinite repeat
      })
    }
    
    // Place roads around the University (forming a square)
    // University occupies (3,3), (3,4), (4,3), (4,4)
    // Roads should be at positions surrounding this 2x2 area
    
    // Road tile mapping based on Phaser road types:
    // road_1: Straight horizontal (→)
    // road_2: Straight vertical (↓)
    // road_3: Turn bottom-right (↘)
    // road_4: Turn bottom-left (↙)
    // road_5: Turn top-right (↗)
    // road_6: Turn top-left (↖)
    // road_7: T-junction
    // road_8: Cross/4-way
    // road_9: End cap
    
    
    // Clear selection after initialization
    this.selectedBuilding = null
  }
  
  private deleteBuilding(tileData: TileData) {
    if (!tileData.building) return
    
    const building = tileData.building
    const buildingKey = building.texture.key
    const buildingSize = this.getBuildingSize(buildingKey)
    
    // Find the origin tile of the building (top-left corner)
    let originX = tileData.x
    let originY = tileData.y
    
    // Search for the actual origin tile (where the building reference is stored)
    searchLoop: for (let dy = 0; dy < buildingSize.height; dy++) {
      for (let dx = 0; dx < buildingSize.width; dx++) {
        const checkY = tileData.y - dy
        const checkX = tileData.x - dx
        
        if (checkY >= 0 && checkX >= 0 && 
            checkY < this.gridSize && checkX < this.gridSize) {
          const checkTile = this.tiles[checkY][checkX]
          if (checkTile.building === building) {
            originX = checkX
            originY = checkY
            break searchLoop
          }
        }
      }
    }
    
    // Free all tiles occupied by the building
    for (let dy = 0; dy < buildingSize.height; dy++) {
      for (let dx = 0; dx < buildingSize.width; dx++) {
        const freeY = originY + dy
        const freeX = originX + dx
        
        if (freeX < this.gridSize && freeY < this.gridSize) {
          this.tiles[freeY][freeX].occupied = false
          this.tiles[freeY][freeX].building = undefined
        }
      }
    }
    
    // Remove building from buildings array
    const index = this.buildings.indexOf(building)
    if (index > -1) {
      this.buildings.splice(index, 1)
    }
    
    // Destroy the building sprite
    building.destroy()
  }
}
import Phaser from 'phaser'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(MotionPathPlugin)

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
  container: Phaser.GameObjects.Container
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
  private buildingPreview: Phaser.GameObjects.Image | null = null

  // NPC on roads (GSAP-driven)
  private roadNpcSprite: Phaser.GameObjects.Image | null = null
  private roadNpcSpeech: Phaser.GameObjects.Text | null = null
  private roadNpcTween: gsap.core.Tween | null = null
  private roadSpeechTimer: Phaser.Time.TimerEvent | null = null
  private readonly roadSpeechLines: string[] = [
    'Looking for career workshops!',
    'Can\'t wait for the next seminar!',
    'Where\'s the university center?',
    'Need to update my resume...',
    'Heading to my internship!',
    'Anyone joining the workshop?',
    'Career fair today!',
    'On my way to class!'
  ]

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
    
    // Load simple NPC sprites (static)
    for (let i = 1; i <= 5; i++) {
      this.load.image(`npc_${i}`, `NPC/${i}.gif`)
    }
    
    // Load signature buildings (all 2x2) from public folder
    this.load.image('signature_hospital', 'GiantCityBuilder/Public/Doctor_Hospital.png')
    this.load.image('signature_university', 'GiantCityBuilder/Public/Education_University.png')
    // this.load.image('signature_cinema', 'GiantCityBuilder/Public/Leasure_Cinema.png')
  }

  create() {
    this.cameras.main.setBackgroundColor('#5DADE2')
    
    // Create container; we'll center it after tiles are created based on bounds
    this.gridContainer = this.add.container(0, 0)
    this.highlightGraphics = this.add.graphics()
    
    this.initializeGrid()
    this.createIsometricGrid()
    this.centerContainerOnGrid()
    this.setupInteraction()
    this.createUI()
    
    // Initialize with University in center and roads around it
    // This must happen AFTER container is positioned
    this.initializeStartingBuildings()
    
    // Handle window resize
    this.scale.on('resize', this.resize, this)
    this.resize()
  }
  
  private centerContainerOnGrid() {
    if (!this.gridContainer) return
    const children = this.gridContainer.list as Phaser.GameObjects.GameObject[]
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    children.forEach(obj => {
      const dm = (obj as unknown as { data?: Phaser.Data.DataManager }).data
      if (dm && dm.has('gridX') && dm.has('gridY')) {
        const pos = obj as unknown as { x: number; y: number }
        if (pos.x < minX) minX = pos.x
        if (pos.y < minY) minY = pos.y
        if (pos.x > maxX) maxX = pos.x
        if (pos.y > maxY) maxY = pos.y
      }
    })
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return
    const gridCenterX = (minX + maxX) / 2
    const gridCenterY = (minY + maxY) / 2
    const screenCenterX = this.cameras.main.width / 2
    const screenCenterY = this.cameras.main.height / 2
    this.gridContainer.setPosition(screenCenterX - gridCenterX, screenCenterY - gridCenterY)
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
      this.centerContainerOnGrid()
    }
  }

  private createUI() {
    const width = this.scale.width
    const height = this.scale.height
    
    // Create UI container for building menu (positioned higher for better visibility)
    this.uiContainer = this.add.container(width / 2, height - 80)
    
    // Create modern gradient background with rounded corners effect
    const bgBar = this.add.graphics()
    bgBar.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x34495e, 0x34495e, 1, 1, 0.95, 0.95)
    bgBar.fillRoundedRect(-320, -50, 640, 100, 25)
    
    // Add subtle glow effect
    const glowBar = this.add.graphics()
    glowBar.fillStyle(0x3498db, 0.1)
    glowBar.fillRoundedRect(-325, -55, 650, 110, 30)
    this.uiContainer.add([glowBar, bgBar])
    
    // Create category buttons with cute, gamified styling
    const categories = [
      { category: 'apartments', icon: '🏠', color: 0xff6b9d, name: 'Homes', desc: 'Cozy living spaces' },
      { category: 'signature', icon: '🏛️', color: 0xa855f7, name: 'Specials', desc: 'Unique buildings' },
      { category: 'roads', icon: '🛤️', color: 0x06d6a0, name: 'Paths', desc: 'Connect your city' },
      { category: 'delete', icon: '🗑️', color: 0xf43f5e, name: 'Remove', desc: 'Clean up space' }
    ]
    
    categories.forEach((cat, index) => {
      const x = (index - 1.5) * 100  // Better spacing for 5 categories
      
      // Create button container for layered effects
      const buttonContainer = this.add.container(x, 0)
      
      // Shadow/depth effect
      const shadow = this.add.graphics()
      shadow.fillStyle(0x000000, 0.2)
      shadow.fillRoundedRect(-30, -27, 60, 54, 18)
      buttonContainer.add(shadow)
      
      // Main button with gradient
      const button = this.add.graphics()
      button.fillGradientStyle(cat.color, cat.color, this.lightenColor(cat.color, 20), this.lightenColor(cat.color, 20), 1, 1, 0.9, 0.9)
      button.fillRoundedRect(-28, -30, 56, 60, 16)
      
      // Highlight border
      button.lineStyle(2, 0xffffff, 0.3)
      button.strokeRoundedRect(-28, -30, 56, 60, 16)
      buttonContainer.add(button)
      
      // Category icon with cute styling
      const icon = this.add.text(x, -8, cat.icon, {
        fontSize: '28px',
        align: 'center'
      }).setOrigin(0.5)
      
      // Category name text
      const nameText = this.add.text(x, 12, cat.name, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0.5)
      
      // Add floating animation to icons
      this.tweens.add({
        targets: icon,
        y: icon.y - 2,
        duration: 1500 + Math.random() * 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: index * 200
      })
      
      this.uiContainer?.add([buttonContainer, icon, nameText])
      
      // Make the entire button container interactive with proper hit area
      buttonContainer.setSize(56, 60)
      buttonContainer.setInteractive(new Phaser.Geom.Rectangle(-28, -30, 56, 60), Phaser.Geom.Rectangle.Contains)
      buttonContainer.input!.cursor = 'pointer'

       // Ensure icon and label are also clickable
       icon.setInteractive({ useHandCursor: true })
       nameText.setInteractive({ useHandCursor: true })
       const handleCategoryClick = () => {
         this.tweens.add({
           targets: [buttonContainer, icon, nameText],
           scaleX: 0.9,
           scaleY: 0.9,
           duration: 100,
           ease: 'Back.easeOut',
           yoyo: true,
           onComplete: () => {
             this.showBuildingPanel(cat.category)
             this.updateCategoryButtons(cat.category)
           }
         })
         this.createSparkleEffect(x, 0)
       }
       icon.on('pointerdown', handleCategoryClick)
       nameText.on('pointerdown', handleCategoryClick)
      
      // Store category button (using buttonContainer instead of separate hitArea)
      const catBtn: CategoryButton = {
        container: buttonContainer,
        icon: icon,
        category: cat.category
      }
      this.categoryButtons.push(catBtn)
      
      // Enhanced button interactions with cute animations
      buttonContainer.on('pointerdown', () => {
        // Bounce effect on click
        this.tweens.add({
          targets: [buttonContainer, icon, nameText],
          scaleX: 0.9,
          scaleY: 0.9,
          duration: 100,
          ease: 'Back.easeOut',
          yoyo: true,
          onComplete: () => {
            this.showBuildingPanel(cat.category)
            this.updateCategoryButtons(cat.category)
          }
        })
        
        // Sparkle effect
        this.createSparkleEffect(x, 0)
      })
      
      buttonContainer.on('pointerover', () => {
        
        // Glow effect
        button.clear()
        button.fillGradientStyle(
          this.lightenColor(cat.color, 15), this.lightenColor(cat.color, 15),
          this.lightenColor(cat.color, 35), this.lightenColor(cat.color, 35),
          1, 1, 0.95, 0.95
        )
        button.fillRoundedRect(-28, -30, 56, 60, 16)
        button.lineStyle(3, 0xffffff, 0.6)
        button.strokeRoundedRect(-28, -30, 56, 60, 16)
      })
      
      buttonContainer.on('pointerout', () => {
        if (this.currentCategory !== cat.category) {
          // Return to normal size
          this.tweens.add({
            targets: [buttonContainer, icon, nameText],
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut'
          })
          
          // Return to normal colors
          button.clear()
          button.fillGradientStyle(cat.color, cat.color, this.lightenColor(cat.color, 20), this.lightenColor(cat.color, 20), 1, 1, 0.9, 0.9)
          button.fillRoundedRect(-28, -30, 56, 60, 16)
          button.lineStyle(2, 0xffffff, 0.3)
          button.strokeRoundedRect(-28, -30, 56, 60, 16)
        }
      })
    })
    
    // Decorative elements removed
    
    // Make UI always on top
    this.uiContainer.setDepth(10000)
  }
  
  private lightenColor(color: number, amount: number): number {
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff
    
    const newR = Math.min(255, r + amount)
    const newG = Math.min(255, g + amount)
    const newB = Math.min(255, b + amount)
    
    return (newR << 16) | (newG << 8) | newB
  }
  
  private createSparkleEffect(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const sparkle = this.add.text(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 40,
        '✨',
        { fontSize: '12px' }
      ).setOrigin(0.5)
      
      this.uiContainer?.add(sparkle)
      
      this.tweens.add({
        targets: sparkle,
        alpha: 0,
        scale: 1.5,
        y: sparkle.y - 30,
        duration: 800,
        ease: 'Power2.easeOut',
        onComplete: () => sparkle.destroy()
      })
    }
  }
  
  
  
  private getColorForBuilding(color: string): number {
    const colorMap: { [key: string]: number } = {
      'Blue': 0x3498db,
      'Green': 0x2ecc71,
      'Red': 0xe74c3c,
      'Yellow': 0xf1c40f,
      'Pink': 0xe91e63,
      'Grey': 0x95a5a6
    }
    return colorMap[color] || 0x7f8c8d
  }
  
  private showBuildingPanel(category: string) {
    this.currentCategory = category
    
    if (category === 'delete') {
      // Delete mode
      this.selectedBuilding = null
      this.clearBuildingPreview()
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
    
    // Create fullscreen overlay with subtle blur effect
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8)
    overlay.setInteractive() // Block clicks underneath
    overlay.setDepth(20000)
    
    // Create dialog container
    const dialogContainer = this.add.container(width/2, height/2)
    dialogContainer.setDepth(20001)
    
    // Dialog background with modern gradient and rounded corners
    const dialogWidth = 720
    const dialogHeight = 520
    const dialogBg = this.add.graphics()
    dialogBg.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x34495e, 0x34495e, 1, 1, 0.95, 0.95)
    dialogBg.fillRoundedRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 20)
    
    // Add glow effect around dialog
    const dialogGlow = this.add.graphics()
    dialogGlow.fillStyle(0x3498db, 0.1)
    dialogGlow.fillRoundedRect(-dialogWidth/2 - 5, -dialogHeight/2 - 5, dialogWidth + 10, dialogHeight + 10, 25)
    dialogContainer.add([dialogGlow, dialogBg])
    
    // Modern title bar with gradient
    const titleBar = this.add.graphics()
    titleBar.fillGradientStyle(0x3498db, 0x3498db, 0x2980b9, 0x2980b9, 1, 1, 0.9, 0.9)
    titleBar.fillRoundedRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, 70, { tl: 20, tr: 20, bl: 0, br: 0 })
    dialogContainer.add(titleBar)
    
    // Title text with better styling
    let titleString = '🏠 Cozy Homes Collection'
    if (category === 'roads') titleString = '🛤️ Pathways & Routes'
    if (category === 'signature') titleString = '🏛️ Special Buildings'
    
    const titleText = this.add.text(0, -dialogHeight/2 + 35, titleString, {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)
    
    dialogContainer.add([titleText])
    
    // Close button (text only)
    const closeBtnX = dialogWidth/2 - 30
    const closeBtnY = -dialogHeight/2 + 35
    
    const closeText = this.add.text(closeBtnX, closeBtnY, '✕', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    closeText.setInteractive({ useHandCursor: true })
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
        // { size: '2x2', level: 'Level1', label: 'Large' }
      ]
      
      let itemIndex = 0
      colors.forEach(color => {
        sizes.forEach(sizeInfo => {
          const row = Math.floor(itemIndex / gridCols)
          const col = itemIndex % gridCols
          
          if (row < gridRows) {
            const x = (col - gridCols/2 + 0.5) * (itemSize + spacing)
            const y = contentY + row * (itemSize + spacing) + 50
            
            // Modern item container with layered design
            const itemContainer = this.add.container(x, y)
            
            // Shadow for depth
            const shadow = this.add.graphics()
            shadow.fillStyle(0x000000, 0.2)
            shadow.fillRoundedRect(-itemSize/2 + 2, -itemSize/2 + 2, itemSize, itemSize, 15)
            itemContainer.add(shadow)
            
            // Main item background with gradient
            const itemBg = this.add.graphics()
            const bgColor = this.getColorForBuilding(color)
            itemBg.fillGradientStyle(bgColor, bgColor, this.lightenColor(bgColor, 20), this.lightenColor(bgColor, 20), 1, 1, 0.8, 0.8)
            itemBg.fillRoundedRect(-itemSize/2, -itemSize/2, itemSize, itemSize, 12)
            itemBg.lineStyle(2, 0xffffff, 0.3)
            itemBg.strokeRoundedRect(-itemSize/2, -itemSize/2, itemSize, itemSize, 12)
            itemContainer.add(itemBg)
            
            // Building image
            const key = `apartment_${color}_${sizeInfo.size}_${sizeInfo.level}`
            const img = this.add.image(0, -15, key)
            
            // Scale based on building size to fit in box
            let scale = 0.12 // Default for 1x1
            if (sizeInfo.size === '2x2') {
              scale = 0.06 // Smaller for large buildings
            }
            img.setScale(scale)
            itemContainer.add(img)
            
            // Modern label with background
            const labelBg = this.add.graphics()
            labelBg.fillStyle(0x000000, 0.6)
            labelBg.fillRoundedRect(-45, 30, 90, 20, 10)
            itemContainer.add(labelBg)
            
            const label = this.add.text(0, 40, `${color} ${sizeInfo.label}`, {
              fontSize: '11px',
              color: '#ffffff',
              align: 'center',
              fontFamily: 'Arial, sans-serif',
              fontStyle: 'bold'
            }).setOrigin(0.5)
            itemContainer.add(label)
            
            // Add cute emoji indicator
            
            dialogContainer.add(itemContainer)
            
            // Interactive area
            const hitArea = this.add.rectangle(x, y, itemSize, itemSize, 0x000000, 0)
            hitArea.setInteractive({ useHandCursor: true })
            dialogContainer.add(hitArea)
            
            // Enhanced interactions with cute animations
            hitArea.on('pointerover', () => {
              this.tweens.add({
                targets: itemContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
                ease: 'Back.easeOut'
              })
              
              // Glow effect
              itemBg.clear()
              itemBg.fillGradientStyle(
                this.lightenColor(bgColor, 25), this.lightenColor(bgColor, 25),
                this.lightenColor(bgColor, 45), this.lightenColor(bgColor, 45),
                1, 1, 0.9, 0.9
              )
              itemBg.fillRoundedRect(-itemSize/2, -itemSize/2, itemSize, itemSize, 12)
              itemBg.lineStyle(3, 0xffffff, 0.6)
              itemBg.strokeRoundedRect(-itemSize/2, -itemSize/2, itemSize, itemSize, 12)
            })
            
            hitArea.on('pointerout', () => {
              this.tweens.add({
                targets: itemContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Back.easeOut'
              })
              
              // Return to normal
              itemBg.clear()
              itemBg.fillGradientStyle(bgColor, bgColor, this.lightenColor(bgColor, 20), this.lightenColor(bgColor, 20), 1, 1, 0.8, 0.8)
              itemBg.fillRoundedRect(-itemSize/2, -itemSize/2, itemSize, itemSize, 12)
              itemBg.lineStyle(2, 0xffffff, 0.3)
              itemBg.strokeRoundedRect(-itemSize/2, -itemSize/2, itemSize, itemSize, 12)
            })
            
            hitArea.on('pointerdown', () => {
              // Bounce effect
              this.tweens.add({
                targets: itemContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                ease: 'Back.easeOut',
                yoyo: true,
                onComplete: () => {
                  this.selectBuilding(key)
                  this.dialogOpen = false
                  overlay.destroy()
                  dialogContainer.destroy(true)
                }
              })
              
              // Sparkle effect
              this.createSparkleEffect(x, y)
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
    closeText.on('pointerover', () => {
      this.tweens.add({
        targets: closeText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 150,
        ease: 'Back.easeOut'
      })
      closeText.setColor('#ff6b6b')
    })
    
    closeText.on('pointerout', () => {
      this.tweens.add({
        targets: closeText,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut'
      })
      closeText.setColor('#ffffff')
    })
    
    closeText.on('pointerdown', () => {
      // Bounce effect
      this.tweens.add({
        targets: closeText,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 100,
        ease: 'Back.easeOut',
        yoyo: true,
        onComplete: () => {
          this.dialogOpen = false
          overlay.destroy()
          dialogContainer.destroy(true)
        }
      })
    })
  }
  
  private updateCategoryButtons(activeCategory: string) {
    this.categoryButtons.forEach(btn => {
      if (btn.category === activeCategory) {
        // Add golden glow for active button
        this.tweens.add({
          targets: [btn.container, btn.icon],
          scale: 1.15,
          duration: 200,
          ease: 'Back.easeOut'
        })
        
        // Add pulsing effect for active state
        this.tweens.add({
          targets: btn.icon,
          alpha: 0.8,
          duration: 1000,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        })
      } else {
        // Return to normal state
        this.tweens.killTweensOf([btn.container, btn.icon])
        btn.container.setScale(1)
        btn.icon.setScale(1)
        btn.icon.setAlpha(1)
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
          tile: null as unknown as Phaser.GameObjects.Image,
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
        
        // Stable depth calculation based on grid coordinates
        // Ensures consistent ordering independent of interaction/click order
        const depth = (row + col) * 1000 + col
        tile.setDepth(depth)
        tile.setData('gridDepth', depth)
        
        tile.setInteractive()
        tile.setData('gridX', col)
        tile.setData('gridY', row)
        
        this.tiles[row][col].tile = tile
        this.gridContainer?.add(tile)
      }
    }
    // Ensure children in the container are ordered by their depth
    this.resortGridChildrenByDepth()
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
      
      // Update building preview position
      if (this.buildingPreview && this.selectedBuilding && !this.isDragging) {
        this.buildingPreview.setPosition(pointer.x, pointer.y)
        this.buildingPreview.setVisible(true)
      }

      // Handle tile highlighting: only show when placing a building
      if (!this.isDragging && this.gridContainer && this.highlightGraphics) {
        // Convert pointer position to local container space, accounting for scale
        const localX = (pointer.x - this.gridContainer.x) / this.gridContainer.scale
        const localY = (pointer.y - this.gridContainer.y) / this.gridContainer.scale
        
        const tile = this.getTileAtPosition(localX, localY)
        
        this.highlightGraphics.clear()
        
        if (tile && this.selectedBuilding) {
          const isGroundTile = this.selectedBuilding.includes('road_') || this.selectedBuilding.includes('grass_road_')
          
          if (isGroundTile) {
            // Ground tiles: green highlight on the hovered tile
            this.highlightGraphics.lineStyle(3, 0x00ff00, 1)
            const tileSprite = tile.tile
            const worldX = this.gridContainer.x + tileSprite.x * this.gridContainer.scale
            const worldY = this.gridContainer.y + tileSprite.y * this.gridContainer.scale
            this.drawTileHighlight(worldX, worldY - 10 * this.gridContainer.scale, this.gridContainer.scale)
          } else {
            // Buildings: highlight area based on size and placement validity
            const buildingSize = this.getBuildingSize(this.selectedBuilding)
            const canPlace = this.canPlaceBuilding(tile.x, tile.y, buildingSize)
            this.highlightGraphics.lineStyle(3, canPlace ? 0x00ff00 : 0xff0000, 1)
            
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
        
        return
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
          // Check if clicking on a building (including multi-tile buildings)
          let clickedBuilding = tile.building
          
          // If tile is occupied but no building reference, check nearby tiles for 2x2 buildings
          if (tile.occupied && !clickedBuilding) {
            // Check all possible positions where this could be part of a 2x2 building
            for (let dy = 0; dy <= 1; dy++) {
              for (let dx = 0; dx <= 1; dx++) {
                const checkY = tile.y - dy
                const checkX = tile.x - dx
                if (checkY >= 0 && checkX >= 0 && 
                    checkY < this.gridSize && checkX < this.gridSize) {
                  const checkTile = this.tiles[checkY][checkX]
                  if (checkTile.building) {
                    // Verify this building actually covers the clicked tile
                    const buildingSize = this.getBuildingSize(checkTile.building.texture.key)
                    if (checkX + buildingSize.width > tile.x && 
                        checkY + buildingSize.height > tile.y) {
                      clickedBuilding = checkTile.building
                      break
                    }
                  }
                }
              }
              if (clickedBuilding) break
            }
          }
          
          // Check if clicking on University building
          if (clickedBuilding && clickedBuilding.texture.key === 'signature_university') {
            this.showWorkshopPopup()
          } 
          // Check if we're in delete mode
          else if (this.currentCategory === 'delete' && clickedBuilding) {
            // Find the origin tile for proper deletion
            for (let row = 0; row < this.gridSize; row++) {
              for (let col = 0; col < this.gridSize; col++) {
                if (this.tiles[row][col].building === clickedBuilding) {
                  this.deleteBuilding(this.tiles[row][col])
                  break
                }
              }
            }
          } else if (this.selectedBuilding && !tile.occupied) {
            this.placeBuilding(tile)
          }
        }
      }
      
      this.isDragging = false
      hasDraggedEnough = false
      pointerDownTime = 0
      // Restore correct draw order in case any interaction changed child order
      this.resortGridChildrenByDepth()
    })
    
    // Mouse wheel zoom
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
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

    // Ensure any game object interactions don't leave incorrect draw order
    this.input.on('gameobjectdown', () => {
      this.resortGridChildrenByDepth()
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

    // Create building at local coordinates (relative to container)
    const building = this.add.image(localX, localY, this.selectedBuilding)
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
    // For proper isometric sorting, we need to use the screen Y position
    // Buildings that appear lower on screen (higher Y in screen coordinates) should have higher depth
    // We use the isometric formula to calculate the screen position, then use that for depth
    
    // Calculate the screen position of the building's base (bottom tile)
    const baseY = gridY + buildingSize.height - 1  // Bottom row of building  
    const baseX = gridX + buildingSize.width - 1   // Right column of building
    
    // Stable depth based on grid coordinates (independent of click order)
    // Offset by +100 so buildings render above ground tiles at same grid location
    const depth = (baseX + baseY) * 1000 + baseX + 100
    building.setDepth(depth)
    building.setData('gridDepth', depth)
    // Reorder container children to respect updated depths
    this.resortGridChildrenByDepth()
    
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
    
    // Cancel placement after a single successful placement
    this.selectedBuilding = null
    this.clearBuildingPreview()
    if (this.highlightGraphics) this.highlightGraphics.clear()
  }

  private resortGridChildrenByDepth() {
    if (!this.gridContainer) return
    const children = this.gridContainer.list as Phaser.GameObjects.GameObject[]
    const getGridDepth = (obj: Phaser.GameObjects.GameObject): number => {
      const dm = (obj as unknown as { data?: Phaser.Data.DataManager }).data
      const val = dm?.get('gridDepth')
      return typeof val === 'number' ? val : 0
    }
    const sorted = [...children].sort((a, b) => getGridDepth(a) - getGridDepth(b))
    sorted.forEach((child, index) => {
      this.gridContainer!.moveTo(child, index)
    })
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
    // Update road NPC path whenever roads change
    this.updateRoadNpcPath()
    
    // Cancel placement after a single successful placement
    this.selectedBuilding = null
    this.clearBuildingPreview()
    if (this.highlightGraphics) this.highlightGraphics.clear()
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
    this.createBuildingPreview(buildingKey)
  }

  public setSelectedBuilding(buildingKey: string) {
    this.selectedBuilding = buildingKey
    this.createBuildingPreview(buildingKey)
  }

  private createBuildingPreview(buildingKey: string) {
    // Remove existing preview
    if (this.buildingPreview) {
      this.buildingPreview.destroy()
      this.buildingPreview = null
    }

    // Create new preview
    this.buildingPreview = this.add.image(0, 0, buildingKey)
    this.buildingPreview.setAlpha(0.5)
    this.buildingPreview.setDepth(50000) // Above everything else
    
    // Scale the preview appropriately
    const buildingSize = this.getBuildingSize(buildingKey)
    if (buildingSize.width === 2) {
      this.buildingPreview.setScale(0.06) // 2x2 buildings
    } else {
      this.buildingPreview.setScale(0.12) // 1x1 buildings
    }
    
    // Initially hide it until cursor moves
    this.buildingPreview.setVisible(false)
  }

  private clearBuildingPreview() {
    if (this.buildingPreview) {
      this.buildingPreview.destroy()
      this.buildingPreview = null
    }
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
    this.clearBuildingPreview()
  }

  // --- Road + NPC helpers ---
  private isRoadGround(groundType: string | undefined): boolean {
    if (!groundType) return false
    return groundType.includes('road_') || groundType.includes('grass_road_')
  }

  private updateRoadNpcPath() {
    if (!this.gridContainer) return
    // Collect all road tiles
    const roadPositions: { x: number; y: number }[] = []
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.isRoadGround(this.tiles[y][x].groundType)) {
          roadPositions.push({ x, y })
        }
      }
    }
    if (roadPositions.length === 0) {
      this.teardownRoadNpc()
      return
    }

    // Build adjacency and find largest connected component
    const key = (x: number, y: number) => `${x},${y}`
    const roadSet = new Set(roadPositions.map(p => key(p.x, p.y)))
    const visited = new Set<string>()
    let largestComponent: { x: number; y: number }[] = []

    const neighbors = (x: number, y: number) => {
      const out: { x: number; y: number }[] = []
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
      ]
      for (const d of dirs) {
        const nx = x + d.dx
        const ny = y + d.dy
        if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
          if (roadSet.has(key(nx, ny))) out.push({ x: nx, y: ny })
        }
      }
      return out
    }

    for (const p of roadPositions) {
      const k = key(p.x, p.y)
      if (visited.has(k)) continue
      const comp: { x: number; y: number }[] = []
      const q: { x: number; y: number }[] = [p]
      visited.add(k)
      while (q.length) {
        const cur = q.shift()!
        comp.push(cur)
        for (const nb of neighbors(cur.x, cur.y)) {
          const nk = key(nb.x, nb.y)
          if (!visited.has(nk)) {
            visited.add(nk)
            q.push(nb)
          }
        }
      }
      if (comp.length > largestComponent.length) largestComponent = comp
    }

    if (largestComponent.length < 2) {
      // Not enough path to walk meaningfully
      this.teardownRoadNpc()
      return
    }

    // Build a simple path across the component: pick random start, BFS to farthest node
    const start = largestComponent[Math.floor(Math.random() * largestComponent.length)]
    const pred = new Map<string, string>()
    const dist = new Map<string, number>()
    const q: { x: number; y: number }[] = [start]
    dist.set(key(start.x, start.y), 0)
    let far = start
    while (q.length) {
      const cur = q.shift()!
      const curK = key(cur.x, cur.y)
      const curD = dist.get(curK) ?? 0
      for (const nb of neighbors(cur.x, cur.y)) {
        const nk = key(nb.x, nb.y)
        if (!dist.has(nk)) {
          dist.set(nk, curD + 1)
          pred.set(nk, curK)
          q.push(nb)
          if ((dist.get(nk) ?? 0) > (dist.get(key(far.x, far.y)) ?? 0)) far = nb
        }
      }
    }

    // Reconstruct path from far back to start
    const path: { x: number; y: number }[] = []
    let curK = key(far.x, far.y)
    while (true) {
      const [cx, cy] = curK.split(',').map(Number)
      path.push({ x: cx, y: cy })
      const pk = pred.get(curK)
      if (!pk) break
      curK = pk
    }
    path.reverse()

    if (path.length < 2) {
      this.teardownRoadNpc()
      return
    }

    // Convert path tiles to container-local pixel points
    const points = path.map(p => {
      const t = this.tiles[p.y][p.x].tile
      // Slight upward offset so NPC sits visually on the road
      return { x: t.x, y: t.y - 10 }
    })

    this.ensureRoadNpc(points[0])
    this.animateNpcAlong(points)
  }

  private ensureRoadNpc(startPoint: { x: number; y: number }) {
    if (!this.gridContainer) return
    if (!this.roadNpcSprite) {
      const npcIndex = 1 + Math.floor(Math.random() * 5)
      this.roadNpcSprite = this.add.image(startPoint.x, startPoint.y, `npc_${npcIndex}`)
      this.roadNpcSprite.setOrigin(0.5, 0.85)
      this.gridContainer.add(this.roadNpcSprite)
      // Match tile scale
      const baseTile = this.tiles[0][0].tile
      this.roadNpcSprite.setScale(baseTile.scaleX)
      // Keep on top of grid elements
      this.roadNpcSprite.setDepth(999999)
      this.roadNpcSprite.setData('gridDepth', 999999)
    }
    if (!this.roadNpcSpeech) {
      this.roadNpcSpeech = this.add.text(startPoint.x, startPoint.y - 40, '', {
        fontSize: '12px',
        color: '#ffffff'
      }).setOrigin(0.5, 1)
      this.gridContainer.add(this.roadNpcSpeech)
      this.roadNpcSpeech.setDepth(1000000)
      this.roadNpcSpeech.setData('gridDepth', 1000000)
    }
    if (!this.roadSpeechTimer) {
      this.roadSpeechTimer = this.time.addEvent({
        delay: Math.random() * 5000 + 1000,
        loop: true,
        callback: () => {
          if (!this.roadNpcSpeech) return
          const line = this.roadSpeechLines[Math.floor(Math.random() * this.roadSpeechLines.length)]
          this.roadNpcSpeech.setText(line)
        }
      })
    }
    // Position text initially
    if (this.roadNpcSpeech && this.roadNpcSprite) {
      this.roadNpcSpeech.x = this.roadNpcSprite.x
      this.roadNpcSpeech.y = this.roadNpcSprite.y - 40
    }
  }

  private animateNpcAlong(points: { x: number; y: number }[]) {
    if (!this.roadNpcSprite) return
    if (this.roadNpcTween) {
      this.roadNpcTween.kill()
      this.roadNpcTween = null
    }
    // Move NPC to start
    this.roadNpcSprite.x = points[0].x
    this.roadNpcSprite.y = points[0].y
    
    const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
    let total = 0
    for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i])
    const speed = 40 // pixels per second (relative to container local space)
    const duration = Math.max(0.5, total / speed)

    this.roadNpcTween = gsap.to(this.roadNpcSprite, {
      duration,
      ease: 'none',
      repeat: -1,
      yoyo: true,
      motionPath: {
        path: points,
        curviness: 0,
        autoRotate: false
      },
      onUpdate: () => {
        if (this.roadNpcSpeech && this.roadNpcSprite) {
          this.roadNpcSpeech.x = this.roadNpcSprite.x
          this.roadNpcSpeech.y = this.roadNpcSprite.y - 40
        }
      }
    })
  }

  private teardownRoadNpc() {
    if (this.roadNpcTween) {
      this.roadNpcTween.kill()
      this.roadNpcTween = null
    }
    if (this.roadSpeechTimer) {
      this.roadSpeechTimer.remove(false)
      this.roadSpeechTimer = null
    }
    if (this.roadNpcSpeech) {
      this.roadNpcSpeech.destroy()
      this.roadNpcSpeech = null
    }
    if (this.roadNpcSprite) {
      this.roadNpcSprite.destroy()
      this.roadNpcSprite = null
    }
  }
  
  private showWorkshopPopup() {
    const width = this.scale.width
    const height = this.scale.height
    
    // Set dialog open flag
    this.dialogOpen = true
    
    // Create fullscreen overlay (modern, subtle) - increased opacity
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x0b0f14, 0.8)
    overlay.setInteractive() // Block clicks underneath
    overlay.setDepth(20000)
    
    // Create dialog container
    const dialogContainer = this.add.container(width/2, height/2)
    dialogContainer.setDepth(20001)
    
    // Dialog background (glass-like panel)
    const dialogWidth = 1100
    const dialogHeight = 700
    const dialogBg = this.add.graphics()
    dialogBg.fillStyle(0xffffff, 0.2)
    dialogBg.fillRoundedRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 16)
    dialogBg.lineStyle(2, 0xffffff, 0.25)
    dialogBg.strokeRoundedRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 16)
    dialogContainer.add(dialogBg)
    
    // Title text (modern)
    const titleText = this.add.text(0, -dialogHeight/2 + 32, 'Career Development Pathways', {
      fontSize: '28px',
      color: '#e5e7eb',
      fontStyle: 'bold',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)
    dialogContainer.add(titleText)
    
    // Close button (minimal)
    const closeText = this.add.text(dialogWidth/2 - 24, -dialogHeight/2 + 24, '✕', {
      fontSize: '20px',
      color: '#e5e7eb'
    }).setOrigin(0.5)
    closeText.setInteractive({ useHandCursor: true })
    dialogContainer.add(closeText)
    
    // Create viewport mask for scrollable area
    const viewportWidth = dialogWidth - 60
    const viewportHeight = dialogHeight - 120
    const viewportY = 10
    
    // Create mask for viewport
    const maskShape = this.make.graphics({})
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(
      width/2 - viewportWidth/2,
      height/2 - viewportHeight/2 + viewportY,
      viewportWidth,
      viewportHeight
    )
    
    // Content area for workshops (draggable)
    const contentContainer = this.add.container(0, viewportY)
    contentContainer.setMask(maskShape.createGeometryMask())
    dialogContainer.add(contentContainer)
    
    // Inner container for dragging
    const workshopContainer = this.add.container(0, 0)
    contentContainer.add(workshopContainer)
    
    // Workshop data - unified path with 3 starting points
    const workshops = [
      // Three starting points - Stream A, B, C
      { id: 'A1', stream: 'A', title: 'Communication Skills', desc: 'Verbal & written mastery', level: 'Beginner', x: -450, y: -200, connections: ['COMMON'] },
      { id: 'B1', stream: 'B', title: 'Emotional Intelligence', desc: 'Self & social awareness', level: 'Beginner', x: -450, y: 0, connections: ['COMMON'] },
      { id: 'C1', stream: 'C', title: 'Critical Thinking', desc: 'Analytical skills', level: 'Beginner', x: -450, y: 200, connections: ['COMMON'] },
      
      // Common second workshop that all streams pass through
      { id: 'COMMON', title: 'Leadership Foundations', desc: 'Core leadership principles', level: 'Intermediate', x: -200, y: 0, connections: ['A2', 'B2', 'C2'] },
      
      // Three different third workshops (streams diverge again)
      { id: 'A2', stream: 'A', title: 'Public Speaking', desc: 'Presentation confidence', level: 'Intermediate', x: 50, y: -200, connections: ['F1', 'F2'] },
      { id: 'B2', stream: 'B', title: 'Team Building', desc: 'Creating high-performing teams', level: 'Intermediate', x: 50, y: 0, connections: ['F2', 'F3'] },
      { id: 'C2', stream: 'C', title: 'Strategic Planning', desc: 'Long-term vision', level: 'Intermediate', x: 50, y: 200, connections: ['F3', 'F4'] },
      
      // Advanced workshops (multiple paths converge)
      { id: 'F1', title: 'Executive Communication', desc: 'C-suite messaging', level: 'Advanced', x: 300, y: -250, connections: ['E'] },
      { id: 'F2', title: 'Change Management', desc: 'Leading transformation', level: 'Advanced', x: 300, y: -100, connections: ['E'] },
      { id: 'F3', title: 'Innovation Leadership', desc: 'Driving creativity', level: 'Advanced', x: 300, y: 100, connections: ['E'] },
      { id: 'F4', title: 'Business Strategy', desc: 'Market positioning', level: 'Advanced', x: 300, y: 250, connections: ['E'] },
      
      // Ultimate goal - all paths lead here
      { id: 'E', title: 'Executive Leadership', desc: 'Complete leadership mastery', level: 'Master', x: 550, y: 0, connections: [] }
    ]
    
    // Draw connection lines first (so they appear behind cards)
    const lines = this.add.graphics()
    lines.lineStyle(2, 0x94a3b8, 0.35)
    
    // Create a map for quick workshop lookup by ID
    const workshopMap = new Map()
    workshops.forEach(w => workshopMap.set(w.id, w))
    
    // Draw connections
    workshops.forEach(workshop => {
      workshop.connections?.forEach(targetId => {
        const target = workshopMap.get(targetId)
        if (target) {
          lines.beginPath()
          lines.moveTo(workshop.x + 100, workshop.y)
          
          // Add simple angled connections
          if (workshop.y !== target.y) {
            const midX = (workshop.x + target.x) / 2
            // Create angled line path
            lines.lineTo(midX, workshop.y)
            lines.lineTo(midX, target.y)
            lines.lineTo(target.x - 100, target.y)
          } else {
            lines.lineTo(target.x - 100, target.y)
          }
          lines.strokePath()
        }
      })
    })
    
    workshopContainer.add(lines)
    
    // Stream colors (modern accent palette)
    const streamColors: { [key: string]: number } = {
      'A': 0x60a5fa,  // Blue
      'B': 0x34d399,  // Green  
      'C': 0xf87171   // Red
    }
    
    // Level indicator colors (modern)
    const levelColors: { [key: string]: number } = {
      'Beginner': 0x22c55e,
      'Intermediate': 0xf59e0b,
      'Advanced': 0xef4444,
      'Master': 0x8b5cf6
    }
    
    // Create workshop cards
    workshops.forEach(workshop => {
      const x = workshop.x
      const y = workshop.y
      
      // Workshop card (modern)
      const cardWidth = 200
      const cardHeight = 84
      const levelColor = levelColors[workshop.level]
      const cardBg = this.add.rectangle(x, y, cardWidth, cardHeight, 0x0f172a, 0.95)
      
      // Use border color to display LEVEL (instead of a rectangle)
      cardBg.setStrokeStyle(3, levelColor, 1)
      
      cardBg.setInteractive({ useHandCursor: true })
      workshopContainer.add(cardBg)
      
      // Stream indicator removed; use colored card border only
      
      // Workshop title (modern) with highlighted stream name
      let streamNameText: Phaser.GameObjects.Text | null = null
      const contentLeftX = x - cardWidth/2 + 15
      let titleX = contentLeftX
      if (workshop.stream) {
        const streamColor = streamColors[workshop.stream]
        const streamHex = '#' + streamColor.toString(16).padStart(6, '0')
        streamNameText = this.add.text(titleX, y - 10, workshop.stream, {
          fontSize: '14px',
          color: streamHex,
          fontStyle: 'bold',
          fontFamily: 'Arial, sans-serif'
        }).setOrigin(0, 0.5)
        workshopContainer.add(streamNameText)
        titleX = titleX + streamNameText.width + 6
      }
      const titleText = this.add.text(titleX, y - 10, workshop.title, {
        fontSize: '14px',
        color: '#e5e7eb',
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0, 0.5)
      workshopContainer.add(titleText)
      
      // Workshop description (modern)
      const descText = this.add.text(contentLeftX, y + 12, workshop.desc, {
        fontSize: '12px',
        color: '#94a3b8',
        wordWrap: { width: cardWidth - 40 },
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0, 0.5)
      workshopContainer.add(descText)
      
      // Hover effects (modern subtle) - keep colored border consistent
      cardBg.on('pointerover', () => {
        cardBg.setFillStyle(0x111827, 1)
        cardBg.setScale(1.04)
        titleText.setScale(1.02)
        descText.setScale(1.02)
        if (streamNameText) streamNameText.setScale(1.02)
        // restore border on hover (level color)
        cardBg.setStrokeStyle(3, levelColor, 1)
      })
      
      cardBg.on('pointerout', () => {
        cardBg.setFillStyle(0x0f172a, 0.95)
        cardBg.setScale(1)
        titleText.setScale(1)
        descText.setScale(1)
        if (streamNameText) streamNameText.setScale(1)
        // restore border when leaving (level color)
        cardBg.setStrokeStyle(3, levelColor, 1)
      })
    })
    
    // Implement drag-and-drop for the workshop container
    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0
    let containerStartX = 0
    let containerStartY = 0
    
    // Create invisible interaction area
    const interactionArea = this.add.rectangle(0, viewportY, viewportWidth, viewportHeight, 0x000000, 0.01)
    interactionArea.setInteractive()
    dialogContainer.add(interactionArea)
    
    interactionArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true
      dragStartX = pointer.x
      dragStartY = pointer.y
      containerStartX = workshopContainer.x
      containerStartY = workshopContainer.y
    })
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        const dx = pointer.x - dragStartX
        const dy = pointer.y - dragStartY
        
        // Update container position with boundaries
        workshopContainer.x = Phaser.Math.Clamp(containerStartX + dx, -800, 400)
        workshopContainer.y = Phaser.Math.Clamp(containerStartY + dy, -400, 400)
      }
    })
    
    this.input.on('pointerup', () => {
      isDragging = false
    })
    
    // Mouse wheel zoom for workshop view
    interactionArea.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      const currentScale = workshopContainer.scale
      const newScale = Phaser.Math.Clamp(currentScale - deltaY * 0.001, 0.5, 1.5)
      workshopContainer.setScale(newScale)
    })
    
    // Close button functionality (text only)
    closeText.on('pointerover', () => {
      closeText.setScale(1.15)
    })
    
    closeText.on('pointerout', () => {
      closeText.setScale(1)
    })
    
    closeText.on('pointerdown', () => {
      this.dialogOpen = false
      overlay.destroy()
      dialogContainer.destroy(true)
    })
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
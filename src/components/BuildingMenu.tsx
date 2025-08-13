import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Tabs from '@radix-ui/react-tabs'
import PhaserTextureDisplay from './PhaserTextureDisplay'

interface BuildingCategory {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

interface Building {
  key: string
  name: string
  category: string
  color?: string
  size?: string
  level?: string
  description?: string
  isUnlocked?: boolean
  isPlaced?: boolean
  requiredWorkshop?: string
  icon?: string
}

interface BuildingMenuProps {
  onBuildingSelect: (buildingKey: string) => void
  onCategoryChange: (category: string) => void
  onDeleteMode: () => void
  gameScene: any
}

const BuildingMenu: React.FC<BuildingMenuProps> = ({ 
  onBuildingSelect, 
  onCategoryChange, 
  onDeleteMode,
  gameScene 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showBuildingPanel, setShowBuildingPanel] = useState(false)
  const [buildings, setBuildings] = useState<Building[]>([])

  const categories: BuildingCategory[] = [
    { id: 'apartments', name: 'Homes', icon: '🏠', description: 'Cozy living spaces', color: 'from-pink-500 to-rose-500' },
    { id: 'signature', name: 'Specials', icon: '🏛️', description: 'Unique buildings', color: 'from-purple-500 to-indigo-500' },
    { id: 'roads', name: 'Paths', icon: '🛤️', description: 'Connect your city', color: 'from-teal-500 to-cyan-500' },
    { id: 'delete', name: 'Remove', icon: '🗑️', description: 'Clean up space', color: 'from-red-500 to-pink-500' }
  ]

  const apartmentBuildings = () => {
    const colors = ['Blue', 'Green', 'Red', 'Yellow', 'Pink', 'Grey']
    const sizes = [
      { size: '1x1', level: '1', label: 'Small' },
      { size: '1x1', level: '2', label: 'Medium' },
      { size: '1x1', level: '3', label: 'Tall' },
      { size: '2x2', level: '1', label: 'Large' }
    ]
    
    const buildings: Building[] = []
    colors.forEach(color => {
      sizes.forEach(sizeInfo => {
        buildings.push({
          key: `apartment_${color}_${sizeInfo.size}_${sizeInfo.level}`,
          name: `${color} ${sizeInfo.label}`,
          category: 'apartments',
          color: color,
          size: sizeInfo.size,
          level: sizeInfo.level,
          isUnlocked: true
        })
      })
    })
    return buildings
  }

  const signatureBuildings: Building[] = [
    { key: 'signature_townhall', name: 'Town Hall', icon: '🏛️', description: 'City Government', requiredWorkshop: 'COMMON', category: 'signature' },
    { key: 'signature_library', name: 'Library', icon: '📚', description: 'Knowledge Center', requiredWorkshop: 'A1', category: 'signature' },
    { key: 'signature_football_american', name: 'Football Stadium', icon: '🏈', description: 'American Football', requiredWorkshop: 'A2', category: 'signature' },
    { key: 'signature_football_soccer', name: 'Soccer Stadium', icon: '⚽', description: 'Soccer/Football', requiredWorkshop: 'B2', category: 'signature' },
    { key: 'signature_cricket', name: 'Cricket Stadium', icon: '🏏', description: 'Cricket Field', requiredWorkshop: 'C2', category: 'signature' },
    { key: 'signature_baseball', name: 'Baseball Stadium', icon: '⚾', description: 'Baseball Field', requiredWorkshop: 'F1', category: 'signature' },
    { key: 'signature_fire_station', name: 'Fire Station', icon: '🚒', description: 'Emergency Services', requiredWorkshop: 'F2', category: 'signature' },
    { key: 'signature_police_station', name: 'Police Station', icon: '🚔', description: 'Law Enforcement', requiredWorkshop: 'F3', category: 'signature' },
    { key: 'signature_hospital', name: 'Hospital', icon: '🏥', description: 'Medical Center', requiredWorkshop: 'F4', category: 'signature' },
    { key: 'signature_emergency_room', name: 'Emergency Room', icon: '🚑', description: 'Emergency Care', requiredWorkshop: 'E', category: 'signature' }
  ]

  const roadBuildings: Building[] = [
    { key: 'road_straight_horizontal', name: 'Horizontal Road', icon: '━', description: 'Straight horizontal', category: 'roads', isUnlocked: true },
    { key: 'road_straight_vertical', name: 'Vertical Road', icon: '┃', description: 'Straight vertical', category: 'roads', isUnlocked: true },
    { key: 'road_corner_NE', name: 'NE Corner', icon: '┗', description: 'North-East turn', category: 'roads', isUnlocked: true },
    { key: 'road_corner_NW', name: 'NW Corner', icon: '┛', description: 'North-West turn', category: 'roads', isUnlocked: true },
    { key: 'road_corner_SE', name: 'SE Corner', icon: '┏', description: 'South-East turn', category: 'roads', isUnlocked: true },
    { key: 'road_corner_SW', name: 'SW Corner', icon: '┓', description: 'South-West turn', category: 'roads', isUnlocked: true },
    { key: 'road_T_N', name: 'T-Junction N', icon: '┻', description: 'T-junction North', category: 'roads', isUnlocked: true },
    { key: 'road_T_S', name: 'T-Junction S', icon: '┳', description: 'T-junction South', category: 'roads', isUnlocked: true },
    { key: 'road_T_E', name: 'T-Junction E', icon: '┣', description: 'T-junction East', category: 'roads', isUnlocked: true },
    { key: 'road_T_W', name: 'T-Junction W', icon: '┫', description: 'T-junction West', category: 'roads', isUnlocked: true },
    { key: 'road_cross', name: 'Crossroad', icon: '╋', description: 'Four-way intersection', category: 'roads', isUnlocked: true }
  ]

  useEffect(() => {
    if (selectedCategory === 'apartments') {
      setBuildings(apartmentBuildings())
    } else if (selectedCategory === 'signature') {
      const updatedBuildings = signatureBuildings.map(building => ({
        ...building,
        isUnlocked: gameScene?.isBuildingUnlocked?.(building.key) || false,
        isPlaced: gameScene?.placedSignatureBuildings?.has(building.key) || false
      }))
      setBuildings(updatedBuildings)
    } else if (selectedCategory === 'roads') {
      setBuildings(roadBuildings)
    }
  }, [selectedCategory, gameScene])

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'delete') {
      onDeleteMode()
      setSelectedCategory('delete')
      setShowBuildingPanel(false)
    } else {
      setSelectedCategory(categoryId)
      setShowBuildingPanel(true)
      onCategoryChange(categoryId)
    }
  }

  const handleBuildingSelect = (building: Building) => {
    if (building.category === 'signature' && building.isPlaced) {
      return
    }
    if (building.category === 'signature' && !building.isUnlocked) {
      return
    }
    onBuildingSelect(building.key)
    setShowBuildingPanel(false)
  }

  const getColorForBuilding = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'Blue': 'from-blue-400 to-blue-600',
      'Green': 'from-green-400 to-green-600',
      'Red': 'from-red-400 to-red-600',
      'Yellow': 'from-yellow-400 to-yellow-600',
      'Pink': 'from-pink-400 to-pink-600',
      'Grey': 'from-gray-400 to-gray-600'
    }
    return colorMap[color] || 'from-gray-400 to-gray-600'
  }

  const getTextureScale = (building: Building): number => {
    if (building.size === '2x2') return 0.08
    if (building.category === 'signature') return 0.08
    if (building.category === 'roads') return 0.15
    return 0.12
  }

  return (
    <Tooltip.Provider delayDuration={200}>
      {/* Bottom Menu Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700/50 p-4">
            <div className="flex justify-center items-center gap-3">
              {categories.map((category) => (
                <Tooltip.Root key={category.id}>
                  <Tooltip.Trigger asChild>
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className={`
                        group relative bg-gradient-to-br ${category.color} 
                        rounded-xl p-3 transition-all duration-300 transform hover:scale-110 
                        hover:shadow-xl active:scale-95 ${selectedCategory === category.id ? 'ring-4 ring-white/50 scale-110' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl filter drop-shadow-md">{category.icon}</span>
                        <span className="text-xs font-bold text-white drop-shadow-md">{category.name}</span>
                      </div>
                      
                      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg shadow-xl"
                      sideOffset={5}
                    >
                      {category.description}
                      <Tooltip.Arrow className="fill-black/90" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Building Selection Dialog */}
      <Dialog.Root open={showBuildingPanel} onOpenChange={setShowBuildingPanel}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] max-w-4xl w-[90vw] max-h-[85vh] bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 relative">
              <Dialog.Close asChild>
                <button
                  className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </Dialog.Close>
              <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-2">
                {selectedCategory === 'apartments' && '🏠 Cozy Homes Collection'}
                {selectedCategory === 'roads' && '🛤️ Pathways & Routes'}
                {selectedCategory === 'signature' && '🏛️ Special Buildings'}
              </Dialog.Title>
              <Dialog.Description className="text-white/80 mt-1">
                Choose a building to place on the map
              </Dialog.Description>
            </div>
            
            {/* Content with Tabs for different views */}
            <Tabs.Root defaultValue="grid" className="flex flex-col h-full">
              <Tabs.List className="flex gap-2 p-4 pb-0">
                <Tabs.Trigger
                  value="grid"
                  className="px-4 py-2 bg-slate-700/50 rounded-lg text-white/70 hover:bg-slate-700 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                >
                  Grid View
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="list"
                  className="px-4 py-2 bg-slate-700/50 rounded-lg text-white/70 hover:bg-slate-700 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                >
                  List View
                </Tabs.Trigger>
              </Tabs.List>

              {/* Grid View */}
              <Tabs.Content value="grid" className="flex-1 p-4">
                <ScrollArea.Root className="w-full h-[50vh]">
                  <ScrollArea.Viewport className="w-full h-full">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-2">
                      {buildings.map((building) => {
                        const isDisabled = (building.category === 'signature' && (!building.isUnlocked || building.isPlaced))
                        
                        return (
                          <Tooltip.Root key={building.key}>
                            <Tooltip.Trigger asChild>
                              <button
                                onClick={() => !isDisabled && handleBuildingSelect(building)}
                                disabled={isDisabled}
                                className={`
                                  relative group bg-gradient-to-br 
                                  ${building.color ? getColorForBuilding(building.color) : 'from-slate-700 to-slate-800'}
                                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}
                                  rounded-xl p-3 transition-all duration-300 shadow-lg hover:shadow-xl
                                  ${building.isPlaced ? 'ring-2 ring-green-500' : ''}
                                  min-h-[140px] flex flex-col items-center justify-center
                                `}
                              >
                                {/* Status badges */}
                                {building.isPlaced && (
                                  <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    ✓
                                  </div>
                                )}
                                {building.category === 'signature' && !building.isUnlocked && (
                                  <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    🔒
                                  </div>
                                )}
                                
                                {/* Building texture preview */}
                                <div className="w-16 h-16 flex items-center justify-center mb-2">
                                  <PhaserTextureDisplay
                                    textureKey={building.key}
                                    gameScene={gameScene}
                                    width={64}
                                    height={64}
                                    scale={getTextureScale(building)}
                                    className="pixelated"
                                  />
                                </div>
                                
                                {/* Building name */}
                                <div className="text-white font-semibold text-xs text-center px-1">
                                  {building.name}
                                </div>

                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg shadow-xl max-w-xs"
                                sideOffset={5}
                              >
                                <div className="font-bold">{building.name}</div>
                                {building.description && (
                                  <div className="mt-1 text-white/80">{building.description}</div>
                                )}
                                {building.category === 'signature' && building.requiredWorkshop && building.requiredWorkshop !== 'COMMON' && (
                                  <div className="mt-1 text-yellow-400">
                                    Requires: Workshop {building.requiredWorkshop}
                                  </div>
                                )}
                                <Tooltip.Arrow className="fill-black/90" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        )
                      })}
                    </div>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar
                    className="flex select-none touch-none p-0.5 bg-slate-700/30 transition-colors duration-[160ms] ease-out hover:bg-slate-700/50 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                    orientation="vertical"
                  >
                    <ScrollArea.Thumb className="flex-1 bg-slate-500 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              </Tabs.Content>

              {/* List View */}
              <Tabs.Content value="list" className="flex-1 p-4">
                <ScrollArea.Root className="w-full h-[50vh]">
                  <ScrollArea.Viewport className="w-full h-full">
                    <div className="space-y-2 p-2">
                      {buildings.map((building) => {
                        const isDisabled = (building.category === 'signature' && (!building.isUnlocked || building.isPlaced))
                        
                        return (
                          <button
                            key={building.key}
                            onClick={() => !isDisabled && handleBuildingSelect(building)}
                            disabled={isDisabled}
                            className={`
                              w-full flex items-center gap-4 p-3 rounded-lg
                              bg-slate-800/50 hover:bg-slate-700/50 transition-all
                              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              ${building.isPlaced ? 'ring-2 ring-green-500' : ''}
                            `}
                          >
                            <div className="w-12 h-12 flex-shrink-0">
                              <PhaserTextureDisplay
                                textureKey={building.key}
                                gameScene={gameScene}
                                width={48}
                                height={48}
                                scale={getTextureScale(building)}
                                className="pixelated"
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="text-white font-semibold">{building.name}</div>
                              {building.description && (
                                <div className="text-white/60 text-sm">{building.description}</div>
                              )}
                            </div>
                            {building.isPlaced && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                Placed
                              </span>
                            )}
                            {building.category === 'signature' && !building.isUnlocked && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                Locked
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar
                    className="flex select-none touch-none p-0.5 bg-slate-700/30 transition-colors duration-[160ms] ease-out hover:bg-slate-700/50 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                    orientation="vertical"
                  >
                    <ScrollArea.Thumb className="flex-1 bg-slate-500 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              </Tabs.Content>
            </Tabs.Root>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Tooltip.Provider>
  )
}

export default BuildingMenu
import React, { useState, useEffect } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import PhaserTextureDisplay from './PhaserTextureDisplay'

interface BuildingCategory {
  id: string
  name: string
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
}

interface BuildingMenuProps {
  onBuildingSelect: (buildingKey: string) => void
  onCategoryChange: (category: string) => void
  onDeleteMode: () => void
  onPathwayMenuOpen: () => void
  gameScene: any
  refreshTrigger?: number
}

const BuildingMenu: React.FC<BuildingMenuProps> = ({ 
  onBuildingSelect, 
  onCategoryChange, 
  onDeleteMode,
  onPathwayMenuOpen,
  gameScene,
  refreshTrigger
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showBuildingPanel, setShowBuildingPanel] = useState(false)
  const [buildings, setBuildings] = useState<Building[]>([])

  const categories: BuildingCategory[] = [
    { id: 'apartments', name: 'Houses', description: 'Cozy homes for everyone!', color: 'from-pink-200 via-pink-100 to-rose-200' },
    { id: 'signature', name: 'Special', description: 'Amazing unique buildings!', color: 'from-purple-200 via-purple-100 to-indigo-200' },
    { id: 'pathways', name: 'Paths', description: 'Connect your island!', color: 'from-green-200 via-green-100 to-emerald-200' },
    { id: 'delete', name: 'Remove', description: 'Clean up your space!', color: 'from-red-200 via-red-100 to-rose-200' }
  ]

  const apartmentBuildings = () => {
    const colors = ['Blue', 'Green', 'Red', 'Yellow', 'Pink', 'Grey']
    const sizes = [
      { size: '1x1', level: 'Level1', label: 'Small' },
      { size: '1x1', level: 'Level2', label: 'Medium' },
      { size: '1x1', level: 'Level3', label: 'Tall' }
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
    { key: 'signature_townhall', name: 'Town Hall', description: 'The heart of your town!', requiredWorkshop: 'A1', category: 'signature' },
    { key: 'signature_library', name: 'Library', description: 'A place for learning!', requiredWorkshop: 'B1', category: 'signature' },
    { key: 'signature_football_american', name: 'Football Stadium', description: 'Go team!', requiredWorkshop: 'C1', category: 'signature' },
    { key: 'signature_football_soccer', name: 'Soccer Stadium', description: 'Goal!', requiredWorkshop: 'COMMON', category: 'signature' },
    { key: 'signature_cricket', name: 'Cricket Stadium', description: 'Howzat!', requiredWorkshop: 'A3', category: 'signature' },
    { key: 'signature_baseball', name: 'Baseball Stadium', description: 'Home run!', requiredWorkshop: 'B3', category: 'signature' },
    { key: 'signature_fire_station', name: 'Fire Station', description: 'Heroes in red!', requiredWorkshop: 'C3', category: 'signature' },
    { key: 'signature_police_station', name: 'Police Station', description: 'Keeping us safe!', requiredWorkshop: 'A3', category: 'signature' },
    { key: 'signature_hospital', name: 'Hospital', description: 'Healing hearts!', requiredWorkshop: 'B3', category: 'signature' },
    { key: 'signature_emergency_room', name: 'Emergency Room', description: 'Quick care!', requiredWorkshop: 'C3', category: 'signature' }
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
    }
  }, [selectedCategory, gameScene, refreshTrigger])

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'delete') {
      onDeleteMode()
      setSelectedCategory('delete')
      setShowBuildingPanel(false)
      console.log('Delete mode activated') // Debug log
    } else if (categoryId === 'pathways') {
      onPathwayMenuOpen()
      setSelectedCategory('')
      setShowBuildingPanel(false)
    } else {
      setSelectedCategory(categoryId)
      setShowBuildingPanel(true)
      onCategoryChange(categoryId)
    }
  }

  const handleBuildingSelect = (building: Building) => {
    if (building.category === 'signature' && building.isPlaced) {
      return // Prevent selecting already placed special buildings
    }
    if (building.category === 'signature' && !building.isUnlocked) {
      return
    }
    onBuildingSelect(building.key)
    setShowBuildingPanel(false)
  }


  const getTextureScale = (building: Building): number => {
    if (building.category === 'signature') return 0.06
    if (building.category === 'roads') return 0.08
    return 0.07
  }

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'apartments': return 'House Catalog'
      case 'signature': return 'Special Buildings'
      default: return 'Building Menu'
    }
  }

  return (
    <Tooltip.Provider delayDuration={400}>
      {/* Bottom Menu Bar - Animal Crossing Style */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-6 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          {/* AC-style bubble panel */}
          <div className="relative">
            {/* Soft cloud-like glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-100/60 to-sky-100/60 rounded-[2.5rem] blur-2xl"></div>
            
            {/* Main bubble panel */}
            <div className="relative bg-gradient-to-br from-sky-50/98 via-blue-50/98 to-indigo-50/98 backdrop-blur-lg rounded-[2.5rem] border-4 border-white/80 shadow-2xl shadow-blue-200/30">
              {/* Cute bubble dots at top */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                <div className="w-3 h-3 bg-sky-200 rounded-full shadow-sm"></div>
                <div className="w-4 h-4 bg-blue-200 rounded-full shadow-sm"></div>
                <div className="w-3 h-3 bg-indigo-200 rounded-full shadow-sm"></div>
              </div>
              
              <div className="p-8">
                <div className="flex justify-center items-center gap-6">
                  {categories.map((category, index) => (
                    <Tooltip.Root key={category.id}>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={() => handleCategoryClick(category.id)}
                          className={`
                            group relative overflow-hidden font-bold
                            ${selectedCategory === category.id 
                              ? `bg-gradient-to-br ${category.color} scale-110 shadow-xl shadow-blue-200/50 border-4 border-white` 
                              : 'bg-gradient-to-br from-white/90 via-sky-50/90 to-blue-50/90 hover:from-sky-100/90 hover:via-blue-100/90 hover:to-indigo-100/90 hover:scale-105 border-4 border-white/70'
                            }
                            rounded-[1.5rem] p-5 transition-all duration-700 ease-out transform hover:rotate-2
                            shadow-lg hover:shadow-xl
                            min-w-[90px] min-h-[90px]
                          `}
                          style={{
                            animationDelay: `${index * 200}ms`,
                            fontFamily: '"Comic Sans MS", "Marker Felt", cursive'
                          }}
                        >
                          {/* AC-style inner highlight */}
                          <div className="absolute top-2 left-2 right-2 h-3 bg-white/40 rounded-full"></div>
                          
                          <div className="flex flex-col items-center gap-2 relative z-10">
                            <span className="text-lg font-bold text-slate-700 drop-shadow-sm">
                              {category.name}
                            </span>
                          </div>
                          
                          {/* Soft selected glow */}
                          {selectedCategory === category.id && (
                            <div className="absolute inset-0 bg-white/30 rounded-[1.5rem] animate-pulse"></div>
                          )}
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-gradient-to-br from-white/95 to-sky-50/95 text-slate-700 text-base px-6 py-4 rounded-[1.5rem] shadow-xl border-4 border-white/80 backdrop-blur-sm"
                          sideOffset={20}
                          style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                        >
                          <div className="font-bold">{category.description}</div>
                          <Tooltip.Arrow className="fill-white/95" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Building Selection Panel - Bottom Aligned */}
      {showBuildingPanel && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-40 pointer-events-none">
          <div className="max-w-6xl mx-auto pointer-events-auto">
            {/* Cloud-like glow container */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-sky-100/70 via-blue-100/70 to-indigo-100/70 rounded-[2rem] blur-2xl"></div>
              
              {/* Main AC-style panel */}
              <div className="relative bg-gradient-to-br from-sky-50/98 via-blue-50/98 to-white/98 backdrop-blur-lg rounded-[2rem] border-4 border-white/90 shadow-2xl overflow-hidden max-h-[50vh]">
                {/* AC-style header */}
                <div className="relative bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 border-b-4 border-white/90">
                  <div className="relative p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200 rounded-[1rem] flex items-center justify-center shadow-lg border-3 border-white/80">
                        <div className="w-6 h-6 bg-white/60 rounded-full"></div>
                      </div>
                      <div>
                        <h2 
                          className="text-2xl font-bold text-slate-700 drop-shadow-sm"
                          style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                        >
                          {getCategoryTitle()}
                        </h2>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowBuildingPanel(false)}
                      className="text-slate-600 hover:text-slate-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border-3 border-white hover:border-sky-200 hover:bg-sky-50/80 hover:scale-110 transition-all duration-300 shadow-lg"
                      style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {/* AC-style grid content */}
                <div className="p-6">
                  <ScrollArea.Root className="w-full h-[35vh]">
                    <ScrollArea.Viewport className="w-full h-full">
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 auto-rows-fr">
                        {buildings.map((building, index) => {
                          const isDisabled = (building.category === 'signature' && (!building.isUnlocked || building.isPlaced))
                          
                          return (
                            <div key={building.key} className="flex flex-col items-center h-full">
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <button
                                    onClick={() => !isDisabled && handleBuildingSelect(building)}
                                    disabled={isDisabled}
                                    className={`
                                      relative group overflow-hidden
                                      ${isDisabled 
                                        ? 'opacity-50 cursor-not-allowed bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100' 
                                        : 'cursor-pointer hover:scale-110 active:scale-95 bg-gradient-to-br from-white/95 via-sky-50/95 to-blue-50/95 hover:from-blue-50/95 hover:via-indigo-50/95 hover:to-sky-50/95'
                                      }
                                      rounded-[1rem] transition-all duration-500 ease-out shadow-md hover:shadow-lg
                                      ${building.isPlaced ? 'ring-3 ring-green-200 shadow-green-100/60' : ''}
                                      w-full aspect-square flex flex-col items-center justify-center p-3
                                      border-3 border-white/80 hover:border-sky-200/80
                                      backdrop-blur-sm transform hover:rotate-2
                                    `}
                                    style={{
                                      animationDelay: `${index * 50}ms`,
                                      fontFamily: '"Comic Sans MS", "Marker Felt", cursive'
                                    }}
                                  >
                                    {/* AC-style top highlight */}
                                    <div className="absolute top-1 left-2 right-2 h-2 bg-white/50 rounded-full"></div>
                                    
                                    {/* Building preview with transparent background */}
                                    <div className="w-full flex-1 flex items-center justify-center mb-2">
                                      <PhaserTextureDisplay
                                        textureKey={building.key}
                                        gameScene={gameScene}
                                        width={60}
                                        height={60}
                                        scale={getTextureScale(building)}
                                        className="pixelated filter drop-shadow-sm"
                                      />
                                    </div>
                                    
                                    {/* Building name with AC-style text */}
                                    <div className="text-center w-full">
                                      <div className="text-slate-700 font-bold text-xs leading-tight truncate">
                                        {building.name}
                                      </div>
                                    </div>

                                    {/* Soft glow on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-sky-100/0 via-sky-100/20 to-sky-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1rem] pointer-events-none"></div>
                                  </button>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                <Tooltip.Content
                                  className="bg-gradient-to-br from-white/98 to-sky-50/98 text-slate-700 px-4 py-3 rounded-[1rem] shadow-xl max-w-xs border-3 border-white/90 backdrop-blur-sm"
                                  sideOffset={15}
                                  style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                                >
                                  <div className="font-bold text-slate-600 text-sm mb-1">
                                    {building.name}
                                  </div>
                                  {building.description && (
                                    <div className="text-slate-500 text-xs mb-2">{building.description}</div>
                                  )}
                                  {building.category === 'signature' && building.requiredWorkshop && (
                                    <div className="text-orange-600 text-xs border-t-2 border-sky-200 pt-2 font-bold">
                                      Requires: Workshop {building.requiredWorkshop}
                                    </div>
                                  )}
                                  <Tooltip.Arrow className="fill-white/98" />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                              </Tooltip.Root>
                              
                              {/* Status indicators outside the box for signature buildings */}
                              {building.category === 'signature' && building.isPlaced && (
                                <div className="mt-1 bg-green-300 text-green-800 text-xs px-2 py-1 rounded-full border-2 border-white shadow-md font-bold">
                                  Built
                                </div>
                              )}
                              {building.category === 'signature' && !building.isUnlocked && (
                                <div className="mt-1 bg-red-300 text-red-800 text-xs px-2 py-1 rounded-full border-2 border-white shadow-md font-bold">
                                  🔒 Locked
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea.Viewport>
                    
                    {/* AC-style custom scrollbar */}
                    <ScrollArea.Scrollbar
                      className="flex select-none touch-none p-1 bg-sky-100/80 transition-colors duration-300 hover:bg-sky-200/80 data-[orientation=vertical]:w-4 border-l-3 border-white/70 rounded-r-lg"
                      orientation="vertical"
                    >
                      <ScrollArea.Thumb className="flex-1 bg-gradient-to-b from-sky-300 via-blue-300 to-indigo-300 rounded-full border-2 border-white/80 shadow-sm" />
                    </ScrollArea.Scrollbar>
                  </ScrollArea.Root>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Tooltip.Provider>
  )
}

export default BuildingMenu
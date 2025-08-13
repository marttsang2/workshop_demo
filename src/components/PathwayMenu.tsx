import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Tabs from '@radix-ui/react-tabs'
import PhaserTextureDisplay from './PhaserTextureDisplay'

interface PathwayType {
  key: string
  name: string
  description: string
  category: 'roads' | 'grass_roads'
  isUnlocked?: boolean
}

interface PathwayMenuProps {
  onPathwaySelect: (pathwayKey: string) => void
  gameScene: any
  isOpen: boolean
  onClose: () => void
}

const PathwayMenu: React.FC<PathwayMenuProps> = ({ 
  onPathwaySelect, 
  gameScene,
  isOpen,
  onClose
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('roads')
  const [pathways, setPathways] = useState<PathwayType[]>([])

  // Road pathways based on IsometricScene.ts
  const roadPathways: PathwayType[] = [
    { key: 'road_1', name: 'Straight Road', description: 'Horizontal path', category: 'roads', isUnlocked: true },
    { key: 'road_2', name: 'Straight Road', description: 'Vertical path', category: 'roads', isUnlocked: true },
    { key: 'road_3', name: 'Turn Road', description: 'Bottom-right turn', category: 'roads', isUnlocked: true },
    { key: 'road_4', name: 'Turn Road', description: 'Bottom-left turn', category: 'roads', isUnlocked: true },
    { key: 'road_5', name: 'Turn Road', description: 'Top-right turn', category: 'roads', isUnlocked: true },
    { key: 'road_6', name: 'Turn Road', description: 'Top-left turn', category: 'roads', isUnlocked: true },
    { key: 'road_7', name: 'T-Junction', description: 'Three-way path', category: 'roads', isUnlocked: true },
    { key: 'road_8', name: 'Crossroad', description: 'Four-way intersection', category: 'roads', isUnlocked: true },
    { key: 'road_9', name: 'End Cap', description: 'Path endpoint', category: 'roads', isUnlocked: true }
  ]

  // Grass road pathways
  const grassRoadPathways: PathwayType[] = [
    { key: 'grass_road_1', name: 'Garden Path', description: 'Horizontal garden walk', category: 'grass_roads', isUnlocked: true },
    { key: 'grass_road_2', name: 'Garden Path', description: 'Vertical garden walk', category: 'grass_roads', isUnlocked: true },
    { key: 'grass_road_3', name: 'Garden Turn', description: 'Bottom-right garden turn', category: 'grass_roads', isUnlocked: true },
    { key: 'grass_road_4', name: 'Garden Turn', description: 'Bottom-left garden turn', category: 'grass_roads', isUnlocked: true },
    { key: 'grass_road_5', name: 'Garden Turn', description: 'Top-right garden turn', category: 'grass_roads', isUnlocked: true },
    { key: 'grass_road_6', name: 'Garden Turn', description: 'Top-left garden turn', category: 'grass_roads', isUnlocked: true },
    { key: 'grass_road_7', name: 'Garden Junction', description: 'Three-way garden path', category: 'grass_roads', isUnlocked: true },
    { key: 'grass_road_8', name: 'Garden Cross', description: 'Four-way garden crossing', category: 'grass_roads', isUnlocked: true },
    { key: 'grass_road_9', name: 'Garden End', description: 'Garden path endpoint', category: 'grass_roads', isUnlocked: true }
  ]


  useEffect(() => {
    if (selectedTab === 'roads') {
      setPathways(roadPathways)
    } else if (selectedTab === 'grass_roads') {
      setPathways(grassRoadPathways)
    }
  }, [selectedTab])

  const handlePathwaySelect = (pathway: PathwayType) => {
    onPathwaySelect(pathway.key)
    onClose()
  }


  const getTextureScale = (): number => {
    return 0.08
  }

  return (
    <Tooltip.Provider delayDuration={400}>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          {/* Soft dreamy backdrop */}
          <Dialog.Overlay className="fixed inset-0 bg-gradient-to-br from-sky-200/80 via-blue-200/80 to-indigo-200/80 backdrop-blur-md z-50 animate-in fade-in duration-700" />
          
          <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-40 pointer-events-none">
            <div className="max-w-6xl mx-auto pointer-events-auto">
              {/* Cloud-like glow container */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-sky-100/70 via-blue-100/70 to-indigo-100/70 rounded-[2rem] blur-2xl"></div>
                
                {/* Main AC-style panel */}
                <div className="relative bg-gradient-to-br from-sky-50/98 via-blue-50/98 to-white/98 backdrop-blur-lg rounded-[2rem] border-4 border-white/90 shadow-2xl overflow-hidden max-h-[50vh]">
                  {/* AC-style header */}
                  <div className="relative bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 border-b-4 border-white/90">
                    <div className="relative p-6">
                      <Dialog.Close asChild>
                        <button
                          className="absolute top-6 right-6 text-slate-600 hover:text-slate-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border-3 border-white hover:border-sky-200 hover:bg-sky-50/80 hover:scale-110 transition-all duration-300 shadow-lg"
                          aria-label="Close"
                          style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                        >
                          ×
                        </button>
                      </Dialog.Close>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200 rounded-[1rem] flex items-center justify-center shadow-lg border-3 border-white/80">
                            <div className="w-6 h-6 bg-white/60 rounded-full"></div>
                          </div>
                          <div>
                            <Dialog.Title 
                              className="text-2xl font-bold text-slate-700 drop-shadow-sm"
                              style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                            >
                              Path Designer
                            </Dialog.Title>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Path tabs */}
                  <div className="p-6">
                    <Tabs.Root value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                      {/* Tab navigation */}
                      <Tabs.List className="flex justify-center gap-2 mb-6 bg-gradient-to-r from-sky-100/60 to-blue-100/60 rounded-2xl p-2 border-2 border-white/50">
                        <Tabs.Trigger
                          value="roads"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-slate-700 transition-all duration-300 
                                     data-[state=active]:bg-gradient-to-br data-[state=active]:from-sky-300 data-[state=active]:to-blue-400 
                                     data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105
                                     hover:bg-sky-200/50 hover:scale-102"
                          style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                        >
                          <span className="text-sm">Stone Paths</span>
                        </Tabs.Trigger>
                        
                        <Tabs.Trigger
                          value="grass_roads"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-slate-700 transition-all duration-300
                                     data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-400 data-[state=active]:to-emerald-500 
                                     data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105
                                     hover:bg-sky-200/50 hover:scale-102"
                          style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                        >
                          <span className="text-sm">Garden Trails</span>
                        </Tabs.Trigger>
                      </Tabs.List>

                      {/* Tab content panels */}
                      <Tabs.Content value={selectedTab} className="outline-none">
                        {/* Pathway grid */}
                        <ScrollArea.Root className="w-full h-[35vh]">
                          <ScrollArea.Viewport className="w-full h-full">
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 auto-rows-fr">
                              {pathways.map((pathway, index) => (
                                <div key={pathway.key} className="flex flex-col items-center h-full">
                                  <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                      <button
                                        onClick={() => handlePathwaySelect(pathway)}
                                        className="relative group overflow-hidden cursor-pointer hover:scale-110 active:scale-95 
                                                   bg-gradient-to-br from-white/95 via-sky-50/95 to-blue-50/95 hover:from-blue-50/95 hover:via-indigo-50/95 hover:to-sky-50/95
                                                   rounded-[1rem] transition-all duration-500 ease-out shadow-md hover:shadow-lg
                                                   w-full aspect-square flex flex-col items-center justify-center p-3
                                                   border-3 border-white/80 hover:border-sky-200/80
                                                   backdrop-blur-sm transform hover:rotate-2"
                                        style={{
                                          animationDelay: `${index * 50}ms`,
                                          fontFamily: '"Comic Sans MS", "Marker Felt", cursive'
                                        }}
                                      >
                                        {/* AC-style top highlight */}
                                        <div className="absolute top-1 left-2 right-2 h-2 bg-white/50 rounded-full"></div>
                                        
                                        {/* Pathway preview with transparent background */}
                                        <div className="w-full flex-1 flex items-center justify-center mb-2">
                                          <PhaserTextureDisplay
                                            textureKey={pathway.key}
                                            gameScene={gameScene}
                                            width={60}
                                            height={60}
                                            scale={getTextureScale()}
                                            className="pixelated filter drop-shadow-sm"
                                          />
                                        </div>
                                        
                                        {/* Pathway name with AC-style text */}
                                        <div className="text-center w-full">
                                          <div className="text-slate-700 font-bold text-xs leading-tight truncate">
                                            {pathway.name}
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
                                          {pathway.name}
                                        </div>
                                        <div className="text-slate-500 text-xs mb-2">{pathway.description}</div>
                                        <div className="text-blue-600 text-xs border-t-2 border-sky-200 pt-2 font-bold">
                                          Perfect for creating pathways
                                        </div>
                                        <Tooltip.Arrow className="fill-white/98" />
                                      </Tooltip.Content>
                                    </Tooltip.Portal>
                                  </Tooltip.Root>
                                </div>
                              ))}
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
                      </Tabs.Content>
                    </Tabs.Root>
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Tooltip.Provider>
  )
}

export default PathwayMenu
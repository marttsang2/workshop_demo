import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as ScrollArea from '@radix-ui/react-scroll-area'

interface Workshop {
  id: string
  stream?: string
  title: string
  desc: string
  level: string
  x: number
  y: number
  connections: string[]
  prerequisites: string[]
  completed?: boolean
  unlocked?: boolean
}

interface WorkshopMenuProps {
  gameScene: any
  isOpen: boolean
  onClose: () => void
  onWorkshopCompleted?: () => void
}

const WorkshopMenu: React.FC<WorkshopMenuProps> = ({ 
  gameScene,
  isOpen,
  onClose,
  onWorkshopCompleted
}) => {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)

  // Workshop data - Stream A, B, C with convergence pattern
  const workshopData: Workshop[] = [
    // Layer 1 - Different workshops for each stream
    { id: 'A1', stream: 'A', title: 'Communication Skills', desc: 'Master verbal and written communication', level: 'Layer1', x: 0, y: 0, connections: [], prerequisites: [] },
    { id: 'B1', stream: 'B', title: 'Technical Skills', desc: 'Core technical competencies', level: 'Layer1', x: 0, y: 0, connections: [], prerequisites: [] },
    { id: 'C1', stream: 'C', title: 'Creative Thinking', desc: 'Innovation and creative problem solving', level: 'Layer1', x: 0, y: 0, connections: [], prerequisites: [] },
    
    // Layer 2 - Same workshop (convergence point)
    { id: 'COMMON', title: 'Leadership Foundations', desc: 'Core leadership principles for all paths', level: 'Layer2', x: 0, y: 0, connections: [], prerequisites: ['A1', 'B1', 'C1'] },
    
    // Layer 3 - Different workshops again (divergence)
    { id: 'A3', stream: 'A', title: 'Executive Communication', desc: 'Senior-level communication strategies', level: 'Layer3', x: 0, y: 0, connections: [], prerequisites: ['COMMON'] },
    { id: 'B3', stream: 'B', title: 'Technical Leadership', desc: 'Leading technical teams and projects', level: 'Layer3', x: 0, y: 0, connections: [], prerequisites: ['COMMON'] },
    { id: 'C3', stream: 'C', title: 'Innovation Management', desc: 'Managing creative processes and teams', level: 'Layer3', x: 0, y: 0, connections: [], prerequisites: ['COMMON'] }
  ]

  const checkPrerequisites = (workshop: Workshop, completedWorkshops: Set<string>): boolean => {
    if (!workshop.prerequisites || workshop.prerequisites.length === 0) {
      return true
    }
    
    // For the COMMON workshop, only need ONE of the stream workshops (A1, B1, or C1)
    if (workshop.id === 'COMMON') {
      return workshop.prerequisites.some(prereq => completedWorkshops.has(prereq))
    }
    
    // For all other workshops, need ALL prerequisites completed
    return workshop.prerequisites.every(prereq => completedWorkshops.has(prereq))
  }

  useEffect(() => {
    if (gameScene && gameScene.completedWorkshops) {
      const completedSet = gameScene.completedWorkshops as Set<string>
      const updatedWorkshops = workshopData.map(workshop => ({
        ...workshop,
        completed: completedSet.has(workshop.id),
        unlocked: checkPrerequisites(workshop, completedSet)
      }))
      setWorkshops(updatedWorkshops)
    }
  }, [gameScene, isOpen])

  const handleWorkshopComplete = (workshopId: string) => {
    if (gameScene && gameScene.completedWorkshops) {
      gameScene.completedWorkshops.add(workshopId)
      // Update workshops state
      const completedSet = gameScene.completedWorkshops as Set<string>
      const updatedWorkshops = workshopData.map(workshop => ({
        ...workshop,
        completed: completedSet.has(workshop.id),
        unlocked: checkPrerequisites(workshop, completedSet)
      }))
      setWorkshops(updatedWorkshops)
      setSelectedWorkshop(null)
      
      // Notify parent that a workshop was completed (to refresh BuildingMenu)
      if (onWorkshopCompleted) {
        onWorkshopCompleted()
      }
    }
  }




  return (
    <Tooltip.Provider delayDuration={400}>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          
          <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-40 pointer-events-none">
            <div className="max-w-6xl mx-auto pointer-events-auto">
              {/* Cloud-like glow container */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-100/70 via-purple-100/70 to-blue-100/70 rounded-[2rem] blur-2xl"></div>
                
                {/* Main AC-style panel */}
                <div className="relative bg-gradient-to-br from-indigo-50/98 via-purple-50/98 to-white/98 backdrop-blur-lg rounded-[2rem] border-4 border-white/90 shadow-2xl overflow-hidden max-h-[75vh]">
                  {/* AC-style header */}
                  <div className="relative bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 border-b-4 border-white/90">
                    <div className="relative p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-200 via-purple-200 to-blue-200 rounded-[1rem] flex items-center justify-center shadow-lg border-3 border-white/80">
                          <div className="w-6 h-6 bg-white/60 rounded-full"></div>
                        </div>
                        <div>
                          <Dialog.Title 
                            className="text-2xl font-bold text-slate-700 drop-shadow-sm"
                            style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                          >
                            Career Workshops
                          </Dialog.Title>
                        </div>
                      </div>
                      
                      <Dialog.Close asChild>
                        <button
                          className="text-slate-600 hover:text-slate-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border-3 border-white hover:border-purple-200 hover:bg-purple-50/80 hover:scale-110 transition-all duration-300 shadow-lg"
                          aria-label="Close"
                          style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                        >
                          ×
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>
                  
                  {/* Workshop content */}
                  <div className="p-6">
                    <ScrollArea.Root className="w-full h-[60vh]">
                      <ScrollArea.Viewport className="w-full h-full">
                        {/* Stream Convergence Layout */}
                        <div className="flex flex-col items-center space-y-12 py-8">
                          
                          {/* Layer 1 - Three separate streams */}
                          <div className="flex justify-center items-center space-x-16">
                            {workshopData.filter(w => w.level === 'Layer1').map((workshop, index) => {
                              const streamColors = {
                                'A': 'from-blue-400 to-blue-600',
                                'B': 'from-emerald-400 to-emerald-600', 
                                'C': 'from-red-400 to-red-600'
                              }
                              
                              return (
                                <div key={workshop.id} className="flex flex-col items-center">
                                  {/* Stream label */}
                                  <div className={`mb-2 px-3 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${streamColors[workshop.stream as keyof typeof streamColors]}`}
                                       style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}>
                                    Stream {workshop.stream}
                                  </div>
                                  
                                  <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                      <button
                                        onClick={() => workshops.find(w => w.id === workshop.id)?.unlocked && !workshops.find(w => w.id === workshop.id)?.completed && setSelectedWorkshop(workshop)}
                                        disabled={!workshops.find(w => w.id === workshop.id)?.unlocked || workshops.find(w => w.id === workshop.id)?.completed}
                                        className={`
                                          relative group overflow-hidden
                                          ${workshops.find(w => w.id === workshop.id)?.completed 
                                            ? 'bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 border-green-300 cursor-default' 
                                            : workshops.find(w => w.id === workshop.id)?.unlocked
                                              ? 'cursor-pointer hover:scale-105 active:scale-95 bg-gradient-to-br from-white/95 via-indigo-50/95 to-purple-50/95 hover:from-purple-50/95 hover:via-indigo-50/95 hover:to-blue-50/95 border-white/80 hover:border-purple-200/80'
                                              : 'opacity-50 cursor-not-allowed bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 border-gray-300'
                                          }
                                          rounded-[1rem] transition-all duration-500 ease-out shadow-md hover:shadow-lg
                                          w-32 h-32 flex flex-col items-center justify-center p-3
                                          border-3 backdrop-blur-sm transform hover:rotate-1
                                        `}
                                        style={{
                                          animationDelay: `${index * 200}ms`,
                                          fontFamily: '"Comic Sans MS", "Marker Felt", cursive'
                                        }}
                                      >
                                        {/* AC-style top highlight */}
                                        <div className="absolute top-1 left-2 right-2 h-2 bg-white/50 rounded-full"></div>
                                        
                                        {/* Status indicator */}
                                        {workshops.find(w => w.id === workshop.id)?.completed && (
                                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                                            ✓
                                          </div>
                                        )}
                                        
                                        {!workshops.find(w => w.id === workshop.id)?.unlocked && (
                                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                                            🔒
                                          </div>
                                        )}
                                        
                                        {/* Workshop content */}
                                        <div className="text-center flex-1 flex flex-col justify-center">
                                          <div className="text-slate-700 font-bold text-xs leading-tight">
                                            {workshop.title}
                                          </div>
                                          <div className="text-slate-500 text-xs leading-tight mt-1">
                                            {workshop.desc}
                                          </div>
                                        </div>

                                        {/* Soft glow on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-100/0 via-purple-100/20 to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1rem] pointer-events-none"></div>
                                      </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                      <Tooltip.Content
                                        className="bg-gradient-to-br from-white/98 to-indigo-50/98 text-slate-700 px-4 py-3 rounded-[1rem] shadow-xl max-w-xs border-3 border-white/90 backdrop-blur-sm"
                                        sideOffset={15}
                                        style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                                      >
                                        <div className="font-bold text-slate-600 text-sm mb-1">
                                          {workshop.title}
                                        </div>
                                        <div className="text-slate-500 text-xs mb-2">{workshop.desc}</div>
                                        
                                        <Tooltip.Arrow className="fill-white/98" />
                                      </Tooltip.Content>
                                    </Tooltip.Portal>
                                  </Tooltip.Root>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Convergence arrows */}
                          <div className="flex justify-center">
                            <div className="text-4xl text-purple-400">↓</div>
                          </div>
                          
                          {/* Layer 2 - Single convergence workshop */}
                          <div className="flex justify-center">
                            {workshopData.filter(w => w.level === 'Layer2').map((workshop) => (
                              <div key={workshop.id} className="flex flex-col items-center">
                                <div className="mb-2 px-4 py-2 rounded-full text-white text-sm font-bold bg-gradient-to-r from-purple-500 to-indigo-600"
                                     style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}>
                                  Convergence Point
                                </div>
                                
                                <Tooltip.Root>
                                  <Tooltip.Trigger asChild>
                                    <button
                                      onClick={() => workshops.find(w => w.id === workshop.id)?.unlocked && !workshops.find(w => w.id === workshop.id)?.completed && setSelectedWorkshop(workshop)}
                                      disabled={!workshops.find(w => w.id === workshop.id)?.unlocked || workshops.find(w => w.id === workshop.id)?.completed}
                                      className={`
                                        relative group overflow-hidden
                                        ${workshops.find(w => w.id === workshop.id)?.completed 
                                          ? 'bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 border-green-300 cursor-default' 
                                          : workshops.find(w => w.id === workshop.id)?.unlocked
                                            ? 'cursor-pointer hover:scale-105 active:scale-95 bg-gradient-to-br from-white/95 via-purple-50/95 to-indigo-50/95 hover:from-purple-50/95 hover:via-indigo-50/95 hover:to-blue-50/95 border-white/80 hover:border-purple-200/80'
                                            : 'opacity-50 cursor-not-allowed bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 border-gray-300'
                                        }
                                        rounded-[1rem] transition-all duration-500 ease-out shadow-md hover:shadow-lg
                                        w-40 h-32 flex flex-col items-center justify-center p-4
                                        border-3 backdrop-blur-sm transform hover:rotate-1
                                      `}
                                      style={{
                                        animationDelay: `600ms`,
                                        fontFamily: '"Comic Sans MS", "Marker Felt", cursive'
                                      }}
                                    >
                                      {/* AC-style top highlight */}
                                      <div className="absolute top-1 left-2 right-2 h-2 bg-white/50 rounded-full"></div>
                                      
                                      {/* Status indicator */}
                                      {workshops.find(w => w.id === workshop.id)?.completed && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                                          ✓
                                        </div>
                                      )}
                                      
                                      {!workshops.find(w => w.id === workshop.id)?.unlocked && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                                          🔒
                                        </div>
                                      )}
                                      
                                      {/* Workshop content */}
                                      <div className="text-center flex-1 flex flex-col justify-center">
                                        <div className="text-slate-700 font-bold text-sm leading-tight">
                                          {workshop.title}
                                        </div>
                                        <div className="text-slate-500 text-xs leading-tight mt-1">
                                          {workshop.desc}
                                        </div>
                                      </div>

                                      {/* Soft glow on hover */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-purple-100/0 via-purple-100/20 to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1rem] pointer-events-none"></div>
                                    </button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content
                                      className="bg-gradient-to-br from-white/98 to-indigo-50/98 text-slate-700 px-4 py-3 rounded-[1rem] shadow-xl max-w-xs border-3 border-white/90 backdrop-blur-sm"
                                      sideOffset={15}
                                      style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                                    >
                                      <div className="font-bold text-slate-600 text-sm mb-1">
                                        {workshop.title}
                                      </div>
                                      <div className="text-slate-500 text-xs mb-2">{workshop.desc}</div>
                                      <div className="text-purple-600 text-xs border-t-2 border-indigo-200 pt-2 font-bold">
                                        Requires any one Stream workshop
                                      </div>
                                      
                                      <Tooltip.Arrow className="fill-white/98" />
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              </div>
                            ))}
                          </div>
                          
                          {/* Divergence arrows */}
                          <div className="flex justify-center">
                            <div className="text-4xl text-purple-400">↓</div>
                          </div>
                          
                          {/* Layer 3 - Three separate streams again */}
                          <div className="flex justify-center items-center space-x-16">
                            {workshopData.filter(w => w.level === 'Layer3').map((workshop, index) => {
                              const streamColors = {
                                'A': 'from-blue-400 to-blue-600',
                                'B': 'from-emerald-400 to-emerald-600', 
                                'C': 'from-red-400 to-red-600'
                              }
                              
                              return (
                                <div key={workshop.id} className="flex flex-col items-center">
                                  <div className={`mb-2 px-3 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${streamColors[workshop.stream as keyof typeof streamColors]}`}
                                       style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}>
                                    Stream {workshop.stream}
                                  </div>
                                  
                                  <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                      <button
                                        onClick={() => workshops.find(w => w.id === workshop.id)?.unlocked && !workshops.find(w => w.id === workshop.id)?.completed && setSelectedWorkshop(workshop)}
                                        disabled={!workshops.find(w => w.id === workshop.id)?.unlocked || workshops.find(w => w.id === workshop.id)?.completed}
                                        className={`
                                          relative group overflow-hidden
                                          ${workshops.find(w => w.id === workshop.id)?.completed 
                                            ? 'bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 border-green-300 cursor-default' 
                                            : workshops.find(w => w.id === workshop.id)?.unlocked
                                              ? 'cursor-pointer hover:scale-105 active:scale-95 bg-gradient-to-br from-white/95 via-indigo-50/95 to-purple-50/95 hover:from-purple-50/95 hover:via-indigo-50/95 hover:to-blue-50/95 border-white/80 hover:border-purple-200/80'
                                              : 'opacity-50 cursor-not-allowed bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 border-gray-300'
                                          }
                                          rounded-[1rem] transition-all duration-500 ease-out shadow-md hover:shadow-lg
                                          w-32 h-32 flex flex-col items-center justify-center p-3
                                          border-3 backdrop-blur-sm transform hover:rotate-1
                                        `}
                                        style={{
                                          animationDelay: `${800 + index * 200}ms`,
                                          fontFamily: '"Comic Sans MS", "Marker Felt", cursive'
                                        }}
                                      >
                                        {/* AC-style top highlight */}
                                        <div className="absolute top-1 left-2 right-2 h-2 bg-white/50 rounded-full"></div>
                                        
                                        {/* Status indicator */}
                                        {workshops.find(w => w.id === workshop.id)?.completed && (
                                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                                            ✓
                                          </div>
                                        )}
                                        
                                        {!workshops.find(w => w.id === workshop.id)?.unlocked && (
                                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                                            🔒
                                          </div>
                                        )}
                                        
                                        {/* Workshop content */}
                                        <div className="text-center flex-1 flex flex-col justify-center">
                                          <div className="text-slate-700 font-bold text-xs leading-tight">
                                            {workshop.title}
                                          </div>
                                          <div className="text-slate-500 text-xs leading-tight mt-1">
                                            {workshop.desc}
                                          </div>
                                        </div>

                                        {/* Soft glow on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-100/0 via-purple-100/20 to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1rem] pointer-events-none"></div>
                                      </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                      <Tooltip.Content
                                        className="bg-gradient-to-br from-white/98 to-indigo-50/98 text-slate-700 px-4 py-3 rounded-[1rem] shadow-xl max-w-xs border-3 border-white/90 backdrop-blur-sm"
                                        sideOffset={15}
                                        style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                                      >
                                        <div className="font-bold text-slate-600 text-sm mb-1">
                                          {workshop.title}
                                        </div>
                                        <div className="text-slate-500 text-xs mb-2">{workshop.desc}</div>
                                        
                                        <Tooltip.Arrow className="fill-white/98" />
                                      </Tooltip.Content>
                                    </Tooltip.Portal>
                                  </Tooltip.Root>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </ScrollArea.Viewport>
                      
                      {/* AC-style custom scrollbar */}
                      <ScrollArea.Scrollbar
                        className="flex select-none touch-none p-1 bg-indigo-100/80 transition-colors duration-300 hover:bg-purple-200/80 data-[orientation=vertical]:w-4 border-l-3 border-white/70 rounded-r-lg"
                        orientation="vertical"
                      >
                        <ScrollArea.Thumb className="flex-1 bg-gradient-to-b from-indigo-300 via-purple-300 to-blue-300 rounded-full border-2 border-white/80 shadow-sm" />
                      </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Workshop details modal */}
      {selectedWorkshop && (
        <Dialog.Root open={!!selectedWorkshop} onOpenChange={() => setSelectedWorkshop(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
            <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] max-w-md w-[90vw] z-[70]">
              <div className="bg-gradient-to-br from-white to-indigo-50 rounded-[1.5rem] border-4 border-white shadow-2xl p-6"
                   style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}>
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-xl font-bold text-slate-700">
                    {selectedWorkshop.title}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-slate-500 hover:text-slate-700 text-xl">×</button>
                  </Dialog.Close>
                </div>
                
                <div className="space-y-4">
                  <p className="text-slate-600">{selectedWorkshop.desc}</p>
                  
                  {selectedWorkshop.prerequisites.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-700 mb-2">Prerequisites:</h4>
                      <ul className="list-disc list-inside text-sm text-slate-600">
                        {selectedWorkshop.prerequisites.map(prereq => (
                          <li key={prereq}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleWorkshopComplete(selectedWorkshop.id)}
                    className="w-full bg-gradient-to-br from-green-400 to-emerald-500 text-white font-bold py-3 rounded-xl hover:scale-105 transition-transform duration-200 shadow-lg"
                  >
                    Complete Workshop
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </Tooltip.Provider>
  )
}

export default WorkshopMenu
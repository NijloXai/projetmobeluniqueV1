import type { ModelWithImages, Fabric, VisualWithFabricAndImage } from '@/types/database'

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

export type ConfiguratorStep = 'tissu' | 'apercu' | 'simulation' | 'resultat'

export type SimulationStatus = 'idle' | 'placing' | 'generating' | 'done' | 'error'

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export interface PlacementRect {
  x: number
  y: number
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Configurator state
// ---------------------------------------------------------------------------

export interface ConfiguratorState {
  step: ConfiguratorStep
  selectedFabricId: string | null
  selectedAngle: string | null
  uploadedPhoto: File | null
  presetRoomId: string | null
  previewUrl: string | null
  sofaPosition: PlacementRect | null
  simulationStatus: SimulationStatus
  resultBlobUrl: string | null
  errorMessage: string | null
  progress: number
  progressStage: string | null
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

export interface ConfiguratorProps {
  model: ModelWithImages | null
  onClose: () => void
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
}

export interface StepTissuProps {
  model: ModelWithImages
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
  selectedFabricId: string | null
  selectedAngle: string | null
  onSelectFabric: (fabricId: string) => void
  onSelectAngle: (angle: string) => void
  onNext: () => void
}

export interface StepApercuProps {
  model: ModelWithImages
  visuals: VisualWithFabricAndImage[]
  selectedFabricId: string | null
  selectedAngle: string | null
  onSelectAngle: (angle: string) => void
  onSimulate: () => void
  fabricName: string
  isPremium: boolean
  totalPrice: number
}

export interface StepSimulationProps {
  model: ModelWithImages
  previewUrl: string | null
  simulationStatus: SimulationStatus
  errorMessage: string | null
  progress: number
  progressStage: string | null
  onFileSelected: (file: File) => void
  onPresetSelected: (presetId: string) => void
  onLaunch: () => void
  onChangePhoto: () => void
  onCancel: () => void
  fabricName: string
  selectedFabricId: string | null
}

export interface StepResultatProps {
  model: ModelWithImages
  previewUrl: string | null
  resultBlobUrl: string | null
  fabricName: string
  onDownload: () => void
  onShare: () => void
  onRetry: () => void
  shopifyUrl: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
])

export const MAX_SIZE_BYTES = 15 * 1024 * 1024

export interface PresetRoom {
  id: string
  label: string
  image: string
}

export const PRESET_ROOMS: PresetRoom[] = [
  { id: 'salon-moderne', label: 'Salon moderne', image: '/presets/salon-moderne.webp' },
  { id: 'salon-classique', label: 'Salon classique', image: '/presets/salon-classique.webp' },
  { id: 'loft-industriel', label: 'Loft industriel', image: '/presets/loft-industriel.webp' },
  { id: 'chambre-cosy', label: 'Chambre cosy', image: '/presets/chambre-cosy.webp' },
]

import type { ResourceGroup, Resource } from '../types'

export type LayoutVariant = 'standard' | 'enhanced'

export interface LayoutProps {
  groups: ResourceGroup[]
  filter: string
  onDragStart: (e: React.DragEvent, path: string) => void
  onOpenFile: (path: string) => void
  onPreview: (resource: Resource) => void
  onToggleFavorite?: (resourceId: string) => void
  favorites?: Set<string>
  variant: LayoutVariant
  selectedResources: Set<string>
  onToggleSelection: (resourceId: string) => void
}

export type LayoutType = 'list' | 'grid' | 'tabs' | 'favorites' | 'dock' | 'palette' | 'kanban'

export const LAYOUT_OPTIONS: { value: LayoutType; label: string }[] = [
  { value: 'list', label: 'List (Original)' },
  { value: 'grid', label: 'A: Grid Tiles' },
  { value: 'tabs', label: 'B: Tabs + Chips' },
  { value: 'favorites', label: 'C: Favorites Bar' },
  { value: 'dock', label: 'D: Icon Dock' },
  { value: 'palette', label: 'E: Command Palette' },
  { value: 'kanban', label: 'F: Kanban Columns' },
]

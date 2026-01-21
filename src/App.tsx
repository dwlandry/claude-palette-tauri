import { useEffect, useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import type { ResourceGroup, Resource } from './types'
import {
  GridLayout,
  TabsLayout,
  FavoritesLayout,
  DockLayout,
  PaletteLayout,
  KanbanLayout,
  LAYOUT_OPTIONS,
  LayoutType,
  LayoutVariant
} from './layouts'
import './App.css'

function App() {
  const [groups, setGroups] = useState<ResourceGroup[]>([])
  const [filter, setFilter] = useState('')
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [loading, setLoading] = useState(true)
  const [layout, setLayout] = useState<LayoutType>('list')
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('claude-palette-favorites')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  const [variants, setVariants] = useState<Record<string, LayoutVariant>>(() => {
    const saved = localStorage.getItem('claude-palette-variants')
    return saved ? JSON.parse(saved) : {}
  })
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set())
  const [projectPath, setProjectPath] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadResources()
    loadProjectPath()
    const savedLayout = localStorage.getItem('claude-palette-layout') as LayoutType
    if (savedLayout) setLayout(savedLayout)
  }, [])

  async function loadProjectPath() {
    try {
      const path = await invoke<string | null>('get_project_path')
      setProjectPath(path ?? undefined)
    } catch (e) {
      console.error('Failed to get project path:', e)
    }
  }

  useEffect(() => {
    localStorage.setItem('claude-palette-favorites', JSON.stringify([...favorites]))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('claude-palette-layout', layout)
  }, [layout])

  useEffect(() => {
    localStorage.setItem('claude-palette-variants', JSON.stringify(variants))
  }, [variants])

  const currentVariant: LayoutVariant = variants[layout] || 'standard'

  function setCurrentVariant(variant: LayoutVariant) {
    setVariants(prev => ({ ...prev, [layout]: variant }))
  }

  async function loadResources() {
    setLoading(true)
    try {
      const data = await invoke<ResourceGroup[]>('get_resources')
      setGroups(data)
    } catch (e) {
      console.error('Failed to load resources:', e)
    }
    setLoading(false)
  }

  async function toggleAlwaysOnTop() {
    const newValue = !alwaysOnTop
    await getCurrentWindow().setAlwaysOnTop(newValue)
    setAlwaysOnTop(newValue)
  }

  function toggleGroup(type: string) {
    setGroups(prev =>
      prev.map(g => (g.type === type ? { ...g, collapsed: !g.collapsed } : g))
    )
  }

  async function handleOpenFile(path: string) {
    try {
      await invoke('open_file', { path })
    } catch (e) {
      console.error('Failed to open file:', e)
    }
  }

  function toggleFavorite(resourceId: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(resourceId)) {
        next.delete(resourceId)
      } else {
        next.add(resourceId)
      }
      return next
    })
  }

  function toggleSelection(resourceId: string) {
    setSelectedResources(prev => {
      const next = new Set(prev)
      if (next.has(resourceId)) {
        next.delete(resourceId)
      } else {
        next.add(resourceId)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedResources(new Set())
  }

  function openPreview(resource: Resource) {
    // For Tauri, we'll just open the file in the default editor
    // A proper preview modal could be added later
    handleOpenFile(resource.path)
  }

  // Get the appropriate path for a resource
  function getResourcePath(resource: Resource): string {
    if (resource.scope === 'project' && projectPath) {
      const relativePath = resource.path.replace(projectPath, '').replace(/^[/\\]/, '')
      return relativePath
    }
    return resource.path
  }

  const getSelectedResourceObjects = useCallback((): Resource[] => {
    const allResources = groups.flatMap(g => g.resources)
    return allResources.filter(r => selectedResources.has(r.id))
  }, [groups, selectedResources])

  // Format resource for clipboard
  function formatResourceForCopy(r: Resource): string {
    if (r.type === 'command') {
      return `/${r.name}`
    }
    return `<${r.type}>${getResourcePath(r).trim()}</${r.type}>`
  }

  async function copySelected() {
    const selected = getSelectedResourceObjects()
    if (selected.length === 0) return
    const text = selected.map(formatResourceForCopy).join('\n')
    await writeText(text)
  }

  function handleDragStart(e: React.DragEvent, path: string) {
    const allResources = groups.flatMap(g => g.resources)
    const draggedResource = allResources.find(r => r.path === path)

    if (draggedResource && selectedResources.has(draggedResource.id)) {
      const selected = getSelectedResourceObjects()
      const text = selected.map(formatResourceForCopy).join('\n')
      e.dataTransfer.setData('text/plain', text)
    } else if (draggedResource) {
      e.dataTransfer.setData('text/plain', formatResourceForCopy(draggedResource))
    } else {
      e.dataTransfer.setData('text/plain', path.trim())
    }
    e.dataTransfer.effectAllowed = 'copy'
  }

  const filteredGroups = groups.map(g => ({
    ...g,
    resources: g.resources.filter(
      r =>
        r.name.toLowerCase().includes(filter.toLowerCase()) ||
        r.description?.toLowerCase().includes(filter.toLowerCase())
    )
  })).filter(g => g.resources.length > 0)

  const layoutProps = {
    groups: filteredGroups,
    filter,
    onDragStart: handleDragStart,
    onOpenFile: handleOpenFile,
    onPreview: openPreview,
    favorites,
    onToggleFavorite: toggleFavorite,
    variant: currentVariant,
    selectedResources,
    onToggleSelection: toggleSelection
  }

  function renderLayout() {
    if (loading) return <div className="loading">Loading resources...</div>

    switch (layout) {
      case 'grid':
        return <GridLayout {...layoutProps} />
      case 'tabs':
        return <TabsLayout {...layoutProps} />
      case 'favorites':
        return <FavoritesLayout {...layoutProps} />
      case 'dock':
        return <DockLayout {...layoutProps} />
      case 'palette':
        return <PaletteLayout {...layoutProps} />
      case 'kanban':
        return <KanbanLayout {...layoutProps} />
      default:
        return <ListLayout groups={filteredGroups} toggleGroup={toggleGroup} handleDragStart={handleDragStart} selectedResources={selectedResources} onToggleSelection={toggleSelection} onPreview={openPreview} onOpenFile={handleOpenFile} />
    }
  }

  return (
    <div className={`app layout-${layout}`}>
      <header className="titlebar" data-tauri-drag-region>
        <span className="title">Claude Palette</span>
        <div className="controls">
          <select
            className="layout-select"
            value={layout}
            onChange={e => setLayout(e.target.value as LayoutType)}
            title="Switch layout"
          >
            {LAYOUT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {layout !== 'list' && (
            <div className="variant-toggle">
              <button
                className={`variant-btn ${currentVariant === 'standard' ? 'active' : ''}`}
                onClick={() => setCurrentVariant('standard')}
                title="Standard variant"
              >
                Std
              </button>
              <button
                className={`variant-btn ${currentVariant === 'enhanced' ? 'active' : ''}`}
                onClick={() => setCurrentVariant('enhanced')}
                title="Enhanced variant"
              >
                Enh
              </button>
            </div>
          )}
          <button
            className={`pin-btn ${alwaysOnTop ? 'active' : ''}`}
            onClick={toggleAlwaysOnTop}
            title="Always on top"
          >
            <PinIcon />
          </button>
          <button onClick={() => getCurrentWindow().minimize()} title="Minimize">
            <MinIcon />
          </button>
          <button onClick={() => getCurrentWindow().close()} title="Close">
            <CloseIcon />
          </button>
        </div>
      </header>

      <div className="search">
        <input
          type="text"
          placeholder="Filter resources..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <button className="refresh-btn" onClick={loadResources} title="Refresh">
          <RefreshIcon />
        </button>
      </div>

      <main className="content">
        {renderLayout()}
      </main>

      {selectedResources.size > 0 && (
        <div className="selection-bar">
          <span className="selection-count">{selectedResources.size} selected</span>
          <button className="selection-btn copy-btn" onClick={copySelected} title="Copy to clipboard">
            <CopyIcon /> Copy
          </button>
          <button className="selection-btn clear-btn" onClick={clearSelection} title="Clear selection">
            <CloseIcon /> Clear
          </button>
        </div>
      )}
    </div>
  )
}

// Original list layout as inline component
function ListLayout({ groups, toggleGroup, handleDragStart, selectedResources, onToggleSelection, onPreview, onOpenFile }: {
  groups: ResourceGroup[]
  toggleGroup: (type: string) => void
  handleDragStart: (e: React.DragEvent, path: string) => void
  selectedResources: Set<string>
  onToggleSelection: (resourceId: string) => void
  onPreview: (resource: Resource) => void
  onOpenFile: (path: string) => void
}) {
  if (groups.length === 0) return <div className="empty">No resources found</div>

  return (
    <>
      {groups.map(group => (
        <section key={group.type} className="group">
          <button className="group-header" onClick={() => toggleGroup(group.type)}>
            <span className="chevron">{group.collapsed ? '>' : 'v'}</span>
            <span className="group-label">{group.label}</span>
            <span className="count">{group.resources.length}</span>
          </button>
          {!group.collapsed && (
            <ul className="resources">
              {group.resources.map(resource => (
                <li
                  key={resource.id}
                  className={`resource ${selectedResources.has(resource.id) ? 'selected' : ''}`}
                  draggable
                  onDragStart={e => handleDragStart(e, resource.path)}
                  onClick={() => onToggleSelection(resource.id)}
                  onDoubleClick={e => {
                    if (e.shiftKey) {
                      onOpenFile(resource.path)
                    } else {
                      onPreview(resource)
                    }
                  }}
                  title={`${resource.path}\n\nClick to select, drag to copy, double-click to preview, Shift+double-click to open in editor`}
                >
                  <div className="resource-name">
                    {resource.type === 'command' && '/'}
                    {resource.name}
                    {resource.source === 'plugin' && (
                      <span className="plugin-badge">{resource.pluginName}</span>
                    )}
                  </div>
                  {resource.description && (
                    <div className="resource-desc">{resource.description}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  )
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v10M12 22v-6M5 12h14" />
    </svg>
  )
}

function MinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export default App

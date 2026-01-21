import { useEffect, useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import type { ResourceGroup, Resource } from './types'
import './App.css'

function App() {
  const [groups, setGroups] = useState<ResourceGroup[]>([])
  const [filter, setFilter] = useState('')
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set())
  const [projectPath, setProjectPath] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadResources()
    loadProjectPath()
  }, [])

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

  async function loadProjectPath() {
    try {
      const path = await invoke<string | null>('get_project_path')
      setProjectPath(path ?? undefined)
    } catch (e) {
      console.error('Failed to get project path:', e)
    }
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

  // Get the appropriate path for a resource
  function getResourcePath(resource: Resource): string {
    if (resource.scope === 'project' && projectPath) {
      const relativePath = resource.path.replace(projectPath, '').replace(/^[/\\]/, '')
      return relativePath
    }
    return resource.path
  }

  // Format resource for clipboard
  function formatResourceForCopy(r: Resource): string {
    if (r.type === 'command') {
      return `/${r.name}`
    }
    return `<${r.type}>${getResourcePath(r).trim()}</${r.type}>`
  }

  const getSelectedResourceObjects = useCallback((): Resource[] => {
    const allResources = groups.flatMap(g => g.resources)
    return allResources.filter(r => selectedResources.has(r.id))
  }, [groups, selectedResources])

  async function copySelected() {
    const selected = getSelectedResourceObjects()
    if (selected.length === 0) return
    const text = selected.map(formatResourceForCopy).join('\n')
    await writeText(text)
  }

  function handleDragStart(e: React.DragEvent, resource: Resource) {
    if (selectedResources.has(resource.id)) {
      const selected = getSelectedResourceObjects()
      const text = selected.map(formatResourceForCopy).join('\n')
      e.dataTransfer.setData('text/plain', text)
    } else {
      e.dataTransfer.setData('text/plain', formatResourceForCopy(resource))
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

  return (
    <div className="app">
      <header className="titlebar" data-tauri-drag-region>
        <span className="title">Claude Palette</span>
        <div className="controls">
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
        {loading ? (
          <div className="loading">Loading resources...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="empty">No resources found</div>
        ) : (
          filteredGroups.map(group => (
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
                      onDragStart={e => handleDragStart(e, resource)}
                      onClick={() => toggleSelection(resource.id)}
                      title={`${resource.path}\n\nClick to select, drag to copy`}
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
          ))
        )}
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

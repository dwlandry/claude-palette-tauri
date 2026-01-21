import { useState, useEffect } from 'react'
import type { LayoutProps } from './types'
import { formatResourceName } from '../utils/formatName'

const TYPE_COLORS: Record<string, string> = {
  agent: '#e94560',
  command: '#4ecdc4',
  skill: '#ffe66d',
  plan: '#95e1d3',
  hook: '#dda0dd',
  plugin: '#87ceeb',
}

export function PaletteLayout({ groups, filter, onDragStart, onOpenFile, onPreview, variant, selectedResources, onToggleSelection }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const allResources = groups.flatMap(g => g.resources)
  const filtered = allResources.filter(
    r =>
      r.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.description?.toLowerCase().includes(filter.toLowerCase()) ||
      formatResourceName(r.name).toLowerCase().includes(filter.toLowerCase())
  )
  // Only limit results when actively filtering to keep UI responsive
  const displayResults = filter.trim() ? filtered.slice(0, 20) : filtered

  const isEnhanced = variant === 'enhanced'

  useEffect(() => {
    setSelectedIndex(0)
  }, [filter])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, displayResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && displayResults[selectedIndex]) {
        if (e.shiftKey) {
          onOpenFile(displayResults[selectedIndex].path)
        } else {
          onPreview(displayResults[selectedIndex])
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [displayResults, selectedIndex, onOpenFile, onPreview])

  if (!isOpen) {
    return (
      <div className="palette-closed">
        <button onClick={() => setIsOpen(true)} className="open-palette-btn">
          Open Palette (or press any key)
        </button>
        <div className="palette-hint">Ctrl+K style interface</div>
      </div>
    )
  }

  return (
    <div className={`palette-layout ${isEnhanced ? 'enhanced' : ''}`}>
      <div className="palette-header">
        <span className="palette-icon">{'\u2318'}</span>
        <span>Type to search...</span>
        <button className="close-palette" onClick={() => setIsOpen(false)}>ESC</button>
      </div>

      <div className="palette-results">
        {displayResults.length === 0 ? (
          <div className="palette-empty">No results for "{filter}"</div>
        ) : (
          displayResults.map((resource, index) => (
            <div
              key={resource.id}
              className={`palette-item ${index === selectedIndex ? 'selected' : ''} ${selectedResources.has(resource.id) ? 'selected-multi' : ''}`}
              draggable
              onDragStart={e => onDragStart(e, resource.path)}
              onClick={() => onToggleSelection(resource.id)}
              onDoubleClick={e => {
                if (e.shiftKey) {
                  onOpenFile(resource.path)
                } else {
                  onPreview(resource)
                }
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span
                className="palette-type"
                style={{ background: TYPE_COLORS[resource.type] }}
              >
                {resource.type}
              </span>
              <span className="palette-name">
                {resource.type === 'command' && '/'}
                {formatResourceName(resource.name)}
              </span>
              {isEnhanced && (
                <span className="palette-shortcut">drag</span>
              )}
              {resource.source === 'plugin' && (
                <span className="palette-plugin">{resource.pluginName}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="palette-footer">
        <span>{'\u2191\u2193'} navigate</span>
        <span>{'\u21B5'} preview</span>
        <span>click select</span>
        <span>dbl-click preview</span>
      </div>
    </div>
  )
}

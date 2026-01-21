import { useState } from 'react'
import type { LayoutProps } from './types'
import type { Resource } from '../types'
import { formatResourceName } from '../utils/formatName'

const TYPE_ICONS: Record<string, string> = {
  agent: '\u{1F916}',
  command: '\u{26A1}',
  skill: '\u{1F3AF}',
  plan: '\u{1F4CB}',
  hook: '\u{1FA9D}',
  plugin: '\u{1F50C}',
}

const TYPE_COLORS: Record<string, string> = {
  agent: '#e94560',
  command: '#4ecdc4',
  skill: '#ffe66d',
  plan: '#95e1d3',
  hook: '#dda0dd',
  plugin: '#87ceeb',
}

export function DockLayout({ groups, filter, onDragStart, onOpenFile, onPreview, variant, selectedResources, onToggleSelection }: LayoutProps) {
  const [hoveredResource, setHoveredResource] = useState<Resource | null>(null)

  const allResources = groups.flatMap(g => g.resources)
  const filtered = allResources.filter(
    r =>
      r.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.description?.toLowerCase().includes(filter.toLowerCase()) ||
      formatResourceName(r.name).toLowerCase().includes(filter.toLowerCase())
  )

  // Group by type for dock sections
  const byType = groups.map(g => ({
    ...g,
    resources: g.resources.filter(r => filtered.includes(r))
  })).filter(g => g.resources.length > 0)

  const isEnhanced = variant === 'enhanced'

  if (filtered.length === 0) {
    return <div className="dock-layout"><div className="empty">No resources found</div></div>
  }

  // Enhanced: Horizontal shelf with readable cards
  if (isEnhanced) {
    return (
      <div className="dock-layout enhanced">
        {byType.map(group => (
          <div key={group.type} className="dock-section">
            <div className="dock-label">
              <span>{TYPE_ICONS[group.type]}</span> {group.label}
            </div>
            <div className="dock-shelf">
              {group.resources.map(resource => (
                <div
                  key={resource.id}
                  className={`dock-card ${selectedResources.has(resource.id) ? 'selected' : ''}`}
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
                  style={{ borderColor: TYPE_COLORS[resource.type] || '#666' }}
                  title={`${resource.path}\n\nClick to select, double-click to preview`}
                >
                  <span className="dock-card-name">
                    {resource.type === 'command' && '/'}
                    {formatResourceName(resource.name)}
                  </span>
                  {resource.source === 'plugin' && (
                    <span className="dock-card-plugin">{resource.pluginName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Standard: Icon grid with preview bar on hover
  return (
    <div className="dock-layout">
      <div className="dock-preview">
        {hoveredResource ? (
          <>
            <span className="preview-icon" style={{ background: TYPE_COLORS[hoveredResource.type] }}>
              {TYPE_ICONS[hoveredResource.type]}
            </span>
            <div className="preview-info">
              <span className="preview-name">
                {hoveredResource.type === 'command' && '/'}
                {formatResourceName(hoveredResource.name)}
              </span>
              {hoveredResource.description && (
                <span className="preview-desc">{hoveredResource.description}</span>
              )}
            </div>
          </>
        ) : (
          <span className="preview-hint">Hover over an icon to see details</span>
        )}
      </div>

      <div className="dock-grid">
        {byType.map(group => (
          <div key={group.type} className="dock-section">
            <div className="dock-label">{group.label}</div>
            <div className="dock-items">
              {group.resources.map(resource => (
                <div
                  key={resource.id}
                  className={`dock-item ${selectedResources.has(resource.id) ? 'selected' : ''}`}
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
                  onMouseEnter={() => setHoveredResource(resource)}
                  onMouseLeave={() => setHoveredResource(null)}
                  style={{ background: TYPE_COLORS[resource.type] || '#666' }}
                >
                  <span className="dock-icon">{TYPE_ICONS[resource.type] || '\u{1F4C4}'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

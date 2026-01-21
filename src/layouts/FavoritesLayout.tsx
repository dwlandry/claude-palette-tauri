import { useState } from 'react'
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

export function FavoritesLayout({ groups, filter, onDragStart, onOpenFile, onPreview, favorites = new Set(), onToggleFavorite, variant, selectedResources, onToggleSelection }: LayoutProps) {
  const [showAll, setShowAll] = useState(false)

  const allResources = groups.flatMap(g => g.resources)
  const filtered = allResources.filter(
    r =>
      r.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.description?.toLowerCase().includes(filter.toLowerCase()) ||
      formatResourceName(r.name).toLowerCase().includes(filter.toLowerCase())
  )

  const favoriteResources = filtered.filter(r => favorites.has(r.id))
  const otherResources = filtered.filter(r => !favorites.has(r.id))

  const isEnhanced = variant === 'enhanced'

  return (
    <div className={`favorites-layout ${isEnhanced ? 'enhanced' : ''}`}>
      <div className="favorites-section">
        <div className="section-header">
          <span>Favorites</span>
          <span className="count">{favoriteResources.length}</span>
        </div>
        {favoriteResources.length === 0 ? (
          <div className="empty-favorites">Click star to add favorites</div>
        ) : (
          <div className="favorites-bar">
            {favoriteResources.map(resource => (
              <div
                key={resource.id}
                className={`favorite-item ${selectedResources.has(resource.id) ? 'selected' : ''}`}
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
                style={
                  isEnhanced
                    ? { borderTopColor: TYPE_COLORS[resource.type] || '#666' }
                    : { borderLeftColor: TYPE_COLORS[resource.type] || '#666' }
                }
                title={`${resource.path}\n\nClick to select, double-click to preview`}
              >
                <button
                  className="star-btn active"
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(resource.id) }}
                >
                  {'\u2605'}
                </button>
                <span className="fav-name">
                  {resource.type === 'command' && '/'}
                  {formatResourceName(resource.name)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="toggle-all" onClick={() => setShowAll(!showAll)}>
        {showAll ? 'Hide' : 'Show'} All Resources ({otherResources.length})
      </button>

      {showAll && (
        <div className={isEnhanced ? 'all-section-wrapper' : ''}>
          <div className="all-section">
            {otherResources.map(resource => (
              <div
                key={resource.id}
                className={`other-item ${selectedResources.has(resource.id) ? 'selected' : ''}`}
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
                title={`${resource.path}\n\nClick to select, double-click to preview`}
              >
                <button
                  className="star-btn"
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(resource.id) }}
                >
                  {'\u2606'}
                </button>
                <span className="type-badge" style={{ background: TYPE_COLORS[resource.type] }}>
                  {resource.type.slice(0, 1).toUpperCase()}
                </span>
                <span>
                  {resource.type === 'command' && '/'}
                  {formatResourceName(resource.name)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

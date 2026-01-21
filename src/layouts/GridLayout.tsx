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

const TYPE_EMOJIS: Record<string, string> = {
  agent: '\u{1F916}',
  command: '\u{26A1}',
  skill: '\u{1F3AF}',
  plan: '\u{1F4CB}',
  hook: '\u{1FA9D}',
  plugin: '\u{1F50C}',
}

export function GridLayout({ groups, filter, onDragStart, onOpenFile, onPreview, variant, selectedResources, onToggleSelection }: LayoutProps) {
  const allResources = groups.flatMap(g => g.resources)
  const filtered = allResources.filter(
    r =>
      r.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.description?.toLowerCase().includes(filter.toLowerCase()) ||
      formatResourceName(r.name).toLowerCase().includes(filter.toLowerCase())
  )

  const isEnhanced = variant === 'enhanced'

  return (
    <div className={`grid-layout ${isEnhanced ? 'enhanced' : ''}`}>
      {filtered.length === 0 ? (
        <div className="empty">No resources found</div>
      ) : (
        <div className="grid">
          {filtered.map(resource => (
            <div
              key={resource.id}
              className={`grid-tile ${selectedResources.has(resource.id) ? 'selected' : ''}`}
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
              title={`${resource.path}\n\nClick to select, double-click to preview, Shift+double-click to edit`}
            >
              <div
                className="tile-type"
                style={isEnhanced ? {} : { background: TYPE_COLORS[resource.type] || '#666' }}
              >
                {isEnhanced
                  ? TYPE_EMOJIS[resource.type] || '\u{1F4C4}'
                  : resource.type.slice(0, 3).toUpperCase()}
              </div>
              <div className="tile-name">
                {resource.type === 'command' && '/'}
                {formatResourceName(resource.name)}
              </div>
              {isEnhanced && resource.description && (
                <div className="tile-desc">{resource.description}</div>
              )}
              {resource.source === 'plugin' && (
                <div className="tile-plugin">{resource.pluginName}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

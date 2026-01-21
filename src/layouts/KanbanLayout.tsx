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

export function KanbanLayout({ groups, filter, onDragStart, onOpenFile, onPreview, variant, selectedResources, onToggleSelection }: LayoutProps) {
  const filteredGroups = groups.map(g => ({
    ...g,
    resources: g.resources.filter(
      r =>
        r.name.toLowerCase().includes(filter.toLowerCase()) ||
        r.description?.toLowerCase().includes(filter.toLowerCase()) ||
        formatResourceName(r.name).toLowerCase().includes(filter.toLowerCase())
    )
  })).filter(g => g.resources.length > 0)

  const isEnhanced = variant === 'enhanced'

  return (
    <div className={`kanban-layout ${isEnhanced ? 'enhanced' : ''}`}>
      {filteredGroups.length === 0 ? (
        <div className="empty">No resources found</div>
      ) : (
        filteredGroups.map(group => (
          <div key={group.type} className="kanban-column">
            <div
              className="kanban-header"
              style={{ background: TYPE_COLORS[group.type] || '#666' }}
            >
              <span>{group.label}</span>
              <span className="kanban-count">{group.resources.length}</span>
            </div>
            <div className="kanban-cards">
              {group.resources.map(resource => (
                <div
                  key={resource.id}
                  className={`kanban-card ${selectedResources.has(resource.id) ? 'selected' : ''}`}
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
                  <div className="card-name">
                    {resource.type === 'command' && '/'}
                    {formatResourceName(resource.name)}
                  </div>
                  {!isEnhanced && resource.source === 'plugin' && (
                    <div className="card-plugin">{resource.pluginName}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

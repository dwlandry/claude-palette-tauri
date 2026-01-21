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

export function TabsLayout({ groups, filter, onDragStart, onOpenFile, onPreview, variant, selectedResources, onToggleSelection }: LayoutProps) {
  const [activeTab, setActiveTab] = useState(groups[0]?.type || 'agent')

  const activeGroup = groups.find(g => g.type === activeTab)
  const filtered = activeGroup?.resources.filter(
    r =>
      r.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.description?.toLowerCase().includes(filter.toLowerCase()) ||
      formatResourceName(r.name).toLowerCase().includes(filter.toLowerCase())
  ) || []

  const isEnhanced = variant === 'enhanced'

  return (
    <div className={`tabs-layout ${isEnhanced ? 'enhanced' : ''}`}>
      <div className="tabs-header">
        {groups.map(group => (
          <button
            key={group.type}
            className={`tab ${activeTab === group.type ? 'active' : ''}`}
            onClick={() => setActiveTab(group.type)}
            style={{
              borderBottomColor: activeTab === group.type ? TYPE_COLORS[group.type] : 'transparent'
            }}
          >
            {group.label}
            <span className="tab-count">{group.resources.length}</span>
          </button>
        ))}
      </div>
      <div className="chips-container" key={activeTab}>
        {filtered.length === 0 ? (
          <div className="empty">No resources found</div>
        ) : (
          filtered.map(resource => (
            <span
              key={`${activeTab}-${resource.id}`}
              className={`chip ${selectedResources.has(resource.id) ? 'selected' : ''}`}
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
                  ? { borderLeftColor: TYPE_COLORS[resource.type] || '#666' }
                  : { background: TYPE_COLORS[resource.type] || '#666' }
              }
              title={`${resource.description || ''}\n${resource.path}\n\nClick to select, double-click to preview`}
            >
              {resource.type === 'command' && '/'}
              {formatResourceName(resource.name)}
              {isEnhanced && resource.source === 'plugin' && (
                <span className="chip-plugin">{resource.pluginName}</span>
              )}
            </span>
          ))
        )}
      </div>
    </div>
  )
}

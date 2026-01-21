import { useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Resource } from '../types'

interface PreviewModalProps {
  resource: Resource | null
  content: string
  onClose: () => void
}

export function PreviewModal({ resource, content, onClose }: PreviewModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!resource) return null

  const typeColors: Record<string, string> = {
    agent: '#3b82f6',
    command: '#10b981',
    skill: '#8b5cf6',
    hook: '#f59e0b',
    plan: '#ef4444',
    plugin: '#ec4899',
  }

  const typeColor = typeColors[resource.type] || '#6b7280'

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={e => e.stopPropagation()}>
        <div className="preview-header">
          <div className="preview-title">
            <span
              className="preview-type-badge"
              style={{ backgroundColor: typeColor }}
            >
              {resource.type}
            </span>
            <span className="preview-name">{resource.name}</span>
            {resource.pluginName && (
              <span className="preview-plugin">via {resource.pluginName}</span>
            )}
          </div>
          <button className="preview-close" onClick={onClose} title="Close (Esc)">
            &times;
          </button>
        </div>
        <div className="preview-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const inline = !match && !String(children).includes('\n')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

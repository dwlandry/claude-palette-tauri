import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { invoke } from '@tauri-apps/api/core'
import './preview-styles.css'

interface PreviewData {
  name: string
  type: string
  content: string
  path: string
  pluginName?: string
}

interface ParsedContent {
  frontmatter: Record<string, string> | null
  sections: { tag: string; content: string }[]
  remainingContent: string
}

function parseContent(content: string): ParsedContent {
  const lines = content.split('\n')
  const frontmatter: Record<string, string> = {}
  let bodyStartIndex = 0

  // Check for --- delimited frontmatter first
  if (lines[0]?.trim() === '---') {
    const endIndex = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
    if (endIndex > 0) {
      for (let i = 1; i < endIndex; i++) {
        const colonIdx = lines[i].indexOf(':')
        if (colonIdx > 0) {
          const key = lines[i].slice(0, colonIdx).trim()
          const value = lines[i].slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
          if (key && value) frontmatter[key] = value
        }
      }
      bodyStartIndex = endIndex + 1
    }
  } else {
    // Parse YAML-like frontmatter without delimiters (common in Claude agent files)
    // Look for consecutive key: value lines at the start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Stop if we hit an empty line or a line starting with < (XML tag)
      if (line.trim() === '' || line.trim().startsWith('<')) {
        bodyStartIndex = i
        break
      }
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0 && !line.trim().startsWith('-')) {
        const key = line.slice(0, colonIdx).trim()
        const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
        if (key && value) frontmatter[key] = value
        bodyStartIndex = i + 1
      } else {
        break
      }
    }
  }

  const body = lines.slice(bodyStartIndex).join('\n').trim()

  // Extract XML-like sections
  const sections: { tag: string; content: string }[] = []
  const xmlTagPattern = /<(\w+)>([\s\S]*?)<\/\1>/g
  let match
  let remainingContent = body

  while ((match = xmlTagPattern.exec(body)) !== null) {
    sections.push({
      tag: match[1],
      content: match[2].trim()
    })
  }

  // Remove XML sections from remaining content for standard markdown rendering
  remainingContent = body.replace(xmlTagPattern, '').trim()

  return {
    frontmatter: Object.keys(frontmatter).length > 0 ? frontmatter : null,
    sections,
    remainingContent
  }
}

const TYPE_COLORS: Record<string, string> = {
  agent: '#e94560',
  command: '#4ecdc4',
  skill: '#ffe66d',
  plan: '#95e1d3',
  hook: '#dda0dd',
  plugin: '#87ceeb'
}

const TYPE_LABELS: Record<string, string> = {
  agent: 'Agent',
  command: 'Slash Command',
  skill: 'Skill',
  plan: 'Plan',
  hook: 'Hook',
  plugin: 'Plugin'
}

const SECTION_LABELS: Record<string, string> = {
  role: 'Role',
  constraints: 'Constraints',
  workflow: 'Workflow',
  task_format: 'Task Format',
  output_format: 'Output Format',
  success_criteria: 'Success Criteria',
  examples: 'Examples',
  context: 'Context',
  instructions: 'Instructions',
  guidelines: 'Guidelines',
  prompt: 'Prompt',
}

const SECTION_ICONS: Record<string, string> = {
  role: '👤',
  constraints: '⚠️',
  workflow: '🔄',
  task_format: '📋',
  output_format: '📤',
  success_criteria: '✅',
  examples: '💡',
  context: '📖',
  instructions: '📝',
  guidelines: '📌',
  prompt: '💬',
}

function PreviewApp() {
  const [data, setData] = useState<PreviewData | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const path = params.get('path')
    const name = params.get('name')
    const type = params.get('type')
    const pluginName = params.get('pluginName')

    if (path && name && type) {
      invoke<string>('get_resource_content', { path })
        .then(content => {
          setData({
            name,
            type,
            content,
            path,
            pluginName: pluginName || undefined,
          })
        })
        .catch(e => {
          console.error('Failed to load content:', e)
        })
    }
  }, [])

  async function openInEditor(path: string) {
    try {
      await invoke('open_file', { path })
    } catch (e) {
      console.error('Failed to open file:', e)
    }
  }

  if (!data) {
    return (
      <div className="preview-loading">
        <div className="loading-spinner" />
        <p>Loading preview...</p>
      </div>
    )
  }

  const { frontmatter, sections, remainingContent } = parseContent(data.content)

  return (
    <div className="preview-container">
      {/* Header */}
      <header className="preview-header">
        <div className="header-main">
          <span
            className="type-badge"
            style={{ backgroundColor: TYPE_COLORS[data.type] || '#666' }}
          >
            {TYPE_LABELS[data.type] || data.type}
          </span>
          <h1 className="resource-name">
            {data.type === 'command' && <span className="command-slash">/</span>}
            {data.name}
          </h1>
          {data.pluginName && (
            <span className="plugin-source">from {data.pluginName}</span>
          )}
        </div>
        <div className="header-actions">
          <button
            className="action-btn"
            onClick={() => openInEditor(data.path)}
            title="Open in editor"
          >
            Edit
          </button>
        </div>
      </header>

      <div className="preview-body">
        <main className="content-main">
          {/* YAML Frontmatter as metadata cards */}
          {frontmatter && (
            <div className="frontmatter-section">
              <div className="metadata-grid">
                {Object.entries(frontmatter).map(([key, value]) => (
                  <div key={key} className="metadata-item">
                    <span className="metadata-key">{key}</span>
                    <span className="metadata-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* XML Sections as styled blocks */}
          {sections.length > 0 && (
            <div className="sections-container">
              {sections.map((section, i) => (
                <div key={i} className={`section-block section-${section.tag}`}>
                  <div className="section-header">
                    <span className="section-icon">{SECTION_ICONS[section.tag] || '📄'}</span>
                    <span className="section-title">{SECTION_LABELS[section.tag] || section.tag}</span>
                  </div>
                  <div className="section-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Remaining markdown content */}
          {remainingContent && (
            <article className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children, ...props }) => {
                    const text = String(children)
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    return <h1 id={id} {...props}>{children}</h1>
                  },
                  h2: ({ children, ...props }) => {
                    const text = String(children)
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    return <h2 id={id} {...props}>{children}</h2>
                  },
                  h3: ({ children, ...props }) => {
                    const text = String(children)
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    return <h3 id={id} {...props}>{children}</h3>
                  },
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const inline = !match && !String(children).includes('\n')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        showLineNumbers={true}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  blockquote: ({ children, ...props }) => {
                    const text = String(children)
                    const isWarning = /warning|caution|important/i.test(text)
                    const isNote = /note|tip|info/i.test(text)
                    const className = isWarning ? 'callout warning' : isNote ? 'callout note' : 'callout'
                    return <blockquote className={className} {...props}>{children}</blockquote>
                  },
                  strong: ({ children, ...props }) => {
                    return <strong className="highlight" {...props}>{children}</strong>
                  }
                }}
              >
                {remainingContent}
              </ReactMarkdown>
            </article>
          )}
        </main>
      </div>

      {/* Footer with file path */}
      <footer className="preview-footer">
        <span className="file-path" title={data.path}>{data.path}</span>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreviewApp />
  </React.StrictMode>
)

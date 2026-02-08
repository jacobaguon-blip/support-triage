import { useState } from 'react'
import './SourcesList.css'

const SOURCE_ICONS = {
  pylon: '🎫',
  linear: '📐',
  slack: '💬',
  file: '📁',
  classifier: '🤖',
  notion: '📝',
  analysis: '🔍'
}

const SOURCE_COLORS = {
  pylon: '#4a9eff',
  linear: '#5e6ad2',
  slack: '#e01e5a',
  file: '#f0b429',
  classifier: '#10b981',
  notion: '#999',
  analysis: '#f59e0b'
}

export default function SourcesList({ sources }) {
  const [expanded, setExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  // Deduplicate by id
  const unique = []
  const seen = new Set()
  for (const s of sources) {
    const key = `${s.type}-${s.id}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(s)
    }
  }

  const displaySources = expanded ? unique : unique.slice(0, 3)
  const hasMore = unique.length > 3

  return (
    <div className="sources-list">
      <div className="sources-list__header" onClick={() => hasMore && setExpanded(!expanded)}>
        <span className="sources-list__icon">📎</span>
        <span className="sources-list__label">
          Evidence ({unique.length} source{unique.length !== 1 ? 's' : ''})
        </span>
        {hasMore && (
          <span className="sources-list__toggle">
            {expanded ? '▾ collapse' : `▸ +${unique.length - 3} more`}
          </span>
        )}
      </div>
      <div className="sources-list__items">
        {displaySources.map((source, idx) => (
          <SourceChip key={idx} source={source} />
        ))}
      </div>
    </div>
  )
}

function SourceChip({ source }) {
  const icon = SOURCE_ICONS[source.type] || '📄'
  const color = SOURCE_COLORS[source.type] || '#888'

  const inner = (
    <span className="source-chip" style={{ borderColor: color }}>
      <span className="source-chip__icon">{icon}</span>
      <span className="source-chip__label">{source.label || source.id}</span>
    </span>
  )

  if (source.url) {
    return (
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="source-chip__link">
        {inner}
      </a>
    )
  }

  return inner
}

import { useState } from 'react'
import SourcesList from './SourcesList.jsx'
import './ConversationBubble.css'

function formatTimestamp(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
      hour12: true
    })
  } catch {
    return ts
  }
}

function BubbleAvatar({ name, role }) {
  const initials = (name || '?')
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className={`bubble-avatar bubble-avatar--${role}`}>
      {initials}
    </div>
  )
}

function CustomerBubble({ item }) {
  const sources = item.metadata?.sources
  return (
    <div className="bubble bubble--customer">
      <BubbleAvatar name={item.actor_name} role="customer" />
      <div className="bubble__body">
        <div className="bubble__header">
          <span className="bubble__name">{item.actor_name || 'Customer'}</span>
          <span className="bubble__time">{formatTimestamp(item.created_at)}</span>
        </div>
        <div className="bubble__content bubble__content--customer">
          <MarkdownContent text={item.content} />
        </div>
        <SourcesList sources={sources} />
      </div>
    </div>
  )
}

function AgentBubble({ item }) {
  return (
    <div className="bubble bubble--agent">
      <BubbleAvatar name={item.actor_name} role="agent" />
      <div className="bubble__body">
        <div className="bubble__header">
          <span className="bubble__name">{item.actor_name || 'Agent'}</span>
          <span className="bubble__badge bubble__badge--agent">Agent</span>
          <span className="bubble__time">{formatTimestamp(item.created_at)}</span>
        </div>
        <div className="bubble__content bubble__content--agent">
          <MarkdownContent text={item.content} />
        </div>
      </div>
    </div>
  )
}

function SystemPhaseBubble({ item }) {
  const [expanded, setExpanded] = useState(false)
  const sources = item.metadata?.sources

  return (
    <div className="bubble bubble--system-phase" onClick={() => setExpanded(!expanded)}>
      <div className="bubble__system-icon">⚙️</div>
      <div className="bubble__body">
        <div className="bubble__header">
          <span className="bubble__name">System</span>
          {item.phase && <span className="bubble__badge bubble__badge--phase">{item.phase}</span>}
          <span className="bubble__time">{formatTimestamp(item.created_at)}</span>
          <span className="bubble__expand-toggle">{expanded ? '▾' : '▸'}</span>
        </div>
        {expanded ? (
          <>
            <div className="bubble__content bubble__content--system">
              <MarkdownContent text={item.content} />
            </div>
            <SourcesList sources={sources} />
          </>
        ) : (
          <div className="bubble__preview">{item.content_preview || item.content?.substring(0, 120)}</div>
        )}
      </div>
    </div>
  )
}

function SystemResultBubble({ item }) {
  const [expanded, setExpanded] = useState(true)
  const docType = item.metadata?.doc_type
  const file = item.metadata?.file
  const sources = item.metadata?.sources

  const label = docType === 'summary' ? 'Investigation Summary'
    : docType === 'customer_response' ? 'Customer Response Draft'
    : docType === 'linear_draft' ? 'Linear Issue Draft'
    : item.phase === 'phase0' ? 'Classification Result'
    : item.phase === 'phase1' ? 'Context Gathering Findings'
    : 'System Result'

  return (
    <div className="bubble bubble--system-result">
      <div className="bubble__result-header" onClick={() => setExpanded(!expanded)}>
        <span className="bubble__result-icon">📋</span>
        <span className="bubble__result-label">{label}</span>
        {file && <span className="bubble__badge bubble__badge--file">{file}</span>}
        {sources && sources.length > 0 && (
          <span className="bubble__badge bubble__badge--sources">{sources.length} source{sources.length !== 1 ? 's' : ''}</span>
        )}
        <span className="bubble__time">{formatTimestamp(item.created_at)}</span>
        <span className="bubble__expand-toggle">{expanded ? '▾' : '▸'}</span>
      </div>
      {expanded ? (
        <>
          <div className="bubble__content bubble__content--result">
            <MarkdownContent text={item.content} />
          </div>
          <SourcesList sources={sources} />
        </>
      ) : (
        <div className="bubble__preview">{item.content_preview}</div>
      )}
    </div>
  )
}

function DecisionBubble({ item }) {
  const action = item.metadata?.action || 'action'
  const feedback = item.metadata?.feedback
  const actionClass = action === 'abort' ? 'red'
    : ['confirm', 'approve', 'continue'].includes(action) ? 'green'
    : 'yellow'

  return (
    <div className="bubble bubble--decision">
      <div className="bubble__body bubble__body--decision">
        <div className="bubble__header">
          <span className="bubble__name">{item.actor_name || 'TSE'}</span>
          <span className={`bubble__badge bubble__badge--action bubble__badge--${actionClass}`}>
            {action}
          </span>
          <span className="bubble__time">{formatTimestamp(item.created_at)}</span>
        </div>
        {feedback && (
          <div className="bubble__content bubble__content--decision">
            <p className="bubble__feedback">{feedback}</p>
          </div>
        )}
      </div>
      <BubbleAvatar name={item.actor_name || 'TSE'} role="tse" />
    </div>
  )
}

function ResetMarkerBubble({ item }) {
  return (
    <div className="bubble bubble--reset-marker">
      <div className="bubble__reset-line" />
      <div className="bubble__reset-label">
        <span className="bubble__reset-icon">↩️</span>
        {item.content_preview || item.content}
      </div>
      <div className="bubble__reset-line" />
    </div>
  )
}

function MarkdownContent({ text }) {
  if (!text) return null

  // Very lightweight markdown → HTML (bold, headers, lists, code, source citations)
  const html = text
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Highlight [Source: ...] inline citations
    .replace(/\[Source:\s*Linear\s+([A-Z]+-\d+)\]/gi, '<span class="inline-source inline-source--linear" title="Linear Issue">📐 $1</span>')
    .replace(/\[Source:\s*Slack\s+#([^\]]+)\]/gi, '<span class="inline-source inline-source--slack" title="Slack Channel">💬 #$1</span>')
    .replace(/\[Source:\s*Pylon\s+#?(\d+)\]/gi, '<span class="inline-source inline-source--pylon" title="Pylon Ticket">🎫 #$1</span>')
    .replace(/\[Source:\s*local\/([^\]]+)\]/gi, '<span class="inline-source inline-source--file" title="Local File">📁 $1</span>')
    .replace(/\[Source:\s*TSE analysis\]/gi, '<span class="inline-source inline-source--analysis" title="TSE Analysis">🔍 TSE analysis</span>')
    .replace(/\[Source:\s*([^\]]+)\]/gi, '<span class="inline-source" title="Source">📄 $1</span>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')

  return <div className="markdown-rendered" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />
}

export default function ConversationBubble({ item, investigation, isFaded, onBacktrackHere, isLast }) {
  const renderers = {
    customer_message: CustomerBubble,
    agent_message: AgentBubble,
    system_phase: SystemPhaseBubble,
    system_result: SystemResultBubble,
    human_decision: DecisionBubble,
    reset_marker: ResetMarkerBubble
  }

  const Renderer = renderers[item.type] || SystemPhaseBubble

  return (
    <div className={`conversation-bubble-wrapper ${isFaded ? 'conversation-bubble-wrapper--faded' : ''}`}>
      <Renderer item={item} investigation={investigation} />
    </div>
  )
}

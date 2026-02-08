import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import '../styles/DocumentPreview.css'

function DocumentPreview({ content, type, investigation }) {
  const [copyFeedback, setCopyFeedback] = useState('')

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content)
      setCopyFeedback('Copied!')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }

  const handleCreateLinear = async () => {
    if (!window.confirm('Create a Linear issue from this draft? This will open the draft for review.')) return
    try {
      navigator.clipboard.writeText(content)
      setCopyFeedback('Draft copied — paste into Linear')
      setTimeout(() => setCopyFeedback(''), 3000)
    } catch (err) {
      console.error('Failed:', err)
    }
  }

  const handlePushNotion = async () => {
    if (!window.confirm('Copy summary for Notion? You can paste this into your Notion knowledge base.')) return
    try {
      navigator.clipboard.writeText(content)
      setCopyFeedback('Summary copied for Notion')
      setTimeout(() => setCopyFeedback(''), 3000)
    } catch (err) {
      console.error('Failed:', err)
    }
  }

  if (!content) {
    return (
      <div className="document-preview empty">
        <div className="empty-content">
          {investigation.status === 'running' ? (
            <>
              <div className="loading-spinner"></div>
              <p>Investigation in progress...</p>
              <p className="text-muted">Documents will appear as phases complete</p>
            </>
          ) : investigation.status === 'queued' ? (
            <>
              <p>Investigation has not started</p>
              <p className="text-muted">Waiting to begin...</p>
            </>
          ) : investigation.status === 'waiting' ? (
            <>
              <p>Waiting at checkpoint</p>
              <p className="text-muted">Review and approve to continue</p>
            </>
          ) : (
            <>
              <p>No content available yet</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="document-preview">
      <div className="document-actions">
        <button className="btn btn-secondary" onClick={handleCopy}>
          {copyFeedback || '📋 Copy'}
        </button>

        {type === 'linear-draft' && (
          <button className="btn btn-primary" onClick={handleCreateLinear}>
            Create in Linear
          </button>
        )}

        {type === 'summary' && (
          <button className="btn btn-secondary" onClick={handlePushNotion}>
            Push to Notion
          </button>
        )}

        <div className="action-spacer" />

        <span className="doc-type-badge">{type.replace('-', ' ')}</span>
      </div>

      <div className="document-content">
        <ReactMarkdown className="markdown-preview">
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export default DocumentPreview

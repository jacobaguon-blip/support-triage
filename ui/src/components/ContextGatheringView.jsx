import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import DecisionLog from './DecisionLog'
import '../styles/PhaseViews.css'

const ContextGatheringView = ({ content, investigation, actions = [] }) => {
  const [copyFeedback, setCopyFeedback] = useState('')

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopyFeedback('Copied!')
    setTimeout(() => setCopyFeedback(''), 2000)
  }

  const renderLoading = () => (
    <div className="phase-views-loading">
      <div className="phase-views-spinner"></div>
      <p className="phase-views-loading-text">Gathering context from Linear and Slack...</p>
    </div>
  )

  const shouldShowLoading = () => {
    if (investigation.status === 'running') return true
    if (investigation.current_checkpoint === 'checkpoint_1_post_classification') return true
    return false
  }

  const renderContent = () => (
    <div className="phase-views-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="phase-views-card-header" style={{ margin: 0, marginBottom: 0 }}>Phase 1: Context Gathering</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => handleCopy(content)}
            className="phase-views-button"
          >
            Copy Findings
          </button>
          {copyFeedback && <span className="phase-views-copy-feedback">{copyFeedback}</span>}
        </div>
      </div>

      <div className="phase-views-markdown">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <DecisionLog actions={actions} checkpointName="Context Gathering" />
      </div>
    </div>
  )

  return (
    <div className="phase-views-container">
      {!content && shouldShowLoading()
        ? renderLoading()
        : !content
        ? <div className="phase-views-empty">No findings gathered yet</div>
        : renderContent()}
    </div>
  )
}

export default ContextGatheringView

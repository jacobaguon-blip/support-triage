import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import DecisionLog from './DecisionLog'
import '../styles/PhaseViews.css'

const ClassificationView = ({ ticketData, investigation, actions = [] }) => {
  const [bodyExpanded, setBodyExpanded] = useState(false)

  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase() || 'medium'
    switch (priorityLower) {
      case 'urgent':
        return 'phase-views-badge-priority-urgent'
      case 'high':
        return 'phase-views-badge-priority-high'
      case 'medium':
        return 'phase-views-badge-priority-medium'
      case 'low':
        return 'phase-views-badge-priority-low'
      default:
        return 'phase-views-badge-priority-medium'
    }
  }

  const renderLoading = () => (
    <div className="phase-views-loading">
      <div className="phase-views-spinner"></div>
      <p className="phase-views-loading-text">Fetching ticket data from Pylon...</p>
    </div>
  )

  const renderEmpty = () => (
    <div className="phase-views-empty">
      No classification data yet
    </div>
  )

  const renderContent = () => (
    <div className="phase-views-card">
      <h2 className="phase-views-card-header">{ticketData.title}</h2>

      <div className="phase-views-grid">
        <div className="phase-views-grid-item">
          <div className="phase-views-grid-label">Customer</div>
          <div className="phase-views-grid-value">{ticketData.customer_name}</div>
        </div>

        <div className="phase-views-grid-item">
          <div className="phase-views-grid-label">Classification</div>
          <span className="phase-views-badge phase-views-badge-classification">
            {ticketData.classification}
          </span>
        </div>

        <div className="phase-views-grid-item">
          <div className="phase-views-grid-label">Product Area</div>
          <div className="phase-views-grid-value">{ticketData.product_area}</div>
        </div>

        <div className="phase-views-grid-item">
          <div className="phase-views-grid-label">Connector</div>
          <span className="phase-views-badge phase-views-badge-connector">
            {ticketData.connector_name}
          </span>
        </div>

        <div className="phase-views-grid-item">
          <div className="phase-views-grid-label">Priority</div>
          <span className={`phase-views-badge ${getPriorityColor(ticketData.priority)}`}>
            {ticketData.priority}
          </span>
        </div>

        <div className="phase-views-grid-item">
          <div className="phase-views-grid-label">Ticket ID</div>
          <div className="phase-views-grid-value">{ticketData.ticket_id}</div>
        </div>
      </div>

      {ticketData.pylon_link && (
        <div className="phase-views-grid">
          <div className="phase-views-grid-item">
            <div className="phase-views-grid-label">Pylon Link</div>
            <a
              href={ticketData.pylon_link}
              target="_blank"
              rel="noopener noreferrer"
              className="phase-views-link"
            >
              Open in Pylon
            </a>
          </div>
        </div>
      )}

      <div className="phase-views-section">
        <h3 className="phase-views-section-title">Ticket Body</h3>
        <div className={`phase-views-truncated ${bodyExpanded ? 'expanded' : ''}`}>
          <div className="phase-views-section-content">
            <ReactMarkdown className="phase-views-markdown">
              {ticketData.body}
            </ReactMarkdown>
          </div>
          {!bodyExpanded && <div className="phase-views-truncate-button"></div>}
        </div>
        <button
          onClick={() => setBodyExpanded(!bodyExpanded)}
          className="phase-views-button phase-views-button-secondary"
          style={{ marginTop: '0.5rem' }}
        >
          {bodyExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <DecisionLog actions={actions} checkpointName="Classification" />
      </div>
    </div>
  )

  return (
    <div className="phase-views-container">
      {!ticketData && investigation.status === 'running'
        ? renderLoading()
        : !ticketData
        ? renderEmpty()
        : renderContent()}
    </div>
  )
}

export default ClassificationView

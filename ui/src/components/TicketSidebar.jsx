import { useState } from 'react'
import '../styles/TicketSidebar.css'

const STATUS_ICONS = {
  queued: '📋',
  running: '🔄',
  waiting: '⏸',
  paused: '⏸',
  complete: '✅',
  error: '❌'
}

const STATUS_LABELS = {
  queued: 'Queued',
  running: 'Running',
  waiting: 'Waiting',
  paused: 'Paused',
  complete: 'Complete',
  error: 'Error'
}

function TicketSidebar({ investigations, selectedTicketId, onSelectTicket, onNewTicket }) {
  const [filter, setFilter] = useState('all')

  const filteredInvestigations = investigations.filter(inv => {
    if (filter === 'active') {
      return ['queued', 'running', 'waiting', 'paused'].includes(inv.status)
    }
    if (filter === 'complete') {
      return inv.status === 'complete'
    }
    return true
  })

  const activeCount = investigations.filter(inv =>
    ['running', 'waiting'].includes(inv.status)
  ).length

  const queuedCount = investigations.filter(inv => inv.status === 'queued').length

  return (
    <aside className="ticket-sidebar">
      <div className="sidebar-header">
        <h2>Investigations</h2>
        <div className="concurrency-indicator">
          <span className="status-running">●</span> {activeCount} active
          {queuedCount > 0 && (
            <>
              <span className="status-queued"> · ●</span> {queuedCount} queued
            </>
          )}
        </div>
      </div>

      <div className="sidebar-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({investigations.length})
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${filter === 'complete' ? 'active' : ''}`}
          onClick={() => setFilter('complete')}
        >
          Done
        </button>
      </div>

      <div className="sidebar-list">
        {filteredInvestigations.length === 0 ? (
          <div className="empty-list">
            <p>No investigations {filter !== 'all' && `(${filter})`}</p>
          </div>
        ) : (
          filteredInvestigations.map(inv => (
            <TicketItem
              key={inv.id}
              investigation={inv}
              isSelected={inv.id === selectedTicketId}
              onClick={() => onSelectTicket(inv.id)}
            />
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-primary new-ticket-btn" onClick={onNewTicket}>
          + New Investigation
        </button>
      </div>
    </aside>
  )
}

function TicketItem({ investigation, isSelected, onClick }) {
  const statusIcon = STATUS_ICONS[investigation.status] || '●'

  let tags = []
  try {
    tags = investigation.tags ? JSON.parse(investigation.tags) : []
  } catch (e) {
    tags = []
  }

  const showCountdown = investigation.auto_proceed &&
    ['waiting', 'paused'].includes(investigation.status)

  return (
    <div
      className={`ticket-item ${isSelected ? 'selected' : ''} status-${investigation.status}`}
      onClick={onClick}
    >
      <div className="ticket-item-header">
        <span className="ticket-status">{statusIcon}</span>
        <span className="ticket-id">#{investigation.id}</span>
        <span className={`ticket-priority priority-${investigation.priority?.toLowerCase()}`}>
          {investigation.priority}
        </span>
      </div>

      <div className="ticket-item-body">
        <div className="ticket-customer">{investigation.customer_name}</div>
        <div className="ticket-classification">
          {investigation.classification?.replace(/_/g, ' ')}
          {investigation.connector_name && (
            <span className="connector-badge">{investigation.connector_name}</span>
          )}
        </div>

        {investigation.current_checkpoint && (
          <div className="ticket-checkpoint">
            {investigation.current_checkpoint.replace(/checkpoint_\d+_/, '').replace(/_/g, ' ')}
          </div>
        )}
      </div>

      {showCountdown && (
        <div className="ticket-countdown">
          <span className="countdown-icon">⏱</span>
          <span>Auto-proceed in ~10m</span>
        </div>
      )}

      {investigation.agent_mode === 'single' && (
        <div className="agent-mode-badge">Single Agent</div>
      )}
    </div>
  )
}

export default TicketSidebar

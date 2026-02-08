import { useState } from 'react'
import '../styles/TicketSidebar.css'

const STATUS_DOT_CLASS = {
  queued: 'dot--queued',
  running: 'dot--running',
  waiting: 'dot--waiting',
  paused: 'dot--waiting',
  complete: 'dot--complete',
  error: 'dot--error'
}

function TicketSidebar({ investigations, selectedTicketId, onSelectTicket, onNewTicket, style }) {
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

  return (
    <aside className="ticket-sidebar" style={style}>
      <div className="sidebar-header">
        <span className="sidebar-header__title">Investigations</span>
        {activeCount > 0 && (
          <span className="sidebar-header__count">{activeCount} active</span>
        )}
      </div>

      <div className="sidebar-filters">
        {[
          { key: 'all', label: `All (${investigations.length})` },
          { key: 'active', label: 'Active' },
          { key: 'complete', label: 'Done' }
        ].map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="sidebar-list">
        {filteredInvestigations.length === 0 ? (
          <div className="empty-list">No investigations</div>
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
        <button className="new-ticket-btn" onClick={onNewTicket}>
          + New Investigation
        </button>
      </div>
    </aside>
  )
}

function TicketItem({ investigation, isSelected, onClick }) {
  const dotClass = STATUS_DOT_CLASS[investigation.status] || ''

  const showCountdown = investigation.auto_proceed &&
    ['waiting', 'paused'].includes(investigation.status)

  return (
    <div
      className={`ticket-item ${isSelected ? 'selected' : ''} status-${investigation.status}`}
      onClick={onClick}
    >
      {/* Row 1: dot + ID + customer + priority */}
      <div className="ticket-row">
        <span className={`ticket-dot ${dotClass}`} />
        <span className="ticket-id">#{investigation.id}</span>
        <span className="ticket-customer">{investigation.customer_name}</span>
        <span className={`ticket-priority priority-${investigation.priority?.toLowerCase()}`}>
          {investigation.priority}
        </span>
      </div>

      {/* Row 2: classification + connector */}
      <div className="ticket-meta">
        <span className="ticket-classification">
          {investigation.classification?.replace(/_/g, ' ')}
        </span>
        {investigation.connector_name && (
          <span className="connector-badge">{investigation.connector_name}</span>
        )}
      </div>

      {/* Row 3: checkpoint (compact) */}
      {investigation.current_checkpoint && (
        <div className="ticket-checkpoint">
          {investigation.current_checkpoint.replace(/checkpoint_\d+_/, '').replace(/_/g, ' ')}
        </div>
      )}

      {showCountdown && (
        <div className="ticket-countdown">
          <span className="countdown-icon">⏱</span>
          Auto-proceed ~10m
        </div>
      )}
    </div>
  )
}

export default TicketSidebar

import { useState, useEffect } from 'react'
import { loadAdminStats } from '../services/sqlite'
import FeatureRequests from './FeatureRequests'
import '../styles/AdminPortal.css'

const CAPABILITIES = [
  {
    icon: '🔍',
    title: 'Automated Investigation',
    description: 'Multi-phase investigation pipeline: classify tickets, gather context from code/Slack/Linear, synthesize findings, and draft responses.',
    status: 'active'
  },
  {
    icon: '🤖',
    title: 'Agent Teams',
    description: 'Parallel specialist agents (code reviewer, issue historian, Slack researcher) working simultaneously to gather context.',
    status: 'active'
  },
  {
    icon: '✅',
    title: 'Checkpoint System',
    description: '4 mandatory human checkpoints: post-classification, post-context, investigation validation, and solution review.',
    status: 'active'
  },
  {
    icon: '💬',
    title: 'Conversation View',
    description: 'Real-time bubble stream showing customer messages, agent findings, system events, and checkpoint decisions.',
    status: 'active'
  },
  {
    icon: '📋',
    title: 'Classic Phase View',
    description: 'Structured card-based view organized by investigation phase — classification, context, findings, solution.',
    status: 'active'
  },
  {
    icon: '🔄',
    title: 'Hard Reset & Re-runs',
    description: 'Restart investigations from scratch. Previous runs archived. Full run history with conversation replay.',
    status: 'active'
  },
  {
    icon: '⏱',
    title: 'Smart Debounce',
    description: 'Auto-detect new customer messages via Pylon polling. 20-minute debounce timer before re-analysis triggers.',
    status: 'active'
  },
  {
    icon: '📊',
    title: 'Version Timeline',
    description: 'Snapshot-based version control for investigations. Backtrack to any previous state. Diff summaries.',
    status: 'active'
  },
  {
    icon: '🎨',
    title: 'Customer Response Drafts',
    description: 'AI-generated response drafts with learnable style guide. TSE proofreads, edits, and the system learns.',
    status: 'active'
  },
  {
    icon: '📐',
    title: 'Three-Column Layout',
    description: 'Redesign: sidebar + center workflow + persistent details pane. Classification always visible.',
    status: 'planned'
  },
  {
    icon: '📁',
    title: 'Feature Request System',
    description: 'In-app feature request board with priority, status tracking, and category filters. SQLite-backed CRUD.',
    status: 'active'
  },
  {
    icon: '🔗',
    title: 'MCP Integrations',
    description: 'Connected to Pylon, Linear, Slack, Notion, and GitHub via MCP servers for live data access.',
    status: 'active'
  }
]

const SPRINT_ITEMS = {
  backlog: [
    { title: 'Investigation search/filter', priority: 'P3', team: 'ops-dev' },
    { title: 'Export reports to PDF', priority: 'P3', team: 'ops-dev' },
    { title: 'Bulk ticket operations', priority: 'P4', team: 'ops-dev' },
    { title: 'Classification accuracy audit', priority: 'P2', team: 'triage' }
  ],
  'in-progress': [
    { title: 'Three-column layout redesign', priority: 'P1', team: 'ops-dev' },
    { title: 'Admin Portal', priority: 'P1', team: 'ops-dev' },
    { title: 'Investigation quality standards', priority: 'P2', team: 'triage' }
  ],
  review: [
    { title: 'Feature Request UI', priority: 'P2', team: 'ops-dev' },
    { title: 'QA reference documents', priority: 'P2', team: 'triage' }
  ],
  done: [
    { title: 'Two-team structure', priority: 'P1', team: 'ops-dev' },
    { title: 'Draggable sidebar resize', priority: 'P2', team: 'ops-dev' },
    { title: 'Responsive breakpoints QA', priority: 'P2', team: 'ops-dev' },
    { title: 'C1 light theme', priority: 'P1', team: 'ops-dev' }
  ]
}

function AdminPortal({ onClose }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const data = await loadAdminStats()
      setStats(data)
      setLoading(false)
    }
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'features', label: 'Feature Board' },
    { id: 'project', label: 'Project Status' }
  ]

  return (
    <div className="admin-portal">
      <div className="admin-portal__header">
        <div className="admin-portal__header-left">
          <h2 className="admin-portal__title">Admin Portal</h2>
          <span className="admin-portal__badge">Internal</span>
        </div>
        <button className="btn btn-secondary" onClick={onClose}>
          ✕ Close
        </button>
      </div>

      <div className="admin-portal__tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-portal__tab ${activeTab === tab.id ? 'admin-portal__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-portal__content">
        {activeTab === 'dashboard' && (
          <DashboardTab stats={stats} loading={loading} />
        )}
        {activeTab === 'features' && (
          <FeatureRequests />
        )}
        {activeTab === 'project' && (
          <ProjectStatusTab />
        )}
      </div>
    </div>
  )
}

function DashboardTab({ stats, loading }) {
  const invStats = stats?.investigations || {}
  const frStats = stats?.featureRequests || {}

  return (
    <div className="admin-dashboard">
      {/* Stats Row */}
      <div className="admin-stats">
        <div className="admin-stat-card admin-stat-card--primary">
          <div className="admin-stat-card__icon">📋</div>
          <div className="admin-stat-card__value">
            {loading ? '—' : invStats.total || 0}
          </div>
          <div className="admin-stat-card__label">Total Investigations</div>
        </div>
        <div className="admin-stat-card admin-stat-card--blue">
          <div className="admin-stat-card__icon">⚡</div>
          <div className="admin-stat-card__value">
            {loading ? '—' : invStats.active || 0}
          </div>
          <div className="admin-stat-card__label">Active</div>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <div className="admin-stat-card__icon">✓</div>
          <div className="admin-stat-card__value">
            {loading ? '—' : invStats.completed || 0}
          </div>
          <div className="admin-stat-card__label">Completed</div>
        </div>
        <div className="admin-stat-card admin-stat-card--purple">
          <div className="admin-stat-card__icon">💡</div>
          <div className="admin-stat-card__value">
            {loading ? '—' : frStats.total || 0}
          </div>
          <div className="admin-stat-card__label">Feature Requests</div>
        </div>
      </div>

      {/* App Capabilities */}
      <div className="admin-section">
        <h3 className="admin-section__title">App Capabilities</h3>
        <p className="admin-section__subtitle">
          Current functionality of the Support Triage System
        </p>
        <div className="capability-grid">
          {CAPABILITIES.map((cap, i) => (
            <div key={i} className="capability-card">
              <div className="capability-card__icon">{cap.icon}</div>
              <div className="capability-card__content">
                <div className="capability-card__header">
                  <h4 className="capability-card__title">{cap.title}</h4>
                  <span className={`capability-card__status capability-card__status--${cap.status}`}>
                    {cap.status === 'active' ? 'Active' : cap.status === 'in-progress' ? 'Building' : 'Planned'}
                  </span>
                </div>
                <p className="capability-card__description">{cap.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Overview */}
      <div className="admin-section">
        <h3 className="admin-section__title">Team Overview</h3>
        <p className="admin-section__subtitle">
          Two teams working together to build and operate the triage system
        </p>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-card__header">
              <h4 className="team-card__name">Support Operations Dev</h4>
              <span className="team-card__badge team-card__badge--dev">ops-dev</span>
            </div>
            <div className="team-card__lead">
              <div className="team-card__lead-avatar">AC</div>
              <div>
                <div className="team-card__lead-name">Alex Chen</div>
                <div className="team-card__lead-role">Engineering Lead</div>
              </div>
            </div>
            <div className="team-card__divider" />
            <h5 className="team-card__section-title">Responsibilities</h5>
            <ul className="team-card__responsibilities">
              <li>React frontend + Express backend</li>
              <li>UI features and C1 design system</li>
              <li>Standalone tools and scripts</li>
              <li>Automation and MCP integrations</li>
              <li>Feature backlog management</li>
            </ul>
            <div className="team-card__footer">
              <span className="team-card__contact">@Alex</span>
              <span className="team-card__style">Pragmatic, detail-oriented</span>
            </div>
          </div>

          <div className="team-card">
            <div className="team-card__header">
              <h4 className="team-card__name">Support Triage</h4>
              <span className="team-card__badge team-card__badge--triage">triage</span>
            </div>
            <div className="team-card__lead">
              <div className="team-card__lead-avatar team-card__lead-avatar--triage">MT</div>
              <div>
                <div className="team-card__lead-name">Morgan Torres</div>
                <div className="team-card__lead-role">Triage Lead</div>
              </div>
            </div>
            <div className="team-card__divider" />
            <h5 className="team-card__section-title">Responsibilities</h5>
            <ul className="team-card__responsibilities">
              <li>Investigation workflow quality</li>
              <li>Classification accuracy</li>
              <li>Customer response drafting</li>
              <li>Escalation decisions</li>
              <li>QA standards and process</li>
            </ul>
            <div className="team-card__footer">
              <span className="team-card__contact">@Morgan</span>
              <span className="team-card__style">Empathetic, evidence-based</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="admin-section">
        <h3 className="admin-section__title">Tech Stack</h3>
        <div className="tech-stack">
          <div className="tech-item">
            <span className="tech-item__label">Frontend</span>
            <span className="tech-item__value">React 18 + Vite 5</span>
          </div>
          <div className="tech-item">
            <span className="tech-item__label">Backend</span>
            <span className="tech-item__value">Express 5 (port 3001)</span>
          </div>
          <div className="tech-item">
            <span className="tech-item__label">Database</span>
            <span className="tech-item__value">SQLite via sql.js</span>
          </div>
          <div className="tech-item">
            <span className="tech-item__label">Design</span>
            <span className="tech-item__value">C1 Light Theme (Inter)</span>
          </div>
          <div className="tech-item">
            <span className="tech-item__label">Dev Server</span>
            <span className="tech-item__value">localhost:3000</span>
          </div>
          <div className="tech-item">
            <span className="tech-item__label">Integrations</span>
            <span className="tech-item__value">Pylon, Linear, Slack, Notion, GitHub</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectStatusTab() {
  const columns = [
    { id: 'backlog', label: 'Backlog', color: 'var(--text-muted)' },
    { id: 'in-progress', label: 'In Progress', color: 'var(--accent-blue)' },
    { id: 'review', label: 'In Review', color: 'var(--accent-yellow)' },
    { id: 'done', label: 'Done', color: 'var(--accent-green)' }
  ]

  const totalItems = Object.values(SPRINT_ITEMS).flat().length
  const doneItems = SPRINT_ITEMS.done.length
  const progressPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  return (
    <div className="project-status">
      <div className="sprint-header">
        <div className="sprint-header__info">
          <h3 className="sprint-header__name">Sprint 2</h3>
          <span className="sprint-header__dates">Feb 10 – Feb 23, 2026</span>
        </div>
        <div className="sprint-header__progress-wrapper">
          <div className="sprint-header__progress-text">
            {doneItems}/{totalItems} items ({progressPercent}%)
          </div>
          <div className="sprint-header__progress-bar">
            <div
              className="sprint-header__progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="kanban-board">
        {columns.map(col => {
          const items = SPRINT_ITEMS[col.id] || []
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column__header">
                <span
                  className="kanban-column__dot"
                  style={{ backgroundColor: col.color }}
                />
                <span className="kanban-column__label">{col.label}</span>
                <span className="kanban-column__count">{items.length}</span>
              </div>
              <div className="kanban-column__items">
                {items.map((item, i) => (
                  <div key={i} className="kanban-item">
                    <div className="kanban-item__title">{item.title}</div>
                    <div className="kanban-item__meta">
                      <span className={`kanban-item__priority kanban-item__priority--${item.priority.toLowerCase()}`}>
                        {item.priority}
                      </span>
                      <span className={`kanban-item__team kanban-item__team--${item.team}`}>
                        {item.team}
                      </span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="kanban-column__empty">No items</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="admin-section" style={{ marginTop: 24 }}>
        <h3 className="admin-section__title">Sprint Goals</h3>
        <div className="sprint-goals">
          <div className="sprint-goal">
            <span className="sprint-goal__team sprint-goal__team--ops-dev">Ops Dev</span>
            <span className="sprint-goal__text">Ship three-column layout redesign and Admin Portal. Feature Request UI in review.</span>
          </div>
          <div className="sprint-goal">
            <span className="sprint-goal__team sprint-goal__team--triage">Triage</span>
            <span className="sprint-goal__text">Establish investigation quality standards. Begin classification accuracy audit. Document QA process.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPortal

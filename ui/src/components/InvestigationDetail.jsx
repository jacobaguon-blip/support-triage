import { useState, useEffect } from 'react'
import CheckpointPanel from './CheckpointPanel'
import PhaseTabBar from './PhaseTabBar'
import PhaseContent from './PhaseContent'
import ConversationStream from './ConversationStream'
import CheckpointPrompt from './CheckpointPrompt'
import VersionTimeline from './VersionTimeline'
import BacktrackBar from './BacktrackBar'
import RunTabs from './RunTabs'
import { loadInvestigationFiles, loadActivityLog, loadVersions, loadRuns } from '../services/sqlite'
import '../styles/InvestigationDetail.css'

const CHECKPOINT_TO_PHASE = {
  checkpoint_1_post_classification: 'phase0',
  checkpoint_2_post_context_gathering: 'phase1',
  checkpoint_3_investigation_validation: 'phase2',
  checkpoint_4_solution_check: 'phase3'
}

function InvestigationDetail({ investigation, onUpdate }) {
  const [viewMode, setViewMode] = useState('conversation')
  const [activePhase, setActivePhase] = useState('phase0')
  const [selectedRunNumber, setSelectedRunNumber] = useState(investigation?.current_run_number || 1)
  const [runs, setRuns] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [files, setFiles] = useState({
    ticketData: null,
    phase1Findings: null,
    summary: null,
    customerResponse: null,
    linearDraft: null,
    checkpointActions: [],
    agentTranscript: null,
    metrics: null
  })
  const [activity, setActivity] = useState([])
  const [versions, setVersions] = useState([])

  useEffect(() => {
    const load = () => {
      loadInvestigationFiles(investigation.id).then(setFiles)
      loadActivityLog(investigation.id).then(setActivity)
      loadVersions(investigation.id).then(setVersions)
      loadRuns(investigation.id).then(setRuns)
    }
    load()
    if (['running', 'waiting'].includes(investigation.status)) {
      const interval = setInterval(load, 2000)
      return () => clearInterval(interval)
    }
  }, [investigation.id, investigation.status, investigation.current_checkpoint, investigation.current_run_number])

  const selectedRunData = runs.find(r => r.run_number === selectedRunNumber)

  useEffect(() => {
    if (investigation.current_checkpoint) {
      const phase = CHECKPOINT_TO_PHASE[investigation.current_checkpoint]
      if (phase) setActivePhase(phase)
    }
  }, [investigation.current_checkpoint])

  useEffect(() => {
    if (investigation.current_run_number) {
      setSelectedRunNumber(investigation.current_run_number)
    }
  }, [investigation.current_run_number])

  const handleVersionRestore = () => { if (onUpdate) onUpdate() }
  const handleClearAnchor = () => { if (onUpdate) onUpdate() }
  const handleCheckpointAction = () => { if (onUpdate) onUpdate() }
  const handleHardResetComplete = () => { if (onUpdate) onUpdate() }

  const isViewingCurrentRun = selectedRunNumber === (investigation.current_run_number || 1)

  const ticketTitle = (() => {
    try {
      return JSON.parse(investigation.snapshot || '{}').title || ''
    } catch { return '' }
  })()

  const pylonLink = (() => {
    try {
      const snap = JSON.parse(investigation.snapshot || '{}')
      return snap.pylon_link || `https://app.usepylon.com/issues/${investigation.id}`
    } catch { return `https://app.usepylon.com/issues/${investigation.id}` }
  })()

  return (
    <div className="investigation-detail">
      {/* ── Compact Ticket Info Bar ── */}
      <div className="ticket-bar">
        <div className="ticket-bar__left">
          <span className="ticket-bar__id">#{investigation.id}</span>
          {ticketTitle && <span className="ticket-bar__title">{ticketTitle}</span>}
          <span className="ticket-bar__sep">·</span>
          <span className="ticket-bar__customer">{investigation.customer_name}</span>
          {investigation.connector_name && (
            <>
              <span className="ticket-bar__sep">·</span>
              <span className="connector-badge">{investigation.connector_name}</span>
            </>
          )}
        </div>
        <div className="ticket-bar__right">
          <span className={`ticket-bar__pill priority-${investigation.priority?.toLowerCase()}`}>
            {investigation.priority}
          </span>
          <span className={`ticket-bar__pill status-${investigation.status}`}>
            {investigation.status}
          </span>
          <a href={pylonLink} target="_blank" rel="noopener noreferrer" className="ticket-bar__link">
            Pylon ↗
          </a>
          <button
            className={`ticket-bar__drawer-btn ${drawerOpen ? 'ticket-bar__drawer-btn--active' : ''}`}
            onClick={() => setDrawerOpen(!drawerOpen)}
            title={drawerOpen ? 'Hide panel' : 'Show details'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="14" height="14" rx="2" />
              <line x1="10" y1="1" x2="10" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="detail-body">
        <div className="detail-content">
          {/* Top controls row */}
          <div className="detail-controls">
            <RunTabs
              runs={runs}
              investigation={investigation}
              selectedRun={selectedRunNumber}
              onSelectRun={setSelectedRunNumber}
              onResetComplete={handleHardResetComplete}
            />
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === 'conversation' ? 'view-mode-btn--active' : ''}`}
                onClick={() => setViewMode('conversation')}
              >
                Conversation
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'classic' ? 'view-mode-btn--active' : ''}`}
                onClick={() => setViewMode('classic')}
              >
                Classic
              </button>
            </div>
          </div>

          <PhaseTabBar
            activePhase={activePhase}
            investigation={investigation}
            checkpointActions={files.checkpointActions || []}
            onPhaseClick={setActivePhase}
            runCheckpoint={selectedRunData?.current_checkpoint}
            runStatus={selectedRunData?.status}
          />

          {viewMode === 'conversation' ? (
            <div className="conversation-view">
              <BacktrackBar
                investigation={investigation}
                onClearAnchor={handleClearAnchor}
                versions={versions}
              />
              <ConversationStream
                investigation={investigation}
                onBacktrackTo={handleVersionRestore}
                runNumber={selectedRunNumber}
              />
              {investigation.status === 'waiting' && isViewingCurrentRun && (
                <CheckpointPrompt
                  investigation={investigation}
                  onActionComplete={handleCheckpointAction}
                />
              )}
            </div>
          ) : (
            <PhaseContent
              activePhase={activePhase}
              files={files}
              investigation={investigation}
              activity={activity}
            />
          )}
        </div>

        {/* ── Side Drawer (Version Timeline / Checkpoint Panel) ── */}
        {drawerOpen && (
          <div className="detail-drawer">
            <div className="drawer-header">
              <span className="drawer-title">
                {viewMode === 'conversation' ? 'Version History' : 'Checkpoints'}
              </span>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
            </div>
            <div className="drawer-body">
              {viewMode === 'conversation' ? (
                <VersionTimeline investigation={investigation} onRestore={handleVersionRestore} />
              ) : (
                <CheckpointPanel investigation={investigation} onUpdate={onUpdate} />
              )}

              {/* Ticket details section */}
              <div className="drawer-section">
                <div className="drawer-section__title">Ticket Details</div>
                <div className="drawer-detail-row">
                  <span className="drawer-detail-label">Classification</span>
                  <span className="drawer-detail-value">{investigation.classification?.replace(/_/g, ' ')}</span>
                </div>
                <div className="drawer-detail-row">
                  <span className="drawer-detail-label">Product Area</span>
                  <span className="drawer-detail-value">{investigation.product_area}</span>
                </div>
                <div className="drawer-detail-row">
                  <span className="drawer-detail-label">Agent Mode</span>
                  <span className="drawer-detail-value">{investigation.agent_mode}</span>
                </div>
                {investigation.suggested_priority && investigation.suggested_priority !== investigation.priority && (
                  <div className="drawer-detail-row">
                    <span className="drawer-detail-label">Suggested Priority</span>
                    <span className="drawer-detail-value priority-suggestion">{investigation.suggested_priority}</span>
                  </div>
                )}
                {investigation.created_at && (
                  <div className="drawer-detail-row">
                    <span className="drawer-detail-label">Created</span>
                    <span className="drawer-detail-value">{new Date(investigation.created_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InvestigationDetail

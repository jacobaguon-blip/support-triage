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
  const [viewMode, setViewMode] = useState('conversation') // 'conversation' | 'classic'
  const [activePhase, setActivePhase] = useState('phase0')
  const [selectedRunNumber, setSelectedRunNumber] = useState(investigation?.current_run_number || 1)
  const [runs, setRuns] = useState([])
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

  // Load investigation data + runs together
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

  // Derive the selected run's data for per-run phase scoping
  const selectedRunData = runs.find(r => r.run_number === selectedRunNumber)

  // Auto-navigate to the active phase when investigation checkpoint changes (classic view)
  useEffect(() => {
    if (investigation.current_checkpoint) {
      const phase = CHECKPOINT_TO_PHASE[investigation.current_checkpoint]
      if (phase) setActivePhase(phase)
    }
  }, [investigation.current_checkpoint])

  // Sync selectedRunNumber when investigation's current run changes (e.g. after hard reset)
  useEffect(() => {
    if (investigation.current_run_number) {
      setSelectedRunNumber(investigation.current_run_number)
    }
  }, [investigation.current_run_number])

  const handleVersionRestore = () => {
    if (onUpdate) onUpdate()
  }

  const handleClearAnchor = () => {
    if (onUpdate) onUpdate()
  }

  const handleCheckpointAction = () => {
    if (onUpdate) onUpdate()
  }

  const handleHardResetComplete = () => {
    if (onUpdate) onUpdate()
  }

  const isViewingCurrentRun = selectedRunNumber === (investigation.current_run_number || 1)

  return (
    <div className="investigation-detail">
      <div className="detail-left">
        {/* Ticket Info Card */}
        <div className="ticket-info-card card">
          <div className="ticket-info-header">
            <h2>#{investigation.id}</h2>
            {(() => {
              try {
                const snap = JSON.parse(investigation.snapshot || '{}')
                return snap.title ? (
                  <div className="ticket-title">{snap.title}</div>
                ) : null
              } catch { return null }
            })()}
            <a
              href={(() => {
                try {
                  const snap = JSON.parse(investigation.snapshot || '{}')
                  return snap.pylon_link || `https://app.usepylon.com/issues/${investigation.id}`
                } catch { return `https://app.usepylon.com/issues/${investigation.id}` }
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="pylon-link"
            >
              Open in Pylon
            </a>
          </div>

          <div className="info-row">
            <span className="info-label">Customer:</span>
            <span className="info-value">{investigation.customer_name}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Classification:</span>
            <span className="info-value classification">
              {investigation.classification?.replace(/_/g, ' ')}
            </span>
          </div>

          {investigation.connector_name && (
            <div className="info-row">
              <span className="info-label">Connector:</span>
              <span className="connector-badge">{investigation.connector_name}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">Product Area:</span>
            <span className="info-value">{investigation.product_area}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Priority:</span>
            <span className={`priority-${investigation.priority?.toLowerCase()}`}>
              {investigation.priority}
            </span>
            {investigation.suggested_priority && investigation.suggested_priority !== investigation.priority && (
              <span className="priority-suggestion">
                &rarr; {investigation.suggested_priority}
              </span>
            )}
          </div>

          <div className="info-row">
            <span className="info-label">Status:</span>
            <span className={`status-${investigation.status}`}>
              {investigation.status}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Agent Mode:</span>
            <span className="info-value">{investigation.agent_mode}</span>
          </div>

          {investigation.created_at && (
            <div className="info-row">
              <span className="info-label">Created:</span>
              <span className="info-value">
                {new Date(investigation.created_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
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

        {/* Version Timeline (conversation mode) or Checkpoint Panel (classic mode) */}
        {viewMode === 'conversation' ? (
          <VersionTimeline
            investigation={investigation}
            onRestore={handleVersionRestore}
          />
        ) : (
          <CheckpointPanel
            investigation={investigation}
            onUpdate={onUpdate}
          />
        )}
      </div>

      <div className="detail-right">
        {/* Run selector + phase bar always visible at top */}
        <RunTabs
          runs={runs}
          investigation={investigation}
          selectedRun={selectedRunNumber}
          onSelectRun={setSelectedRunNumber}
          onResetComplete={handleHardResetComplete}
        />
        <PhaseTabBar
          activePhase={activePhase}
          investigation={investigation}
          checkpointActions={files.checkpointActions || []}
          onPhaseClick={setActivePhase}
          runCheckpoint={selectedRunData?.current_checkpoint}
          runStatus={selectedRunData?.status}
        />

        {/* View-specific content below */}
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
    </div>
  )
}

export default InvestigationDetail

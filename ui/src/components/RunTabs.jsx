import { useState } from 'react'
import { hardReset } from '../services/sqlite.js'
import './RunTabs.css'

const TRIGGER_LABELS = {
  manual: 'Initial',
  new_response: 'New reply',
  hard_reset: 'Reset'
}

function HardResetDialog({ onConfirm, onCancel, resetting, error }) {
  return (
    <div className="hard-reset-dialog-overlay" onClick={resetting ? undefined : onCancel}>
      <div className="hard-reset-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="hard-reset-dialog__title">
          <span>🔄</span> Hard Reset Investigation
        </h3>
        <div className="hard-reset-dialog__body">
          This will <strong>archive the current investigation</strong> and start fresh from Phase 0.
          The previous run will be preserved as a separate tab for reference, but the active investigation
          will be completely restarted.
        </div>
        {error && (
          <div className="hard-reset-dialog__error">
            Reset failed: {error}
          </div>
        )}
        <div className="hard-reset-dialog__actions">
          <button className="hard-reset-dialog__cancel" onClick={onCancel} disabled={resetting}>
            Cancel
          </button>
          <button className="hard-reset-dialog__confirm" onClick={onConfirm} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset & Restart'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RunTabs({ runs, investigation, selectedRun, onSelectRun, onResetComplete }) {
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState(null)

  const ticketId = investigation?.id

  const handleHardReset = async () => {
    console.log('[RunTabs] Hard reset clicked, ticketId:', ticketId)
    setResetting(true)
    setResetError(null)
    try {
      const result = await hardReset(ticketId)
      console.log('[RunTabs] Hard reset success:', result)
      setShowResetDialog(false)
      if (onResetComplete) onResetComplete()
    } catch (err) {
      console.error('[RunTabs] Hard reset failed:', err)
      setResetError(err.message || 'Unknown error')
    } finally {
      setResetting(false)
    }
  }

  const openResetDialog = () => {
    setResetError(null)
    setShowResetDialog(true)
  }

  const selectedRunData = runs.find(r => r.run_number === selectedRun)
  const hasMultipleRuns = runs.length > 1

  return (
    <div className="run-selector">
      <div className="run-selector__row">
        {hasMultipleRuns ? (
          <div className="run-selector__dropdown-wrap">
            <select
              className="run-selector__dropdown"
              value={selectedRun}
              onChange={e => onSelectRun(Number(e.target.value))}
            >
              {runs.map(run => (
                <option key={run.id} value={run.run_number}>
                  Investigation {run.run_number}
                  {run.status === 'superseded' ? ' (archived)' : ''}
                  {' \u2014 '}{TRIGGER_LABELS[run.trigger_type] || run.trigger_type}
                </option>
              ))}
            </select>
            {selectedRunData && (
              <span className={`run-selector__status run-selector__status--${selectedRunData.status}`} />
            )}
          </div>
        ) : (
          <span className="run-selector__label">
            Investigation {selectedRun}
            {runs.length === 1 && runs[0]?.status && (
              <span className={`run-selector__status run-selector__status--${runs[0].status}`} />
            )}
          </span>
        )}

        <button
          className="hard-reset-btn hard-reset-btn--compact"
          onClick={openResetDialog}
          disabled={investigation?.status === 'running' || resetting}
          title={investigation?.status === 'running' ? 'Wait for the investigation to finish' : 'Reset and restart from scratch'}
        >
          🔄 {hasMultipleRuns ? 'Reset' : 'Hard Reset'}
        </button>
      </div>

      {showResetDialog && (
        <HardResetDialog
          onConfirm={handleHardReset}
          onCancel={() => setShowResetDialog(false)}
          resetting={resetting}
          error={resetError}
        />
      )}
    </div>
  )
}

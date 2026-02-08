import { useState } from 'react'
import { sendCheckpointAction } from '../services/sqlite'
import '../styles/CheckpointPanel.css'

const CHECKPOINT_ACTIONS = {
  checkpoint_1_post_classification: {
    name: 'Post-Classification Review',
    actions: [
      { label: '✓ Confirm', action: 'confirm', type: 'success' },
      { label: '↩ Reclassify', action: 'reclassify', type: 'warning' },
      { label: '✂ Split Issues', action: 'split', type: 'secondary' },
      { label: '✕ Abort', action: 'abort', type: 'danger' }
    ]
  },
  checkpoint_2_post_context_gathering: {
    name: 'Post-Context Gathering',
    actions: [
      { label: '✓ Continue', action: 'continue', type: 'success' },
      { label: '🔍 Search Deeper', action: 'search_deeper', type: 'warning' },
      { label: '➡ Redirect Focus', action: 'redirect', type: 'secondary' },
      { label: '+ Add Context', action: 'add_context', type: 'secondary' },
      { label: '✕ Abort', action: 'abort', type: 'danger' }
    ]
  },
  checkpoint_3_investigation_validation: {
    name: 'Investigation Validation',
    actions: [
      { label: '✓ Looks Correct', action: 'approve', type: 'success' },
      { label: '✏ Corrections Needed', action: 'corrections', type: 'warning' },
      { label: '🔬 Level 3 Analysis', action: 'level3', type: 'secondary' },
      { label: '↩ Re-investigate', action: 'reinvestigate', type: 'secondary' },
      { label: '✕ Abort', action: 'abort', type: 'danger' }
    ]
  },
  checkpoint_4_solution_check: {
    name: 'Solution Check',
    actions: [
      { label: '✓ Solves Issue', action: 'approve', type: 'success' },
      { label: '✏ Revise Response', action: 'revise', type: 'warning' },
      { label: '⬆ Escalate', action: 'escalate', type: 'secondary' },
      { label: '📋 Create Linear Issue', action: 'create_linear', type: 'primary' },
      { label: '✕ Abort', action: 'abort', type: 'danger' }
    ]
  }
}

function CheckpointPanel({ investigation, onUpdate }) {
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [loading, setLoading] = useState(false)

  const checkpoint = CHECKPOINT_ACTIONS[investigation.current_checkpoint]

  if (!checkpoint) {
    return (
      <div className="checkpoint-panel card">
        <h3>No Active Checkpoint</h3>
        <p className="text-muted">Investigation is in progress...</p>
      </div>
    )
  }

  const handleAction = async (action) => {
    setLoading(true)
    try {
      await sendCheckpointAction(
        investigation.id,
        investigation.current_checkpoint,
        action,
        feedback || null
      )
      setFeedback('')
      setShowFeedback(false)
      onUpdate()
    } catch (err) {
      console.error('Checkpoint action failed:', err)
      alert(`Action failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkpoint-panel card">
      <div className="checkpoint-header">
        <h3>{checkpoint.name}</h3>
        {investigation.status === 'waiting' && (
          <span className="waiting-indicator">⏸ Waiting for approval</span>
        )}
      </div>

      <div className="checkpoint-description">
        {investigation.current_checkpoint === 'checkpoint_1_post_classification' && (
          <p>Review the ticket classification below. Confirm if correct, or reclassify.</p>
        )}
        {investigation.current_checkpoint === 'checkpoint_2_post_context_gathering' && (
          <p>Review the findings from context gathering. Continue to synthesis or search deeper.</p>
        )}
        {investigation.current_checkpoint === 'checkpoint_3_investigation_validation' && (
          <p>Validate the investigation documents. Approve if accurate or request corrections.</p>
        )}
        {investigation.current_checkpoint === 'checkpoint_4_solution_check' && (
          <p>Final check — confirm the solution and customer response are ready.</p>
        )}
      </div>

      <div className="checkpoint-actions">
        {checkpoint.actions.map(({ label, action, type }) => (
          <button
            key={action}
            className={`btn btn-${type} checkpoint-btn`}
            onClick={() => handleAction(action)}
            disabled={loading}
          >
            {loading ? 'Processing...' : label}
          </button>
        ))}
      </div>

      <div className="checkpoint-feedback">
        <button
          className="feedback-toggle"
          onClick={() => setShowFeedback(!showFeedback)}
        >
          {showFeedback ? '▼' : '▶'} Add feedback / instructions
        </button>

        {showFeedback && (
          <textarea
            className="feedback-input"
            placeholder="Provide additional instructions or context..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
        )}
      </div>

      {investigation.auto_proceed === 1 && (
        <div className="auto-proceed-notice">
          ⏱ Auto-proceed enabled (10 minute timeout)
        </div>
      )}
    </div>
  )
}

export default CheckpointPanel

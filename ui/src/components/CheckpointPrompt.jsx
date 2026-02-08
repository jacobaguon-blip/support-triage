import { useState } from 'react'
import { sendCheckpointAction } from '../services/sqlite.js'
import './CheckpointPrompt.css'

const CHECKPOINT_CONFIG = {
  checkpoint_1_post_classification: {
    title: 'Classification Review',
    question: 'The ticket has been classified. What would you like to do?',
    actions: [
      { id: 'confirm', label: 'Confirm & Gather Context', icon: '✓', style: 'primary' },
      { id: 'reclassify', label: 'Reclassify', icon: '↻', style: 'secondary' },
      { id: 'abort', label: 'Pause Investigation', icon: '⏸', style: 'danger' }
    ]
  },
  checkpoint_2_post_context_gathering: {
    title: 'Context Review',
    question: 'Context has been gathered. Ready to synthesize documents?',
    actions: [
      { id: 'confirm', label: 'Synthesize Documents', icon: '✓', style: 'primary' },
      { id: 'search_deeper', label: 'Search Deeper', icon: '🔍', style: 'secondary' },
      { id: 'abort', label: 'Pause Investigation', icon: '⏸', style: 'danger' }
    ]
  },
  checkpoint_3_investigation_validation: {
    title: 'Investigation Validation',
    question: 'Documents are ready for review. Approve the investigation?',
    actions: [
      { id: 'approve', label: 'Approve', icon: '✓', style: 'primary' },
      { id: 'revise', label: 'Request Revision', icon: '✏️', style: 'secondary' },
      { id: 'abort', label: 'Pause Investigation', icon: '⏸', style: 'danger' }
    ]
  },
  checkpoint_4_solution_check: {
    title: 'Solution Check',
    question: 'Ready to finalize and close this investigation?',
    actions: [
      { id: 'approve', label: 'Complete Investigation', icon: '✓', style: 'primary' },
      { id: 'continue', label: 'Continue Investigating', icon: '→', style: 'secondary' },
      { id: 'abort', label: 'Pause Investigation', icon: '⏸', style: 'danger' }
    ]
  }
}

export default function CheckpointPrompt({ investigation, onActionComplete }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const checkpoint = investigation?.current_checkpoint
  const config = CHECKPOINT_CONFIG[checkpoint]

  if (!config || investigation?.status !== 'waiting') return null

  const handleAction = async (actionId) => {
    if (['reclassify', 'search_deeper', 'revise', 'abort'].includes(actionId)) {
      setPendingAction(actionId)
      setFeedbackOpen(true)
      return
    }

    setSubmitting(true)
    try {
      await sendCheckpointAction(investigation.id, checkpoint, actionId, feedback || null)
      if (onActionComplete) onActionComplete()
    } catch (err) {
      console.error('Checkpoint action failed:', err)
    }
    setSubmitting(false)
  }

  const handleSubmitWithFeedback = async () => {
    if (!pendingAction) return
    setSubmitting(true)
    try {
      await sendCheckpointAction(investigation.id, checkpoint, pendingAction, feedback || null)
      setFeedback('')
      setFeedbackOpen(false)
      setPendingAction(null)
      if (onActionComplete) onActionComplete()
    } catch (err) {
      console.error('Checkpoint action failed:', err)
    }
    setSubmitting(false)
  }

  return (
    <div className="checkpoint-prompt">
      <div className="checkpoint-prompt__header">
        <span className="checkpoint-prompt__icon">🔔</span>
        <span className="checkpoint-prompt__title">{config.title}</span>
      </div>
      <p className="checkpoint-prompt__question">{config.question}</p>
      <div className="checkpoint-prompt__actions">
        {config.actions.map(action => (
          <button
            key={action.id}
            className={`checkpoint-prompt__btn checkpoint-prompt__btn--${action.style}`}
            onClick={() => handleAction(action.id)}
            disabled={submitting}
          >
            <span className="checkpoint-prompt__btn-icon">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
      {feedbackOpen && (
        <div className="checkpoint-prompt__feedback">
          <textarea
            className="checkpoint-prompt__textarea"
            placeholder={`Add context for "${pendingAction}"...`}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
          />
          <div className="checkpoint-prompt__feedback-actions">
            <button
              className="checkpoint-prompt__btn checkpoint-prompt__btn--primary checkpoint-prompt__btn--sm"
              onClick={handleSubmitWithFeedback}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : `Submit ${pendingAction}`}
            </button>
            <button
              className="checkpoint-prompt__btn checkpoint-prompt__btn--secondary checkpoint-prompt__btn--sm"
              onClick={() => { setFeedbackOpen(false); setPendingAction(null); setFeedback('') }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

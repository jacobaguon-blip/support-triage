import { updateInvestigation } from '../services/sqlite.js'
import './BacktrackBar.css'

export default function BacktrackBar({ investigation, onClearAnchor, versions }) {
  if (!investigation?.anchor_version_id) return null

  // Check if anchor differs from current
  if (investigation.anchor_version_id === investigation.current_version_id) return null

  const anchorVersion = versions?.find(v => v.id === investigation.anchor_version_id)
  const label = anchorVersion
    ? `v${anchorVersion.version_number}: ${anchorVersion.label || anchorVersion.checkpoint}`
    : `Version ${investigation.anchor_version_id}`

  const handleClear = async () => {
    try {
      await updateInvestigation(investigation.id, { anchor_version_id: null })
      if (onClearAnchor) onClearAnchor()
    } catch (err) {
      console.error('Failed to clear anchor:', err)
    }
  }

  return (
    <div className="backtrack-bar">
      <div className="backtrack-bar__content">
        <span className="backtrack-bar__icon">📌</span>
        <span className="backtrack-bar__label">
          Anchored to: <strong>{label}</strong>
        </span>
        <span className="backtrack-bar__hint">Items after this point are faded</span>
      </div>
      <div className="backtrack-bar__actions">
        <button className="backtrack-bar__btn backtrack-bar__btn--clear" onClick={handleClear}>
          Clear Anchor
        </button>
      </div>
    </div>
  )
}

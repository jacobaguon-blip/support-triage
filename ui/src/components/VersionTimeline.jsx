import { useState, useEffect } from 'react'
import { loadVersions, restoreVersion } from '../services/sqlite.js'
import './VersionTimeline.css'

export default function VersionTimeline({ investigation, onRestore }) {
  const [versions, setVersions] = useState([])
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [restoring, setRestoring] = useState(false)

  const ticketId = investigation?.id

  useEffect(() => {
    if (!ticketId) return
    let cancelled = false

    const fetch = async () => {
      const data = await loadVersions(ticketId)
      if (!cancelled) setVersions(data)
    }

    fetch()
    const interval = setInterval(fetch, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [ticketId])

  const handleRestore = async (versionId, mode) => {
    setRestoring(true)
    try {
      const result = await restoreVersion(ticketId, versionId, mode)
      setRestoreTarget(null)
      if (onRestore) onRestore(result)
    } catch (err) {
      console.error('Restore failed:', err)
    }
    setRestoring(false)
  }

  if (versions.length === 0) {
    return (
      <div className="version-timeline version-timeline--empty">
        <h4 className="version-timeline__title">Version History</h4>
        <p className="version-timeline__empty-text">No versions yet</p>
      </div>
    )
  }

  return (
    <div className="version-timeline">
      <h4 className="version-timeline__title">Version History</h4>
      <div className="version-timeline__list">
        {versions.map((v, i) => {
          const isCurrent = investigation?.current_version_id === v.id
          const isAnchor = investigation?.anchor_version_id === v.id

          return (
            <div
              key={v.id}
              className={`version-node ${isCurrent ? 'version-node--current' : ''} ${isAnchor ? 'version-node--anchor' : ''}`}
            >
              <div className="version-node__connector">
                <div className="version-node__dot" />
                {i < versions.length - 1 && <div className="version-node__line" />}
              </div>
              <div className="version-node__content">
                <div className="version-node__header">
                  <span className="version-node__number">v{v.version_number}</span>
                  {isCurrent && <span className="version-node__badge version-node__badge--current">Current</span>}
                  {isAnchor && <span className="version-node__badge version-node__badge--anchor">📌 Anchor</span>}
                </div>
                <div className="version-node__label">{v.label || v.checkpoint}</div>
                <div className="version-node__meta">
                  {v.diff_summary && <span className="version-node__diff">{v.diff_summary}</span>}
                  <span className="version-node__time">
                    {v.created_at ? new Date(v.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                  </span>
                </div>
                {!isCurrent && (
                  <button
                    className="version-node__restore-btn"
                    onClick={() => setRestoreTarget(restoreTarget === v.id ? null : v.id)}
                  >
                    Restore
                  </button>
                )}
                {restoreTarget === v.id && (
                  <div className="version-restore-dialog">
                    <button
                      className="version-restore-dialog__btn version-restore-dialog__btn--rollback"
                      onClick={() => handleRestore(v.id, 'rollback')}
                      disabled={restoring}
                    >
                      {restoring ? 'Restoring...' : '↩ Roll Back'}
                    </button>
                    <button
                      className="version-restore-dialog__btn version-restore-dialog__btn--refocus"
                      onClick={() => handleRestore(v.id, 'refocus')}
                      disabled={restoring}
                    >
                      {restoring ? 'Restoring...' : '🎯 Re-focus'}
                    </button>
                    <p className="version-restore-dialog__hint">
                      Roll Back = fully restore state. Re-focus = set as anchor, keep newer items visible.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

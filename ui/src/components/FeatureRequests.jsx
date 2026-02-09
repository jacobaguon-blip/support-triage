import { useState, useEffect } from 'react'
import { loadFeatureRequests, createFeatureRequest, updateFeatureRequest, deleteFeatureRequest } from '../services/sqlite'
import '../styles/FeatureRequests.css'

function FeatureRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'P3',
    status: 'new',
    requester: 'TSE',
    category: 'UI Feature'
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Load requests on mount
  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await loadFeatureRequests()
      setRequests(data)
    } catch (err) {
      console.error('Failed to load feature requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      priority: 'P3',
      status: 'new',
      requester: 'TSE',
      category: 'UI Feature'
    })
    setEditingId(null)
  }

  const handleFormChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.title.trim() || !form.description.trim()) {
      alert('Title and description are required')
      return
    }

    try {
      if (editingId) {
        const updated = await updateFeatureRequest(editingId, form)
        setRequests(prev =>
          prev.map(req => req.id === editingId ? updated : req)
        )
      } else {
        const newRequest = await createFeatureRequest(form)
        setRequests(prev => [newRequest, ...prev])
      }

      resetForm()
      setShowForm(false)
    } catch (err) {
      alert(`Failed to save request: ${err.message}`)
    }
  }

  const handleEdit = (request) => {
    setForm({
      title: request.title,
      description: request.description,
      priority: request.priority,
      status: request.status,
      requester: request.requester,
      category: request.category
    })
    setEditingId(request.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteFeatureRequest(id)
      setRequests(prev => prev.filter(req => req.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      alert(`Failed to delete request: ${err.message}`)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await updateFeatureRequest(id, { status: newStatus })
      setRequests(prev =>
        prev.map(req => req.id === id ? updated : req)
      )
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    }
  }

  // Sort requests by priority then by date
  const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 }
  const sortedRequests = [...requests].sort((a, b) => {
    const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
    if (priorityDiff !== 0) return priorityDiff
    return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
  })

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="feature-requests">
      <div className="feature-requests__header">
        <div className="feature-requests__title-section">
          <h3 className="feature-requests__title">Feature Requests</h3>
          <span className="feature-requests__count">{requests.length}</span>
        </div>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
          >
            + New Request
          </button>
        )}
      </div>

      {loading && <div className="feature-requests__loading">Loading...</div>}

      {showForm && (
        <form className="feature-request-form card" onSubmit={handleSubmit}>
          <div className="feature-request-form__header">
            <h4>{editingId ? 'Edit Request' : 'New Feature Request'}</h4>
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
              aria-label="Close form"
            >
              ✕
            </button>
          </div>

          <div className="feature-request-form__field">
            <label htmlFor="fr-title">Title *</label>
            <input
              id="fr-title"
              type="text"
              value={form.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              placeholder="Brief title for the feature"
              required
            />
          </div>

          <div className="feature-request-form__field">
            <label htmlFor="fr-description">Description *</label>
            <textarea
              id="fr-description"
              value={form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="What do you need? What problem does this solve?"
              rows="4"
              required
            />
          </div>

          <div className="feature-request-form__row">
            <div className="feature-request-form__field">
              <label htmlFor="fr-priority">Priority</label>
              <select
                id="fr-priority"
                value={form.priority}
                onChange={(e) => handleFormChange('priority', e.target.value)}
              >
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>
            </div>

            <div className="feature-request-form__field">
              <label htmlFor="fr-category">Category</label>
              <select
                id="fr-category"
                value={form.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
              >
                <option value="UI Feature">UI Feature</option>
                <option value="Tool">Tool</option>
                <option value="Automation">Automation</option>
                <option value="Investigation Workflow">Investigation Workflow</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="feature-request-form__row">
            <div className="feature-request-form__field">
              <label htmlFor="fr-status">Status</label>
              <select
                id="fr-status"
                value={form.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                <option value="new">New</option>
                <option value="in-progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="feature-request-form__field">
              <label htmlFor="fr-requester">Requester</label>
              <input
                id="fr-requester"
                type="text"
                value={form.requester}
                onChange={(e) => handleFormChange('requester', e.target.value)}
                placeholder="Name or team"
              />
            </div>
          </div>

          <div className="feature-request-form__actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Request' : 'Create Request'}
            </button>
          </div>
        </form>
      )}

      {!showForm && !loading && sortedRequests.length === 0 && (
        <div className="feature-requests__empty">
          <p>No feature requests yet. Click 'New Request' to add one.</p>
        </div>
      )}

      {!showForm && sortedRequests.length > 0 && (
        <div className="feature-requests__list">
          {sortedRequests.map(request => (
            <div key={request.id} className="feature-request-card card">
              <div className="feature-request-card__header">
                <h4 className="feature-request-card__title">{request.title}</h4>
                <div className="feature-request-card__actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(request)}
                    title="Edit request"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon btn-icon--danger"
                    onClick={() => setDeleteConfirm(request.id)}
                    title="Delete request"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <p className="feature-request-card__description">{request.description}</p>

              <div className="feature-request-card__meta">
                <span className={`priority-badge priority-${request.priority.toLowerCase()}`}>
                  {request.priority}
                </span>
                <select
                  className={`status-badge status-${(request.status || 'new').replace('-', '_')}`}
                  value={request.status}
                  onChange={(e) => handleStatusChange(request.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="done">Done</option>
                </select>
                <span className="feature-request-card__category">{request.category}</span>
                <span className="feature-request-card__requester">{request.requester}</span>
                <span className="feature-request-card__date">
                  {formatDate(request.created_at || request.createdAt)}
                </span>
              </div>

              {deleteConfirm === request.id && (
                <div className="feature-request-card__delete-confirm">
                  <p>Are you sure you want to delete this request?</p>
                  <div className="feature-request-card__confirm-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(request.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FeatureRequests

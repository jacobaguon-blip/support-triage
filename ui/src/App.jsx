import { useState, useEffect, useRef, useCallback } from 'react'
import TicketSidebar from './components/TicketSidebar'
import InvestigationDetail from './components/InvestigationDetail'
import SettingsPane from './components/SettingsPane'
import AdminPortal from './components/AdminPortal'
import { loadInvestigations, loadSettings, createInvestigation } from './services/sqlite'
import './styles/App.css'

const MIN_SIDEBAR = 180
const MAX_SIDEBAR = 450
const DEFAULT_SIDEBAR = 280

function App() {
  const [investigations, setInvestigations] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState(null)
  const selectedTicketIdRef = useRef(null)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(DEFAULT_SIDEBAR)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = sidebarWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [sidebarWidth])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return
      const delta = e.clientX - dragStartX.current
      const newWidth = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, dragStartWidth.current + delta))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicketId
  }, [selectedTicketId])

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadInvestigations()
        setInvestigations(data)

        const settingsData = await loadSettings()
        setSettings(settingsData)

        if (!selectedTicketIdRef.current && data.length > 0) {
          setSelectedTicketId(data[0].id)
        }
        setError(null)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Cannot connect to backend server. Make sure to run: node server.js')
      }
    }

    loadData()
    const interval = setInterval(loadData, 2000)
    return () => clearInterval(interval)
  }, [])

  const selectedInvestigation = investigations.find(inv => inv.id === selectedTicketId)

  const handleNewTicket = async () => {
    const ticketId = prompt('Enter Pylon ticket ID:')
    if (!ticketId) return

    const id = parseInt(ticketId)
    if (isNaN(id)) {
      alert('Please enter a valid numeric ticket ID')
      return
    }

    try {
      const result = await createInvestigation(id, settings?.agent_mode?.default || 'team')
      setSelectedTicketId(id)

      // Reload investigations to show the new one
      const data = await loadInvestigations()
      setInvestigations(data)
    } catch (err) {
      if (err.message.includes('already exists')) {
        // If investigation already exists, just select it
        setSelectedTicketId(id)
      } else {
        alert(`Error: ${err.message}`)
      }
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Support Triage System</h1>
        <div className="header-actions">
          {error && (
            <span className="error-indicator" title={error}>Backend Disconnected</span>
          )}
          <button
            className={`btn ${showAdmin ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setShowAdmin(!showAdmin)
              if (!showAdmin) setShowSettings(false)
            }}
          >
            Admin
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowSettings(!showSettings)
              if (!showSettings) setShowAdmin(false)
            }}
          >
            Settings
          </button>
        </div>
      </header>

      <div className="app-body">
        <TicketSidebar
          investigations={investigations}
          selectedTicketId={selectedTicketId}
          onSelectTicket={setSelectedTicketId}
          onNewTicket={handleNewTicket}
          style={{ width: sidebarWidth }}
        />

        <div
          className="resize-handle"
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR)}
          title="Drag to resize · Double-click to reset"
        >
          <div className="resize-handle__line" />
        </div>

        <main className="main-content">
          {showAdmin ? (
            <AdminPortal onClose={() => setShowAdmin(false)} />
          ) : showSettings ? (
            <SettingsPane
              settings={settings}
              onClose={() => setShowSettings(false)}
            />
          ) : selectedInvestigation ? (
            <InvestigationDetail
              investigation={selectedInvestigation}
              onUpdate={() => {
                loadInvestigations().then(setInvestigations)
              }}
            />
          ) : (
            <div className="empty-state">
              <h2>No investigation selected</h2>
              <p>Select an investigation from the sidebar or start a new one</p>
              <button className="btn btn-primary" onClick={handleNewTicket}>
                + New Investigation
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App

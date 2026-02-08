import { useState, useEffect, useRef } from 'react'
import TicketSidebar from './components/TicketSidebar'
import InvestigationDetail from './components/InvestigationDetail'
import SettingsPane from './components/SettingsPane'
import { loadInvestigations, loadSettings, createInvestigation } from './services/sqlite'
import './styles/App.css'

function App() {
  const [investigations, setInvestigations] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState(null)
  const selectedTicketIdRef = useRef(null)

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
            className="btn btn-secondary"
            onClick={() => setShowSettings(!showSettings)}
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
        />

        <main className="main-content">
          {showSettings ? (
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

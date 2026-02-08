import { useState, useEffect, useRef, useCallback } from 'react'
import { loadConversation, loadRunConversation, syncResponses, getDebounceStatus } from '../services/sqlite.js'
import ConversationBubble from './ConversationBubble.jsx'
import './ConversationStream.css'

export default function ConversationStream({ investigation, onBacktrackTo, runNumber }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [debounce, setDebounce] = useState({ active: false })
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const lastFetchRef = useRef(null)
  const shouldAutoScroll = useRef(true)

  const ticketId = investigation?.id
  const anchorVersionId = investigation?.anchor_version_id

  // Track if user has scrolled up (disable auto-scroll)
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 80
  }, [])

  // Initial load + polling
  useEffect(() => {
    if (!ticketId) return
    let cancelled = false

    const fetchItems = async (isInitial) => {
      try {
        const since = isInitial ? null : lastFetchRef.current

        // Use run-scoped endpoint if runNumber is provided
        const data = runNumber
          ? await loadRunConversation(ticketId, runNumber, since)
          : await loadConversation(ticketId, since)

        if (cancelled) return

        if (isInitial) {
          setItems(data)
          setLoading(false)
        } else if (data.length > 0) {
          setItems(prev => {
            const existingIds = new Set(prev.map(i => i.id))
            const newItems = data.filter(i => !existingIds.has(i.id))
            return newItems.length > 0 ? [...prev, ...newItems] : prev
          })
        }

        if (data.length > 0) {
          lastFetchRef.current = data[data.length - 1].created_at
        }
      } catch (err) {
        console.error('[ConversationStream] Fetch error:', err)
        if (isInitial) setLoading(false)
      }
    }

    // Reset state on run change
    setItems([])
    setLoading(true)
    lastFetchRef.current = null

    // Initial load
    fetchItems(true)

    // Also trigger response sync on initial load (only for current run)
    if (!runNumber || runNumber === investigation?.current_run_number) {
      syncResponses(ticketId).catch(() => {})
    }

    // Poll every 2s when investigation is running
    const interval = setInterval(() => {
      if (investigation?.status === 'running' || investigation?.status === 'waiting') {
        fetchItems(false)
      }
    }, 2000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [ticketId, investigation?.status, runNumber])

  // Poll debounce status
  useEffect(() => {
    if (!ticketId) return
    let cancelled = false

    const checkDebounce = async () => {
      const status = await getDebounceStatus(ticketId)
      if (!cancelled) setDebounce(status)
    }

    checkDebounce()
    const interval = setInterval(checkDebounce, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [ticketId])

  // Auto-scroll to bottom when new items arrive
  useEffect(() => {
    if (shouldAutoScroll.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [items])

  if (loading) {
    return (
      <div className="conversation-stream conversation-stream--loading">
        <div className="conversation-loading-indicator">
          <div className="conversation-loading-dots">
            <span /><span /><span />
          </div>
          <p>Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="conversation-stream conversation-stream--empty">
        <div className="conversation-empty-state">
          <div className="conversation-empty-icon">💬</div>
          <h3>No conversation yet</h3>
          <p>Items will appear here as the investigation progresses.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="conversation-stream"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <div className="conversation-stream__spine" />
      <div className="conversation-stream__items">
        {items.map((item, index) => {
          const isFaded = anchorVersionId &&
            item.version_id &&
            item.version_id < anchorVersionId

          return (
            <ConversationBubble
              key={item.id || index}
              item={item}
              investigation={investigation}
              isFaded={isFaded}
              onBacktrackHere={onBacktrackTo}
              isLast={index === items.length - 1}
            />
          )
        })}

        {debounce.active && (
          <div className="conversation-debounce-indicator">
            <span className="conversation-debounce-icon">⏳</span>
            <span>
              New customer message detected — investigation will restart
              {debounce.pendingMessages ? ` (${debounce.pendingMessages} pending)` : ''}
              {debounce.remainingMs ? ` in ~${Math.ceil(debounce.remainingMs / 60000)} min` : ' after quiet period'}
            </span>
          </div>
        )}

        {investigation?.status === 'running' && (
          <div className="conversation-live-indicator">
            <div className="conversation-live-dot" />
            <span>Investigation in progress...</span>
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}

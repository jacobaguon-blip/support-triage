import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import ClassificationView from './ClassificationView'
import ContextGatheringView from './ContextGatheringView'
import DecisionLog from './DecisionLog'
import ActivityFeed from './ActivityFeed'
import '../styles/PhaseViews.css'

const PHASE_CHECKPOINTS = {
  phase0: 'checkpoint_1_post_classification',
  phase1: 'checkpoint_2_post_context_gathering',
  phase2: 'checkpoint_3_investigation_validation',
  phase3: 'checkpoint_4_solution_check'
}

const PhaseContent = ({ activePhase, files, investigation, activity = [] }) => {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    customerResponse: true,
    linearDraft: true
  })
  const [copyFeedback, setCopyFeedback] = useState('')

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopyFeedback('Copied!')
    setTimeout(() => setCopyFeedback(''), 2000)
  }

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  const getFilteredActions = (phase) => {
    const checkpoint = PHASE_CHECKPOINTS[phase]
    return files.checkpointActions?.filter(a => a.checkpoint === checkpoint) || []
  }

  const shouldShowWaitingState = (phase) => {
    const phaseOrder = ['phase0', 'phase1', 'phase2', 'phase3']
    const currentPhaseIndex = phaseOrder.indexOf(phase)
    const checkpointOrder = [
      'checkpoint_1_post_classification',
      'checkpoint_2_post_context_gathering',
      'checkpoint_3_investigation_validation',
      'checkpoint_4_solution_check'
    ]
    const currentCheckpointIndex = checkpointOrder.indexOf(investigation.current_checkpoint)
    return currentPhaseIndex > currentCheckpointIndex
  }

  const isPhaseRunning = (phase) => {
    return investigation.status === 'running' && !shouldShowWaitingState(phase)
  }

  const renderCollapsibleSection = (sectionKey, title, content, hasCopy = true) => {
    const isExpanded = expandedSections[sectionKey]

    return (
      <div key={sectionKey} className="phase-views-collapsible">
        <div
          className="phase-views-collapsible-header"
          onClick={() => toggleSection(sectionKey)}
        >
          <h3 className="phase-views-collapsible-title">{title}</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {hasCopy && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopy(content)
                }}
                className="phase-views-button"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Copy
              </button>
            )}
            <span className={`phase-views-collapsible-chevron ${isExpanded ? 'open' : 'closed'}`}>
              ▼
            </span>
          </div>
        </div>
        {isExpanded && (
          <div className="phase-views-collapsible-content">
            <ReactMarkdown className="phase-views-markdown">
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    )
  }

  // Phase 0: Classification
  if (activePhase === 'phase0') {
    return (
      <div className="phase-views-container">
        <ClassificationView
          ticketData={files.ticketData}
          investigation={investigation}
          actions={getFilteredActions('phase0')}
        />
        <ActivityFeed
          activities={activity}
          phase="phase0"
          isLive={isPhaseRunning('phase0')}
        />
      </div>
    )
  }

  // Phase 1: Context Gathering
  if (activePhase === 'phase1') {
    return (
      <div className="phase-views-container">
        <ContextGatheringView
          content={files.phase1Findings}
          investigation={investigation}
          actions={getFilteredActions('phase1')}
        />
        <ActivityFeed
          activities={activity}
          phase="phase1"
          isLive={isPhaseRunning('phase1')}
        />
      </div>
    )
  }

  // Phase 2: Investigation
  if (activePhase === 'phase2') {
    if (shouldShowWaitingState('phase2')) {
      return (
        <div className="phase-views-container">
          <div className="phase-views-empty">
            Waiting for previous phases to complete
          </div>
          <ActivityFeed
            activities={activity}
            phase="phase2"
            isLive={false}
          />
        </div>
      )
    }

    if (!files.summary && !files.customerResponse && !files.linearDraft) {
      if (investigation.status === 'running' || investigation.current_checkpoint === 'checkpoint_2_post_context_gathering') {
        return (
          <div className="phase-views-container">
            <div className="phase-views-loading">
              <div className="phase-views-spinner"></div>
              <p className="phase-views-loading-text">Investigating ticket...</p>
            </div>
            <ActivityFeed
              activities={activity}
              phase="phase2"
              isLive={true}
            />
          </div>
        )
      }
      return (
        <div className="phase-views-container">
          <div className="phase-views-empty">
            No investigation data yet
          </div>
          <ActivityFeed
            activities={activity}
            phase="phase2"
            isLive={false}
          />
        </div>
      )
    }

    return (
      <div className="phase-views-container">
        <div className="phase-views-card">
          <h2 className="phase-views-card-header">Phase 2: Investigation</h2>

          {files.summary && renderCollapsibleSection('summary', 'Summary', files.summary, true)}
          {files.customerResponse && renderCollapsibleSection('customerResponse', 'Customer Response', files.customerResponse, true)}
          {files.linearDraft && renderCollapsibleSection('linearDraft', 'Linear Draft', files.linearDraft, true)}

          <div style={{ marginTop: '2rem' }}>
            <DecisionLog
              actions={getFilteredActions('phase2')}
              checkpointName="Investigation"
            />
          </div>
        </div>
        <ActivityFeed
          activities={activity}
          phase="phase2"
          isLive={isPhaseRunning('phase2')}
        />
      </div>
    )
  }

  // Phase 3: Solution Review
  if (activePhase === 'phase3') {
    if (shouldShowWaitingState('phase3')) {
      return (
        <div className="phase-views-container">
          <div className="phase-views-empty">
            Waiting for previous phases to complete
          </div>
          <ActivityFeed
            activities={activity}
            phase="phase3"
            isLive={false}
          />
        </div>
      )
    }

    if (!files.customerResponse) {
      if (investigation.status === 'running' || investigation.current_checkpoint === 'checkpoint_3_investigation_validation') {
        return (
          <div className="phase-views-container">
            <div className="phase-views-loading">
              <div className="phase-views-spinner"></div>
              <p className="phase-views-loading-text">Preparing solution review...</p>
            </div>
            <ActivityFeed
              activities={activity}
              phase="phase3"
              isLive={true}
            />
          </div>
        )
      }
      return (
        <div className="phase-views-container">
          <div className="phase-views-empty">
            No solution data yet
          </div>
          <ActivityFeed
            activities={activity}
            phase="phase3"
            isLive={false}
          />
        </div>
      )
    }

    return (
      <div className="phase-views-container">
        <div className="phase-views-card">
          <h2 className="phase-views-card-header">Phase 3: Solution Review</h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="phase-views-section-title">Final Customer Response</div>
            <div className="phase-views-markdown">
              <ReactMarkdown>{files.customerResponse}</ReactMarkdown>
            </div>
          </div>

          <div className="phase-views-button-group" style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => handleCopy(files.customerResponse)}
              className="phase-views-button"
            >
              Copy Response
            </button>
            {files.linearDraft && (
              <button
                onClick={() => window.open('https://linear.app', '_blank')}
                className="phase-views-button phase-views-button-secondary"
              >
                Create in Linear
              </button>
            )}
            <button
              onClick={() => window.open('https://notion.so', '_blank')}
              className="phase-views-button phase-views-button-secondary"
            >
              Push to Notion
            </button>
            {copyFeedback && <span className="phase-views-copy-feedback">{copyFeedback}</span>}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <DecisionLog
              actions={files.checkpointActions || []}
              checkpointName="Solution Review"
            />
          </div>
        </div>
        <ActivityFeed
          activities={activity}
          phase="phase3"
          isLive={isPhaseRunning('phase3')}
        />
      </div>
    )
  }

  return (
    <div className="phase-views-container">
      <div className="phase-views-empty">
        Unknown phase: {activePhase}
      </div>
    </div>
  )
}

export default PhaseContent

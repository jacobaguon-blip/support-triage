import React from 'react';
import '../styles/PhaseTabBar.css';

const PHASES = [
  { id: 'phase0', name: 'Classification', checkpoint: 'checkpoint_1_post_classification', num: 1 },
  { id: 'phase1', name: 'Context Gathering', checkpoint: 'checkpoint_2_post_context_gathering', num: 2 },
  { id: 'phase2', name: 'Investigation', checkpoint: 'checkpoint_3_investigation_validation', num: 3 },
  { id: 'phase3', name: 'Solution Review', checkpoint: 'checkpoint_4_solution_check', num: 4 }
];

const PhaseTabBar = ({ activePhase, investigation, checkpointActions, onPhaseClick, runCheckpoint, runStatus }) => {
  // Use run-specific data when available, otherwise fall back to investigation-level
  const effectiveCheckpoint = runCheckpoint !== undefined ? runCheckpoint : investigation.current_checkpoint;
  const effectiveStatus = runStatus !== undefined ? runStatus : investigation.status;

  const getPhaseStatus = (phase) => {
    // If this run/investigation is complete, all phases are complete
    if (effectiveStatus === 'complete') {
      return 'complete';
    }

    // Check if checkpoint action exists for this phase (complete)
    const hasCompletedCheckpoint = checkpointActions.some(
      action => action.checkpoint === phase.checkpoint &&
                ['confirm', 'continue', 'approve'].includes(action.action)
    );
    if (hasCompletedCheckpoint) {
      return 'complete';
    }

    // Check if this is the current checkpoint (using run-scoped data)
    const isCurrentCheckpoint = effectiveCheckpoint === phase.checkpoint;
    if (isCurrentCheckpoint) {
      if (effectiveStatus === 'running') {
        return 'active';
      }
      if (effectiveStatus === 'waiting') {
        return 'waiting';
      }
      if (effectiveStatus === 'error') {
        return 'error';
      }
    }

    // Default: pending
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return (
          <svg className="phase-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case 'active':
        return (
          <svg className="phase-icon phase-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="5" r="1"></circle>
            <circle cx="5" cy="19" r="1"></circle>
          </svg>
        );
      case 'waiting':
        return (
          <svg className="phase-icon" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="2"></circle>
            <circle cx="19" cy="12" r="2"></circle>
            <circle cx="5" cy="12" r="2"></circle>
          </svg>
        );
      case 'error':
        return (
          <svg className="phase-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  const phases = PHASES.map(phase => ({
    ...phase,
    status: getPhaseStatus(phase)
  }));

  // Calculate progress for connector line
  const lastCompleteIndex = phases.findIndex(p => p.status !== 'complete' && p.status !== 'pending')
    ? phases.findLastIndex(p => p.status === 'complete')
    : phases.findIndex(p => p.status !== 'pending') - 1;

  return (
    <div className="phase-tab-bar">
      <div className="phase-connector-background">
        <div
          className="phase-connector-progress"
          style={{
            width: lastCompleteIndex >= 0 ? `${((lastCompleteIndex + 1) / phases.length) * 100}%` : '0%'
          }}
        ></div>
      </div>

      <div className="phase-tabs-container">
        {phases.map((phase, index) => (
          <div key={phase.id} className="phase-tab-wrapper">
            <button
              className={`phase-tab phase-${phase.status} ${activePhase === phase.id ? 'active-tab' : ''}`}
              onClick={() => onPhaseClick(phase.id)}
              aria-label={`${phase.name} - ${phase.status}`}
            >
              <div className="phase-circle">
                <span className="phase-number">{phase.num}</span>
                <div className={`phase-status-icon phase-status-${phase.status}`}>
                  {getStatusIcon(phase.status)}
                </div>
              </div>
              <div className="phase-name">{phase.name}</div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhaseTabBar;

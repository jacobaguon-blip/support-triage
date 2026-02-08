import React from 'react';
import '../styles/PhaseTabBar.css';

const PHASES = [
  { id: 'phase0', name: 'Classification', checkpoint: 'checkpoint_1_post_classification', num: 1 },
  { id: 'phase1', name: 'Context Gathering', checkpoint: 'checkpoint_2_post_context_gathering', num: 2 },
  { id: 'phase2', name: 'Investigation', checkpoint: 'checkpoint_3_investigation_validation', num: 3 },
  { id: 'phase3', name: 'Solution Review', checkpoint: 'checkpoint_4_solution_check', num: 4 }
];

const PhaseTabBar = ({ activePhase, investigation, checkpointActions, onPhaseClick, runCheckpoint, runStatus }) => {
  const effectiveCheckpoint = runCheckpoint !== undefined ? runCheckpoint : investigation.current_checkpoint;
  const effectiveStatus = runStatus !== undefined ? runStatus : investigation.status;

  const getPhaseStatus = (phase) => {
    if (effectiveStatus === 'complete') return 'complete';
    const hasCompletedCheckpoint = checkpointActions.some(
      action => action.checkpoint === phase.checkpoint &&
                ['confirm', 'continue', 'approve'].includes(action.action)
    );
    if (hasCompletedCheckpoint) return 'complete';
    const isCurrentCheckpoint = effectiveCheckpoint === phase.checkpoint;
    if (isCurrentCheckpoint) {
      if (effectiveStatus === 'running') return 'active';
      if (effectiveStatus === 'waiting') return 'waiting';
      if (effectiveStatus === 'error') return 'error';
    }
    return 'pending';
  };

  const phases = PHASES.map(phase => ({
    ...phase,
    status: getPhaseStatus(phase)
  }));

  return (
    <div className="phase-stepper">
      {phases.map((phase, index) => (
        <React.Fragment key={phase.id}>
          <button
            className={`phase-step phase-step--${phase.status} ${activePhase === phase.id ? 'phase-step--selected' : ''}`}
            onClick={() => onPhaseClick(phase.id)}
            aria-label={`${phase.name} - ${phase.status}`}
          >
            <span className="phase-step__dot">
              {phase.status === 'complete' ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5">
                  <polyline points="1.5 4 3.5 6 6.5 2" />
                </svg>
              ) : phase.status === 'active' ? (
                <span className="phase-step__pulse" />
              ) : null}
            </span>
            <span className="phase-step__label">{phase.name}</span>
          </button>
          {index < phases.length - 1 && (
            <div className={`phase-step__connector ${phase.status === 'complete' ? 'phase-step__connector--done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default PhaseTabBar;

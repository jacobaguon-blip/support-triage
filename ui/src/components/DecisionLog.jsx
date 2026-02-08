import React from 'react';
import '../styles/DecisionLog.css';

const ACTION_LABELS = {
  confirm: 'Confirmed',
  continue: 'Continued',
  approve: 'Approved',
  reclassify: 'Reclassified',
  redirect: 'Redirected',
  search_deeper: 'Searched Deeper',
  abort: 'Aborted',
  reject: 'Rejected',
  request_more_info: 'Requested More Info'
};

const ACTION_CATEGORIES = {
  approve: ['confirm', 'continue', 'approve'],
  reclassify: ['reclassify', 'redirect', 'search_deeper', 'request_more_info'],
  abort: ['abort', 'reject']
};

const getActionCategory = (action) => {
  for (const [category, actions] of Object.entries(ACTION_CATEGORIES)) {
    if (actions.includes(action)) {
      return category;
    }
  }
  return 'approve'; // Default category
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    meridiem: 'short'
  });
  return formatter.format(date);
};

const DecisionLog = ({ actions, checkpointName }) => {
  // Sort actions by timestamp, most recent first
  const sortedActions = [...actions].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="decision-log">
      <div className="decision-log-header">
        <h3 className="decision-log-title">Decision History</h3>
        {checkpointName && (
          <p className="decision-log-checkpoint">{checkpointName}</p>
        )}
      </div>

      {sortedActions.length === 0 ? (
        <div className="decision-log-empty">
          <p>No decisions recorded yet</p>
        </div>
      ) : (
        <div className="decision-entries">
          {sortedActions.map((action, index) => {
            const actionLabel = ACTION_LABELS[action.action] || action.action;
            const actionCategory = getActionCategory(action.action);

            return (
              <div key={index} className={`decision-entry decision-entry-${actionCategory}`}>
                <div className="decision-entry-header">
                  <span className={`decision-action-badge decision-badge-${actionCategory}`}>
                    {actionLabel}
                  </span>
                  <time className="decision-timestamp">
                    {formatTimestamp(action.timestamp)}
                  </time>
                </div>

                {action.feedback && (
                  <div className="decision-feedback">
                    {action.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DecisionLog;

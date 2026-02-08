import { useState, useEffect, useRef } from 'react';
import '../styles/ActivityFeed.css';

const ActivityFeed = ({ activities = [], phase = null, isLive = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);

  // Filter activities by phase if provided
  const filteredActivities = phase
    ? activities.filter((activity) => activity.phase === phase)
    : activities;

  // Auto-scroll to bottom when new entries appear
  useEffect(() => {
    if (containerRef.current && isExpanded) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredActivities, isExpanded]);

  // Format timestamp from ISO string or Date
  const formatTime = (ts) => {
    if (!ts) return '00:00:00';
    const date = typeof ts === 'string' ? new Date(ts) : ts;
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get prefix and color class for activity type
  const getTypeStyle = (type) => {
    const styles = {
      start: { prefix: '▶', className: 'activity-start' },
      command: { prefix: '$', className: 'activity-command' },
      tool_call: { prefix: '→', className: 'activity-tool-call' },
      output: { prefix: '', className: 'activity-output' },
      result: { prefix: '✓', className: 'activity-result' },
      error: { prefix: '✗', className: 'activity-error' },
      complete: { prefix: '●', className: 'activity-complete' },
      info: { prefix: 'ℹ', className: 'activity-info' },
    };
    return styles[type] || styles.info;
  };

  return (
    <div className="activity-feed-wrapper">
      {/* Collapsible Header */}
      <div
        className="activity-feed-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="activity-feed-header-content">
          <span className="activity-feed-chevron" data-expanded={isExpanded}>
            ▼
          </span>
          <span className="activity-feed-title">Activity Log</span>
          <span className="activity-feed-badge">{filteredActivities.length}</span>
        </div>
      </div>

      {/* Activity Container */}
      {isExpanded && (
        <div className="activity-feed-container" ref={containerRef}>
          {filteredActivities.length === 0 ? (
            <div className="activity-feed-empty">No activity yet</div>
          ) : (
            <div className="activity-feed-content">
              {filteredActivities.map((activity, index) => {
                const { prefix, className } = getTypeStyle(activity.type);
                const time = formatTime(activity.ts);

                return (
                  <div key={index} className={`activity-line ${className}`}>
                    <span className="activity-time">[{time}]</span>
                    {prefix && <span className="activity-prefix">{prefix}</span>}
                    <span className="activity-message">{activity.message}</span>
                  </div>
                );
              })}

              {/* Blinking cursor for live mode */}
              {isLive && (
                <div className="activity-cursor">
                  <span className="cursor-block"></span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;

-- Add agents table for tracking individual agent processes

CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investigation_id INTEGER NOT NULL,
  investigation_run_id INTEGER,
  agent_name TEXT NOT NULL,
  pid INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  log_file TEXT,
  findings_file TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  FOREIGN KEY (investigation_id) REFERENCES investigations(id),
  FOREIGN KEY (investigation_run_id) REFERENCES investigation_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_agents_investigation ON agents(investigation_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Add log file tracking to investigations table
ALTER TABLE investigations ADD COLUMN main_log_file TEXT;
ALTER TABLE investigations ADD COLUMN agent_pids TEXT; -- JSON map of agent → PID

/**
 * triage list command
 * List investigations
 */

import { listInvestigations } from '../../core/database.js';

export default async function listCommand(options) {
  try {
    const filters = {};
    if (options.status) {
      filters.status = options.status;
    }

    const investigations = await listInvestigations(filters);

    if (investigations.length === 0) {
      console.log('No investigations found');
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(investigations, null, 2));
      return;
    }

    // Display as table
    console.log('');
    console.log('ID'.padEnd(8) + 'Customer'.padEnd(20) + 'Status'.padEnd(12) + 'Checkpoint'.padEnd(35) + 'Created');
    console.log('─'.repeat(100));

    investigations.forEach(inv => {
      const id = String(inv.id).padEnd(8);
      const customer = (inv.customer_name || 'Unknown').substring(0, 18).padEnd(20);
      const status = (inv.status || 'unknown').padEnd(12);
      const checkpoint = (inv.current_checkpoint || '-').substring(0, 33).padEnd(35);
      const created = formatRelativeTime(inv.created_at);

      console.log(`${id}${customer}${status}${checkpoint}${created}`);
    });

    console.log('');
    console.log(`Total: ${investigations.length} investigation(s)`);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Format relative time (e.g., "2h ago", "1d ago")
 */
function formatRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

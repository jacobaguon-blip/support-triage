/**
 * response-sync.js
 * Backend module for syncing Pylon ticket responses and parsing them into individual messages.
 * ES module for integrating with database context helpers.
 */

/**
 * Parse a Pylon ticket body (HTML or plain text) into individual messages.
 * @param {string} bodyHtml - The ticket body content (may be HTML or plain text)
 * @returns {Array} Array of parsed messages with structure: { actor_name, actor_role, content, created_at }
 */
export function parseTicketThread(bodyHtml) {
  if (!bodyHtml || typeof bodyHtml !== 'string') {
    return [];
  }

  // Step 1: Clean HTML tags
  let text = cleanHtmlContent(bodyHtml);

  // Step 2: Split by reply boundary patterns
  const messages = splitByReplyBoundaries(text);

  // Step 3: Parse each message chunk to extract metadata
  const parsed = messages.map((chunk) => {
    const msg = parseMessageChunk(chunk);
    return msg;
  });

  // Step 4: Return in chronological order (oldest first)
  // If no dates were parsed, maintain the order they appeared
  return parsed.sort((a, b) => {
    if (a.created_at && b.created_at) {
      return new Date(a.created_at) - new Date(b.created_at);
    }
    return 0; // maintain original order if dates aren't available
  });
}

/**
 * Clean HTML content from ticket body by removing/replacing tags
 * @param {string} html - HTML or plain text content
 * @returns {string} Cleaned text with newlines preserved
 */
function cleanHtmlContent(html) {
  let text = html;

  // Replace block-level HTML tags with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<p[^>]*>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<blockquote[^>]*>/gi, '\n');
  text = text.replace(/<\/blockquote>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Clean up excessive newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text;
}

/**
 * Decode common HTML entities
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };

  let result = text;
  Object.entries(entities).forEach(([entity, char]) => {
    result = result.split(entity).join(char);
  });

  return result;
}

/**
 * Split text by reply boundary patterns
 * @param {string} text - Cleaned text content
 * @returns {Array} Array of message chunks
 */
function splitByReplyBoundaries(text) {
  // Patterns that indicate message boundaries
  const boundaryPatterns = [
    /^---+\s*$/m,
    /^___+\s*$/m,
    /^On\s+.+?wrote:\s*$/m,
    /^From:\s+.+$/m,
    /^Sent:\s+.+$/m,
    /^To:\s+.+$/m,
  ];

  // Try to split by any boundary pattern
  let chunks = [text];

  for (const pattern of boundaryPatterns) {
    const newChunks = [];
    for (const chunk of chunks) {
      const parts = chunk.split(pattern);
      if (parts.length > 1) {
        newChunks.push(...parts.filter((p) => p.trim().length > 0));
      } else {
        newChunks.push(chunk);
      }
    }
    if (newChunks.length > chunks.length) {
      chunks = newChunks;
    }
  }

  // If no clear boundaries found, treat entire text as one message
  if (chunks.length === 0 || chunks.every((c) => !c.trim())) {
    return [text];
  }

  return chunks.filter((c) => c.trim().length > 0);
}

/**
 * Parse a single message chunk to extract metadata
 * @param {string} chunk - A single message chunk
 * @returns {Object} Parsed message object
 */
function parseMessageChunk(chunk) {
  const lines = chunk.split('\n').map((l) => l.trim());
  let actorName = null;
  let actorRole = 'customer';
  let createdAt = null;
  let contentStartIndex = 0;

  // Try to extract metadata from the beginning of the chunk
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];

    // Extract From: header
    if (line.startsWith('From:')) {
      actorName = line.replace(/^From:\s*/, '').trim();
      contentStartIndex = i + 1;
      break;
    }

    // Extract "On <date>, <name> wrote:" pattern
    const onWroteMatch = line.match(/^On\s+(.+?),\s+(.+?)\s+wrote:\s*$/i);
    if (onWroteMatch) {
      createdAt = parseDate(onWroteMatch[1]);
      actorName = onWroteMatch[2].trim();
      contentStartIndex = i + 1;
      break;
    }

    // Extract Sent: date
    if (line.startsWith('Sent:')) {
      createdAt = parseDate(line.replace(/^Sent:\s*/, ''));
      contentStartIndex = i + 1;
      break;
    }
  }

  // Extract content (remaining lines after metadata)
  const content = lines
    .slice(contentStartIndex)
    .join('\n')
    .trim();

  // Determine actor role based on known patterns
  if (actorName) {
    const nameLower = actorName.toLowerCase();
    const agentPatterns = [
      'support',
      'team',
      'tse',
      'technician',
      'engineer',
      'agent',
      'help',
      'customer service',
      'conductoronce',
      'pylon',
    ];

    if (
      agentPatterns.some(
        (pattern) => nameLower.includes(pattern) || actorName.includes(pattern)
      )
    ) {
      actorRole = 'agent';
    }
  }

  return {
    actor_name: actorName,
    actor_role: actorRole,
    content: content || chunk.trim(),
    created_at: createdAt,
  };
}

/**
 * Parse date string from various formats
 * @param {string} dateStr - Date string to parse
 * @returns {string|null} ISO 8601 date string or null if unparseable
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

/**
 * Sync ticket responses from Pylon body into the database
 * @param {Object} dbCtx - Database context with queryAll, queryOne, run methods
 * @param {string} investigationId - Investigation ID to sync responses for
 * @param {string} ticketBody - The ticket body HTML/text
 * @param {string} customerName - Name of the customer
 * @returns {Object} Sync result with newCount, totalCount, and newResponses
 */
export function syncTicketResponses(dbCtx, investigationId, ticketBody, customerName) {
  const parsedMessages = parseTicketThread(ticketBody)
  if (parsedMessages.length === 0) {
    return { newCount: 0, totalCount: 0, newResponses: [] }
  }

  const existingResponses = dbCtx.queryAll(
    'SELECT * FROM ticket_responses WHERE investigation_id = ? ORDER BY sequence_number ASC',
    [investigationId]
  )

  // Check for new responses (content similarity using first 100 chars)
  const newResponses = []
  let nextSeq = (existingResponses.length > 0
    ? existingResponses[existingResponses.length - 1].sequence_number
    : 0) + 1

  for (const parsed of parsedMessages) {
    const prefix = (parsed.content || '').substring(0, 100)
    const exists = existingResponses.some(e =>
      (e.content || '').substring(0, 100) === prefix
    )
    if (!exists) newResponses.push(parsed)
  }

  const insertedResponses = []
  const now = new Date().toISOString()

  for (const parsed of newResponses) {
    dbCtx.run(
      `INSERT INTO ticket_responses (investigation_id, sequence_number, actor_role, actor_name, content, created_at, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [investigationId, nextSeq, parsed.actor_role, parsed.actor_name || customerName, parsed.content, parsed.created_at, now]
    )

    const preview = (parsed.content || '').substring(0, 120)
    const type = parsed.actor_role === 'customer' ? 'customer_message' : 'agent_message'
    dbCtx.run(
      `INSERT INTO conversation_items (investigation_id, type, actor_name, actor_role, content, content_preview, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [investigationId, type, parsed.actor_name || customerName, parsed.actor_role, parsed.content, preview,
       JSON.stringify({ sequence_number: nextSeq, source: 'pylon' }), parsed.created_at || now]
    )

    insertedResponses.push({ ...parsed, sequence_number: nextSeq })
    nextSeq++
  }

  return { newCount: insertedResponses.length, totalCount: existingResponses.length + insertedResponses.length, newResponses: insertedResponses }
}

/**
 * Quick check if there are new responses compared to what's stored
 * @param {Object} dbCtx - Database context with queryAll, queryOne methods
 * @param {string} investigationId - Investigation ID to check
 * @param {string} newTicketBody - The updated ticket body
 * @param {string} customerName - Name of the customer
 * @returns {Object} Check result with hasNew boolean and newCount
 */
export function checkForNewResponses(dbCtx, investigationId, newTicketBody, customerName) {
  const parsedMessages = parseTicketThread(newTicketBody)
  const countResult = dbCtx.queryOne(
    'SELECT COUNT(*) as count FROM ticket_responses WHERE investigation_id = ?',
    [investigationId]
  )
  const existingCount = countResult?.count ?? 0
  const parsedCount = parsedMessages.length
  return { hasNew: parsedCount > existingCount, newCount: Math.max(0, parsedCount - existingCount) }
}

# Support Triage UI

Local React application for the ConductorOne Support Ticket Triage System.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The UI will be available at http://localhost:3000

## Project Structure

```
src/
├── App.jsx                      # Main application component
├── main.jsx                     # React entry point
├── components/
│   ├── TicketSidebar.jsx       # Left sidebar with investigation list
│   ├── InvestigationDetail.jsx # Main investigation view
│   ├── CheckpointPanel.jsx     # Checkpoint actions and feedback
│   ├── DocumentPreview.jsx     # Markdown document viewer
│   └── SettingsPane.jsx        # Settings configuration
├── services/
│   └── sqlite.js               # Database and file access layer
└── styles/
    ├── index.css               # Global styles and CSS variables
    ├── App.css                 # App layout styles
    ├── TicketSidebar.css
    ├── InvestigationDetail.css
    ├── CheckpointPanel.css
    ├── DocumentPreview.css
    └── SettingsPane.css
```

## Features

### Ticket Sidebar
- List all investigations with status icons
- Filter by: All, Active, Complete
- Shows concurrency status (active/queued counts)
- Click to switch between investigations
- Auto-proceed countdown timers

### Investigation Detail
- Ticket information card
- Direct link to Pylon ticket
- Classification, priority, and metadata
- Checkpoint action panel with contextual buttons
- Tabbed document viewer (Summary, Customer Response, Linear Draft)

### Checkpoint Panel
- Context-aware action buttons per checkpoint
- Collapsible feedback/instruction input
- Auto-proceed indicator

### Document Preview
- Live markdown rendering
- Copy to clipboard button
- "Create in Linear" button (for Linear drafts)
- "Push to Notion" button (for summaries)

### Settings Pane
- Enable/disable checkpoints
- Configure concurrency limit
- Choose default agent mode (team/single)
- Set code review depth (Level 2/3)
- View customer response style rules

## Development Notes

### Current State
The UI is fully built with mock data. Backend integration points are marked with `// TODO` comments.

### Backend Integration Needed
1. **SQLite Access**: Replace mock data in `services/sqlite.js` with real database queries
2. **File System Access**: Load investigation files (summary.md, customer-response.md, linear-draft.md)
3. **WebSocket**: Real-time agent output streaming (currently polling every 2 seconds)
4. **MCP Calls**: Linear creation and Notion push buttons need MCP server integration
5. **Settings Persistence**: Save settings.json changes

### Mock Data
`services/sqlite.js` contains mock investigations for development. The UI works standalone for testing layouts and interactions.

## Scripts

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **react-markdown** - Markdown rendering
- CSS Variables - Theming (dark mode)

## Browser Support

Modern browsers with ES6+ support. Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

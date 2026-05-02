# Options for Viewing the TUI

## Problem
Claude cannot directly access TTY/terminal applications without special tools.

## Solution Options (Ranked by Ease)

### ⭐ Option 1: Screenshot/Screen Recording (EASIEST - Use This Now!)

**How it works:**
1. Run the TUI in your terminal
2. Take a screenshot (Cmd+Shift+4 on macOS)
3. Share the screenshot with Claude

**Steps:**
```bash
cd ~/support-triage/tui
./triage-tui
# Use your terminal, then take a screenshot
```

**Best for:** Quick testing, showing Claude the current state

---

### Option 2: ttyd + Browser + Screenshot (RECOMMENDED)

**How it works:**
1. Install `ttyd` (web-based terminal)
2. Run TUI through ttyd in a browser
3. Take screenshots of the browser window
4. Share with Claude

**Installation:**
```bash
# Install ttyd
brew install ttyd

# Run TUI in browser
cd ~/support-triage/tui
ttyd -p 7681 ./triage-tui

# Open browser to: http://localhost:7681
# Take screenshot and share
```

**Advantages:**
- Clean, consistent screenshots
- Can record video with browser tools
- Easy to share multiple states
- Better terminal rendering than native terminal

**Best for:** Documentation, demos, user testing feedback

---

### Option 3: Chrome DevTools MCP + ttyd (ADVANCED)

**How it works:**
1. Run TUI via ttyd in Chrome
2. Use your existing chrome-devtools MCP server
3. Claude can potentially take screenshots via MCP

**Steps:**
```bash
# Start ttyd
ttyd -p 7681 ./triage-tui

# In another terminal, tell Claude to take screenshots
# Claude uses: mcp__chrome-devtools__take_screenshot
```

**Status:** You already have chrome-devtools MCP configured!

**Advantages:**
- Automated screenshot capture
- Claude can interact with the view
- Good for continuous monitoring

**Best for:** Automated testing, CI/CD, continuous monitoring

---

### Option 4: ANSI Output Capture + Parsing (COMPLEX)

**How it works:**
1. Capture raw ANSI terminal output
2. Parse ANSI escape codes
3. Reconstruct visual state

**Challenge:** Requires TTY access which we don't have in current environment

**Not recommended** - Use screenshot approach instead

---

### Option 5: MCP Server for Terminal Output (FUTURE)

**How it works:**
1. Build custom MCP server that streams terminal output
2. Expose via JSON-RPC
3. Claude polls for updates

**Example structure:**
```typescript
// mcp-terminal-server
{
  "tools": {
    "terminal_capture": {
      "description": "Capture terminal output",
      "parameters": {
        "pid": "process ID",
        "format": "ansi | text | html"
      }
    }
  }
}
```

**Status:** Would need to build custom MCP server

**Best for:** Long-term production monitoring

---

## Recommended Workflow for NOW

### Quick Testing (Today)
```bash
# 1. Run TUI
cd ~/support-triage/tui
./triage-tui

# 2. Use keyboard shortcuts to navigate
# Press 5 for Summary tab, E to edit, etc.

# 3. Take screenshots (Cmd+Shift+4)

# 4. Share with Claude
```

### Better Experience (10 minutes setup)
```bash
# 1. Install ttyd
brew install ttyd

# 2. Create launch script
cat > ~/support-triage/tui/tui-web.sh << 'EOF'
#!/bin/bash
echo "Starting TUI in browser..."
echo "Open: http://localhost:7681"
ttyd -p 7681 ~/support-triage/tui/triage-tui
EOF
chmod +x ~/support-triage/tui/tui-web.sh

# 3. Run it
~/support-triage/tui/tui-web.sh

# 4. Open browser to http://localhost:7681
# 5. Take screenshots easily
```

### With Claude Integration (Advanced)
```bash
# 1. Start ttyd with Chrome
ttyd -p 7681 ./triage-tui
# Open http://localhost:7681 in Chrome

# 2. Tell Claude to use chrome-devtools MCP
# Claude can call: mcp__chrome-devtools__take_screenshot

# 3. Claude can see the screenshots automatically
```

---

## What Each Approach Gives Claude

### Screenshots (Option 1 & 2)
- ✅ See exact visual state
- ✅ Verify colors, layout, formatting
- ✅ Spot visual bugs
- ✅ Confirm UX/design choices
- ❌ Can't interact directly
- ❌ Manual process

### Chrome DevTools MCP (Option 3)
- ✅ Automated screenshot capture
- ✅ Can interact with browser
- ✅ Can script testing scenarios
- ✅ Continuous monitoring possible
- ❌ Requires browser + ttyd setup
- ❌ More complex setup

### Terminal MCP Server (Option 5)
- ✅ Real-time terminal streaming
- ✅ Can parse ANSI codes
- ✅ Automated interaction possible
- ❌ Requires building custom MCP server
- ❌ Most complex solution

---

## Recommendation

**For right now:** Use **Option 1** (screenshot)
- Takes 30 seconds
- No installation needed
- Works perfectly for testing

**For ongoing development:** Set up **Option 2** (ttyd)
- 10 minutes to install
- Much better screenshots
- Can record demos
- Professional look for documentation

**For production monitoring:** Consider **Option 3** (Chrome MCP)
- Use your existing MCP setup
- Automate screenshot capture
- Good for CI/CD integration

---

## Next Steps

### Immediate (RIGHT NOW)
```bash
# Just run it and screenshot
cd ~/support-triage/tui
./triage-tui
# Cmd+Shift+4 to screenshot
```

### 10 Minutes From Now
```bash
# Install ttyd for better experience
brew install ttyd
cd ~/support-triage/tui
ttyd -p 7681 ./triage-tui
# Open http://localhost:7681
# Screenshot from browser
```

### Future Enhancement
- Build custom MCP server for terminal streaming
- Integrate with existing chrome-devtools MCP
- Add automated screenshot testing to CI/CD

---

## Example: Using Chrome DevTools MCP

If you want me to try automated screenshots:

1. Start ttyd:
```bash
ttyd -p 7681 ./triage-tui
```

2. Open http://localhost:7681 in Chrome

3. Tell me to take a screenshot using MCP:
   - I can use `mcp__chrome-devtools__take_screenshot`
   - I can see the terminal in the browser
   - I can verify the UI looks correct

This uses the MCP server you already have configured!

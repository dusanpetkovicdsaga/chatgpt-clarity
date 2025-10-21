# ChatGPT Clarity - AI Assistant Instructions

## Project Overview
ChatGPT Clarity is a Chrome extension that enhances ChatGPT conversations by adding reply buttons to messages and displaying AI responses in a sidebar. It uses users' OpenAI API keys for custom follow-up questions with full conversation context.

## Architecture

### Core Components
- **`content.js`**: Main extension logic injected into ChatGPT pages (~3600 lines)
- **`background.js`**: Service worker handling OpenAI API calls and tab injection
- **`popup.html/js`**: Extension popup for API key management
- **`styles.css`**: Complete styling for sidebar, buttons, and UI components (~2300 lines)
- **`manifest.json`**: MV3 extension configuration with ChatGPT-specific permissions

### Key Patterns

#### Message Detection & Button Injection
- Uses `article[data-turn="assistant"]` selectors to target ChatGPT messages
- Adds reply buttons near existing "More actions" buttons: `button[aria-label="More actions"]`
- Generates unique message IDs: `msg_${hash}` using content + position hashing
- Only adds buttons to assistant messages, not user messages

#### Sidebar Architecture (Dual-Tab System)
```javascript
// Tab structure: Chat view + Pinned messages view
switchTab('chat')    // Active conversation thread
switchTab('pinned')  // Saved messages with masonry grid layout
```

#### Message Storage & Threading
- **Chat threads**: `localStorage` key pattern `chatgpt_conversation_${messageId}`
- **Pinned messages**: Single array in `chatgpt_pinned_messages` 
- **Message tagging**: `chatgpt_message_tags_${messageId}` for organization
- Each message thread maintains full conversation context for API calls

#### API Integration Pattern
```javascript
// Background script handles all OpenAI calls
chrome.runtime.sendMessage({
  action: 'makeApiCall',
  data: { apiKey, model, messages, newQuestion }
});
```

### UI State Management

#### Sidebar States
- **Normal**: 350px width, right-aligned
- **Minimized**: Hidden with restore button (🔄)  
- **Expanded**: Full-width overlay mode (⛶ button)
- **Chat/Pinned tabs**: Vertical tab switcher on left edge

#### Auto-Injection System
- Automatically injects into existing ChatGPT tabs on startup/install
- Uses `window.chatGPTExtensionInjected` flag to prevent double-injection
- MutationObserver watches for new messages to add buttons

### Development Workflows

#### Extension Loading
1. Load unpacked extension in Chrome Developer mode
2. Extension auto-activates on `https://chatgpt.com/*` 
3. Manual activation via popup "Activate on Open ChatGPT Tabs" button

#### Testing Patterns
- Check browser console for injection logs: "ChatGPT Clarity: Content script loaded"
- Verify button placement on assistant messages with "More actions" button
- Test API key storage: `chrome.storage.local.get(['openai_api_key'])`

#### DOM Integration Points
- **Button insertion**: Before `.parentElement` of "More actions" button
- **Message parsing**: Extract conversation context from ChatGPT's message structure
- **Sidebar injection**: Appended to `document.body` with high z-index (9999)

### Code Conventions

#### Naming Patterns
- CSS classes: `chatgpt-extension-*`, `sidebar-*`, `extension-*-button`
- Message IDs: `msg_${simpleHash(content + index)}`
- Storage keys: `chatgpt_*` prefix for all localStorage items

#### Error Handling
- All API calls wrapped in try-catch with user-visible error messages
- Graceful degradation when OpenAI API fails or rate limits
- Console logging for debugging: "Extension injected into existing ChatGPT tab"

#### ChatGPT Page Integration
- Targets specific ChatGPT DOM elements that may change with updates
- Uses robust selectors: `article[data-turn="assistant"]` over generic classes
- Handles both light/dark ChatGPT themes via CSS custom properties

### Key File Locations
- Extension buttons: Added to assistant message action bars
- Sidebar components: Complex masonry grid layout for pinned messages  
- API key management: Popup with validation (must start with "sk-")
- Message threading: Each reply creates new conversation thread in sidebar
# ChatGPT Extension Helper

A Chrome extension that enhances ChatGPT conversations by allowing you to ask additional questions using your own OpenAI API key. The extension adds reply buttons to ChatGPT messages and displays responses in a convenient sidebar.

## Features

- 🤖 **Reply to any ChatGPT message**: Click "Ask Extension" on any message to ask follow-up questions
- 🔑 **Use your own API key**: Secure storage of your OpenAI API key
- 📝 **Full conversation context**: All previous messages are sent as context to the API
- 📱 **Sidebar responses**: Clean, organized display of extension responses
- 🎨 **Seamless integration**: Matches ChatGPT's design and supports dark mode
- ⚡ **Real-time updates**: Automatically detects new messages and adds reply buttons

## Installation & Setup

### Step 1: Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-`)

### Step 2: Build the Extension

1. **Clone or download the extension files** to a folder on your computer
2. **Ensure you have all these files in your folder:**
   ```
   chrome-extension-chatgpt/
   ├── manifest.json
   ├── content.js
   ├── background.js
   ├── popup.html
   ├── popup.js
   ├── styles.css
   └── README.md
   ```

### Step 3: Load Extension in Chrome

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer mode** by toggling the switch in the top-right corner
3. **Click "Load unpacked"** button
4. **Select your extension folder** (`chrome-extension-chatgpt`)
5. The extension should now appear in your extensions list

### Step 4: Configure Your API Key

1. **Click the extension icon** in Chrome's toolbar (puzzle piece icon → ChatGPT Extension Helper)
2. **Enter your OpenAI API key** in the popup
3. **Click "Save API Key"**
4. You should see a confirmation that the key was saved

### Step 5: Use the Extension

1. **Visit [ChatGPT](https://chatgpt.com/)**
2. **Start or open any conversation**
3. **Look for "🤖 Ask Extension" buttons** on messages
4. **Click a button** and enter your question when prompted
5. **Check the sidebar** on the right for the extension's response

## How It Works

### The Extension:
1. **Detects ChatGPT messages** and adds reply buttons
2. **Parses conversation history** when you ask a question
3. **Sends API request** with full context to OpenAI
4. **Displays response** in the sidebar

### Privacy & Security:
- Your API key is stored locally in Chrome's storage
- No data is sent to third-party servers except OpenAI
- All communication happens directly between your browser and OpenAI's API

## Troubleshooting

### Extension not appearing:
- Make sure all files are in the correct folder
- Check that Developer mode is enabled in `chrome://extensions/`
- Try refreshing the ChatGPT page

### "Ask Extension" buttons not showing:
- Refresh the ChatGPT page
- Make sure you're on `https://chatgpt.com/`
- Wait a moment for the extension to initialize

### API calls failing:
- Verify your API key is correct (starts with `sk-`)
- Check that you have OpenAI API credits
- Make sure your API key has the necessary permissions

### Sidebar not visible:
- Look for the sidebar on the right side of the page
- Try clicking the toggle button (−/+) in the sidebar header
- Check if the page is zoomed in too much

## File Structure

- **`manifest.json`**: Extension configuration and permissions
- **`content.js`**: Main script that runs on ChatGPT pages
- **`background.js`**: Handles API calls to OpenAI
- **`popup.html/js`**: Extension popup for API key management
- **`styles.css`**: Styling for the extension UI

## Development

To modify the extension:

1. Make changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Refresh the ChatGPT page to see changes

## API Usage

The extension uses the OpenAI Chat Completions API with:
- Model: `gpt-3.5-turbo`
- Max tokens: 1000
- Temperature: 0.7

## Limitations

- Requires a valid OpenAI API key with available credits
- Only works on `https://chatgpt.com/`
- May need updates if ChatGPT changes their page structure
- API costs apply based on your OpenAI usage

## Support

If you encounter issues:

1. Check the browser console for error messages (F12 → Console)
2. Verify your API key is working on the OpenAI platform
3. Make sure you're using a recent version of Chrome
4. Try disabling other extensions that might conflict

## License

This extension is provided as-is for educational and personal use.
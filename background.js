// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('ChatGPT Clarity installed');
});

// Auto-inject content script when extension is enabled
chrome.runtime.onStartup.addListener(injectIntoExistingTabs);
chrome.runtime.onInstalled.addListener(injectIntoExistingTabs);

async function injectIntoExistingTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: "https://chatgpt.com/*" });
    
    for (const tab of tabs) {
      try {
        // Check if content script is already injected
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.chatGPTExtensionInjected === true
        });
        
        // If not injected, inject it now
        if (!results[0]?.result) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['styles.css']
          });
          
          console.log('Extension injected into existing ChatGPT tab:', tab.id);
        }
      } catch (error) {
        console.log('Could not inject into tab:', tab.id, error.message);
      }
    }
  } catch (error) {
    console.log('Error querying tabs:', error);
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'makeApiCall') {
    makeOpenAIApiCall(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function makeOpenAIApiCall(data) {
  const { apiKey, model, messages, newQuestion } = data;
  
  // Use the provided model or default to gpt-3.5-turbo
  const selectedModel = model || 'gpt-3.5-turbo';
  
  // Prepare the messages array with conversation context
  const apiMessages = [
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: "user",
      content: newQuestion
    }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: apiMessages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`API call successful using model: ${selectedModel}`);
    return result.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
}
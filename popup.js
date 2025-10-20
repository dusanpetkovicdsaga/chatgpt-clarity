document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveKey');
    const statusDiv = document.getElementById('status');
    const keyStatusSpan = document.getElementById('keyStatus');
    const reloadButton = document.getElementById('reloadChatGPT');

    // Load existing API key on popup open
    loadApiKey();

    saveButton.addEventListener('click', saveApiKey);
    reloadButton.addEventListener('click', activateOnChatGPTTabs);
    
    apiKeyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });

    async function loadApiKey() {
        try {
            const result = await chrome.storage.local.get(['openai_api_key']);
            if (result.openai_api_key) {
                apiKeyInput.value = result.openai_api_key;
                keyStatusSpan.textContent = 'API key saved ✓';
                keyStatusSpan.style.color = '#10a37f';
            } else {
                keyStatusSpan.textContent = 'No API key saved';
                keyStatusSpan.style.color = '#666';
            }
        } catch (error) {
            console.error('Failed to load API key:', error);
            keyStatusSpan.textContent = 'Error loading API key';
            keyStatusSpan.style.color = '#dc2626';
        }
    }

    async function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter an API key', 'error');
            return;
        }
        
        if (!apiKey.startsWith('sk-')) {
            showStatus('Invalid API key format. Should start with "sk-"', 'error');
            return;
        }

        try {
            // Use chrome.storage.local directly
            await chrome.storage.local.set({ openai_api_key: apiKey });
            
            showStatus('API key saved successfully!', 'success');
            keyStatusSpan.textContent = 'API key saved ✓';
            keyStatusSpan.style.color = '#10a37f';
            
            // Test the API key
            testApiKey(apiKey);
            
        } catch (error) {
            showStatus('Failed to save API key: ' + error.message, 'error');
        }
    }

    async function testApiKey(apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            if (response.ok) {
                showStatus('API key is valid and working!', 'success');
            } else {
                showStatus('API key saved but may be invalid', 'error');
            }
        } catch (error) {
            // Network error, but key was saved
            console.log('Could not test API key:', error);
        }
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    async function activateOnChatGPTTabs() {
        try {
            reloadButton.textContent = '🔄 Activating...';
            reloadButton.disabled = true;
            
            const tabs = await chrome.tabs.query({ url: "https://chatgpt.com/*" });
            
            if (tabs.length === 0) {
                showStatus('No ChatGPT tabs found. Open ChatGPT first!', 'error');
                return;
            }

            let activated = 0;
            for (const tab of tabs) {
                try {
                    // Check if already injected
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => window.chatGPTExtensionInjected === true
                    });
                    
                    if (!results[0]?.result) {
                        // Inject content script
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content.js']
                        });
                        
                        await chrome.scripting.insertCSS({
                            target: { tabId: tab.id },
                            files: ['styles.css']
                        });
                        
                        activated++;
                    }
                } catch (error) {
                    console.log('Could not activate on tab:', tab.id, error);
                }
            }
            
            if (activated > 0) {
                showStatus(`Extension activated on ${activated} ChatGPT tab(s)!`, 'success');
            } else {
                showStatus('Extension was already active on all ChatGPT tabs', 'success');
            }
            
        } catch (error) {
            showStatus('Failed to activate: ' + error.message, 'error');
        } finally {
            reloadButton.textContent = '🔄 Activate on Open ChatGPT Tabs';
            reloadButton.disabled = false;
        }
    }
});
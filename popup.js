document.addEventListener("DOMContentLoaded", function () {
  const apiKeyInput = document.getElementById("apiKey");
  const saveButton = document.getElementById("saveKey");
  const statusDiv = document.getElementById("status");
  const keyStatusSpan = document.getElementById("keyStatus");
  const reloadButton = document.getElementById("reloadChatGPT");
  const pinnedButton = document.getElementById("openPinnedMessages");

  // Load existing API key on popup open
  loadApiKey();

  saveButton.addEventListener("click", saveApiKey);
  reloadButton.addEventListener("click", activateOnChatGPTTabs);
  pinnedButton.addEventListener("click", openPinnedMessages);

  apiKeyInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      saveApiKey();
    }
  });

  async function loadApiKey() {
    try {
      const result = await chrome.storage.local.get(["openai_api_key"]);
      if (result.openai_api_key) {
        apiKeyInput.value = result.openai_api_key;
        keyStatusSpan.textContent = "API key saved ✓";
        keyStatusSpan.style.color = "#10a37f";
      } else {
        keyStatusSpan.textContent = "No API key saved";
        keyStatusSpan.style.color = "#666";
      }
    } catch (error) {
      console.error("Failed to load API key:", error);
      keyStatusSpan.textContent = "Error loading API key";
      keyStatusSpan.style.color = "#dc2626";
    }
  }

  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus("Please enter an API key", "error");
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      showStatus('Invalid API key format. Should start with "sk-"', "error");
      return;
    }

    try {
      // Use chrome.storage.local directly
      await chrome.storage.local.set({ openai_api_key: apiKey });

      showStatus("API key saved successfully!", "success");
      keyStatusSpan.textContent = "API key saved ✓";
      keyStatusSpan.style.color = "#10a37f";

      // Test the API key
      testApiKey(apiKey);
    } catch (error) {
      showStatus("Failed to save API key: " + error.message, "error");
    }
  }

  async function testApiKey(apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        showStatus("API key is valid and working!", "success");
      } else {
        showStatus("API key saved but may be invalid", "error");
      }
    } catch (error) {
      // Network error, but key was saved
      console.log("Could not test API key:", error);
    }
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";

    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 3000);
  }

  async function activateOnChatGPTTabs() {
    try {
      reloadButton.textContent = "🔄 Activating...";
      reloadButton.disabled = true;

      const tabs = await chrome.tabs.query({ url: "https://chatgpt.com/*" });

      if (tabs.length === 0) {
        showStatus("No ChatGPT tabs found. Open ChatGPT first!", "error");
        return;
      }

      let activated = 0;
      for (const tab of tabs) {
        try {
          // Check if already injected
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.chatGPTExtensionInjected === true,
          });

          if (!results[0]?.result) {
            // Inject content script
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            });

            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ["styles.css"],
            });

            activated++;
          }
        } catch (error) {
          console.log("Could not activate on tab:", tab.id, error);
        }
      }

      if (activated > 0) {
        showStatus(
          `Extension activated on ${activated} ChatGPT tab(s)!`,
          "success"
        );
      } else {
        showStatus(
          "Extension was already active on all ChatGPT tabs",
          "success"
        );
      }
    } catch (error) {
      showStatus("Failed to activate: " + error.message, "error");
    } finally {
      reloadButton.textContent = "🔄 Activate on Open ChatGPT Tabs";
      reloadButton.disabled = false;
    }
  }

  async function openPinnedMessages() {
    try {
      pinnedButton.textContent = "📌 Opening...";
      pinnedButton.disabled = true;

      // First try to find an active ChatGPT tab, then any ChatGPT tab
      let tabs = await chrome.tabs.query({
        url: "https://chatgpt.com/*",
        active: true,
        currentWindow: true,
      });

      if (tabs.length === 0) {
        // No active ChatGPT tab, look for any ChatGPT tab
        tabs = await chrome.tabs.query({ url: "https://chatgpt.com/*" });
      }

      if (tabs.length === 0) {
        showStatus("Please open a ChatGPT tab first!", "error");
        return;
      }

      const targetTab = tabs[0];

      try {
        // Check if extension is injected on the target tab
        const results = await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          func: () => ({
            injected: window.chatGPTExtensionInjected === true,
            extensionReady: !!window.chatGPTExtension,
          }),
        });

        const { injected, extensionReady } = results[0].result;

        if (!injected) {
          showStatus("Injecting extension...", "success");

          // Inject content script first
          await chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            files: ["content.js"],
          });

          await chrome.scripting.insertCSS({
            target: { tabId: targetTab.id },
            files: ["styles.css"],
          });

          // Wait for injection to complete
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // Now execute the function to open pinned messages
        const openResult = await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          func: () => {
            return new Promise((resolve) => {
              const tryOpen = () => {
                if (
                  window.chatGPTExtension &&
                  window.chatGPTExtension.createSidebar
                ) {
                  // Create sidebar if it doesn't exist and switch to pinned tab
                  window.chatGPTExtension
                    .createSidebar()
                    .then(() => {
                      window.chatGPTExtension.switchTab("pinned");

                      // Ensure sidebar is visible
                      const sidebar = document.querySelector(
                        ".chatgpt-extension-sidebar"
                      );
                      if (sidebar && sidebar.classList.contains("minimized")) {
                        window.chatGPTExtension.toggleSidebarMinimize();
                      }

                      resolve({ success: true });
                    })
                    .catch((error) => {
                      resolve({ success: false, error: error.message });
                    });
                } else {
                  // Extension not ready yet, try again in a moment
                  setTimeout(tryOpen, 500);
                }
              };

              tryOpen();

              // Timeout after 5 seconds
              setTimeout(() => {
                resolve({ success: false, error: "Extension not ready" });
              }, 5000);
            });
          },
        });

        const result = openResult[0].result;

        if (result.success) {
          showStatus("Pinned messages opened!", "success");

          // Switch to the ChatGPT tab
          await chrome.tabs.update(targetTab.id, { active: true });

          // Close the popup after a short delay
          setTimeout(() => window.close(), 500);
        } else {
          showStatus(
            "Failed to open: " + (result.error || "Unknown error"),
            "error"
          );
        }
      } catch (error) {
        console.error("Error opening pinned messages:", error);
        showStatus("Failed to open pinned messages: " + error.message, "error");
      }
    } catch (error) {
      showStatus("Failed to open pinned messages: " + error.message, "error");
    } finally {
      pinnedButton.textContent = "📌 Open Pinned Messages";
      pinnedButton.disabled = false;
    }
  }
});

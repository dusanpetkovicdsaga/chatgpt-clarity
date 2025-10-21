// Content script for ChatGPT Clarity
console.log('ChatGPT Clarity: Content script loaded');

// Mark that the extension is injected
window.chatGPTExtensionInjected = true;

class ChatGPTExtension {
    constructor() {
        this.sidebar = null;
        this.isInitialized = false;
        this.conversationMessages = [];
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeExtension());
        } else {
            this.initializeExtension();
        }
    }

    async initializeExtension() {
        console.log('Initializing ChatGPT Clarity');
        
        // Check if extension was already initialized (prevents double injection)
        if (document.getElementById('chatgpt-extension-sidebar')) {
            console.log('Extension already initialized, skipping...');
            return;
        }
        
        // Show a subtle notification that extension is now active
        this.showActivationNotice();
        
        // Start observing for chat messages
        this.observeChatMessages();
        
        // Add reply buttons to existing messages
        this.addReplyButtonsToExistingMessages();
        
        this.isInitialized = true;
        
        // Periodically check for new messages
        setInterval(() => {
            this.addReplyButtonsToExistingMessages();
        }, 2000);
    }

    showActivationNotice() {
        // Create a subtle notification that the extension is now active
        const notice = document.createElement('div');
        notice.id = 'extension-activation-notice';
        
        const noticeContent = document.createElement('div');
        noticeContent.className = 'activation-notice';
        
        const message = document.createElement('span');
        message.textContent = '🤖 ChatGPT Clarity is now active!';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'activation-notice-close';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close notification');
        
        noticeContent.appendChild(message);
        noticeContent.appendChild(closeButton);
        notice.appendChild(noticeContent);
        
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            pointer-events: auto;
        `;
        
        const noticeStyle = document.createElement('style');
        noticeStyle.textContent = `
            .activation-notice {
                background: #10a37f;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                animation: slideInRight 0.3s ease;
                min-width: 280px;
            }
            .activation-notice-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: background-color 0.2s ease;
            }
            .activation-notice-close:hover {
                background: rgba(255,255,255,0.3);
            }
            .activation-notice-close:active {
                background: rgba(255,255,255,0.4);
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        
        document.head.appendChild(noticeStyle);
        document.body.appendChild(notice);
        
        // Add click event listener to close button
        const removeNotice = () => {
            if (notice.parentElement) {
                notice.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => {
                    if (notice.parentElement) {
                        notice.remove();
                    }
                }, 300);
            }
        };
        
        closeButton.addEventListener('click', removeNotice);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeNotice();
        }, 5000);
    }

    async createSidebar() {
        // Check if sidebar already exists
        if (document.getElementById('chatgpt-extension-sidebar')) return;

        const sidebar = document.createElement('div');
        sidebar.id = 'chatgpt-extension-sidebar';
        sidebar.className = 'chatgpt-extension-sidebar';
        
        sidebar.innerHTML = `
            <div class="sidebar-tabs">
                <button id="tab-chat" class="sidebar-tab active" title="Chat View" data-tab="chat">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2Z"/>
                    </svg>
                </button>
                <button id="tab-pinned" class="sidebar-tab" title="Pinned Messages" data-tab="pinned">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
                    </svg>
                </button>
            </div>
            <div class="sidebar-content">
                <div id="chat-view" class="sidebar-view active">
                    <div class="sidebar-header">
                        <div class="header-content">
                            <div class="conversation-title-container">
                                <div id="conversation-title" class="conversation-title">Loading...</div>
                            </div>
                            <div class="model-indicator">
                                <select id="extension-model-selector" class="model-selector-dropdown">
                                    <option>Loading models...</option>
                                </select>
                            </div>
                        </div>
                        <div class="sidebar-controls">
                            <button id="sidebar-expand" class="sidebar-control-btn" title="Expand to full width">⛶</button>
                            <button id="sidebar-minimize" class="sidebar-control-btn" title="Minimize">−</button>
                            <button id="sidebar-close" class="sidebar-control-btn" title="Close">×</button>
                        </div>
                    </div>
                    <div class="sidebar-messages" id="sidebar-messages">
                        <div class="welcome-message">
                            <div class="system-message">
                                <div class="message-avatar">🤖</div>
                                <div class="message-content">
                                    <p>Welcome to ChatGPT Clarity!</p>
                                    <p>Click the green arrow button on any ChatGPT message to ask follow-up questions and get deeper insights.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="sidebar-input-container" id="sidebar-input-container">
                        <div class="input-wrapper">
                            <textarea 
                                id="sidebar-input" 
                                placeholder="Ask a question about the selected message..." 
                                rows="1"
                                disabled
                            ></textarea>
                            <button id="sidebar-send" class="send-button" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div id="pinned-view" class="sidebar-view">
                    <div class="sidebar-header">
                        <div class="header-content">
                            <h3>Pinned Messages</h3>
                        </div>
                        <div class="sidebar-controls">
                            <button id="clear-all-pins" class="sidebar-control-btn" title="Clear all pins">🗑️</button>
                            <button id="sidebar-expand-pinned" class="sidebar-control-btn" title="Expand to full width">⛶</button>
                            <button id="sidebar-minimize-pinned" class="sidebar-control-btn" title="Minimize">−</button>
                            <button id="sidebar-close-pinned" class="sidebar-control-btn" title="Close">×</button>
                        </div>
                    </div>
                    <div class="tags-filter-bar" id="tags-filter-bar">
                        <div class="tags-search-container">
                            <input type="text" class="tags-search-input" id="tags-search-input" placeholder="Search tags..." />
                            <button class="tags-clear-filter" id="tags-clear-filter" title="Clear filter">×</button>
                        </div>
                        <div class="tags-list" id="tags-list"></div>
                    </div>
                    <div class="pinned-messages-container" id="pinned-messages-container">
                        <div class="no-pins-message">
                            <div class="system-message">
                                <div class="message-avatar">📌</div>
                                <div class="message-content">
                                    <p>No pinned messages yet!</p>
                                    <p>Click the pin button (📌) on any ChatGPT message to save it here for easy reference.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="pinned-detail-view" id="pinned-detail-view">
                        <div class="detail-view-header">
                            <button class="back-to-grid-btn" id="back-to-grid-btn" title="Back to Grid">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
                                </svg>
                            </button>
                            <div class="detail-conversation-info">
                                <h3 id="detail-conversation-title">Conversation Title</h3>
                                <p id="detail-conversation-timestamp">Timestamp</p>
                            </div>
                        </div>
                        <div class="detail-view-content" id="detail-view-content">
                            <!-- Content will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="sidebar-resize-handle"></div>
        `;

        document.body.appendChild(sidebar);
        
        // Add tab switching functionality
        document.getElementById('tab-chat').addEventListener('click', () => this.switchTab('chat'));
        document.getElementById('tab-pinned').addEventListener('click', () => this.switchTab('pinned'));
        
        // Add minimize/expand functionality for chat view
        document.getElementById('sidebar-expand').addEventListener('click', this.toggleSidebarExpand.bind(this));
        document.getElementById('sidebar-minimize').addEventListener('click', this.toggleSidebarMinimize.bind(this));
        document.getElementById('sidebar-close').addEventListener('click', this.closeSidebar.bind(this));
        
        // Add minimize/expand functionality for pinned view
        document.getElementById('sidebar-expand-pinned').addEventListener('click', this.toggleSidebarExpand.bind(this));
        document.getElementById('sidebar-minimize-pinned').addEventListener('click', this.toggleSidebarMinimize.bind(this));
        document.getElementById('sidebar-close-pinned').addEventListener('click', this.closeSidebar.bind(this));
        document.getElementById('clear-all-pins').addEventListener('click', this.clearAllPinnedMessages.bind(this));
        
        // Add back to grid functionality
        document.getElementById('back-to-grid-btn').addEventListener('click', this.backToGrid.bind(this));
        
        // Add resize functionality
        this.initializeSidebarResize();
        
        // Initialize smart scroll tracking
        this.initializeSmartScrolling();
        
        // Initialize model selector
        this.initializeModelSelector();
        
        // Update conversation title
        this.updateConversationTitle();
        
        // Set up title update observer
        this.observeNavigationChanges();
        
        // Initialize chat input functionality
        this.initializeChatInput();
        
        this.sidebar = sidebar;
    }

    toggleSidebarMinimize() {
        const sidebar = document.getElementById('chatgpt-extension-sidebar');
        
        if (sidebar.classList.contains('minimized')) {
            // Restore sidebar
            sidebar.classList.remove('minimized');
            this.removeRestoreButton();
        } else {
            // Minimize sidebar
            sidebar.classList.add('minimized');
            this.createRestoreButton();
        }
    }

    toggleSidebarExpand() {
        const sidebar = document.getElementById('chatgpt-extension-sidebar');
        const expandBtn = document.getElementById('sidebar-expand');
        const expandBtnPinned = document.getElementById('sidebar-expand-pinned');
        const mainContent = document.querySelector('main, .main, [role="main"]') || document.body;
        
        if (sidebar.classList.contains('expanded')) {
            // Restore to normal width
            sidebar.classList.remove('expanded');
            expandBtn.innerHTML = '⛶';
            expandBtn.title = 'Expand to full width';
            if (expandBtnPinned) {
                expandBtnPinned.innerHTML = '⛶';
                expandBtnPinned.title = 'Expand to full width';
            }
            
            // Restore main content
            mainContent.style.transform = '';
            mainContent.style.transition = '';
            
            console.log('Sidebar restored to normal width');
        } else {
            // Expand to full width
            sidebar.classList.add('expanded');
            expandBtn.innerHTML = '⇤';
            expandBtn.title = 'Restore width';
            if (expandBtnPinned) {
                expandBtnPinned.innerHTML = '⇤';
                expandBtnPinned.title = 'Restore width';
            }
            
            // Hide main content by sliding it left
            mainContent.style.transition = 'transform 0.3s ease';
            mainContent.style.transform = 'translateX(-100%)';
            
            console.log('Sidebar expanded to full width');
        }

        // Refresh pinned messages if on pinned tab to switch between grid and list view
        if (document.getElementById('tab-pinned').classList.contains('active')) {
            setTimeout(() => {
                this.loadPinnedMessages();
            }, 300); // Wait for animation to complete
        }
    }

    createRestoreButton() {
        // Remove existing restore button if any
        this.removeRestoreButton();
        
        const restoreBtn = document.createElement('button');
        restoreBtn.id = 'chatgpt-restore-button';
        restoreBtn.className = 'chatgpt-restore-button';
        restoreBtn.innerHTML = '💬';
        restoreBtn.title = 'Restore ChatGPT Extension';
        
        restoreBtn.addEventListener('click', () => {
            this.toggleSidebarMinimize();
        });
        
        document.body.appendChild(restoreBtn);
    }

    removeRestoreButton() {
        const existingBtn = document.getElementById('chatgpt-restore-button');
        if (existingBtn) {
            existingBtn.remove();
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('chatgpt-extension-sidebar');
        if (sidebar) {
            // If sidebar is in expanded (full-screen) mode, first restore to normal mode
            if (sidebar.classList.contains('expanded')) {
                console.log('Sidebar is in full-screen mode, restoring to normal mode instead of closing');
                this.toggleSidebarExpand(); // This will restore to normal mode
                return; // Don't close the sidebar, just exit full-screen
            }
            
            // Normal close behavior - remove sidebar completely
            sidebar.remove();
        }
        this.removeRestoreButton();
    }

    initializeSidebarResize() {
        const sidebar = document.getElementById('chatgpt-extension-sidebar');
        const resizeHandle = sidebar.querySelector('.sidebar-resize-handle');
        let isResizing = false;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });

        function handleMouseMove(e) {
            if (!isResizing) return;
            
            const newWidth = window.innerWidth - e.clientX;
            const minWidth = 250;
            const maxWidth = window.innerWidth * 0.8;
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                sidebar.style.width = newWidth + 'px';
                // CSS custom property no longer needed since we removed body margin
            }
        }

        function handleMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }

    initializeChatInput() {
        const textarea = document.getElementById('sidebar-input');
        const sendButton = document.getElementById('sidebar-send');
        let currentMessageId = null;
        
        if (!textarea || !sendButton) return;
        
        // Auto-resize textarea
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            const maxHeight = 200; // Maximum height in pixels
            const newHeight = Math.min(textarea.scrollHeight, maxHeight);
            textarea.style.height = newHeight + 'px';
            
            // Enable/disable send button based on content
            const hasContent = textarea.value.trim().length > 0;
            sendButton.disabled = !hasContent || !currentMessageId;
        });
        
        // Handle send button click
        sendButton.addEventListener('click', () => {
            this.sendChatMessage(currentMessageId);
        });
        
        // Handle Enter key (send message)
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendButton.disabled) {
                    this.sendChatMessage(currentMessageId);
                }
            }
        });
        
        // Store reference for other methods to use
        this.chatInput = {
            textarea,
            sendButton,
            setActiveMessage: (messageId) => {
                currentMessageId = messageId;
                if (messageId) {
                    textarea.disabled = false;
                    textarea.placeholder = "Ask a question about this message...";
                    sendButton.disabled = textarea.value.trim().length === 0;
                } else {
                    textarea.disabled = true;
                    textarea.placeholder = "Select a message to start chatting...";
                    sendButton.disabled = true;
                }
            }
        };
    }

    async sendChatMessage(messageId) {
        if (!messageId || !this.chatInput) return;
        
        const textarea = this.chatInput.textarea;
        const sendButton = this.chatInput.sendButton;
        const question = textarea.value.trim();
        
        if (!question) return;
        
        // Clear input and disable while processing
        textarea.value = '';
        textarea.style.height = 'auto';
        textarea.disabled = true;
        sendButton.disabled = true;
        
        try {
            // Find the message element
            const button = document.querySelector(`[data-message-id="${messageId}"]`);
            if (!button) throw new Error('Message not found');
            
            let messageElement = button;
            while (messageElement && !this.isMessageElement(messageElement)) {
                messageElement = messageElement.parentElement;
            }
            
            if (!messageElement) throw new Error('Message element not found');
            
            // Process the question (this will handle adding the message and thinking indicator)
            await this.processQuestion(messageElement, messageId, question, true);
            
        } catch (error) {
            console.error('Failed to send chat message:', error);
            this.addChatMessage('system', `Error: ${error.message}`);
        } finally {
            // Re-enable input
            textarea.disabled = false;
            this.chatInput.setActiveMessage(messageId);
        }
    }

    addChatMessage(role, content, isThinking = false, messageId = null, animated = false) {
        const messagesContainer = document.getElementById('sidebar-messages');
        if (!messagesContainer) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${role}${isThinking ? ' thinking' : ''}`;
        
        // Generate message ID if not provided
        if (!messageId) {
            messageId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        }
        messageEl.setAttribute('data-message-id', messageId);
        
        if (isThinking) {
            messageEl.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="thinking-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
            // Return ID for later removal
            const thinkingId = Date.now().toString();
            messageEl.setAttribute('data-thinking-id', thinkingId);
            messagesContainer.appendChild(messageEl);
            this.smoothScrollToBottom(messagesContainer);
            return thinkingId;
        } else if (role === 'user') {
            messageEl.innerHTML = `
                <div class="message-avatar">👤</div>
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                </div>
                <button class="delete-message-btn" onclick="chatGPTExtension.deleteMessage('${messageId}')" title="Delete message">×</button>
            `;
            messagesContainer.appendChild(messageEl);
            this.smoothScrollToBottom(messagesContainer);
        } else if (role === 'assistant') {
            messageEl.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text" id="message-text-${messageId}"></div>
                </div>
                <button class="delete-message-btn" onclick="chatGPTExtension.deleteMessage('${messageId}')" title="Delete message">×</button>
            `;
            messagesContainer.appendChild(messageEl);
            
            if (animated && content) {
                this.animateTyping(messageId, content, messagesContainer);
            } else {
                const messageTextEl = document.getElementById(`message-text-${messageId}`);
                if (messageTextEl) {
                    messageTextEl.innerHTML = this.formatResponse(content);
                }
                this.smoothScrollToBottom(messagesContainer);
            }
        } else if (role === 'system') {
            messageEl.innerHTML = `
                <div class="message-avatar">⚠️</div>
                <div class="message-content">
                    <div class="message-text error">${this.escapeHtml(content)}</div>
                </div>
                <button class="delete-message-btn" onclick="chatGPTExtension.deleteMessage('${messageId}')" title="Delete message">×</button>
            `;
            messagesContainer.appendChild(messageEl);
            this.smoothScrollToBottom(messagesContainer);
        }
        
        return messageId;
    }

    removeThinkingMessage(thinkingId) {
        if (!thinkingId) return;
        const thinkingEl = document.querySelector(`[data-thinking-id="${thinkingId}"]`);
        if (thinkingEl) {
            thinkingEl.remove();
        }
    }

    animateTyping(messageId, content, messagesContainer) {
        const messageTextEl = document.getElementById(`message-text-${messageId}`);
        if (!messageTextEl || !content) return;

        // Split content into meaningful chunks for realistic typing
        const chunks = this.createTypingChunks(content);
        
        let currentChunkIndex = 0;
        let currentContent = '';
        const typingSpeed = 80; // milliseconds per chunk
        
        // Add typing cursor
        messageTextEl.innerHTML = '<span class="typing-cursor">▋</span>';
        
        const typeNextChunk = () => {
            if (currentChunkIndex < chunks.length) {
                currentContent += chunks[currentChunkIndex];
                currentChunkIndex++;
                
                // Format and display current content with cursor
                const formattedContent = this.formatResponse(currentContent);
                messageTextEl.innerHTML = formattedContent + '<span class="typing-cursor">▋</span>';
                
                // Auto-scroll as content expands
                this.smoothScrollToBottom(messagesContainer);
                
                // Continue typing with variable speed based on chunk type
                const delay = this.getChunkDelay(chunks[currentChunkIndex - 1]);
                setTimeout(typeNextChunk, delay);
            } else {
                // Typing complete, show final formatted content without cursor
                const finalContent = this.formatResponse(content);
                messageTextEl.innerHTML = finalContent;
                
                // Final scroll to ensure everything is visible
                this.smoothScrollToBottom(messagesContainer);
            }
        };
        
        // Start typing animation
        setTimeout(typeNextChunk, 100); // Small delay before starting
    }

    createTypingChunks(content) {
        const chunks = [];
        
        // Split by lines first to handle markdown structure
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim() === '') {
                // Empty line - add as single chunk
                chunks.push('\n');
                continue;
            }
            
            // Check if line is a markdown structure element
            if (this.isMarkdownStructure(line)) {
                // Add markdown structures as complete chunks
                chunks.push(line + '\n');
            } else {
                // Regular text - split into word chunks for natural typing
                const words = line.split(' ');
                let currentChunk = '';
                
                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    
                    // Add word to current chunk
                    if (currentChunk === '') {
                        currentChunk = word;
                    } else {
                        currentChunk += ' ' + word;
                    }
                    
                    // Create chunk every 3-5 words or at punctuation
                    const shouldCreateChunk = 
                        (i % 4 === 3) || // Every 4 words
                        word.match(/[.!?;:]$/) || // End of sentence
                        word.match(/,$/) || // Comma pause
                        (i === words.length - 1); // End of line
                    
                    if (shouldCreateChunk) {
                        chunks.push(currentChunk);
                        currentChunk = '';
                        
                        // Add space for next word if not end of line
                        if (i < words.length - 1) {
                            chunks.push(' ');
                        }
                    }
                }
                
                chunks.push('\n'); // Add newline after processing line
            }
        }
        
        return chunks.filter(chunk => chunk !== ''); // Remove empty chunks
    }

    isMarkdownStructure(line) {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.match(/^#{1,6}\s/)) return true;
        
        // Lists
        if (trimmed.match(/^[-*+]\s/) || trimmed.match(/^\d+\.\s/)) return true;
        
        // Code blocks
        if (trimmed.match(/^```/)) return true;
        
        // Blockquotes
        if (trimmed.match(/^>\s/)) return true;
        
        // Horizontal rules
        if (trimmed.match(/^---+$/)) return true;
        
        return false;
    }

    getChunkDelay(chunk) {
        if (!chunk) return 80;
        
        // Faster for spaces and short chunks
        if (chunk.trim() === '' || chunk.length <= 2) {
            return 30;
        }
        
        // Slower for markdown structures
        if (this.isMarkdownStructure(chunk)) {
            return 120;
        }
        
        // Pause longer at punctuation
        if (chunk.match(/[.!?]$/)) {
            return 150;
        }
        
        if (chunk.match(/[,;:]$/)) {
            return 100;
        }
        
        // Variable speed based on chunk length
        const baseSpeed = 80;
        const lengthMultiplier = Math.min(chunk.length / 10, 2); // Max 2x slower
        
        return Math.floor(baseSpeed * lengthMultiplier);
    }

    smoothScrollToBottom(container) {
        if (!container) return;
        
        // Check if user has manually scrolled up
        const userHasScrolledUp = container.hasAttribute('data-user-scrolled');
        if (userHasScrolledUp) {
            return; // Don't auto-scroll if user has manually scrolled up
        }
        
        // Check if user is near the bottom (within 50px threshold)
        const threshold = 50;
        const isNearBottom = this.isUserNearBottom(container, threshold);
        
        // Only auto-scroll if user is already near the bottom
        if (!isNearBottom) {
            return;
        }
        
        const targetScrollTop = container.scrollHeight - container.clientHeight;
        const currentScrollTop = container.scrollTop;
        const distance = targetScrollTop - currentScrollTop;
        
        if (Math.abs(distance) < 5) {
            // If we're close enough, just set it directly
            container.scrollTop = targetScrollTop;
            return;
        }
        
        // Smooth scroll animation
        const duration = 200; // milliseconds
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            container.scrollTop = currentScrollTop + (distance * easeOut);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                container.scrollTop = targetScrollTop;
            }
        };
        
        requestAnimationFrame(animateScroll);
    }

    isUserNearBottom(container, threshold = 50) {
        if (!container) return false;
        
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        // Calculate distance from bottom
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        
        return distanceFromBottom <= threshold;
    }

    initializeSmartScrolling() {
        const messagesContainer = document.getElementById('sidebar-messages');
        if (!messagesContainer) return;

        // Track user scroll behavior
        let userHasScrolledUp = false;
        let scrollTimeout;

        messagesContainer.addEventListener('scroll', () => {
            // Clear existing timeout
            clearTimeout(scrollTimeout);
            
            // Check if user is near bottom
            const isNearBottom = this.isUserNearBottom(messagesContainer, 50);
            
            if (!isNearBottom) {
                // User has scrolled up
                userHasScrolledUp = true;
                messagesContainer.setAttribute('data-user-scrolled', 'true');
            } else {
                // User is back at bottom, re-enable auto-scroll after a delay
                scrollTimeout = setTimeout(() => {
                    userHasScrolledUp = false;
                    messagesContainer.removeAttribute('data-user-scrolled');
                }, 1000); // 1 second delay before re-enabling auto-scroll
            }
        });

        // Store reference for other methods to check
        this.messagesContainer = messagesContainer;
    }

    observeChatMessages() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && this.isMessageElement(node)) {
                            shouldUpdate = true;
                        }
                    });
                }
            });
            
            if (shouldUpdate) {
                setTimeout(() => {
                    this.addReplyButtonsToExistingMessages();
                }, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    isMessageElement(element) {
        // Check if element is a chat message based on ChatGPT's DOM structure
        return element.querySelector && (
            element.querySelector('[data-message-author-role]') ||
            element.querySelector('.prose') ||
            element.classList.contains('group') ||
            element.querySelector('div[class*="markdown"]')
        );
    }

    addReplyButtonsToExistingMessages() {
        console.log('Adding reply buttons to existing messages...');
        
        // Find all chat messages in the current conversation
        const messageElements = this.findMessageElements();
        
        if (messageElements.length === 0) {
            console.log('No message elements found');
            return;
        }
        
        console.log(`Found ${messageElements.length} message elements`);
        
        messageElements.forEach((messageEl, index) => {
            if (!messageEl.querySelector('.extension-button-container')) {
                console.log(`Adding buttons to message ${index}`);
                this.addReplyButton(messageEl, index);
            } else {
                console.log(`Message ${index} already has buttons`);
            }
        });
        
        console.log('Finished adding reply buttons');
    }

    findMessageElements() {
        console.log('Finding assistant message elements...');
        
        // First, try to find assistant articles specifically
        let assistantArticles = document.querySelectorAll('article[data-turn="assistant"]');
        console.log(`Found ${assistantArticles.length} assistant articles`);
        
        if (assistantArticles.length > 0) {
            const filtered = Array.from(assistantArticles).filter(el => {
                // Check if already has our button
                if (el.querySelector('.extension-reply-button')) {
                    return false;
                }
                
                // Check if has "More actions" button (indicates it's a complete assistant message)
                if (el.querySelector('button[aria-label="More actions"]')) {
                    return true;
                }
                
                // Fallback: check for significant content
                const text = el.textContent.trim();
                return text.length > 20;
            });
            
            console.log(`Found ${filtered.length} valid assistant messages`);
            return filtered;
        }
        
        // No fallback - only use precise targeting
        console.log('No assistant articles found - only using precise targeting');
        return [];
    }

    async getMessageCount(messageId) {
        try {
            const conversation = await this.loadMessageConversation(messageId);
            return conversation.length;
        } catch (error) {
            console.error('Failed to get message count:', error);
            return 0;
        }
    }

    updateMessageBadge(messageId) {
        // Find the button for this specific message and update its badge
        const button = document.querySelector(`[data-message-id="${messageId}"]`);
        if (button) {
            this.getMessageCount(messageId).then(count => {
                const badge = button.querySelector('.message-count-badge');
                if (count > 0) {
                    if (badge) {
                        badge.textContent = count;
                    } else {
                        // Create badge if it doesn't exist
                        const newBadge = document.createElement('span');
                        newBadge.className = 'message-count-badge';
                        newBadge.textContent = count;
                        button.appendChild(newBadge);
                    }
                } else if (badge) {
                    badge.remove();
                }
            });
        }
    }

    async addReplyButton(messageElement, messageIndex) {
        console.log(`Trying to add button to message ${messageIndex}`);
        
        // Only add button to ChatGPT messages, not user messages
        if (this.isUserMessage(messageElement)) {
            console.log('Skipping user message');
            return;
        }

        // Generate unique message ID based on content and position
        const messageId = this.generateMessageId(messageElement, messageIndex);
        
        // Get message count for this thread
        const messageCount = await this.getMessageCount(messageId);
        
        const button = document.createElement('button');
        button.className = 'extension-reply-button';
        
        // Create button with badge if there are messages
        if (messageCount > 0) {
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z"/></svg>
                <span class="message-count-badge">${messageCount}</span>
            `;
        } else {
            button.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z"/></svg>';
        }
        
        button.title = `Ask Extension about this message${messageCount > 0 ? ` (${messageCount} messages)` : ''}`;
        button.setAttribute('data-message-id', messageId);
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.handleReplyButtonClick(messageElement, messageIndex, messageId, button);
        });
        
        // Find the "More actions" button within assistant messages
        const assistantArticle = messageElement.closest('article[data-turn="assistant"]') || 
                                (messageElement.querySelector && messageElement.querySelector('article[data-turn="assistant"]')) ||
                                messageElement;
        
        const moreActionsButton = assistantArticle.querySelector('button[aria-label="More actions"]');
        
        if (moreActionsButton) {
            // Create pin button
            const pinButton = document.createElement('button');
            pinButton.className = 'extension-pin-button';
            pinButton.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/></svg>';
            pinButton.title = 'Pin this message';
            pinButton.setAttribute('data-message-id', messageId);
            
            // Check if message is already pinned
            if (this.isMessagePinned(messageId)) {
                pinButton.classList.add('pinned');
                pinButton.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/></svg>';
                pinButton.title = 'Unpin this message';
            }
            
            pinButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.handlePinButtonClick(messageElement, messageIndex, messageId, pinButton);
            });

            // Create container for our buttons
            const container = document.createElement('div');
            container.className = 'extension-button-container';
            container.style.cssText = 'display: inline-flex; gap: 4px; position: relative;';
            container.appendChild(button);
            container.appendChild(pinButton);
            
            // Insert our button container right before the "More actions" button
            const actionContainer = moreActionsButton.parentElement;
            actionContainer.insertBefore(container, moreActionsButton);
            console.log(`Button container with reply and pin buttons inserted for message ${messageIndex}`);
        } else {
            console.log(`No "More actions" button found for message ${messageIndex}, skipping`);
            return; // Only add buttons where we can find the precise location
        }
        
        console.log(`Button added to message ${messageIndex} with ID ${messageId}`);
    }

    generateMessageId(messageElement, messageIndex) {
        // Create a unique ID based on message content and position
        const text = messageElement.textContent.trim().substring(0, 100);
        const hash = this.simpleHash(text + messageIndex);
        return `msg_${hash}`;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    async handleReplyButtonClick(messageElement, messageIndex, messageId, button) {
        console.log('handleReplyButtonClick called for message:', messageId);
        
        // Create sidebar if it doesn't exist
        if (!document.getElementById('chatgpt-extension-sidebar')) {
            await this.createSidebar();
        }
        
        // Load existing conversation for this message
        const existingConversation = await this.loadMessageConversation(messageId);
        console.log('Existing conversation check:', existingConversation.length, 'entries');
        
        if (existingConversation && existingConversation.length > 0) {
            console.log('Opening sidebar for existing conversation');
            // Show existing conversation in sidebar
            await this.showExistingConversation(messageId, existingConversation);
        } else {
            console.log('Opening sidebar for new conversation');
            // Directly open sidebar and activate input for this message
            await this.openSidebarForNewConversation(messageId);
        }
        
        // Ensure sidebar is visible
        const sidebar = document.querySelector('.chatgpt-extension-sidebar');
        if (sidebar && sidebar.classList.contains('minimized')) {
            this.toggleSidebarMinimize();
        }
    }

    closeExistingPopover() {
        const existingPopover = document.querySelector('.extension-question-popover');
        if (existingPopover) {
            existingPopover.remove();
        }
    }

    createAskChatInterface(options = {}) {
        const {
            messageElement,
            messageId,
            container,
            isInline = false,
            title = '💬 Ask about this message',
            placeholder = 'What would you like to ask about this message?',
            onSubmit = null,
            onCancel = null,
            showCloseButton = true,
            showCancelButton = true
        } = options;

        const interfaceId = `ask-interface-${messageId}-${Date.now()}`;
        
        const interfaceHTML = `
            <div class="ask-chat-interface ${isInline ? 'inline' : 'popover'}" data-message-id="${messageId}" id="${interfaceId}">
                <div class="ask-chat-content">
                    ${!isInline ? `
                        <div class="ask-chat-header">
                            <span>${title}</span>
                            ${showCloseButton ? '<button class="ask-chat-close">×</button>' : ''}
                        </div>
                    ` : ''}
                    <div class="ask-chat-body">
                        ${isInline ? `<div class="ask-chat-title">${title}</div>` : ''}
                        <div class="ask-chat-context-preview" data-message-id="${messageId}">
                            <div class="context-preview-header">
                                <span>📋 Context Preview</span>
                                <button class="context-toggle" data-message-id="${messageId}">Show Context</button>
                            </div>
                            <div class="context-preview-content" style="display: none;"></div>
                        </div>
                        <textarea 
                            class="ask-chat-input" 
                            placeholder="${placeholder}"
                            rows="3"
                            data-message-id="${messageId}"
                        ></textarea>
                        <div class="ask-chat-actions">
                            <button class="ask-chat-submit" data-message-id="${messageId}">Ask Extension</button>
                            ${showCancelButton ? '<button class="ask-chat-cancel">Cancel</button>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create the interface element
        const interfaceElement = document.createElement('div');
        interfaceElement.innerHTML = interfaceHTML;
        const askInterface = interfaceElement.firstElementChild;

        // Add to container
        container.appendChild(askInterface);

        // Set up event handlers
        this.setupAskChatHandlers(askInterface, {
            messageElement,
            messageId,
            onSubmit,
            onCancel,
            isInline
        });

        return askInterface;
    }

    setupAskChatHandlers(askInterface, options) {
        const {
            messageElement,
            messageId,
            onSubmit,
            onCancel,
            isInline
        } = options;

        const textarea = askInterface.querySelector('.ask-chat-input');
        const submitButton = askInterface.querySelector('.ask-chat-submit');
        const cancelButton = askInterface.querySelector('.ask-chat-cancel');
        const closeButton = askInterface.querySelector('.ask-chat-close');

        // Function to remove interface
        const removeInterface = () => {
            if (askInterface.parentNode) {
                askInterface.remove();
            }
        };

        // Focus on textarea
        setTimeout(() => {
            if (textarea) {
                textarea.focus();
            }
        }, 100);

        // Handle submit button
        if (submitButton) {
            submitButton.addEventListener('click', async () => {
                const question = textarea.value.trim();
                console.log('Ask chat submit clicked, question:', question);
                
                if (!question) {
                    alert('Please enter a question');
                    return;
                }

                try {
                    // Disable button during processing
                    submitButton.disabled = true;
                    submitButton.textContent = 'Processing...';

                    if (onSubmit) {
                        await onSubmit(question);
                    } else {
                        // Default behavior
                        await this.processQuestion(messageElement, messageId, question, true);
                    }

                    // Clear textarea
                    textarea.value = '';

                    if (!isInline) {
                        removeInterface();
                    }

                } catch (error) {
                    console.error('Error in ask chat interface:', error);
                    alert(`Error: ${error.message}`);
                } finally {
                    // Re-enable button
                    submitButton.disabled = false;
                    submitButton.textContent = 'Ask Extension';
                }
            });
        }

        // Handle cancel and close buttons
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                if (onCancel) {
                    onCancel();
                } else {
                    removeInterface();
                }
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', removeInterface);
        }

        // Handle Enter key for submission
        if (textarea) {
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (submitButton) {
                        submitButton.click();
                    }
                } else if (e.key === 'Escape' && !isInline) {
                    removeInterface();
                }
            });
        }

        // Setup context preview
        this.setupAskChatContextPreview(askInterface, messageId);

        // Handle click outside for popover mode
        if (!isInline) {
            setTimeout(() => {
                const handleClickOutside = (e) => {
                    if (!askInterface.contains(e.target)) {
                        removeInterface();
                        document.removeEventListener('click', handleClickOutside);
                    }
                };
                document.addEventListener('click', handleClickOutside);
            }, 100);
        }
    }

    setupAskChatContextPreview(askInterface, messageId) {
        const contextToggleButton = askInterface.querySelector('.context-toggle');
        const previewContent = askInterface.querySelector('.context-preview-content');

        if (!contextToggleButton || !previewContent) return;

        contextToggleButton.addEventListener('click', () => {
            const isVisible = previewContent.style.display !== 'none';

            if (isVisible) {
                previewContent.style.display = 'none';
                contextToggleButton.textContent = 'Show Context';
            } else {
                // Load and display context preview
                const contextPreview = this.getContextPreview(messageId);

                if (contextPreview.hasContext) {
                    previewContent.innerHTML = `
                        <div class="context-info">
                            <strong>Total messages in context: ${contextPreview.totalMessages}</strong>
                            ${contextPreview.isPartial ? `<em>(showing last ${contextPreview.preview.length})</em>` : ''}
                        </div>
                        <div class="context-messages">
                            ${contextPreview.preview.map((msg, index) => `
                                <div class="context-message">
                                    <div class="context-message-role">${msg.role === 'user' ? '👤' : '🤖'} ${msg.role}</div>
                                    <div class="context-message-content">${msg.content}</div>
                                    ${msg.fullLength > 100 ? `<div class="context-message-info">${msg.fullLength} characters total</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    previewContent.innerHTML = '<div class="no-context">No saved context available. Context will be generated when you ask a question.</div>';
                }

                previewContent.style.display = 'block';
                contextToggleButton.textContent = 'Hide Context';
            }
        });
    }

    showQuestionPopover(messageElement, messageId, button) {
        console.log('showQuestionPopover called for message:', messageId);
        
        try {
            // Close any existing popover
            this.closeExistingPopover();
            
            // Create container for the popover
            const popoverContainer = document.createElement('div');
            popoverContainer.className = 'extension-question-popover';
            popoverContainer.style.cssText = `
                position: absolute;
                z-index: 10002;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 8px 0;
                top: 100%;
                padding: 0;
            `;
            
            // Insert popover container
            const buttonContainer = button.parentElement;
            buttonContainer.appendChild(popoverContainer);
            
            // Create the reusable ask chat interface in popover mode
            this.createAskChatInterface({
                messageElement,
                messageId,
                container: popoverContainer,
                isInline: false,
                title: '💬 Ask about this message',
                placeholder: 'What would you like to ask about this message?',
                onSubmit: async (question) => {
                    await this.processQuestion(messageElement, messageId, question, false);
                },
                onCancel: () => {
                    popoverContainer.remove();
                }
            });
            
        } catch (error) {
            console.error('Error creating question popover:', error);
        }
    }

    showPopoverError(popover, message) {
        let errorEl = popover.querySelector('.popover-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'popover-error';
            popover.querySelector('.popover-body').appendChild(errorEl);
        }
        errorEl.textContent = message;
        setTimeout(() => errorEl.remove(), 3000);
    }

    // Pin functionality methods
    handlePinButtonClick(messageElement, messageIndex, messageId, button) {
        if (this.isMessagePinned(messageId)) {
            this.unpinMessage(messageId);
            button.classList.remove('pinned');
            button.title = 'Pin this message';
        } else {
            this.pinMessage(messageElement, messageId);
            button.classList.add('pinned');
            button.title = 'Unpin this message';
        }
    }

    isMessagePinned(messageId) {
        const pinnedMessages = this.getPinnedMessages();
        return pinnedMessages.some(msg => msg.id === messageId);
    }

    pinMessage(messageElement, messageId) {
        const pinnedMessages = this.getPinnedMessages();
        
        // Get conversation context
        const conversationTitle = this.getCurrentConversationTitle();
        const conversationUrl = window.location.href;
        const conversationId = this.extractConversationIdFromUrl(conversationUrl);
        
        // Extract message content with formatting
        const messageContent = this.extractMessageContent(messageElement);
        
        const pinnedMessage = {
            id: messageId,
            content: messageContent,
            timestamp: new Date().toISOString(),
            conversationId: conversationId,
            conversationTitle: conversationTitle,
            conversationUrl: conversationUrl,
            messageIndex: this.getMessageIndex(messageElement)
        };
        
        pinnedMessages.push(pinnedMessage);
        localStorage.setItem('chatgpt_pinned_messages', JSON.stringify(pinnedMessages));
        
        // Show success notification
        this.showNotification('Message pinned successfully!', 'success');
    }

    unpinMessage(messageId) {
        const pinnedMessages = this.getPinnedMessages();
        const filteredMessages = pinnedMessages.filter(msg => msg.id !== messageId);
        localStorage.setItem('chatgpt_pinned_messages', JSON.stringify(filteredMessages));
        
        // Show success notification
        this.showNotification('Message unpinned!', 'info');
    }

    getPinnedMessages() {
        const stored = localStorage.getItem('chatgpt_pinned_messages');
        return stored ? JSON.parse(stored) : [];
    }

    extractMessageContent(messageElement) {
        // Clone the element to preserve formatting
        const clone = messageElement.cloneNode(true);
        
        // Remove any extension buttons
        clone.querySelectorAll('.extension-reply-button, .extension-pin-button, .extension-button-container').forEach(el => el.remove());
        
        // Get the message content with HTML formatting
        const contentEl = clone.querySelector('[data-message-author-role="assistant"]') || clone;
        return {
            html: contentEl.innerHTML,
            text: contentEl.textContent.trim()
        };
    }

    extractConversationIdFromUrl(url) {
        const match = url.match(/\/c\/([a-f0-9-]+)/);
        return match ? match[1] : 'unknown';
    }

    getMessageIndex(messageElement) {
        const allMessages = document.querySelectorAll('[data-message-author-role]');
        return Array.from(allMessages).indexOf(messageElement.closest('[data-message-author-role]'));
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `chatgpt-extension-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10a37f' : '#2196f3'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10002;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Tab switching functionality
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Update views
        document.querySelectorAll('.sidebar-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${tabName}-view`).classList.add('active');

        // Load pinned messages if switching to pinned tab
        if (tabName === 'pinned') {
            this.loadPinnedMessages();
        }
    }

    loadPinnedMessages(filteredMessages = null) {
        let pinnedMessages = filteredMessages || this.getPinnedMessages();
        const container = document.getElementById('pinned-messages-container');
        const sidebar = document.getElementById('chatgpt-extension-sidebar');
        const isExpanded = sidebar.classList.contains('expanded');
        
        // Load tags filter bar
        this.loadTagsFilter();
        
        if (pinnedMessages.length === 0) {
            container.innerHTML = `
                <div class="no-pins-message">
                    <div class="system-message">
                        <div class="message-avatar">📌</div>
                        <div class="message-content">
                            <p>${filteredMessages ? 'No messages match your filter!' : 'No pinned messages yet!'}</p>
                            <p>${filteredMessages ? 'Try adjusting your tag filter or search term.' : 'Click the pin button (📌) on any ChatGPT message to save it here for easy reference.'}</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Sort messages by timestamp (newest first)
        pinnedMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (isExpanded) {
            this.loadMasonryGrid(pinnedMessages, container);
        } else {
            this.loadRegularList(pinnedMessages, container);
        }
    }

    loadMasonryGrid(pinnedMessages, container) {
        const columnCount = Math.max(2, Math.min(4, Math.floor(container.offsetWidth / 320)));
        const columns = Array.from({ length: columnCount }, () => []);
        
        // Distribute messages across columns (simple round-robin for now)
        pinnedMessages.forEach((msg, index) => {
            columns[index % columnCount].push(msg);
        });

        const gridHTML = `
            <div class="pinned-messages-grid">
                ${columns.map(columnMessages => `
                    <div class="masonry-column">
                        ${columnMessages.map(msg => this.createCondensedCard(msg)).join('')}
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = gridHTML;

        // Add click listeners to condensed cards
        container.querySelectorAll('.pinned-message-condensed').forEach(card => {
            card.addEventListener('click', (e) => {
                console.log('Card clicked:', e.target, 'Closest actions:', e.target.closest('.condensed-actions'));
                if (!e.target.closest('.condensed-actions')) {
                    const messageId = card.dataset.messageId;
                    console.log('Opening detailed view for message:', messageId);
                    this.showDetailedView(messageId);
                } else {
                    console.log('Click was on actions, not opening detail view');
                }
            });
        });

        // Add click listeners to tags for filtering
        container.querySelectorAll('.message-tag').forEach(tagEl => {
            tagEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const tag = tagEl.dataset.tag;
                this.filterByTag(tag);
            });
        });

        // Add click listeners to tag buttons
        const tagButtons = container.querySelectorAll('.tag-btn');
        console.log('Found masonry tag buttons:', tagButtons.length);
        tagButtons.forEach(tagBtn => {
            tagBtn.addEventListener('click', (e) => {
                console.log('Masonry tag button clicked!');
                e.stopPropagation();
                const messageId = tagBtn.dataset.messageId;
                console.log('Message ID:', messageId);
                this.showTagInput(messageId, e);
            });
        });
    }

    loadRegularList(pinnedMessages, container) {
        // Create a 2-column grid for sidebar view
        const columns = [[], []];
        
        // Distribute messages across 2 columns
        pinnedMessages.forEach((msg, index) => {
            columns[index % 2].push(msg);
        });

        const gridHTML = `
            <div class="pinned-messages-sidebar-grid">
                ${columns.map(columnMessages => `
                    <div class="sidebar-masonry-column">
                        ${columnMessages.map(msg => this.createSidebarCondensedCard(msg)).join('')}
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = gridHTML;

        // Add click listeners to condensed cards
        container.querySelectorAll('.pinned-message-sidebar-condensed').forEach(card => {
            card.addEventListener('click', (e) => {
                console.log('Sidebar card clicked:', e.target, 'Closest actions:', e.target.closest('.condensed-actions'));
                if (!e.target.closest('.condensed-actions')) {
                    const messageId = card.dataset.messageId;
                    console.log('Opening detailed view for message:', messageId);
                    this.showDetailedView(messageId);
                } else {
                    console.log('Click was on actions, not opening detail view');
                }
            });
        });

        // Add click listeners to tags for filtering
        container.querySelectorAll('.message-tag').forEach(tagEl => {
            tagEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const tag = tagEl.dataset.tag;
                this.filterByTag(tag);
            });
        });

        // Add click listeners to tag buttons
        const tagButtons = container.querySelectorAll('.tag-btn');
        console.log('Found sidebar tag buttons:', tagButtons.length);
        tagButtons.forEach(tagBtn => {
            tagBtn.addEventListener('click', (e) => {
                console.log('Sidebar tag button clicked!');
                e.stopPropagation();
                const messageId = tagBtn.dataset.messageId;
                console.log('Message ID:', messageId);
                this.showTagInput(messageId, e);
            });
        });
    }

    createCondensedCard(msg) {
        const tags = this.getPinnedMessageTags(msg.id);
        return `
            <div class="pinned-message-condensed" data-message-id="${msg.id}">
                <div class="condensed-header">
                    <div class="condensed-conversation-info">
                        <div class="condensed-conversation-title">${msg.conversationTitle}</div>
                        <div class="condensed-timestamp">${this.formatTimestamp(msg.timestamp)}</div>
                    </div>
                    <div class="condensed-actions">
                        <button class="tag-btn" data-message-id="${msg.id}" title="Add tags">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.707 9.293l-5-5A.997.997 0 0 0 12 4H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10c.266 0 .52-.105.707-.293l5-5a.999.999 0 0 0 0-1.414zM6 10a2 2 0 1 1 .001-4.001A2 2 0 0 1 6 10z"/>
                            </svg>
                        </button>
                        <button class="goto-conversation-btn" onclick="event.stopPropagation(); window.open('${msg.conversationUrl}', '_blank')" title="Go to conversation">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19,7V11H5.83L9.41,7.41L8,6L2,12L8,18L9.41,16.59L5.83,13H21V7H19Z"/>
                            </svg>
                        </button>
                        <button class="unpin-btn" onclick="event.stopPropagation(); chatGPTExtension.unpinMessageFromGrid('${msg.id}', event)" title="Unpin message">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="condensed-content">
                    ${this.stripHtml(msg.content.text)}
                </div>
                ${tags.length > 0 ? `
                    <div class="message-tags">
                        ${tags.map(tag => `<span class="message-tag" data-tag="${tag}">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    createSidebarCondensedCard(msg) {
        const tags = this.getPinnedMessageTags(msg.id);
        return `
            <div class="pinned-message-sidebar-condensed" data-message-id="${msg.id}">
                <div class="sidebar-condensed-header">
                    <div class="sidebar-condensed-conversation-info">
                        <div class="sidebar-condensed-conversation-title">${msg.conversationTitle}</div>
                        <div class="sidebar-condensed-timestamp">${this.formatTimestamp(msg.timestamp)}</div>
                    </div>
                    <div class="condensed-actions">
                        <button class="tag-btn" data-message-id="${msg.id}" title="Add tags">
                            <svg viewBox="0 0 16 16" fill="currentColor">
                                <path d="M14 2H8.414L7 .586A2 2 0 0 0 5.586 0H2A2 2 0 0 0 0 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
                            </svg>
                        </button>
                        <button class="goto-conversation-btn" onclick="event.stopPropagation(); window.open('${msg.conversationUrl}', '_blank')" title="Go to conversation">
                            <svg viewBox="0 0 16 16" fill="currentColor">
                                <path d="M12,7V9H6.41L8.7,11.29L7.29,12.7L3.59,9L7.29,5.29L8.7,6.7L6.41,9H14V7H12Z"/>
                            </svg>
                        </button>
                        <button class="unpin-btn" onclick="event.stopPropagation(); chatGPTExtension.unpinMessageFromGrid('${msg.id}', event)" title="Unpin message">
                            <svg viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="sidebar-condensed-content">
                    ${this.stripHtml(msg.content.text)}
                </div>
                ${tags.length > 0 ? `
                    <div class="message-tags">
                        ${tags.map(tag => `<span class="message-tag" data-tag="${tag}">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays-1} days ago`;
        
        return date.toLocaleDateString();
    }

    showDetailedView(messageId) {
        console.log('showDetailedView called with messageId:', messageId);
        const pinnedMessages = this.getPinnedMessages();
        const message = pinnedMessages.find(msg => msg.id === messageId);
        
        if (!message) {
            console.log('Message not found for messageId:', messageId);
            return;
        }
        
        console.log('Found message:', message);

        const sidebar = document.getElementById('chatgpt-extension-sidebar');
        const isExpanded = sidebar.classList.contains('expanded');
        const detailView = document.getElementById('pinned-detail-view');
        const gridView = document.getElementById('pinned-messages-container');
        
        // Hide grid and show detail view
        if (gridView) gridView.style.display = 'none';
        if (detailView) {
            detailView.style.display = 'flex';
            detailView.classList.add('active');
            // Store the message ID for later reference
            detailView.dataset.messageId = messageId;
        }
        
        // Load replies and questions for this message
        const replies = this.loadPinnedMessageReplies(messageId);
        const questions = this.loadPinnedMessageQuestions(messageId);
        
        // Update detail view content
        const detailContent = document.getElementById('detail-view-content');
        console.log('Detail content element:', detailContent);
        console.log('Is expanded:', isExpanded);
        console.log('Replies:', replies);
        console.log('Questions:', questions);
        
        if (detailContent) {
            if (isExpanded) {
                // Full-screen: simple message display
                detailContent.innerHTML = `
                    <div class="detail-message-section">
                        <div class="detail-section-header">
                            <span>📌 Pinned Message</span>
                        </div>
                        <div class="detail-section-content">
                            <div class="detail-message-content">
                                ${message.content?.html || message.content?.text || 'Content not available'}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Normal mode: simple message display
                detailContent.innerHTML = `
                    <div class="detail-message-content">
                        ${message.content?.html || message.content?.text || 'Content not available'}
                    </div>
                `;
            }
        }
        
        // Update header info
        const detailHeader = document.querySelector('.detail-conversation-info');
        if (detailHeader) {
            detailHeader.innerHTML = `
                <h3>${message.conversationTitle || 'Untitled Conversation'}</h3>
                <p>Pinned ${this.formatTimestamp(message.timestamp)}</p>
            `;
        }
        
        // No need for event listeners since we only show the message
    }

    setupDetailQuestionHandlers(messageId, message) {
        console.log('Setting up detail question handlers for message:', messageId);
        
        // Use a short delay to ensure DOM is ready
        setTimeout(() => {
            // Find question submit buttons specifically for this message in the detailed view
            const detailView = document.getElementById('pinned-detail-view');
            if (!detailView) {
                console.error('Detail view not found');
                return;
            }
            
            const questionButtons = detailView.querySelectorAll(`.detail-question-submit[data-message-id="${messageId}"]`);
            console.log('Found question buttons:', questionButtons.length);
            
            questionButtons.forEach((button, index) => {
                console.log(`Setting up handler for button ${index}`);
                
                // Remove any existing listeners to avoid duplicates
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                newButton.addEventListener('click', async (e) => {
                    console.log('Ask Question button clicked');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const questionInput = detailView.querySelector(`.detail-question-input[data-message-id="${messageId}"]`);
                    if (!questionInput) {
                        console.error('Question input not found for messageId:', messageId);
                        return;
                    }
                    
                    const question = questionInput.value.trim();
                    console.log('Question text:', question);
                    
                    if (!question) {
                        alert('Please enter a question');
                        return;
                    }
                    
                    try {
                        // Disable button during processing
                        newButton.disabled = true;
                        newButton.textContent = 'Processing...';
                        
                        // Create a temporary message element from the stored message data
                        const tempMessageElement = document.createElement('div');
                        tempMessageElement.textContent = message.content?.text || message.content?.html || '';
                        
                        console.log('Processing question...');
                        // Process the question using the same logic as popover questions
                        await this.processQuestion(tempMessageElement, messageId, question, true);
                        
                        // Clear the input
                        questionInput.value = '';
                        
                        // Refresh the detailed view to show the new reply
                        setTimeout(() => {
                            this.showDetailedView(messageId);
                        }, 1000);
                        
                    } catch (error) {
                        console.error('Error processing question from detailed view:', error);
                        alert(`Error: ${error.message}`);
                        
                        // Re-enable button on error
                        newButton.disabled = false;
                        newButton.textContent = 'Ask Question';
                    }
                });
            });
        }, 100);
        
        // Setup context toggle handlers with delay as well
        setTimeout(() => {
            this.setupContextToggleHandlers(messageId);
        }, 100);
        
        // Setup Enter key handlers for question inputs
        setTimeout(() => {
            this.setupQuestionInputHandlers(messageId);
        }, 100);
    }
    
    setupContextToggleHandlers(messageId) {
        const detailView = document.getElementById('pinned-detail-view');
        if (!detailView) return;
        
        const contextToggleButtons = detailView.querySelectorAll('.context-toggle');
        contextToggleButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', () => {
                const previewContent = detailView.querySelector('.context-preview-content');
                const isVisible = previewContent.style.display !== 'none';
                
                if (isVisible) {
                    previewContent.style.display = 'none';
                    newButton.textContent = 'Show Context';
                } else {
                    // Load and display context preview
                    const contextPreview = this.getContextPreview(messageId);
                    
                    if (contextPreview.hasContext) {
                        previewContent.innerHTML = `
                            <div class="context-info">
                                <strong>Total messages in context: ${contextPreview.totalMessages}</strong>
                                ${contextPreview.isPartial ? `<em>(showing last ${contextPreview.preview.length})</em>` : ''}
                            </div>
                            <div class="context-messages">
                                ${contextPreview.preview.map((msg, index) => `
                                    <div class="context-message">
                                        <div class="context-message-role">${msg.role === 'user' ? '👤' : '🤖'} ${msg.role}</div>
                                        <div class="context-message-content">${msg.content}</div>
                                        ${msg.fullLength > 100 ? `<div class="context-message-info">${msg.fullLength} characters total</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        `;
                    } else {
                        previewContent.innerHTML = '<div class="no-context">No saved context available. Context will be generated when you ask a question.</div>';
                    }
                    
                    previewContent.style.display = 'block';
                    newButton.textContent = 'Hide Context';
                }
            });
        });
    }
    
    setupQuestionInputHandlers(messageId) {
        const detailView = document.getElementById('pinned-detail-view');
        if (!detailView) return;
        
        const questionInputs = detailView.querySelectorAll('.detail-question-input');
        questionInputs.forEach(input => {
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            newInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const button = detailView.querySelector(`.detail-question-submit[data-message-id="${messageId}"]`);
                    if (button) {
                        button.click();
                    }
                }
            });
        });
    }

    backToGrid() {
        // Show grid view and hide detailed view
        const gridView = document.getElementById('pinned-messages-container');
        const detailView = document.getElementById('pinned-detail-view');
        
        if (gridView) {
            gridView.style.display = 'flex';
        }
        if (detailView) {
            detailView.style.display = 'none';
            detailView.classList.remove('active');
        }
        
        console.log('Back to grid clicked - hiding detail view');
    }

    unpinMessageFromView(messageId) {
        this.unpinMessage(messageId);
        this.loadPinnedMessages(); // Refresh the view
        
        // Update pin buttons in the main chat if present
        document.querySelectorAll(`.extension-pin-button[data-message-id="${messageId}"]`).forEach(btn => {
            btn.classList.remove('pinned');
            btn.title = 'Pin this message';
        });
    }

    clearAllPinnedMessages() {
        if (confirm('Are you sure you want to clear all pinned messages?')) {
            localStorage.removeItem('chatgpt_pinned_messages');
            this.loadPinnedMessages();
            this.showNotification('All pinned messages cleared!', 'info');
            
            // Update all pin buttons in the main chat
            document.querySelectorAll('.extension-pin-button.pinned').forEach(btn => {
                btn.classList.remove('pinned');
                btn.title = 'Pin this message';
            });
        }
    }

    unpinMessageFromGrid(messageId, event) {
        // Prevent card click when clicking unpin button
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        // Remove from storage
        const pins = this.getPinnedMessages();
        const updatedPins = pins.filter(pin => pin.id !== messageId);
        localStorage.setItem('chatgpt_pinned_messages', JSON.stringify(updatedPins));
        
        // Update pin button state in main chat
        document.querySelectorAll(`.extension-pin-button[data-message-id="${messageId}"]`).forEach(btn => {
            btn.classList.remove('pinned');
            btn.title = 'Pin this message';
        });
        
        // Reload pinned messages to reflect changes
        this.loadPinnedMessages();
        
        // Show success notification
        this.showNotification('Message unpinned successfully', 'success');
    }

    loadPinnedMessageReplies(messageId) {
        const conversationKey = `chatgpt_conversation_${messageId}`;
        const conversation = JSON.parse(localStorage.getItem(conversationKey) || '[]');
        
        // Filter out the original question to show only replies
        const replies = conversation.slice(1); // Skip the first item which is the original question
        
        return replies.map(item => ({
            question: item.question || '',
            response: item.response || '',
            timestamp: item.timestamp || Date.now()
        }));
    }

    loadPinnedMessageQuestions(messageId) {
        const conversationKey = `chatgpt_conversation_${messageId}`;
        const conversation = JSON.parse(localStorage.getItem(conversationKey) || '[]');
        
        // Extract just the questions (including the original if it exists)
        return conversation.map(item => ({
            question: item.question || '',
            timestamp: item.timestamp || Date.now()
        })).filter(item => item.question.trim() !== '');
    }

    // Tag Management Functions
    getPinnedMessageTags(messageId) {
        const tagsKey = `chatgpt_message_tags_${messageId}`;
        return JSON.parse(localStorage.getItem(tagsKey) || '[]');
    }

    setPinnedMessageTags(messageId, tags) {
        const tagsKey = `chatgpt_message_tags_${messageId}`;
        const cleanTags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
        localStorage.setItem(tagsKey, JSON.stringify(cleanTags));
        this.loadTagsFilter(); // Refresh the tags filter
        this.loadPinnedMessages(); // Refresh the messages display
    }

    getAllTags() {
        const pinnedMessages = this.getPinnedMessages();
        const allTags = new Set();
        
        pinnedMessages.forEach(msg => {
            const tags = this.getPinnedMessageTags(msg.id);
            tags.forEach(tag => allTags.add(tag));
        });
        
        return Array.from(allTags).sort();
    }

    addTagToMessage(messageId, tag) {
        const currentTags = this.getPinnedMessageTags(messageId);
        const cleanTag = tag.trim().toLowerCase();
        if (cleanTag && !currentTags.includes(cleanTag)) {
            currentTags.push(cleanTag);
            this.setPinnedMessageTags(messageId, currentTags);
        }
    }

    removeTagFromMessage(messageId, tag) {
        const currentTags = this.getPinnedMessageTags(messageId);
        const cleanTag = tag.trim().toLowerCase();
        const updatedTags = currentTags.filter(t => t !== cleanTag);
        this.setPinnedMessageTags(messageId, updatedTags);
    }

    filterMessagesByTag(tag) {
        if (!tag) return this.getPinnedMessages();
        
        const pinnedMessages = this.getPinnedMessages();
        return pinnedMessages.filter(msg => {
            const messageTags = this.getPinnedMessageTags(msg.id);
            return messageTags.includes(tag.toLowerCase());
        });
    }

    searchMessagesByTag(searchTerm) {
        if (!searchTerm) return this.getPinnedMessages();
        
        const pinnedMessages = this.getPinnedMessages();
        const searchLower = searchTerm.toLowerCase();
        
        return pinnedMessages.filter(msg => {
            const messageTags = this.getPinnedMessageTags(msg.id);
            return messageTags.some(tag => tag.includes(searchLower));
        });
    }

    loadTagsFilter() {
        const tagsFilterBar = document.getElementById('tags-filter-bar');
        const tagsList = document.getElementById('tags-list');
        const tagsSearchInput = document.getElementById('tags-search-input');
        const tagsClearFilter = document.getElementById('tags-clear-filter');
        
        if (!tagsFilterBar || !tagsList) return;
        
        const allTags = this.getAllTags();
        
        // Show/hide filter bar based on whether there are tags or messages
        const pinnedMessages = this.getPinnedMessages();
        if (allTags.length === 0 || pinnedMessages.length === 0) {
            tagsFilterBar.style.display = 'none';
            return;
        }
        
        tagsFilterBar.style.display = 'block';
        
        // Populate tags list
        tagsList.innerHTML = `
            <button class="tag-filter-btn active" data-tag="">All</button>
            ${allTags.map(tag => `
                <button class="tag-filter-btn" data-tag="${tag}">${tag}</button>
            `).join('')}
        `;
        
        // Add event listeners for tag filter buttons
        tagsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-filter-btn')) {
                // Update active state
                tagsList.querySelectorAll('.tag-filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Filter messages
                const selectedTag = e.target.dataset.tag;
                const filteredMessages = selectedTag ? this.filterMessagesByTag(selectedTag) : null;
                this.loadPinnedMessages(filteredMessages);
            }
        });
        
        // Add search functionality
        if (tagsSearchInput && !tagsSearchInput.hasAttribute('data-listener')) {
            tagsSearchInput.setAttribute('data-listener', 'true');
            tagsSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.trim();
                const filteredMessages = searchTerm ? this.searchMessagesByTag(searchTerm) : null;
                this.loadPinnedMessages(filteredMessages);
                
                // Update clear button visibility
                if (tagsClearFilter) {
                    tagsClearFilter.style.display = searchTerm ? 'block' : 'none';
                }
            });
        }
        
        // Add clear filter functionality
        if (tagsClearFilter && !tagsClearFilter.hasAttribute('data-listener')) {
            tagsClearFilter.setAttribute('data-listener', 'true');
            tagsClearFilter.addEventListener('click', () => {
                tagsSearchInput.value = '';
                tagsClearFilter.style.display = 'none';
                
                // Reset to show all messages
                tagsList.querySelectorAll('.tag-filter-btn').forEach(btn => btn.classList.remove('active'));
                tagsList.querySelector('[data-tag=""]').classList.add('active');
                this.loadPinnedMessages();
            });
        }
    }

    showTagInput(messageId, event) {
        console.log('showTagInput called with messageId:', messageId, 'event:', event);
        
        const existingInput = document.querySelector('.tag-input-overlay');
        if (existingInput) {
            existingInput.remove();
        }
        
        const currentTags = this.getPinnedMessageTags(messageId);
        const rect = event.target.getBoundingClientRect();
        
        const overlay = document.createElement('div');
        overlay.className = 'tag-input-overlay';
        overlay.innerHTML = `
            <div class="tag-input-container">
                <div class="tag-input-header">
                    <span>Tags for message</span>
                    <button class="tag-input-close">×</button>
                </div>
                <div class="current-tags">
                    ${currentTags.map(tag => `
                        <span class="current-tag">
                            ${tag}
                            <button class="remove-tag-btn" data-tag="${tag}">×</button>
                        </span>
                    `).join('')}
                </div>
                <div class="tag-input-form">
                    <input type="text" class="tag-input-field" placeholder="Add tag..." maxlength="20" />
                    <button class="add-tag-btn">Add</button>
                </div>
            </div>
        `;
        
        // Position overlay
        overlay.style.position = 'fixed';
        overlay.style.top = rect.bottom + 5 + 'px';
        overlay.style.left = Math.min(rect.left, window.innerWidth - 250) + 'px';
        overlay.style.zIndex = '10001';
        
        document.body.appendChild(overlay);
        
        // Focus input
        const input = overlay.querySelector('.tag-input-field');
        input.focus();
        
        // Add event listeners
        const closeBtn = overlay.querySelector('.tag-input-close');
        const addBtn = overlay.querySelector('.add-tag-btn');
        
        const closeInput = () => overlay.remove();
        
        closeBtn.addEventListener('click', closeInput);
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeInput();
        });
        
        // Add tag functionality
        const addTag = () => {
            const tagValue = input.value.trim();
            if (tagValue && tagValue.length <= 20) {
                this.addTagToMessage(messageId, tagValue);
                closeInput();
            }
        };
        
        addBtn.addEventListener('click', addTag);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });
        
        // Remove tag functionality
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag-btn')) {
                const tagToRemove = e.target.dataset.tag;
                this.removeTagFromMessage(messageId, tagToRemove);
                closeInput();
            }
        });
    }

    filterByTag(tag) {
        // Update the active tag in filter bar
        const tagsList = document.getElementById('tags-list');
        if (tagsList) {
            tagsList.querySelectorAll('.tag-filter-btn').forEach(btn => btn.classList.remove('active'));
            const targetBtn = tagsList.querySelector(`[data-tag="${tag}"]`);
            if (targetBtn) {
                targetBtn.classList.add('active');
            }
        }
        
        // Clear search input
        const searchInput = document.getElementById('tags-search-input');
        if (searchInput) {
            searchInput.value = '';
            const clearBtn = document.getElementById('tags-clear-filter');
            if (clearBtn) clearBtn.style.display = 'none';
        }
        
        // Filter and reload messages
        const filteredMessages = this.filterMessagesByTag(tag);
        this.loadPinnedMessages(filteredMessages);
    }

    switchDetailTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.detail-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.detail-tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab
        document.querySelector(`.detail-tab[onclick*="${tabName}"]`).classList.add('active');
        const tabContent = document.getElementById(`detail-${tabName}-tab`);
        tabContent.classList.add('active');
        
        // Special handling for replies tab - load ask chat interface
        if (tabName === 'replies') {
            this.loadRepliesTabWithAskInterface(tabContent);
        }
    }

    loadRepliesTabWithAskInterface(tabContent) {
        // Get the message ID from the current detailed view
        const detailView = document.getElementById('pinned-detail-view');
        if (!detailView) return;
        
        // Try to extract message ID from existing elements
        const messageId = this.getCurrentDetailViewMessageId();
        if (!messageId) {
            console.error('Could not determine message ID for replies tab');
            return;
        }
        
        // Get the pinned message data
        const pinnedMessages = this.getPinnedMessages();
        const message = pinnedMessages.find(msg => msg.id === messageId);
        
        if (!message) {
            console.error('Could not find message data for ID:', messageId);
            return;
        }
        
        // Create a temporary message element for the ask interface
        const tempMessageElement = document.createElement('div');
        tempMessageElement.textContent = message.content?.text || message.content?.html || '';
        
        // Clear existing content and add the ask chat interface
        tabContent.innerHTML = '';
        
        // Create container for the ask interface
        const askContainer = document.createElement('div');
        askContainer.className = 'replies-ask-container';
        tabContent.appendChild(askContainer);
        
        // Create the ask chat interface in inline mode
        this.createAskChatInterface({
            messageElement: tempMessageElement,
            messageId: messageId,
            container: askContainer,
            isInline: true,
            title: '💬 Ask a question about this pinned message',
            placeholder: 'What would you like to know about this message?',
            showCloseButton: false,
            showCancelButton: false,
            onSubmit: async (question) => {
                await this.processQuestion(tempMessageElement, messageId, question, true);
                
                // Refresh the replies tab to show the new conversation
                setTimeout(() => {
                    this.refreshRepliesTab(tabContent, messageId);
                }, 1000);
            }
        });
        
        // Also load existing replies if any
        this.loadExistingReplies(tabContent, messageId);
    }

    getCurrentDetailViewMessageId() {
        // Try multiple ways to get the current message ID
        
        // 1. Check if there's a data attribute on the detail view
        const detailView = document.getElementById('pinned-detail-view');
        if (detailView && detailView.dataset.messageId) {
            return detailView.dataset.messageId;
        }
        
        // 2. Look for existing elements with message ID
        const elementsWithMessageId = detailView.querySelectorAll('[data-message-id]');
        if (elementsWithMessageId.length > 0) {
            return elementsWithMessageId[0].dataset.messageId;
        }
        
        // 3. Try to extract from URL or other sources
        // This is a fallback - you might need to store the current message ID when showing the detail view
        return null;
    }

    loadExistingReplies(tabContent, messageId) {
        // Load existing conversation for this message
        this.loadMessageConversation(messageId).then(conversation => {
            if (conversation && conversation.length > 1) {
                const repliesContainer = document.createElement('div');
                repliesContainer.className = 'existing-replies-container';
                repliesContainer.innerHTML = `
                    <div class="replies-header">
                        <h4>Previous Questions & Answers</h4>
                    </div>
                    <div class="replies-list">
                        ${conversation.slice(1).map(reply => `
                            <div class="reply-item">
                                <div class="reply-question">
                                    <strong>Q:</strong> ${reply.question}
                                </div>
                                <div class="reply-answer">
                                    <strong>A:</strong> ${this.processMarkdown(reply.response || 'Loading...')}
                                </div>
                                <div class="reply-timestamp">
                                    ${this.formatTimestamp(reply.timestamp)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                tabContent.appendChild(repliesContainer);
            }
        });
    }

    refreshRepliesTab(tabContent, messageId) {
        // Clear and reload the replies tab
        const askContainer = tabContent.querySelector('.replies-ask-container');
        const existingReplies = tabContent.querySelector('.existing-replies-container');
        
        // Remove existing replies and reload
        if (existingReplies) {
            existingReplies.remove();
        }
        
        this.loadExistingReplies(tabContent, messageId);
    }

    async processQuestion(messageElement, messageId, question, hasExistingConversation) {
        console.log('Processing question:', question, 'for message:', messageId);
        
        try {
            // Get API key from storage
            console.log('Getting API key...');
            const apiKey = await this.getApiKey();
            console.log('API key retrieved:', apiKey ? 'Yes' : 'No');
            
            if (!apiKey) {
                throw new Error('Please set your OpenAI API key in the extension popup first!');
            }
            
            // Get the specific message text
            const messageText = messageElement.textContent.trim();
            console.log('Message text length:', messageText.length);
            
            // Parse conversation context up to and including the target message
            console.log('Parsing conversation context...');
            const conversationContext = this.parseConversationContext(messageElement, messageId);
            console.log('Conversation context:', conversationContext.length, 'messages');
            
            // Detect current ChatGPT model
            const currentModel = this.detectCurrentModel();
            console.log('Using model:', currentModel);
            
            // Add question to sidebar immediately
            await this.addQuestionToSidebar(messageId, question, messageText);
            
            // Show AI thinking in sidebar
            await this.addThinkingToSidebar(messageId);
            
            console.log('Making API call...');
            // Make API call through background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'makeApiCall',
                    data: {
                        apiKey: apiKey,
                        model: currentModel,
                        messages: conversationContext,
                        newQuestion: `About this specific message: "${messageText}"\n\nQuestion: ${question}\n\nPlease format your response using markdown for better readability (use headers, lists, code blocks, bold/italic text, etc. as appropriate).`
                    }
                }, (response) => {
                    console.log('Background script response:', response);
                    if (chrome.runtime.lastError) {
                        console.error('Chrome runtime error:', chrome.runtime.lastError);
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (response && response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response?.error || 'Unknown error'));
                    }
                });
            });
            
            console.log('API response received');
            // Remove thinking indicator
            this.removeThinkingFromSidebar(messageId);
            
            // Display response in sidebar
            await this.addResponseToSidebar(messageId, response);
            
            // Save conversation to localStorage
            await this.saveMessageConversation(messageId, question, response);
            
        } catch (error) {
            console.error('Error in processQuestion:', error);
            this.removeThinkingFromSidebar(messageId);
            await this.addErrorToSidebar(messageId, error.message);
            throw error;
        }
    }

    async loadMessageConversation(messageId) {
        try {
            console.log('Loading conversation for message:', messageId);
            const stored = localStorage.getItem(`extension_conversation_${messageId}`);
            const result = stored ? JSON.parse(stored) : [];
            console.log('Loaded conversation entries:', result.length);
            return result;
        } catch (error) {
            console.error('Failed to load conversation:', error);
            return [];
        }
    }

    async saveMessageConversation(messageId, question, response) {
        try {
            console.log('Saving conversation for message:', messageId);
            const existing = await this.loadMessageConversation(messageId);
            existing.push({
                question: question,
                response: response,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem(`extension_conversation_${messageId}`, JSON.stringify(existing));
            console.log('Conversation saved successfully');
            
            // Update the badge count for this specific message button
            this.updateMessageBadge(messageId);
        } catch (error) {
            console.error('Failed to save conversation:', error);
        }
    }

    async showExistingConversation(messageId, conversation) {
        // Ensure sidebar exists
        if (!document.getElementById('chatgpt-extension-sidebar')) {
            await this.createSidebar();
        }
        
        // Clear existing messages and load conversation
        const messagesContainer = document.getElementById('sidebar-messages');
        if (!messagesContainer) {
            console.error('Could not find sidebar messages container');
            return;
        }
        
        // Clear existing messages
        messagesContainer.innerHTML = '';
        
        // Add all conversation messages in chat style
        conversation.forEach(item => {
            this.addChatMessage('user', item.question);
            this.addChatMessage('assistant', item.response);
        });
        
        // Activate chat input for this message
        if (this.chatInput) {
            this.chatInput.setActiveMessage(messageId);
        }
        
        console.log('Existing conversation loaded in chat format');
    }

    async openSidebarForNewConversation(messageId) {
        // Ensure sidebar exists
        if (!document.getElementById('chatgpt-extension-sidebar')) {
            console.log('Sidebar not found, creating it...');
            await this.createSidebar();
        }
        
        // Clear existing messages to start fresh
        const messagesContainer = document.getElementById('sidebar-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="system-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            <p>Ready to chat about the selected message!</p>
                            <p>Type your question below and press Enter to send.</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Activate chat input for this message
        if (this.chatInput) {
            this.chatInput.setActiveMessage(messageId);
        }
        
        // Focus on the input textarea
        setTimeout(() => {
            const textarea = document.getElementById('sidebar-input');
            if (textarea) {
                textarea.focus();
            }
        }, 100);
        
        console.log('Sidebar opened for new conversation with message:', messageId);
    }

    async getApiKey() {
        try {
            console.log('Attempting to get API key from chrome.storage.local');
            // Use chrome.storage.local directly (secure storage doesn't exist in Chrome extensions)
            const result = await chrome.storage.local.get(['openai_api_key']);
            console.log('Storage result:', result);
            return result.openai_api_key;
        } catch (error) {
            console.error('Failed to get API key:', error);
            return null;
        }
    }

    detectCurrentModel() {
        console.log('Detecting current ChatGPT model...');
        
        // Method 1: Look for the model selector button (most reliable)
        const modelButton = document.querySelector('button[data-testid="model-switcher"]') ||
                           document.querySelector('button[class*="model"]') ||
                           document.querySelector('[role="button"][class*="model"]');
        
        if (modelButton) {
            const buttonText = modelButton.textContent?.toLowerCase() || '';
            console.log('Found model button with text:', buttonText);
            
            if (buttonText.includes('gpt-4') || buttonText.includes('4')) {
                if (buttonText.includes('turbo')) return 'gpt-4-turbo';
                if (buttonText.includes('o1')) return 'o1-preview';
                return 'gpt-4';
            }
            if (buttonText.includes('3.5') || buttonText.includes('3')) return 'gpt-3.5-turbo';
            if (buttonText.includes('o1')) {
                if (buttonText.includes('mini')) return 'o1-mini';
                return 'o1-preview';
            }
        }
        
        // Method 2: Look in the page title or URL
        const pageTitle = document.title.toLowerCase();
        if (pageTitle.includes('gpt-4')) return 'gpt-4';
        if (pageTitle.includes('gpt-3')) return 'gpt-3.5-turbo';
        
        // Method 3: Look for any text containing model information
        const allText = document.body.textContent?.toLowerCase() || '';
        if (allText.includes('gpt-4 turbo')) return 'gpt-4-turbo';
        if (allText.includes('gpt-4')) return 'gpt-4';
        if (allText.includes('o1-preview')) return 'o1-preview';
        if (allText.includes('o1-mini')) return 'o1-mini';
        
        // Method 4: Check URL path
        const currentPath = window.location.pathname;
        if (currentPath.includes('gpt-4')) return 'gpt-4';
        if (currentPath.includes('o1')) return 'o1-preview';
        
        // Default fallback
        const defaultModel = 'gpt-3.5-turbo';
        console.log(`No specific model detected, using default: ${defaultModel}`);
        return defaultModel;
    }

    async addQuestionToSidebar(messageId, question, messageText) {
        console.log('addQuestionToSidebar called for message:', messageId);
        
        // Ensure sidebar exists
        if (!document.getElementById('chatgpt-extension-sidebar')) {
            console.log('Sidebar not found, creating it...');
            await this.createSidebar();
        }
        
        // Ensure sidebar is open and expanded
        const sidebar = document.querySelector('.chatgpt-extension-sidebar');
        if (sidebar) {
            // If sidebar is minimized, expand it
            if (sidebar.classList.contains('minimized')) {
                this.toggleSidebarMinimize();
            }
        }
        
        // Activate chat input for this message
        if (this.chatInput) {
            this.chatInput.setActiveMessage(messageId);
        }
        
        // Add user message to chat
        this.addChatMessage('user', question);
        
        console.log('Question added to chat');
    }

    async addThinkingToSidebar(messageId) {
        // Use the new chat message system with thinking indicator
        return this.addChatMessage('assistant', null, true);
    }

    removeThinkingFromSidebar(messageId) {
        // Remove all thinking messages (there should only be one)
        const thinkingElements = document.querySelectorAll('.chat-message.thinking');
        thinkingElements.forEach(el => el.remove());
    }

    async addResponseToSidebar(messageId, response) {
        // Remove thinking indicator
        this.removeThinkingFromSidebar(messageId);
        
        // Add AI response to chat with typing animation
        this.addChatMessage('assistant', response, false, null, true);
        
        console.log('Response added to chat');
    }

    async addErrorToSidebar(messageId, error) {
        // Remove thinking indicator
        this.removeThinkingFromSidebar(messageId);
        
        // Add error message to chat
        this.addChatMessage('system', error);
        
        console.log('Error added to chat');
    }

    ensureConversationInput(conversationSection, messageId) {
        if (conversationSection.querySelector('.conversation-input')) return;
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'conversation-input';
        inputContainer.innerHTML = `
            <textarea placeholder="Ask another question about this message..." rows="2"></textarea>
            <button class="ask-more-button">Ask</button>
        `;
        
        conversationSection.appendChild(inputContainer);
        
        // Handle input functionality
        const textarea = inputContainer.querySelector('textarea');
        const askMoreBtn = inputContainer.querySelector('.ask-more-button');
        
        const handleAskMore = async () => {
            const question = textarea.value.trim();
            if (!question) return;
            
            textarea.value = '';
            textarea.disabled = true;
            askMoreBtn.disabled = true;
            askMoreBtn.textContent = 'Asking...';
            
            try {
                const button = document.querySelector(`[data-message-id="${messageId}"]`);
                if (!button) {
                    throw new Error('Message not found');
                }
                
                // Find the message element by traversing up from the button
                let messageElement = button;
                while (messageElement && !this.isMessageElement(messageElement)) {
                    messageElement = messageElement.parentElement;
                }
                
                if (!messageElement) {
                    throw new Error('Message element not found');
                }
                
                await this.processQuestion(messageElement, messageId, question, true);
            } catch (error) {
                console.error('Failed to process follow-up question:', error);
                this.addErrorToSidebar(messageId, error.message);
            } finally {
                textarea.disabled = false;
                askMoreBtn.disabled = false;
                askMoreBtn.textContent = 'Ask';
            }
        };
        
        askMoreBtn.addEventListener('click', handleAskMore);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskMore();
            }
        });
    }

    isUserMessage(messageElement) {
        // Try to detect if message is from user or AI
        // This depends on ChatGPT's DOM structure
        const authorRole = messageElement.getAttribute('data-message-author-role');
        if (authorRole) {
            return authorRole === 'user';
        }
        
        // Fallback: look for indicators in classes or structure
        const classes = messageElement.className || '';
        const parentClasses = messageElement.parentElement?.className || '';
        
        // These are rough heuristics and might need adjustment
        return classes.includes('user') || 
               parentClasses.includes('user') ||
               !messageElement.querySelector('svg'); // AI messages often have copy buttons with SVGs
    }

    formatResponse(response) {
        // Comprehensive markdown formatting
        let formatted = this.escapeHtml(response);
        
        // Process markdown in order of precedence
        formatted = this.processMarkdown(formatted);
        
        return formatted;
    }

    processMarkdown(text) {
        // Code blocks (must be processed first to avoid interference)
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || '';
            return `<div class="code-block">
                <div class="code-header">${lang}</div>
                <pre><code class="language-${lang}">${code.trim()}</code></pre>
            </div>`;
        });
        
        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // Headers (h1-h6)
        text = text.replace(/^### (.*$)/gim, '<h3 class="markdown-h3">$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2 class="markdown-h2">$1</h2>');
        text = text.replace(/^# (.*$)/gim, '<h1 class="markdown-h1">$1</h1>');
        
        // Bold and italic (process bold first to avoid conflicts)
        text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Strikethrough
        text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');
        
        // Lists (unordered)
        text = text.replace(/^\s*[-*+]\s+(.+)$/gim, '<li class="markdown-li">$1</li>');
        
        // Lists (ordered)
        text = text.replace(/^\s*\d+\.\s+(.+)$/gim, '<li class="markdown-li-ordered">$1</li>');
        
        // Wrap consecutive list items in ul/ol tags
        text = text.replace(/(<li class="markdown-li">.*<\/li>)/s, '<ul class="markdown-ul">$1</ul>');
        text = text.replace(/(<li class="markdown-li-ordered">.*<\/li>)/s, '<ol class="markdown-ol">$1</ol>');
        
        // Blockquotes
        text = text.replace(/^>\s*(.+)$/gim, '<blockquote class="markdown-blockquote">$1</blockquote>');
        
        // Links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="markdown-link">$1</a>');
        
        // Horizontal rules
        text = text.replace(/^---+$/gim, '<hr class="markdown-hr">');
        
        // Line breaks and paragraphs
        text = text.replace(/\n\n/g, '</p><p class="markdown-p">');
        text = text.replace(/\n/g, '<br>');
        
        // Wrap in paragraph if it doesn't start with a block element
        if (!text.match(/^<(h[1-6]|div|ul|ol|blockquote|hr)/)) {
            text = '<p class="markdown-p">' + text + '</p>';
        }
        
        // Clean up empty paragraphs
        text = text.replace(/<p class="markdown-p"><\/p>/g, '');
        
        return text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Context Management Functions
    saveConversationContext(messageId, context) {
        try {
            const contextData = {
                messageId: messageId,
                context: context,
                timestamp: Date.now(),
                url: window.location.href
            };
            
            // Save to localStorage with a specific key pattern
            const contextKey = `chatgpt_context_${messageId}`;
            localStorage.setItem(contextKey, JSON.stringify(contextData));
            
            // Also maintain a list of all saved contexts for cleanup
            const savedContexts = this.getSavedContextsList();
            if (!savedContexts.includes(messageId)) {
                savedContexts.push(messageId);
                localStorage.setItem('chatgpt_saved_contexts', JSON.stringify(savedContexts));
            }
            
            console.log(`Context saved for message ${messageId}:`, context.length, 'messages');
            return true;
        } catch (error) {
            console.error('Error saving conversation context:', error);
            return false;
        }
    }
    
    loadConversationContext(messageId) {
        try {
            const contextKey = `chatgpt_context_${messageId}`;
            const contextData = localStorage.getItem(contextKey);
            
            if (contextData) {
                const parsed = JSON.parse(contextData);
                console.log(`Context loaded for message ${messageId}:`, parsed.context.length, 'messages');
                return parsed.context;
            }
            
            console.log(`No saved context found for message ${messageId}`);
            return null;
        } catch (error) {
            console.error('Error loading conversation context:', error);
            return null;
        }
    }
    
    getSavedContextsList() {
        try {
            const savedContexts = localStorage.getItem('chatgpt_saved_contexts');
            return savedContexts ? JSON.parse(savedContexts) : [];
        } catch (error) {
            console.error('Error getting saved contexts list:', error);
            return [];
        }
    }
    
    cleanupOldContexts() {
        try {
            const savedContexts = this.getSavedContextsList();
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
            const contextsToKeep = [];
            
            savedContexts.forEach(messageId => {
                const contextKey = `chatgpt_context_${messageId}`;
                const contextData = localStorage.getItem(contextKey);
                
                if (contextData) {
                    try {
                        const parsed = JSON.parse(contextData);
                        if (parsed.timestamp > oneWeekAgo) {
                            contextsToKeep.push(messageId);
                        } else {
                            localStorage.removeItem(contextKey);
                        }
                    } catch (error) {
                        // Remove invalid context data
                        localStorage.removeItem(contextKey);
                    }
                }
            });
            
            localStorage.setItem('chatgpt_saved_contexts', JSON.stringify(contextsToKeep));
            console.log(`Context cleanup: kept ${contextsToKeep.length} of ${savedContexts.length} contexts`);
        } catch (error) {
            console.error('Error cleaning up old contexts:', error);
        }
    }
    
    getContextPreview(messageId, maxMessages = 5) {
        const context = this.loadConversationContext(messageId);
        if (!context || context.length === 0) {
            return {
                hasContext: false,
                preview: [],
                totalMessages: 0
            };
        }
        
        // Get the last few messages for preview
        const previewMessages = context.slice(-maxMessages).map(msg => ({
            role: msg.role,
            content: msg.content.length > 100 ? 
                msg.content.substring(0, 100) + '...' : 
                msg.content,
            fullLength: msg.content.length
        }));
        
        return {
            hasContext: true,
            preview: previewMessages,
            totalMessages: context.length,
            isPartial: context.length > maxMessages
        };
    }

    parseConversationContext(targetMessageElement = null, messageId = null) {
        let context = null;
        
        // First, try to load saved context if messageId is provided
        if (messageId) {
            context = this.loadConversationContext(messageId);
            if (context) {
                console.log(`Using saved context for message ${messageId}`);
                return context;
            }
        }
        
        // Parse fresh context
        if (targetMessageElement) {
            // Get conversation context up to and including the target message
            context = this.getMessagesUpToTarget(targetMessageElement);
        } else {
            // Fallback: get all messages (current behavior)
            const messages = this.findMessageElements();
            const conversationMessages = [];
            
            messages.forEach((messageEl) => {
                const text = messageEl.textContent.trim();
                if (text) {
                    // Try to determine if it's user or assistant message
                    const isUser = this.isUserMessage(messageEl);
                    conversationMessages.push({
                        role: isUser ? 'user' : 'assistant',
                        content: text
                    });
                }
            });
            
            context = conversationMessages;
        }
        
        // Save the parsed context if messageId is provided
        if (messageId && context) {
            this.saveConversationContext(messageId, context);
        }
        
        return context;
    }

    getMessagesUpToTarget(targetMessageElement) {
        const conversationMessages = [];
        
        try {
            // Find all message elements in the conversation (both user and assistant)
            const allMessages = document.querySelectorAll('[data-message-author-role], article[data-turn]');
            
            console.log(`Found ${allMessages.length} total messages in conversation`);
            
            // Convert to array and process in order
            const messageArray = Array.from(allMessages);
            
            // Find the index of our target message
            let targetIndex = -1;
            for (let i = 0; i < messageArray.length; i++) {
                if (messageArray[i] === targetMessageElement || 
                    messageArray[i].contains(targetMessageElement) ||
                    targetMessageElement.contains(messageArray[i])) {
                    targetIndex = i;
                    break;
                }
            }
            
            if (targetIndex === -1) {
                console.warn('Target message not found in conversation, using fallback');
                // If we can't find the target, include all messages up to a reasonable limit
                targetIndex = Math.min(messageArray.length - 1, 10); // Last 10 messages
            }
            
            console.log(`Target message found at index ${targetIndex}, including ${targetIndex + 1} messages for context`);
            
            // Process messages up to and including the target
            for (let i = 0; i <= targetIndex; i++) {
                const messageEl = messageArray[i];
                const text = this.extractMessageText(messageEl);
                
                if (text && text.length > 10) { // Only include meaningful messages
                    const role = this.determineMessageRole(messageEl);
                    conversationMessages.push({
                        role: role,
                        content: text
                    });
                }
            }
            
            console.log(`Extracted ${conversationMessages.length} messages for context`);
            return conversationMessages;
            
        } catch (error) {
            console.error('Error parsing conversation context:', error);
            // Fallback to simpler approach
            return this.getSimpleConversationContext(targetMessageElement);
        }
    }

    extractMessageText(messageElement) {
        // Try different methods to extract clean message text
        
        // Method 1: Look for specific content containers
        const contentSelectors = [
            '.prose',
            '[data-message-content]',
            '.message-content',
            '.markdown',
            '.whitespace-pre-wrap'
        ];
        
        for (const selector of contentSelectors) {
            const contentEl = messageElement.querySelector(selector);
            if (contentEl) {
                return contentEl.textContent.trim();
            }
        }
        
        // Method 2: Get direct text content, filtering out UI elements
        let text = messageElement.textContent.trim();
        
        // Remove common UI text that shouldn't be part of the message
        const uiTextsToRemove = [
            'Copy code',
            'More actions',
            'Regenerate response',
            'Edit message',
            'Copy',
            'Share',
            'Report',
            'Continue conversation'
        ];
        
        uiTextsToRemove.forEach(uiText => {
            text = text.replace(new RegExp(uiText, 'gi'), '');
        });
        
        return text.trim();
    }

    determineMessageRole(messageElement) {
        // Method 1: Check data attributes
        const authorRole = messageElement.getAttribute('data-message-author-role');
        if (authorRole) {
            return authorRole === 'user' ? 'user' : 'assistant';
        }
        
        // Method 2: Check data-turn attribute
        const dataTurn = messageElement.getAttribute('data-turn');
        if (dataTurn) {
            return dataTurn === 'user' ? 'user' : 'assistant';
        }
        
        // Method 3: Use existing isUserMessage logic
        return this.isUserMessage(messageElement) ? 'user' : 'assistant';
    }

    getSimpleConversationContext(targetMessageElement) {
        // Simple fallback: just include the target message
        const text = this.extractMessageText(targetMessageElement);
        const role = this.determineMessageRole(targetMessageElement);
        
        if (text) {
            return [{
                role: role,
                content: text
            }];
        }
        
        return [];
    }

    isUserMessage(messageElement) {
        // Try to detect if message is from user or AI
        // This depends on ChatGPT's DOM structure
        const authorRole = messageElement.getAttribute('data-message-author-role');
        if (authorRole) {
            return authorRole === 'user';
        }
        
        // Look for specific ChatGPT UI indicators
        // User messages typically have different styling/structure
        const classes = messageElement.className || '';
        const parentClasses = messageElement.parentElement?.className || '';
        
        // Check for common user message indicators
        if (classes.includes('user') || parentClasses.includes('user')) {
            return true;
        }
        
        // Check if message is on the right side (usually user messages)
        const style = window.getComputedStyle(messageElement);
        const parentStyle = window.getComputedStyle(messageElement.parentElement || messageElement);
        
        // Look for flex justify-end or text-align right (user messages)
        if (style.textAlign === 'right' || 
            parentStyle.justifyContent === 'flex-end' ||
            classes.includes('justify-end') ||
            parentClasses.includes('justify-end')) {
            return true;
        }
        
        // Check for avatar/profile indicators (AI messages usually have ChatGPT avatar)
        const hasAvatar = messageElement.querySelector('img[alt*="ChatGPT"], img[alt*="GPT"], .avatar, [data-testid*="avatar"]');
        if (hasAvatar) {
            return false; // Has AI avatar, so it's AI message
        }
        
        // Check for copy button (AI messages typically have copy buttons)
        const hasCopyButton = messageElement.querySelector('button[aria-label*="Copy"], button[title*="Copy"], svg[data-icon="copy"]');
        if (hasCopyButton) {
            return false; // Has copy button, likely AI message
        }
        
        // Additional heuristic: check text content patterns
        const text = messageElement.textContent?.trim() || '';
        
        // Very short messages are more likely to be user messages
        if (text.length < 50 && !text.includes('\n')) {
            return true;
        }
        
        // Default to false (AI message) if we can't determine
        return false;
    }

    isMessageElement(element) {
        // Check if element is a chat message based on ChatGPT's DOM structure
        return element.querySelector && (
            element.querySelector('[data-message-author-role]') ||
            element.querySelector('.prose') ||
            element.classList.contains('group') ||
            element.querySelector('div[class*="markdown"]') ||
            (element.textContent && element.textContent.trim().length > 10)
        );
    }

    initializeModelSelector() {
        const modelSelector = document.getElementById('extension-model-selector');
        if (!modelSelector) return;

        // Populate selector with models from API
        this.populateModelSelector();

        // Handle model selection changes
        modelSelector.addEventListener('change', (e) => {
            console.log('Model changed to:', e.target.value);
            
            // Update the selected model in the conversation context
            const conversationId = this.getCurrentConversationId();
            if (conversationId) {
                const conversations = JSON.parse(localStorage.getItem('extensionConversations') || '{}');
                if (!conversations[conversationId]) {
                    conversations[conversationId] = { messages: [], model: e.target.value };
                } else {
                    conversations[conversationId].model = e.target.value;
                }
                localStorage.setItem('extensionConversations', JSON.stringify(conversations));
            }
        });
    }

    getCurrentConversationTitle() {
        try {
            // Primary method: Look for active menu item with data-active attribute
            // Check both regular conversations and group conversations
            let activeMenuItem = document.querySelector('a[data-active=""]');
            
            // If not found, also check within group/sidebar-expando-section
            if (!activeMenuItem) {
                const expandoSection = document.querySelector('.group\\/sidebar-expando-section');
                if (expandoSection) {
                    activeMenuItem = expandoSection.querySelector('a[data-active=""]');
                }
            }
            
            if (activeMenuItem) {
                // Get the title from the text content of the active menu item
                const titleElement = activeMenuItem.querySelector('div:last-child') || 
                                   activeMenuItem.querySelector('.overflow-hidden') ||
                                   activeMenuItem.querySelector('div') ||
                                   activeMenuItem;
                let title = titleElement.textContent?.trim();
                if (title && title !== '' && !title.includes('New chat')) {
                    return title;
                }
            }

            // Fallback: Try other selectors for the conversation title
            const fallbackSelectors = [
                // Group conversation selectors
                '.group\\/sidebar-expando-section a[data-active=""] div:last-child',
                '.group\\/sidebar-expando-section a[data-active=""] .overflow-hidden',
                // Main conversation title in the navigation
                'nav ol li[aria-current="page"] .overflow-hidden.whitespace-nowrap.text-ellipsis',
                'nav ol li[aria-current="page"] a div:last-child',
                'nav ol li.bg-gray-800 .overflow-hidden.whitespace-nowrap.text-ellipsis',
                'nav ol li.bg-gray-800 a div:last-child',
                // Alternative selectors for different ChatGPT layouts
                '.conversation-title',
                '[data-testid="conversation-title"]',
                // Fallback to any active navigation item
                'nav li[aria-current="page"]',
                'nav li.bg-gray-800'
            ];

            for (const selector of fallbackSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    let title = element.textContent?.trim();
                    if (title && title !== '' && !title.includes('New chat')) {
                        return title;
                    }
                }
            }

            // Fallback: Try to get title from page title or URL
            const pageTitle = document.title;
            if (pageTitle && !pageTitle.includes('ChatGPT')) {
                return pageTitle;
            }

            return 'New Conversation';
        } catch (error) {
            console.warn('Error getting conversation title:', error);
            return 'Chat';
        }
    }

    getCurrentConversationId() {
        try {
            // Primary method: Look for active menu item with data-active attribute
            // Check both regular conversations and group conversations
            let activeMenuItem = document.querySelector('a[data-active=""]');
            
            // If not found, also check within group/sidebar-expando-section
            if (!activeMenuItem) {
                const expandoSection = document.querySelector('.group\\/sidebar-expando-section');
                if (expandoSection) {
                    activeMenuItem = expandoSection.querySelector('a[data-active=""]');
                }
            }
            
            if (activeMenuItem && activeMenuItem.href) {
                // Extract conversation ID from href
                // Format: /c/conversation-id or /g/gpt-id/c/conversation-id
                const href = activeMenuItem.href;
                const match = href.match(/\/c\/([a-f0-9-]+)/);
                if (match && match[1]) {
                    return match[1];
                }
            }

            // Fallback: Try to get from current URL
            const currentUrl = window.location.href;
            const urlMatch = currentUrl.match(/\/c\/([a-f0-9-]+)/);
            if (urlMatch && urlMatch[1]) {
                return urlMatch[1];
            }

            // Generate a fallback ID based on current URL or timestamp
            return 'conversation_' + Date.now();
        } catch (error) {
            console.warn('Error getting conversation ID:', error);
            return 'conversation_' + Date.now();
        }
    }

    updateConversationTitle() {
        const titleElement = document.getElementById('conversation-title');
        if (titleElement) {
            const title = this.getCurrentConversationTitle();
            titleElement.textContent = title;
            titleElement.title = title; // Show full title on hover
        }
    }

    observeNavigationChanges() {
        // Observe navigation changes to update title
        const targetNode = document.querySelector('nav') || document.body;
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // Debounce the title update
                    clearTimeout(this.titleUpdateTimeout);
                    this.titleUpdateTimeout = setTimeout(() => {
                        this.updateConversationTitle();
                    }, 300);
                }
            });
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-current', 'class']
        });

        // Also update title when URL changes
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(() => this.updateConversationTitle(), 500);
            }
        }).observe(document, { subtree: true, childList: true });
    }

    deleteMessage(messageId) {
        // Remove message from DOM
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }

        // Remove message from localStorage conversation
        const conversationId = this.getCurrentConversationId();
        if (conversationId) {
            const conversations = JSON.parse(localStorage.getItem('extensionConversations') || '{}');
            if (conversations[conversationId] && conversations[conversationId].messages) {
                // Filter out the message with the matching ID
                conversations[conversationId].messages = conversations[conversationId].messages.filter(
                    msg => msg.id !== messageId
                );
                localStorage.setItem('extensionConversations', JSON.stringify(conversations));
                
                // Update notification badge
                this.updateNotificationBadge();
                
                console.log(`Message ${messageId} deleted from conversation ${conversationId}`);
            }
        }
    }

    async fetchAvailableModels() {
        try {
            // Check if we have cached models that haven't expired
            const cachedData = this.getCachedModels();
            if (cachedData) {
                console.log('Using cached models');
                return cachedData;
            }

            // Get API key from storage
            const result = await chrome.storage.sync.get(['openaiApiKey']);
            if (!result.openaiApiKey) {
                console.warn('No API key found, using default models');
                return this.getDefaultModels();
            }

            console.log('Fetching models from OpenAI API...');
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${result.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Filter and sort OpenAI models (exclude fine-tuned and deprecated models)
            const filteredModels = data.data
                .filter(model => {
                    const modelId = model.id.toLowerCase();
                    return (
                        (modelId.includes('gpt-3.5') || 
                         modelId.includes('gpt-4') || 
                         modelId.includes('o1')) &&
                        !modelId.includes('instruct') &&
                        !modelId.includes('ft-') && // Exclude fine-tuned models
                        !modelId.includes('0301') && // Exclude deprecated versions
                        !modelId.includes('0314') &&
                        !modelId.includes('0613')
                    );
                })
                .map(model => ({
                    id: model.id,
                    name: this.formatModelName(model.id),
                    created: model.created
                }))
                .sort((a, b) => {
                    // Sort by preference: o1 models first, then gpt-4, then gpt-3.5
                    const order = { 'o1': 0, 'gpt-4': 1, 'gpt-3.5': 2 };
                    const aPrefix = Object.keys(order).find(prefix => a.id.startsWith(prefix)) || 'other';
                    const bPrefix = Object.keys(order).find(prefix => b.id.startsWith(prefix)) || 'other';
                    return (order[aPrefix] || 999) - (order[bPrefix] || 999);
                });

            // Cache the models with expiration (24 hours)
            this.cacheModels(filteredModels);
            
            console.log(`Fetched ${filteredModels.length} models from API`);
            return filteredModels;

        } catch (error) {
            console.error('Error fetching models:', error);
            return this.getDefaultModels();
        }
    }

    getCachedModels() {
        try {
            const cached = localStorage.getItem('openai_models_cache');
            if (!cached) return null;

            const { models, expiration } = JSON.parse(cached);
            
            // Check if cache has expired (24 hours)
            if (Date.now() > expiration) {
                localStorage.removeItem('openai_models_cache');
                return null;
            }

            return models;
        } catch (error) {
            console.error('Error reading cached models:', error);
            localStorage.removeItem('openai_models_cache');
            return null;
        }
    }

    cacheModels(models) {
        try {
            const cacheData = {
                models: models,
                expiration: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            localStorage.setItem('openai_models_cache', JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching models:', error);
        }
    }

    formatModelName(modelId) {
        // Convert model IDs to user-friendly names
        const nameMap = {
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo (16K)',
            'gpt-4': 'GPT-4',
            'gpt-4-turbo': 'GPT-4 Turbo',
            'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
            'gpt-4o': 'GPT-4o',
            'gpt-4o-mini': 'GPT-4o Mini',
            'o1-preview': 'O1 Preview',
            'o1-mini': 'O1 Mini'
        };

        return nameMap[modelId] || modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getDefaultModels() {
        // Fallback models if API call fails
        return [
            { id: 'o1-preview', name: 'O1 Preview' },
            { id: 'o1-mini', name: 'O1 Mini' },
            { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
        ];
    }

    async populateModelSelector() {
        const modelSelector = document.getElementById('extension-model-selector');
        if (!modelSelector) return;

        try {
            // Show loading state
            modelSelector.innerHTML = '<option>Loading models...</option>';
            modelSelector.disabled = true;

            // Fetch available models
            const models = await this.fetchAvailableModels();

            // Clear and populate the selector
            modelSelector.innerHTML = '';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                modelSelector.appendChild(option);
            });

            // Set default selection based on detected model or first available
            const currentModel = this.detectCurrentModel();
            if (currentModel) {
                const matchingModel = models.find(model => 
                    currentModel.toLowerCase().includes(model.id.toLowerCase()) ||
                    model.id.toLowerCase().includes(currentModel.toLowerCase())
                );
                if (matchingModel) {
                    modelSelector.value = matchingModel.id;
                }
            }

            modelSelector.disabled = false;
            console.log('Model selector populated with', models.length, 'models');

        } catch (error) {
            console.error('Error populating model selector:', error);
            modelSelector.innerHTML = '<option>Error loading models</option>';
            modelSelector.disabled = true;
        }
    }
}

// Initialize the extension
const chatGPTExtension = new ChatGPTExtension();

// Make the extension instance globally available for pinned message interactions
window.chatGPTExtension = chatGPTExtension;

// Clean up old context data on initialization
chatGPTExtension.cleanupOldContexts();
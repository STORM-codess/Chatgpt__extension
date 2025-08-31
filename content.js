// Returns the message elements from the page.
function getMessageBubbles() {
    return Array.from(document.querySelectorAll('div[data-message-author-role="user"]'));
}

// Extracts the text and index from message elements.
function getChatData() {
    const bubbles = getMessageBubbles();
    const messages = bubbles.map((el, idx) => ({
        text: el.innerText.trim(),
        index: idx,
        url: window.location.href
    }));

    return { messages };
}

// Handles messages from the popup.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_USER_MESSAGES') {
        sendResponse(getChatData());
    } else if (request.type === 'SCROLL_TO_MESSAGE') {
        const bubbles = getMessageBubbles();
        const el = bubbles[request.index];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Apply a temporary highlight to the message.
            el.classList.add('gpt-ext-highlight');
            setTimeout(() => el.classList.remove('gpt-ext-highlight'), 1500);
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false });
        }
    }
    // Required to keep the message channel open for async responses.
    return true;
});

// Injects the highlight style into the page.
const style = document.createElement('style');
style.textContent = `
.gpt-ext-highlight {
    outline: 3px solid #4A90E2 !important;
    border-radius: 8px;
    transition: outline 0.3s;
}
`;
document.head.appendChild(style);

// Function to send a message to the side panel to refresh its content
function notifySidePanel() {
    chrome.runtime.sendMessage({ type: 'CONTENT_UPDATED' });
}

// Use a MutationObserver to watch for changes in the chat content
const observer = new MutationObserver((mutations) => {
    notifySidePanel();
});

// Start observing the document body for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});
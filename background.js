// Allows users to open the side panel by clicking the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// When the active tab is updated, send a message to the side panel to refresh
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('chatgpt.com')) {
    chrome.runtime.sendMessage({ type: 'CONTENT_UPDATED' });
  }
});

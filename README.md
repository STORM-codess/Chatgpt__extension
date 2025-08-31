# AskHistory Chrome Extension

AskHistory is a Chrome extension that enhances your experience on chatgpt.com by allowing you to view, search, categorize, and bookmark your message history in a convenient side panel.

## Features

*   **View Message History**: See a complete list of your user messages from the current chat.
*   **Search**: Quickly find specific messages using the search bar.
*   **Categorization**: Organize your messages by assigning them to custom categories with unique names and colors.
*   **Bookmarking**: Save important messages for easy access later.
*   **Jump to Conversation**: Directly navigate to the original context of a bookmarked or searched message in the main chat window.

## How to Use

1.  **Open the Side Panel**: Click the extension icon in the Chrome toolbar to open the AskHistory side panel.
2.  **View and Search**: Your message history will be displayed automatically. Use the search bar to filter messages.
3.  **Manage Categories**:
    *   Click the three-dots menu icon and select "Manage Categories."
    *   Create new categories by providing a name and color.
    *   Assign messages to categories from the main view by clicking the three-dots menu on a message item.
4.  **Bookmark Messages**: Click the bookmark icon on any message to save it to your bookmarks.
5.  **View Bookmarks**: Click the bookmark icon in the header to view your saved bookmarks.

## Installation

1.  Clone this repository or download it as a ZIP file.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable "Developer mode" in the top right corner.
4.  Click "Load unpacked" and select the directory where you saved the extension files.

## Built With

*   **HTML**: The structure of the extension's popup and other UI components.
*   **CSS**: Styling for the extension's user interface.
*   **JavaScript**: The core logic of the extension, including DOM manipulation, event handling, and interaction with Chrome APIs.
*   **Chrome Extension APIs**:
    *   `chrome.sidePanel`: Manages the side panel behavior.
    *   `chrome.tabs`: Interacts with the browser's tab system.
    *   `chrome.runtime`: Handles messaging between different parts of the extension.
    *   `chrome.storage`: Persists data locally.
*   **Platform**: Google Chrome
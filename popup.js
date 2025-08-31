document.addEventListener('DOMContentLoaded', () => {
    // --- Views ---
    const mainView = document.getElementById('main-view');
    const manageView = document.getElementById('manage-view');
    const bookmarkView = document.getElementById('bookmark-view');

    // --- Main View Elements ---
    const searchInput = document.getElementById('search-input');
    const messageList = document.getElementById('message-list');
    const specificCategoryFilterBtn = document.getElementById('specific-category-filter-btn');
    const categoryFilterMenu = document.getElementById('category-filter-menu');
    const mainSearchLine = document.getElementById('main-search-line');
    mainView.appendChild(categoryFilterMenu); // Move menu to avoid clipping
    const bookmarkViewBtn = document.getElementById('bookmark-view-btn');
    const askHistoryTitle = document.getElementById('askhistory-title');

    // --- Manage View Elements ---
    const doneBtn = document.getElementById('done-btn');
    const categoryNameInput = document.getElementById('category-name-input');
    const categoryColorInput = document.getElementById('category-color-input');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoriesList = document.getElementById('categories-list');
    const suggestedCategoriesList = document.getElementById('suggested-categories-list');

    // --- Bookmark View Elements ---
    const bookmarkDoneBtn = document.getElementById('bookmark-done-btn');
    const bookmarkedList = document.getElementById('bookmarked-list');
    const bookmarkSearchLine = document.getElementById('bookmark-search-line');
    const bookmarkSearchInput = document.getElementById('bookmark-search-input');
    const bookmarkCategoryFilterBtn = document.getElementById('bookmark-category-filter-btn');
    const bookmarkCategoryFilterMenu = document.getElementById('bookmark-category-filter-menu');

    // --- State ---
    let allMessages = [];
    let categorizedMessages = {}; // { msgId: categoryId }
    let categories = [];
    let bookmarkedQuestions = [];
    let lastFilter = '';
    let categoryFilterActive = false;
    let activeCategoryFilter = null;
    let bookmarkSearchFilter = '';
    let activeBookmarkCategoryFilter = null;

    const SUGGESTED_CATEGORIES = [
       { name: 'Important', color: '#E94B3C' },
       { name: 'Work', color: '#4A90E2' },
       { name: 'Personal', color: '#F5A623' },
       { name: 'Ideas', color: '#50E3C2' },
       { name: 'Follow Up', color: '#BD10E0' },
       { name: 'To-Do', color: '#9013FE' }
    ];

    // =================================================================
    // VIEW SWITCHING LOGIC
    // =================================================================
    function showView(viewToShow) {
        mainView.style.display = 'none';
        manageView.style.display = 'none';
        bookmarkView.style.display = 'none';
        viewToShow.style.display = 'block';
    }

    function showMainView() {
        showView(mainView);
        populateCategoryFilterMenu();
        applyFilters();
    }

    function showManageView() {
        showView(manageView);
        renderCategories();
        renderSuggestedCategories();
    }

    function showBookmarkView() {
        showView(bookmarkView);
        renderBookmarkedQuestions();
    }

    // =================================================================
    // BOOKMARK LOGIC
    // =================================================================
    function bookmarkMessage(message) {
        const now = new Date();
        const msgId = getMessageId(message);
        const bookmarkedItem = {
            id: `bookmark_${Date.now()}`,
            text: message.text,
            url: message.url,
            bookmarkedAt: now.toISOString(),
            msgId: msgId
        };
    
        chrome.storage.local.get(['bookmarkedQuestions'], (data) => {
            const updatedBookmarks = data.bookmarkedQuestions || [];
            const isAlreadyBookmarked = updatedBookmarks.some(item => item.text === message.text && item.url === message.url);
    
            if (!isAlreadyBookmarked) {
                updatedBookmarks.push(bookmarkedItem);
                chrome.storage.local.set({ bookmarkedQuestions: updatedBookmarks }, () => {
                    bookmarkedQuestions = updatedBookmarks;
                    applyFilters(); // Re-render main list
                    if (bookmarkView.style.display === 'block') {
                        renderBookmarkedQuestions();
                    }
                });
            }
        });
    }
    
    function unbookmarkMessage(bookmarkId) {
        chrome.storage.local.get(['bookmarkedQuestions'], (data) => {
            const updatedBookmarks = (data.bookmarkedQuestions || []).filter(item => item.id !== bookmarkId);
            chrome.storage.local.set({ bookmarkedQuestions: updatedBookmarks }, () => {
                bookmarkedQuestions = updatedBookmarks;
                applyFilters(); // Re-render main list
                renderBookmarkedQuestions();
            });
        });
    }

    function renderBookmarkedQuestions() {
        bookmarkedList.innerHTML = '';
        let bookmarksToRender = bookmarkedQuestions;


        if (activeBookmarkCategoryFilter) {
            bookmarksToRender = bookmarksToRender.filter(bookmark => {
                const categoryId = categorizedMessages[bookmark.msgId];
                return categoryId === activeBookmarkCategoryFilter;
            });
        }

        if (bookmarkSearchFilter) {
            bookmarksToRender = bookmarksToRender.filter(bookmark =>
                bookmark.text.toLowerCase().includes(bookmarkSearchFilter.toLowerCase())
            );
        }

        if (bookmarksToRender.length === 0) {
            bookmarkedList.innerHTML = '<div class="empty-list-message">No bookmarks found.</div>';
            return;
        }

        bookmarksToRender.sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt));

        bookmarksToRender.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'bookmarked-item-wrapper';

            const assignedCategoryId = categorizedMessages[item.msgId];
            const assignedCategory = categories.find(c => c.id === assignedCategoryId);

            if (assignedCategory) {
                wrapper.style.borderLeft = `4px solid ${assignedCategory.color}`;
            }

            
            const date = new Date(item.bookmarkedAt);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

            const bookmarkedItemDiv = document.createElement('div');
            bookmarkedItemDiv.className = 'bookmarked-item';
            bookmarkedItemDiv.innerHTML = `
                <p class="bookmarked-text">${item.text}</p>
                <div class="bookmarked-meta">
                    <span>${formattedDate}</span>
                    <a href="${item.url}" target="_blank" class="source-link">Go to conversation</a>
                </div>
            `;

            const bookmarkBtn = document.createElement('button');
            bookmarkBtn.className = 'bookmark-btn bookmarked';
            bookmarkBtn.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
            
            bookmarkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                unbookmarkMessage(item.id);
            });

            wrapper.appendChild(bookmarkedItemDiv);
            wrapper.appendChild(bookmarkBtn);

            const menuBtn = document.createElement('button');
            menuBtn.className = 'menu-btn';
            menuBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
            menuBtn.title = 'More options';

            menuBtn.onclick = (e) => {
                e.stopPropagation();
                closeAllMenus();

                const menu = document.createElement('div');
                menu.className = 'context-menu';
                menu.style.display = 'block';

                const rect = menuBtn.getBoundingClientRect();
                const bookmarkViewRect = bookmarkView.getBoundingClientRect();

                menu.style.top = `${rect.bottom - bookmarkViewRect.top}px`;
                menu.style.right = `${bookmarkViewRect.right - rect.right}px`;

                if (categories.length > 0) {
                    const separator = document.createElement('hr');
                    menu.appendChild(separator);
                    categories.forEach(category => {
                        const option = document.createElement('button');
                        option.textContent = category.name;
                        option.style.color = category.color;
                        if (assignedCategoryId === category.id) option.classList.add('active');
                        option.onclick = () => {
                            assignCategory(item.msgId, category.id);
                        };
                        menu.appendChild(option);
                    });
                }
                bookmarkView.appendChild(menu);
            };
            wrapper.appendChild(menuBtn);
            
            bookmarkedList.appendChild(wrapper);
        });
    }

    // =================================================================
    // CATEGORY MANAGEMENT
    // =================================================================
    function renderCategories() {
        categoriesList.innerHTML = '';
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'category-item';
            li.innerHTML = `
                <div class="category-info">
                    <div class="category-color-preview" style="background-color: ${category.color};"></div>
                    <span>${category.name}</span>
                </div>
                <button class="delete-category-btn" data-id="${category.id}">&times;</button>
            `;
            categoriesList.appendChild(li);
        });
        updateAddButtonState();
    }

   function renderSuggestedCategories() {
       suggestedCategoriesList.innerHTML = '';
       const existingCategoryNames = new Set(categories.map(c => c.name.toLowerCase()));
       
       SUGGESTED_CATEGORIES.forEach(suggested => {
           if (!existingCategoryNames.has(suggested.name.toLowerCase())) {
               const btn = document.createElement('button');
               btn.className = 'suggested-category-btn';
               btn.textContent = suggested.name;
               btn.dataset.name = suggested.name;
               btn.dataset.color = suggested.color;
               suggestedCategoriesList.appendChild(btn);
           }
       });
   }

    function updateAddButtonState() {
        addCategoryBtn.disabled = false;
        addCategoryBtn.title = '';
    }

    function addCategory() {
        const name = categoryNameInput.value.trim();
        if (name) {
            const newCategory = { id: `cat_${Date.now()}`, name, color: categoryColorInput.value };
            categories.push(newCategory);
            chrome.storage.local.set({ categories }, () => {
                renderCategories();
                renderSuggestedCategories();
                categoryNameInput.value = '';
                categoryColorInput.value = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
            });
        }
    }

    function deleteCategory(categoryId) {
        categories = categories.filter(c => c.id !== categoryId);
        Object.keys(categorizedMessages).forEach(msgId => {
            if (categorizedMessages[msgId] === categoryId) delete categorizedMessages[msgId];
        });
        chrome.storage.local.set({ categories, categorizedMessages: categorizedMessages }, () => {
           renderCategories();
           renderSuggestedCategories();
        });
    }

    // =================================================================
    // MESSAGE RENDERING AND FILTERING
    // =================================================================
    function getMessageId(message) {
        return `msg-${message.index}-${message.text.slice(0, 20)}`;
    }

    function closeAllMenus() {
        document.querySelectorAll('.context-menu').forEach(menu => menu.style.display = 'none');
    }

    function assignCategory(msgId, categoryId) {
        categorizedMessages[msgId] = categorizedMessages[msgId] === categoryId ? undefined : categoryId;
        chrome.storage.local.set({ categorizedMessages: categorizedMessages }, () => {
            applyFilters();
            if (bookmarkView.style.display === 'block') {
                renderBookmarkedQuestions();
            }
        });
    }

    function renderMessages(messages) {
        messageList.innerHTML = '';
        if (!messages.length) {
            messageList.innerHTML = '<div class="empty-list-message">No messages found.</div>';
            return;
        }

        messages.forEach((msg) => {
            const msgId = getMessageId(msg);
            const assignedCategoryId = categorizedMessages[msgId];
            const assignedCategory = categories.find(c => c.id === assignedCategoryId);

            const wrapper = document.createElement('div');
            wrapper.className = 'message-item-wrapper';

            const item = document.createElement('div');
            item.className = 'message-item';

            if (assignedCategory) {
                item.style.borderLeft = `4px solid ${assignedCategory.color}`;
            }
            
            const isBookmarked = bookmarkedQuestions.some(bookmarked => bookmarked.text === msg.text && bookmarked.url === msg.url);

            const bookmarkBtn = document.createElement('button');
            bookmarkBtn.className = 'bookmark-btn';
            if (isBookmarked) {
                bookmarkBtn.classList.add('bookmarked');
            }
            bookmarkBtn.innerHTML = isBookmarked
                ? '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>'
                : '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/></svg>';
            
            bookmarkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isBookmarked) {
                    const bookmarkedItem = bookmarkedQuestions.find(bookmarked => bookmarked.text === msg.text && bookmarked.url === msg.url);
                    if (bookmarkedItem) {
                        unbookmarkMessage(bookmarkedItem.id);
                    }
                } else {
                    bookmarkMessage(msg);
                }
            });


            item.tabIndex = 0;

            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';

            const preview = document.createElement('div');
            preview.className = 'message-preview';
            const isTrimmed = msg.text.length > 180;
            preview.textContent = isTrimmed ? msg.text.slice(0, 180) + '…' : msg.text;
            messageContent.appendChild(preview);

            const menuBtn = document.createElement('button');
            menuBtn.className = 'menu-btn';
            menuBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
            menuBtn.title = 'More options';

            menuBtn.onclick = (e) => {
                e.stopPropagation();
                closeAllMenus();

                const menu = document.createElement('div');
                menu.className = 'context-menu';
                menu.style.display = 'block';

                const rect = menuBtn.getBoundingClientRect();
                const mainViewRect = mainView.getBoundingClientRect();

                menu.style.top = `${rect.bottom - mainViewRect.top}px`;
                menu.style.right = `${mainViewRect.right - rect.right}px`;


                if (categories.length > 0) {
                    const separator = document.createElement('hr');
                    menu.appendChild(separator);
                    categories.forEach(category => {
                        const option = document.createElement('button');
                        option.textContent = category.name;
                        option.style.color = category.color;
                        if (assignedCategoryId === category.id) option.classList.add('active');
                        option.onclick = () => assignCategory(msgId, category.id);
                        menu.appendChild(option);
                    });
                }
                mainView.appendChild(menu);
            };

            item.onclick = () => chrome.tabs.sendMessage(allMessages[msg.index].tabId, { type: 'SCROLL_TO_MESSAGE', index: msg.index });
            item.appendChild(messageContent);
            item.appendChild(bookmarkBtn);
            item.appendChild(menuBtn);
            wrapper.appendChild(item);
            messageList.appendChild(wrapper);
        });
    }

    function populateCategoryFilterMenu() {
        categoryFilterMenu.innerHTML = '';
        const allOption = document.createElement('button');
        allOption.textContent = 'All Categories';
        allOption.onclick = () => {
            activeCategoryFilter = null;
            specificCategoryFilterBtn.style.color = '#95a5a6'; // Reset to default color
            mainSearchLine.style.backgroundColor = 'transparent';
            searchInput.placeholder = 'Search messages...';
            applyFilters();
            closeAllMenus();
        };
        categoryFilterMenu.appendChild(allOption);

        if (categories.length > 0) {
            categories.forEach(category => {
                const option = document.createElement('button');
                option.textContent = category.name;
                option.style.color = category.color;
                option.onclick = () => {
                    activeCategoryFilter = category.id;
                    const selectedCategory = categories.find(c => c.id === activeCategoryFilter);
                    if (selectedCategory) {
                        specificCategoryFilterBtn.style.color = selectedCategory.color;
                        mainSearchLine.style.backgroundColor = selectedCategory.color;
                        searchInput.placeholder = `Search in ${selectedCategory.name}...`;
                    }
                    applyFilters();
                    closeAllMenus();
                };
                categoryFilterMenu.appendChild(option);
            });
        }

        const separator = document.createElement('hr');
        categoryFilterMenu.appendChild(separator);

        const manageOption = document.createElement('button');
        manageOption.textContent = 'Manage Categories';
        manageOption.onclick = () => {
            showManageView();
            closeAllMenus();
        };
        categoryFilterMenu.appendChild(manageOption);
    }

    function populateBookmarkCategoryFilterMenu() {
        bookmarkCategoryFilterMenu.innerHTML = '';
        const allOption = document.createElement('button');
        allOption.textContent = 'All Categories';
        allOption.onclick = () => {
            activeBookmarkCategoryFilter = null;
            bookmarkCategoryFilterBtn.style.color = '#95a5a6'; // Reset to default color
            bookmarkSearchLine.style.backgroundColor = 'transparent';
            bookmarkSearchInput.placeholder = 'Search bookmarks...';
            renderBookmarkedQuestions();
            closeAllMenus();
        };
        bookmarkCategoryFilterMenu.appendChild(allOption);

        if (categories.length > 0) {
            categories.forEach(category => {
                const option = document.createElement('button');
                option.textContent = category.name;
                option.style.color = category.color;
                option.onclick = () => {
                    activeBookmarkCategoryFilter = category.id;
                    const selectedCategory = categories.find(c => c.id === activeBookmarkCategoryFilter);
                    if (selectedCategory) {
                        bookmarkCategoryFilterBtn.style.color = selectedCategory.color;
                        bookmarkSearchLine.style.backgroundColor = selectedCategory.color;
                        bookmarkSearchInput.placeholder = `Search in ${selectedCategory.name}...`;
                    }
                    renderBookmarkedQuestions();
                    closeAllMenus();
                };
                bookmarkCategoryFilterMenu.appendChild(option);
            });
        }
    }

    function applyFilters() {
        let messagesToRender = allMessages;
        if (categoryFilterActive || activeCategoryFilter) {
            messagesToRender = messagesToRender.filter(msg => {
                const msgId = getMessageId(msg);
                const categoryId = categorizedMessages[msgId];
                if (!categoryId) return false;
                return activeCategoryFilter ? categoryId === activeCategoryFilter : true;
            });
        }
        if (lastFilter) {
            messagesToRender = messagesToRender.filter(msg => msg.text.toLowerCase().includes(lastFilter.toLowerCase()));
        }
        renderMessages(messagesToRender);
    }

    function requestMessages(tab, retries = 3) {
        if (tab && tab.url.includes('chatgpt.com')) {
            document.getElementById('not-on-chatgpt').style.display = 'none';
            chrome.tabs.sendMessage(tab.id, { type: 'GET_USER_MESSAGES' }, (response) => {
                if (chrome.runtime.lastError) {
                    if (retries > 0) {
                        setTimeout(() => requestMessages(tab, retries - 1), 250);
                    } else {
                        messageList.innerHTML = '<div class="empty-list-message">Error loading messages. Please reload the page.</div>';
                    }
                    return;
                }
                if (response && response.messages) {
                    allMessages = response.messages.map(m => ({ ...m, tabId: tab.id }));
                    applyFilters();
                }
            });
        } else {
            document.getElementById('not-on-chatgpt').style.display = 'block';
        }
    }

    // =================================================================
    // INITIALIZATION AND EVENT LISTENERS
    // =================================================================
    chrome.storage.local.get(['categorizedMessages', 'categories', 'bookmarkedQuestions'], (data) => {
        if (data.categorizedMessages) categorizedMessages = data.categorizedMessages;
        if (data.categories) categories = data.categories;
        if (data.bookmarkedQuestions) bookmarkedQuestions = data.bookmarkedQuestions;
        populateCategoryFilterMenu();
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => requestMessages(tabs[0]));
    });

    // View Switching Listeners
    bookmarkViewBtn.addEventListener('click', showBookmarkView);
    doneBtn.addEventListener('click', showMainView);
    bookmarkDoneBtn.addEventListener('click', showMainView);
    askHistoryTitle.addEventListener('click', () => {
        activeCategoryFilter = null;
        specificCategoryFilterBtn.style.color = '#95a5a6';
        mainSearchLine.style.backgroundColor = 'transparent';
        searchInput.placeholder = 'Search messages...';
        showMainView();
    });



    // Main View Listeners
    searchInput.addEventListener('input', (e) => {
        lastFilter = e.target.value;
        applyFilters();
    });
    specificCategoryFilterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isDisplayed = categoryFilterMenu.style.display === 'block';
        closeAllMenus();

        if (isDisplayed) {
            categoryFilterMenu.style.display = 'none';
        } else {
            const rect = specificCategoryFilterBtn.getBoundingClientRect();
            const header = document.querySelector('.header');
            const headerRect = header.getBoundingClientRect();

            categoryFilterMenu.style.top = `${headerRect.bottom}px`;
            categoryFilterMenu.style.right = `18px`;
            categoryFilterMenu.style.display = 'block';
        }
    });

    // Manage View Listeners
    addCategoryBtn.addEventListener('click', addCategory);
    categoryNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addCategory();
        }
    });
    categoriesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-category-btn')) {
            deleteCategory(e.target.dataset.id);
        }
    });
    
    // Bookmark View Listeners
    bookmarkSearchInput.addEventListener('input', (e) => {
        bookmarkSearchFilter = e.target.value;
        renderBookmarkedQuestions();
    });

    bookmarkCategoryFilterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isDisplayed = bookmarkCategoryFilterMenu.style.display === 'block';
        closeAllMenus();

        if (isDisplayed) {
            bookmarkCategoryFilterMenu.style.display = 'none';
        } else {
            populateBookmarkCategoryFilterMenu();
            const rect = bookmarkCategoryFilterBtn.getBoundingClientRect();
            const header = document.querySelector('#bookmark-view .header');
            const headerRect = header.getBoundingClientRect();

            bookmarkCategoryFilterMenu.style.top = `${headerRect.bottom}px`;
            bookmarkCategoryFilterMenu.style.right = `18px`;
            bookmarkCategoryFilterMenu.style.display = 'block';
        }
    });

   suggestedCategoriesList.addEventListener('click', (e) => {
       if (e.target.classList.contains('suggested-category-btn')) {
           const { name, color } = e.target.dataset;
           const newCategory = { id: `cat_${Date.now()}`, name, color };
           categories.push(newCategory);
           chrome.storage.local.set({ categories }, () => {
               renderCategories();
               renderSuggestedCategories();
           });
       }
   });

    // Global Listeners
    document.addEventListener('click', closeAllMenus);
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'MESSAGES_UPDATED' || message.type === 'CONTENT_UPDATED') {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => requestMessages(tabs[0]));
        }
    });
});
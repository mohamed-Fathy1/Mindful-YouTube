(function () {
  // Store state
  let mindfulState = {
    categorySelected: false,
    searchPerformed: false,
    timeLimit: 0,
    startTime: null,
    customCategories: [],
    intentSet: false,
    intentDescription: "",
    favorites: {}, // Object to store favorites by category
    youtubeRecommendedCategories: [], // Store YouTube's recommended categories
  };

  // Load user settings from storage
  function loadSettings() {
    chrome.storage.local.get(
      ["timeLimit", "customCategories", "intentDescription", "favorites"],
      function (result) {
        if (result.timeLimit) mindfulState.timeLimit = result.timeLimit;
        if (result.customCategories)
          mindfulState.customCategories = result.customCategories;
        if (result.intentDescription) {
          mindfulState.intentDescription = result.intentDescription;
          mindfulState.intentSet = true;
        }
        if (result.favorites) {
          mindfulState.favorites = result.favorites;
        }
      }
    );
  }

  // Save user settings to storage
  function saveSettings() {
    chrome.storage.local.set({
      timeLimit: mindfulState.timeLimit,
      customCategories: mindfulState.customCategories,
      intentDescription: mindfulState.intentDescription,
      favorites: mindfulState.favorites,
    });
  }

  // Main function to initialize the extension
  function initMindfulYouTube() {
    loadSettings();

    // Check URL parameters to see if search or category was selected
    checkUrlForIntentionalBrowsing();

    // Detect YouTube's theme (light/dark mode)
    detectYouTubeTheme();

    // Try to extract YouTube's recommended categories
    if (mindfulState.youtubeRecommendedCategories.length === 0) {
      // We'll attempt to extract categories with a slight delay to ensure the DOM is loaded
      setTimeout(() => {
        extractYouTubeCategories();
      }, 1000);
    }

    // Set up listener for video pages to allow adding to favorites
    if (window.location.pathname.includes("/watch")) {
      setupAddToFavoritesButton();
    }

    // Only run on the main YouTube page
    if (
      window.location.pathname === "/" ||
      window.location.pathname === "/feed/subscriptions"
    ) {
      createObserver();
      setupChipClickListeners();

      // Only hide content if no intentional browsing detected
      if (!mindfulState.categorySelected && !mindfulState.searchPerformed) {
        hideHomeContent();
      } else if (mindfulState.timeLimit > 0) {
        // Start timer if time limit is set
        startWatchTimer();
      }
    }

    // Always hide the "All" tab on any YouTube page
    hideAllTab();
  }

  // Setup add to favorites button on watch pages
  function setupAddToFavoritesButton() {
    // Wait for video info to load
    const checkForVideoInfo = setInterval(() => {
      const videoTitle = document.querySelector(
        "h1.title.style-scope.ytd-video-primary-info-renderer"
      );
      const menuButtons = document.querySelector("#top-level-buttons-computed");

      if (
        videoTitle &&
        menuButtons &&
        !document.getElementById("mindful-add-favorite")
      ) {
        clearInterval(checkForVideoInfo);

        // Create the add to favorites button
        const favoriteButton = document.createElement("button");
        favoriteButton.id = "mindful-add-favorite";
        favoriteButton.className = "mindful-add-favorite-btn";
        favoriteButton.innerHTML = `
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M17,3H7c-1.1,0-2,0.9-2,2v16l7-3l7,3V5C19,3.9,18.1,3,17,3z M17,18l-5-2.18L7,18V5h10V18z"/>
          </svg>
          <span>Save</span>
        `;

        menuButtons.appendChild(favoriteButton);

        // Add click listener
        favoriteButton.addEventListener("click", showAddToFavoritesDialog);
      }
    }, 1000);
  }

  // Show dialog to add current video to favorites
  function showAddToFavoritesDialog() {
    // Get current video data
    const videoId = new URLSearchParams(window.location.search).get("v");
    const videoTitle = document
      .querySelector("h1.title.style-scope.ytd-video-primary-info-renderer")
      .textContent.trim();
    const channelName = document
      .querySelector("#channel-name a")
      .textContent.trim();
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    // Create modal dialog
    const modal = document.createElement("div");
    modal.className = "mindful-modal";
    modal.innerHTML = `
      <div class="mindful-modal-content">
        <div class="mindful-modal-header">
          <h2>Save to Favorites</h2>
          <button class="mindful-modal-close">&times;</button>
        </div>
        <div class="mindful-modal-body">
          <div class="mindful-video-preview">
            <img src="${thumbnail}" alt="${videoTitle}">
            <div class="mindful-video-info">
              <h3>${videoTitle}</h3>
              <p>${channelName}</p>
            </div>
          </div>
          <h4>Choose categories:</h4>
          <div class="mindful-category-selector">
            ${getCategoryCheckboxesHTML()}
          </div>
          <div class="mindful-add-category">
            <input type="text" id="new-category-input" placeholder="Add new category...">
            <button id="add-new-category-btn">Add</button>
          </div>
        </div>
        <div class="mindful-modal-footer">
          <button id="save-to-favorites-btn" class="mindful-primary-btn">Save</button>
          <button id="cancel-favorites-btn">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    document
      .querySelector(".mindful-modal-close")
      .addEventListener("click", () => {
        document.body.removeChild(modal);
      });

    document
      .getElementById("cancel-favorites-btn")
      .addEventListener("click", () => {
        document.body.removeChild(modal);
      });

    document
      .getElementById("add-new-category-btn")
      .addEventListener("click", () => {
        const input = document.getElementById("new-category-input");
        const category = input.value.trim();

        if (category && !mindfulState.customCategories.includes(category)) {
          mindfulState.customCategories.push(category);
          saveSettings();

          // Refresh category checkboxes
          const selector = document.querySelector(".mindful-category-selector");
          selector.innerHTML = getCategoryCheckboxesHTML();

          input.value = "";
        }
      });

    document
      .getElementById("save-to-favorites-btn")
      .addEventListener("click", () => {
        const selectedCategories = [];
        const checkboxes = document.querySelectorAll(
          ".mindful-category-checkbox:checked"
        );

        checkboxes.forEach((checkbox) => {
          selectedCategories.push(checkbox.value);
        });

        if (selectedCategories.length > 0) {
          // Save video to selected categories
          const videoData = {
            id: videoId,
            title: videoTitle,
            channel: channelName,
            thumbnail: thumbnail,
            url: window.location.href,
            added: Date.now(),
          };

          selectedCategories.forEach((category) => {
            if (!mindfulState.favorites[category]) {
              mindfulState.favorites[category] = [];
            }

            // Check if already in favorites
            const exists = mindfulState.favorites[category].some(
              (v) => v.id === videoId
            );
            if (!exists) {
              mindfulState.favorites[category].push(videoData);
            }
          });

          saveSettings();

          // Show confirmation
          const confirmationToast = document.createElement("div");
          confirmationToast.className = "mindful-toast";
          confirmationToast.textContent = "Added to favorites!";
          document.body.appendChild(confirmationToast);

          setTimeout(() => {
            document.body.removeChild(confirmationToast);
          }, 3000);
        }

        document.body.removeChild(modal);
      });
  }

  // Generate HTML for category checkboxes
  function getCategoryCheckboxesHTML() {
    // Try to get YouTube categories first
    let categories = [];

    // Use stored YouTube categories if available
    if (mindfulState.youtubeRecommendedCategories.length > 0) {
      categories = mindfulState.youtubeRecommendedCategories;
    } else {
      // Try to extract them now
      extractYouTubeCategories();

      if (mindfulState.youtubeRecommendedCategories.length > 0) {
        categories = mindfulState.youtubeRecommendedCategories;
      } else {
        // Fallback to default categories if no YouTube chips are found
        categories = [
          "Music",
          "Education",
          "Science",
          "Technology",
          "Cooking",
          "Fitness",
          "Productivity",
          "Art",
        ];
      }
    }

    // Combine with any custom categories
    const allCategories = [
      ...new Set([...categories, ...mindfulState.customCategories]),
    ];

    return allCategories
      .map(
        (category) => `
      <div class="mindful-category-checkbox-container">
        <input type="checkbox" id="category-${category}" class="mindful-category-checkbox" value="${category}">
        <label for="category-${category}">${category}</label>
      </div>
    `
      )
      .join("");
  }

  // Detect if YouTube is in dark or light mode
  function detectYouTubeTheme() {
    // Check for dark mode by looking at body background color or data-theme attribute
    const htmlElement = document.documentElement;
    const isDarkTheme = htmlElement.getAttribute("dark") === "true";

    if (isDarkTheme) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }

    // Set up observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "dark"
        ) {
          const isDarkTheme = htmlElement.getAttribute("dark") === "true";
          if (isDarkTheme) {
            document.body.classList.add("dark-theme");
          } else {
            document.body.classList.remove("dark-theme");
          }
        }
      }
    });

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ["dark"],
    });
  }

  // Check URL for signs of intentional browsing
  function checkUrlForIntentionalBrowsing() {
    const url = new URL(window.location.href);

    // Check if there's a search query
    if (url.searchParams.has("search_query")) {
      mindfulState.searchPerformed = true;
    }

    // Check if there's a chip parameter
    if (url.searchParams.has("chip")) {
      mindfulState.categorySelected = true;
    }
  }

  // Helper function to extract YouTube recommendation chips
  function extractYouTubeCategories() {
    const youtubeChips = Array.from(
      document.querySelectorAll("#chips yt-chip-cloud-chip-renderer")
    );

    if (youtubeChips.length > 0) {
      mindfulState.youtubeRecommendedCategories = youtubeChips
        .map((chip) => {
          // Get the text content of the chip
          const text = chip.firstElementChild.textContent.trim();
          // Skip "All" and empty chips
          if (text && text !== "All") {
            return text;
          }
          return null;
        })
        .filter(Boolean); // Remove null values
    }

    // If we found categories, save them
    if (mindfulState.youtubeRecommendedCategories.length > 0) {
      saveSettings();
    }

    return mindfulState.youtubeRecommendedCategories;
  }

  // Create MutationObserver to handle dynamic content loading
  function createObserver() {
    const observer = new MutationObserver((mutations) => {
      hideAllTab();
      setupChipClickListeners();

      // Extract YouTube categories if we haven't already
      if (mindfulState.youtubeRecommendedCategories.length === 0) {
        extractYouTubeCategories();
      }

      // Only hide and show mindfulness message if no intentional browsing detected
      if (!mindfulState.categorySelected && !mindfulState.searchPerformed) {
        hideHomeContent();
      } else {
        showHomeContent();
        // Start timer if time limit is set
        if (mindfulState.timeLimit > 0 && !mindfulState.startTime) {
          startWatchTimer();
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // Set up listeners for category chip clicks
  function setupChipClickListeners() {
    const chips = document.querySelectorAll("yt-chip-cloud-chip-renderer");

    chips.forEach((chip) => {
      // Skip the "All" chip
      if (chip.firstElementChild.textContent.trim() === "All") {
        chip.style.display = "none";
        return;
      }

      // Skip chips that already have listeners
      if (chip.dataset.mindfulListener) {
        return;
      }

      // Add click listener
      chip.addEventListener("click", handleChipClick);
      chip.dataset.mindfulListener = "true";
    });
  }

  // Handle when a user clicks on a category chip
  function handleChipClick() {
    mindfulState.categorySelected = true;
    showHomeContent();

    // Hide mindful message if present
    const message = document.getElementById("mindful-message");
    if (message) {
      message.style.display = "none";
    }

    // Start timer if time limit is set
    if (mindfulState.timeLimit > 0 && !mindfulState.startTime) {
      startWatchTimer();
    }
  }

  // Start the watch timer
  function startWatchTimer() {
    mindfulState.startTime = Date.now();
    updateTimerDisplay();

    // Create timer display if it doesn't exist
    createTimerDisplay();

    // Set interval to update timer
    const timerInterval = setInterval(() => {
      if (!mindfulState.startTime) {
        clearInterval(timerInterval);
        return;
      }

      updateTimerDisplay();

      // Check if time limit has been reached
      const elapsedMinutes = (Date.now() - mindfulState.startTime) / 60000;
      if (
        mindfulState.timeLimit > 0 &&
        elapsedMinutes >= mindfulState.timeLimit
      ) {
        clearInterval(timerInterval);
        showTimeLimitReachedMessage();
      }
    }, 1000);
  }

  // Update the timer display
  function updateTimerDisplay() {
    const timerDisplay = document.getElementById("mindful-timer-display");
    if (!timerDisplay || !mindfulState.startTime) return;

    const elapsedMs = Date.now() - mindfulState.startTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);

    timerDisplay.textContent = `${elapsedMinutes}:${elapsedSeconds
      .toString()
      .padStart(2, "0")}`;

    // Update progress bar
    const progressBar = document.querySelector(".mindful-progress-bar");
    if (progressBar && mindfulState.timeLimit > 0) {
      const percentComplete = Math.min(
        100,
        (elapsedMs / (mindfulState.timeLimit * 60000)) * 100
      );
      progressBar.style.width = `${percentComplete}%`;
    }
  }

  // Create timer display
  function createTimerDisplay() {
    if (document.getElementById("mindful-timer-container")) return;

    const container = document.createElement("div");
    container.id = "mindful-timer-container";
    container.className = "mindful-timer-container";
    container.innerHTML = `
      <div class="mindful-time-limit">
        <h3>Watch Timer</h3>
        <div id="mindful-timer-display">0:00</div>
        <div class="mindful-progress">
          <div class="mindful-progress-bar"></div>
        </div>
      </div>
    `;

    // Insert after the YouTube logo
    const ytdTopbarLogoRenderer = document.querySelector(
      "ytd-topbar-logo-renderer"
    );
    if (ytdTopbarLogoRenderer) {
      ytdTopbarLogoRenderer.insertAdjacentElement("afterend", container);
    }
  }

  // Show time limit reached message
  function showTimeLimitReachedMessage() {
    hideHomeContent();

    const messageContainer = document.getElementById("mindful-message");
    if (messageContainer) {
      messageContainer.innerHTML = `
        <div class="mindful-content">
          <h1>Time Limit Reached</h1>
          <p>You've been watching YouTube for ${mindfulState.timeLimit} minutes.</p>
          <p>Was this time well spent?</p>
          
          <div class="mindful-buttons">
            <button id="extend-time-button">Extend Time (5 min)</button>
            <button id="exit-button">Exit YouTube</button>
          </div>
        </div>
      `;

      // Add button event listeners
      document
        .getElementById("extend-time-button")
        .addEventListener("click", function () {
          // Add 5 minutes to the timer
          mindfulState.startTime = Date.now();
          mindfulState.timeLimit = 5;
          saveSettings();
          startWatchTimer();
          showHomeContent();
        });

      document
        .getElementById("exit-button")
        .addEventListener("click", function () {
          // Close the tab
          window.close();
        });

      messageContainer.style.display = "flex";
    }
  }

  // Hide home page content and show mindfulness message
  function hideHomeContent() {
    // Target the main content container
    const contentContainer = document.querySelector(
      "ytd-rich-grid-renderer #contents"
    );
    const originalChipsWrapper = document.querySelector(
      "ytd-feed-filter-chip-bar-renderer"
    );

    if (originalChipsWrapper) {
      originalChipsWrapper.style.display = "none";
    }

    if (contentContainer) {
      contentContainer.style.display = "none";

      // Check if our message is already displayed
      if (!document.getElementById("mindful-message")) {
        createMindfulMessage();
      } else {
        document.getElementById("mindful-message").style.display = "flex";
      }
    }
  }

  // Show home page content and hide mindfulness message
  function showHomeContent() {
    const contentContainer = document.querySelector(
      "ytd-rich-grid-renderer #contents"
    );
    const originalChipsWrapper = document.querySelector(
      "ytd-feed-filter-chip-bar-renderer"
    );

    if (originalChipsWrapper) {
      originalChipsWrapper.style.display = "none";
    }
    if (contentContainer) {
      contentContainer.style.display = "flex";
    }

    const message = document.getElementById("mindful-message");
    if (message) {
      message.style.display = "none";
    }
  }

  // Hide the "All" tab in the category chips
  function hideAllTab() {
    const allChips = document.querySelectorAll("yt-chip-cloud-chip-renderer");
    allChips.forEach((chip) => {
      if (chip.firstElementChild.textContent.trim() === "All") {
        chip.style.display = "none";
      }
    });
  }

  // Create and insert the mindfulness message
  function createMindfulMessage() {
    const contentArea = document.querySelector("#primary");
    if (!contentArea) return;

    const messageContainer = document.createElement("div");
    messageContainer.id = "mindful-message";

    // Create message content based on whether an intent has been set
    let messageContent = "";

    if (mindfulState.intentSet) {
      messageContent = `
        <div class="mindful-content">
          <h1>Remember Your Intention</h1>
          <p>You said you wanted to use YouTube to:</p>
          <p><strong>"${mindfulState.intentDescription}"</strong></p>
          
          <div class="mindful-chip-container">
            ${getPopularCategoriesHTML()}
          </div>
          
          <div class="mindful-buttons">
            <button id="search-button">Search Intentionally</button>
            <button id="edit-intent-button">Edit My Intention</button>
            <button id="manage-favorites-button">Manage Favorites</button>
          </div>
          
          <div class="mindful-time-limit">
            <h3>Set a time limit</h3>
            <div class="mindful-time-limit-controls">
              <button id="time-5" class="mindful-chip ${
                mindfulState.timeLimit === 5 ? "active" : ""
              }">5 min</button>
              <button id="time-10" class="mindful-chip ${
                mindfulState.timeLimit === 10 ? "active" : ""
              }">10 min</button>
              <button id="time-15" class="mindful-chip ${
                mindfulState.timeLimit === 15 ? "active" : ""
              }">15 min</button>
              <button id="time-30" class="mindful-chip ${
                mindfulState.timeLimit === 30 ? "active" : ""
              }">30 min</button>
            </div>
          </div>
        </div>
      `;
    } else {
      messageContent = `
        <div class="mindful-content">
          <h1>Pause and Be Mindful</h1>
          <p>What do you want to get out of your time on YouTube today?</p>
          
          <div class="mindful-feature-grid">
            <div class="mindful-feature" data-intent="learn">
              <svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"></path></svg>
              <h3>Learn something new</h3>
            </div>
            <div class="mindful-feature" data-intent="relax">
              <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"></path><path d="M12 8v5l4.25 2.52.77-1.28-3.52-2.09V8z"></path></svg>
              <h3>Relax for a specific time</h3>
            </div>
            <div class="mindful-feature" data-intent="research">
              <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
              <h3>Research a specific topic</h3>
            </div>
            <div class="mindful-feature" data-intent="custom">
              <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
              <h3>Set a custom intention</h3>
            </div>
          </div>
          
          <div class="mindful-chip-container">
            ${getPopularCategoriesHTML()}
          </div>
          
          <div class="mindful-buttons">
            <button id="search-button">Search Intentionally</button>
            <button id="categories-button">Browse Categories</button>
            <button id="manage-favorites-button">Manage Favorites</button>
          </div>
        </div>
      `;
    }

    messageContainer.innerHTML = messageContent;
    contentArea.prepend(messageContainer);

    // Add button event listeners
    document
      .getElementById("search-button")
      .addEventListener("click", function () {
        navigateToSearch();
      });

    // Add listeners to time limit buttons if they exist
    const timeButtons = document.querySelectorAll('[id^="time-"]');
    timeButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const minutes = parseInt(this.id.split("-")[1]);
        mindfulState.timeLimit = minutes;
        saveSettings();

        // Update active state
        timeButtons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
      });
    });

    // Add listeners for intent features if they exist
    const intentFeatures = document.querySelectorAll(".mindful-feature");
    intentFeatures.forEach((feature) => {
      feature.addEventListener("click", function () {
        const intent = this.dataset.intent;
        setUserIntent(intent);
      });
    });

    // Add listener for edit intent button if it exists
    const editIntentButton = document.getElementById("edit-intent-button");
    if (editIntentButton) {
      editIntentButton.addEventListener("click", function () {
        mindfulState.intentSet = false;
        mindfulState.intentDescription = "";
        saveSettings();
        createMindfulMessage(); // Recreate the message with the intent form
      });
    }

    // Add listener for manage favorites button
    const manageFavoritesButton = document.getElementById(
      "manage-favorites-button"
    );
    if (manageFavoritesButton) {
      manageFavoritesButton.addEventListener("click", function () {
        showManageFavoritesModal();
      });
    }

    // Add listener for categories button if it exists
    const categoriesButton = document.getElementById("categories-button");
    if (categoriesButton) {
      categoriesButton.addEventListener("click", function () {
        mindfulState.categorySelected = true;
        showHomeContent();

        // Start timer if time limit is set
        if (mindfulState.timeLimit > 0 && !mindfulState.startTime) {
          startWatchTimer();
        }
      });
    }

    // Add listeners for category chips
    setupCategoryChipListeners();
  }

  // Show the manage favorites modal
  function showManageFavoritesModal() {
    // Create modal dialog
    const modal = document.createElement("div");
    modal.className = "mindful-modal";
    modal.innerHTML = `
      <div class="mindful-modal-content mindful-modal-lg">
        <div class="mindful-modal-header">
          <h2>Manage Favorites</h2>
          <button class="mindful-modal-close">&times;</button>
        </div>
        <div class="mindful-modal-body">
          <div class="mindful-favorites-tabs">
            ${
              Object.keys(mindfulState.favorites)
                .map(
                  (category) =>
                    `<button class="mindful-tab-btn" data-category="${category}">${category}</button>`
                )
                .join("") ||
              "<p>No favorites yet! Save videos to see them here.</p>"
            }
          </div>
          <div class="mindful-favorites-content">
            ${
              Object.keys(mindfulState.favorites).length > 0
                ? `<div class="mindful-favorites-grid" id="mindful-favorites-grid"></div>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    document
      .querySelector(".mindful-modal-close")
      .addEventListener("click", () => {
        document.body.removeChild(modal);
      });

    // Set up tabs
    const tabButtons = document.querySelectorAll(".mindful-tab-btn");
    if (tabButtons.length > 0) {
      // Default to first tab
      const firstCategory = tabButtons[0].dataset.category;
      showFavoritesForCategory(firstCategory);

      // Highlight first tab
      tabButtons[0].classList.add("active");

      // Add tab click listeners
      tabButtons.forEach((button) => {
        button.addEventListener("click", function () {
          // Remove active class from all tabs
          tabButtons.forEach((btn) => btn.classList.remove("active"));

          // Add active class to clicked tab
          this.classList.add("active");

          // Show favorites for this category
          showFavoritesForCategory(this.dataset.category);
        });
      });
    }
  }

  // Show favorites for a specific category
  function showFavoritesForCategory(category) {
    const grid = document.getElementById("mindful-favorites-grid");
    if (!grid) return;

    const favorites = mindfulState.favorites[category] || [];

    if (favorites.length === 0) {
      grid.innerHTML = `<p class="mindful-no-favorites">No videos saved in this category yet.</p>`;
      return;
    }

    let html = "";

    favorites.forEach((video) => {
      html += `
        <div class="mindful-favorite-card">
          <a href="${video.url}" class="mindful-favorite-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}">
            <div class="mindful-favorite-play">
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"></path>
              </svg>
            </div>
          </a>
          <div class="mindful-favorite-info">
            <a href="${video.url}" class="mindful-favorite-title">${video.title}</a>
            <p class="mindful-favorite-channel">${video.channel}</p>
          </div>
          <button class="mindful-remove-favorite" data-video-id="${video.id}" data-category="${category}">
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
            </svg>
          </button>
        </div>
      `;
    });

    grid.innerHTML = html;

    // Add remove button listeners
    const removeButtons = document.querySelectorAll(".mindful-remove-favorite");
    removeButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const videoId = this.dataset.videoId;
        const category = this.dataset.category;

        // Remove from favorites
        if (mindfulState.favorites[category]) {
          mindfulState.favorites[category] = mindfulState.favorites[
            category
          ].filter((v) => v.id !== videoId);
          saveSettings();

          // Refresh display
          showFavoritesForCategory(category);

          // If no more videos in this category, refresh the tabs
          if (mindfulState.favorites[category].length === 0) {
            delete mindfulState.favorites[category];
            showManageFavoritesModal();
          }
        }
      });
    });
  }

  // Set up listeners for our custom category chips
  function setupCategoryChipListeners() {
    const chips = document.querySelectorAll(
      ".mindful-chip-container .mindful-chip"
    );
    chips.forEach((chip) => {
      chip.addEventListener("click", function () {
        const category = this.textContent.trim();

        // Check if we have favorites for this category
        if (
          mindfulState.favorites[category] &&
          mindfulState.favorites[category].length > 0
        ) {
          // Show favorites grid
          showFavoritesGrid(category);
        } else {
          // Find the corresponding YouTube chip and click it if possible
          const youtubeChips = Array.from(
            document.querySelectorAll("#chips yt-chip-cloud-chip-renderer")
          );
          const matchingChip = youtubeChips.find(
            (ytChip) => ytChip.firstElementChild.textContent.trim() === category
          );

          if (matchingChip) {
            // Simulate a click on the YouTube chip
            matchingChip.click();
            mindfulState.categorySelected = true;
            showHomeContent();

            // Start timer if time limit is set
            if (mindfulState.timeLimit > 0 && !mindfulState.startTime) {
              startWatchTimer();
            }
          } else {
            // Fall back to the old behavior if no matching chip is found
            window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(
              category
            )}`;
          }
        }
      });
    });
  }

  // Show a grid of favorites for a category
  function showFavoritesGrid(category) {
    const favorites = mindfulState.favorites[category] || [];

    if (favorites.length === 0) return;

    // Hide regular content
    const contentContainer = document.querySelector(
      "ytd-rich-grid-renderer #contents"
    );
    if (contentContainer) {
      contentContainer.style.display = "none";
    }

    // Remove existing favorites grid if any
    const existingGrid = document.getElementById("mindful-favorites-display");
    if (existingGrid) {
      existingGrid.parentNode.removeChild(existingGrid);
    }

    // Create favorites grid
    const favoritesDisplay = document.createElement("div");
    favoritesDisplay.id = "mindful-favorites-display";
    favoritesDisplay.innerHTML = `
      <div class="mindful-favorites-header">
        <h2>${category} Favorites</h2>
        <button id="mindful-close-favorites">Back to YouTube</button>
      </div>
      <div class="mindful-favorites-grid">
        ${favorites
          .map(
            (video) => `
          <div class="mindful-favorite-card">
            <a href="${video.url}" class="mindful-favorite-thumbnail">
              <img src="${video.thumbnail}" alt="${video.title}">
              <div class="mindful-favorite-play">
                <svg viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"></path>
                </svg>
              </div>
            </a>
            <div class="mindful-favorite-info">
              <a href="${video.url}" class="mindful-favorite-title">${video.title}</a>
              <p class="mindful-favorite-channel">${video.channel}</p>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    // Insert into page
    const primaryContent = document.querySelector("#primary");
    if (primaryContent) {
      primaryContent.appendChild(favoritesDisplay);

      // Add close button listener
      document
        .getElementById("mindful-close-favorites")
        .addEventListener("click", () => {
          // Remove favorites grid
          primaryContent.removeChild(favoritesDisplay);

          // Show regular content
          if (contentContainer) {
            contentContainer.style.display = "flex";
          }
        });
    }
  }

  // Get HTML for popular category chips
  function getPopularCategoriesHTML() {
    // Try to get YouTube categories first
    let categories = [];

    // Use stored YouTube categories if available
    if (mindfulState.youtubeRecommendedCategories.length > 0) {
      categories = mindfulState.youtubeRecommendedCategories;
    } else {
      // Try to extract them now
      extractYouTubeCategories();

      if (mindfulState.youtubeRecommendedCategories.length > 0) {
        categories = mindfulState.youtubeRecommendedCategories;
      } else {
        // Fallback to default categories if no YouTube chips are found
        categories = [
          "Music",
          "Education",
          "Science",
          "Technology",
          "Cooking",
          "Fitness",
          "Productivity",
          "Art",
        ];
      }
    }

    // Combine with any custom categories
    const allCategories = [
      ...new Set([...categories, ...mindfulState.customCategories]),
    ];

    // Highlight categories that have favorites with a star
    return allCategories
      .map((category) => {
        const hasFavorites =
          mindfulState.favorites[category] &&
          mindfulState.favorites[category].length > 0;
        return `<div class="mindful-chip ${
          hasFavorites ? "has-favorites" : ""
        }" data-category="${category}">
            ${category}
            ${hasFavorites ? '<span class="mindful-star">★</span>' : ""}
          </div>`;
      })
      .join("");
  }

  // Set user intent based on selection
  function setUserIntent(intent) {
    let intentDescription = "";

    switch (intent) {
      case "learn":
        intentDescription = "Learn something new and educational";
        break;
      case "relax":
        intentDescription = "Relax and enjoy content for a limited time";
        break;
      case "research":
        intentDescription = "Research a specific topic of interest";
        break;
      case "custom":
        // Show custom intent input
        showCustomIntentInput();
        return;
      default:
        intentDescription = "Use YouTube mindfully";
    }

    mindfulState.intentSet = true;
    mindfulState.intentDescription = intentDescription;
    saveSettings();
    createMindfulMessage(); // Recreate the message with the intent
  }

  // Show custom intent input
  function showCustomIntentInput() {
    const messageContent = document.querySelector(".mindful-content");
    if (!messageContent) return;

    messageContent.innerHTML = `
      <h1>Set Your Intention</h1>
      <p>What do you want to get out of your time on YouTube today?</p>
      
      <div style="margin: 24px 0;">
        <input type="text" id="custom-intent-input" placeholder="e.g., Learn about web development..." 
               style="width: 100%; padding: 12px; font-size: 16px; border-radius: 4px; border: 1px solid var(--yt-spec-10-percent-layer, #ddd);">
      </div>
      
      <div class="mindful-buttons">
        <button id="save-intent-button">Save My Intention</button>
        <button id="cancel-intent-button">Cancel</button>
      </div>
    `;

    // Add event listeners
    document
      .getElementById("save-intent-button")
      .addEventListener("click", function () {
        const intentInput = document.getElementById("custom-intent-input");
        if (intentInput && intentInput.value.trim()) {
          mindfulState.intentSet = true;
          mindfulState.intentDescription = intentInput.value.trim();
          saveSettings();
          createMindfulMessage(); // Recreate the message with the intent
        }
      });

    document
      .getElementById("cancel-intent-button")
      .addEventListener("click", function () {
        createMindfulMessage(); // Go back to the main message
      });

    // Focus the input
    setTimeout(() => {
      const intentInput = document.getElementById("custom-intent-input");
      if (intentInput) intentInput.focus();
    }, 100);
  }

  // Function to handle search navigation safely
  function navigateToSearch() {
    mindfulState.searchPerformed = true;

    // Try to focus the search input if it exists
    const searchInput = document.querySelector("input#search");

    if (searchInput) {
      // If search input exists, focus it
      searchInput.focus();
      showHomeContent();
    } else {
      // Alternative approach: Click on the search icon/button
      const searchButton =
        document.querySelector("button#search-icon-legacy") ||
        document.querySelector("ytd-searchbox");

      if (searchButton) {
        searchButton.click();
        showHomeContent();
      } else {
        // Last resort: Redirect to search page
        window.location.href = "https://www.youtube.com/results?search_query=";
      }
    }

    // Start timer if time limit is set
    if (mindfulState.timeLimit > 0 && !mindfulState.startTime) {
      startWatchTimer();
    }
  }

  // Reset the mindful state when navigating back
  window.addEventListener("popstate", function () {
    checkUrlForIntentionalBrowsing();

    if (!mindfulState.categorySelected && !mindfulState.searchPerformed) {
      hideHomeContent();
    }
  });

  // Run initialization when DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMindfulYouTube);
  } else {
    initMindfulYouTube();
  }
})();

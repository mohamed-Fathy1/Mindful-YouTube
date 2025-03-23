// UI Components and Rendering

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

// Create and insert the mindfulness message
function createMindfulMessage() {
  const contentArea = document.querySelector("#primary");
  if (!contentArea) return;

  // Make sure we have access to the state
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;
  const { mindfulState } = window.mindfulYoutube.state;

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

  // Add event listeners to the mindful message buttons and controls
  setupMessageEventListeners();
}

// Add event listeners for the mindful message
function setupMessageEventListeners() {
  // Make sure we have access to the state
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;
  const { mindfulState, saveSettings } = window.mindfulYoutube.state;

  // Add button event listeners
  document
    .getElementById("search-button")
    .addEventListener("click", function () {
      window.mindfulYoutube.youtube.navigateToSearch();
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
      window.mindfulYoutube.intent.setUserIntent(intent);
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
      window.mindfulYoutube.favorites.showManageFavoritesModal();
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
        window.mindfulYoutube.timer.startWatchTimer();
      }
    });
  }

  // Add listeners for category chips
  setupCategoryChipListeners();
}

// Setup listeners for our custom category chips
function setupCategoryChipListeners() {
  // Make sure we have access to the state
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;
  const { mindfulState } = window.mindfulYoutube.state;

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
        window.mindfulYoutube.favorites.showFavoritesGrid(category);
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
            window.mindfulYoutube.timer.startWatchTimer();
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

// Get HTML for popular category chips
function getPopularCategoriesHTML() {
  // Make sure we have access to the state
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) return "";
  const { mindfulState } = window.mindfulYoutube.state;

  // Try to get YouTube categories first
  let categories = [];

  // Use stored YouTube categories if available
  if (mindfulState.youtubeRecommendedCategories.length > 0) {
    categories = mindfulState.youtubeRecommendedCategories;
  } else {
    // Try to extract them now
    if (window.mindfulYoutube.youtube) {
      window.mindfulYoutube.youtube.extractYouTubeCategories();
    }

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

// Show time limit reached message
function showTimeLimitReachedMessage() {
  // Make sure we have access to the state
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;
  const { mindfulState, saveSettings } = window.mindfulYoutube.state;

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
        window.mindfulYoutube.timer.startWatchTimer();
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

// Export the functions for use in other modules
window.mindfulYoutube = window.mindfulYoutube || {};
window.mindfulYoutube.ui = {
  hideHomeContent,
  showHomeContent,
  createMindfulMessage,
  setupMessageEventListeners,
  setupCategoryChipListeners,
  getPopularCategoriesHTML,
  showTimeLimitReachedMessage,
};

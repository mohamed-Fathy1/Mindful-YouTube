// State management for Mindful YouTube

// Initial state
const mindfulState = {
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
  return new Promise((resolve) => {
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
        resolve();
      }
    );
  });
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

// Export the functions and state for use in other modules
window.mindfulYoutube = window.mindfulYoutube || {};
window.mindfulYoutube.state = {
  mindfulState,
  loadSettings,
  saveSettings,
  checkUrlForIntentionalBrowsing,
};

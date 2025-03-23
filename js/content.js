// Main entry point for Mindful YouTube extension

// Create a MutationObserver to handle dynamic content loading
function createObserver() {
  const observer = new MutationObserver((mutations) => {
    // Make sure all modules are loaded before attempting to use them
    if (
      !window.mindfulYoutube ||
      !window.mindfulYoutube.state ||
      !window.mindfulYoutube.youtube ||
      !window.mindfulYoutube.ui ||
      !window.mindfulYoutube.timer
    ) {
      return; // Exit early if modules aren't ready
    }

    const { mindfulState, checkUrlForIntentionalBrowsing } =
      window.mindfulYoutube.state;
    const { hideAllTab, setupChipClickListeners, extractYouTubeCategories } =
      window.mindfulYoutube.youtube;
    const { hideHomeContent, showHomeContent } = window.mindfulYoutube.ui;
    const { startWatchTimer } = window.mindfulYoutube.timer;

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

// Main function to initialize the extension
async function initMindfulYouTube() {
  // Wait to ensure all modules are initialized
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) {
    // Try again in a moment if modules aren't ready
    setTimeout(initMindfulYouTube, 100);
    return;
  }

  const { loadSettings, checkUrlForIntentionalBrowsing, mindfulState } =
    window.mindfulYoutube.state;

  // Load settings first
  await loadSettings();

  // Check URL parameters to see if search or category was selected
  checkUrlForIntentionalBrowsing();

  // Make sure youtube module is loaded
  if (!window.mindfulYoutube.youtube) {
    // Try again in a moment if module isn't ready
    setTimeout(initMindfulYouTube, 100);
    return;
  }

  const {
    detectYouTubeTheme,
    hideAllTab,
    setupChipClickListeners,
    extractYouTubeCategories,
  } = window.mindfulYoutube.youtube;

  // Make sure all other required modules are loaded
  if (
    !window.mindfulYoutube.ui ||
    !window.mindfulYoutube.favorites ||
    !window.mindfulYoutube.timer
  ) {
    // Try again in a moment if modules aren't ready
    setTimeout(initMindfulYouTube, 100);
    return;
  }

  const { hideHomeContent } = window.mindfulYoutube.ui;
  const { setupAddToFavoritesButton } = window.mindfulYoutube.favorites;
  const { startWatchTimer } = window.mindfulYoutube.timer;

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

  // Reset the mindful state when navigating back
  window.addEventListener("popstate", function () {
    checkUrlForIntentionalBrowsing();

    if (!mindfulState.categorySelected && !mindfulState.searchPerformed) {
      hideHomeContent();
    }
  });
}

// Ensure all module files have loaded before attempting initialization
// We need to wait longer since we're dealing with multiple modules
function ensureModulesLoaded() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      // Wait to make sure all modules are loaded
      setTimeout(initMindfulYouTube, 300);
    });
  } else {
    // Wait to make sure all modules are loaded
    setTimeout(initMindfulYouTube, 300);
  }
}

// Start the initialization process
ensureModulesLoaded();

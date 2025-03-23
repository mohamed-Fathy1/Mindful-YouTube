// YouTube integration functionality

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
      if (mutation.type === "attributes" && mutation.attributeName === "dark") {
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

// Helper function to extract YouTube recommendation chips
function extractYouTubeCategories() {
  const { mindfulState, saveSettings } = window.mindfulYoutube.state;
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

// Hide the "All" tab in the category chips
function hideAllTab() {
  const allChips = document.querySelectorAll("yt-chip-cloud-chip-renderer");
  allChips.forEach((chip) => {
    if (chip.firstElementChild.textContent.trim() === "All") {
      chip.style.display = "none";
    }
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
  const { mindfulState } = window.mindfulYoutube.state;
  mindfulState.categorySelected = true;

  // Use the UI module's showHomeContent function
  window.mindfulYoutube.ui.showHomeContent();

  // Start timer if time limit is set
  if (mindfulState.timeLimit > 0 && !mindfulState.startTime) {
    window.mindfulYoutube.timer.startWatchTimer();
  }
}

// Function to handle search navigation safely
function navigateToSearch() {
  const { mindfulState } = window.mindfulYoutube.state;
  // mindfulState.searchPerformed = true;

  // Try to focus the search input if it exists
  const searchInput = document.querySelector("input.ytSearchboxComponentInput");
  console.log(searchInput);

  if (searchInput) {
    // If search input exists, focus it
    searchInput.focus();
    // window.mindfulYoutube.ui.showHomeContent();
  } else {
    // Alternative approach: Click on the search icon/button
    const searchButton =
      document.querySelector("button#search-icon-legacy") ||
      document.querySelector("ytd-searchbox");
    console.log(searchButton);
    if (searchButton) {
      searchButton.click();
      // window.mindfulYoutube.ui.showHomeContent();
    } else {
      // Last resort: Redirect to search page
      window.location.href = "https://www.youtube.com/results?search_query=";
    }
  }

  // Start timer if time limit is set
  // if (mindfulState.timeLimit > 0 && !mindfulState.startTime) {
  //   window.mindfulYoutube.timer.startWatchTimer();
  // }
}

// Export the functions for use in other modules
window.mindfulYoutube = window.mindfulYoutube || {};
window.mindfulYoutube.youtube = {
  detectYouTubeTheme,
  extractYouTubeCategories,
  hideAllTab,
  setupChipClickListeners,
  handleChipClick,
  navigateToSearch,
};

// Favorites management

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
      if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;
      const { mindfulState, saveSettings } = window.mindfulYoutube.state;

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
      if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;
      const { mindfulState, saveSettings } = window.mindfulYoutube.state;

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

// Show the manage favorites modal
function showManageFavoritesModal() {
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;
  const { mindfulState } = window.mindfulYoutube.state;

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
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;
  const { mindfulState, saveSettings } = window.mindfulYoutube.state;

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

// Show a grid of favorites for a category
function showFavoritesGrid(category) {
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;
  const { mindfulState } = window.mindfulYoutube.state;

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

// Export the functions for use in other modules
window.mindfulYoutube = window.mindfulYoutube || {};
window.mindfulYoutube.favorites = {
  setupAddToFavoritesButton,
  showAddToFavoritesDialog,
  getCategoryCheckboxesHTML,
  showManageFavoritesModal,
  showFavoritesForCategory,
  showFavoritesGrid,
};

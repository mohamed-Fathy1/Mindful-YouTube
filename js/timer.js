// Timer Functionality

// Start the watch timer
function startWatchTimer() {
  const { mindfulState } = window.mindfulYoutube.state;
  mindfulState.startTime = Date.now();
  updateTimerDisplay();

  // Create timer display if it doesn't exist
  createTimerDisplay();

  // Set interval to update timer
  const timerInterval = setInterval(() => {
    if (!window.mindfulYoutube || !window.mindfulYoutube.state) {
      clearInterval(timerInterval);
      return;
    }

    const { mindfulState } = window.mindfulYoutube.state;
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
      if (window.mindfulYoutube.ui) {
        window.mindfulYoutube.ui.showTimeLimitReachedMessage();
      }
    }
  }, 1000);
}

// Update the timer display
function updateTimerDisplay() {
  if (!window.mindfulYoutube || !window.mindfulYoutube.state) return;

  const { mindfulState } = window.mindfulYoutube.state;
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

// Export the functions for use in other modules
window.mindfulYoutube = window.mindfulYoutube || {};
window.mindfulYoutube.timer = {
  startWatchTimer,
  updateTimerDisplay,
  createTimerDisplay,
};

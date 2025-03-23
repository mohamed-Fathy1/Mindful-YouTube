// Intention management

// Set user intent based on selection
function setUserIntent(intent) {
  const { mindfulState, saveSettings } = window.mindfulYoutube.state;
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
  window.mindfulYoutube.ui.createMindfulMessage(); // Recreate the message with the intent
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
      const { mindfulState, saveSettings } = window.mindfulYoutube.state;
      const intentInput = document.getElementById("custom-intent-input");
      if (intentInput && intentInput.value.trim()) {
        mindfulState.intentSet = true;
        mindfulState.intentDescription = intentInput.value.trim();
        saveSettings();
        window.mindfulYoutube.ui.createMindfulMessage(); // Recreate the message with the intent
      }
    });

  document
    .getElementById("cancel-intent-button")
    .addEventListener("click", function () {
      window.mindfulYoutube.ui.createMindfulMessage(); // Go back to the main message
    });

  // Focus the input
  setTimeout(() => {
    const intentInput = document.getElementById("custom-intent-input");
    if (intentInput) intentInput.focus();
  }, 100);
}

// Export the functions for use in other modules
window.mindfulYoutube = window.mindfulYoutube || {};
window.mindfulYoutube.intent = {
  setUserIntent,
  showCustomIntentInput,
};

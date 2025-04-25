window.onload = function () {
  // Initialize state variables from localStorage or set defaults
  let texts = JSON.parse(localStorage.getItem('randomizeTexts')) || [];
  let cutMode = JSON.parse(localStorage.getItem('randomizeCutMode')) || false;
  let selectedText = null;
  let speed = parseInt(localStorage.getItem('randomizeSpeed')) || 600; // Animation speed in ms
  let history = JSON.parse(localStorage.getItem('randomizeHistory')) || []; // Track selection history

  // Cache DOM element references
  const titleInput = document.getElementById("titleInput");
  const saveTitleBtn = document.getElementById("saveTitleBtn");
  const appTitle = document.getElementById("appTitle");
  const textInput = document.getElementById("textInput");
  const addTextBtn = document.getElementById("addTextBtn");
  const textInputError = document.getElementById("textInputError");
  const textDisplay = document.getElementById("textDisplay");
  const numberInput = document.getElementById("numberInput");
  const randomizeBtn = document.getElementById("randomizeBtn");
  const cutToggle = document.getElementById("cutToggle");
  const textList = document.getElementById("textList");
  const modeIndicator = document.getElementById("modeIndicator");
  const historyBtn = document.getElementById("historyBtn");
  const numberError = document.getElementById("numberError");
  const downloadHistoryBtn = document.getElementById("downloadHistoryBtn");
  const historyModal = document.getElementById("historyModal");
  const resetDataBtn = document.getElementById("resetDataBtn");
  const howToPlayBtn = document.getElementById("howToPlayBtn");
  const howToPlayModal = document.getElementById("howToPlayModal");
  const closeHowToPlayBtn = document.getElementById("closeHowToPlayBtn");

  // Settings modal elements
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const speedInput = document.getElementById("speedInput");
  const speedSlider = document.getElementById("speedSlider");
  const speedValue = document.getElementById("speedValue");

  // Set default number input value to 1
  numberInput.value = 1;

  // Initialize animation speed from localStorage
  if (speedInput) {
    speedInput.value = speed;
  }

  // Fix history modal event handling
  fixHistoryModal();

  // Add event listeners
  addTextBtn.addEventListener("click", addText);
  saveTitleBtn.addEventListener("click", saveTitle);
  randomizeBtn.addEventListener("click", randomizeMultiple);
  // Add space key as shortcut for randomization
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      randomizeMultiple();
    }
  });
  cutToggle.addEventListener("click", toggleCutMode);
  historyBtn.addEventListener("click", toggleHistoryModal);
  downloadHistoryBtn.addEventListener("click", downloadHistory);

  // Settings modal event listeners
  settingsToggle.addEventListener("click", toggleSettingsModal);
  closeSettingsBtn.addEventListener("click", toggleSettingsModal);

  // How to Play modal event listeners
  howToPlayBtn.addEventListener("click", () => {
    howToPlayModal.classList.remove("hidden");
  });

  closeHowToPlayBtn.addEventListener("click", () => {
    howToPlayModal.classList.add("hidden");
  });

  howToPlayModal.addEventListener("click", (e) => {
    if (e.target === howToPlayModal) {
      howToPlayModal.classList.add("hidden");
    }
  });

  // Initialize UI on page load
  updateTextList();
  updateModeIndicator();
  updateHistoryList();

  /**
   * Toggles the settings modal visibility
   */
  function toggleSettingsModal() {
    if (settingsModal.classList.contains("hidden")) {
      settingsModal.classList.remove("hidden");
      setTimeout(() => {
        settingsModal.classList.add("opacity-100");
      }, 10);
    } else {
      settingsModal.classList.remove("opacity-100");
      setTimeout(() => {
        settingsModal.classList.add("hidden");
      }, 300);
    }
  }

  // Close settings modal when clicking outside
  settingsModal.addEventListener("click", function (e) {
    if (e.target === settingsModal) {
      toggleSettingsModal();
    }
  });

  // Reset all data when reset button clicked
  resetDataBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to reset all data? This will clear all rewards and history."
      )
    ) {
      // Clear all localStorage data
      localStorage.removeItem("randomizeTexts");
      localStorage.removeItem("randomizeCutMode");
      localStorage.removeItem("randomizeSpeed");
      localStorage.removeItem("randomizeHistory");
    
      // Reset variables to defaults
      texts = [];
      cutMode = false;
      selectedText = null;
      speed = 600;
      history = [];
      
      // Reload the page to reflect changes
      location.reload();
    }
  });

  /**
   * Updates the mode indicator text and styling based on current cut mode
   */
  function updateModeIndicator() {
    modeIndicator.textContent = `Current Mode: ${
      cutMode ? "Remove" : "Keep"
    } texts after selection`;

    if (cutMode) {
      // Apply "cut mode" styling (red)
      modeIndicator.classList.remove(
        "bg-green-100/15",
        "text-green-700",
        "border-green-300/30"
      );
      modeIndicator.classList.add(
        "bg-red-100/15",
        "text-red-700",
        "border-red-300/30"
      );
      cutToggle.classList.remove("from-green-400", "to-green-600");
      cutToggle.classList.add("from-red-400", "to-red-600");
    } else {
      // Apply "keep mode" styling (green)
      modeIndicator.classList.remove(
        "bg-red-100/15",
        "text-red-700",
        "border-red-300/30"
      );
      modeIndicator.classList.add(
        "bg-green-100/15",
        "text-green-700",
        "border-green-300/30"
      );
      cutToggle.classList.remove("from-red-400", "to-red-600");
      cutToggle.classList.add("from-green-400", "to-green-600");
    }
  }

  /**
   * Main randomization function that selects multiple items based on user input
   */
  function randomizeMultiple() {
    const count = parseInt(numberInput.value);

    // Position error message under the amount input
    const inputRect = numberInput.getBoundingClientRect();
    const parentRect = numberInput.parentElement.getBoundingClientRect();

    numberError.style.position = "absolute";
    numberError.style.left = "0";
    numberError.style.top = "100%";
    numberError.style.width = "100%";
    numberError.style.textAlign = "left";

    // Clear previous error message
    numberError.textContent = "";

    // Validate input
    if (isNaN(count) || count < 1) {
      numberError.textContent = "Number must be greater than 0";
      return;
    }

    if (texts.length === 0) {
      textDisplay.textContent = "No texts available!";
      return;
    }

    if (texts.length < count) {
      numberError.textContent = "Number must be lower than all text combined.";
      return;
    }

    // Disable UI during randomization
    disableButtons(true);

    let randomized = [];
    let availableTexts = [...texts]; // Make a copy to ensure no duplicates
    let removedTexts = []; // Track removed texts if in cut mode

    // Clear the display at the start
    textDisplay.innerHTML = "<div class='text-xl'>Randomizing...</div>";

    // Set up shuffle animation
    let shuffleCount = 0;
    const maxShuffles = 10;

    /**
     * Creates shuffling animation effect before showing final results
     */
    function shuffleText() {
      if (shuffleCount < maxShuffles) {
        // Show a random text from the available pool
        textDisplay.innerHTML =
          "<div class='text-4xl font-bold'>" +
          availableTexts[Math.floor(Math.random() * availableTexts.length)] +
          "</div>";

        shuffleCount++;
        setTimeout(shuffleText, 100);
      } else {
        // After shuffling, select the final items
        selectFinalItems();
      }
    }

    /**
     * Selects final random items after animation completes
     */
    function selectFinalItems() {
      // Select the required number of random items
      for (let j = 0; j < count; j++) {
        if (availableTexts.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableTexts.length);
          const text = availableTexts[randomIndex];
          randomized.push(text);
          availableTexts.splice(randomIndex, 1);

          // In cut mode, remove selected items from the main text array
          if (cutMode) {
            const indexToRemove = texts.indexOf(text);
            if (indexToRemove !== -1) {
              removedTexts.push(text);
              texts.splice(indexToRemove, 1);
            }
          }
        }
      }

      // Show all results at once
      showFinalResults(randomized);

      // Add to history
      const timestamp = new Date().toLocaleTimeString();
      history.push({
        type: count === 1 ? "single" : "multiple",
        items: randomized,
        timestamp: timestamp,
        cutMode: cutMode,
        removedTexts: cutMode ? removedTexts : [],
      });

      // Save to localStorage
      localStorage.setItem('randomizeTexts', JSON.stringify(texts));
      localStorage.setItem('randomizeHistory', JSON.stringify(history));

      // Update UI
      updateHistoryList();
      updateTextList();
      disableButtons(false);
    }

    // Start the shuffling animation
    shuffleText();
  }

  /**
   * Displays the final randomization results
   * @param {Array} results - Array of selected text items
   */
  function showFinalResults(results) {
    // Create a new results display
    textDisplay.innerHTML = "";

    // Add header
    const header = document.createElement("div");
    header.className = "text-2xl font-bold mb-4 text-indigo-600";
    header.textContent = results.length > 1 ? "Final Results:" : "Result:";
    textDisplay.appendChild(header);

    // Create result container
    const resultContainer = document.createElement("div");
    resultContainer.className = "flex flex-col items-center space-y-2 w-full";

    // Add each result on a new line
    results.forEach((text, index) => {
      const resultItem = document.createElement("div");
      resultItem.className =
        "text-3xl font-bold p-3 bg-white/80 w-full text-center rounded-lg shadow-sm";
      resultItem.textContent = text;
      resultContainer.appendChild(resultItem);
    });

    textDisplay.appendChild(resultContainer);
  }

  /**
   * Updates the history list display
   */
  function updateHistoryList() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    historyList.innerHTML = "";

    // Add history items in reverse order (newest first)
    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      const div = document.createElement("div");

      if (item.type === "single") {
        div.innerHTML = `
          <span class="text-purple-500 font-medium">${item.timestamp}</span>: 
          <span class="font-semibold">${item.items[0]}</span>
          ${
            item.cutMode
              ? `<span class="text-red-500 text-xs ml-2">[CUT MODE]</span>`
              : ""
          }
          ${
            item.cutMode && item.removedTexts.length > 0
              ? `<div class="text-xs text-gray-500 ml-4">Removed: ${item.removedTexts.join(
                  ", "
                )}</div>`
              : ""
          }
        `;
      } else {
        div.innerHTML = `
          <span class="text-purple-500 font-medium">${item.timestamp}</span>: 
          Multiple selection - <span class="font-semibold">${item.items.join(
            ", "
          )}</span>
          ${
            item.cutMode
              ? `<span class="text-red-500 text-xs ml-2">[CUT MODE]</span>`
              : ""
          }
          ${
            item.cutMode && item.removedTexts.length > 0
              ? `<div class="text-xs text-gray-500 ml-4">Removed: ${item.removedTexts.join(
                  ", "
                )}</div>`
              : ""
          }
        `;
      }

      div.className =
        "p-3 border-b border-gray-200/50 transition-all duration-200 rounded-md hover:bg-white/80";
      historyList.appendChild(div);
    }

    // If no history, show message
    if (history.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.textContent = "No selection history yet";
      emptyMessage.className = "p-3 text-center text-gray-500 italic";
      historyList.appendChild(emptyMessage);
    }

    // Save history to localStorage
    localStorage.setItem('randomizeHistory', JSON.stringify(history));
  }

  /**
   * Downloads history as a CSV file
   */
  function downloadHistory() {
    if (history.length === 0) {
      alert("No history to download");
      return;
    }

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add header row
    csvContent += "Time,Type,Selection,Cut Mode\n";

    // Add each history entry
    history.forEach((item) => {
      const timestamp = item.timestamp;
      const type = item.type;
      const selections = item.items.join("|").replace(/,/g, ";"); // Replace commas to avoid CSV issues
      const cutModeValue = item.cutMode ? "Yes" : "No";

      csvContent += `${timestamp},${type},"${selections}",${cutModeValue}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `randomizer_history_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);
  }

  /**
   * Toggles between cut mode and keep mode
   */
  function toggleCutMode() {
    cutMode = !cutMode;

    const cutToggleBtn = document.getElementById("cutToggle");

    if (cutMode) {
      cutToggleBtn.textContent = "🔄 Cut Mode: ON";
      cutToggleBtn.classList.remove("from-green-400", "to-green-600");
      cutToggleBtn.classList.add("from-red-400", "to-red-600");
    } else {
      cutToggleBtn.textContent = "🔄 Cut Mode: OFF";
      cutToggleBtn.classList.remove("from-red-400", "to-red-600");
      cutToggleBtn.classList.add("from-green-400", "to-green-600");
    }

    // Save cut mode to localStorage
    localStorage.setItem('randomizeCutMode', JSON.stringify(cutMode));

    updateTextList();
    updateModeIndicator();
  }

  /**
   * Enables or disables UI buttons during randomization
   * @param {boolean} disabled - Whether buttons should be disabled
   */
  function disableButtons(disabled) {
    randomizeBtn.disabled = disabled;
    cutToggle.disabled = disabled;
    numberInput.disabled = disabled;
  }

  /**
   * Updates the text list display
   */
  function updateTextList() {
    textList.innerHTML = "";

    if (texts.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.textContent = "No texts available";
      emptyMessage.className = "p-3 text-center text-gray-500 italic";
      textList.appendChild(emptyMessage);
      return;
    }

    texts.forEach((text) => {
      const div = document.createElement("div");
      div.textContent = text;
      div.className =
        "p-3 border-b border-gray-200/50 transition-all duration-200 rounded-md hover:bg-white/80 hover:translate-x-1";

      if (text === selectedText && !cutMode) {
        div.classList.add("text-blue-500", "font-bold");
      }

      textList.appendChild(div);
    });

    // Add special style to last item
    if (textList.lastChild) {
      textList.lastChild.classList.remove("border-b");
    }
  }

  /**
   * Sets up proper event handling for the history modal
   */
  function fixHistoryModal() {
    if (historyModal) {
      // Find the close button within the modal
      const closeBtn = historyModal.querySelector("button");
      if (closeBtn) {
        // Remove the onclick attribute to prevent conflicts
        closeBtn.removeAttribute("onclick");
        // Add an event listener instead
        closeBtn.addEventListener("click", toggleHistoryModal);
      }

      // Add event listener for clicking outside the modal
      historyModal.addEventListener("click", function (e) {
        if (e.target === historyModal) {
          toggleHistoryModal();
        }
      });

      // Add event listener to the clear history button if it exists
      const clearBtn = document.getElementById("clearHistoryBtn");
      if (clearBtn) {
        clearBtn.addEventListener("click", clearHistory);
      }
    }
  }

  /**
   * Toggles the history modal visibility
   */
  function toggleHistoryModal() {
    if (historyModal.classList.contains("hidden")) {
      historyModal.classList.remove("hidden");
      setTimeout(() => {
        historyModal.classList.add("opacity-100");
      }, 10);
    } else {
      historyModal.classList.remove("opacity-100");
      setTimeout(() => {
        historyModal.classList.add("hidden");
      }, 300);
    }
  }

  /**
   * Clears the selection history
   */
  function clearHistory() {
    history = [];
    updateHistoryList();
    localStorage.removeItem('randomizeHistory');
  }

  /**
   * Adds new text items to the collection
   */
  function addText() {
    const input = textInput.value.trim();

    // Clear previous error
    textInputError.textContent = "";

    if (!input) {
      textInputError.textContent = "Please enter some text";
      return;
    }

    // Split by line breaks and filter empty lines
    const newTexts = input
      .split("\n")
      .map((text) => text.trim())
      .filter((text) => text.length > 0);

    if (newTexts.length === 0) {
      textInputError.textContent = "Please enter valid text";
      return;
    }

    // Add to texts array
    texts = texts.concat(newTexts);

    // Save to localStorage
    localStorage.setItem('randomizeTexts', JSON.stringify(texts));

    // Update the text list
    updateTextList();

    // Clear the input
    textInput.value = "";

    // Show success message
    textInputError.textContent = `Added ${newTexts.length} new text item(s)`;
    textInputError.style.color = "#10b981"; // Green success color
  }

  /**
   * Saves the app title
   */
  function saveTitle() {
    const newTitle = titleInput.value.trim();

    if (newTitle) {
      appTitle.innerHTML = `${newTitle}</span>`;
      toggleSettingsModal(); // Close the settings modal after saving
    }
  }

  /**
   * Handles speed input and saves to localStorage
   */
  if (speedInput) {
    speedInput.value = speed;

    // Add event listener for speed input
    speedInput.addEventListener("input", function () {
      // Ensure the value is within acceptable range
      const inputValue = parseInt(this.value);
      if (inputValue < 200) {
        this.value = 200;
      } else if (inputValue > 15000) {
        this.value = 15000;
      }

      // Update the speed variable
      speed = parseInt(this.value);

      // Save to localStorage
      localStorage.setItem('randomizeSpeed', speed);
    });
  }
};
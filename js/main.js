window.onload = function () {
  // Initialize state variables from localStorage or set defaults
  let texts = JSON.parse(localStorage.getItem('randomizeTexts')) || [];
  let cutMode = JSON.parse(localStorage.getItem('randomizeCutMode')) || false;
  let selectedText = null;
  let speed = parseInt(localStorage.getItem('randomizeSpeed')) || 600;
  let history = JSON.parse(localStorage.getItem('randomizeHistory')) || [];

  // DOM element references
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

  numberInput.value = 1;

  if (speedInput) {
    speedInput.value = speed;
  }

  fixHistoryModal();

  // Add event listeners
  addTextBtn.addEventListener("click", addText);
  saveTitleBtn.addEventListener("click", saveTitle);
  randomizeBtn.addEventListener("click", randomizeMultiple);
  
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

  // Initialize UI
  updateTextList();
  updateModeIndicator();
  updateHistoryList();

  /**
   * Toggles the visibility of the settings modal with a smooth transition
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

  settingsModal.addEventListener("click", function (e) {
    if (e.target === settingsModal) {
      toggleSettingsModal();
    }
  });

  resetDataBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all data? This will clear all rewards and history.")) {
      localStorage.removeItem("randomizeTexts");
      localStorage.removeItem("randomizeCutMode");
      localStorage.removeItem("randomizeSpeed");
      localStorage.removeItem("randomizeHistory");
    
      texts = [];
      cutMode = false;
      selectedText = null;
      speed = 600;
      history = [];
      
      location.reload();
    }
  });

  /**
   * Updates the mode indicator text and styling based on the current cut mode
   */
  function updateModeIndicator() {
    modeIndicator.textContent = `Current Mode: ${cutMode ? "Remove" : "Keep"} texts after selection`;

    if (cutMode) {
      modeIndicator.classList.remove("bg-green-100/15", "text-green-700", "border-green-300/30");
      modeIndicator.classList.add("bg-red-100/15", "text-red-700", "border-red-300/30");
      cutToggle.classList.remove("from-green-400", "to-green-600");
      cutToggle.classList.add("from-red-400", "to-red-600");
    } else {
      modeIndicator.classList.remove("bg-red-100/15", "text-red-700", "border-red-300/30");
      modeIndicator.classList.add("bg-green-100/15", "text-green-700", "border-green-300/30");
      cutToggle.classList.remove("from-red-400", "to-red-600");
      cutToggle.classList.add("from-green-400", "to-green-600");
    }
  }

  /**
   * Randomizes and selects multiple texts based on user input count
   * Handles validation, animation, and updates the display
   */
  function randomizeMultiple() {
    const count = parseInt(numberInput.value);
    const inputRect = numberInput.getBoundingClientRect();
    const parentRect = numberInput.parentElement.getBoundingClientRect();

    numberError.style.position = "absolute";
    numberError.style.left = "0";
    numberError.style.top = "100%";
    numberError.style.width = "100%";
    numberError.style.textAlign = "left";
    numberError.textContent = "";

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

    disableButtons(true);

    let randomized = [];
    let availableTexts = [...texts];
    let removedTexts = [];

    textDisplay.innerHTML = "<div class='text-xl'>Randomizing...</div>";

    let shuffleCount = 0;
    const maxShuffles = 10;

    function shuffleText() {
      if (shuffleCount < maxShuffles) {
        textDisplay.innerHTML = "<div class='text-4xl font-bold'>" + availableTexts[Math.floor(Math.random() * availableTexts.length)] + "</div>";
        shuffleCount++;
        setTimeout(shuffleText, 100);
      } else {
        selectFinalItems();
      }
    }

    function selectFinalItems() {
      for (let j = 0; j < count; j++) {
        if (availableTexts.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableTexts.length);
          const text = availableTexts[randomIndex];
          randomized.push(text);
          availableTexts.splice(randomIndex, 1);

          if (cutMode) {
            const indexToRemove = texts.indexOf(text);
            if (indexToRemove !== -1) {
              removedTexts.push(text);
              texts.splice(indexToRemove, 1);
            }
          }
        }
      }

      showFinalResults(randomized);

      const timestamp = new Date().toLocaleTimeString();
      history.push({
        type: count === 1 ? "single" : "multiple",
        items: randomized,
        timestamp: timestamp,
        cutMode: cutMode,
        removedTexts: cutMode ? removedTexts : [],
      });

      localStorage.setItem('randomizeTexts', JSON.stringify(texts));
      localStorage.setItem('randomizeHistory', JSON.stringify(history));

      updateHistoryList();
      updateTextList();
      disableButtons(false);
    }

    shuffleText();
  }

  /**
   * Displays the final randomized results in a formatted way
   * @param {Array} results - Array of selected texts to display
   */
  function showFinalResults(results) {
    textDisplay.innerHTML = "";

    const header = document.createElement("div");
    header.className = "text-2xl font-bold mb-4 text-indigo-600";
    header.textContent = results.length > 1 ? "Final Results:" : "Result:";
    textDisplay.appendChild(header);

    const resultContainer = document.createElement("div");
    resultContainer.className = "flex flex-col items-center space-y-2 w-full";

    results.forEach((text, index) => {
      const resultItem = document.createElement("div");
      resultItem.className = "text-3xl font-bold p-3 bg-white/80 w-full text-center rounded-lg shadow-sm";
      resultItem.textContent = text;
      resultContainer.appendChild(resultItem);
    });

    textDisplay.appendChild(resultContainer);
  }

  /**
   * Updates the history list display with all previous randomizations
   */
  function updateHistoryList() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    historyList.innerHTML = "";

    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      const div = document.createElement("div");

      if (item.type === "single") {
        div.innerHTML = `
          <span class="text-purple-500 font-medium">${item.timestamp}</span>: 
          <span class="font-semibold">${item.items[0]}</span>
          ${item.cutMode ? `<span class="text-red-500 text-xs ml-2">[CUT MODE]</span>` : ""}
          ${item.cutMode && item.removedTexts.length > 0 ? `<div class="text-xs text-gray-500 ml-4">Removed: ${item.removedTexts.join(", ")}</div>` : ""}
        `;
      } else {
        div.innerHTML = `
          <span class="text-purple-500 font-medium">${item.timestamp}</span>: 
          Multiple selection - <span class="font-semibold">${item.items.join(", ")}</span>
          ${item.cutMode ? `<span class="text-red-500 text-xs ml-2">[CUT MODE]</span>` : ""}
          ${item.cutMode && item.removedTexts.length > 0 ? `<div class="text-xs text-gray-500 ml-4">Removed: ${item.removedTexts.join(", ")}</div>` : ""}
        `;
      }

      div.className = "p-3 border-b border-gray-200/50 transition-all duration-200 rounded-md hover:bg-white/80";
      historyList.appendChild(div);
    }

    if (history.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.textContent = "No selection history yet";
      emptyMessage.className = "p-3 text-center text-gray-500 italic";
      historyList.appendChild(emptyMessage);
    }

    localStorage.setItem('randomizeHistory', JSON.stringify(history));
  }

  /**
   * Downloads the randomization history as a CSV file
   */
  function downloadHistory() {
    if (history.length === 0) {
      alert("No history to download");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Time,Type,Selection,Cut Mode\n";

    history.forEach((item) => {
      const timestamp = item.timestamp;
      const type = item.type;
      const selections = item.items.join("|").replace(/,/g, ";");
      const cutModeValue = item.cutMode ? "Yes" : "No";

      csvContent += `${timestamp},${type},"${selections}",${cutModeValue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `randomizer_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Toggles the cut mode between removing and keeping texts after selection
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

    localStorage.setItem('randomizeCutMode', JSON.stringify(cutMode));
    updateTextList();
    updateModeIndicator();
  }

  /**
   * Enables or disables buttons during randomization process
   * @param {boolean} disabled - Whether to disable or enable the buttons
   */
  function disableButtons(disabled) {
    randomizeBtn.disabled = disabled;
    cutToggle.disabled = disabled;
    numberInput.disabled = disabled;
  }

  /**
   * Updates the text list display with all available texts
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
      div.className = "p-3 border-b border-gray-200/50 transition-all duration-200 rounded-md hover:bg-white/80 hover:translate-x-1";

      if (text === selectedText && !cutMode) {
        div.classList.add("text-blue-500", "font-bold");
      }

      textList.appendChild(div);
    });

    if (textList.lastChild) {
      textList.lastChild.classList.remove("border-b");
    }
  }

  /**
   * Fixes the history modal by adding proper event listeners
   */
  function fixHistoryModal() {
    if (historyModal) {
      const closeBtn = historyModal.querySelector("button");
      if (closeBtn) {
        closeBtn.removeAttribute("onclick");
        closeBtn.addEventListener("click", toggleHistoryModal);
      }

      historyModal.addEventListener("click", function (e) {
        if (e.target === historyModal) {
          toggleHistoryModal();
        }
      });

      const clearBtn = document.getElementById("clearHistoryBtn");
      if (clearBtn) {
        clearBtn.addEventListener("click", clearHistory);
      }
    }
  }

  /**
   * Toggles the visibility of the history modal
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
   * Clears all history entries
   */
  function clearHistory() {
    history = [];
    updateHistoryList();
    localStorage.removeItem('randomizeHistory');
  }

  /**
   * Adds new text entries from the input field
   */
  function addText() {
    const input = textInput.value.trim();
    textInputError.textContent = "";

    if (!input) {
      textInputError.textContent = "Please enter some text";
      return;
    }

    const newTexts = input
      .split("\n")
      .map((text) => text.trim())
      .filter((text) => text.length > 0);

    if (newTexts.length === 0) {
      textInputError.textContent = "Please enter valid text";
      return;
    }

    texts = texts.concat(newTexts);
    localStorage.setItem('randomizeTexts', JSON.stringify(texts));
    updateTextList();
    textInput.value = "";
    textInputError.textContent = `Added ${newTexts.length} new text item(s)`;
    textInputError.style.color = "#10b981";
  }

  /**
   * Saves the custom title for the application
   */
  function saveTitle() {
    const newTitle = titleInput.value.trim();

    if (newTitle) {
      appTitle.innerHTML = `${newTitle}</span>`;
      toggleSettingsModal();
    }
  }

  if (speedInput) {
    speedInput.value = speed;

    speedInput.addEventListener("input", function () {
      const inputValue = parseInt(this.value);
      if (inputValue < 200) {
        this.value = 200;
      } else if (inputValue > 15000) {
        this.value = 15000;
      }

      speed = parseInt(this.value);
      localStorage.setItem('randomizeSpeed', speed);
    });
  }
};
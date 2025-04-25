// State management - Stores all application state and handles localStorage
const state = {
  texts: JSON.parse(localStorage.getItem('randomizeTexts')) || [],
  cutMode: JSON.parse(localStorage.getItem('randomizeCutMode')) || false,
  selectedText: null,
  speed: parseInt(localStorage.getItem('randomizeSpeed')) || 600,
  history: JSON.parse(localStorage.getItem('randomizeHistory')) || []
};

// DOM Elements - Centralized reference to all HTML elements
const elements = {
  titleInput: document.getElementById("titleInput"),
  saveTitleBtn: document.getElementById("saveTitleBtn"),
  appTitle: document.getElementById("appTitle"),
  textInput: document.getElementById("textInput"),
  addTextBtn: document.getElementById("addTextBtn"),
  textInputError: document.getElementById("textInputError"),
  textDisplay: document.getElementById("textDisplay"),
  numberInput: document.getElementById("numberInput"),
  randomizeBtn: document.getElementById("randomizeBtn"),
  cutToggle: document.getElementById("cutToggle"),
  textList: document.getElementById("textList"),
  modeIndicator: document.getElementById("modeIndicator"),
  historyBtn: document.getElementById("historyBtn"),
  numberError: document.getElementById("numberError"),
  downloadHistoryBtn: document.getElementById("downloadHistoryBtn"),
  historyModal: document.getElementById("historyModal"),
  resetDataBtn: document.getElementById("resetDataBtn"),
  settingsToggle: document.getElementById("settingsToggle"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  speedInput: document.getElementById("speedInput"),
  speedSlider: document.getElementById("speedSlider"),
  speedValue: document.getElementById("speedValue"),
  howToUseBtn: document.getElementById("howToUseBtn"),
  howToUseModal: document.getElementById("howToUseModal"),
  closeHowToUseBtn: document.getElementById("closeHowToUseBtn")
};

// Constants - Configuration values used throughout the application
const CONSTANTS = {
  DEFAULT_SPEED: 600,
  MAX_SPEED: 15000,
  MIN_SPEED: 200,
  MAX_SHUFFLES: 10,
  SHUFFLE_INTERVAL: 100
};

// Initialize application - Sets up all necessary components
function init() {
  setupEventListeners();
  initializeUI();
  fixHistoryModal();
}

// Setup all event listeners - Binds all UI interactions
function setupEventListeners() {
  elements.addTextBtn.addEventListener("click", addText);
  elements.saveTitleBtn.addEventListener("click", saveTitle);
  elements.randomizeBtn.addEventListener("click", randomizeMultiple);
  document.addEventListener("keydown", handleKeyPress);
  elements.cutToggle.addEventListener("click", toggleCutMode);
  elements.historyBtn.addEventListener("click", toggleHistoryModal);
  elements.downloadHistoryBtn.addEventListener("click", downloadHistory);
  elements.settingsToggle.addEventListener("click", toggleSettingsModal);
  elements.closeSettingsBtn.addEventListener("click", toggleSettingsModal);
  elements.settingsModal.addEventListener("click", handleModalClick);
  elements.resetDataBtn.addEventListener("click", handleReset);

  // How to Use modal
  elements.howToUseBtn.addEventListener("click", () => {
    elements.howToUseModal.classList.remove("hidden");
  });

  elements.closeHowToUseBtn.addEventListener("click", () => {
    elements.howToUseModal.classList.add("hidden");
  });

  // Close modals when clicking outside
  elements.howToUseModal.addEventListener("click", (e) => {
    if (e.target === elements.howToUseModal) {
      elements.howToUseModal.classList.add("hidden");
    }
  });
}

// Initialize UI elements - Sets up initial UI state
function initializeUI() {
  elements.numberInput.value = 1;
  if (elements.speedInput) {
    elements.speedInput.value = state.speed;
    elements.speedInput.addEventListener("input", handleSpeedChange);
  }
  updateTextList();
  updateModeIndicator();
  updateHistoryList();
}

// Event handlers - Handle user interactions
function handleKeyPress(event) {
  if (event.code === "Space") {
    event.preventDefault();
    randomizeMultiple();
  }
}

function handleModalClick(e) {
  if (e.target === elements.settingsModal) {
    toggleSettingsModal();
  }
}

function handleSpeedChange() {
  const inputValue = parseInt(this.value);
  if (inputValue < CONSTANTS.MIN_SPEED) {
    this.value = CONSTANTS.MIN_SPEED;
  } else if (inputValue > CONSTANTS.MAX_SPEED) {
    this.value = CONSTANTS.MAX_SPEED;
  }
  state.speed = parseInt(this.value);
  localStorage.setItem('randomizeSpeed', state.speed);
}

function handleReset() {
  if (confirm("Are you sure you want to reset all data? This will clear all texts and history.")) {
    localStorage.removeItem("randomizeTexts");
    localStorage.removeItem("randomizeCutMode");
    localStorage.removeItem("randomizeSpeed");
    localStorage.removeItem("randomizeHistory");
    state.texts = [];
    state.cutMode = false;
    state.selectedText = null;
    state.speed = CONSTANTS.DEFAULT_SPEED;
    state.history = [];
    location.reload();
  }
}

// Modal management - Handles showing/hiding modals
function toggleSettingsModal() {
  if (elements.settingsModal.classList.contains("hidden")) {
    elements.settingsModal.classList.remove("hidden");
    setTimeout(() => elements.settingsModal.classList.add("opacity-100"), 10);
  } else {
    elements.settingsModal.classList.remove("opacity-100");
    setTimeout(() => elements.settingsModal.classList.add("hidden"), 300);
  }
}

function toggleHistoryModal() {
  if (elements.historyModal.classList.contains("hidden")) {
    elements.historyModal.classList.remove("hidden");
    setTimeout(() => elements.historyModal.classList.add("opacity-100"), 10);
  } else {
    elements.historyModal.classList.remove("opacity-100");
    setTimeout(() => elements.historyModal.classList.add("hidden"), 300);
  }
}

// Mode management - Handles cut mode functionality
function toggleCutMode() {
  state.cutMode = !state.cutMode;
  localStorage.setItem('randomizeCutMode', JSON.stringify(state.cutMode));
  updateModeIndicator();
  updateTextList();
}

function updateModeIndicator() {
  elements.modeIndicator.textContent = `Current Mode: ${state.cutMode ? "Remove" : "Keep"} texts after selection`;
  if (state.cutMode) {
    elements.modeIndicator.classList.remove("bg-green-100/15", "text-green-700", "border-green-300/30");
    elements.modeIndicator.classList.add("bg-red-100/15", "text-red-700", "border-red-300/30");
    elements.cutToggle.classList.remove("from-green-400", "to-green-600");
    elements.cutToggle.classList.add("from-red-400", "to-red-600");
  } else {
    elements.modeIndicator.classList.remove("bg-red-100/15", "text-red-700", "border-red-300/30");
    elements.modeIndicator.classList.add("bg-green-100/15", "text-green-700", "border-green-300/30");
    elements.cutToggle.classList.remove("from-red-400", "to-red-600");
    elements.cutToggle.classList.add("from-green-400", "to-green-600");
  }
}

// Text management - Handles adding and displaying texts
function addText() {
  const input = elements.textInput.value.trim();
  elements.textInputError.textContent = "";

  if (!input) {
    elements.textInputError.textContent = "Please enter some text";
    return;
  }

  const newTexts = input
    .split("\n")
    .map(text => text.trim())
    .filter(text => text.length > 0);

  if (newTexts.length === 0) {
    elements.textInputError.textContent = "Please enter valid text";
    return;
  }

  state.texts = state.texts.concat(newTexts);
  localStorage.setItem('randomizeTexts', JSON.stringify(state.texts));
  updateTextList();
  elements.textInput.value = "";
  elements.textInputError.textContent = `Added ${newTexts.length} new text item(s)`;
  elements.textInputError.style.color = "#10b981";
}

function updateTextList() {
  elements.textList.innerHTML = "";

  if (state.texts.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.textContent = "No texts available";
    emptyMessage.className = "p-3 text-center text-gray-500 italic";
    elements.textList.appendChild(emptyMessage);
    return;
  }

  state.texts.forEach(text => {
    const div = document.createElement("div");
    div.textContent = text;
    div.className = "p-3 border-b border-gray-200/50 transition-all duration-200 rounded-md hover:bg-white/80 hover:translate-x-1";

    if (text === state.selectedText && !state.cutMode) {
      div.classList.add("text-blue-500", "font-bold");
    }

    elements.textList.appendChild(div);
  });

  if (elements.textList.lastChild) {
    elements.textList.lastChild.classList.remove("border-b");
  }
}

// Randomization - Handles text randomization and display
function randomizeMultiple() {
  const count = parseInt(elements.numberInput.value);
  elements.numberError.textContent = "";

  if (isNaN(count) || count < 1) {
    elements.numberError.textContent = "Number must be greater than 0";
    return;
  }

  if (state.texts.length === 0) {
    elements.textDisplay.textContent = "No texts available!";
    return;
  }

  if (state.texts.length < count) {
    elements.numberError.textContent = "Number must be lower than all text combined.";
    return;
  }

  disableButtons(true);
  startRandomization(count);
}

function startRandomization(count) {
  let randomized = [];
  let availableTexts = [...state.texts];
  let removedTexts = [];
  let shuffleCount = 0;

  elements.textDisplay.innerHTML = "<div class='text-xl'>Randomizing...</div>";

  function shuffleText() {
    if (shuffleCount < CONSTANTS.MAX_SHUFFLES) {
      elements.textDisplay.innerHTML = `<div class='text-4xl font-bold'>${availableTexts[Math.floor(Math.random() * availableTexts.length)]}</div>`;
      shuffleCount++;
      setTimeout(shuffleText, CONSTANTS.SHUFFLE_INTERVAL);
    } else {
      selectFinalItems(count, availableTexts, randomized, removedTexts);
    }
  }

  shuffleText();
}

function selectFinalItems(count, availableTexts, randomized, removedTexts) {
  for (let i = 0; i < count; i++) {
    if (availableTexts.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableTexts.length);
      const text = availableTexts[randomIndex];
      randomized.push(text);
      availableTexts.splice(randomIndex, 1);

      if (state.cutMode) {
        const indexToRemove = state.texts.indexOf(text);
        if (indexToRemove !== -1) {
          removedTexts.push(text);
          state.texts.splice(indexToRemove, 1);
        }
      }
    }
  }

  showFinalResults(randomized);
  updateHistory(randomized, count, removedTexts);
  updateTextList();
  disableButtons(false);
}

function showFinalResults(results) {
  elements.textDisplay.innerHTML = "";
  const header = document.createElement("div");
  header.className = "text-2xl font-bold mb-4 text-indigo-600";
  header.textContent = results.length > 1 ? "Final Results:" : "Result:";
  elements.textDisplay.appendChild(header);

  const resultContainer = document.createElement("div");
  resultContainer.className = "flex flex-col items-center space-y-2 w-full";

  results.forEach(text => {
    const resultItem = document.createElement("div");
    resultItem.className = "text-3xl font-bold p-3 w-full text-center";
    resultItem.textContent = text;
    resultContainer.appendChild(resultItem);
  });

  elements.textDisplay.appendChild(resultContainer);
}

// History management - Handles history tracking and display
function updateHistory(randomized, count, removedTexts) {
  const timestamp = new Date().toLocaleTimeString();
  state.history.push({
    type: count === 1 ? "single" : "multiple",
    items: randomized,
    timestamp: timestamp,
    cutMode: state.cutMode,
    removedTexts: state.cutMode ? removedTexts : []
  });

  localStorage.setItem('randomizeTexts', JSON.stringify(state.texts));
  localStorage.setItem('randomizeHistory', JSON.stringify(state.history));
  updateHistoryList();
}

function clearHistory() {
  state.history = [];
  localStorage.removeItem('randomizeHistory');
  updateHistoryList();
}

function updateHistoryList() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  historyList.innerHTML = "";

  for (let i = state.history.length - 1; i >= 0; i--) {
    const item = state.history[i];
    const div = document.createElement("div");
    div.className = "p-3 border-b border-gray-200/50 transition-all duration-200 rounded-md hover:bg-white/80";

    if (item.type === "single") {
      div.innerHTML = `
        <span class="text-purple-500 font-medium">${item.timestamp}</span>: 
        <span class="font-semibold">${item.items[0]}</span>
        ${item.cutMode ? `<span class="text-red-500 text-xs ml-2">[CUT MODE]</span>` : ""}
        ${item.cutMode && item.removedTexts.length > 0 ? 
          `<div class="text-xs text-gray-500 ml-4">Removed: ${item.removedTexts.join(", ")}</div>` : ""}
      `;
    } else {
      div.innerHTML = `
        <span class="text-purple-500 font-medium">${item.timestamp}</span>: 
        Multiple selection - <span class="font-semibold">${item.items.join(", ")}</span>
        ${item.cutMode ? `<span class="text-red-500 text-xs ml-2">[CUT MODE]</span>` : ""}
        ${item.cutMode && item.removedTexts.length > 0 ? 
          `<div class="text-xs text-gray-500 ml-4">Removed: ${item.removedTexts.join(", ")}</div>` : ""}
      `;
    }

    historyList.appendChild(div);
  }

  if (state.history.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.textContent = "No selection history yet";
    emptyMessage.className = "p-3 text-center text-gray-500 italic";
    historyList.appendChild(emptyMessage);
  }
}

function downloadHistory() {
  if (state.history.length === 0) {
    alert("No history to download");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Time,Type,Selection,Cut Mode\n";

  state.history.forEach(item => {
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

// Utility functions - Helper functions for common operations
function disableButtons(disabled) {
  elements.randomizeBtn.disabled = disabled;
  elements.cutToggle.disabled = disabled;
  elements.numberInput.disabled = disabled;
}

function saveTitle() {
  const newTitle = elements.titleInput.value.trim();
  if (newTitle) {
    elements.appTitle.innerHTML = `${newTitle}</span>`;
    toggleSettingsModal();
  }
}

// Modal management - Handles showing/hiding modals
function fixHistoryModal() {
  if (elements.historyModal) {
    const closeBtn = elements.historyModal.querySelector("button");
    if (closeBtn) {
      closeBtn.removeAttribute("onclick");
      closeBtn.addEventListener("click", toggleHistoryModal);
    }

    elements.historyModal.addEventListener("click", function (e) {
      if (e.target === elements.historyModal) {
        toggleHistoryModal();
      }
    });

    const clearBtn = document.getElementById("clearHistoryBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", clearHistory);
    }
  }
}

// Initialize the application
window.onload = init;
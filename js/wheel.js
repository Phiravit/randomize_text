// Default rewards
const defaultRewards = [];

// State
let rewards =
  JSON.parse(localStorage.getItem("wheelRewards")) || defaultRewards;
let spinHistory = JSON.parse(localStorage.getItem("spinHistory")) || [];
let isSpinning = false;
let spinDuration = parseFloat(localStorage.getItem("spinDuration")) || 3;
let appTitle = localStorage.getItem("wheelTitle") || "Reward Wheel Spinner";
let cutMode = localStorage.getItem("wheelCutMode") === "true" || false;
// DOM Elements
const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spinBtn");
const resultDisplay = document.getElementById("resultDisplay");
const prizeText = document.getElementById("prizeText");
const totalWins = document.getElementById("totalWins");
const historyList = document.getElementById("historyList");
const settingsToggle = document.getElementById("settingsToggle");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const titleInput = document.getElementById("titleInput");
const saveTitleBtn = document.getElementById("saveTitleBtn");
const rewardsList = document.getElementById("rewardsList");
const newRewardName = document.getElementById("newRewardName");
const newRewardSize = document.getElementById("newRewardSize");
const addRewardBtn = document.getElementById("addRewardBtn");
const saveRewardsBtn = document.getElementById("saveRewardsBtn");
const spinDurationInput = document.getElementById("spinDurationInput");
const resetAllBtn = document.getElementById("resetAllBtn");
const downloadHistoryBtn = document.getElementById("downloadHistoryBtn");
const appTitleElement = document.getElementById("appTitle");
const rewardInputError = document.getElementById("rewardInputError");
const cutToggle = document.getElementById("cutToggle");
const bulkAddModal = document.getElementById("bulkAddModal");
const openBulkAddBtn = document.getElementById("openBulkAddBtn");
const closeBulkAddBtn = document.getElementById("closeBulkAddBtn");
const backToSettingsBtn = document.getElementById("backToSettingsBtn");
const bulkRewardsInput = document.getElementById("bulkRewardsInput");
const bulkRewardInputError = document.getElementById("bulkRewardInputError");
const bulkAddRewardsBtn = document.getElementById("bulkAddRewardsBtn");
const howToUseBtn = document.getElementById("howToUseBtn");
const howToUseModal = document.getElementById("howToUseModal");
const closeHowToUseBtn = document.getElementById("closeHowToUseBtn");

// Initialize
function init() {
  totalRotation = 0;
  updateAppTitle();
  drawWheel();
  updateHistoryList();
  updateTotalWins();
  loadSettings();
  updateModeIndicator();
  updateRemainingRewardsDisplay();
}

// Create wheel segments
function drawWheel() {
  wheel.innerHTML = "";
  const totalSize = rewards.reduce((sum, reward) => sum + reward.size, 0);

  // SVGs
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.style.width = "100%";
  svg.style.height = "100%";

  // Special case: only one reward left - draw full circle
  if (rewards.length === 1) {
    const reward = rewards[0];
    // Create a full circle for the single reward
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", "50");
    circle.setAttribute("fill", reward.color);
    svg.appendChild(circle);

    // Add text in the center
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "50");
    text.setAttribute("y", "50");
    text.setAttribute("fill", "white");
    text.setAttribute("font-size", "5"); // Slightly larger text for single reward
    text.setAttribute("font-weight", "bold");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("alignment-baseline", "middle");
    text.setAttribute("text-shadow", "0 0.2px 0.5px rgba(0,0,0,0.5)");
    text.textContent = reward.name;
    svg.appendChild(text);

    wheel.appendChild(svg);
    return;
  }

  // Original code for multiple rewards
  let startAngle = 0;
  rewards.forEach((reward, index) => {
    const angle = (reward.size / totalSize) * 360;
    const endAngle = startAngle + angle;

    // Calculate coordinates for the path
    const startRadians = ((startAngle - 90) * Math.PI) / 180;
    const endRadians = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 50 + 50 * Math.cos(startRadians);
    const y1 = 50 + 50 * Math.sin(startRadians);
    const x2 = 50 + 50 * Math.cos(endRadians);
    const y2 = 50 + 50 * Math.sin(endRadians);

    // Create path for the segment
    const path = document.createElementNS(svgNS, "path");
    const largeArcFlag = angle > 180 ? 1 : 0;

    // Move to center, line to first point, arc to second point, close path
    const d = `M 50,50 L ${x1},${y1} A 50,50 0 ${largeArcFlag},1 ${x2},${y2} Z`;
    path.setAttribute("d", d);
    path.setAttribute("fill", reward.color);

    svg.appendChild(path);

    // Add text
    const textRadians = ((startAngle + angle / 2 - 90) * Math.PI) / 180;
    const textX = 50 + 35 * Math.cos(textRadians);
    const textY = 50 + 35 * Math.sin(textRadians);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", textX);
    text.setAttribute("y", textY);
    text.setAttribute("fill", "white");
    text.setAttribute("font-size", "3.5");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("alignment-baseline", "middle");
    text.setAttribute(
      "transform",
      `rotate(${startAngle + angle / 2}, ${textX}, ${textY})`
    );
    text.setAttribute("text-shadow", "0 0.2px 0.5px rgba(0,0,0,0.5)");
    text.textContent = reward.name;

    svg.appendChild(text);

    startAngle = endAngle;
  });

  wheel.appendChild(svg);
}

// Adjust color brightness
function adjustColor(color, amount) {
  return (
    "#" +
    color
      .replace(/^#/, "")
      .replace(/../g, (color) =>
        (
          "0" +
          Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)
        ).substr(-2)
      )
  );
}
let totalRotation = 0;

function spinWheel() {
  if (isSpinning) return;

  isSpinning = true;
  spinBtn.disabled = true;
  cutToggle.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
  resultDisplay.classList.add("hidden");

  const totalSize = rewards.reduce((sum, reward) => sum + reward.size, 0);

  // Calculate new spin angle (between 2-5 full rotations + random position)
  const spinAngle = 720 + Math.floor(Math.random() * 360);

  // Add to total rotation
  totalRotation += spinAngle;

  // Apply the total rotation
  wheel.style.transition = `transform ${spinDuration}s cubic-bezier(0.17, 0.67, 0.83, 0.67)`;
  wheel.style.transform = `rotate(${totalRotation}deg)`;

  // Determine which segment will land at the pointer
  const finalAngle = totalRotation % 360;
  let rewardIndex = determineRewardIndex(finalAngle);

  setTimeout(() => {
    const selectedReward = rewards[rewardIndex];
    prizeText.textContent = selectedReward.name;
    resultDisplay.classList.remove("hidden");
    addToHistory(selectedReward);
    
    // Display the selected reward in the center of the screen
    const rewardDisplay = document.createElement("div");
    rewardDisplay.textContent = selectedReward.name;
    rewardDisplay.style.position = "fixed";
    rewardDisplay.style.top = "50%";
    rewardDisplay.style.left = "50%";
    rewardDisplay.style.transform = "translate(-50%, -50%)";
    rewardDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    rewardDisplay.style.color = "white";
    rewardDisplay.style.padding = "20px";
    rewardDisplay.style.borderRadius = "10px";
    rewardDisplay.style.zIndex = "1000";
    rewardDisplay.style.fontSize = "2em";
    document.body.appendChild(rewardDisplay);

    setTimeout(() => {
      document.body.removeChild(rewardDisplay);
    }, 3000);

    // Modify reward size if cut mode is enabled
    if (cutMode) {
      // Decrease the size by 1
      rewards[rewardIndex].size -= 1;

      // If size reaches 0, remove the reward
      if (rewards[rewardIndex].size <= 0) {
        rewards.splice(rewardIndex, 1);
      }

      // Save updated rewards to localStorage
      localStorage.setItem("wheelRewards", JSON.stringify(rewards));
      drawWheel();

      // Update the remaining rewards display
      updateRemainingRewardsDisplay();
      // Update rewards list in settings modal
      updateRewardsList();
    }

    isSpinning = false;
    spinBtn.disabled = false;
    cutToggle.classList.remove("opacity-50", "cursor-not-allowed", "pointer-events-none");
  }, spinDuration * 1000 + 100);
}

// Determine which reward index lands at the pointer
function determineRewardIndex(angle) {
  // If there's only one reward, always return index 0
  if (rewards.length === 1) {
    return 0;
  }

  const totalSize = rewards.reduce((sum, reward) => sum + reward.size, 0);
  const normalizedAngle = 360 - angle; // Reverse direction

  let accumulatedSize = 0;
  for (let i = 0; i < rewards.length; i++) {
    accumulatedSize += rewards[i].size;
    const currentAngle = (accumulatedSize / totalSize) * 360;
    if (normalizedAngle <= currentAngle) {
      return i;
    }
  }
  return 0;
}

// Add reward to history
function addToHistory(reward) {
  const timestamp = new Date().toLocaleString();
  spinHistory.unshift({ reward: reward.name, timestamp });

  // Limit history size
  if (spinHistory.length > 50) {
    spinHistory.pop();
  }

  // Save to localStorage
  localStorage.setItem("spinHistory", JSON.stringify(spinHistory));

  // Update UI
  updateHistoryList();
  updateTotalWins();
}

// Update history list in UI
function updateHistoryList() {
  historyList.innerHTML = "";

  if (spinHistory.length === 0) {
    historyList.innerHTML =
      '<div class="text-gray-500 text-center py-4">No spins yet</div>';
    return;
  }

  spinHistory.forEach((item, index) => {
    const historyItem = document.createElement("div");
    historyItem.className =
      "p-2 bg-white rounded-lg shadow-sm flex justify-between items-center";

    const rewardObj = rewards.find((r) => r.name === item.reward) || {
      name: item.reward,
      color: "#888888",
    };

    historyItem.innerHTML = `
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full" style="background-color: ${rewardObj.color}"></div>
            <span class="font-medium">${item.reward}</span>
          </div>
          <span class="text-xs text-gray-500">${item.timestamp}</span>
        `;

    historyList.appendChild(historyItem);
  });
}

// Update total wins counter
function updateTotalWins() {
  totalWins.textContent = `Total spins: ${spinHistory.length}`;
}

// Update app title
function updateAppTitle() {
  appTitleElement.innerHTML = `<span class="text-white">🎁</span> ${appTitle} <span class="text-white">🎁</span>`;
  document.title = appTitle;
}

// Load settings
function loadSettings() {
  titleInput.value = appTitle;
  spinDurationInput.value = spinDuration;
  updateRewardsList();
}

// Update rewards list in settings
function updateRewardsList() {
  rewardsList.innerHTML = "";

  rewards.forEach((reward, index) => {
    const rewardItem = document.createElement("div");
    rewardItem.className =
      "flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200";

    rewardItem.innerHTML = `
          <div class="w-6 h-6 rounded-full" style="background-color: ${reward.color}"></div>
          <span class="flex-grow">${reward.name}</span>
          <span class="text-sm text-gray-500">${reward.size}</span>
          <button class="delete-reward-btn p-1 text-red-500 hover:text-red-700" data-index="${index}">
            &times;
          </button>
        `;

    rewardsList.appendChild(rewardItem);
  });

  // Add event listeners to delete buttons
  document.querySelectorAll(".delete-reward-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = parseInt(this.dataset.index);
      rewards.splice(index, 1);
      updateRewardsList();
    });
  });
}

// Create a new function to update the remaining rewards display
function updateRemainingRewardsDisplay() {
  const remainingRewardsDisplay = document.getElementById(
    "remainingRewardsDisplay"
  );

  if (!remainingRewardsDisplay) return;

  remainingRewardsDisplay.innerHTML = "";

  // Create header
  const header = document.createElement("h3");
  header.className = "text-lg font-semibold mb-2 text-center";
  header.textContent = "Remaining Rewards";
  remainingRewardsDisplay.appendChild(header);

  // Create rewards list
  const rewardsList = document.createElement("div");
  rewardsList.className = "space-y-1 max-h-[300px] overflow-y-auto pr-2";

  rewards.forEach((reward) => {
    const rewardItem = document.createElement("div");
    rewardItem.className =
      "flex items-center justify-between p-2 bg-white/80 rounded-lg shadow-sm";

    rewardItem.innerHTML = `
        <span class="text-sm font-bold px-2 py-1 bg-gray-100 rounded-full">x${reward.size}</span>
        <div class="flex items-center gap-2">
         <div class="w-4 h-4 rounded-full" style="background-color: ${reward.color}"></div>
        <span class="font-medium">${reward.name}</span>
          
        </div>
      
        
      `;

    rewardsList.appendChild(rewardItem);
  });

  remainingRewardsDisplay.appendChild(rewardsList);
}

// Generate a random color
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Download history
function downloadHistory() {
  if (spinHistory.length === 0) {
    alert("No spin history to download.");
    return;
  }

  let csv = "Prize,Timestamp\n";
  spinHistory.forEach((item) => {
    csv += `"${item.reward}","${item.timestamp}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `wheel-spin-history-${new Date()
    .toLocaleDateString()
    .replace(/\//g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function updateModeIndicator() {
  const modeIndicator = document.getElementById("modeIndicator");
  if (!modeIndicator) return;

  modeIndicator.textContent = `Current Mode: ${
    cutMode ? "Remove" : "Keep"
  } rewards after selection`;

  if (cutMode) {
    modeIndicator.classList.remove(
      "bg-green-100",
      "text-green-700",
      "border-green-300"
    );
    modeIndicator.classList.add("bg-red-100", "text-red-700", "border-red-300");
    cutToggle.classList.remove("from-green-400", "to-green-600");
    cutToggle.classList.add("from-red-400", "to-red-600");
    cutToggle.textContent = "🔄 Cut Mode: ON";
  } else {
    modeIndicator.classList.remove(
      "bg-red-100",
      "text-red-700",
      "border-red-300"
    );
    modeIndicator.classList.add(
      "bg-green-100",
      "text-green-700",
      "border-green-300"
    );
    cutToggle.classList.remove("from-red-400", "to-red-600");
    cutToggle.classList.add("from-green-400", "to-green-600");
    cutToggle.textContent = "🔄 Cut Mode: OFF";
  }
}

// Event listeners
function setupEventListeners() {
  // Spin button
  spinBtn.addEventListener("click", spinWheel);
  // Spacebar key press
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      spinWheel();
    }
  });

  // Settings toggle
  settingsToggle.addEventListener("click", () => {
    updateRewardsList();
    settingsModal.classList.remove("hidden");
  });

  // Close settings
  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
  });

  // How to Use modal
  howToUseBtn.addEventListener("click", () => {
    howToUseModal.classList.remove("hidden");
  });

  closeHowToUseBtn.addEventListener("click", () => {
    howToUseModal.classList.add("hidden");
  });

  // Close modals when clicking outside
  howToUseModal.addEventListener("click", (e) => {
    if (e.target === howToUseModal) {
      howToUseModal.classList.add("hidden");
    }
  });

  // Save title
  saveTitleBtn.addEventListener("click", () => {
    appTitle = titleInput.value.trim() || "Reward Wheel Spinner";
    localStorage.setItem("wheelTitle", appTitle);
    updateAppTitle();
  });

  // Add reward
  addRewardBtn.addEventListener("click", () => {
    const name = newRewardName.value.trim();
    const size = parseInt(newRewardSize.value);

    if (!name) {
      rewardInputError.textContent = "Please enter a reward name";
      return;
    }

    if (isNaN(size) || size <= 0) {
      rewardInputError.textContent = "Size must be a positive number";
      return;
    }

    rewardInputError.textContent = "";
    rewards.push({
      name,
      size,
      color: getRandomColor(),
    });

    newRewardName.value = "";
    newRewardSize.value = "";
    updateRewardsList();
  });

  // Save rewards
  saveRewardsBtn.addEventListener("click", () => {
    if (rewards.length === 0) {
      rewardInputError.textContent = "You must have at least one reward";
      return;
    }
  
    localStorage.setItem("wheelRewards", JSON.stringify(rewards));
    drawWheel();
    updateRemainingRewardsDisplay(); // Add this line
    settingsModal.classList.add("hidden");
  });

  // Spin duration
  spinDurationInput.addEventListener("change", () => {
    const duration = parseFloat(spinDurationInput.value);
    if (!isNaN(duration) && duration >= 1 && duration <= 10) {
      spinDuration = duration;
      localStorage.setItem("spinDuration", spinDuration);
    }
  });

  // Reset all
  resetAllBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to reset all data? This will clear all rewards and history."
      )
    ) {
      localStorage.removeItem("wheelRewards");
      localStorage.removeItem("spinHistory");
      localStorage.removeItem("spinDuration");
      localStorage.removeItem("wheelTitle");
      localStorage.removeItem("wheelCutMode");

      rewards = [...defaultRewards];
      spinHistory = [];
      spinDuration = 3;
      appTitle = "Reward Wheel Spinner";
      cutMode = false;
      totalRotation = 0; // Reset totalRotation

      // init();
      location.reload(); // Reload the page to reflect changes
    }
  });

  // Download history
  downloadHistoryBtn.addEventListener("click", downloadHistory);

  // Close settings when clicking outside
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add("hidden");
    }
  });
  cutToggle.addEventListener("click", toggleCutMode);
}

// Open Bulk Add Modal
openBulkAddBtn.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
  bulkAddModal.classList.remove("hidden");
  bulkRewardsInput.focus();
});

// Close Bulk Add Modal
closeBulkAddBtn.addEventListener("click", () => {
  bulkAddModal.classList.add("hidden");
});

// Back to Main Menu (Settings) Button
backToSettingsBtn.addEventListener("click", () => {
  bulkAddModal.classList.add("hidden");
  settingsModal.classList.remove("hidden");
});

function addBulkRewards() {
  const bulkInput = bulkRewardsInput.value.trim();

  if (!bulkInput) {
    bulkRewardInputError.textContent = "Please enter rewards";
    return;
  }

  const lines = bulkInput.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    bulkRewardInputError.textContent = "Please enter valid rewards";
    return;
  }

  let addedCount = 0;

  lines.forEach((line) => {
    const parts = line.split(/,(?=[^,]*$)/);
    const name = parts[0].trim();
    const size = parts.length > 1 ? parseInt(parts[1].trim()) : 1;

    if (name) {
      rewards.push({
        name,
        size: isNaN(size) ? 1 : size,
        color: getRandomColor(),
      });
      addedCount++;
    }
  });

  // Save rewards to localStorage immediately
  localStorage.setItem("wheelRewards", JSON.stringify(rewards));

  // Update UI elements
  updateRewardsList();
  updateRemainingRewardsDisplay();
  drawWheel();

  bulkRewardInputError.textContent = `Added ${addedCount} new rewards`;

  // Clear the input after adding
  bulkRewardsInput.value = "";

  // Return to settings modal after showing success message
  setTimeout(() => {
    bulkAddModal.classList.add("hidden");
    settingsModal.classList.remove("hidden");
  }, 1500);
}
// Add event listener for the Bulk Add button
bulkAddRewardsBtn.addEventListener("click", () => {
  addBulkRewards();
  spinBtn.disabled = false; // Enable spin button after bulk add
});

// Close bulk add modal when clicking outside
bulkAddModal.addEventListener("click", (e) => {
  if (e.target === bulkAddModal) {
    bulkAddModal.classList.add("hidden");
  }
});

// Toggle Cut Mode function
function toggleCutMode() {
  cutMode = !cutMode;
  localStorage.setItem("wheelCutMode", cutMode);
  updateModeIndicator();
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  init();
  setupEventListeners();
});
// Default rewards
const defaultRewards = [];

// State
let rewards =
  JSON.parse(localStorage.getItem("wheelRewards")) || defaultRewards;
let spinHistory = JSON.parse(localStorage.getItem("spinHistory")) || [];
let isSpinning = false;
let spinDuration = parseFloat(localStorage.getItem("spinDuration")) || 3;
let appTitle = localStorage.getItem("wheelTitle") || "Reward Wheel Spinner";

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

// Initialize
function init() {
  totalRotation = 0; 
  updateAppTitle();
  drawWheel();
  updateHistoryList();
  updateTotalWins();
  loadSettings();
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
    isSpinning = false;
    spinBtn.disabled = false;
  }, spinDuration * 1000 + 100);
}

// Determine which reward index lands at the pointer
function determineRewardIndex(angle) {
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

// Event listeners
function setupEventListeners() {
  // Spin button
  spinBtn.addEventListener("click", spinWheel);

  // Settings toggle
  settingsToggle.addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
  });

  // Close settings
  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
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
  
      rewards = [...defaultRewards];
      spinHistory = [];
      spinDuration = 5;
      appTitle = "Reward Wheel Spinner";
      totalRotation = 0; // Reset totalRotation
  
      init();
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
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  init();
  setupEventListeners();
});

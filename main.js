window.onload = function () {
  // State variables
  let texts = ["test	1	",
"test	2	",
"test	3	",
"test	4	",
"test	5	",]
  let cutMode = false;
  let selectedText = null;
  let speed = 600; // Animation speed
  let history = []; // History array to track selections

  // DOM elements
  const textDisplay = document.getElementById("textDisplay");
  const numberInput = document.getElementById("numberInput");
  const randomizeBtn = document.getElementById("randomizeBtn");
  const cutToggle = document.getElementById("cutToggle");
  const dropZone = document.getElementById("dropZone");
  const textList = document.getElementById("textList");
  const modeIndicator = document.getElementById("modeIndicator");
  const historyBtn = document.getElementById("historyBtn");
  const numberError = document.getElementById("numberError");
  const downloadHistoryBtn = document.getElementById("downloadHistoryBtn");
  
  // Settings modal elements
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const speedSlider = document.getElementById("speedSlider");
  const speedValue = document.getElementById("speedValue");

  // Set default number input value to 1
  numberInput.value = 1;

  // Initialize animation speed from slider or set default
  if (speedSlider) {
    speedSlider.value = speed;
    speedValue.textContent = `${speed}ms`;
    
    // Add event listener for speed slider
    speedSlider.addEventListener("input", function() {
      speed = parseInt(this.value);
      speedValue.textContent = `${speed}ms`;
    });
  }

  // Create history modal
  createHistoryModal();

  // Event listeners
  randomizeBtn.addEventListener("click", randomizeMultiple);
  cutToggle.addEventListener("click", toggleCutMode);
  historyBtn.addEventListener("click", toggleHistoryModal);
  downloadHistoryBtn.addEventListener("click", downloadHistory);
  
  // Settings modal event listeners
  settingsToggle.addEventListener("click", toggleSettingsModal);
  closeSettingsBtn.addEventListener("click", toggleSettingsModal);

  // Initialize text list on page load
  updateTextList();

  // Function to toggle settings modal
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
  settingsModal.addEventListener("click", function(e) {
    if (e.target === settingsModal) {
      toggleSettingsModal();
    }
  });

  function updateModeIndicator() {
    modeIndicator.textContent = `Current Mode: ${
      cutMode ? "Remove" : "Keep"
    } texts after selection`;

    if (cutMode) {
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
    let availableTexts = [...texts]; // Make a copy to ensure no duplicates
    let i = 0;
    let removedTexts = []; // Track removed texts if in cut mode

    // Clear the display at the start
    textDisplay.innerHTML = "<div class='text-xl'>Randomizing...</div>";

    // Different animation approaches based on count
    if (count <= 5) {
      // For 5 or fewer items, simply shuffle text for 2 seconds then show all results
      let shuffleCount = 0;
      const maxShuffles = 10; // Number of text changes before final selection
      
      function shuffleText() {
        if (shuffleCount < maxShuffles) {
          // Show a random text from the available pool
          textDisplay.innerHTML = "<div class='text-4xl font-bold'>" + 
            availableTexts[Math.floor(Math.random() * availableTexts.length)] + 
            "</div>";
          
          shuffleCount++;
          setTimeout(shuffleText, 200); // Change text every 200ms
        } else {
          // After 2 seconds of shuffling, select the final items
          selectFinalItems();
        }
      }
      
      function selectFinalItems() {
        // Select the required number of random items
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
        
        // Show all results at once
        showFinalResults(randomized);
        
        // Add to history
        const timestamp = new Date().toLocaleTimeString();
        history.push({
          type: count === 1 ? "single" : "multiple",
          items: randomized,
          timestamp: timestamp,
          cutMode: cutMode,
          removedTexts: cutMode ? removedTexts : []
        });
        
        updateHistoryList();
        updateTextList();
        disableButtons(false);
      }
      
      // Start the shuffling animation
      shuffleText();
      
    } else {
      // For more than 5 items, select and show one at a time
      function randomizeNext() {
        if (i < count && availableTexts.length > 0) {
          // Clear the display for each new selection
          textDisplay.innerHTML = "<div class='text-xl'>Randomizing...</div>";
          
          // Shuffle text for a short time
          let shuffleCount = 0;
          const maxShuffles = 5; // Fewer shuffles for each item
          
          function shuffleText() {
            if (shuffleCount < maxShuffles) {
              // Show a random text
              textDisplay.innerHTML = "<div class='text-4xl font-bold'>" + 
                availableTexts[Math.floor(Math.random() * availableTexts.length)] + 
                "</div>";
              
              shuffleCount++;
              setTimeout(shuffleText, 200);
            } else {
              // Select this item
              const randomIndex = Math.floor(Math.random() * availableTexts.length);
              const text = availableTexts[randomIndex];
              randomized.push(text);
              
              // Show the selected item
              const selectionContainer = document.createElement("div");
              selectionContainer.className = "selection-container mb-2";
              
              const selectedTextElement = document.createElement("div");
              selectedTextElement.textContent = text;
              selectedTextElement.className = "text-4xl font-bold selected-text";
              
              selectionContainer.appendChild(selectedTextElement);
              textDisplay.innerHTML = '';
              textDisplay.appendChild(selectionContainer);
              
              // Show which number we're on
              const counterDiv = document.createElement("div");
              counterDiv.className = "text-sm text-gray-500 mt-2";
              counterDiv.textContent = `Selection ${i+1} of ${count}`;
              textDisplay.appendChild(counterDiv);
              
              // Remove the text from available options
              availableTexts.splice(randomIndex, 1);
              
              if (cutMode) {
                const indexToRemove = texts.indexOf(text);
                if (indexToRemove !== -1) {
                  removedTexts.push(text);
                  texts.splice(indexToRemove, 1);
                }
              }
              
              // Move to next selection after a delay
              i++;
              if (i < count) {
                setTimeout(randomizeNext, speed);
              } else {
                // All selections complete - show final results
                setTimeout(() => {
                  showFinalResults(randomized);
                  
                  // Add to history
                  const timestamp = new Date().toLocaleTimeString();
                  history.push({
                    type: count === 1 ? "single" : "multiple",
                    items: randomized,
                    timestamp: timestamp,
                    cutMode: cutMode,
                    removedTexts: cutMode ? removedTexts : []
                  });
                  
                  updateHistoryList();
                  updateTextList();
                  disableButtons(false);
                }, speed);
              }
            }
          }
          
          // Start shuffling for this item
          shuffleText();
        }
      }
      
      // Start the randomization process
      randomizeNext();
    }
  }
  
  function showFinalResults(results) {
    // Create a new results display
    textDisplay.innerHTML = '';
    
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
      resultItem.className = "text-3xl font-bold p-3 bg-white/80 w-full text-center rounded-lg shadow-sm";
      resultItem.textContent = text;
      resultContainer.appendChild(resultItem);
    });
    
    textDisplay.appendChild(resultContainer);
  }

  function updateHistoryList() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    // Add history items in reverse order (newest first)
    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      const div = document.createElement("div");

      if (item.type === "single") {
        div.innerHTML = `
          <span class="text-purple-500 font-medium">${item.timestamp}</span>: 
          <span class="font-semibold">${item.items[0]}</span>
          ${item.cutMode ? `<span class="text-red-500 text-xs ml-2">[CUT MODE]</span>` : ''}
          ${item.cutMode && item.removedTexts.length > 0 ? 
            `<div class="text-xs text-gray-500 ml-4">Removed: ${item.removedTexts.join(', ')}</div>` : ''}
        `;
      } else {
        div.innerHTML = `
          <span class="text-purple-500 font-medium">${item.timestamp}</span>: 
          Multiple selection - <span class="font-semibold">${item.items.join(", ")}</span>
          ${item.cutMode ? `<span class="text-red-500 text-xs ml-2">[CUT MODE]</span>` : ''}
          ${item.cutMode && item.removedTexts.length > 0 ? 
            `<div class="text-xs text-gray-500 ml-4">Removed: ${item.removedTexts.join(', ')}</div>` : ''}
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
  }

  // Download history as CSV
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
    history.forEach(item => {
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
    link.setAttribute("download", `randomizer_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  }

  // Mode toggle
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
    
    updateTextList();
    updateModeIndicator();
  }
  
  function disableButtons(disabled) {
    randomizeBtn.disabled = disabled;
    cutToggle.disabled = disabled;
    numberInput.disabled = disabled;
  }

  // updates text list
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

  // Create history modal
  function createHistoryModal() {
    // Create modal container
    const modalContainer = document.createElement("div");
    modalContainer.className =
      "fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden transition-opacity duration-300";
    modalContainer.id = "historyModal";

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.className =
      "bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl";

    // Create modal header
    const modalHeader = document.createElement("div");
    modalHeader.className = "p-4 border-b flex justify-between items-center";

    const modalTitle = document.createElement("h3");
    modalTitle.className = "text-xl font-bold";
    modalTitle.textContent = "📝 Selection History";

    const closeButton = document.createElement("button");
    closeButton.className = "text-gray-500 hover:text-gray-700 text-xl";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = toggleHistoryModal;

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    // Create modal body
    const modalBody = document.createElement("div");
    modalBody.className = "p-4 flex-grow overflow-y-auto";

    const historyList = document.createElement("div");
    historyList.id = "historyList";
    historyList.className = "space-y-2";

    modalBody.appendChild(historyList);

    // Create modal footer
    const modalFooter = document.createElement("div");
    modalFooter.className = "p-4 border-t";

    const clearHistoryBtn = document.createElement("button");
    clearHistoryBtn.className =
      "p-3 text-sm font-semibold border-none rounded-lg transition-all duration-300 shadow bg-gradient-to-br from-gray-400 to-gray-600 text-white uppercase tracking-wide flex items-center justify-center gap-2 h-12 hover:translate-y-[-2px] hover:shadow-md active:translate-y-[1px] active:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed w-full";
    clearHistoryBtn.textContent = "🗑️ Clear History";
    clearHistoryBtn.onclick = clearHistory;

    modalFooter.appendChild(clearHistoryBtn);

    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalContainer.appendChild(modalContent);

    // Add modal to document
    document.body.appendChild(modalContainer);

    // Close modal when clicking outside
    modalContainer.addEventListener("click", function (e) {
      if (e.target === modalContainer) {
        toggleHistoryModal();
      }
    });
  }

  // Toggle history modal
  function toggleHistoryModal() {
    const modal = document.getElementById("historyModal");
    if (modal.classList.contains("hidden")) {
      modal.classList.remove("hidden");
      setTimeout(() => {
        modal.classList.add("opacity-100");
      }, 10);
    } else {
      modal.classList.remove("opacity-100");
      setTimeout(() => {
        modal.classList.add("hidden");
      }, 300);
    }
  }

  // Clear history
  function clearHistory() {
    history = [];
    updateHistoryList();
  }
};
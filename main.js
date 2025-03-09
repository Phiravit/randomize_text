window.onload = function () {
  // State variables
  let texts = ["test	1	",
"test	2	",
"test	3	",
"test	4	",
"test	5	",]
  let cutMode = false;
  let selectedText = null;
  let speed = 600; // Increased for better visibility
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
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsMenu = document.getElementById("settingsMenu");
  const numberError = document.getElementById("numberError");
  const dropZoneError = document.getElementById("dropZoneError");

  // Set default number input value to 1
  numberInput.value = 1;

  // Create history modal
  createHistoryModal();

  // Event listeners
  randomizeBtn.addEventListener("click", randomizeMultiple);
  cutToggle.addEventListener("click", toggleCutMode);
  historyBtn.addEventListener("click", toggleHistoryModal);
  settingsToggle.addEventListener("click", toggleSettingsMenu);

  // Initialize text list on page load
  updateTextList();

  // Close settings menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!settingsMenu.contains(event.target) && 
        !settingsToggle.contains(event.target) && 
        settingsMenu.classList.contains('hidden') === false) {
      toggleSettingsMenu();
    }
  });

  function toggleSettingsMenu() {
    settingsMenu.classList.toggle('hidden');
  }

  // Set up drag and drop for texts
  setupDropZone(dropZone, handleTextsFileLoad, dropZoneError);

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

    function createRandomizationEffect() {
      // Create a container for the randomization effect
      const effectContainer = document.createElement("div");
      effectContainer.className = "flex items-center justify-center space-x-2 mb-4";
      
      // Create multiple text elements for the randomization effect
      for (let j = 0; j < 5; j++) {
        const textElement = document.createElement("div");
        textElement.className = "text-xl font-bold randomization-item";
        textElement.textContent = availableTexts[Math.floor(Math.random() * availableTexts.length)];
        effectContainer.appendChild(textElement);
      }
      
      textDisplay.innerHTML = ''; // Clear any previous content
      textDisplay.appendChild(effectContainer);
      
      return effectContainer;
    }
    
    function randomizeNext() {
      if (i < count && availableTexts.length > 0) {
        // Clear the entire textDisplay at the start of each new randomization
        textDisplay.innerHTML = '';
        
        // Create new randomization effect
        const effectContainer = createRandomizationEffect();
        
        // Select the final text
        const randomIndex = Math.floor(Math.random() * availableTexts.length);
        const text = availableTexts[randomIndex];
        randomized.push(text);
        
        // Animate the selection
        setTimeout(() => {
          // Clear the randomization effect completely
          textDisplay.innerHTML = '';
          
          // Only show the current item
          const selectionContainer = document.createElement("div");
          selectionContainer.className = "selection-container mb-2";
          
          const selectedTextElement = document.createElement("div");
          selectedTextElement.textContent = text;
          selectedTextElement.className = "text-4xl font-bold selected-text";
          
          selectionContainer.appendChild(selectedTextElement);
          textDisplay.appendChild(selectionContainer);
          
          // Show which number we're on (e.g., "Selection 1 of 5")
          const counterDiv = document.createElement("div");
          counterDiv.className = "text-sm text-gray-500 mt-2";
          counterDiv.textContent = `Selection ${i+1} of ${count}`;
          textDisplay.appendChild(counterDiv);
          
          // Remove the text from available options to prevent duplicates
          availableTexts.splice(randomIndex, 1);
          
          if (cutMode) {
            const indexToRemove = texts.indexOf(text);
            if (indexToRemove !== -1) {
              removedTexts.push(text);
              texts.splice(indexToRemove, 1);
            }
          }
        }, speed * 2);
        
        setTimeout(() => {
          i++;
          if (i < count) {
            setTimeout(randomizeNext, speed);
          } else {
            // All randomization complete - show final result
            setTimeout(() => {
              // Format final results
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
        }, speed * 3);
      }
    }

    // Start the randomization process
    randomizeNext();
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
  
  // Placeholder for drop zone handling function
  function setupDropZone(dropZone, callback, errorElement) {
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drop-zone-active');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drop-zone-active');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drop-zone-active');
    });
    
    // Also make it clickable
    dropZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        // Process file here
      };
      input.click();
    });
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
    
    // Add download button
    const downloadBtn = addDownloadButton(results);
    textDisplay.appendChild(downloadBtn);
  }
  
  // Placeholder for file handling function
  function handleTextsFileLoad(content) {
    try {
      const data = JSON.parse(content);
      if (data.texts && Array.isArray(data.texts)) {
        texts = data.texts;
        updateTextList();
        dropZoneError.textContent = '';
      } else {
        dropZoneError.textContent = 'Invalid JSON format';
      }
    } catch (e) {
      dropZoneError.textContent = 'Invalid JSON file';
    }
  }

  
  function addDownloadButton(results) {
    // Create download button
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "mt-4 p-3 text-sm font-semibold border-none rounded-lg transition-all duration-300 shadow bg-gradient-to-br from-green-500 to-green-700 text-white uppercase tracking-wide flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-md active:translate-y-[1px] active:shadow-sm";
    downloadBtn.innerHTML = "📥 Download Results as CSV";
    
    // Add click event to generate and download CSV
    downloadBtn.addEventListener("click", function() {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add header row
      csvContent += "Selection Order,Item\n";
      
      // Add each result
      results.forEach((item, index) => {
        csvContent += `${index + 1},${item.replace(/,/g, ";")}\n`;
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `randomized_results_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
    });
    
    return downloadBtn;
  }
};
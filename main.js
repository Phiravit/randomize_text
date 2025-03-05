window.onload = function () {
    // State variables
    let texts = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
    let cutMode = false;
    let selectedText = null;
    let speed = 80;
    let history = []; // History array to track selections
  
    // DOM elements
    const textDisplay = document.getElementById("textDisplay");
    const numberInput = document.getElementById("numberInput");
    const randomizeBtn = document.getElementById("randomizeBtn");
    const cutToggle = document.getElementById("cutToggle");
    const dropZone = document.getElementById("dropZone");
    const textList = document.getElementById("textList");
    const modeIndicator = document.getElementById("modeIndicator");
    const addTextBtn = document.getElementById("addTextBtn");
    const textInput = document.getElementById("textInput");
    const textError = document.getElementById("textError");
    const historyBtn = document.getElementById("historyBtn");
  
    // Set default number input value to 1
    numberInput.value = 1;
  
    // Error message elements
    const numberError = document.getElementById("numberError");
    const dropZoneError = document.getElementById("dropZoneError");
  
    updateTextList();
    updateModeIndicator();
  
    // Create history modal
    createHistoryModal();
  
    // event listeners
    randomizeBtn.addEventListener("click", randomizeMultiple);
    cutToggle.addEventListener("click", toggleCutMode);
    addTextBtn.addEventListener("click", addText);
    historyBtn.addEventListener("click", toggleHistoryModal);
  
    // Set up drag and drop for texts
    setupDropZone(dropZone, handleTextsFileLoad, dropZoneError);
  
    function setupDropZone(dropZone, handler, errorElement) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drop-zone-active");
      });
  
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drop-zone-active");
      });
  
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drop-zone-active");
  
        const file = e.dataTransfer.files[0];
        if (!file) return;
  
        // Clear previous error messages
        errorElement.textContent = "";
  
        const reader = new FileReader();
        reader.onload = (e) => handler(e.target.result, errorElement);
        reader.readAsText(file);
      });
    }
  
    function handleTextsFileLoad(fileContent, errorElement) {
      try {
        const data = JSON.parse(fileContent);
  
        if (Array.isArray(data.texts)) {
          texts = data.texts;
          selectedText = null;
          updateTextList();
          textDisplay.textContent = "Texts loaded successfully!";
        } else {
          throw new Error("Invalid format");
        }
      } catch (error) {
        errorElement.textContent =
          'Invalid JSON format. Please use: {"texts": ["text1", "text2", ...]}';
      }
    }
  
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
  
      // Clear the display at the start
      textDisplay.innerHTML = "";
  
      function randomizeNext() {
        if (i < count && availableTexts.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableTexts.length);
          const text = availableTexts[randomIndex];
          randomized.push(text);
  
          // Create a new paragraph for each text
          const textElement = document.createElement("div");
          textElement.textContent = text;
          textElement.className =
            "py-1 text-center transform transition-all duration-300 opacity-0 scale-90";
          textDisplay.appendChild(textElement);
  
          // Trigger animation
          setTimeout(() => {
            textElement.classList.add("opacity-100", "scale-100");
            textElement.classList.add("text-item-selected");
          }, 10);
  
          // Remove the text from available options to prevent duplicates
          availableTexts.splice(randomIndex, 1);
  
          if (cutMode) {
            texts = texts.filter((t) => t !== text);
          }
  
          setTimeout(() => {
            i++;
            setTimeout(randomizeNext, 100);
          }, speed * 2);
        } else {
          // Add to history
          const timestamp = new Date().toLocaleTimeString();
          history.push({
            type: count === 1 ? "single" : "multiple",
            items: randomized,
            timestamp: timestamp
          });
          updateHistoryList();
          updateTextList();
          disableButtons(false);
        }
      }
  
      randomizeNext();
    }
  
    function disableButtons(disabled) {
      randomizeBtn.disabled = disabled;
      cutToggle.disabled = disabled;
      numberInput.disabled = disabled;
      addTextBtn.disabled = disabled;
      textInput.disabled = disabled;
    }
  
    // Add new text to array
    function addText() {
      const text = textInput.value.trim();
      textError.textContent = "";
  
      if (!text) {
        textError.textContent = "Please enter text to add";
        return;
      }
  
      texts.push(text);
      textInput.value = "";
      updateTextList();
      textDisplay.textContent = `Added: ${text}`;
    }
  
    // updates text list
    function updateTextList() {
      textList.innerHTML = "";
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
  
    // Update history list
    function updateHistoryList() {
      const historyList = document.getElementById("historyList");
      historyList.innerHTML = "";
  
      // Add history items in reverse order (newest first)
      for (let i = history.length - 1; i >= 0; i--) {
        const item = history[i];
        const div = document.createElement("div");
  
        if (item.type === "single") {
          div.innerHTML = `<span class="text-purple-500 font-medium">${item.timestamp}</span>: <span class="font-semibold">${item.items[0]}</span>`;
        } else {
          div.innerHTML = `<span class="text-purple-500 font-medium">${
            item.timestamp
          }</span>: Multiple selection - <span class="font-semibold">${item.items.join(
            ", "
          )}</span>`;
        }
  
        div.className =
          "p-3 border-b border-gray-200/50 transition-all duration-200 rounded-md hover:bg-white/80";
        historyList.appendChild(div);
      }
  
      // Add special style to last item
      if (historyList.lastChild) {
        historyList.lastChild.classList.remove("border-b");
      }
  
      // If no history, show message
      if (history.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.textContent = "No selection history yet";
        emptyMessage.className = "p-3 text-center text-gray-500 italic";
        historyList.appendChild(emptyMessage);
      }
    }
  
    // Clear history
    function clearHistory() {
      history = [];
      updateHistoryList();
    }
  
    // mode toggle
    function toggleCutMode() {
      cutMode = !cutMode;
  
      if (cutMode) {
        cutToggle.classList.remove("from-green-400", "to-green-600");
        cutToggle.classList.add("from-red-400", "to-red-600");
      } else {
        cutToggle.classList.remove("from-red-400", "to-red-600");
        cutToggle.classList.add("from-green-400", "to-green-600");
      }
  
      updateModeIndicator();
    }
  };
  
console.log("Popup script loaded");

function updatePopup() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error("Error querying tabs:", chrome.runtime.lastError);
      displayError("Error querying tabs: " + (chrome.runtime.lastError.message || "Unknown error"));
      return;
    }
    if (!tabs || tabs.length === 0) {
      console.error("No active tab found");
      displayError("No active tab found");
      return;
    }
    const activeTab = tabs[0];
    if (!activeTab.id) {
      console.error("Active tab has no id");
      displayError("Active tab has no id");
      return;
    }

    // Inject the content script if it's not already there
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error injecting script:", chrome.runtime.lastError);
        displayError("Error injecting script: " + (chrome.runtime.lastError.message || "Unknown error"));
        return;
      }

      // Now send the message
      chrome.tabs.sendMessage(activeTab.id, { action: "getScanResults" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          displayError("Error sending message: " + (chrome.runtime.lastError.message || "Unknown error"));
        } else if (response && response.success) {
          displayResult(response);
        } else {
          console.error("Failed to get scan results", response);
          displayError("Failed to get scan results: " + JSON.stringify(response));
        }
      });
    });
  });
}

function displayError(message) {
  const resultElement = document.getElementById('resultMessage');
  resultElement.textContent = "Error: " + message;
  resultElement.style.color = 'red';
}

function displayResult(response) {
  const resultElement = document.getElementById('resultMessage');
  const foundWordsElement = document.getElementById('foundWords');
  
  if (response.count > 0) {
    resultElement.textContent = `Found ${response.count} instances of potentially harmful content.`;
    foundWordsElement.textContent = `Words found: ${response.foundWords.join(', ')}`;
  } else {
    resultElement.textContent = "No harmful content detected.";
    foundWordsElement.textContent = "";
  }
}

// Run updatePopup when the popup is opened
document.addEventListener('DOMContentLoaded', updatePopup);

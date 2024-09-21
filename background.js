console.log("Background script loaded");

const GEMINI_API_KEY = 'AIzaSyCmri2a1UD23aFSjIIhqmQku6UsF0k_uc0';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

let flaggedWords = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyze_content") {
    analyzeContentWithGemini(request.text)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (request.action === "updateFlaggedWords") {
    for (const word of request.words) {
      flaggedWords[word] = (flaggedWords[word] || 0) + 1;
    }
    chrome.storage.local.set({ flaggedWords: flaggedWords }, function() {
      console.log('Flagged words updated');
    });
  } else if (request.action === "getFlaggedWords") {
    chrome.storage.local.get(['flaggedWords'], function(result) {
      sendResponse(result.flaggedWords || {});
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: 'dashboard.html' });
});

async function analyzeContentWithGemini(text) {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Analyze the following text for harmful content such as cyberbullying, hate speech, explicit material, discriminatory content, misinformation, self-harm content, extremist views, personal information exposure, drug-related content, or spam/scams. Respond with a JSON object containing 'isHarmful' (boolean), 'category' (string), and 'explanation' (string). Text: "${text}"`
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.candidates[0].content.parts[0].text);
  return result;
}

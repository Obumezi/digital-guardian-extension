console.log("Content script loaded");

(function() {
  const hateWords = [
    // Profanity
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'piss',
    
    // Sexual content
    'sex', 'porn', 'nude', 'naked', 'boobs', 'penis', 'vagina', 'masturbate',
    
    // Drugs and alcohol
    'weed', 'cocaine', 'heroin', 'meth', 'ecstasy', 'drunk', 'high',
    
    // Violence
    'kill', 'murder', 'shoot', 'stab', 'rape', 'assault',
    
    // Hate speech and discrimination
    'nigger', 'fag', 'retard', 'spic', 'kike', 'cunt', 'slut', 'whore',
    
    // Bullying terms
    'loser', 'stupid', 'ugly', 'fat', 'dumb', 'idiot',
    
    // Self-harm
    'suicide', 'cut', 'anorexia', 'bulimia',
    
    // Online predator terms
    'meetup', 'secret', 'don\'t tell', 'age', 'older'
  ];

  let scanResults = null;
  const SCAN_INTERVAL = 10000; // 10 seconds

  function analyzePageContent() {
    console.log("Analyzing page content");
    const textNodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      const parent = node.parentNode;
      if (parent.nodeType === Node.ELEMENT_NODE && !['SCRIPT', 'STYLE'].includes(parent.tagName)) {
        textNodes.push(node);
      }
    }

    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < textNodes.length; i += batchSize) {
      batches.push(textNodes.slice(i, i + batchSize));
    }

    return Promise.all(batches.map(analyzeBatch));
  }

  async function analyzeBatch(nodes) {
    const foundWords = [];
    nodes.forEach(node => {
      const text = node.textContent.toLowerCase();
      hateWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          foundWords.push(...matches);
          highlightWords(node, regex);
        }
      });
    });

    return { success: true, isHarmful: foundWords.length > 0, foundWords };
  }

  function highlightWords(node, regex) {
    const fragment = document.createDocumentFragment();
    const text = node.textContent;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const span = document.createElement('span');
      span.style.backgroundColor = 'yellow';
      span.style.color = 'red';
      span.textContent = match[0];
      fragment.appendChild(span);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.parentNode.replaceChild(fragment, node);
  }

  function updateScanResults(results) {
    const harmfulContent = results.filter(r => r.success && r.isHarmful);
    const foundWords = harmfulContent.flatMap(r => r.foundWords || []);
    const count = foundWords.length;
    scanResults = { success: true, count, foundWords };

    // Send the flagged words to the background script
    chrome.runtime.sendMessage({
      action: "updateFlaggedWords",
      words: foundWords
    });
  }

  function performScan() {
    analyzePageContent().then(results => {
      updateScanResults(results);
      console.log("Scan completed:", scanResults);
    });
  }

  // Run the initial scan
  performScan();

  // Set up periodic re-scan
  setInterval(performScan, SCAN_INTERVAL);

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getScanResults") {
      sendResponse(scanResults || { success: false, error: "Scan not completed" });
    }
    return true;
  });
})();

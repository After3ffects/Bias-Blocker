console.log("Content script loaded!");

const style = document.createElement('style');
style.textContent = `
.bias-highlight {
    background-color: yellow !important;
}
`;
(document.head || document.documentElement).appendChild(style);

setTimeout(function() {
    processPage();
}, 2000); // Wait 2 seconds (adjust as needed)

function extractArticleText() {
  let text = "";
  //Attempt to find article content by searching through possible tags.
  let article = document.querySelector('article');
  if (!article) {
      article = document.querySelector('main');
  }
  if (!article) {
      article = document.body;
  }

  if (article) {
      text = article.innerText;
  }

  //console.log("Extracted Content:", text.substring(0, 500) + "..."); // Show snippet
  return text;
}
  
  // Function to send the text to the background script
  function sendArticleText(text) {
    chrome.runtime.sendMessage({
      type: "articleText",
      text: text
    });
  }
  
  // Function to highlight biased phrases
  function highlightBias(analysisResult) {
    const mainContent = document.querySelector('article') || document.querySelector('main') || document.body;

    if (!mainContent) {
        console.warn("Could not find main content to highlight.");
        return;
    }

    // Split the analysis result into individual biased phrases
    const biasedPhrases = analysisResult.split('\n').filter(phrase => phrase.trim() !== '');

    // Get the HTML content of the main content element
    let htmlContent = mainContent.innerHTML;

    // Loop through each biased phrase and highlight it in the HTML content
    biasedPhrases.forEach(phrase => {
        // Trim the phrase to remove leading/trailing whitespace
        phrase = phrase.trim();

        // Create a regular expression to find the phrase in the HTML content
        if (phrase) {
            // Escape special characters for the regex
            const escapedPhrase = phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

            // Create a regular expression with a wider match for whitespace and punctuation
            const regex = new RegExp(`\\s*${escapedPhrase}\\s*[.,?!]*`, 'gi');

            // Replace the phrase with a highlighted version
            htmlContent = htmlContent.replace(regex, (match) => {
              return `<span style="background-color: red;">${match}</span>`; // CHANGED
          });
        }
    });

    // Update the HTML content of the main content element
    mainContent.innerHTML = htmlContent;
}
  
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("Content script: Message received", request); // ADDED
        if (request.type === "biasAnalysisResult") {
            const analysisResult = request.result;
            console.log("Content script: Received biasAnalysisResult", analysisResult);
            highlightBias(analysisResult);
            document.getElementById('status').textContent = 'Analysis Finished.'; // Changed
        } else if (request.type === "biasAnalysisError") {
            console.error("Content script: Error from background script:", request.error);
            alert("Bias analysis failed: " + request.error);
            document.getElementById('status').textContent = 'Analysis Failed.'; // Changed
        }
    }
);
  
  
  // Modified processPage function to only extract and send article text
  function processPage() {
    const articleText = extractArticleText();
    sendArticleText(articleText);
  }

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === "biasAnalysisResult") {
    const biasedDict = message.data;
    // Now you can use biasedDict in your content script
    console.log("Received bias analysis in content script:", biasedDict);
    
    highlightBiasedTerms(biasedDict);

    createTooltipElement();
  }
});

// Create tooltip element
function createTooltipElement() {
  // Remove existing tooltip if any
  const existingTooltip = document.getElementById('bias-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.id = 'bias-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    background-color: #333;
    color: white;
    padding: 10px;
    border-radius: 6px;
    font-size: 14px;
    max-width: 300px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    display: none;
    pointer-events: none;
    font-family: Arial, sans-serif;
    line-height: 1.4;
  `;
  document.body.appendChild(tooltip);
}

function highlightBiasedTerms(biasedDict) {
  // Get all text nodes in the document body
  const textNodes = getTextNodes(document.body);
  
  // Create a regular expression pattern of all the keys
  const biasedTerms = Object.keys(biasedDict);
  if (biasedTerms.length === 0) return;
  
  // Sort terms by length (longest first) to handle overlapping terms properly
  biasedTerms.sort((a, b) => b.length - a.length);
  
  // Escape special regex characters and join with OR
  const pattern = biasedTerms
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  
  const regex = new RegExp(`(${pattern})`, 'gi');
  
  // Process each text node
  textNodes.forEach(node => {
    const text = node.nodeValue;
    if (!regex.test(text)) return; // Skip if no matches
    
    // Reset regex lastIndex
    regex.lastIndex = 0;
    
    // Create a document fragment to hold the highlighted text
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    
    // Find all matches
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
      }
      
      // Create highlighted span for the match
      const span = document.createElement('span');
      span.className = 'bias-highlight';
      span.style.backgroundColor = '#ffff00'; // Yellow highlight
      span.style.color = '#000000';
      span.style.fontWeight = 'bold';
      span.style.cursor = 'pointer';
      
      // Store the biased term and its info as data attributes
      const term = match[0];
      const normalizedTerm = term.toLowerCase();
      const biasInfo = biasedDict[normalizedTerm] || biasedDict[term];
      
      span.dataset.biasTerm = term;
      span.dataset.biasInfo = typeof biasInfo === 'object' ? 
        JSON.stringify(biasInfo) : biasInfo.toString();
      
      // Add event listeners for showing/hiding the tooltip
      span.addEventListener('mouseover', showTooltip);
      span.addEventListener('mouseout', hideTooltip);
      span.addEventListener('mousemove', moveTooltip);
      
      span.appendChild(document.createTextNode(match[0]));
      fragment.appendChild(span);
      
      lastIndex = regex.lastIndex;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
    
    // Replace the original text node with our highlighted version
    node.parentNode.replaceChild(fragment, node);
  });
}

// Function to show tooltip
function showTooltip(event) {
  const tooltip = document.getElementById('bias-tooltip');
  if (!tooltip) return;
  
  let biasInfo = this.dataset.biasInfo;
  try {
    // Try to parse as JSON first
    const parsedInfo = JSON.parse(biasInfo);
    if (typeof parsedInfo === 'object') {
      if (parsedInfo.reason) {
        biasInfo = parsedInfo.reason;
      } else {
        // Format the object as HTML
        biasInfo = Object.entries(parsedInfo)
          .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
          .join('<br>');
      }
    }
  } catch (e) {
    // Not JSON, use as is
  }
  
  tooltip.innerHTML = `<strong>${this.dataset.biasTerm}</strong>: ${biasInfo}`;
  tooltip.style.display = 'block';
  
  moveTooltip.call(this, event);
}

// Function to hide tooltip
function hideTooltip() {
  const tooltip = document.getElementById('bias-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

// Function to move tooltip with cursor
function moveTooltip(event) {
  const tooltip = document.getElementById('bias-tooltip');
  if (!tooltip) return;
  
  // Position the tooltip slightly below and to the right of the cursor
  const x = event.pageX + 15;
  const y = event.pageY + 15;
  
  // Keep tooltip within viewport
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const windowWidth = window.innerWidth + window.pageXOffset;
  const windowHeight = window.innerHeight + window.pageYOffset;
  
  let tooltipX = x;
  let tooltipY = y;
  
  // Adjust horizontal position if needed
  if (x + tooltipWidth > windowWidth) {
    tooltipX = x - tooltipWidth - 10;
  }
  
  // Adjust vertical position if needed
  if (y + tooltipHeight > windowHeight) {
    tooltipY = y - tooltipHeight - 10;
  }
  
  tooltip.style.left = tooltipX + 'px';
  tooltip.style.top = tooltipY + 'px';
}

// Helper function to get all text nodes in an element
function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    { acceptNode: node => node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT },
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    // Exclude script and style elements
    const parentTagName = node.parentNode.tagName.toLowerCase();
    if (parentTagName !== 'script' && parentTagName !== 'style') {
      textNodes.push(node);
    }
  }
  
  return textNodes;
}
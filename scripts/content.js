console.log("Content script loaded!");

const style = document.createElement('style');
style.textContent = `
.bias-highlight {
    background-color: rgba(212, 36, 36, 0.2);
    border-bottom: 2px solid #D42424;
    position: relative;
    cursor: pointer;
    padding: 0 2px;
    border-radius: 2px;
    transition: background-color 0.2s ease;
}

.bias-highlight:hover {
    background-color: rgba(212, 36, 36, 0.3);
}

.bias-tooltip {
    visibility: hidden;
    background-color: #fff;
    color: #333;
    text-align: left;
    border-radius: 8px;
    padding: 12px;
    position: absolute;
    z-index: 1000;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    margin-left: 0;
    opacity: 0;
    transition: opacity 0.3s, visibility 0.3s;
    width: 280px;
    font-size: 14px;
    line-height: 1.4;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    border: 1px solid #eee;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.bias-tooltip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -8px;
    border-width: 8px;
    border-style: solid;
    border-color: #fff transparent transparent transparent;
}

.bias-tooltip-title {
    font-weight: bold;
    margin-bottom: 8px;
    color: #D42424;
    padding-bottom: 6px;
    border-bottom: 1px solid #eee;
}

.bias-highlight:hover .bias-tooltip {
    visibility: visible;
    opacity: 1;
}
`;
(document.head || document.documentElement).appendChild(style);

function processPage() {
    const text = extractArticleText();
    if (text) {
        sendArticleText(text);
    }
}

// Run after page loads
window.addEventListener('load', function() {
    setTimeout(function() {
        processPage();
    }, 2000); // Wait 2 seconds to allow page to fully load
});

function extractArticleText() {
    let text = "";
    // Attempt to find article content by searching through possible tags.
    let article = document.querySelector('article');
    if (!article) {
        article = document.querySelector('main');
    }
    if (!article) {
        article = document.querySelector('.article-content');
    }
    if (!article) {
        article = document.body;
    }

    if (article) {
        text = article.innerText;
    }

    console.log("Extracted Content:", text.substring(0, 500) + "..."); // Show snippet
    return text;
}

function sendArticleText(text) {
    chrome.runtime.sendMessage({
        type: "articleText",
        text: text
    });
}

function highlightBias(biasedTerms) {
    console.log("Highlighting bias with data:", biasedTerms);
    
    // If biasedTerms is empty or invalid, return
    if (!biasedTerms || Object.keys(biasedTerms).length === 0) {
        console.warn("No biased terms to highlight");
        return;
    }

    const mainContent = document.querySelector('article') || document.querySelector('main') || document.body;
    if (!mainContent) {
        console.warn("Could not find main content to highlight.");
        return;
    }

    // Create an array of biased terms
    const biasedPhrases = Object.keys(biasedTerms);
    
    // Function to highlight text
    function highlightText(node, phrase, reason) {
        const text = node.nodeValue;
        const escapedPhrase = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedPhrase})`, 'gi');
        
        if (!regex.test(text)) return false;
        
        const fragments = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        
        // Reset regex state
        regex.lastIndex = 0;
        
        while ((match = regex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                fragments.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            }
            
            // Create the highlighted span
            const highlightSpan = document.createElement('span');
            highlightSpan.className = 'bias-highlight';
            highlightSpan.textContent = match[0];
            
            // Add tooltip with improved structure
            const tooltip = document.createElement('span');
            tooltip.className = 'bias-tooltip';
            
            // Add title to tooltip
            const tooltipTitle = document.createElement('div');
            tooltipTitle.className = 'bias-tooltip-title';
            tooltipTitle.textContent = 'Potential Bias Detected';
            tooltip.appendChild(tooltipTitle);
            
            // Add explanation
            const tooltipContent = document.createElement('div');
            tooltipContent.textContent = reason;
            tooltip.appendChild(tooltipContent);
            
            highlightSpan.appendChild(tooltip);
            fragments.appendChild(highlightSpan);
            
            lastIndex = regex.lastIndex;
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            fragments.appendChild(document.createTextNode(text.substring(lastIndex)));
        }
        
        // Replace the original node with our fragment
        node.parentNode.replaceChild(fragments, node);
        return true;
    }
    
    // Process all text nodes recursively
    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Skip empty nodes or nodes in script/style tags
            if (!node.nodeValue.trim() || 
                isInScriptOrStyle(node)) {
                return;
            }
            
            // Try to highlight each biased phrase
            for (const phrase of biasedPhrases) {
                if (node.nodeValue.toLowerCase().includes(phrase.toLowerCase())) {
                    if (highlightText(node, phrase, biasedTerms[phrase])) {
                        // If we highlighted something, we need to stop processing this node
                        return;
                    }
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Skip certain elements
            if (shouldSkipNode(node)) {
                return;
            }
            
            // Process child nodes
            // Create a static copy of children to avoid live collection issues
            const children = Array.from(node.childNodes);
            children.forEach(child => processNode(child));
        }
    }
    
    function isInScriptOrStyle(node) {
        let parent = node.parentNode;
        while (parent) {
            if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                return true;
            }
            parent = parent.parentNode;
        }
        return false;
    }
    
    function shouldSkipNode(node) {
        const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG'];
        return skipTags.includes(node.tagName) || 
               node.classList.contains('bias-highlight');
    }
    
    // Start processing from the main content
    processNode(mainContent);
    console.log("Highlighting completed");
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("Content script: Message received", request);
        if (request.type === "biasAnalysisResult") {
            const biasResults = request.result;
            console.log("Content script: Received biasAnalysisResult", biasResults);
            highlightBias(biasResults);
            
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.textContent = 'Analysis Complete.';
            }
        } else if (request.type === "biasAnalysisError") {
            console.error("Content script: Error from background script:", request.error);
            alert("Bias analysis failed: " + request.error);
            
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.textContent = 'Analysis Failed.';
            }
        }
    }
);

// Add this listener to the bottom of content.js
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "getArticleText") {
            const text = extractArticleText();
            sendResponse({ text: text });
        }
        return true; // Keep the message channel open for asynchronous response
    }
);
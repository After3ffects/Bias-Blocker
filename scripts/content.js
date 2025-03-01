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

  console.log("Extracted Content:", text.substring(0, 500) + "..."); // Show snippet
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
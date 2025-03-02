// scripts/background.js
import { generateContent } from "./prompt.js";

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.type === "articleText") {
      const articleText = request.text;
      console.log("Received article text in background script:", articleText);

      const prompt = `Analyze the following news article for potential bias. Identify specific words and phrases that suggest bias. Return ONLY a javascript object format of these words as keys and then why they suggest bias as values to the keys, enclosed in curly brackets. For example: {"word1" : "why word1 suggests a bias", "phrase2" : "why phrase2 suggests a bias"} Do not include any other text or explanation.:\n\n${articleText}`;

      generateContent(prompt)
        .then(result => {
          try {
            // Try to extract JSON between curly braces
            let resultTrimmed = result.substring(result.indexOf('{'), result.lastIndexOf('}') + 1);
            console.log("Parsed bias result:", resultTrimmed);
            // Parse the JSON to verify it's valid
            let biasedDict = JSON.parse(resultTrimmed);
            
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              if (tabs && tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  type: "biasAnalysisResult",
                  result: biasedDict
                });
              }
            });
          } catch (error) {
            console.error("Error parsing bias analysis result:", error);
            sendResponse({ type: "biasAnalysisError", error: error.message });
          }
        })
        .catch(error => {
          console.error("Error analyzing bias with Gemini:", error);
          sendResponse({ type: "biasAnalysisError", error: error.message });
        });

      return true; // Required for asynchronous sendResponse
    }
  }
);
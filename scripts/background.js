import { generateContent } from "./prompt.js";


chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.type === "articleText") {
      const articleText = request.text;
      console.log("Received article text in background script:", articleText);
      
      const prompt = `Analyze the following news article for potential bias. Identify specific phrases or words that suggest bias and explain why they might be considered biased. Focus on loaded language, framing, and potential omissions. Provide a summary of the overall bias you detect in the article.:\n\n${articleText}`;
      
      generateContent(prompt).then(result => {
        console.log("Gemini analysis result:", result);
      })
      .catch(error => {
          console.error("Error analyzing bias with Gemini:", error);
          sendResponse({type: "biasAnalysisError", error: error.message});
      });

        return true; // Required for asynchronous sendResponse
    }
  }
);

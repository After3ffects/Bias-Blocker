import { generateContent } from "./prompt.js";



chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.type === "articleText") {
      const articleText = request.text;
      console.log("Received article text in background script:", articleText);
      
      const prompt = `Analyze the following news article for potential bias. Identify specific words and phrases that suggest bias. Return ONLY a javascript object format of these words as keys and then why they suggest bias as values to the keys, enclosed in curly brackets. For example: {"word1" : "why word1 suggests a bias", "phrase2" : "why phrase2 suggests a bias"} Do not include any other text or explanation.:\n\n${articleText}`
      
      generateContent(prompt).then(result => {
        //console.log("Gemini analysis result:", result);
        let resultTrimmed = result.substring(result.indexOf('{')-1, result.lastIndexOf('}')+1);
        console.log(resultTrimmed)
        let biasedDict = JSON.parse(resultTrimmed);
        console.log(biasedDict)

      })
      .catch(error => {
          console.error("Error analyzing bias with Gemini:", error);
          sendResponse({type: "biasAnalysisError", error: error.message});
      });

        return true; // Required for asynchronous sendResponse
    }
  }
);

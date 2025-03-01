const apiKey = "AIzaSyD0ZDzQgY5olkJc1fOLLC9X3BS6CewBj1E"; // Replace with your actual API key

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.type === "articleText") {
      const articleText = request.text;
      console.log("Received article text in background script:", articleText);

      analyzeBiasWithGemini(articleText)
    .then(analysisResult => {
        console.log("Gemini analysis result:", analysisResult);
        console.log("Background script: Sending biasAnalysisResult"); // ADDED
        sendResponse({type: "biasAnalysisResult", result: analysisResult});
    })
    .catch(error => {
        console.error("Error analyzing bias with Gemini:", error);
        console.log("Background script: Sending biasAnalysisError"); // ADDED
        sendResponse({type: "biasAnalysisError", error: error.message});
    });

      return true; // Required for asynchronous sendResponse
    }
  }
);


async function analyzeBiasWithGemini(text) {
  const prompt = `Analyze the following news article for potential bias. Identify specific phrases or words that suggest bias and explain why they might be considered biased. Focus on loaded language, framing, and potential omissions. Provide a summary of the overall bias you detect in the article.:\n\n${text}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const data = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (!json.candidates || json.candidates.length === 0 || !json.candidates[0].content || !json.candidates[0].content.parts || json.candidates[0].content.parts.length === 0) {
      throw new Error("Unexpected Gemini API response format: " + JSON.stringify(json));
    }

    return json.candidates[0].content.parts[0].text; // Extract the text from the response
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}
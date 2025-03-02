import { newsSourceData, newsSourceHostnames } from './newsSources.js';
import { generateContent } from './prompt.js';
import { getLeaningValue } from './politicalState.js';

// Function to extract article keywords using Gemini
async function extractArticleKeywords(articleText) {
  if (!articleText || articleText.trim() === "") {
    return "latest news"; // Fallback if no text is available
  }

  // Create a prompt for Gemini to extract the main topic
  const prompt = `Extract the main topic or subject of this news article in 3-5 words maximum. Return ONLY the topic with no additional text or explanation:\n\n${articleText.substring(0, 1000)}`;

  try {
    const response = await generateContent(prompt);
    // Clean up the response (remove quotes, etc.)
    const cleanedResponse = response.replace(/['"]/g, '').trim();
    console.log("Extracted keywords:", cleanedResponse);
    return cleanedResponse || "latest news"; // Fallback if empty response
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return "latest news"; // Fallback on error
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for the political leaning value
  const currentLeaning = Number(await getLeaningValue());
  console.log("currentLeaning in search.js:", currentLeaning);

  // Now that we have the currentLeaning, filter the news sources
  const unbiasedSources = newsSourceData
    .filter(source => {
      let targetLeaning;
      if (currentLeaning < 4) {
        // If left of center, look for one step more center
        targetLeaning = currentLeaning + 1;
      } else {
        // If right of center, look for one step more center
        targetLeaning = currentLeaning - 1;
      }
      return source["Political Leaning"] === targetLeaning;
    })
    .map(source => {
      const hostnameInfo = newsSourceHostnames.find(hostnameSource => hostnameSource.ID === source.ID);
      return hostnameInfo ? hostnameInfo.Hostname : null;
    })
    .filter(hostname => hostname !== null);

 // Build the domain filter now that unbiasedSources is computed
 const domainFilter = unbiasedSources
 .map(domain => `site:${domain}`)
 .join(' OR ');

console.log("Domain filter:", domainFilter);

const searchButton = document.getElementById('searchButton');
if (searchButton) {
 searchButton.addEventListener('click', async () => {
   const articleText = await getArticleText();
   const eventKeywords = await extractArticleKeywords(articleText);
   const query = `${eventKeywords} (${domainFilter})`;
   const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(query);
   window.open(searchUrl, '_blank');
 });
}
});


// Get article text from the content script
async function getArticleText() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getArticleText" }, (response) => {
        if (response && response.text) {
          resolve(response.text);
        } else {
          resolve("");
        }
      });
    });
  });
}
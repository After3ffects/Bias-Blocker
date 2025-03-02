import { newsSourceData, newsSourceHostnames } from './newsSources.js';
import { generateContent } from './prompt.js';

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

// Define a list of unbiased news source domains
const unbiasedSources = newsSourceData
  .filter(source => source["Political Leaning"] === 4)
  .map(source => {
    const hostnameInfo = newsSourceHostnames.find(hostnameSource => hostnameSource.ID === source.ID);
    return hostnameInfo ? hostnameInfo.Hostname : null;
  })
  .filter(hostname => hostname !== null);

// Build a domain filter string using the 'site:' operator for Google Search.
const domainFilter = unbiasedSources
  .map(domain => `site:${domain}`)
  .join(' OR ');

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

// Attach an event listener to the button to perform the filtered search
document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('searchButton');
  if (searchButton) {
    searchButton.addEventListener('click', async () => {
      // Get the article text
      const articleText = await getArticleText();

      // Extract keywords from the article
      const eventKeywords = await extractArticleKeywords(articleText);

      // Combine the keywords with our domain filter to build the query
      const query = `${eventKeywords} (${domainFilter})`;

      // Construct the full Google search URL with the encoded query
      const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(query);

      // Open the search URL in a new tab
      window.open(searchUrl, '_blank');
    });
  }
});
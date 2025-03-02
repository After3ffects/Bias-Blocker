import { newsSourceData, newsSourceHostnames } from './newsSources.js';

// Uncomment and implement this later when you have an extraction function
// function extractEventKeywords() {
//   // Your extraction logic here
// }

// For now, we'll simply set the keywords to "latest news"
const eventKeywords = "latest news";

// Define a list of unbiased news source domains
const unbiasedSources = newsSourceData
  .filter(source => source["Political Leaning"] === 4)
  .map(source => {
    const hostnameInfo = newsSourceHostnames.find(hostnameSource => hostnameSource.ID === source.ID);
    return hostnameInfo ? hostnameInfo.Hostname : null;
  })
  .filter(hostname => hostname !== null);

// Build a domain filter string using the 'site:' operator for Google Search.
// It will look like: site:apnews.com OR site:reuters.com OR ...
const domainFilter = unbiasedSources
  .map(domain => `site:${domain}`)
  .join(' OR ');

// Attach an event listener to the button to perform the filtered search
document.getElementById('searchButton').addEventListener('click', () => {
  // Combine the keywords with our domain filter to build the query
  const query = `${eventKeywords} ${domainFilter}`;

  // Construct the full Google search URL with the encoded query
  const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(query);

  // Open the search URL in a new tab
  window.open(searchUrl, '_blank');
});

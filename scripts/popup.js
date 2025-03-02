// scripts/popup.js
import { setLeaningValue } from './politicalState.js';


document.addEventListener('DOMContentLoaded', function() {
  console.log("popup.js loaded");

  // Get the active tab information
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs.length > 0) {
      const url = new URL(tabs[0].url);
      const hostname = url.hostname.replace(/^www\./, '');

      // Import the module directly in the popup
      import('./newsSources.js').then(module => {
        const { newsSourceData, newsSourceHostnames } = module;

        // Find the news source information
        const sourceHostnameInfo = newsSourceHostnames.find(source =>
          source.Hostname === hostname
        );

        if (sourceHostnameInfo) {
          const sourceAttributes = newsSourceData.find(source =>
            source.ID === sourceHostnameInfo.ID
          );

          if (sourceAttributes) {
            displayWebsiteAttributes(sourceAttributes);
          } else {
            displayError("News source data not found");
          }
        } else {
          displayError("This website is not in our database");
        }
      }).catch(error => {
        console.error("Error importing newsSources.js:", error);
        displayError("Error loading news source data");
      });
    }
  });

  // Set up event listener for search button
  // The logic is now handled in newSearch.js
});

function displayWebsiteAttributes(attributes) {
  console.log("popup.js: displayWebsiteAttributes called with attributes:", attributes);

  document.getElementById('newsSourceName').textContent = attributes["News Source Name"] || 'Unknown Source';

  // Convert political leaning number to text and apply styling
  const leaningValue = attributes["Political Leaning"];
  let leaningText = 'Unknown';
  let leaningClass = '';
  setLeaningValue(leaningValue);

  if (leaningValue === 1) {
    leaningText = "Far Left";
    leaningClass = 'tag-left';
  } else if (leaningValue === 2) {
    leaningText = "Left";
    leaningClass = 'tag-left';
  } else if (leaningValue === 3) {
    leaningText = "Center Left";
    leaningClass = 'tag-left';
  } else if (leaningValue === 4) {
    leaningText = "Center";
    leaningClass = 'tag-center';
  } else if (leaningValue === 5) {
    leaningText = "Center Right";
    leaningClass = 'tag-right';
  } else if (leaningValue === 6) {
    leaningText = "Right";
    leaningClass = 'tag-right';
  } else if (leaningValue === 7) {
    leaningText = "Far Right";
    leaningClass = 'tag-right';
  }

  // Create a tag element for political leaning
  const leaningElement = document.getElementById('politicalLeaning');
  leaningElement.innerHTML = `<span class="tag ${leaningClass}">${leaningText}</span>`;

  // Display factuality rating with stars
  const factualityRating = attributes["Factuality Rating"] || 0;
  document.getElementById('factualityRating').textContent = factualityRating;

  // Generate stars based on factuality rating
  const starsContainer = document.getElementById('ratingStars');
  starsContainer.innerHTML = '';

  for (let i = 0; i < 5; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = i < factualityRating ? '★' : '☆';
    starsContainer.appendChild(star);
  }

  document.getElementById('location').textContent = attributes["Location"] || 'Unknown';
  document.getElementById('attributeError').style.display = 'none';
}

function displayError(errorMessage) {
  document.getElementById('attributeError').textContent = errorMessage;
  document.getElementById('attributeError').style.display = 'block';
  document.getElementById('newsSourceName').textContent = 'Unknown Source';
  document.getElementById('politicalLeaning').innerHTML = '<span class="tag">Unknown</span>';
  document.getElementById('factualityRating').textContent = '-';
  document.getElementById('ratingStars').innerHTML = '';
  document.getElementById('location').textContent = 'Unknown';
}
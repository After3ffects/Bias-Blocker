// scripts/popup.js

document.addEventListener('DOMContentLoaded', function() {
    console.log("popup.js loaded"); // Add basic functionality
    
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
  
    // Set up event listeners for buttons
    document.getElementById('settingsButton').addEventListener('click', function() {
      openSettingsPanel();
    });
    
    document.getElementById('searchButton').addEventListener('click', function() {
      // Import the newsSources module when needed
      import('./newsSources.js').then(module => {
        const { newsSourceData } = module;
        
        // Find unbiased sources (Political Leaning = 4)
        const unbiasedSources = newsSourceData
          .filter(source => source["Political Leaning"] === 4)
          .map(source => source["News Source Name"])
          .join(", ");
        
        // Open a Google search with unbiased sources
        const query = "latest news site:" + unbiasedSources.replace(/ /g, "+");
        window.open("https://www.google.com/search?q=" + encodeURIComponent(query), "_blank");
      });
    });
  });
  
  function displayWebsiteAttributes(attributes) {
    console.log("popup.js: displayWebsiteAttributes called with attributes:", attributes);
  
    document.getElementById('newsSourceName').textContent = attributes["News Source Name"] || 'Unknown';
    
    // Convert political leaning number to text
    const leaningValue = attributes["Political Leaning"];
    let leaningText = 'Unknown';
    
    if (leaningValue === 1) leaningText = "Far Left";
    else if (leaningValue === 2) leaningText = "Left";
    else if (leaningValue === 3) leaningText = "Center Left";
    else if (leaningValue === 4) leaningText = "Center";
    else if (leaningValue === 5) leaningText = "Center Right";
    else if (leaningValue === 6) leaningText = "Right";
    else if (leaningValue === 7) leaningText = "Far Right";
    
    document.getElementById('politicalLeaning').textContent = leaningText;
    document.getElementById('factualityRating').textContent = attributes["Factuality Rating"] || 'Unknown';
    document.getElementById('location').textContent = attributes["Location"] || 'Unknown';
    document.getElementById('attributeError').style.display = 'none';
  }
  
  function displayError(errorMessage) {
    document.getElementById('attributeError').textContent = errorMessage;
    document.getElementById('attributeError').style.display = 'block';
    document.getElementById('newsSourceName').textContent = 'Unknown';
    document.getElementById('politicalLeaning').textContent = 'Unknown';
    document.getElementById('factualityRating').textContent = 'Unknown';
    document.getElementById('location').textContent = 'Unknown';
  }
  
  function openSettingsPanel() {
    // Create an overlay
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
  
    // Create the settings panel
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        width: 400px;
    `;
  
    // Political Leaning Input Field
    const leaningLabel = document.createElement('label');
    leaningLabel.textContent = 'Enter political leaning (1-7):';
    const leaningInput = document.createElement('input');
    leaningInput.type = 'number';
    leaningInput.min = '1';
    leaningInput.max = '7';
    leaningInput.id = 'leaning-input';
    leaningInput.value = '4'; // Default to center
  
    // Error message if it is invalid
    const leaningError = document.createElement('p');
    leaningError.style.cssText = 'color:red; display:none;';
    leaningError.id = "leaning-error";
  
    const leaningInfo = document.createElement('p');
    leaningInfo.style.cssText = 'color:blue; display:block;';
    leaningInfo.textContent = "1: Far Left, 4: Center, 7: Far Right";
    leaningInfo.id = "leaning-info";
  
    // Done Button
    const doneButton = document.createElement('button');
    doneButton.textContent = 'Done';
    doneButton.style.cssText = 'margin-right: 10px; padding: 5px 10px;';
    doneButton.addEventListener('click', function() {
      const leaningValue = parseInt(leaningInput.value);
  
      //Checks to see if the value is a real value and handles errors correctly
      if (isNaN(leaningValue) || leaningValue < 1 || leaningValue > 7) {
        leaningError.style.display = 'block';
        leaningError.textContent = 'Error: Please enter a valid number (1-7)';
      } else {
        createSearchButton(leaningValue); // Create search button
        closeSettingsPanel();
      }
    });
  
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = 'padding: 5px 10px;';
    cancelButton.addEventListener('click', closeSettingsPanel);
  
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'margin-top: 15px; text-align: right;';
    buttonContainer.appendChild(doneButton);
    buttonContainer.appendChild(cancelButton);
  
    // Append everything to the panel
    panel.appendChild(leaningLabel);
    panel.appendChild(document.createElement('br'));
    panel.appendChild(leaningInput);
    panel.appendChild(leaningError);
    panel.appendChild(leaningInfo);
    panel.appendChild(buttonContainer);
  
    // Append the panel to the overlay
    overlay.appendChild(panel);
  
    // Append the overlay to the body
    document.body.appendChild(overlay);
  
    function closeSettingsPanel() {
      overlay.remove();
    }
  }
  
  function createSearchButton(leaningValue) {
    // Import the module to get the news sources
    import('./newsSources.js').then(module => {
      const { newsSourceData, newsSourceHostnames } = module;
      
      // Filter sources by the political leaning chosen
      const filteredSources = newsSourceData
        .filter(source => source["Political Leaning"] === parseInt(leaningValue))
        .map(source => {
          const hostnameInfo = newsSourceHostnames.find(h => h.ID === source.ID);
          return hostnameInfo ? hostnameInfo.Hostname : null;
        })
        .filter(Boolean);
      
      if (filteredSources.length === 0) {
        alert("No sources found with that political leaning. Try a different value.");
        return;
      }
      
      const domainFilter = filteredSources
        .map(domain => `site:${domain}`)
        .join(' OR ');
      
      const eventKeywords = "latest news"; // Default keywords
      const query = `${eventKeywords} (${domainFilter})`;
      const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(query);
      
      // Create a custom button for the filtered search
      const button = document.createElement("button");
      button.textContent = `Find News (Leaning: ${leaningValue})`;
      button.className = "search-button";
      button.style.cssText = `
        background-color: #3498db;
        color: white;
        border: none;
        padding: 8px 12px;
        margin-top: 10px;
        border-radius: 4px;
        cursor: pointer;
        display: block;
        width: 100%;
      `;
      
      // Add the button to the popup
      const container = document.querySelector('#websiteAttributesDisplay');
      container.appendChild(button);
      
      // Add the click handler
      button.addEventListener('click', () => {
        window.open(searchUrl, '_blank');
      });
    });
  }
import { newsSourceData, newsSourceHostnames } from './newsSources.js';

// Function to get the current website's hostname
function getCurrentHostname() {
  return window.location.hostname.replace(/^www\./, '');
}

// Function to get website attributes based on hostname
function getWebsiteAttributes(hostname) {
  console.log("Looking up attributes for hostname:", hostname);
  
  // Find the matching hostname in our data
  const sourceHostnameInfo = newsSourceHostnames.find(source => 
    source.Hostname === hostname
  );
  
  if (sourceHostnameInfo) {
    console.log("Found hostname match:", sourceHostnameInfo);
    // Get the full news source data using the ID
    const sourceAttributes = newsSourceData.find(source => 
      source.ID === sourceHostnameInfo.ID
    );
    
    if (sourceAttributes) {
      console.log("Found source attributes:", sourceAttributes);
      return sourceAttributes;
    }
  }
  
  console.log("No matching news source found for:", hostname);
  return null;
}

// When the content script loads, get the website info and send to popup
const hostname = getCurrentHostname();
const attributes = getWebsiteAttributes(hostname);

// If we found attributes, send them to the popup
if (attributes) {
  chrome.runtime.sendMessage({
    action: "sendWebsiteAttributes",
    attributes: attributes
  });
  console.log("Sent website attributes to popup:", attributes);
} else {
  chrome.runtime.sendMessage({
    action: "sendWebsiteAttributes",
    attributes: {
      error: "No matching news source found"
    }
  });
  console.log("Sent error to popup: No matching news source found");
}
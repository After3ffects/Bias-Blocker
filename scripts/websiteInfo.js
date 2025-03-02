// scripts/websiteInfo.js

import { newsSourceData, newsSourceHostnames } from './newsSources.js';

let currentWebsiteAttributes = null;

function getWebsiteAttributes() {
    console.log("websiteInfo.js: getWebsiteAttributes() function called"); // Debug log

    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab || !activeTab.url) {
                console.log("websiteInfo.js: Could not get active tab URL."); // Debug log
                reject("Could not get active tab URL.");
                return;
            }

            let hostname;
            try {
                const urlObj = new URL(activeTab.url);
                hostname = urlObj.hostname;
                console.log("websiteInfo.js: Extracted hostname (initial):", hostname); // Debug log
                if (hostname.startsWith('www.')) {
                    hostname = hostname.substring(4); // Remove the first 4 characters ("www.")
                    console.log("biasAnalysis.js: Hostname after removing 'www.':", hostname); // Debug log
                }
            } catch (error) {
                console.error("websiteInfo.js: Invalid URL format:", error); // Error log
                reject("Invalid URL format.");
                return;
            }

            const sourceHostnameInfo = newsSourceHostnames.find(source => source.Hostname === hostname);

            if (sourceHostnameInfo) {
                console.log("websiteInfo.js: Hostname found in newsSourceHostnames:", hostname, sourceHostnameInfo); // Debug log
                const sourceAttributes = newsSourceData.find(source => source.ID === sourceHostnameInfo.ID);
                if (sourceAttributes) {
                    resolve(sourceAttributes); // Resolve with the attributes object
                } else {
                    console.log("websiteInfo.js: News source attributes NOT found for ID:", sourceHostnameInfo.ID); // Debug log
                    reject("News source attributes not found for ID: " + sourceHostnameInfo.ID);
                }
            } else {
                console.log("websiteInfo.js: Hostname NOT found in news source list:", hostname); // Debug log
                reject("Hostname not found in news source list: " + hostname);
            }
        });
    });
}

// Immediately call getWebsiteAttributes when this script is loaded
getWebsiteAttributes()
    .then(attributes => {
        currentWebsiteAttributes = attributes;
        console.log("websiteInfo.js: Website Attributes Retrieved Successfully:", currentWebsiteAttributes);

        // Introduce a small delay before sending the message (e.g., 500 milliseconds)
        setTimeout(() => {
            chrome.runtime.sendMessage({
                action: "sendWebsiteAttributes",
                attributes: currentWebsiteAttributes
            });
            console.log("websiteInfo.js: Message sent to popup (AFTER DELAY): sendWebsiteAttributes", currentWebsiteAttributes);
        }, 500); // 500 milliseconds delay

    })
    .catch(error => {
        console.error("websiteInfo.js: Error retrieving website attributes on load:", error);
        currentWebsiteAttributes = { error: error };

        // Send error message to popup
        chrome.runtime.sendMessage({
            action: "sendWebsiteAttributes",
            attributes: currentWebsiteAttributes // Send error info
        });
        console.log("websiteInfo.js: Error message sent to popup: sendWebsiteAttributes", currentWebsiteAttributes); // Error message sent log
    });

// Now, anywhere else in your websiteInfo.js file, you can access the 'currentWebsiteAttributes' variable.
// For example, in another function within this file:

function doSomethingWithAttributes() {
    if (currentWebsiteAttributes) {
        if (currentWebsiteAttributes.error) {
            console.log("Error occurred:", currentWebsiteAttributes.error);
        } else {
            console.log("Using stored attributes:", currentWebsiteAttributes);
            // ... perform actions using currentWebsiteAttributes ...
        }
    } else {
        console.log("Website attributes not yet retrieved or an error occurred during initial retrieval.");
    }
}

// You can call doSomethingWithAttributes() later, e.g., in response to a user action or event.
// doSomethingWithAttributes(); // Example call - you might trigger this from popup interaction later
// You can now use newsSourceHostnames in your code
console.log(newsSourceHostnames);
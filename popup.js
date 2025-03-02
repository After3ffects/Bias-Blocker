// scripts/popup.js
/*
document.addEventListener('DOMContentLoaded', () => {
    const newsSourceNameElement = document.getElementById('newsSourceName');
    const politicalLeaningElement = document.getElementById('politicalLeaning');
    const factualityRatingElement = document.getElementById('factualityRating');
    const attributeErrorElement = document.getElementById('attributeError');

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            console.log("popup.js: Message received:", request); // Log every message received

            if (request.action === "sendWebsiteAttributes") {
                const attributes = request.attributes;
                console.log("popup.js: Received website attributes:", attributes); // Log attributes

                if (attributes && !attributes.error) {
                    newsSourceNameElement.textContent = attributes["News Source Name"] || "N/A";
                    politicalLeaningElement.textContent = attributes["Political Leaning"] || "N/A";
                    factualityRatingElement.textContent = attributes["Factuality Rating"] || "N/A";
                    attributeErrorElement.style.display = 'none'; // Hide error message
                } else {
                    newsSourceNameElement.textContent = "N/A";
                    politicalLeaningElement.textContent = "N/A";
                    factualityRatingElement.textContent = "N/A";
                    attributeErrorElement.style.display = 'block'; // Show error message
                    attributeErrorElement.textContent = attributes.error || "Error retrieving attributes.";
                }
            }
        }
    );

    // ... (rest of popup.js code - you can keep or remove the chrome.scripting.executeScript part for now) ...
});
*/

// scripts/popup.js


let websiteInfoPort = null;

function connectToWebsiteInfo() {
    websiteInfoPort = chrome.runtime.connect({ name: "websiteInfo-popup-port" });
    websiteInfoPort.onDisconnect.addListener(() => {
        websiteInfoPort = null;
        console.log("popup.js: Port to websiteInfo.js disconnected.");
    });
    websiteInfoPort.onMessage.addListener(handleWebsiteInfoMessage);
    console.log("popup.js: Port to websiteInfo.js connected.");

    websiteInfoPort.postMessage({ action: "requestWebsiteAttributes" }); // Request attributes from content script NOW, after connection
    console.log("popup.js: Sent 'requestWebsiteAttributes' message to websiteInfo.js");
}


function handleWebsiteInfoMessage(message) {
    console.log("popup.js: Message received from websiteInfo.js:", message);

    if (message.action === "sendWebsiteAttributes") {
        const attributes = message.attributes;
        console.log("popup.js: Received website attributes:", attributes);

        const newsSourceNameElement = document.getElementById('newsSourceName');
        const politicalLeaningElement = document.getElementById('politicalLeaning');
        const factualityRatingElement = document.getElementById('factualityRating');
        const attributeErrorElement = document.getElementById('attributeError');


        if (attributes && !attributes.error) {
            newsSourceNameElement.textContent = attributes["News Source Name"] || "N/A";
            politicalLeaningElement.textContent = attributes["Political Leaning"] || "N/A";
            factualityRatingElement.textContent = attributes["Factuality Rating"] || "N/A";
            attributeErrorElement.style.display = 'none';
        } else {
            newsSourceNameElement.textContent = "N/A";
            politicalLeaningElement.textContent = "N/A";
            factualityRatingElement.textContent = "N/A";
            attributeErrorElement.style.display = 'block';
            attributeErrorElement.textContent = attributes.error || "Error retrieving attributes.";
        }
    } else {
        console.log("popup.js: Unknown action received:", message.action);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    connectToWebsiteInfo(); // Establish port connection when popup is loaded
});
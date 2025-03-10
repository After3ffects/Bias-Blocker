// Updated to use backend API instead of direct Gemini API calls
async function dataToText(data) {
  try {
    return data.response || data.text || "No response text available";
  } catch (error) {
    console.error("Error parsing response:", error);
    return "Error processing response";
  }
}

export async function generateContent(prompt) {
  // Replace with your actual backend URL from Render
  const BACKEND_API_URL = "https://your-render-app-name.onrender.com/query_gemini";

  return fetch(BACKEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: prompt
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    return dataToText(data);
  })
  .catch(error => {
    console.error("API error:", error);
    throw error;
  });
}
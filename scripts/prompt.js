async function dataToText(data) {
  return ((((((data["candidates"])[0])["content"])["parts"])[0])["text"]);
}

export async function generateContent(prompt) {

const apiKey = "AIzaSyD0ZDzQgY5olkJc1fOLLC9X3BS6CewBj1E"

return fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  })
})
.then(response => response.json())
.then(data => {
  return dataToText(data);
})
.catch(error => {
  console.error("Gemini API error:", error);
  throw error;
});
}
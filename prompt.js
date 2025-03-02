const dataToText = (data) => {
    return ((((((data["candidates"])[0])["content"])["parts"])[0])["text"]);
}


const apiKey = "AIzaSyD0ZDzQgY5olkJc1fOLLC9X3BS6CewBj1E";

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: "Write a story about a magic backpack."
          }
        ]
      }
    ]
  })
})
.then(response => response.json())
.then(data => console.log((dataToText(data))))
.catch(error => console.error('Error:', error));

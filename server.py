from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

# Add CORS middleware to allow requests from your extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you should restrict this to necessary origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/query_gemini")
async def query_gemini(request: Request):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="API key not found.")
    
    # Get request body
    data = await request.json()
    prompt = data.get("prompt")
    
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }

    # Forward the request to Gemini API
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=str(response.json()))
    
    try:
        result = response.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        return {"response": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing Gemini response: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
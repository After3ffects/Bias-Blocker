from fastapi import FastAPI, HTTPException
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

@app.post("/query_gemini")
async def query_gemini(prompt: dict):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="API key not found.")
    
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText"
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}

    # Forward the request to Gemini API
    response = requests.post(url, headers=headers, params=params, json=prompt)
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())
    
    return response.json()

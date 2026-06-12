from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from passwd import get_analysis_data

app = FastAPI(
    title="Password Strength Analyzer API",
    description="Backend API for real-time password strength analysis and entropy calculations",
    version="1.0.0"
)

# Enable CORS for local testing if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PasswordRequest(BaseModel):
    password: str

@app.post("/api/analyze")
def analyze(payload: PasswordRequest):
    try:
        # Perform the analysis and return metrics
        data = get_analysis_data(payload.password)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Mount static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)

# Mount static files at / with html=True to serve index.html at root
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

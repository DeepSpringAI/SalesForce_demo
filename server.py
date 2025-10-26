from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
import time
from dotenv import load_dotenv
import requests
import re
import random
import string
load_dotenv()

app = FastAPI()

# Add CORS middleware - allow all origins for ngrok compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for ngrok
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def generate_random_user_id(length=10):
    """Generate a random user ID with letters and numbers"""
    characters = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return ''.join(random.choice(characters) for _ in range(length))

class SessionRequest(BaseModel):
    origin: str = None  # Optional: the domain where ChatKit will be used

@app.post("/api/chatkit/session")
def create_simple_session(request: SessionRequest = SessionRequest(), http_request: Request = None):
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    WORKFLOW_ID = os.getenv("CHATKIT_WORKFLOW_ID", "wf_68eca7578e9c8190a0085207d7b7ce84081ad591929c024f")
    DOMAIN_KEY = os.getenv("OPENAI_DOMAIN_KEY", "domain_pk_68f899197ff48190a4f3ed7002a08dc10fdc9f3a5fb67a88")
    
    # Get the origin from request or headers
    origin = request.origin
    if not origin and http_request:
        origin = http_request.headers.get("origin") or http_request.headers.get("referer")
    
    print(f"🌐 Creating session for origin: {origin}")
    print(f"👤 Using hardcoded user ID: deepspring")
    print(f"🔑 Using domain key: {DOMAIN_KEY[:20]}...")
    
    # Hardcoded user ID - all sessions use "deepspring"
    
    # Build session payload - only use supported parameters
    # Hardcoded user ID as requested
    session_payload = {
        "workflow": {"id": WORKFLOW_ID},
        "user": "deepspring"
    }
    
    # Note: metadata, origin, and domain_key are not supported in the session payload
    # Domain verification is handled via headers and domain allowlist

    # Headers with domain verification
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
    }
    
    # Add domain key to headers if available
    if DOMAIN_KEY:
        headers["OpenAI-Domain-Key"] = DOMAIN_KEY
    
    response = requests.post(
        "https://api.openai.com/v1/chatkit/sessions",
        headers=headers,
        json=session_payload,
    )

    print(f"📊 OpenAI API Response: {response.status_code}")
    print(f"📋 Response headers: {dict(response.headers)}")
    
    if response.status_code != 200:
        error_text = response.text
        print(f"❌ Error response: {error_text}")
        return {"error": f"OpenAI API error: {error_text}", "status_code": response.status_code}

    try:
        data = response.json()
        print(f"📄 OpenAI response data: {data}")
        
        client_secret = data.get("client_secret")
        if not client_secret:
            print(f"❌ No client_secret in OpenAI response: {data}")
            return {"error": "No client_secret returned from OpenAI API", "openai_response": data}
        
        print(f"✅ Session created successfully, client_secret: {client_secret[:20]}...")
        return {"client_secret": client_secret, "origin": origin}
        
    except Exception as e:
        print(f"❌ Error parsing OpenAI response: {e}")
        return {"error": f"Failed to parse OpenAI response: {str(e)}", "raw_response": response.text}

@app.get("/")
def health_check():
    """Health check endpoint"""
    return {
        "status": "running",
        "message": "ChatKit Session Server",
        "endpoints": ["/api/chatkit/session"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run('server:app', host="0.0.0.0", port=8000, reload=True)

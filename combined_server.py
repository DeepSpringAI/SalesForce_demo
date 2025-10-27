import os
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Import the ChatKit server
import server

# Create main app
app = FastAPI(title="ChatKit Demo")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes from the ChatKit server
@app.post("/api/chatkit/session")
async def create_session(request: Request):
    print(f"🔥 Combined server received ChatKit session request from {request.client.host}")
    print(f"📋 Request headers: {dict(request.headers)}")
    try:
        body = await request.json()
        print(f"📄 Request body: {body}")
    except:
        print("📄 No JSON body or failed to parse")
    
    result = server.create_simple_session(server.SessionRequest(), request)
    print(f"✅ Combined server returning: {result}")
    return result

@app.post("/api/transcribe")
async def transcribe_audio_route(file: UploadFile = File(...)):
    """Transcribe audio file using OpenAI Whisper API"""
    print(f"🎤 Combined server received transcription request for file: {file.filename}")
    try:
        # Read the audio data
        audio_data = await file.read()
        print(f"📊 File size: {len(audio_data)} bytes")
        
        # Use the OpenAI client directly here
        from openai import OpenAI
        import os
        from io import BytesIO
        
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        if not OPENAI_API_KEY:
            return JSONResponse(
                status_code=500,
                content={"error": "OpenAI API key not configured"}
            )
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Create a file-like object from the bytes
        audio_file = BytesIO(audio_data)
        audio_file.name = file.filename
        
        print("🔄 Calling OpenAI Whisper API...")
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        
        print(f"✅ Transcription successful: {transcript.text}")
        return {"text": transcript.text}
        
    except Exception as e:
        print(f"❌ Transcription error in combined server: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Serve static files
if os.path.exists("build"):
    # Mount static files at root for React build assets
    app.mount("/static", StaticFiles(directory="build/static"), name="react-static")
    
    # Serve React build assets directly
    @app.get("/js/{file_path:path}")
    async def serve_js(file_path: str):
        return FileResponse(f"build/static/js/{file_path}")
    
    @app.get("/css/{file_path:path}")
    async def serve_css(file_path: str):
        return FileResponse(f"build/static/css/{file_path}")
    
    @app.get("/media/{file_path:path}")
    async def serve_media(file_path: str):
        return FileResponse(f"build/static/media/{file_path}")

    # Serve React app for all other routes
    @app.get("/{path:path}")
    async def serve_react(path: str = ""):
        # Check if it's a static file in the root
        build_file = f"build/{path}"
        if path and os.path.exists(build_file) and os.path.isfile(build_file):
            return FileResponse(build_file)
        
        # Serve index.html for React Router
        return FileResponse("build/index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

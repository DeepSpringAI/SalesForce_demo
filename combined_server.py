import os
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
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
    return await server.create_simple_session(server.SessionRequest(), request)

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Serve static files
if os.path.exists("static"):
    # Mount static files at root for React build assets
    app.mount("/static", StaticFiles(directory="static/static"), name="react-static")
    
    # Serve React build assets directly
    @app.get("/js/{file_path:path}")
    async def serve_js(file_path: str):
        return FileResponse(f"static/static/js/{file_path}")
    
    @app.get("/css/{file_path:path}")
    async def serve_css(file_path: str):
        return FileResponse(f"static/static/css/{file_path}")
    
    @app.get("/media/{file_path:path}")
    async def serve_media(file_path: str):
        return FileResponse(f"static/static/media/{file_path}")

    # Serve React app for all other routes
    @app.get("/{path:path}")
    async def serve_react(path: str = ""):
        # Check if it's a static file in the root
        static_file = f"static/{path}"
        if path and os.path.exists(static_file) and os.path.isfile(static_file):
            return FileResponse(static_file)
        
        # Serve index.html for React Router
        return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

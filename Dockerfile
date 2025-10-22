# ChatKit Demo - Single Container
# Builds React app and serves it with Python FastAPI

FROM node:18-alpine AS react-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production=false

# Copy source and build React app
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# Production stage with Python
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python server
COPY server.py .

# Copy built React app
COPY --from=react-builder /app/build ./static

# Create combined server
RUN cat > combined_server.py << 'EOF'
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
EOF

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Run combined server
CMD ["python", "combined_server.py"]

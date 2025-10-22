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

# Copy Python server files
COPY server.py .
COPY combined_server.py .

# Copy built React app
COPY --from=react-builder /app/build ./static

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

# Makefile for ChatKit Demo Server

.PHONY: help install build dev server kill-port-8000 clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make build         - Build React app"
	@echo "  make dev           - Run development server"
	@echo "  make server        - Run combined server (production)"
	@echo "  make kill-port-8000 - Kill all processes on port 8000"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make test-api      - Test API endpoint"

# Install dependencies
install:
	@echo "Installing Node.js dependencies..."
	npm install
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt

# Build React app
build:
	@echo "Building React app..."
	npm run build

# Run development server (React dev server + API server separately)
dev:
	@echo "Starting development servers..."
	@echo "Note: This will start React dev server on port 3000 and API server on port 8000"
	npm start &
	python server.py

# Run combined production server
server: kill-port-8000 build
	@echo "Starting combined server on port 8000..."
	uvicorn combined_server:app --host 0.0.0.0 --port 8000 --reload

# Kill all processes on port 8000
kill-port-8000:
	@echo "Killing all processes on port 8000..."
	@lsof -ti:8000 | xargs -r kill -9 2>/dev/null || echo "No processes found on port 8000"
	@sleep 1

# Test API endpoint
test-api:
	@echo "Testing API endpoint..."
	@curl -X POST http://localhost:8000/api/chatkit/session \
		-H "Content-Type: application/json" \
		-d '{"origin": "http://localhost:8000"}' \
		|| echo "API test failed - make sure server is running with 'make server'"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf build/
	rm -rf node_modules/.cache/
	rm -rf __pycache__/

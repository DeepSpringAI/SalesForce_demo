# ChatKit Demo - Salesforce Integration

A complete ChatKit implementation with React frontend and Python FastAPI backend, containerized with Docker.

## 🚀 Quick Start

### Prerequisites
- Docker installed on your system
- OpenAI API key
- ChatKit workflow ID
- OpenAI domain key (for domain verification)

### 1. Clone the Repository
```bash
git clone git@github.com:mertz1999/SalesForce_demo.git
cd SalesForce_demo
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
# Required: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Required: ChatKit Workflow ID  
CHATKIT_WORKFLOW_ID=wf_your_workflow_id_here

# Required: OpenAI Domain Key (from domain allowlist)
OPENAI_DOMAIN_KEY=domain_pk_your_domain_key_here

# Optional: User ID
USER_ID=user_default_id

# Optional: Server Port
PORT=8000
```

### 3. Build the Docker Image
```bash
docker build -t chatkit-demo .
```

### 4. Run the Container
```bash
# Run with environment file
docker run -p 8000:8000 --env-file .env chatkit-demo

# OR run with inline environment variables
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your_openai_api_key \
  -e CHATKIT_WORKFLOW_ID=wf_your_workflow_id \
  -e OPENAI_DOMAIN_KEY=domain_pk_your_domain_key \
  chatkit-demo
```

### 5. Access the Application
Open your browser and navigate to:
```
http://localhost:8000
```

## 🏗️ What's Inside

- **React Frontend**: Modern chat interface using ChatKit web components
- **Python Backend**: FastAPI server for ChatKit session creation
- **Single Container**: Everything runs in one Docker container
- **Health Checks**: Built-in health monitoring
- **CORS Support**: Cross-origin requests enabled
- **Security**: Runs as non-root user

## 🔧 Development

### Local Development (without Docker)

1. **Frontend**:
   ```bash
   npm install
   npm start
   ```

2. **Backend**:
   ```bash
   pip install -r requirements.txt
   python server.py
   ```

### Build Process
The Docker build process:
1. Builds React app as static files
2. Sets up Python environment
3. Creates combined server that serves both API and frontend
4. Configures health checks and security

## 📝 Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `CHATKIT_WORKFLOW_ID`: Your ChatKit workflow ID (required)
- `OPENAI_DOMAIN_KEY`: Domain verification key (required)
- `USER_ID`: Default user ID (optional, defaults to "user_default_id")
- `PORT`: Server port (optional, defaults to 8000)

### Domain Setup
1. Add your domain to OpenAI's domain allowlist
2. Get your domain key from OpenAI dashboard
3. Set `OPENAI_DOMAIN_KEY` in your environment

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your `OPENAI_API_KEY`
2. **Domain verification failed**: Ensure `OPENAI_DOMAIN_KEY` is correct
3. **Workflow not found**: Verify `CHATKIT_WORKFLOW_ID`
4. **Container won't start**: Check Docker logs for errors

### Health Check
The container includes a health check endpoint:
```bash
curl http://localhost:8000/api/health
```

### Logs
View container logs:
```bash
docker logs <container_id>
```

## 📦 Container Details

- **Base Image**: Python 3.11-slim with Node.js 18-alpine for building
- **Port**: 8000
- **Health Check**: Every 30 seconds
- **User**: Non-root for security
- **Size**: Optimized with multi-stage build

## 🔒 Security

- Runs as non-root user
- Environment variables for secrets
- CORS configured for cross-origin requests
- Health checks for monitoring
- No secrets in image layers

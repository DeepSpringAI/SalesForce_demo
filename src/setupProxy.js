const { createProxyMiddleware } = require('http-proxy-middleware');

const OpenAI = require('openai');

module.exports = function(app) {
  // Real ChatKit session creation endpoint
  app.post('/api/chatkit/session', async (req, res) => {
    console.log('📡 Real ChatKit session creation request received');
    
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
      // Check if OpenAI API key is available
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('❌ OPENAI_API_KEY environment variable not set');
        return res.status(500).json({
          error: 'Server configuration error: OPENAI_API_KEY not set'
        });
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: apiKey
      });

      console.log('🔑 Attempting to create ChatKit session...');
      
      // Check if ChatKit is available
      if (!openai.chatkit || !openai.chatkit.sessions) {
        console.error('❌ ChatKit not available in this OpenAI SDK version or account');
        return res.status(503).json({
          error: 'ChatKit not available',
          details: 'ChatKit API is not available in your OpenAI account or SDK version. You may need to request beta access or use a different approach.'
        });
      }
      
      // Create ChatKit session
      const session = await openai.chatkit.sessions.create({
        // Add any session configuration here
        // For example: model, instructions, etc.
      });

      console.log('✅ Real ChatKit session created successfully');
      
      res.json({
        client_secret: session.client_secret
      });

    } catch (error) {
      console.error('❌ Error creating ChatKit session:', error);
      
      // Handle specific OpenAI API errors
      if (error.status === 401) {
        return res.status(401).json({
          error: 'Invalid OpenAI API key'
        });
      }
      
      if (error.status === 403) {
        return res.status(403).json({
          error: 'ChatKit access not enabled for this API key'
        });
      }

      res.status(500).json({
        error: 'Failed to create ChatKit session',
        details: error.message
      });
    }
  });

  // Handle OPTIONS requests for CORS
  app.options('/api/chatkit/session', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
};

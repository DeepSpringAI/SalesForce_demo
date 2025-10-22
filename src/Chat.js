// src/Chat.js

import React, { useState, useEffect } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { SimpleChat } from './SimpleChat';

export function MyChat() {
  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        try {
          if (existing) {
            console.log('Refreshing existing session:', existing);
            // implement session refresh if needed
          }

          console.log('🔄 Creating ChatKit session with your working endpoint...');
          
          // Use your working Python server endpoint
          // Pass the current origin for ngrok compatibility
          const currentOrigin = window.location.origin;
          console.log('🌐 Current origin:', currentOrigin);
          
          // Determine API endpoint - use environment variable or default to localhost
          const apiEndpoint = process.env.REACT_APP_API_URL || 'http://localhost:8000';
          console.log('🔗 API endpoint:', apiEndpoint);
          
          const res = await fetch(`${apiEndpoint}/api/chatkit/session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              origin: currentOrigin
            }),
          });
          
          console.log('Session response status:', res.status);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error('Session creation failed:', res.status, errorText);
            throw new Error(`Failed to create session: ${res.status} - ${errorText}`);
          }
          
          const data = await res.json();
          console.log('Session response data:', data);
          
          // Handle both success and error responses
          if (data.error) {
            throw new Error(`Backend error: ${data.error}`);
          }
          
          const { client_secret } = data;
          if (!client_secret) {
            console.error('❌ No client_secret in response. Full response:', data);
            throw new Error(`No client_secret in response. Got: ${JSON.stringify(data)}`);
          }
          
          console.log('✅ ChatKit session created successfully, client_secret:', client_secret);
          
          return client_secret;
        } catch (error) {
          console.error('❌ Error in getClientSecret:', error);
          throw error;
        }
      },
    },
    // ChatKit configuration options
    theme: {
      colorScheme: 'light',
    },
    startScreen: {
      greeting: 'Hello! How can I help you today?',
      prompts: [
        {
          label: 'What can you help me with?',
          prompt: 'What can you help me with?',
          icon: 'circle-question'
        },
        {
          label: 'Tell me about your capabilities',
          prompt: 'Tell me about your capabilities',
          icon: 'star-filled'
        },
        {
          label: 'How does this work?',
          prompt: 'How does this work?',
          icon: 'lightbulb'
        }
      ],
    },
    composer: {
      placeholder: 'Type your message here...',
      attachments: {
        enabled: false, // Disable attachments for simplicity
      },
    },
    // Add error event handlers for debugging
    onError: (event) => {
      console.error('ChatKit error event:', event);
    },
    onSessionError: (event) => {
      console.error('ChatKit session error:', event);
    },
  });

  return (
    <div>
      <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px', fontSize: '12px' }}>
        <strong>Debug Info:</strong> Check browser console for detailed logs. If you see "Something went wrong", check the Network tab for failed requests.
      </div>
      <ChatKit 
        control={control} 
        style={{ 
          height: '600px', 
          width: '100%',
          border: 'none'
        }} 
      />
    </div>
  );
}

// Main Chat component
const Chat = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [showSimpleChat, setShowSimpleChat] = useState(false);

  useEffect(() => {
    // Check if ChatKit script is loaded
    const checkScript = () => {
      if (window.customElements && window.customElements.get('openai-chatkit')) {
        console.log('✅ ChatKit script loaded successfully');
        setScriptLoaded(true);
      } else {
        console.log('⏳ Waiting for ChatKit script to load...');
      }
    };

    // Check immediately
    checkScript();

    // Check periodically for up to 10 seconds
    const interval = setInterval(checkScript, 1000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!scriptLoaded) {
        console.error('❌ ChatKit script failed to load after 10 seconds');
        setScriptError(true);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [scriptLoaded]);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>ChatKit Demo</h1>
      
      <div style={{ 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#d4edda',
        borderRadius: '8px',
        border: '1px solid #28a745'
      }}>
        <h3>✅ Real ChatKit Integration Active</h3>
        <p>Using your working Python server with real OpenAI API:</p>
        <ul>
          <li>🔑 Direct OpenAI ChatKit API calls</li>
          <li>✅ Real session creation with client_secret</li>
          <li>🌐 Python FastAPI server on port 8000</li>
          <li>🔐 Domain key handled by backend for ngrok compatibility</li>
          <li>🚀 Simple Chat available as fallback</li>
        </ul>
        <p><strong>Status:</strong> Session creation with domain verification should work on ngrok!</p>
      </div>

      {/* Script Loading Status */}
      {!scriptLoaded && !scriptError && (
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <h4>⏳ Loading ChatKit...</h4>
          <p>Waiting for ChatKit script to load from CDN...</p>
        </div>
      )}

      {scriptError && (
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          borderRadius: '8px',
          border: '1px solid #dc3545'
        }}>
          <h4>❌ ChatKit Not Available</h4>
          <p>ChatKit couldn't be loaded. This could be due to:</p>
          <ul>
            <li>Network connectivity issues</li>
            <li>CDN being unavailable</li>
            <li>ChatKit not enabled for your account</li>
            <li>Browser blocking the script</li>
          </ul>
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={() => setShowSimpleChat(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🚀 Use Simple Chat Instead
            </button>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}>
        {showSimpleChat ? (
          <SimpleChat />
        ) : scriptLoaded ? (
          <MyChat />
        ) : (
          <div style={{ 
            height: '600px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#666',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {scriptError ? (
              <div style={{ textAlign: 'center' }}>
                <p>❌ ChatKit unavailable</p>
                <button
                  onClick={() => setShowSimpleChat(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Try Simple Chat
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p>⏳ Loading ChatKit...</p>
                <p>Please wait while the script loads</p>
                <button
                  onClick={() => setShowSimpleChat(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Skip to Simple Chat
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '14px',
        border: '1px solid #e9ecef'
      }}>
        <h4>🔍 Debugging "Something went wrong" Error:</h4>
        <ol>
          <li><strong>Open Browser Console:</strong> Press F12 and check for error messages</li>
          <li><strong>Check Network Tab:</strong> Look for failed requests to <code>/api/chatkit/session</code></li>
          <li><strong>Script Loading:</strong> Verify ChatKit script loads from CDN</li>
          <li><strong>Session Creation:</strong> Check if mock API endpoint responds correctly</li>
        </ol>
        
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <strong>💡 Setup Required:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>Set <code>OPENAI_API_KEY</code> environment variable</li>
            <li>Ensure your OpenAI account has ChatKit access</li>
            <li>Add your domain to OpenAI's allowlist</li>
            <li>Restart the development server after adding env vars</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Chat;

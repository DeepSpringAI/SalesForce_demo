// src/Chat.js

import React, { useState, useEffect } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { SimpleChat } from './SimpleChat';

// Function to generate random 5-letter lastname
const generateRandomLastname = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lastname = '';
  for (let i = 0; i < 5; i++) {
    lastname += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return lastname;
};

export function MyChat() {
  const chatkit = useChatKit({
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
          
          // Determine API endpoint - use environment variable, relative path for production, or localhost for development
          let apiEndpoint;
          if (process.env.REACT_APP_API_URL) {
            apiEndpoint = process.env.REACT_APP_API_URL;
          } else if (process.env.NODE_ENV === 'production') {
            // In production (built app), use relative path since we're served from the same server
            apiEndpoint = '';
          } else {
            // In development, use localhost
            apiEndpoint = 'http://localhost:8000';
          }
          console.log('🔗 API endpoint:', apiEndpoint || 'relative');
          
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
          label: 'What you can do?',
          prompt: 'What you can do?',
          icon: 'circle-question'
        },
        {
          label: 'Salesforce Data Summary',
          prompt: 'give me a summary of data in Salesforce',
          icon: 'star-filled'
        },
        {
          label: 'Doctors in Jeddah',
          prompt: 'give me 5 doctors in jeddah',
          icon: 'lightbulb'
        },
        {
          label: 'Create Doctor Contact',
          prompt: `create a doctor contact name Ahmad lastname ${generateRandomLastname()}, ahmad@gmail.com, 092224222`,
          icon: 'circle-question'
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
        control={chatkit.control} 
        style={{ 
          height: '600px', 
          width: '100%',
          border: 'none',
          borderRadius: '16px'
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
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            Rx
          </div>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              PharmaAI Salesforce Assistant
            </h1>
            <p style={{ 
              margin: '5px 0 0 0', 
              color: '#666', 
              fontSize: '16px',
              fontWeight: '400'
            }}>
              Intelligent pharmaceutical sales support powered by AI
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '40px 20px'
      }}>
        {/* Status indicator - simplified */}
        {scriptLoaded && (
          <div style={{ 
            marginBottom: '30px',
            padding: '15px 20px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            border: '1px solid rgba(40, 167, 69, 0.3)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#28a745',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ color: '#28a745', fontWeight: '600', fontSize: '14px' }}>
              AI Assistant Ready
            </span>
          </div>
        )}

        {/* Loading State */}
        {!scriptLoaded && !scriptError && (
          <div style={{ 
            marginBottom: '30px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}></div>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Initializing AI Assistant...</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Please wait while we connect to the AI service</p>
          </div>
        )}

        {/* Error State */}
        {scriptError && (
          <div style={{ 
            marginBottom: '30px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
            <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>AI Service Unavailable</h4>
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
              Unable to connect to the AI service. You can still use our backup chat system.
            </p>
            <button
              onClick={() => setShowSimpleChat(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)'
              }}
            >
              Continue with Backup Chat
            </button>
          </div>
        )}

        {/* Chat Interface */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
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
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🤖</div>
                  <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#666' }}>
                    AI Assistant is initializing...
                  </p>
                  <button
                    onClick={() => setShowSimpleChat(true)}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    Start Conversation
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                  }}></div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>
                    Connecting to AI Assistant...
                  </p>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>
                    This may take a few moments
                  </p>
                  <button
                    onClick={() => setShowSimpleChat(true)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      color: '#667eea',
                      border: '1px solid #667eea',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Use Backup Chat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

// src/SimpleChat.js - A working chat interface as fallback

import React, { useState } from 'react';

export function SimpleChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm a simple chat interface. ChatKit isn't available, but you can test the UI here.",
      sender: 'Assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'User',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's interesting! Tell me more.",
        "I understand what you're saying.",
        "Thanks for sharing that with me.",
        "How can I help you with that?",
        "That's a great question!",
        "I see what you mean.",
        "Let me think about that...",
        "That makes sense to me."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage = {
        id: Date.now() + 1,
        text: randomResponse,
        sender: 'Assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ 
      height: '600px', 
      display: 'flex', 
      flexDirection: 'column',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '15px', 
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px 8px 0 0'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>💬 Simple Chat Interface</h3>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
          ChatKit fallback - fully functional chat UI
        </p>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.sender === 'User' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: message.sender === 'User' ? '#007bff' : '#f1f3f4',
                color: message.sender === 'User' ? 'white' : '#333',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ marginBottom: '4px' }}>{message.text}</div>
              <div style={{ 
                fontSize: '11px', 
                opacity: 0.7,
                textAlign: 'right'
              }}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: '#f1f3f4',
              color: '#666'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#666',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#666',
                  animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                }}></div>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#666',
                  animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ 
        padding: '15px', 
        borderTop: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        borderRadius: '0 0 8px 8px'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send)"
            style={{
              flex: 1,
              minHeight: '20px',
              maxHeight: '100px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              padding: '12px 20px',
              backgroundColor: (!inputMessage.trim() || isLoading) ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% {
            opacity: 0.3;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';

const VoiceRecorder = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingMode, setRecordingMode] = useState('mic'); // 'mic' or 'mic+system'
  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        let stream;
        
        // Try to capture both mic and system audio
        try {
          // Request display media for system audio capture
          stream = await navigator.mediaDevices.getDisplayMedia({ 
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
            video: false 
          });
          setRecordingMode('mic+system');
          console.log('Recording with system audio enabled');
        } catch (displayError) {
          console.log('System audio capture not available, falling back to microphone only');
          // Fallback to microphone only
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setRecordingMode('mic');
        }
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        const chunks = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          
          // Automatically transcribe the audio (no need to store URL)
          transcribeAudio(blob);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setElapsedTime(0);
      } catch (err) {
        console.error('Error accessing audio:', err);
        alert('Audio access denied. Please enable microphone/audio permissions.');
      }
    }
  };

  const transcribeAudio = async (blob) => {
    setIsTranscribing(true);
    try {
      // Convert blob to File
      const audioFile = new File([blob], 'recording.webm', { type: 'audio/webm' });
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      
      // Determine API endpoint - use same logic as Chat.js
      let apiEndpoint;
      if (process.env.REACT_APP_API_URL) {
        apiEndpoint = process.env.REACT_APP_API_URL;
      } else if (process.env.NODE_ENV === 'production') {
        // In production (built app), use relative path since we're served from the same server
        apiEndpoint = '';
      } else {
        // In development, use localhost:8000
        apiEndpoint = 'http://localhost:8000';
      }
      console.log('🔗 VoiceRecorder API endpoint:', apiEndpoint || 'relative');
      
      // Make API call to backend server instead of directly to OpenAI
      const response = await fetch(`${apiEndpoint}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Transcription failed: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      const transcribedText = data.text;
      console.log('Transcription:', transcribedText);
      
      // Send transcription to ChatKit input
      if (onTranscriptionComplete) {
        await onTranscriptionComplete(transcribedText);
      }
      
      // Clean up - close the transcribing message after a brief delay
      setTimeout(() => {
        setIsTranscribing(false);
      }, 500);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert(`Failed to transcribe audio: ${error.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <>
      {/* Floating White Button */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        right: '30px',
        zIndex: 1000
      }}>
        <button
          onClick={toggleRecording}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isRecording 
              ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' 
              : 'white',
            border: isRecording ? 'none' : '3px solid #667eea',
            boxShadow: isRecording 
              ? '0 4px 20px rgba(220, 53, 69, 0.5), 0 0 30px rgba(220, 53, 69, 0.3)' 
              : '0 4px 20px rgba(102, 126, 234, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            transition: 'all 0.3s ease',
            transform: isRecording ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {isRecording ? '⏹️' : '🎤︎︎'}
        </button>
        
        {/* Timer display when recording */}
        {isRecording && (
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '0',
            background: '#dc3545',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
            textAlign: 'center'
          }}>
            ⏺ {formatTime(elapsedTime)}
            {recordingMode === 'mic+system' && (
              <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.9 }}>
                Mic + System
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transcribing Message */}
      {isTranscribing && (
        <div style={{
          position: 'fixed',
          bottom: '160px',
          right: '30px',
          background: 'white',
          borderRadius: '16px',
          padding: '20px 30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #667eea',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          <div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
              Transcribing...
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
              Processing your voice message
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceRecorder;


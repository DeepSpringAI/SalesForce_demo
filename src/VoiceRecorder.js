import React, { useState, useEffect, useRef } from 'react';

const VoiceRecorder = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingMode, setRecordingMode] = useState('mic'); // 'mic' or 'mic+system'
  const [isMobile, setIsMobile] = useState(false);
  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);
  const recordingMimeTypeRef = useRef(null);

  // Check for mobile vs desktop
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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
        
        // Get the actual MIME type supported by the browser
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : MediaRecorder.isTypeSupported('audio/mp4') 
            ? 'audio/mp4'
            : 'audio/mpeg';
        
        console.log('🎤 Using MIME type:', mimeType);
        recordingMimeTypeRef.current = mimeType;
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        
        const chunks = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: recordingMimeTypeRef.current });
          console.log('🎵 Recording completed, MIME type:', recordingMimeTypeRef.current);
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
      // Get the correct file extension based on MIME type
      const getFileExtension = (mimeType) => {
        const extMap = {
          'audio/webm': 'webm',
          'audio/mp4': 'm4a',
          'audio/mpeg': 'mp3',
          'audio/ogg': 'ogg',
          'audio/wav': 'wav',
          'audio/flac': 'flac'
        };
        return extMap[mimeType] || 'webm';
      };
      
      const mimeType = recordingMimeTypeRef.current || 'audio/webm';
      const extension = getFileExtension(mimeType);
      const filename = `recording.${extension}`;
      
      console.log('📤 Uploading audio file:', filename, 'MIME type:', mimeType);
      
      // Convert blob to File with correct MIME type and extension
      const audioFile = new File([blob], filename, { type: mimeType });
      
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
        ...(isMobile ? {
          position: 'relative',
          width: '100%',
          padding: '10px',
          background: '#ffffff'
        } : {
          position: 'fixed',
          bottom: '80px',
          right: '30px',
        }),
        zIndex: 1000
      }}>
        <button
          onClick={toggleRecording}
          style={{
            ...(isMobile ? {
              width: '100%',
              height: '48px',
              borderRadius: '12px'
            } : {
              width: '64px',
              height: '64px',
              borderRadius: '50%'
            }),
            background: isRecording 
              ? (isMobile ? '#dc3545' : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)')
              : (isMobile ? '#000000' : 'white'),
            border: isRecording ? 'none' : (isMobile ? 'none' : '3px solid #000000'),
            boxShadow: isRecording 
              ? (isMobile ? '0 4px 20px rgba(220, 53, 69, 0.5)' : '0 4px 20px rgba(220, 53, 69, 0.5), 0 0 30px rgba(220, 53, 69, 0.3)')
              : (isMobile ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)'),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '16px' : '24px',
            fontWeight: isMobile ? '600' : 'normal',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            transition: 'all 0.3s ease',
            transform: isRecording ? 'scale(1.02)' : 'scale(1)',
            color: isRecording ? '#ffffff' : (isMobile ? '#ffffff' : 'inherit')
          }}
        >
          {isMobile ? (
            // Mobile: Full width button with text
            isRecording ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  width: '12px', 
                  height: '12px', 
                  background: '#ffffff', 
                  borderRadius: '2px' 
                }}></span>
                Stop Recording
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '2px' }}>
                  <path d="M12 1C11.2044 1 10.4413 1.31607 9.87868 1.87868C9.31607 2.44129 9 3.20435 9 4V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V4C15 3.20435 14.6839 2.44129 14.1213 1.87868C13.5587 1.31607 12.7956 1 12 1Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M19 10V12C19 13.8565 18.2625 15.637 16.9497 16.9497C15.637 18.2625 13.8565 19 12 19C10.1435 19 8.36301 18.2625 7.05025 16.9497C5.7375 15.637 5 13.8565 5 12V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19V23M12 23H9M12 23H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Record Voice
              </span>
            )
          ) : (
            // Desktop: Circular button with icon only
            isRecording ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 5H19V19H5V5Z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1C11.2044 1 10.4413 1.31607 9.87868 1.87868C9.31607 2.44129 9 3.20435 9 4V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V4C15 3.20435 14.6839 2.44129 14.1213 1.87868C13.5587 1.31607 12.7956 1 12 1Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M19 10V12C19 13.8565 18.2625 15.637 16.9497 16.9497C15.637 18.2625 13.8565 19 12 19C10.1435 19 8.36301 18.2625 7.05025 16.9497C5.7375 15.637 5 13.8565 5 12V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19V23M12 23H9M12 23H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )
          )}
        </button>
        
        {/* Timer display when recording */}
        {isRecording && (
          <div style={{
            position: 'absolute',
            ...(isMobile ? {
              bottom: '85px',
              left: '50%',
              transform: 'translateX(-50%)'
            } : {
              top: '-50px',
              right: '0',
            }),
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
          ...(isMobile ? {
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 'calc(100% - 40px)'
          } : {
            position: 'fixed',
            bottom: '160px',
            right: '30px',
          }),
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '15px 20px' : '20px 30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            width: isMobile ? '30px' : '40px',
            height: isMobile ? '30px' : '40px',
            border: '3px solid #667eea',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0
          }}></div>
          <div>
            <p style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: '#333' }}>
              Transcribing...
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: isMobile ? '12px' : '13px', color: '#666' }}>
              Processing your voice message
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceRecorder;


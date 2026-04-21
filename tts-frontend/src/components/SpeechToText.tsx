//ttsfrontend/srs/components/SpeechToText.tsx
import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const SpeechToText: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size < 1000) {
          setError("L'enregistrement est trop court");
          setIsLoading(false);
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');

        try {
          const response = await axios.post(`${API_URL}/stt/record`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000
          });

          if (response.data.transcript) {
            setTranscript(response.data.transcript);
          } else if (response.data.error) {
            setError(response.data.error);
          } else {
            setTranscript("Aucune transcription reçue");
          }

        } catch (err: any) {
          setError(err.response?.data?.detail || err.message);
        } finally {
          setIsLoading(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

    } catch (error) {
      setError("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setTranscript('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/stt/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.transcript) {
        setTranscript(response.data.transcript);
      } else if (response.data.error) {
        setError(response.data.error);
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">🎙️ Speech to Text</div>
      
      {/* Bouton Micro */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: isRecording ? '#f44336' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '50px',
            transition: 'all 0.3s'
          }}
        >
          {isRecording ? '🔴' : '🎙️'}
        </button>
        <p style={{ marginTop: '15px' }}>
          {isRecording ? '🔴 Relâchez pour arrêter' : '🎤 Appuyez et maintenez pour parler'}
        </p>
      </div>

      {/* Upload Fichier */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
          style={{ display: 'none' }}
          id="audio-upload"
        />
        <label htmlFor="audio-upload" style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#4CAF50',
          color: 'white',
          borderRadius: '30px',
          cursor: 'pointer'
        }}>
          📤 Uploader un fichier audio
        </label>
      </div>

      {/* Chargement */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>⏳ Transcription en cours...</p>
        </div>
      )}

      {/* Résultat */}
      {transcript && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h4>📝 Transcription :</h4>
          <p style={{ fontSize: '16px' }}>{transcript}</p>
          <button onClick={() => navigator.clipboard.writeText(transcript)}>
            📋 Copier
          </button>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#fee',
          color: 'red',
          borderRadius: '8px'
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default SpeechToText;
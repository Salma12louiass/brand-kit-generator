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

  // Version SIMPLIFIÉE - Enregistrement direct
  const startRecording = async () => {
    try {
      console.log("🎤 1. Demande micro...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ 2. Micro OK");
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`📦 3. Chunk: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log(`🛑 4. Stop, ${audioChunksRef.current.length} chunks`);
        
        // Créer le blob audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`📦 5. Blob: ${audioBlob.size} bytes`);
        
        if (audioBlob.size < 1000) {
          setError("L'enregistrement est trop court");
          setIsLoading(false);
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // Envoyer directement le blob sans conversion
        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        
        try {
          console.log("📤 6. Envoi au backend...");
          const response = await axios.post(`${API_URL}/stt/record`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000
          });
          
          console.log("✅ 7. Réponse:", response.data);
          
          if (response.data.success) {
            setTranscript(response.data.transcript);
          } else {
            setError("Erreur de transcription");
          }
        } catch (err: any) {
          console.error("❌ 8. Erreur:", err);
          setError(err.response?.data?.detail || err.message);
        } finally {
          setIsLoading(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("🔴 9. Enregistrement actif");
      
    } catch (error) {
      console.error("❌ Erreur micro:", error);
      setError("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    console.log("🛑 Stop demandé");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload fichier
  const handleFileUpload = async (file: File) => {
    console.log(`📁 Fichier: ${file.name}, ${file.size} bytes`);
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/stt/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setTranscript(response.data.transcript);
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
      
      {/* Zone d'enregistrement */}
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
            background: isRecording ? '#f44336' : '#667eea',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '50px',
            transition: 'all 0.3s',
            boxShadow: isRecording ? '0 0 20px rgba(244,67,54,0.5)' : '0 4px 15px rgba(102,126,234,0.3)'
          }}
        >
          {isRecording ? '🔴' : '🎙️'}
        </button>
        <p style={{ marginTop: '15px', color: '#666' }}>
          {isRecording ? '🔴 Enregistrement... Relâchez pour arrêter' : '🎤 Appuyez et maintenez pour parler'}
        </p>
      </div>
      
      {/* Upload fichier */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
          style={{ display: 'none' }}
          id="audio-upload"
        />
        <label 
          htmlFor="audio-upload"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#4CAF50',
            color: 'white',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📤 Ou uploader un fichier audio
        </label>
      </div>
      
      {/* Résultat */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '30px', 
            height: '30px', 
            border: '3px solid #f0f0f0', 
            borderTop: '3px solid #667eea', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }}></div>
          <p>Transcription en cours...</p>
        </div>
      )}
      
      {transcript && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h4>📝 Transcription :</h4>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{transcript}</p>
          <button
            onClick={() => navigator.clipboard.writeText(transcript)}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            📋 Copier
          </button>
        </div>
      )}
      
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#fee',
          borderLeft: '4px solid #f44336',
          color: '#d32f2f'
        }}>
          ❌ {error}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SpeechToText;
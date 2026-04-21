//ttsfrontend/srs/components/SpeechToSpeech.tsx
import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const SpeechToSpeech: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cleanedAudioUrl, setCleanedAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  
  const cleanedAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.webm'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      setError('Format non supporté. Utilisez MP3, WAV, M4A, OGG ou WebM');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    setCleanedAudioUrl(null);
    
    if (originalAudioUrl) {
      URL.revokeObjectURL(originalAudioUrl);
    }
    setOriginalAudioUrl(URL.createObjectURL(file));
  };

  const handleClean = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier audio');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API_URL}/speech-to-speech/clean`, formData, {
        responseType: 'blob',
        timeout: 120000,
      });

      if (cleanedAudioUrl) {
        URL.revokeObjectURL(cleanedAudioUrl);
      }
      
      const url = URL.createObjectURL(response.data);
      setCleanedAudioUrl(url);
      
      setTimeout(() => {
        if (cleanedAudioRef.current) {
          cleanedAudioRef.current.play();
        }
      }, 100);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du nettoyage');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAudio = () => {
    if (cleanedAudioUrl) {
      const link = document.createElement('a');
      link.href = cleanedAudioUrl;
      link.download = `cleaned_${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'audio'}.wav`;
      link.click();
    }
  };

  const resetForm = () => {
    if (originalAudioUrl) {
      URL.revokeObjectURL(originalAudioUrl);
    }
    if (cleanedAudioUrl) {
      URL.revokeObjectURL(cleanedAudioUrl);
    }
    setSelectedFile(null);
    setCleanedAudioUrl(null);
    setOriginalAudioUrl(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🎧 Nettoyage Audio IA</span>
        {selectedFile && (
          <button
            onClick={resetForm}
            style={{
              padding: '6px 12px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 Nouveau fichier
          </button>
        )}
      </div>
      
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
        Supprimez automatiquement le bruit de fond, l'écho et améliorez la qualité de votre voix
      </p>

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDragLeave}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#667eea' : '#ccc'}`,
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragActive ? '#f0f0ff' : '#f8f9ff',
            transition: 'all 0.3s',
            marginBottom: '20px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '64px', marginBottom: '15px' }}>📤</div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
            Cliquez ou glissez un fichier audio
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            MP3, WAV, M4A, OGG, WebM
          </div>
        </div>
      ) : (
        <>
          <div style={{
            background: '#f0f7ff',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <span style={{ fontWeight: 600 }}>📁 {selectedFile.name}</span>
              <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                ({formatFileSize(selectedFile.size)})
              </span>
            </div>
            <button
              onClick={resetForm}
              style={{
                padding: '6px 12px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Changer
            </button>
          </div>

          {originalAudioUrl && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                🔊 Audio original :
              </p>
              <audio controls src={originalAudioUrl} style={{ width: '100%' }} />
            </div>
          )}

          <button
            onClick={handleClean}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              marginBottom: '20px'
            }}
          >
            {isLoading ? '⏳ Nettoyage en cours...' : '🧹 Nettoyer l\'audio'}
          </button>

          {cleanedAudioUrl && (
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              borderRadius: '16px',
              padding: '20px',
              marginTop: '10px'
            }}>
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#2e7d32' }}>
                ✅ Audio nettoyé :
              </p>
              <audio
                ref={cleanedAudioRef}
                controls
                src={cleanedAudioUrl}
                style={{ width: '100%', marginBottom: '15px' }}
              />
              <button
                onClick={downloadAudio}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                📥 Télécharger audio nettoyé
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#fee',
          borderLeft: '4px solid #f44336',
          borderRadius: '8px',
          color: '#d32f2f'
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default SpeechToSpeech;
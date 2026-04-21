//ttsfrontend/srs/components/TextToSpeech.tsx

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

interface Voice {
  id: string;
  name: string;
  gender: string;
  type?: string;
}

interface CustomVoice {
  id: string;
  name: string;
  type: string;
  filename: string;
}

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedLang, setSelectedLang] = useState('Français');
  const [selectedVoice, setSelectedVoice] = useState('fr-FR-DeniseNeural');
  const [voiceType, setVoiceType] = useState<'default' | 'custom'>('default');
  const [customVoiceId, setCustomVoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<Record<string, any>>({});
  const [currentVoices, setCurrentVoices] = useState<Voice[]>([]);
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = ['Français', 'English', 'Arabic'];

  useEffect(() => {
    loadVoices();
    loadCustomVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/voices`);
      setVoices(response.data);
      updateVoicesForLanguage('Français');
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les voix');
    }
  };

  const loadCustomVoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/custom-voices`);
      setCustomVoices(response.data);
      if (response.data.length > 0 && voiceType === 'custom') {
        setCustomVoiceId(response.data[0].id);
      }
    } catch (err) {
      console.error('Erreur chargement voix personnalisées:', err);
    }
  };

  const updateVoicesForLanguage = (lang: string) => {
    const langVoices = voices[lang] || [];
    setCurrentVoices(langVoices);
    if (langVoices.length > 0 && voiceType === 'default') {
      setSelectedVoice(langVoices[0].id);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    updateVoicesForLanguage(lang);
  };

  const handleVoiceTypeChange = (type: 'default' | 'custom') => {
    setVoiceType(type);
    if (type === 'custom' && customVoices.length > 0) {
      setCustomVoiceId(customVoices[0].id);
    }
  };

  const handleUploadVoice = async (file: File) => {
    // Vérifier le format
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/ogg'];
    const validExtensions = ['.wav', '.mp3', '.m4a', '.ogg'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExt)) {
      setError('Format non supporté. Utilisez WAV, MP3, M4A ou OGG');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingVoice(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/upload-voice`, formData);
      if (response.data.success) {
        await loadCustomVoices();
        setVoiceType('custom');
        setCustomVoiceId(response.data.voice_id);
        alert('✅ Voix uploadée avec succès ! Vous pouvez maintenant l\'utiliser.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'upload');
    } finally {
      setUploadingVoice(false);
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleUploadVoice(files[0]);
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      setError('Veuillez entrer du texte');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
  text: text,
  voice_type: voiceType,
};

if (voiceType === 'default') {
  payload.voice = selectedVoice;
} else {
  payload.custom_voice_id = customVoiceId;
}

      if (voiceType === 'default') {
        payload.voice = selectedVoice;
      } else {
        payload.custom_voice_id = customVoiceId;
      }

      console.log('📤 Envoi payload:', payload);

      const response = await axios.post(`${API_URL}/tts`, payload, {
        responseType: 'blob',
        timeout: 120000, // 2 minutes timeout pour le clonage
      });

      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la génération');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download =  `speech_${Date.now()}.${voiceType === 'custom' ? 'wav' : 'mp3'}`;
      link.click();
    }
  };

  return (
    <div className="card">
      <div className="card-title">🔊 Text to Speech</div>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
        Convert written text into natural, lifelike speech using AI voices
      </p>

      {/* Zone de texte */}
      <textarea
        className="tts-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your text here... Example: Bonjour, je suis une voix générée par intelligence artificielle."
        rows={5}
        style={{
          width: '100%',
          padding: '15px',
          border: '2px solid #e0e0e0',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          marginBottom: '20px'
        }}
      />

      {/* Type de voix - Section importante ! */}
      <div style={{ marginBottom: '25px' }}>
        <label style={{ display: 'block', marginBottom: '15px', fontWeight: 600, fontSize: '14px' }}>
          🎤 Choix de la voix :
        </label>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="voiceType"
              checked={voiceType === 'default'}
              onChange={() => handleVoiceTypeChange('default')}
            />
            <span>🎙️ Voix par défaut</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="voiceType"
              checked={voiceType === 'custom'}
              onChange={() => handleVoiceTypeChange('custom')}
            />
            <span>🎤 Ma propre voix (clonage)</span>
          </label>
        </div>
      </div>

      {/* Voix par défaut */}
      {voiceType === 'default' && (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>
              🌍 Langue
            </label>
            <select 
              value={selectedLang} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '14px'
              }}
            >
              {languages.map((lang) => (
                <option key={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' }}>
              🎤 Voix
            </label>
            <select 
              value={selectedVoice} 
              onChange={(e) => setSelectedVoice(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '14px'
              }}
            >
              {currentVoices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.gender === 'female' ? '👩' : '👨'} {voice.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Voix personnalisée - UPLOAD AUDIO */}
      {voiceType === 'custom' && (
        <div style={{
          border: `2px dashed ${dragActive ? '#667eea' : '#ccc'}`,
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '25px',
          background: dragActive ? '#f0f0ff' : '#f8f9ff',
          transition: 'all 0.3s'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
          <p style={{ marginBottom: '15px', fontWeight: 600, textAlign: 'center' }}>
            🎙️ Clonez votre voix
          </p>
          
          {/* Liste des voix existantes */}
          {customVoices.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>Voix disponibles :</label>
              <select
                value={customVoiceId || ''}
                onChange={(e) => setCustomVoiceId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '8px',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0',
                  fontSize: '14px'
                }}
              >
                {customVoices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    🎤 {voice.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Zone d'upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? '#667eea' : '#aaa'}`,
              borderRadius: '12px',
              padding: '30px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'white',
              transition: 'all 0.3s'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={(e) => e.target.files && handleUploadVoice(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>
              {uploadingVoice ? '⏳' : '📤'}
            </div>
            <div style={{ fontWeight: 500, marginBottom: '5px' }}>
              {uploadingVoice ? 'Upload en cours...' : 'Cliquez ou glissez un fichier audio'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              WAV, MP3, M4A, OGG - Minimum 3 secondes
            </div>
          </div>
          
          <p style={{ fontSize: '11px', color: '#999', marginTop: '15px', textAlign: 'center' }}>
            💡 Astuce : Enregistrez-vous pendant 5-10 secondes pour un meilleur résultat
          </p>
        </div>
      )}

      {/* Bouton de génération */}
      <button 
        onClick={generateSpeech} 
        disabled={isLoading || !text.trim()}
        style={{
          width: '100%',
          padding: '14px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: isLoading || !text.trim() ? 'not-allowed' : 'pointer',
          opacity: isLoading || !text.trim() ? 0.6 : 1,
          transition: 'transform 0.2s'
        }}
      >
        {isLoading ? '⏳ Génération en cours...' : '🔊 GENERER LA VOIX'}
      </button>

      {/* Lecteur audio */}
      {audioUrl && (
        <div style={{
          marginTop: '25px',
          paddingTop: '25px',
          borderTop: '2px solid #f0f0f0'
        }}>
          <audio ref={audioRef} controls src={audioUrl} style={{ width: '100%', marginBottom: '15px' }} />
          <button 
            onClick={downloadAudio}
            style={{
              width: '100%',
              padding: '12px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📥 Télécharger MP3
          </button>
        </div>
      )}

      {/* Message d'erreur */}
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

export default TextToSpeech;
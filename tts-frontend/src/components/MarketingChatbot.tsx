import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const MarketingChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Bonjour ! Je suis votre consultant marketing IA.\n\nJe peux vous aider à créer des stratégies marketing pour n'importe quelle entreprise.\n\n**Dites-moi simplement :**\n- Le nom de votre entreprise\n- Votre secteur d'activité\n- Votre objectif\n\nExemple : \"Je suis Devosoft, une agence web au Maroc. Je veux augmenter mes ventes de 50%.\"",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const question = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: question,
        history: []
      });
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '❌ Désolé, une erreur est survenue. Vérifiez que le serveur est démarré.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      text: "💬 Conversation réinitialisée. Parlez-moi de votre entreprise !",
      isUser: false,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>💬 Consultant Marketing IA</span>
        <button
          onClick={clearChat}
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
          🗑️ Nouvelle conversation
        </button>
      </div>

      <div style={{
        background: '#f8f9fa',
        borderRadius: '12px',
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              <div style={{
                background: msg.isUser ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: msg.isUser ? 'white' : '#333',
                padding: '12px 16px',
                borderRadius: msg.isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {msg.text}
                </div>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#999',
                marginTop: '4px',
                textAlign: msg.isUser ? 'right' : 'left'
              }}>
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div style={{ background: 'white', padding: '12px 16px', borderRadius: '20px' }}>
                🤔 Réflexion en cours...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '15px', borderTop: '1px solid #e0e0e0', background: 'white' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question marketing..."
              rows={2}
              style={{
                flex: 1,
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                alignSelf: 'flex-end'
              }}
            >
              Envoyer
            </button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#999' }}>
            💡 Exemples : "Je suis une boulangerie, comment attirer plus de clients ?" | "Stratégie Instagram pour une agence web"
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingChatbot;
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TextToText from './components/TextToText';
import TextToSpeech from './components/TextToSpeech';
import SpeechToText from './components/SpeechToText';
import './App.css';

type MenuItem = 'text-to-text' | 'text-to-speech' | 'speech-to-text';

function App() {
  const [activeMenu, setActiveMenu] = useState<MenuItem>('text-to-speech');

  const renderContent = () => {
    switch (activeMenu) {
      case 'text-to-text':
        return <TextToText />;
      case 'text-to-speech':
        return <TextToSpeech />;
      case 'speech-to-text':
        return <SpeechToText />;
      default:
        return <TextToSpeech />;
    }
  };

  return (
    <div className="app">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <main className="main-content">
        <header className="main-header">
          <h1>AdGenerate.ai</h1>
          <p>AI-Powered Content Generation Platform</p>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
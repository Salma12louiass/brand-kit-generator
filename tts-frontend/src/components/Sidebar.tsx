import React from 'react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: 'text-to-text' | 'text-to-speech' | 'speech-to-text' | 'speech-to-speech') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, setActiveMenu }) => {
  const menuItems = [
    {
      id: 'text-to-text' as const,
      icon: '📝',
      label: 'Text to Text',
      subtitle: 'Generate & Transform',
    },
    {
      id: 'text-to-speech' as const,
      icon: '🔊',
      label: 'Text to Speech',
      subtitle: 'Convert text to voice',
    },
    {
      id: 'speech-to-text' as const,
      icon: '🎙️',
      label: 'Speech to Text',
      subtitle: 'Transcribe audio',
    },
    {
    id: 'speech-to-speech' as const,
    icon: '🎧',
    label: 'Speech to Speech',
    subtitle: 'Clean & Enhance audio',
  },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <h2>AdGenerate.ai</h2>
        <p>AI Generation Platform</p>
      </div>
      <div className="menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
            onClick={() => setActiveMenu(item.id)}
          >
            <div className="menu-icon">{item.icon}</div>
            <div>
              <div className="menu-label">{item.label}</div>
              <div className="menu-subtitle">{item.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
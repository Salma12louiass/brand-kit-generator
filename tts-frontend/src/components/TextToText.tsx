import React, { useState } from 'react';

const TextToText: React.FC = () => {
  // ============ ÉTATS ============
  const [companyName, setCompanyName] = useState('');
  const [companyActivity, setCompanyActivity] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ============ GÉNÉRER LE TEXTE PUBLICITAIRE ============
  const generateAdText = async () => {
    if (!companyName.trim()) {
      setError('Veuillez entrer le nom de l\'entreprise');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedText('');

    try {
      // Simulation d'appel API (à remplacer par ton vrai backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Templates de textes publicitaires
      const templates = [
        `✨ **${companyName}** : Votre partenaire de confiance !

${companyActivity ? `Spécialisé dans ${companyActivity},` : ''} nous mettons notre expertise à votre service pour vous accompagner vers la réussite.

${targetAudience ? `Que vous soyez ${targetAudience},` : 'Que vous soyez particulier ou professionnel,'} nos solutions sont adaptées à vos besoins.

🔥 **Prêt à passer à l'action ?**
Contactez-nous dès aujourd'hui pour une consultation gratuite !

#${companyName.replace(/\s/g, '')} #Innovation #Qualité`,

        `🚀 **Découvrez ${companyName}**

${companyActivity ? `Leader dans ${companyActivity},` : 'Acteur majeur de son secteur,'} ${companyName} révolutionne votre quotidien avec des solutions innovantes.

✓ Services de qualité
✓ Équipe réactive
✓ Tarifs compétitifs

${targetAudience ? `🎯 ${targetAudience}, cette offre est pour vous !` : '🎯 Une offre spéciale vous attend !'}

📞 **Contactez-nous maintenant !**
Offre valable jusqu'à la fin du mois.`,

        `💡 **${companyName} innove pour vous**

${companyActivity ? `Avec ${companyName}, bénéficiez d'une expertise unique en ${companyActivity}.` : `Avec ${companyName}, bénéficiez de solutions sur mesure.`}

Notre engagement : votre satisfaction est notre priorité.

${targetAudience ? `Plus de 500 ${targetAudience} nous font déjà confiance.` : 'Des centaines de clients satisfaits nous recommandent.'}

👉 **Essayez nos services sans engagement**
Premier devis offert ! 
📧 contact@${companyName.replace(/\s/g, '').toLowerCase()}.com`,

        `🎯 **${companyName}** : La solution qui vous ressemble

${companyActivity ? `Expert en ${companyActivity},` : ''} nous comprenons vos besoins et y répondons avec précision.

✓ Approche personnalisée
✓ Résultats garantis
✓ Accompagnement sur mesure

${targetAudience ? `Spécialement conçu pour ${targetAudience}.` : ''}

🟢 **Profitez d'une offre découverte**
Premier service offert - Sans engagement

#${companyName.replace(/\s/g, '')} #SurMesure #Expertise`
      ];
      
      setGeneratedText(templates[Math.floor(Math.random() * templates.length)]);
      
    } catch (err) {
      setError('Erreur lors de la génération');
    } finally {
      setIsLoading(false);
    }
  };

  // ============ COPIER LE TEXTE ============
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    alert('✅ Texte copié dans le presse-papier !');
  };

  // ============ EXPORTER EN FICHIER TXT ============
  const exportToTxt = () => {
    const blob = new Blob([generatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pub_${companyName.replace(/\s/g, '')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============ EFFACER ============
  const clearAll = () => {
    setCompanyName('');
    setCompanyActivity('');
    setTargetAudience('');
    setGeneratedText('');
    setError('');
  };

  return (
    <div className="card">
      <div className="card-title">📢 Generate - Textes Publicitaires</div>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
        Créez des textes publicitaires percutants pour votre entreprise
      </p>

      {/* Formulaire */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
          🏢 Nom de l'entreprise <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Ex: Devosoft, SmartMarketing, TechSolutions..."
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
          🎯 Activité / Services (optionnel)
        </label>
        <input
          type="text"
          value={companyActivity}
          onChange={(e) => setCompanyActivity(e.target.value)}
          placeholder="Ex: Développement web, Marketing digital, Formation..."
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
          👥 Public cible (optionnel)
        </label>
        <input
          type="text"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="Ex: Startups, Grandes entreprises, Particuliers..."
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Bouton Générer */}
      <button
        onClick={generateAdText}
        disabled={isLoading || !companyName.trim()}
        style={{
          width: '100%',
          padding: '14px',
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
        {isLoading ? '⏳ Génération en cours...' : '✨ Générer le texte publicitaire'}
      </button>

      {/* Résultat */}
      {generatedText && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ margin: 0, color: '#667eea' }}>📝 Votre texte publicitaire :</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: '6px 12px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 Copier
              </button>
              <button
                onClick={exportToTxt}
                style={{
                  padding: '6px 12px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                💾 Exporter
              </button>
            </div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
          }}>
            {generatedText.split('\n').map((line, i) => (
              <p key={i} style={{ margin: '8px 0' }}>{line}</p>
            ))}
          </div>
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

      {/* Bouton effacer */}
      {(generatedText || companyName || companyActivity || targetAudience) && (
        <button
          onClick={clearAll}
          style={{
            marginTop: '20px',
            padding: '10px',
            width: '100%',
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          🗑️ Tout effacer
        </button>
      )}

      {/* Tips */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f7ff', borderRadius: '12px' }}>
        <p style={{ fontSize: '12px', color: '#667eea', margin: 0 }}>
          💡 <strong>Conseils :</strong>
        </p>
        <ul style={{ fontSize: '11px', color: '#666', marginTop: '8px', paddingLeft: '20px' }}>
          <li>Plus les informations sont précises, meilleur sera le résultat</li>
          <li>Le texte généré est prêt à être utilisé sur vos réseaux sociaux</li>
          <li>Vous pouvez copier le texte ou l'exporter en fichier TXT</li>
        </ul>
      </div>
    </div>
  );
};

export default TextToText;
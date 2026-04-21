# 🚀 AdGenerate.ai - AI Audio & Marketing Platform

## 📌 Description

AdGenerate.ai est une plateforme SaaS basée sur l’intelligence artificielle permettant de :

* 🎤 Générer de la voix (Text-to-Speech)
* 🧠 Transcrire l’audio en texte (Speech-to-Text)
* 🎧 Nettoyer l’audio (qualité studio)
* 🗣️ Cloner des voix (Voice Cloning)
* 🤖 Générer du contenu marketing avec un chatbot IA

---

## 🏗️ Architecture du projet

```
brand-kit-generator/
│
├── tts-backend/        # API FastAPI (Python)
└── tts-frontend/       # Interface React (TypeScript)
```

---

## 🧠 Technologies utilisées

### Backend

* FastAPI
* Uvicorn
* Whisper (OpenAI)
* Edge-TTS (Microsoft)
* XTTS-v2 (Coqui AI)
* DeepFilterNet
* Ollama (phi3:mini)
* PyTorch

### Frontend

* React + TypeScript
* Vite
* Axios

---

## ⚙️ Installation

### 1️⃣ Backend

```bash
cd tts-backend

python -m venv venv
venv\Scripts\activate

pip install --upgrade pip
pip install fastapi uvicorn edge-tts openai-whisper
pip install TTS==0.22.0
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install noisereduce scipy soundfile pydub deepfilternet ollama python-multipart
```

---

### 2️⃣ Frontend

```bash
cd tts-frontend

npm install
npm install axios
npm run dev
```

---

## 🤖 Téléchargement des modèles

### 🎙️ Whisper (STT)

```bash
python -c "import whisper; whisper.load_model('tiny')"
```

---

### 🗣️ XTTS-v2 (Voice Cloning)

```bash
python -c "from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2', gpu=False)"
```

📦 Modèle officiel :
👉 https://huggingface.co/coqui/XTTS-v2

---

### 🤖 Ollama (Chatbot)

Installer Ollama :
👉 https://ollama.com/download

Puis :

```bash
ollama pull phi3:mini
```

📦 Modèle :
👉 https://ollama.com/library/phi3

---

### 🎧 DeepFilterNet (Audio Cleaning)

```bash
python -c "from df.enhance import init_df; init_df()"
```

📦 Repo officiel :
👉 https://github.com/Rikorose/DeepFilterNet

---

## 🚀 Lancement

### Terminal 1 (Chatbot)

```bash
ollama serve
```

### Terminal 2 (Backend)

```bash
cd tts-backend
venv\Scripts\activate
python main_edge.py
```

### Terminal 3 (Frontend)

```bash
cd tts-frontend
npm run dev
```

---

## 🌐 Accès

* Frontend → http://localhost:5173
* API Docs → http://localhost:8000/docs

---

## 🔗 API Endpoints

| Méthode | Endpoint                    | Description      |
| ------- | --------------------------- | ---------------- |
| GET     | /api/voices                 | Liste des voix   |
| POST    | /api/tts                    | Génération audio |
| POST    | /api/stt/upload             | Transcription    |
| POST    | /api/speech-to-speech/clean | Nettoyage audio  |
| POST    | /api/chat                   | Chatbot          |

---

## 📊 Fonctionnalités

### 🎤 Text-to-Speech

* Voix Microsoft (Edge-TTS)
* Clonage vocal (XTTS-v2)

### 🧠 Speech-to-Text

* Whisper (multilingue)

### 🎧 Nettoyage Audio

* DeepFilterNet + Noisereduce
* Qualité studio

### 🤖 Chatbot

* IA locale (phi3 via Ollama)
* Conseils marketing

---

## ⚠️ Important

Les dossiers suivants sont ignorés (non upload sur GitHub) :

```
outputs/
uploads/
models/
voice_clones/
```

---

## 📦 Taille des modèles

| Modèle        | Taille  |
| ------------- | ------- |
| Whisper       | 72 MB   |
| XTTS-v2       | ~2.5 GB |
| phi3:mini     | ~2.5 GB |
| DeepFilterNet | ~500 MB |

---

## 👨‍💻 Auteur

Salma Louiass

---

## 💡 Future Improvements

* Déploiement SaaS (Vercel + Render)
* Authentification utilisateurs
* API publique
* Dashboard analytics

---

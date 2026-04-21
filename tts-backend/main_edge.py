# /tts-backend/main_edge.py
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
import whisper
import uuid
import os
import logging
import subprocess
import shutil

import noisereduce as nr
import numpy as np
from df.enhance import enhance, init_df
from df.io import load_audio, save_audio
from pydub import AudioSegment
import soundfile as sf

from fastapi import UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
import os, uuid

from df.enhance import enhance, init_df
from df.io import load_audio, save_audio
from pydub import AudioSegment
import ollama
from TTS.api import TTS
import torch

# ============ CONFIGURATION ============
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dossiers
OUTPUT_DIR = "outputs"
UPLOAD_DIR = "uploads"
VOICE_CLONES_DIR = "voice_clones"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VOICE_CLONES_DIR, exist_ok=True)

# ============ WHISPER ============
print("🔄 Chargement de Whisper...")
whisper_model = whisper.load_model("tiny")
print("✅ Whisper chargé!")

# ============ XTTS-v2 (CLONAGE VOCAL) ============
print("🔄 Chargement de XTTS-v2 (clonage vocal)...")
try:
    xtts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
    print("✅ XTTS-v2 chargé!")
except Exception as e:
    print(f"⚠️ XTTS-v2 non disponible: {e}")
    xtts_model = None

# ============ OLLAMA ============
print("🔄 Vérification d'Ollama...")
try:
    ollama.list()
    print("✅ Ollama est prêt!")
except:
    print("⚠️ Ollama non trouvé")

# ============ VOIX ============
class TTSRequest(BaseModel):
    text: str
    voice: str = "fr-FR-DeniseNeural"
    voice_type: str = "default"
    custom_voice_id: str = None

VOICES = {
    "Français": [
        {"id": "fr-FR-DeniseNeural", "name": "Denise", "gender": "female"},
        {"id": "fr-FR-HenriNeural", "name": "Henri", "gender": "male"},
    ],
    "English": [
        {"id": "en-US-JennyNeural", "name": "Jenny", "gender": "female"},
        {"id": "en-US-GuyNeural", "name": "Guy", "gender": "male"},
    ],
    "Arabic": [
        {"id": "ar-EG-SalmaNeural", "name": "Salma", "gender": "female"},
        {"id": "ar-EG-ShakirNeural", "name": "Shakir", "gender": "male"},
    ],
}

class ChatRequest(BaseModel):
    message: str
    history: list = []

# ============ ROUTES ============
@app.get("/api/voices")
def get_voices():
    return VOICES

@app.get("/api/custom-voices")
def get_custom_voices():
    custom_voices = []
    for filename in os.listdir(VOICE_CLONES_DIR):
        if filename.endswith(('.wav', '.mp3', '.m4a', '.ogg')):
            voice_id = filename.split('.')[0]
            custom_voices.append({
                "id": voice_id,
                "name": f"Ma voix ({voice_id[:6]}...)",
                "type": "custom",
                "filename": filename
            })
    return custom_voices

@app.post("/api/upload-voice")
async def upload_voice(file: UploadFile = File(...)):
    try:
        voice_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1].lower()
        voice_path = os.path.join(VOICE_CLONES_DIR, f"{voice_id}{ext}")
        content = await file.read()
        with open(voice_path, "wb") as f:
            f.write(content)
        return {"success": True, "voice_id": voice_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ TEXT TO SPEECH AVEC CLONAGE ============
@app.post("/api/tts")
async def generate_speech(request: TTSRequest):
    try:
        if request.voice_type == "custom" and request.custom_voice_id and xtts_model:
            # ===== CLONAGE VOCAL =====
            voice_file = None
            for f in os.listdir(VOICE_CLONES_DIR):
                if f.startswith(request.custom_voice_id):
                    voice_file = os.path.join(VOICE_CLONES_DIR, f)
                    break
            
            if not voice_file:
                raise HTTPException(status_code=404, detail="Voix non trouvée")
            
            filename = f"{uuid.uuid4()}.wav"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            logger.info(f"🎤 Clonage vocal avec XTTS-v2")
            
            # Détection langue
            lang = "fr"  # par défaut
            for lang_name, voices in VOICES.items():
                for v in voices:
                    if v["id"] == request.voice:
                        if lang_name == "English":
                            lang = "en"
                        elif lang_name == "Arabic":
                            lang = "ar"
                        break
            
            xtts_model.tts_to_file(
                text=request.text,
                speaker_wav=voice_file,
                language=lang,
                file_path=filepath
            )
            
            return FileResponse(filepath, media_type="audio/wav", filename=filename)
            
        else:
            # ===== VOIX PAR DÉFAUT =====
            filename = f"{uuid.uuid4()}.mp3"
            filepath = os.path.join(OUTPUT_DIR, filename)
            communicate = edge_tts.Communicate(request.text, request.voice)
            await communicate.save(filepath)
            return FileResponse(filepath, media_type="audio/mpeg", filename=filename)
            
    except Exception as e:
        logger.error(f"Erreur TTS: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ SPEECH TO TEXT ============
@app.post("/api/stt/upload")
async def transcribe_uploaded_file(file: UploadFile = File(...)):
    temp_path = None
    try:
        ext = os.path.splitext(file.filename)[1].lower()
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{uuid.uuid4()}{ext}")
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        result = whisper_model.transcribe(temp_path, fp16=False)
        return {"success": True, "transcript": result["text"]}
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/stt/record")
async def transcribe_recording(file: UploadFile = File(...)):
    filepath = None
    try:
        filepath = os.path.join(UPLOAD_DIR, f"recording_{uuid.uuid4()}.webm")
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        result = whisper_model.transcribe(filepath, fp16=False)
        return {"success": True, "transcript": result["text"]}
    finally:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)

# ============ SPEECH TO SPEECH (Nettoyage audio) ============

# Charger DeepFilterNet une seule fois
print("🔄 Chargement de DeepFilterNet...")
try:
    model, df_state, _ = init_df(model_base_dir="models/DeepFilterNet3")
    print("✅ DeepFilterNet chargé!")
    DF_AVAILABLE = True
except Exception as e:
    print(f"⚠️ DeepFilterNet non disponible: {e}")
    DF_AVAILABLE = False

def convert_to_wav(input_bytes: bytes) -> str:
    """Convertit n'importe quel fichier audio en WAV 16kHz mono"""
    temp_input = os.path.join(UPLOAD_DIR, f"temp_{uuid.uuid4()}.webm")
    with open(temp_input, "wb") as f:
        f.write(input_bytes)
    
    wav_path = temp_input.replace('.webm', '.wav')
    try:
        audio = AudioSegment.from_file(temp_input)
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(wav_path, format="wav")
    except:
        shutil.copy(temp_input, wav_path)
    
    os.remove(temp_input)
    return wav_path

def enhance_audio_studio(input_path: str) -> str:
    """Pipeline complet pour audio qualité studio"""
    
    output_path = os.path.join(OUTPUT_DIR, f"studio_{uuid.uuid4()}.wav")
    
    # Étape 1: DeepFilterNet (suppression bruit IA)
    if DF_AVAILABLE:
        try:
            audio, sr = load_audio(input_path, sr=df_state.sr())
            enhanced = enhance(model, df_state, audio)
            temp_path = output_path.replace('.wav', '_temp.wav')
            save_audio(temp_path, enhanced, df_state.sr())
        except Exception as e:
            logger.warning(f"DeepFilterNet échoué: {e}")
            temp_path = input_path
    else:
        temp_path = input_path
    
    # Étape 2: noisereduce (réduction supplémentaire)
    try:
        sr, data = sf.read(temp_path)
        
        # Convertir en float
        if data.dtype != np.float32:
            data = data.astype(np.float32)
        
        # Extraire échantillon de bruit (début du fichier)
        noise_sample = data[:int(sr * 0.3)]
        
        # Réduction de bruit
        reduced = nr.reduce_noise(
            y=data,
            sr=sr,
            y_noise=noise_sample,
            prop_decrease=0.85,
            stationary=False
        )
        
        # Étape 3: Normalisation et amplification
        # Augmenter le volume
        max_val = np.max(np.abs(reduced))
        if max_val > 0:
            reduced = reduced / max_val * 0.95
        
        # Appliquer un EQ simple (boost voix)
        from scipy import signal
        b, a = signal.butter(4, [300, 3400], 'bandpass', fs=sr)
        reduced = signal.filtfilt(b, a, reduced)
        
        # Sauvegarder
        sf.write(output_path, reduced, sr)
        
    except Exception as e:
        logger.warning(f"noisereduce échoué: {e}")
        shutil.copy(temp_path, output_path)
    
    # Nettoyer fichiers temporaires
    if temp_path != input_path and os.path.exists(temp_path):
        os.remove(temp_path)
    
    return output_path

@app.post("/api/speech-to-speech/clean")
async def clean_audio(file: UploadFile = File(...)):
    """Nettoie un fichier audio - Qualité Studio"""
    try:
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.wav', '.mp3', '.m4a', '.ogg', '.webm']:
            raise HTTPException(status_code=400, detail="Format non supporté")
        
        content = await file.read()
        input_path = convert_to_wav(content)
        
        # Pipeline complet
        output_path = enhance_audio_studio(input_path)
        
        # Nettoyer
        os.remove(input_path)
        
        return FileResponse(
            output_path,
            media_type="audio/wav",
            filename="studio_quality_audio.wav"
        )
        
    except Exception as e:
        logger.error(f"Erreur nettoyage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ CHATBOT ============
@app.post("/api/chat")
async def chat_marketing(request: ChatRequest):
    try:
        system_prompt = """Tu es un expert en marketing digital.
Tu réponds en français, de manière courte et pratique.
Tu donnes des conseils actionnables (max 150 mots)."""

        response = ollama.chat(
            model="phi3:mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            options={"temperature": 0.7, "num_predict": 250}
        )
        return {"response": response["message"]["content"]}
    except Exception as e:
        return {"response": f"❌ Erreur: {e}"}

# ============ HEALTH ============
@app.get("/api/health")
def health():
    return {"status": "ok", "whisper": whisper_model is not None, "xtts": xtts_model is not None}

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 AdGenerate.ai - Version avec clonage vocal XTTS-v2")
    print("=" * 60)
    print("✅ Text to Speech (Edge-TTS + XTTS clonage)")
    print("✅ Speech to Text (Whisper)")
    print("✅ Speech to Speech (Nettoyage audio)")
    print("✅ Chatbot (Ollama)")
    print("=" * 60)
    print("🌐 Serveur: http://localhost:8000")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)
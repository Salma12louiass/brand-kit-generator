# main_edge.py - Version LÉGÈRE avec clonage vocal
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
import whisper
import uuid
import os
import logging
import requests
import base64
import asyncio

# ============ CONFIGURATION ============
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuration CORS
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

# ============ TA CLÉ API HUGGING FACE ============
import os

HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
# ============ CHARGEMENT WHISPER (pour STT) ============
print("🔄 Chargement du modèle Whisper...")
try:
    whisper_model = whisper.load_model("tiny")  # Modèle tiny = plus léger
    print("✅ Whisper chargé avec succès!")
except Exception as e:
    print(f"❌ Erreur chargement Whisper: {e}")
    whisper_model = None

# ============ VOIX PRÉDÉFINIES ============
class TTSRequest(BaseModel):
    text: str
    voice: str = "fr-FR-DeniseNeural"
    voice_type: str = "default"
    custom_voice_id: str = None

VOICES = {
    "Français": [
        {"id": "fr-FR-DeniseNeural", "name": "Denise", "gender": "female"},
        {"id": "fr-FR-HenriNeural", "name": "Henri", "gender": "male"},
        {"id": "fr-FR-EloiseNeural", "name": "Eloise", "gender": "female"},
    ],
    "English": [
        {"id": "en-US-JennyNeural", "name": "Jenny", "gender": "female"},
        {"id": "en-US-GuyNeural", "name": "Guy", "gender": "male"},
        {"id": "en-US-AriaNeural", "name": "Aria", "gender": "female"},
    ],
    "Arabic": [
        {"id": "ar-EG-SalmaNeural", "name": "Salma", "gender": "female"},
        {"id": "ar-EG-ShakirNeural", "name": "Shakir", "gender": "male"},
        {"id": "ar-SA-ZariyahNeural", "name": "Zariyah", "gender": "female"},
    ],
}

@app.get("/api/voices")
def get_voices():
    return VOICES

# ============ UPLOAD VOIX POUR CLONAGE ============
@app.post("/api/upload-voice")
async def upload_voice(file: UploadFile = File(...)):
    """Uploader un fichier audio pour cloner une voix"""
    try:
        voice_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in ['.wav', '.mp3', '.m4a', '.ogg']:
            raise HTTPException(status_code=400, detail="Format non supporté. Utilisez WAV, MP3, M4A ou OGG")
        
        voice_filename = f"{voice_id}{file_extension}"
        voice_path = os.path.join(VOICE_CLONES_DIR, voice_filename)
        
        content = await file.read()
        with open(voice_path, "wb") as f:
            f.write(content)
        
        logger.info(f"✅ Voix uploadée: {voice_filename}")
        
        return JSONResponse({
            "success": True,
            "voice_id": voice_id,
            "filename": voice_filename,
            "message": "Voix uploadée avec succès!"
        })
        
    except Exception as e:
        logger.error(f"Erreur upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/custom-voices")
def get_custom_voices():
    """Récupérer la liste des voix personnalisées"""
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

# ============ CLONAGE VOCAL AVEC HUGGING FACE ============
def clone_voice_with_huggingface(text: str, reference_audio_path: str) -> bytes:
    """Utilise l'API Hugging Face pour le clonage vocal"""
    
    # Modèle XTTS-v2 (spécialisé dans le clonage vocal)
    API_URL = "https://api-inference.huggingface.co/models/coqui/XTTS-v2"
    
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Lire le fichier audio de référence
    with open(reference_audio_path, "rb") as f:
        audio_bytes = f.read()
    
    # Encoder l'audio en base64
    audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
    
    payload = {
        "inputs": text,
        "parameters": {
            "speaker_audio": audio_base64,
            "language": "fr"  # ou "en", "ar"
        }
    }
    
    logger.info(f"🔄 Appel API Hugging Face pour clonage vocal...")
    response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
    
    if response.status_code == 200:
        logger.info(f"✅ Clonage vocal réussi! Taille: {len(response.content)} bytes")
        return response.content
    else:
        logger.error(f"❌ API Error: {response.status_code} - {response.text}")
        raise Exception(f"Erreur API: {response.status_code}")

# ============ TTS PRINCIPAL ============
@app.post("/api/tts")
async def generate_speech(request: TTSRequest):
    try:
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        if request.voice_type == "custom" and request.custom_voice_id:
            # ===== CLONAGE VOCAL =====
            voice_file = None
            for f in os.listdir(VOICE_CLONES_DIR):
                if f.startswith(request.custom_voice_id):
                    voice_file = os.path.join(VOICE_CLONES_DIR, f)
                    break
            
            if not voice_file:
                raise HTTPException(status_code=404, detail="Voix personnalisée non trouvée")
            
            logger.info(f"🎤 Clonage vocal avec: {voice_file}")
            logger.info(f"📝 Texte à générer: {request.text[:100]}...")
            
            try:
                # Tenter le clonage avec Hugging Face
                audio_content = clone_voice_with_huggingface(request.text, voice_file)
                with open(filepath, "wb") as f:
                    f.write(audio_content)
                logger.info("✅ Clonage vocal réussi!")
                
            except Exception as e:
                logger.error(f"❌ Erreur clonage: {e}")
                # Fallback: utiliser Edge-TTS avec voix par défaut
                logger.info("⚠️ Fallback vers voix par défaut")
                communicate = edge_tts.Communicate(request.text, "fr-FR-DeniseNeural")
                await communicate.save(filepath)
            
        else:
            # ===== VOIX PAR DÉFAUT (Edge-TTS) =====
            logger.info(f"🎤 Génération voix par défaut: {request.voice}")
            communicate = edge_tts.Communicate(request.text, request.voice)
            await communicate.save(filepath)
        
        return FileResponse(
            filepath, 
            media_type="audio/mpeg",
            filename=filename
        )
        
    except Exception as e:
        logger.error(f"❌ Erreur TTS: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ SPEECH TO TEXT ============
@app.post("/api/stt/upload")
async def transcribe_uploaded_file(file: UploadFile = File(...)):
    if whisper_model is None:
        raise HTTPException(status_code=500, detail="Modèle Whisper non chargé")
    
    temp_filepath = None
    
    try:
        file_extension = os.path.splitext(file.filename)[1].lower()
        temp_filename = f"{uuid.uuid4()}{file_extension}"
        temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)
        
        content = await file.read()
        with open(temp_filepath, "wb") as f:
            f.write(content)
        
        result = whisper_model.transcribe(temp_filepath, fp16=False)
        
        if temp_filepath and os.path.exists(temp_filepath):
            os.remove(temp_filepath)
        
        return JSONResponse({
            "success": True,
            "transcript": result["text"],
            "language": result.get("language", "unknown")
        })
        
    except Exception as e:
        logger.error(f"Erreur STT: {e}")
        if temp_filepath and os.path.exists(temp_filepath):
            os.remove(temp_filepath)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stt/record")
async def transcribe_recording(file: UploadFile = File(...)):
    if whisper_model is None:
        raise HTTPException(status_code=500, detail="Modèle Whisper non chargé")
    
    filepath = None
    
    try:
        filename = f"{uuid.uuid4()}.webm"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        
        result = whisper_model.transcribe(filepath, fp16=False)
        
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        
        return JSONResponse({
            "success": True,
            "transcript": result["text"],
            "language": result.get("language", "unknown")
        })
        
    except Exception as e:
        logger.error(f"Erreur STT: {e}")
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health_check():
    custom_count = len(os.listdir(VOICE_CLONES_DIR)) if os.path.exists(VOICE_CLONES_DIR) else 0
    return {
        "status": "ok",
        "whisper_loaded": whisper_model is not None,
        "custom_voices_count": custom_count,
        "huggingface_token_configured": HUGGINGFACE_TOKEN != "hf_XXXXXXXXXXXXX"
    }

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("🚀 AdGenerate.ai - Version avec clonage vocal")
    print("=" * 50)
    print(f"🎤 Whisper: {'✅ chargé' if whisper_model else '❌ non chargé'}")
    print(f"🔑 Hugging Face: {'✅ configurée' if HUGGINGFACE_TOKEN != 'hf_XXXXXXXXXXXXX' else '❌'}")
    print(f"📁 Voix personnalisées: {len(os.listdir(VOICE_CLONES_DIR)) if os.path.exists(VOICE_CLONES_DIR) else 0}")
    print("=" * 50)
    print("🌐 Serveur: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
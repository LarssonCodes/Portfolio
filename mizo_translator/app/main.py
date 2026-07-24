from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel
import os
import sys
# Add parent directory to sys.path so app modules can be loaded
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Force stdout/stderr to UTF-8 encoding on Windows to prevent charmap print crashes
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception as e:
        pass

import time
import uvicorn

# Import RAG, Gemini, and CTranslate2 engines
from app.rag_engine import TranslationMemory
from app.gemini_engine import post_edit_translation, translate_pure_gemini, invalidate_cache, verify_translation
from app import ct2_engine

app = FastAPI(title="Mizo ↔ English Translator")

# Define request/response models
class TranslationRequest(BaseModel):
    text: str
    direction: str  # "m2e" (Mizo to English) or "e2m" (English to Mizo)

class TranslationResponse(BaseModel):
    translated_text: str
    nllb_draft: str
    rag_matches: list

class ComparisonResponse(BaseModel):
    base_translation: str
    base_time_ms: float
    finetuned_translation: str
    finetuned_time_ms: float
    gemini_translation: str
    gemini_time_ms: float
    has_lora: bool

class FeedbackRequest(BaseModel):
    source_text: str
    corrected_text: str
    direction: str

class FeedbackResponse(BaseModel):
    success: bool
    message: str

# Global variables
base_model = None
finetuned_model = None
tokenizer = None
models_loaded = False
has_lora_adapter = False
tm = None

# Paths
ADAPTER_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "lora_adapter")
BASE_MODEL_ID = "facebook/nllb-200-distilled-600M"
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "parallel_corpus.csv")


def load_models():
    global base_model, finetuned_model, tokenizer, models_loaded, has_lora_adapter, tm
    if models_loaded:
        return

    try:
        print("Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID)

        print("Loading base NLLB-200 model...")
        base_model = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL_ID)

        # Check if LoRA adapter weights exist
        if os.path.exists(ADAPTER_PATH) and any(
            f.endswith(".bin") or f.endswith(".safetensors") for f in os.listdir(ADAPTER_PATH)
        ):
            print(f"Loading LoRA adapter from {ADAPTER_PATH}...")
            # Wrap the loaded base model directly to save CPU/GPU RAM
            finetuned_model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
            has_lora_adapter = True
            print("LoRA adapter loaded!")
        else:
            print("WARNING: LoRA adapter not found. Comparison will show base model for both.")
            print(f"Place adapter weights in: {ADAPTER_PATH}")
            finetuned_model = None
            has_lora_adapter = False

        # Move models to device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        base_model.to(device)
        if finetuned_model is not None:
            finetuned_model.to(device)

        print("Initializing Translation Memory (RAG)...")
        tm = TranslationMemory(CSV_PATH)
        tm.load_or_build()

        print(f"Models and RAG Index successfully loaded on {device}!")
        models_loaded = True

    except Exception as e:
        print(f"Error loading models: {e}")
        raise RuntimeError(f"Failed to load models: {e}")


def _normalize_punctuation(text):
    """Add trailing period if missing, returns (normalized_text, had_punctuation)."""
    has_punc = len(text) > 0 and text[-1] in {".", "?", "!", ",", ";", ":", "\"", "'"}
    if not has_punc:
        text += "."
    return text, has_punc


def _strip_trailing_period(text, had_punctuation):
    """Remove trailing period if original input didn't have punctuation."""
    if not had_punctuation and text.endswith("."):
        text = text[:-1].strip()
    return text


def _translate_with_model(model_instance, text, direction):
    """Run translation on a single model and return (translated_text, time_ms)."""
    if direction == "m2e":
        tokenizer.src_lang = "lus_Latn"
        tgt_lang_code = "eng_Latn"
    else:
        tokenizer.src_lang = "eng_Latn"
        tgt_lang_code = "lus_Latn"

    text_normalized, had_punc = _normalize_punctuation(text)

    device = next(model_instance.parameters()).device
    inputs = tokenizer(text_normalized, return_tensors="pt").to(device)
    forced_bos_token_id = tokenizer.convert_tokens_to_ids(tgt_lang_code)

    start = time.perf_counter()
    with torch.no_grad():
        tokens = model_instance.generate(
            **inputs,
            forced_bos_token_id=forced_bos_token_id,
            max_length=256,
            num_beams=4,
            length_penalty=1.0,
            no_repeat_ngram_size=4,       # Prevent endless phrase loops
            repetition_penalty=1.2        # Penalty for word repetition
        )
    elapsed_ms = (time.perf_counter() - start) * 1000

    translated = tokenizer.batch_decode(tokens, skip_special_tokens=True)[0].strip()
    translated = _strip_trailing_period(translated, had_punc)

    return translated, round(elapsed_ms, 1)


@app.on_event("startup")
async def startup_event():
    try:
        load_models()
    except Exception as e:
        print(f"Startup warning: {e}")
    
    # Try loading CTranslate2 model (optional, for fast local translation)
    try:
        ct2_engine.load_ct2_model()
    except Exception as e:
        print(f"CTranslate2 not available (this is okay): {e}")


@app.get("/api/status")
async def status_endpoint():
    if not models_loaded:
        return {"status": "not_loaded", "message": "Models not loaded yet."}

    device = next(base_model.parameters()).device.type
    return {
        "status": "ready",
        "engine": "Fine-tuned NLLB-200 (LoRA)" if has_lora_adapter else "NLLB-200 (Base Only)",
        "device": device,
        "is_lora": has_lora_adapter,
        "comparison_available": has_lora_adapter,
        "ct2_available": ct2_engine.is_available()
    }


@app.post("/api/translate", response_model=TranslationResponse)
async def translate_endpoint(request: TranslationRequest):
    """Translate using the Hybrid Pipeline (RAG + NLLB Draft + Gemini Edit)."""
    if not models_loaded:
        try:
            load_models()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model not loaded: {e}")

    text = request.text.strip()
    if not text:
        return TranslationResponse(translated_text="", nllb_draft="", rag_matches=[])

    if request.direction not in ("m2e", "e2m"):
        raise HTTPException(status_code=400, detail="Invalid direction. Use 'm2e' or 'e2m'.")

    try:
        active_model = finetuned_model if has_lora_adapter else base_model
        
        # 1. Generate baseline NLLB LoRA draft
        nllb_draft, _ = _translate_with_model(active_model, text, request.direction)
        
        # 2. Retrieve similar reference translations from 190k corpus
        rag_matches = tm.search(text, direction=request.direction, top_k=3)
        
        # Check for exact database match (bypasses Gemini API for 100% matches)
        if rag_matches:
            best_match = rag_matches[0]
            def _normalize(s):
                return "".join(c for c in s.lower() if c.isalnum())
            
            db_source = best_match["mizo"] if request.direction == "m2e" else best_match["english"]
            if _normalize(text) == _normalize(db_source) or best_match["score"] >= 0.99:
                exact_translation = best_match["english"] if request.direction == "m2e" else best_match["mizo"]
                print(f"RAG Exact Match Hit (score={best_match['score']}): returning '{exact_translation}' directly.")
                return TranslationResponse(
                    translated_text=exact_translation,
                    nllb_draft=nllb_draft,
                    rag_matches=rag_matches
                )
        
        # 3. Verify NLLB model translation with Gemini quality verification check
        try:
            verification = verify_translation(text, nllb_draft, request.direction)
            if verification["is_off"]:
                print(f"VERIFICATION BLOCKED: Translation is flagged as too off. Reason: {verification['reason']}")
                translated_output = "Confidence level too low, I cannot translate that."
            else:
                translated_output = nllb_draft
        except Exception as e:
            print(f"Gemini verification check failed: {e}")
            translated_output = nllb_draft  # Fallback to showing draft if verification API fails
        
        return TranslationResponse(
            translated_text=translated_output,
            nllb_draft=translated_output,
            rag_matches=rag_matches
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")


@app.post("/api/pure_gemini", response_model=TranslationResponse)
async def pure_gemini_endpoint(request: TranslationRequest):
    """Translate directly using Gemini few-shot examples from RAG, bypassing NLLB completely."""
    global tm, models_loaded
    if not models_loaded:
        try:
            load_models()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model not loaded: {e}")

    text = request.text.strip()
    if not text:
        return TranslationResponse(translated_text="", nllb_draft="", rag_matches=[])

    if request.direction not in ("m2e", "e2m"):
        raise HTTPException(status_code=400, detail="Invalid direction. Use 'm2e' or 'e2m'.")

    try:
        # 1. Retrieve 10 similar reference translations from RAG for few-shot context
        rag_matches = tm.search(text, direction=request.direction, top_k=10)

        # Check for exact database match bypass (exact alphanumeric matches)
        if rag_matches:
            best_match = rag_matches[0]
            def _normalize(s):
                return "".join(c for c in s.lower() if c.isalnum())
            
            db_source = best_match["mizo"] if request.direction == "m2e" else best_match["english"]
            if _normalize(text) == _normalize(db_source) or best_match["score"] >= 0.99:
                exact_translation = best_match["english"] if request.direction == "m2e" else best_match["mizo"]
                print(f"RAG Exact Match Hit (Pure Mode) (score={best_match['score']}): returning '{exact_translation}' directly.")
                return TranslationResponse(
                    translated_text=exact_translation,
                    nllb_draft="",
                    rag_matches=rag_matches
                )

        # 2. Run Pure Gemini Translation using the RAG matches
        final_translation = translate_pure_gemini(text, request.direction, rag_matches)

        return TranslationResponse(
            translated_text=final_translation,
            nllb_draft="",
            rag_matches=rag_matches
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pure Gemini translation error: {str(e)}")


@app.post("/api/translate_fast")
async def translate_fast_endpoint(request: TranslationRequest):
    """Translate using CTranslate2 INT8 model for lightning-fast local inference."""
    if not ct2_engine.is_available():
        raise HTTPException(
            status_code=503,
            detail="CTranslate2 model not available. Place INT8 model in ct2_model/ directory."
        )

    text = request.text.strip()
    if not text:
        return {"translated_text": "", "time_ms": 0, "engine": "CTranslate2 INT8"}

    if request.direction not in ("m2e", "e2m"):
        raise HTTPException(status_code=400, detail="Invalid direction. Use 'm2e' or 'e2m'.")

    try:
        translated, time_ms = ct2_engine.translate_ct2(text, request.direction)
        return {
            "translated_text": translated,
            "time_ms": round(time_ms, 1),
            "engine": "CTranslate2 INT8 (NLLB-200)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CTranslate2 translation error: {str(e)}")


@app.post("/api/compare", response_model=ComparisonResponse)
async def compare_endpoint(request: TranslationRequest):
    """Translate with BOTH models and return side-by-side results."""
    if not models_loaded:
        try:
            load_models()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Models not loaded: {e}")

    text = request.text.strip()
    if not text:
        return ComparisonResponse(
            base_translation="", base_time_ms=0,
            finetuned_translation="", finetuned_time_ms=0,
            gemini_translation="", gemini_time_ms=0,
            has_lora=has_lora_adapter
        )

    if request.direction not in ("m2e", "e2m"):
        raise HTTPException(status_code=400, detail="Invalid direction. Use 'm2e' or 'e2m'.")

    try:
        # Translate with base model
        base_text, base_ms = _translate_with_model(base_model, text, request.direction)

        # Translate with fine-tuned model (or base again if no LoRA)
        if has_lora_adapter:
            ft_draft, ft_ms = _translate_with_model(finetuned_model, text, request.direction)
        else:
            ft_draft, ft_ms = base_text, base_ms

        # We now compare the raw fine-tuned local model directly!
        ft_text = ft_draft
        ft_total_ms = ft_ms

        # Translate with Pure Gemini
        start_gemini = time.perf_counter()
        try:
            rag_matches_5 = tm.search(text, direction=request.direction, top_k=5)
            gemini_text = translate_pure_gemini(text, request.direction, rag_matches_5)
        except Exception as e:
            gemini_text = f"Gemini Error: {str(e)}"
        gemini_ms = (time.perf_counter() - start_gemini) * 1000

        return ComparisonResponse(
            base_translation=base_text,
            base_time_ms=base_ms,
            finetuned_translation=ft_text,
            finetuned_time_ms=round(ft_total_ms, 1),
            gemini_translation=gemini_text,
            gemini_time_ms=round(gemini_ms, 1),
            has_lora=has_lora_adapter
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")

@app.post("/api/feedback", response_model=FeedbackResponse)
async def feedback_endpoint(request: FeedbackRequest):
    """Add user correction dynamically to RAG translation memory and save it."""
    global tm, models_loaded
    if not models_loaded:
        try:
            load_models()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model not loaded: {e}")
            
    source_text = request.source_text.strip()
    corrected_text = request.corrected_text.strip()
    
    if not source_text or not corrected_text:
        raise HTTPException(status_code=400, detail="Source and corrected text cannot be empty.")
        
    try:
        tm.add_correction(source_text, corrected_text, request.direction)
        invalidate_cache(source_text, request.direction)
        return FeedbackResponse(
            success=True, 
            message="Correction saved! The system will now use this translation for similar sentences."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save correction: {str(e)}")


# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

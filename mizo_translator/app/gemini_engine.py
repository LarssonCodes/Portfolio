import os
import json
import sys
import google.generativeai as genai
import google.api_core.exceptions
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# List of API Keys provided by the user for rotation
api_keys_env = os.environ.get("GEMINI_API_KEYS", "")
if api_keys_env:
    API_KEYS = [k.strip() for k in api_keys_env.split(",") if k.strip()]
else:
    single_key = os.environ.get("GEMINI_API_KEY", "")
    if single_key:
        API_KEYS = [single_key]
    else:
        API_KEYS = []

# Track the current active key index
current_key_idx = 0

def configure_next_key():
    global current_key_idx
    current_key_idx = (current_key_idx + 1) % len(API_KEYS)
    key = API_KEYS[current_key_idx]
    print(f"Rotating Gemini API Key to key index {current_key_idx} (ends with ...{key[-6:]})")
    genai.configure(api_key=key)

# Configure the initial key
genai.configure(api_key=API_KEYS[current_key_idx])

# --- Local Gemini Cache System ---
CACHE_FILE = os.path.join(os.path.dirname(__file__), "gemini_cache.json")
translation_cache = {}

def load_cache():
    global translation_cache
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                translation_cache = json.load(f)
            print(f"Loaded {len(translation_cache)} translations from Gemini cache.")
        except Exception as e:
            print(f"Error loading Gemini cache: {e}")

def save_cache():
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(translation_cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving Gemini cache: {e}")

def get_cached_translation(text, direction, mode="hybrid"):
    norm_text = " ".join(text.strip().lower().split())
    key = f"{mode}:{direction}:{norm_text}"
    return translation_cache.get(key)

def set_cached_translation(text, direction, translation, mode="hybrid"):
    norm_text = " ".join(text.strip().lower().split())
    key = f"{mode}:{direction}:{norm_text}"
    translation_cache[key] = translation
    save_cache()

def invalidate_cache(source_text, direction):
    global translation_cache
    norm_text = " ".join(source_text.strip().lower().split())
    keys_to_remove = [f"hybrid:{direction}:{norm_text}", f"pure:{direction}:{norm_text}"]
    removed = False
    for key in keys_to_remove:
        if key in translation_cache:
            del translation_cache[key]
            removed = True
    if removed:
        print(f"Invalidated Gemini cache for sentence: '{source_text}'")
        save_cache()

# Load cache on startup
load_cache()


def post_edit_translation(source_text, nllb_draft, direction, rag_matches):
    """
    Use Gemini to improve NLLB draft using RAG references, supporting key rotation and local cache.
    """
    global current_key_idx
    
    # 1. Check local cache first
    cached = get_cached_translation(source_text, direction, mode="hybrid")
    if cached:
        print(f"Gemini Cache Hit (Hybrid Mode): returning '{cached}'")
        return cached

    # Format RAG matches
    rag_formatted = ""
    if rag_matches:
        for idx, match in enumerate(rag_matches):
            rag_formatted += f"Reference Example {idx+1}:\n"
            rag_formatted += f"Mizo: {match['mizo']}\n"
            rag_formatted += f"English: {match['english']}\n\n"
    else:
        rag_formatted = "No direct database examples found.\n"
        
    if direction == "m2e":
        src_lang = "Mizo"
        tgt_lang = "English"
    else:
        src_lang = "English"
        tgt_lang = "Mizo"
        
    prompt = f"""You are a professional translator and post-editor specializing in Mizo and English.
Your task is to translate the following {src_lang} text into {tgt_lang}.

Input Text: "{source_text}"

We have a first-draft machine translation from a fine-tuned translation model:
Draft Translation: "{nllb_draft}"

To help you produce the most accurate and natural translation, here are the most relevant examples from our verified human translation database:
{rag_formatted}
Instructions:
1. Examine the Input Text and compare it to the Reference Examples. Pay attention to how Mizo words, phrasing, and punctuation are matched with English in the examples.
2. Edit the "Draft Translation" to make it highly fluent, grammatically correct, and matching the style/vocabulary of the Reference Examples.
3. If the "Draft Translation" is already perfect and matches the style of the examples, keep it as is.
4. Output ONLY the final translated text. Do not include any explanations, warnings, notes, or introduction. Just print the final translation.
"""
    
    for attempt in range(len(API_KEYS)):
        try:
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                )
            )
            final_translation = response.text.strip()
            if final_translation.startswith('"') and final_translation.endswith('"'):
                final_translation = final_translation[1:-1].strip()
            
            # Save to local cache on success
            set_cached_translation(source_text, direction, final_translation, mode="hybrid")
            return final_translation
        except google.api_core.exceptions.ResourceExhausted as e:
            print(f"Gemini API Quota Limit (429) hit for key index {current_key_idx}: {e}")
            configure_next_key()
        except Exception as e:
            print(f"Gemini API Error for key index {current_key_idx}: {e}")
            configure_next_key()
            
    print("All Gemini API keys in rotation failed or are exhausted. Falling back to raw NLLB draft.")
    return nllb_draft


def translate_pure_gemini(source_text, direction, rag_matches):
    """
    Translate directly using Gemini few-shot examples from RAG, supporting key rotation and local cache.
    """
    global current_key_idx
    
    # 1. Check local cache first
    cached = get_cached_translation(source_text, direction, mode="pure")
    if cached:
        print(f"Gemini Cache Hit (Pure Mode): returning '{cached}'")
        return cached

    rag_formatted = ""
    if rag_matches:
        for idx, match in enumerate(rag_matches):
            rag_formatted += f"Example {idx+1}:\n"
            rag_formatted += f"Mizo: {match['mizo']}\n"
            rag_formatted += f"English: {match['english']}\n\n"
    else:
        rag_formatted = "No relevant reference translations available.\n"
        
    if direction == "m2e":
        src_lang = "Mizo"
        tgt_lang = "English"
    else:
        src_lang = "English"
        tgt_lang = "Mizo"
        
    prompt = f"""You are an expert bilingual translator specializing in Mizo and English.
Your task is to translate the following {src_lang} input sentence into {tgt_lang}.

Input Text: "{source_text}"

Here are the most relevant human-verified translation examples from our parallel corpus to help you understand the correct vocabulary, grammar patterns, style, and terminology:
{rag_formatted}

Instructions:
1. Carefully study the examples. Pay close attention to word choices, spelling, and sentence structures.
2. Translate the Input Text into fluent, natural, and grammatically correct {tgt_lang}, strictly matching the vocabulary and spelling style of the examples provided.
3. Output ONLY the final translated text. Do not include any explanations, notes, metadata, quotes, or introduction.
"""
    
    for attempt in range(len(API_KEYS)):
        try:
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                )
            )
            final_translation = response.text.strip()
            if final_translation.startswith('"') and final_translation.endswith('"'):
                final_translation = final_translation[1:-1].strip()
            
            # Save to local cache on success
            set_cached_translation(source_text, direction, final_translation, mode="pure")
            return final_translation
        except google.api_core.exceptions.ResourceExhausted as e:
            print(f"Gemini API Quota Limit (429) hit in Pure Mode for key index {current_key_idx}: {e}")
            configure_next_key()
        except Exception as e:
            print(f"Gemini API Error in Pure Mode for key index {current_key_idx}: {e}")
            configure_next_key()
            
    raise RuntimeError("All Gemini API keys in rotation failed or are exhausted.")


def verify_translation(source_text, nllb_draft, direction):
    """
    Use Gemini AI to check if the generated translation is reasonable or 'completely off'.
    Returns a dict: {"is_off": bool, "reason": str}
    """
    global current_key_idx
    
    if direction == "m2e":
        src_lang = "Mizo"
        tgt_lang = "English"
    else:
        src_lang = "English"
        tgt_lang = "Mizo"
        
    prompt = f"""You are an expert bilingual quality assessor for Mizo and English translation.
Evaluate if the following machine translation draft is reasonable or if it is "completely off" (meaning it contains extreme repetition, complete nonsense/gibberish, incorrect translation meaning, or massive hallucinations).

Source Text ({src_lang}): "{source_text}"
Draft Translation ({tgt_lang}): "{nllb_draft}"

Respond in EXACTLY the following JSON format:
{{
  "is_off": true/false,
  "reason": "a brief 1-sentence explanation of why it is off, or 'Reasonable' if is_off is false"
}}

Rules:
1. Set "is_off" to true if:
   - The translation is empty or contains endless repeating words/loops (e.g. "is is is is...").
   - The meaning is completely wrong compared to the source text.
   - It is massive hallucination or gibberish.
2. Set "is_off" to false if:
   - The translation is a reasonable translation of the source text, even if not 100% perfect.
3. Respond ONLY with valid JSON. Do not write any markdown code block fences (like ```json) or other text.
"""

    for attempt in range(len(API_KEYS)):
        try:
            model = genai.GenerativeModel("gemini-flash-latest") # Using flash-latest for compat with legacy SDK
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0, # Zero temperature for strict classification
                    response_mime_type="application/json"
                )
            )
            res_text = response.text.strip()
            # Clean possible markdown block wrapping if present
            if res_text.startswith("```"):
                lines = res_text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].strip() == "```":
                    lines = lines[:-1]
                res_text = "\n".join(lines).strip()
            
            data = json.loads(res_text)
            return {
                "is_off": bool(data.get("is_off", False)),
                "reason": str(data.get("reason", "Unknown"))
            }
        except google.api_core.exceptions.ResourceExhausted as e:
            print(f"Gemini API Quota Limit (429) hit in Verification Mode for key index {current_key_idx}: {e}")
            configure_next_key()
        except Exception as e:
            print(f"Gemini API Error in Verification Mode for key index {current_key_idx}: {e}")
            configure_next_key()
            
    # Default to False (reasonable) if Gemini fails, to avoid false positive blocking
    return {"is_off": False, "reason": "Gemini API unavailable"}


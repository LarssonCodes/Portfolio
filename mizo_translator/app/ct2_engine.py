"""
CTranslate2 Inference Engine for Mizo ↔ English Translation.
Uses INT8 quantized NLLB-200 model for blazing fast CPU inference (<100ms per sentence).
"""
import os
import time

# Lazy imports to avoid crashing if ctranslate2 is not installed
ct2 = None
sp_processor = None
hf_tokenizer = None

CT2_MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "ct2_int8")
ct2_available = False
translator = None


def load_ct2_model():
    """Load the CTranslate2 INT8 model and tokenizer. Returns True if successful."""
    global ct2, sp_processor, hf_tokenizer, ct2_available, translator

    if not os.path.exists(CT2_MODEL_DIR):
        print(f"CTranslate2 model directory not found: {CT2_MODEL_DIR}")
        print("To enable fast local translation, place the CT2 INT8 model in this directory.")
        return False

    # Check for the model.bin file (CTranslate2's serialized model)
    model_bin = os.path.join(CT2_MODEL_DIR, "model.bin")
    if not os.path.exists(model_bin):
        print(f"CTranslate2 model.bin not found in {CT2_MODEL_DIR}")
        return False

    try:
        import ctranslate2
        ct2 = ctranslate2

        print("Loading CTranslate2 INT8 model...")
        translator = ct2.Translator(CT2_MODEL_DIR, device="cpu", inter_threads=4)
        print("CTranslate2 model loaded successfully!")

        # Try loading SentencePiece tokenizer
        sp_model_path = None
        for f in os.listdir(CT2_MODEL_DIR):
            if f.endswith(".model"):
                sp_model_path = os.path.join(CT2_MODEL_DIR, f)
                break

        if sp_model_path:
            import sentencepiece as spm
            sp_processor = spm.SentencePieceProcessor()
            sp_processor.Load(sp_model_path)
            print(f"SentencePiece tokenizer loaded: {os.path.basename(sp_model_path)}")
        else:
            # Fallback to HuggingFace tokenizer
            from transformers import AutoTokenizer
            hf_tokenizer = AutoTokenizer.from_pretrained(CT2_MODEL_DIR)
            print("Using HuggingFace tokenizer for CT2 model.")

        ct2_available = True
        return True

    except ImportError:
        print("ctranslate2 package not installed. Run: pip install ctranslate2 sentencepiece")
        return False
    except Exception as e:
        print(f"Error loading CTranslate2 model: {e}")
        return False


def is_available():
    """Check if CTranslate2 model is loaded and ready."""
    return ct2_available and translator is not None


def tokenize(text):
    """Tokenize text using SentencePiece or HuggingFace tokenizer."""
    if sp_processor is not None:
        return sp_processor.Encode(text, out_type=str)
    elif hf_tokenizer is not None:
        return hf_tokenizer.tokenize(text)
    else:
        raise RuntimeError("No tokenizer available for CTranslate2 model.")


def detokenize(tokens):
    """Detokenize output tokens back to text."""
    if sp_processor is not None:
        return sp_processor.Decode(tokens)
    elif hf_tokenizer is not None:
        return hf_tokenizer.convert_tokens_to_string(tokens)
    else:
        raise RuntimeError("No tokenizer available for CTranslate2 model.")


def translate_ct2(text, direction="m2e"):
    """
    Translate text using CTranslate2 INT8 model.
    
    Args:
        text: Input text to translate.
        direction: 'm2e' for Mizo→English, 'e2m' for English→Mizo.
    
    Returns:
        tuple: (translated_text, time_ms)
    """
    if not is_available():
        raise RuntimeError("CTranslate2 model is not loaded.")

    if direction == "m2e":
        src_lang = "lus_Latn"
        tgt_lang = "eng_Latn"
    else:
        src_lang = "eng_Latn"
        tgt_lang = "lus_Latn"

    # Tokenize input
    tokens = tokenize(text)

    # Prepend source language token, append EOS
    source_tokens = [src_lang] + tokens + ["</s>"]

    # Translate with beam search
    start = time.perf_counter()
    results = translator.translate_batch(
        [source_tokens],
        target_prefix=[[tgt_lang]],
        beam_size=5,
        max_decoding_length=256,
        repetition_penalty=1.2,       # Prevent looping
        no_repeat_ngram_size=4        # Prevent repeating n-grams
    )
    elapsed_ms = (time.perf_counter() - start) * 1000

    # Extract output tokens (skip the language token prefix)
    output_tokens = results[0].hypotheses[0][1:]

    # Remove EOS token if present
    if output_tokens and output_tokens[-1] == "</s>":
        output_tokens = output_tokens[:-1]

    # Detokenize
    translation = detokenize(output_tokens)

    return translation, elapsed_ms

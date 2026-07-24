# Mizo ↔ English Web Translation Application

A minimalist, high-performance web translator for Mizo (Lushai) and English. It utilizes a fine-tuned local NLLB-200 model with translation memory (RAG) and Gemini AI safety verification checks.

## Project Structure
```
mizo_translator/
├── app/                  # Web server & backend logic
│   ├── static/           # Clean minimalist UI (HTML/CSS/JS)
│   ├── main.py           # FastAPI endpoints
│   ├── gemini_engine.py  # Gemini verification check
│   ├── rag_engine.py     # Translation Memory search
│   └── ct2_engine.py     # CTranslate2 engine loader
├── data/                 # Data folder
│   └── parallel_corpus.csv # Verified sentence pairs (used to build RAG index)
├── models/               # Model weights placeholders (Git ignored)
│   ├── lora_adapter/     # Put LoRA adapter weights here
│   ├── ct2_int8/         # Put CTranslate2 weights here
│   └── merged_pytorch/   # Put full merged PyTorch model here
├── requirements.txt      # Python dependencies
├── .gitignore            # Tells Git to ignore model binaries and cache files
└── start_server.bat      # Windows batch file to start server
```

## Quick Start

### 1. Place Model Weights
Download your fine-tuned adapter weights and place them inside the `models/` directory structure.
* Put the adapter weights (`adapter_model.bin` or `adapter_model.safetensors`, and `adapter_config.json`) in `models/lora_adapter/`.

### 2. Set up Virtual Environment
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run the App
Double-click `start_server.bat` or run:
```bash
python -m app.main
```
Open your browser at `http://127.0.0.1:8000`.
On first startup, the app will automatically build the `rag_cache.pkl` file (takes about 5 seconds).

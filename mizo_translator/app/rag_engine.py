import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import os
import pickle

class TranslationMemory:
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.mizo_vectorizer = None
        self.english_vectorizer = None
        self.mizo_matrix = None
        self.english_matrix = None
        self.df = None
        self.loaded = False

    def load_or_build(self):
        cache_path = os.path.join(os.path.dirname(__file__), "rag_cache.pkl")
        if os.path.exists(cache_path):
            print("Loading translation memory from cache...")
            try:
                with open(cache_path, "rb") as f:
                    data = pickle.load(f)
                    self.mizo_vectorizer = data["mizo_vectorizer"]
                    self.english_vectorizer = data["english_vectorizer"]
                    self.mizo_matrix = data["mizo_matrix"]
                    self.english_matrix = data["english_matrix"]
                    self.df = data["df"]
                    self.loaded = True
                print("Loaded translation memory successfully!")
                return
            except Exception as e:
                print(f"Error loading cache: {e}. Rebuilding...")

        print("Building translation memory index from CSV (this takes ~5 seconds)...")
        # Load the parallel clean corpus
        self.df = pd.read_csv(self.csv_path, encoding="utf-8")
        
        # Load user feedback corrections if they exist
        feedback_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "user_feedback.csv")
        if os.path.exists(feedback_path):
            print("Loading user feedback corrections...")
            try:
                feedback_df = pd.read_csv(feedback_path, encoding="utf-8")
                self.df = pd.concat([self.df, feedback_df], ignore_index=True)
                print(f"Loaded {len(feedback_df)} user-submitted corrections.")
            except Exception as e:
                print(f"Error loading feedback corrections: {e}")

        # Ensure we have both columns clean and non-null
        self.df = self.df.dropna(subset=["mizo", "english"])
        self.df["mizo"] = self.df["mizo"].astype(str)
        self.df["english"] = self.df["english"].astype(str)
        
        # Drop exact duplicates to save memory and make RAG results unique
        self.df = self.df.drop_duplicates(subset=["mizo", "english"])
        
        # Fit vectorizers
        print("Vectorizing Mizo sentences...")
        self.mizo_vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=2)
        self.mizo_matrix = self.mizo_vectorizer.fit_transform(self.df["mizo"])
        
        print("Vectorizing English sentences...")
        self.english_vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=2)
        self.english_matrix = self.english_vectorizer.fit_transform(self.df["english"])
        
        # Save cache
        print("Saving index cache...")
        with open(cache_path, "wb") as f:
            pickle.dump({
                "mizo_vectorizer": self.mizo_vectorizer,
                "english_vectorizer": self.english_vectorizer,
                "mizo_matrix": self.mizo_matrix,
                "english_matrix": self.english_matrix,
                "df": self.df
            }, f, protocol=4)
        
        self.loaded = True
        print(f"Index built successfully with {len(self.df)} parallel sentences!")

    def add_correction(self, source_text, corrected_text, direction):
        """Add a manual correction dynamically to the memory database and save to disk."""
        if not self.loaded:
            self.load_or_build()

        mizo_val = source_text if direction == "m2e" else corrected_text
        eng_val = corrected_text if direction == "m2e" else source_text

        # 1. Save to a feedback CSV to persist it
        feedback_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "user_feedback.csv")
        new_row = pd.DataFrame([{
            "mizo": mizo_val,
            "english": eng_val
        }])
        
        # Append to CSV
        file_exists = os.path.exists(feedback_path)
        new_row.to_csv(feedback_path, mode='a', header=not file_exists, index=False, encoding="utf-8")
        
        # 2. Append to the in-memory dataframe
        self.df = pd.concat([self.df, new_row], ignore_index=True)
        
        # 3. Update the TF-IDF matrices
        try:
            print(f"Updating Translation Memory TF-IDF index with new correction: '{mizo_val}' -> '{eng_val}'")
        except Exception:
            # Fallback safe print if terminal doesn't support UTF-8 encoding
            import sys
            safe_mizo = mizo_val.encode('ascii', errors='replace').decode('ascii')
            safe_eng = eng_val.encode('ascii', errors='replace').decode('ascii')
            print(f"Updating Translation Memory TF-IDF index with new correction (safe-print): '{safe_mizo}' -> '{safe_eng}'")

        self.mizo_matrix = self.mizo_vectorizer.fit_transform(self.df["mizo"])
        self.english_matrix = self.english_vectorizer.fit_transform(self.df["english"])
        
        # 4. Save to cache
        cache_path = os.path.join(os.path.dirname(__file__), "rag_cache.pkl")
        try:
            with open(cache_path, "wb") as f:
                pickle.dump({
                    "mizo_vectorizer": self.mizo_vectorizer,
                    "english_vectorizer": self.english_vectorizer,
                    "mizo_matrix": self.mizo_matrix,
                    "english_matrix": self.english_matrix,
                    "df": self.df
                }, f, protocol=4)
        except Exception as e:
            print(f"Error saving updated cache: {e}")
        return True

    def search(self, query, direction="m2e", top_k=3):
        if not self.loaded:
            self.load_or_build()
            
        if not query.strip():
            return []
            
        try:
            if direction == "m2e":
                query_vec = self.mizo_vectorizer.transform([query])
                scores = (self.mizo_matrix * query_vec.T).toarray().flatten()
            else:
                query_vec = self.english_vectorizer.transform([query])
                scores = (self.english_matrix * query_vec.T).toarray().flatten()
                
            top_indices = np.argsort(scores)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                score = scores[idx]
                if score > 0.05:  # Filter out completely unrelated matches
                    row = self.df.iloc[idx]
                    results.append({
                        "mizo": row["mizo"],
                        "english": row["english"],
                        "score": float(score)
                    })
            return results
        except Exception as e:
            print(f"Search error: {e}")
            return []

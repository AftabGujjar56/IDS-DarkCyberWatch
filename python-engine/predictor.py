import os
import joblib
import numpy as np
from dotenv import load_dotenv

load_dotenv()

MODEL_DIR = os.getenv("MODEL_DIR", "./models")

# ── Globals (loaded once at startup) ──────────────────────────
binary_model   = None
multi_model    = None
scaler         = None
label_encoder  = None
feature_cols   = None

def load_models():
    """Load all .pkl files from the models directory."""
    global binary_model, multi_model, scaler, label_encoder, feature_cols

    files = {
        "binary_model":  "ids_binary_model.pkl",
        "multi_model":   "ids_multiclass_model.pkl",
        "scaler":        "scaler.pkl",
        "label_encoder": "label_encoder.pkl",
        "feature_cols":  "feature_cols.pkl",
    }

    missing = []
    for key, fname in files.items():
        path = os.path.join(MODEL_DIR, fname)
        if not os.path.exists(path):
            missing.append(fname)

    if missing:
        raise FileNotFoundError(
            f"Missing model files in '{MODEL_DIR}': {', '.join(missing)}\n"
            "Download the .pkl files from Google Drive and place them in python-engine/models/"
        )

    binary_model  = joblib.load(os.path.join(MODEL_DIR, "ids_binary_model.pkl"))
    multi_model   = joblib.load(os.path.join(MODEL_DIR, "ids_multiclass_model.pkl"))
    scaler        = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
    label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))
    feature_cols  = joblib.load(os.path.join(MODEL_DIR, "feature_cols.pkl"))

    print(f"✅ Models loaded successfully")
    print(f"   Binary model  : {type(binary_model).__name__}")
    print(f"   Multi model   : {type(multi_model).__name__}")
    print(f"   Feature count : {len(feature_cols)}")
    print(f"   Attack classes: {list(label_encoder.classes_)}")

def models_loaded() -> bool:
    return all([binary_model, multi_model, scaler, label_encoder, feature_cols])

def predict(features: list) -> dict:
    """
    Run prediction on a single feature vector.
    features: list of floats, length must match feature_cols
    """
    if not models_loaded():
        raise RuntimeError("Models not loaded. Call load_models() first.")

    # Validate input length
    expected = len(feature_cols)
    if len(features) != expected:
        # Pad or truncate to match expected length
        if len(features) < expected:
            features = features + [0.0] * (expected - len(features))
        else:
            features = features[:expected]

    # Convert to numpy array and scale
    X = np.array(features).reshape(1, -1)
    X_scaled = scaler.transform(X)

    # Binary prediction: 0=BENIGN, 1=ATTACK
    binary_pred  = int(binary_model.predict(X_scaled)[0])
    binary_proba = binary_model.predict_proba(X_scaled)[0]
    binary_conf  = float(binary_proba[binary_pred])

    # Multi-class prediction: specific attack type
    multi_pred  = int(multi_model.predict(X_scaled)[0])
    multi_label = label_encoder.inverse_transform([multi_pred])[0]

    return {
        "binary_prediction": binary_pred,
        "binary_label":      "ATTACK" if binary_pred == 1 else "BENIGN",
        "multiclass_label":  multi_label,
        "confidence":        round(binary_conf, 4),
        "is_attack":         binary_pred == 1,
    }

def predict_batch(feature_list: list) -> list:
    """Run prediction on multiple rows at once (faster than looping)."""
    if not models_loaded():
        raise RuntimeError("Models not loaded.")

    expected = len(feature_cols)
    results  = []

    # Pad/truncate all rows
    cleaned = []
    for row in feature_list:
        if len(row) < expected:
            row = row + [0.0] * (expected - len(row))
        else:
            row = row[:expected]
        cleaned.append(row)

    X        = np.array(cleaned)
    X_scaled = scaler.transform(X)

    binary_preds  = binary_model.predict(X_scaled)
    binary_probas = binary_model.predict_proba(X_scaled)
    multi_preds   = multi_model.predict(X_scaled)
    multi_labels  = label_encoder.inverse_transform(multi_preds)

    for i in range(len(cleaned)):
        bp = int(binary_preds[i])
        results.append({
            "binary_prediction": bp,
            "binary_label":      "ATTACK" if bp == 1 else "BENIGN",
            "multiclass_label":  multi_labels[i],
            "confidence":        round(float(binary_probas[i][bp]), 4),
            "is_attack":         bp == 1,
        })

    return results

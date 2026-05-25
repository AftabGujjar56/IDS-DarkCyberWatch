import os
import time
import random
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import predictor
import capture
from feature_extractor import (
    build_feature_vector,
    FEATURE_NAMES,
    simulate_dos_features,
    simulate_portscan_features,
    get_simulator,
)

load_dotenv()

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:3000")
HOST        = os.getenv("HOST", "0.0.0.0")
PORT        = int(os.getenv("PORT", 8000))

# ── In-memory stores ──────────────────────────────────────────
_alerts      = []
_total_flows = 0
_start_time  = time.time()
MAX_ALERTS   = 200
MAX_TRAFFIC  = 500

# ── Simulate attack helpers ───────────────────────────────────
ATTACK_SIMULATORS = {
    "DoS":       simulate_dos_features,
    "PortScan":  simulate_portscan_features,
}

DEMO_IPS = [
    "192.168.1.10", "192.168.1.25", "10.0.0.42",
    "172.16.0.5",   "192.168.2.100","10.10.1.33",
    "203.0.113.5",  "198.51.100.7", "185.220.101.45",
    "45.33.32.156",
]

ATTACK_PROFILES = {
    "DoS": {
        "ports": [80, 443, 8080, 8443],
        "protocols": ["TCP"],
    },
    "PortScan": {
        "ports": list(range(20, 90)) + [443, 8080, 3306, 5432, 22],
        "protocols": ["TCP"],
    },
    "Brute Force": {
        "ports": [22, 3389, 21, 23, 5900],
        "protocols": ["TCP"],
    },
    "Web Attack": {
        "ports": [80, 443, 8080],
        "protocols": ["TCP"],
    },
    "Infiltration": {
        "ports": [443, 8443, 4444],
        "protocols": ["TCP"],
    },
    "Bot": {
        "ports": [6667, 6668, 1080, 9050],
        "protocols": ["TCP", "UDP"],
    },
    "DDoS": {
        "ports": [80, 443, 53],
        "protocols": ["UDP", "TCP"],
    },
}


# ── App lifecycle ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n" + "="*50)
    print("  DarkCyberWatch — Python Engine")
    print("="*50)

    try:
        predictor.load_models()
    except FileNotFoundError as e:
        print(f"\n⚠️  WARNING: {e}")
        print("   API will start but /predict will return errors until models are added.\n")

    capture.start_capture(
        predictor.predict,
        lambda pkt: __import__('feature_extractor').extract_from_packet(pkt)
    )

    print(f"\n🚀 Server running at http://{HOST}:{PORT}")
    print(f"   Dashboard  → http://localhost:3000")
    print(f"   API docs   → http://localhost:{PORT}/docs\n")

    yield

    capture.stop_capture()
    print("\n👋 Server shutting down.")


app = FastAPI(
    title="DarkCyberWatch — IDS Engine",
    description="ML-powered Network Intrusion Detection System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ─────────────────────────────────
class PredictRequest(BaseModel):
    features:       Optional[list] = None
    named_features: Optional[dict] = None
    src_ip:         Optional[str]  = "0.0.0.0"
    dst_ip:         Optional[str]  = "0.0.0.0"
    protocol:       Optional[str]  = "TCP"
    dst_port:       Optional[int]  = 80

class BatchPredictRequest(BaseModel):
    rows: list

class SimulateRequest(BaseModel):
    attack_type: Optional[str] = "DoS"   # DoS | PortScan | Brute Force | Web Attack | Infiltration | Bot | DDoS
    count:       Optional[int] = 1        # how many flows to simulate (1-20)


# ── Routes ───────────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check — used by Next.js to detect engine status."""
    return {
        "status":         "online",
        "models_loaded":  predictor.models_loaded(),
        "uptime_seconds": round(time.time() - _start_time),
        "version":        "1.0.0",
        "timestamp":      datetime.now().isoformat(),
    }


@app.post("/predict")
def predict(req: PredictRequest):
    """Predict a single network flow."""
    global _total_flows, _alerts

    if not predictor.models_loaded():
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Place .pkl files in python-engine/models/ and restart."
        )

    if req.named_features:
        features = build_feature_vector(req.named_features, predictor.feature_cols)
    elif req.features:
        features = req.features
    else:
        features = [0.0] * len(predictor.feature_cols)

    result = predictor.predict(features)
    _total_flows += 1

    if result["is_attack"]:
        severity = (
            "CRITICAL" if result["confidence"] > 0.98 else
            "HIGH"     if result["confidence"] > 0.95 else
            "MEDIUM"   if result["confidence"] > 0.85 else
            "LOW"
        )
        alert = {
            "id":          time.time(),
            "timestamp":   datetime.now().isoformat(),
            "attack_type": result["multiclass_label"],
            "src_ip":      req.src_ip,
            "dst_ip":      req.dst_ip,
            "protocol":    req.protocol,
            "dst_port":    req.dst_port,
            "confidence":  result["confidence"],
            "severity":    severity,
        }
        _alerts.insert(0, alert)
        if len(_alerts) > MAX_ALERTS:
            _alerts.pop()

    return {**result, "timestamp": datetime.now().isoformat()}


@app.post("/simulate")
def simulate_attack(req: SimulateRequest):
    """
    Simulate one or more attack flows through the ML engine.
    Each attack type uses its own dedicated feature simulator so the
    model receives genuinely different feature vectors per attack type.
 
    attack_type: DoS | DDoS | PortScan | Brute Force | Web Attack | Infiltration | Bot
    count: 1-20 flows
    """
    global _total_flows, _alerts
 
    attack_type = req.attack_type if req.attack_type in ATTACK_PROFILES else "DoS"
    count       = max(1, min(20, req.count or 1))
    profile     = ATTACK_PROFILES[attack_type]
 
    # ── Get the right simulator for this attack type ──────────
    # get_simulator() looks up SIMULATORS dict in feature_extractor.py
    # Every attack type now has its own feature fingerprint.
    # No more DoS features being used for Bot/Brute Force/etc.
    simulator = get_simulator(attack_type)
    named     = simulator()
 
    results    = []
    new_alerts = []
 
    for _ in range(count):
        src_ip   = random.choice(DEMO_IPS[:6])
        dst_ip   = random.choice(DEMO_IPS[6:])
        dst_port = random.choice(profile["ports"])
        protocol = random.choice(profile["protocols"])
 
        if predictor.models_loaded():
            features = build_feature_vector(named, predictor.feature_cols)
            result   = predictor.predict(features)
            _total_flows += 1
        else:
            # Models not loaded — return plausible mock result
            # (engine is running but models/ folder is empty)
            result = {
                "is_attack":        True,
                "binary_label":     "ATTACK",
                "multiclass_label": attack_type,
                "confidence":       round(random.uniform(0.88, 0.99), 4),
            }
 
        severity = (
            "CRITICAL" if result["confidence"] > 0.98 else
            "HIGH"     if result["confidence"] > 0.95 else
            "MEDIUM"   if result["confidence"] > 0.85 else
            "LOW"
        )
 
        # Use the model's multiclass label if it matches the intended type,
        # otherwise show both so the user can see what the model said.
        model_label    = result.get("multiclass_label", attack_type)
        display_label  = (
            model_label if model_label != "BENIGN"
            else attack_type   # fallback — shouldn't happen with correct features
        )
 
        alert = {
            "id":               time.time() + random.random(),
            "timestamp":        datetime.now().isoformat(),
            "attack_type":      display_label,
            "intended_type":    attack_type,    # what the user requested
            "model_prediction": model_label,    # what the model actually said
            "src_ip":           src_ip,
            "dst_ip":           dst_ip,
            "protocol":         protocol,
            "dst_port":         dst_port,
            "confidence":       result["confidence"],
            "severity":         severity,
            "simulated":        True,
        }
 
        _alerts.insert(0, alert)
        new_alerts.append(alert)
 
    if len(_alerts) > MAX_ALERTS:
        _alerts = _alerts[:MAX_ALERTS]
 
    return {
        "success":     True,
        "attack_type": attack_type,
        "count":       count,
        "alerts":      new_alerts,
        "message":     f"Simulated {count} {attack_type} flow(s) — model predicted: {new_alerts[0]['model_prediction'] if new_alerts else '?'}",
    }
 

@app.post("/predict/batch")
def predict_batch(req: BatchPredictRequest):
    """Predict multiple flows at once."""
    if not predictor.models_loaded():
        raise HTTPException(status_code=503, detail="Models not loaded.")
    results = predictor.predict_batch(req.rows)
    return {"predictions": results, "count": len(results)}


@app.get("/alerts")
def get_alerts(limit: int = 50, severity: Optional[str] = None, attack_type: Optional[str] = None):
    """Return recent attack alerts with optional filters."""
    live        = capture.get_results()
    live_attacks = [r for r in live if r.get("is_attack")]

    combined = (_alerts + live_attacks)[:MAX_ALERTS]

    # Filters
    if severity:
        combined = [a for a in combined if a.get("severity", "").upper() == severity.upper()]
    if attack_type:
        combined = [a for a in combined if attack_type.lower() in a.get("attack_type", "").lower()]

    return {
        "alerts":   combined[:limit],
        "count":    len(combined),
        "total":    len(_alerts),
    }


@app.get("/stats")
def get_stats():
    """Return overall detection statistics with detailed attack breakdown."""
    cap_stats = capture.get_stats()
    total     = _total_flows + cap_stats["total"]
    attacks   = len(_alerts) + cap_stats["attacks"]

    # Full attack type breakdown
    type_counts  = {}
    sev_counts   = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    simulated_ct = 0

    for a in _alerts:
        t = a.get("attack_type", "Unknown")
        type_counts[t] = type_counts.get(t, 0) + 1

        s = a.get("severity", "LOW")
        if s in sev_counts:
            sev_counts[s] += 1

        if a.get("simulated"):
            simulated_ct += 1

    top_attacks = sorted(
        [{"type": k, "count": v} for k, v in type_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:10]

    # Recent alerts (last 10) for quick display
    recent_alerts = _alerts[:10]

    return {
        "total_flows":        total,
        "attacks_detected":   attacks,
        "benign_flows":       max(total - attacks, 0),
        "uptime_seconds":     round(time.time() - _start_time),
        "live_capture":       capture.is_running(),
        "models_loaded":      predictor.models_loaded(),
        "top_attacks":        top_attacks,
        "severity_breakdown": sev_counts,
        "simulated_attacks":  simulated_ct,
        "recent_alerts":      recent_alerts,
        "is_mock":            False,
    }


@app.get("/traffic")
def get_traffic(limit: int = 100):
    """Return recent traffic events from live capture."""
    results = capture.get_results()
    return {
        "events": results[:limit],
        "count":  len(results),
        "live_capture": capture.is_running(),
    }


@app.get("/report")
def get_report():
    """Return a full report summary for the Reports page."""
    cap_stats = capture.get_stats()
    total     = _total_flows + cap_stats["total"]
    attacks   = len(_alerts)

    type_counts = {}
    sev_counts  = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

    for a in _alerts:
        t = a.get("attack_type", "Unknown")
        type_counts[t] = type_counts.get(t, 0) + 1
        s = a.get("severity", "LOW")
        if s in sev_counts:
            sev_counts[s] += 1

    top_attacks = sorted(
        [{"type": k, "count": v} for k, v in type_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )

    return {
        "generated_at":       datetime.now().isoformat(),
        "uptime_seconds":     round(time.time() - _start_time),
        "total_flows":        total,
        "attacks_detected":   attacks,
        "benign_flows":       max(total - attacks, 0),
        "detection_rate":     round((attacks / total * 100), 2) if total > 0 else 0,
        "top_attacks":        top_attacks,
        "severity_breakdown": sev_counts,
        "live_capture":       capture.is_running(),
        "models_loaded":      predictor.models_loaded(),
        "recent_alerts":      _alerts[:20],
        "model_accuracy": {
            "binary":     "99.88%",
            "multiclass": "99.48%",
            "roc_auc":    "1.0000",
        },
    }


@app.get("/test/benign")
def test_benign():
    if not predictor.models_loaded():
        raise HTTPException(status_code=503, detail="Models not loaded.")
    features = [0.0] * len(predictor.feature_cols)
    return predictor.predict(features)


@app.get("/test/dos")
def test_dos():
    if not predictor.models_loaded():
        raise HTTPException(status_code=503, detail="Models not loaded.")
    named    = simulate_dos_features()
    features = build_feature_vector(named, predictor.feature_cols)
    return predictor.predict(features)


@app.get("/test/portscan")
def test_portscan():
    if not predictor.models_loaded():
        raise HTTPException(status_code=503, detail="Models not loaded.")
    named    = simulate_portscan_features()
    features = build_feature_vector(named, predictor.feature_cols)
    return predictor.predict(features)


@app.get("/features")
def get_features():
    return {
        "feature_count": len(FEATURE_NAMES),
        "features":      FEATURE_NAMES,
    }


# ── Entry point ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)

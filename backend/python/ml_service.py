#!/usr/bin/env python3
"""
NetGuard IDS — ML classification stub (Phase 6).
Train a model on CICIDS2017, export as model.pkl, then load it here.
For now returns "normal" or a placeholder label; replace with real model inference.
Usage: pip install -r requirements.txt  then  python ml_service.py
"""
import os
from pathlib import Path

from flask import Flask, request, jsonify

app = Flask(__name__)

# Optional: load model.pkl when present
MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"
model = None
if MODEL_PATH.exists():
    try:
        import joblib
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        print("Warning: could not load model.pkl:", e)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/classify", methods=["POST"])
def classify():
    """
    Expects JSON body with packet/flow features, e.g.:
    { "packet_size": 64, "protocol": "tcp", "flag_count": 2, "inter_arrival_ms": 1.5 }
    Returns { "label": "normal" | "port_scan" | "ddos" | ... }
    """
    data = request.get_json() or {}
    if model is not None:
        # Build feature vector from data (align with training features)
        # Placeholder: use simple rules until real model is trained
        packet_size = data.get("packet_size", 0) or data.get("packetSize", 0)
        protocol = (data.get("protocol") or "").upper()
        # TODO: extract same features as CICIDS2017 pipeline and predict
        # pred = model.predict([features])[0]
        # return jsonify({"label": pred})
        pass

    # Stub: rule-of-thumb so Spring Boot can call and get a response
    packet_size = data.get("packet_size", data.get("packetSize", 0))
    if packet_size and int(packet_size) > 1400:
        label = "suspicious"
    else:
        label = "normal"
    return jsonify({"label": label})


if __name__ == "__main__":
    port = int(os.environ.get("ML_SERVICE_PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)

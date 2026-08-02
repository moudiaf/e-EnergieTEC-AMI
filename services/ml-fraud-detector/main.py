import os
import time
import json
import random
import threading
from flask import Flask, request, jsonify
import numpy as np
from sklearn.ensemble import IsolationForest

app = Flask(__name__)

print("[REVENUE-ASSURANCE] Initialisation du moteur IA Multivarié...")

class RevenueAssuranceEngine:
    def __init__(self):
        # Contamination à 2% pour capturer les fraudes subtiles
        self.model = IsolationForest(n_estimators=200, contamination=0.02, random_state=42)
        self._pretrain()

    def _pretrain(self):
        # Essayer de charger les données historiques réelles de la base SQLite
        data = []
        db_path = os.getenv("DATABASE_PATH", "../../ami_smart_meter.db")
        if os.path.exists(db_path):
            try:
                import sqlite3
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT consumption, voltage, current, powerFactor FROM interval_data WHERE status = 'valid' LIMIT 5000")
                rows = cursor.fetchall()
                conn.close()
                if len(rows) >= 10:
                    data = [[r[0], r[1], r[2], r[3]] for r in rows]
                    print(f"[REVENUE-ASSURANCE] Entraînement sur {len(data)} profils nominaux réels depuis la base de données.")
            except Exception as e:
                print(f"[REVENUE-ASSURANCE] Impossible de lire l'historique réel ({e}). Utilisation du fallback synthétique.")

        if not data:
            # Fallback synthétique si la base est vide ou inaccessible
            for _ in range(1000):
                v = np.random.normal(230, 2)
                c = np.random.uniform(0.5, 10)
                p = (v * c) / 1000
                pf = np.random.uniform(0.92, 0.99)
                data.append([p, v, c, pf])
            print("[REVENUE-ASSURANCE] Modèle IsolationForest entraîné sur 1000 profils synthétiques de repli.")
        
        self.model.fit(data)

    def analyze(self, meter_id, data):
        # Extraction des features
        features = np.array([[
            data.get('consumption', 0),
            data.get('voltage', 230),
            data.get('current', 0),
            data.get('powerFactor', 0.95)
        ]])
        
        score = self.model.decision_function(features)[0]
        prediction = self.model.predict(features)[0]
        
        # Logique métier spécifique NIGELEC
        # Cas 1: Courant présent mais consommation nulle (Bypass total)
        if data.get('current', 0) > 0.5 and data.get('consumption', 0) < 0.01:
            return 0.95, "Bypass Total Détecté : Courant mesuré sans incrémentation d'énergie."
            
        # Cas 2: Tension normale mais courant anormalement bas par rapport au passé
        if prediction == -1:
            risk = abs(score) * 2 # Normalisation du score de risque
            return min(risk, 1.0), "Anomalie comportementale : Profil de charge incohérent avec la tension mesurée."
            
        return 0.05, "Normal"

engine = RevenueAssuranceEngine()

@app.route('/api/analyze', methods=['POST'])
def analyze_telemetry():
    payload = request.get_json()
    if not payload:
        return jsonify({"error": "Payload manquant"}), 400
        
    meter_id = payload.get('meter_id', 'UNKNOWN')
    risk_score, reason = engine.analyze(meter_id, payload)
    
    status = "suspicious" if risk_score > 0.6 else "normal"
    
    return jsonify({
        "meter_id": meter_id,
        "risk_score": risk_score,
        "reason": reason,
        "status": status,
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "healthy",
        "model": "IsolationForest",
        "contamination": 0.02,
        "n_estimators": 200
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    print(f"[REVENUE-ASSURANCE] Démarrage de l'API Flask sur le port {port}...")
    app.run(host="0.0.0.0", port=port)

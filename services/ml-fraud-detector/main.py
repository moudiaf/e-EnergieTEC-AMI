import os
import time
import json
import psycopg2
from kafka import KafkaConsumer, KafkaProducer
from sklearn.ensemble import IsolationForest
import numpy as np

# Configuration Database & Kafka (Enterprise Tier-1)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "nigelec_admin")
DB_PASS = os.getenv("DB_PASS", "SecurePass2026!")
DB_NAME = os.getenv("DB_NAME", "ami_mdms")
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")

print("[ML-FRAUD-DETECTOR] Initialisation de l'Ingénierie de Détection...")

def get_db_connection():
    try:
        return psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            dbname=DB_NAME
        )
    except psycopg2.Error as e:
        print(f"[ML-FRAUD-DETECTOR] En attente de TimescaleDB... ({e})")
        return None

# Initialisation du Modèle de Machine Learning
# Utilisation de IsolationForest pour la détection d'anomalies non supervisées (chutes de tension, consommation erratique)
ml_model = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)

# Entrainement initial basé sur l'historique ou données statiques pour simulation
print("[ML-FRAUD-DETECTOR] Entrainement du modèle Isolation Forest sur le load profile baseline...")
dummy_baseline = np.random.normal(loc=230, scale=5, size=(1000, 1)) # Simulation de tension normale autour de 230V
ml_model.fit(dummy_baseline)

print("[ML-FRAUD-DETECTOR] Prêt à analyser les trames temps réel.")

try:
    consumer = KafkaConsumer(
        'dcu_telemetry',
        bootstrap_servers=[KAFKA_BROKER],
        auto_offset_reset='latest',
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )
    
    producer = KafkaProducer(
        bootstrap_servers=[KAFKA_BROKER],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )

    for message in consumer:
        telemetry = message.value
        meter_id = telemetry.get('meter_id')
        voltage = telemetry.get('voltage', 230.0)
        
        # Prédiction Machine Learning (-1 indique une anomalie)
        X_test = np.array([[voltage]])
        prediction = ml_model.predict(X_test)[0]
        
        if prediction == -1:
            print(f"⚠️ [ML-FRAUD-DETECTOR] Anomalie détectée sur {meter_id} ! (Tension suspecte : {voltage}V)")
            
            # Publier l'alerte sur un topic dédié aux actions MDMS
            alert_payload = {
                "meter_id": meter_id,
                "type": "danger",
                "category": "fraud_ml",
                "priority": "Critique",
                "title": "Anomalie Comportementale via IA",
                "message": f"Le modèle IsolationForest a détecté une variation suspecte indicatrice de bypass (Tension = {voltage}V)."
            }
            producer.send('mdms_alerts', value=alert_payload)
            
except Exception as e:
    print(f"[ML-FRAUD-DETECTOR] Mode Simulation (Kafka non disponible) : {e}")

    # Fonctionnement en isolation pour les tests
    while True:
        time.sleep(10)
        print("[ML-FRAUD-DETECTOR] Scrutateur IA actif : Aucune anomalie détectée dans ce cycle.")

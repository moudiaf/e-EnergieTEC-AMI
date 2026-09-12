import time
import json
import random
import uuid
import requests

HES_ENDPOINT = "http://erp-cim-gateway:7000/api/provisioning/auto-discovery"

def generate_meter():
    return {
        "deviceId": f"MTR-ZTP-{random.randint(1000, 9999)}",
        "macAddress": f"00:1A:2B:{random.randint(10, 99)}:{random.randint(10, 99)}:{random.randint(10, 99)}",
        "deviceType": "DLMS/COSEM Smart Meter Phase 1",
        "capabilities": ["TOU", "Relay Control", "Prepayment STS v2"],
        "firmware": "v3.0.1",
        "securityKey": str(uuid.uuid4())
    }

print("[ZTP-PROVISIONER] Démarrage du simulateur Zero-Touch Provisioning (Plug & Play)...")
print("[ZTP-PROVISIONER] Ce script simule l'installation de compteurs physiques par les techniciens sur le terrain.")

for _ in range(5):
    time.sleep(3) # Un technicien installe un compteur toutes les quelques heures (simulé à 3 secondes)
    meter_data = generate_meter()
    print(f"-> [TERRAIN] Technicien valide l'installation du {meter_data['deviceId']}. Envoi de la trame de découverte (Beacon)...")
    
    try:
        response = requests.post(HES_ENDPOINT, json=meter_data)
        if response.status_code == 200:
            print(f"<- [HES] Succès : {response.json()['status']}")
        else:
            print(f"<- [HES] Échec de l'auto-découverte.")
    except Exception as e:
        print(f"[ZTP-PROVISIONER] En attente du Gateway ERP... ({e})")

print("[ZTP-PROVISIONER] Lot de compteurs auto-provisionné. Extinction du cycle.")

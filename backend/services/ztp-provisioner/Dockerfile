FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Attendre 15s que l'ERP gateway soit prêt avant de lancer la simulation
CMD sleep 15 && python device_emulator.py

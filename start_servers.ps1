# ==============================================================================
# SCRIPT DE DÉMARRAGE AUTOMATISÉ DES SERVEURS AMI & STS (e-EnergieTEC / NIGELEC)
# ==============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Démarrage de l'infrastructure e-EnergieTEC AMI & STS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Serveur Principal Express & Web (Port 3000)
Write-Host " [1/3] Lancement Serveur Principal API & Web (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath'; Write-Host '--- SERVEUR PRINCIPAL API & WEB (PORT 3000) ---' -ForegroundColor Cyan; npx tsx server.ts"

# 2. Moteur Cryptographique KMS-HSM STS (Port 5000)
Write-Host " [2/3] Lancement Moteur Cryptographique KMS-HSM STS (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath'; Write-Host '--- MOTEUR CRYPTOGRAPHIQUE KMS-HSM STS (PORT 5000) ---' -ForegroundColor Yellow; npx tsx services/kms-hsm/server.ts"

# 3. Passerelle HES / DLMS Gateway (Ports 4059 & 4060)
Write-Host " [3/3] Lancement Passerelle HES / DLMS Gateway (Ports 4059 / 4060)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootPath'; Write-Host '--- PASSERELLE HES / DLMS GATEWAY (PORTS 4059/4060) ---' -ForegroundColor Magenta; npx tsx services/hes-gateway/server.ts"

Write-Host ""
Write-Host "✅ Les 3 serveurs ont été lancés dans des fenêtres dédiées." -ForegroundColor Green
Write-Host "👉 Accès Web : http://localhost:3000" -ForegroundColor White
Write-Host "👉 Pour arrêter tous les serveurs : .\stop_servers.ps1" -ForegroundColor Gray

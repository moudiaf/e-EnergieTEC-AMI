# ==============================================================================
# SCRIPT D'ARRÊT PROPRE DES SERVEURS AMI & STS (e-EnergieTEC / NIGELEC)
# ==============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  🛑 Arrêt de l'infrastructure e-EnergieTEC AMI & STS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$Ports = @(3000, 5000, 4059, 4060)

foreach ($Port in $Ports) {
    $Connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($Connections) {
        foreach ($Conn in $Connections) {
            $PidToKill = $Conn.OwningProcess
            try {
                $Proc = Get-Process -Id $PidToKill -ErrorAction SilentlyContinue
                Stop-Process -Id $PidToKill -Force -ErrorAction SilentlyContinue
                Write-Host "  ✅ Port $Port libéré (Processus: $($Proc.ProcessName), PID: $PidToKill)" -ForegroundColor Green
            } catch {
                Write-Host "  ⚠️ Impossible d'arrêter le PID $PidToKill sur le port $Port" -ForegroundColor DarkYellow
            }
        }
    } else {
        Write-Host "  ℹ️ Port $Port : aucun processus en écoute (déjà arrêté)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Tous les serveurs e-EnergieTEC sont arrêtés." -ForegroundColor Green

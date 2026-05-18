# Auto-Session Timer - сохраняет сессию каждые 30 минут
# Запускается в фоне, собирает историю команд PowerShell
#
# Запуск:
#   Start-SessionTimer          # Запустить таймер
#   Stop-SessionTimer           # Остановить таймер
#   Get-SessionTimerStatus      # Статус

$TimerInterval = 30  # минут
$TimerJobName = "ZCode-SessionTimer"

function Start-SessionTimer {
    $existing = Get-Job -Name $TimerJobName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Таймер уже работает. Останови: Stop-SessionTimer" -ForegroundColor Yellow
        return
    }

    $script = {
        $interval = $using:TimerInterval
        $jobName = $using:TimerJobName
        $lastCount = 0

        while ($true) {
            Start-Sleep -Seconds ($interval * 60)

            # Получить последние команды из истории
            try {
                $history = Get-History -ErrorAction SilentlyContinue
                $currentCount = if ($history) { $history.Count } else { 0 }

                if ($currentCount -gt $lastCount -and $lastCount -gt 0) {
                    $newCommands = $history | Select-Object -Skip $lastCount | Select-Object -First 20
                    $cmdList = ($newCommands | ForEach-Object { $_.CommandLine }) -join "; "
                    $summary = "Автосохранение ($interval мин). Команды: $($cmdList.Substring(0, [Math]::Min(200, $cmdList.Length)))"

                    & "$env:USERPROFILE\.zcode\Zai-agent-toolkit\hooks\auto-save-session.ps1" -Summary $summary -Tags "auto,timer" 2>&1 | Out-Null
                }
                $lastCount = $currentCount
            } catch {
                # Тихо — не ломать сессию
            }
        }
    }

    Start-Job -Name $TimerJobName -ScriptBlock $script | Out-Null
    Write-Host "Таймер запущен: автосохранение каждые $TimerInterval мин" -ForegroundColor Green
    Write-Host "Остановить: Stop-SessionTimer" -ForegroundColor DarkGray
}

function Stop-SessionTimer {
    $job = Get-Job -Name $TimerJobName -ErrorAction SilentlyContinue
    if ($job) {
        Stop-Job -Name $TimerJobName
        Remove-Job -Name $TimerJobName
        Write-Host "Таймер остановлен" -ForegroundColor Yellow
    } else {
        Write-Host "Таймер не запущен" -ForegroundColor DarkGray
    }
}

function Get-SessionTimerStatus {
    $job = Get-Job -Name $TimerJobName -ErrorAction SilentlyContinue
    if ($job -and $job.State -eq "Running") {
        Write-Host "Таймер работает (каждые $TimerInterval мин)" -ForegroundColor Green
    } else {
        Write-Host "Таймер не запущен. Запусти: Start-SessionTimer" -ForegroundColor DarkGray
    }
}

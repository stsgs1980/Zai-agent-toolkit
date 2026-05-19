# Auto-Session Timer - автосохранение сессии каждые N минут
#
# Как работает:
#   - PSReadLine УЖЕ сохраняет все команды в:
#     %APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
#   - При каждом промпте проверяем: прошло ли N минут с последнего сохранения?
#   - Если да — берём новые команды из истории и сохраняем в память
#   - Никаких фоновых джобов, никаких планировщиков — всё встроено в промпт
#
# Команды:
#   Start-SessionTimer     # Включить автосохранение
#   Stop-SessionTimer      # Выключить
#   Get-SessionTimerStatus # Статус

$script:SessionTimerInterval = 30  # минут
$script:SessionTimerLastSave = $null
$script:SessionTimerLastLine = 0
$script:SessionTimerActive = $false

# Путь к истории PSReadLine
$script:PSReadLineHistoryPath = "$env:APPDATA\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt"

function Start-SessionTimer {
    $script:SessionTimerActive = $true
    $script:SessionTimerLastSave = Get-Date
    $script:SessionTimerLastLine = _Get-HistoryLineCount

    # Подключить проверку к промпту
    $oldPrompt = Get-Content Function:\prompt -ErrorAction SilentlyContinue
    if ($oldPrompt -notmatch 'SessionTimerAutoSave') {
        $newPromptBlock = @'
    # Auto-Session Timer check
    if ($script:SessionTimerActive) {
        $elapsed = (Get-Date) - $script:SessionTimerLastSave
        if ($elapsed.TotalMinutes -ge $script:SessionTimerInterval) {
            _SessionTimerAutoSave
        }
    }
'@
        # Встроить в начало промпта
        $script:OriginalPrompt = $oldPrompt
        Set-Content Function:\prompt -Value ($newPromptBlock + "`n" + $oldPrompt)
    }

    Write-Host "Автосохранение включено: каждые $script:SessionTimerInterval мин" -ForegroundColor Green
    Write-Host "Выключить: Stop-SessionTimer" -ForegroundColor DarkGray
}

function Stop-SessionTimer {
    $script:SessionTimerActive = $false
    # Восстановить оригинальный промпт
    if ($script:OriginalPrompt) {
        Set-Content Function:\prompt -Value $script:OriginalPrompt
    }
    Write-Host "Автосохранение выключено" -ForegroundColor Yellow
}

function Get-SessionTimerStatus {
    if ($script:SessionTimerActive) {
        $elapsed = [Math]::Floor(((Get-Date) - $script:SessionTimerLastSave).TotalMinutes)
        $next = $script:SessionTimerInterval - $elapsed
        Write-Host "Автосохранение работает (каждые $script:SessionTimerInterval мин, следующее через $next мин)" -ForegroundColor Green
    } else {
        Write-Host "Автосохранение выключено. Включи: Start-SessionTimer" -ForegroundColor DarkGray
    }
}

# Внутренняя: сколько строк в истории PSReadLine
function _Get-HistoryLineCount {
    if (Test-Path $script:PSReadLineHistoryPath) {
        return (Get-Content $script:PSReadLineHistoryPath -ErrorAction SilentlyContinue | Measure-Object).Count
    }
    return 0
}

# Внутренняя: само сохранение
function _SessionTimerAutoSave {
    try {
        $currentLineCount = _Get-HistoryLineCount
        $newLines = $currentLineCount - $script:SessionTimerLastLine

        if ($newLines -gt 0) {
            # Прочитать последние новые команды
            $allLines = Get-Content $script:PSReadLineHistoryPath -ErrorAction SilentlyContinue
            $recentCmds = $allLines | Select-Object -Skip $script:SessionTimerLastLine -Last 20
            $cmdList = ($recentCmds | Where-Object { $_.Length -gt 2 } ) -join "; "

            if ($cmdList.Length -gt 200) {
                $cmdList = $cmdList.Substring(0, 200) + "..."
            }

            $summary = "Автосохранение ($script:SessionTimerInterval мин). Команды: $cmdList"
            & "$env:USERPROFILE\.zcode\Zai-agent-toolkit\hooks\auto-save-session.ps1" -Summary $summary -Tags "auto,timer" 2>&1 | Out-Null
        } else {
            # Команд не было — просто обновить таймер
            & "$env:USERPROFILE\.zcode\Zai-agent-toolkit\hooks\auto-save-session.ps1" -Summary "Автосохранение ($script:SessionTimerInterval мин). Нет новых команд." -Tags "auto,timer,idle" 2>&1 | Out-Null
        }

        $script:SessionTimerLastLine = $currentLineCount
    } catch {
        # Тихо — не ломать промпт
    }

    $script:SessionTimerLastSave = Get-Date
}

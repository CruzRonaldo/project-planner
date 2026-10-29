param([string]$Hora = "20:00")

$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$PythonExecutable = Join-Path $ProjectRoot "venv\Scripts\python.exe"
$ManagePy = Join-Path $ProjectRoot "manage.py"

if (!(Test-Path $PythonExecutable) -or !(Test-Path $ManagePy)) {
    throw "Coloca este archivo junto a manage.py y comprueba que exista venv."
}

$CurrentIdentity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$TaskName = "ProjectPlanner-RespaldoDiario"

$Action = New-ScheduledTaskAction `
    -Execute $PythonExecutable `
    -Argument ('"{0}" backup_database --source automatic' -f $ManagePy) `
    -WorkingDirectory $ProjectRoot

$Trigger = New-ScheduledTaskTrigger -Daily -At $Hora

$Principal = New-ScheduledTaskPrincipal `
    -UserId $CurrentIdentity `
    -LogonType Interactive `
    -RunLevel Limited

$TaskSettings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15) `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Principal $Principal `
    -Settings $TaskSettings `
    -Description "Respaldo diario PostgreSQL de Project Planner." `
    -Force | Out-Null

Write-Host "Tarea registrada a las $Hora, según la hora de Windows."
Write-Host "Requiere equipo encendido, sesión de Windows iniciada y PostgreSQL funcionando."

Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo
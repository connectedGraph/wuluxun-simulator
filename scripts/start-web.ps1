param(
    [int]$Port = 8089,
    [string]$WebRoot = "D:\Git-Program\wuluxun-simulator\webroot"
)

[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$resolvedProjectRoot = [System.IO.Path]::GetFullPath($projectRoot)
$resolvedWebRoot = [System.IO.Path]::GetFullPath($WebRoot)
$pidFile = Join-Path $projectRoot "webserver.pid"
$logFile = Join-Path $projectRoot "webserver.log"
$errFile = Join-Path $projectRoot "webserver.err.log"

if (!(Test-Path -LiteralPath $resolvedWebRoot)) {
    & (Join-Path $projectRoot "scripts\build-webroot.ps1") -WebRoot $resolvedWebRoot
}

if (!$resolvedWebRoot.StartsWith($resolvedProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to serve outside project root: $resolvedWebRoot"
}

if (Test-Path -LiteralPath $pidFile) {
    $oldPidText = Get-Content -LiteralPath $pidFile -Encoding UTF8 -ErrorAction SilentlyContinue
    $oldPid = 0
    if ([int]::TryParse($oldPidText, [ref]$oldPid)) {
        $oldProcess = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
        if ($oldProcess) {
            Stop-Process -Id $oldPid -Force
            Start-Sleep -Milliseconds 400
        }
    }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
foreach ($listener in ($listeners | Sort-Object OwningProcess -Unique)) {
    $process = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
    if (!$process) {
        continue
    }
    if ($process.ProcessName -eq "noname") {
        Stop-Process -Id $process.Id -Force
        Start-Sleep -Milliseconds 600
    } else {
        throw "Port $Port is already used by $($process.ProcessName) (PID $($process.Id))."
    }
}

$python = Get-Command python -ErrorAction SilentlyContinue
$pythonArgs = @("-m", "http.server", "$Port", "--bind", "127.0.0.1", "--directory", $resolvedWebRoot)
if (!$python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
    $pythonArgs = @("-3", "-m", "http.server", "$Port", "--bind", "127.0.0.1", "--directory", $resolvedWebRoot)
}
if (!$python) {
    throw "Python was not found. Install Python or start any static server from $resolvedWebRoot on port $Port."
}

if (Test-Path -LiteralPath $logFile) {
    Remove-Item -LiteralPath $logFile -Force
}
if (Test-Path -LiteralPath $errFile) {
    Remove-Item -LiteralPath $errFile -Force
}
$server = Start-Process -FilePath $python.Source -ArgumentList $pythonArgs -WorkingDirectory $resolvedWebRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $errFile
Set-Content -LiteralPath $pidFile -Encoding UTF8 -Value ([string]$server.Id)

$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 250
    try {
        $response = Invoke-WebRequest -Uri ("http://127.0.0.1:{0}/index.html" -f $Port) -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {}
}

if (!$ready) {
    throw "Static server started but did not respond on port $Port. See $logFile and $errFile"
}

Write-Host ("Serving: http://127.0.0.1:{0}/" -f $Port)
Write-Host ("PID: " + $server.Id)

$ErrorActionPreference = "Stop"

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$escapedWorkspace = [regex]::Escape($workspace)

$processes = Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -eq "node.exe" -or $_.Name -eq "cmd.exe") -and
    $_.CommandLine -and
    (
      $_.CommandLine -match $escapedWorkspace -or
      ($_.CommandLine -match "next dev" -and $_.CommandLine -match "daily-work-agent-copilot")
    )
  }

if (-not $processes) {
  Write-Host "No Relay dev server processes found."
  exit 0
}

foreach ($process in $processes) {
  Write-Host "Stopping $($process.Name) PID $($process.ProcessId)"
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host "Relay dev server stopped."

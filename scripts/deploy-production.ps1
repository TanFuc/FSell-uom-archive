param(
  [switch]$SkipBuild,
  [switch]$SkipSeed,
  [int]$BackendHealthTimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $repoRoot 'docker-compose.prod.yml'
$envFile = Join-Path $repoRoot '.env.prod'

function Invoke-Step {
  param(
    [string]$Title,
    [scriptblock]$Script
  )

  Write-Host "`n==> $Title" -ForegroundColor Cyan
  & $Script
}

function Wait-BackendHealthy {
  param(
    [int]$TimeoutSeconds
  )

  $containerId = (docker compose -f $composeFile ps -q backend).Trim()
  if ([string]::IsNullOrWhiteSpace($containerId)) {
    throw 'Could not find backend container ID.'
  }

  $start = Get-Date
  while ($true) {
    $health = (docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $containerId).Trim()

    if ($health -eq 'healthy') {
      Write-Host 'Backend is healthy.' -ForegroundColor Green
      return
    }

    if ($health -eq 'unhealthy') {
      throw 'Backend became unhealthy while waiting for readiness.'
    }

    $elapsed = ((Get-Date) - $start).TotalSeconds
    if ($elapsed -ge $TimeoutSeconds) {
      throw "Timed out waiting for backend health after $TimeoutSeconds seconds."
    }

    Start-Sleep -Seconds 3
  }
}

if (!(Test-Path $envFile)) {
  throw "Missing .env.prod at '$envFile'. Create it from .env.prod.example first."
}

Push-Location $repoRoot
try {
  Invoke-Step 'Validate docker compose file' {
    docker compose -f $composeFile config | Out-Null
  }

  if (-not $SkipBuild) {
    Invoke-Step 'Build backend and frontend images' {
      docker compose -f $composeFile build backend frontend
    }
  }

  Invoke-Step 'Start postgres and redis first' {
    docker compose -f $composeFile up -d postgres redis
  }

  Invoke-Step 'Run database migrations' {
    docker compose -f $composeFile run --rm backend npm run prisma:migrate:prod
  }

  Invoke-Step 'Start backend and wait until healthy' {
    docker compose -f $composeFile up -d backend
    Wait-BackendHealthy -TimeoutSeconds $BackendHealthTimeoutSeconds
  }

  if (-not $SkipSeed) {
    Invoke-Step 'Run database seed' {
      docker compose -f $composeFile exec -T backend npm run db:seed
    }
  }

  Invoke-Step 'Start frontend' {
    docker compose -f $composeFile up -d frontend
  }

  Invoke-Step 'Current service status' {
    docker compose -f $composeFile ps
  }

  Write-Host "`nProduction deploy completed successfully." -ForegroundColor Green
} finally {
  Pop-Location
}

param(
  [switch]$SkipBuild,
  [switch]$SkipSeed,
  [int]$BackendHealthTimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..') | Select-Object -ExpandProperty Path
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

  $containerId = (docker compose --env-file $envFile -f $composeFile ps -q backend).Trim()
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
    docker compose --env-file $envFile -f $composeFile config | Out-Null
  }

  if (-not $SkipBuild) {
    Invoke-Step 'Build backend and frontend images' {
      docker compose --env-file $envFile -f $composeFile build backend frontend
    }
  }

  Invoke-Step 'Start mariadb and redis first' {
    docker compose --env-file $envFile -f $composeFile up -d mariadb redis
  }

  Invoke-Step 'Push MariaDB schema' {
    docker compose --env-file $envFile -f $composeFile run --rm backend npm run prisma:push
  }

  Invoke-Step 'Start backend and wait until healthy' {
    docker compose --env-file $envFile -f $composeFile up -d backend
    Wait-BackendHealthy -TimeoutSeconds $BackendHealthTimeoutSeconds
  }

  if (-not $SkipSeed) {
    Invoke-Step 'Run database seed' {
      docker compose --env-file $envFile -f $composeFile exec -T backend npm run db:seed
    }
  }

  Invoke-Step 'Start frontend' {
    docker compose --env-file $envFile -f $composeFile up -d frontend
  }

  Invoke-Step 'Current service status' {
    docker compose --env-file $envFile -f $composeFile ps
  }

  Write-Host "`nProduction deploy completed successfully." -ForegroundColor Green
} finally {
  Pop-Location
}

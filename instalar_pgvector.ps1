# Script de instalación de pgvector para PostgreSQL 17 en Windows (Ejecutar como Administrador)
$ErrorActionPreference = "Stop"
$SourceDir = "$PSScriptRoot\vector_pg17"
$PgTarget = "C:\Program Files\PostgreSQL\17"

if (!(Test-Path $PgTarget)) {
    Write-Error "No se encontró el directorio de PostgreSQL 17 en: $PgTarget"
    exit 1
}

Write-Host "Instalando extensión pgvector en PostgreSQL 17..." -ForegroundColor Cyan

Copy-Item "$SourceDir\lib\vector.dll" "$PgTarget\lib\" -Force
Write-Host "✓ vector.dll copiado a $PgTarget\lib\" -ForegroundColor Green

Copy-Item "$SourceDir\share\extension\*" "$PgTarget\share\extension\" -Force
Write-Host "✓ Archivos .control y scripts .sql copiados a $PgTarget\share\extension\" -ForegroundColor Green

$HeaderTarget = "$PgTarget\include\server\extension\vector"
if (!(Test-Path $HeaderTarget)) { 
    New-Item -ItemType Directory -Path $HeaderTarget -Force | Out-Null 
}
Copy-Item "$SourceDir\include\server\extension\vector\*" $HeaderTarget -Force
Write-Host "✓ Cabeceras C copiadas a $HeaderTarget" -ForegroundColor Green

Write-Host "=======================================================" -ForegroundColor Green
Write-Host "pgvector instalado con éxito en PostgreSQL 17." -ForegroundColor Green
Write-Host "Ahora puedes ejecutar: python manage.py migrate" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green


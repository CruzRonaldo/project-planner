@echo off
:: Solicita elevación como Administrador si no la tiene
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando permisos de Administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~dp0instalar_pgvector.bat\"' -Verb RunAs"
    exit /b
)

echo Copiando archivos de pgvector a C:\Program Files\PostgreSQL\17...
copy /Y "%~dp0vector_pg17\lib\vector.dll" "C:\Program Files\PostgreSQL\17\lib\"
copy /Y "%~dp0vector_pg17\share\extension\*.*" "C:\Program Files\PostgreSQL\17\share\extension\"
if not exist "C:\Program Files\PostgreSQL\17\include\server\extension\vector\" mkdir "C:\Program Files\PostgreSQL\17\include\server\extension\vector\"
copy /Y "%~dp0vector_pg17\include\server\extension\vector\*.*" "C:\Program Files\PostgreSQL\17\include\server\extension\vector\"

echo =======================================================
echo pgvector instalado con exito en PostgreSQL 17.
echo Ahora puedes ejecutar: python manage.py migrate
echo =======================================================
pause


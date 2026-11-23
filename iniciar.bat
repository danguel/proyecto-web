@echo off
title Centro Psicopedagogico - Servidor Web
cd /d "%~dp0"
echo ============================================================
echo   Centro de Atencion Psicopedagogica - Programacion Web II
echo   Iniciando servidor en http://localhost:3000
echo ============================================================
echo.
node app.js
if %errorlevel% neq 0 (
    echo.
    echo Ocurrio un error al iniciar el servidor.
    pause
)

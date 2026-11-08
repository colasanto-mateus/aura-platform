@echo off
title Nexus - Plataforma Estilo Discord
echo ========================================================
echo   Iniciando Nexus (Discord Clone)
echo   Chat, Audio, Camera e Loja de Customizacoes
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando modulos do servidor...
    call npm install
)

echo [2/2] Iniciando Servidor Nexus...
echo Servidor ativo em: http://localhost:4000
start http://localhost:4000
npm start

pause

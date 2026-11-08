@echo off
title Aura - Sua voz, sua imagem, sua identidade
echo ========================================================
echo   Iniciando Plataforma Aura
echo   Chat, Audio, Camera e Loja de Personalizacao
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando modulos do servidor...
    call npm install
)

echo [2/2] Iniciando Servidor Aura...
echo Acesse em: http://localhost:4000
start http://localhost:4000
npm start

pause

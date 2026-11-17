@echo off
rem Lancador do KiwiRun: sobe o servidor local e abre o jogo em tela cheia.
rem Nada a instalar: usa o PowerShell e o navegador que ja vem no Windows.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\lancador.ps1"
if errorlevel 1 pause

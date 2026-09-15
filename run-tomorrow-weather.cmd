@echo off
cd /d "%~dp0"
for /f %%i in ('powershell -NoProfile -Command "(Get-Date).AddDays(1).ToString('yyyy-MM-dd')"') do set TOMORROW=%%i
node agent.mjs > "H:\My Drive\%TOMORROW%.txt"

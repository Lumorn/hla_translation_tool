@echo off
echo Starte HLA Translation Tool V3 Bootstrapper...
python bootstrapper.py
if %errorlevel% neq 0 (
    echo.
    echo SCHWERER FEHLER: Python konnte 'bootstrapper.py' nicht starten.
    echo Ist Python installiert?
    pause
)

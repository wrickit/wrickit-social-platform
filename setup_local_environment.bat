@echo off
title Wrickit Local Environment Setup
echo ========================================
echo Wrickit Local Environment Setup
echo ========================================
echo.

:: Check PostgreSQL installation
echo [1/5] Checking PostgreSQL installation...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL not found. Please install PostgreSQL 17 first.
    echo Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
) else (
    echo PostgreSQL found.
)
echo.

:: Check if database exists
echo [2/5] Checking for existing wrickit_local database...
psql -U postgres -lqt | findstr wrickit_local >nul
if %errorlevel% neq 0 (
    echo Creating wrickit_local database...
    psql -U postgres -c "CREATE DATABASE wrickit_local;"
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create database. Check your PostgreSQL password.
        pause
        exit /b 1
    )
    echo Database created successfully.
) else (
    echo Database wrickit_local already exists.
)
echo.

:: Import schema
echo [3/5] Importing database schema...
if exist "wrickit_schema.sql" (
    psql -U postgres -d wrickit_local -f "wrickit_schema.sql" -q
    if %errorlevel% neq 0 (
        echo ERROR: Failed to import schema.
        pause
        exit /b 1
    )
    echo Schema imported successfully.
) else (
    echo WARNING: wrickit_schema.sql not found in current directory.
    echo Please download it from your Replit project.
)
echo.

:: Create environment file
echo [4/5] Creating local environment configuration...
(
echo DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/wrickit_local
echo SESSION_SECRET=your-super-secret-32-char-string-here-123456789
echo NODE_ENV=development
echo PORT=5000
) > .env.local
echo Environment file (.env.local) created.
echo IMPORTANT: Update the DATABASE_URL with your actual PostgreSQL password.
echo.

:: Install npm dependencies (if package.json exists)
echo [5/5] Installing npm dependencies...
if exist "package.json" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
) else (
    echo package.json not found. Make sure you're in the project directory.
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env.local and update your PostgreSQL password
echo 2. If you have data to import, run: psql -U postgres -d wrickit_local -f wrickit_data.sql
echo 3. Start the application: npm run dev
echo 4. Visit: http://localhost:5000
echo.
pause
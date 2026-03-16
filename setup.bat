@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║       Juan Carlos Event Management - Setup Script            ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo Make sure to install version 18 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version
echo.

REM Install dependencies
echo 📦 Installing dependencies...
echo This may take a few minutes...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ⚠️  Please edit the .env file and add your MongoDB connection string!
    echo.
    echo To get a free MongoDB database:
    echo 1. Go to https://www.mongodb.com/cloud/atlas
    echo 2. Sign up for a free account
    echo 3. Create a cluster and get your connection string
    echo 4. Replace MONGODB_URI in the .env file
    echo.
    notepad .env
) else (
    echo ✅ .env file already exists
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                      Setup Complete!                          ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo To start the application:
echo.
echo   npm run dev
echo.
echo This will start both the backend and frontend.
echo.
echo Then open: http://localhost:5173
echo.
echo Default login: sales@juancarlos.com / password123
echo.
pause

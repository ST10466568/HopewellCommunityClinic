@echo off
echo Deploying Hopewell Clinic Frontend to Azure...

REM Check if Azure CLI is installed
az --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Azure CLI is not installed or not in PATH
    echo Please install Azure CLI from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
    pause
    exit /b 1
)

REM Check if logged in
az account show >nul 2>&1
if %errorlevel% neq 0 (
    echo Please log in to Azure CLI first:
    az login
)

REM Build the application
echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

REM Copy web.config to build folder
copy web.config build\ >nul

REM Create deployment package
echo Creating deployment package...
if exist build.zip del build.zip
powershell -Command "Compress-Archive -Path 'build\*' -DestinationPath 'build.zip' -Force"

REM Deploy to Azure
echo Deploying to Azure...
az webapp deployment source config-zip --resource-group hopewell-clinic-rg --name hopewell-clinic-frontend --src build.zip

if %errorlevel% equ 0 (
    echo.
    echo Deployment successful!
    echo Your app is available at: https://hopewell-clinic-frontend.azurewebsites.net
    echo.
    pause
) else (
    echo Deployment failed!
    pause
    exit /b 1
)

REM Clean up
del build.zip >nul 2>&1



# Simple Azure Deployment Script
# Usage: .\deploy-simple.ps1 -AppServiceName "your-app-name"

param(
    [Parameter(Mandatory=$true)]
    [string]$AppServiceName,
    
    [string]$ResourceGroupName = "hopewell-clinic-rg"
)

Write-Host "Deploying Hopewell Clinic Frontend to Azure..." -ForegroundColor Green

# Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# Copy web.config to build folder
Copy-Item "web.config" "build/" -Force

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "build.zip") {
    Remove-Item "build.zip" -Force
}
Compress-Archive -Path "build\*" -DestinationPath "build.zip" -Force

# Deploy to Azure
Write-Host "Deploying to Azure..." -ForegroundColor Yellow
az webapp deployment source config-zip --resource-group $ResourceGroupName --name $AppServiceName --src "build.zip"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "App URL: https://$AppServiceName.azurewebsites.net" -ForegroundColor Cyan
} else {
    Write-Error "Deployment failed!"
}

# Clean up
Remove-Item "build.zip" -Force -ErrorAction SilentlyContinue
















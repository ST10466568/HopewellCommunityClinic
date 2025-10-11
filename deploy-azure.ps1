# Azure App Service Deployment Script for Hopewell Clinic Frontend
# This script deploys the React frontend to Azure App Services

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$AppServiceName,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "South Africa North"
)

Write-Host "Starting deployment to Azure App Services..." -ForegroundColor Green

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if logged in to Azure
$account = az account show 2>$null | ConvertFrom-Json
if (!$account) {
    Write-Host "Please log in to Azure CLI first: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green

# Create resource group if it doesn't exist
Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location --output none

# Create App Service plan if it doesn't exist
$planName = "$AppServiceName-plan"
Write-Host "Creating App Service plan: $planName" -ForegroundColor Yellow
az appservice plan create --name $planName --resource-group $ResourceGroupName --location $Location --sku B1 --is-linux --output none

# Create App Service if it doesn't exist
Write-Host "Creating App Service: $AppServiceName" -ForegroundColor Yellow
az webapp create --resource-group $ResourceGroupName --plan $planName --name $AppServiceName --runtime "NODE|18-lts" --output none

# Configure App Service settings
Write-Host "Configuring App Service settings..." -ForegroundColor Yellow
az webapp config set --resource-group $ResourceGroupName --name $AppServiceName --startup-file "npm start" --output none

# Set environment variables
az webapp config appsettings set --resource-group $ResourceGroupName --name $AppServiceName --settings NODE_ENV=production --output none

# Build the application
Write-Host "Building React application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Please check the errors above."
    exit 1
}

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "build.zip") {
    Remove-Item "build.zip" -Force
}

# Copy web.config to build folder
Copy-Item "web.config" "build/" -Force

# Create zip package
Compress-Archive -Path "build\*" -DestinationPath "build.zip" -Force

# Deploy to Azure
Write-Host "Deploying to Azure App Service..." -ForegroundColor Yellow
az webapp deployment source config-zip --resource-group $ResourceGroupName --name $AppServiceName --src "build.zip" --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
    $appUrl = "https://$AppServiceName.azurewebsites.net"
    Write-Host "Your app is available at: $appUrl" -ForegroundColor Cyan
    
    # Open the app in browser
    Start-Process $appUrl
} else {
    Write-Error "Deployment failed. Please check the errors above."
    exit 1
}

# Clean up
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item "build.zip" -Force -ErrorAction SilentlyContinue

Write-Host "Deployment completed!" -ForegroundColor Green















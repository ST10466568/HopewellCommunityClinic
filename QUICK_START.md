# Quick Start - Deploy to Azure

## 🚀 One-Click Deployment

### Prerequisites
1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
2. Login to Azure: `az login`

### Deploy Now

**Option 1: PowerShell (Recommended)**
```powershell
.\deploy-simple.ps1 -AppServiceName "hopewell-clinic-frontend"
```

**Option 2: Command Prompt**
```cmd
deploy.bat
```

**Option 3: Manual Commands**
```bash
# 1. Create resource group
az group create --name hopewell-clinic-rg --location "South Africa North"

# 2. Create app service plan
az appservice plan create --name hopewell-clinic-plan --resource-group hopewell-clinic-rg --location "South Africa North" --sku B1 --is-linux

# 3. Create app service
az webapp create --resource-group hopewell-clinic-rg --plan hopewell-clinic-plan --name hopewell-clinic-frontend --runtime "NODE|18-lts"

# 4. Build and deploy
npm run build
az webapp deployment source config-zip --resource-group hopewell-clinic-rg --name hopewell-clinic-frontend --src build.zip
```

## ✅ What's Configured

- ✅ API URL updated to: `https://hopewellapi-azcvcferesfpgjgm.southafricanorth-01.azurewebsites.net/api`
- ✅ React routing configured for Azure
- ✅ Production build optimized
- ✅ Deployment scripts ready
- ✅ Azure configuration files created

## 🔗 After Deployment

Your app will be available at: `https://hopewell-clinic-frontend.azurewebsites.net`

## 🛠️ Troubleshooting

If deployment fails:
1. Check Azure CLI login: `az account show`
2. Verify resource group exists: `az group list`
3. Check app service: `az webapp list --resource-group hopewell-clinic-rg`

## 📚 Full Documentation

See `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.



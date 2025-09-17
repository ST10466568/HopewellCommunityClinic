# Hopewell Clinic Frontend - Azure Deployment Guide

This guide will help you deploy the Hopewell Clinic React frontend to Azure App Services and connect it to the hosted API.

## Prerequisites

1. **Azure CLI** - Install from [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Node.js** (v18 or higher) - Already installed in your project
3. **Azure Subscription** - You need an active Azure subscription
4. **PowerShell** - For running deployment scripts

## API Configuration

The frontend has been configured to connect to the hosted API at:
```
https://hopewellapi-azcvcferesfpgjgm.southafricanorth-01.azurewebsites.net/api
```

## Deployment Options

### Option 1: Quick Deployment (Recommended)

1. **Login to Azure CLI:**
   ```bash
   az login
   ```

2. **Run the simple deployment script:**
   ```powershell
   .\deploy-simple.ps1 -AppServiceName "hopewell-clinic-frontend"
   ```

### Option 2: Full Deployment with Resource Creation

1. **Login to Azure CLI:**
   ```bash
   az login
   ```

2. **Run the full deployment script:**
   ```powershell
   .\deploy-azure.ps1 -ResourceGroupName "hopewell-clinic-rg" -AppServiceName "hopewell-clinic-frontend"
   ```

### Option 3: Manual Deployment

1. **Create Resource Group:**
   ```bash
   az group create --name hopewell-clinic-rg --location "South Africa North"
   ```

2. **Create App Service Plan:**
   ```bash
   az appservice plan create --name hopewell-clinic-plan --resource-group hopewell-clinic-rg --location "South Africa North" --sku B1 --is-linux
   ```

3. **Create App Service:**
   ```bash
   az webapp create --resource-group hopewell-clinic-rg --plan hopewell-clinic-plan --name hopewell-clinic-frontend --runtime "NODE|18-lts"
   ```

4. **Build and Deploy:**
   ```bash
   npm run build
   az webapp deployment source config-zip --resource-group hopewell-clinic-rg --name hopewell-clinic-frontend --src build.zip
   ```

## Configuration Files

The following files have been created for Azure deployment:

- **web.config** - IIS configuration for React routing
- **.deployment** - Azure deployment configuration
- **deploy-azure.ps1** - Full deployment script
- **deploy-simple.ps1** - Quick deployment script

## Environment Variables

The following environment variables are configured:
- `NODE_ENV=production`
- `API_BASE_URL=https://hopewellapi-azcvcferesfpgjgm.southafricanorth-01.azurewebsites.net/api`

## Post-Deployment

After successful deployment:

1. **Access your app** at: `https://your-app-name.azurewebsites.net`
2. **Test the connection** by logging in with valid credentials
3. **Monitor the application** using Azure Portal

## Troubleshooting

### Common Issues:

1. **Build fails:**
   - Ensure all dependencies are installed: `npm install`
   - Check for TypeScript errors: `npm run build`

2. **Deployment fails:**
   - Verify Azure CLI is logged in: `az account show`
   - Check resource group and app service names
   - Ensure you have proper permissions

3. **API connection issues:**
   - Verify the API URL is correct
   - Check CORS settings on the API
   - Test API endpoints directly

4. **Routing issues:**
   - Ensure web.config is in the build folder
   - Check that homepage is set to "." in package.json

### Logs and Monitoring:

- **Application logs:** Azure Portal > App Service > Log stream
- **Deployment logs:** Azure Portal > App Service > Deployment Center
- **Metrics:** Azure Portal > App Service > Metrics

## Security Considerations

1. **HTTPS:** The app is configured to use HTTPS
2. **CORS:** Ensure the API allows requests from your frontend domain
3. **Authentication:** JWT tokens are stored in localStorage
4. **Environment Variables:** Sensitive data should be stored in Azure App Settings

## Scaling

To scale your application:
- **Vertical scaling:** Change the App Service plan SKU
- **Horizontal scaling:** Enable auto-scaling in Azure Portal
- **Performance:** Use Azure CDN for static assets

## Backup and Recovery

- **Backup:** Azure automatically backs up App Services
- **Recovery:** Use Azure Portal to restore from backup
- **Disaster Recovery:** Consider multi-region deployment

## Cost Optimization

- **Free Tier:** Use F1 for development/testing
- **Production:** B1 or higher for production workloads
- **Monitoring:** Set up cost alerts in Azure Portal

## Support

For issues with:
- **Azure Services:** Check Azure documentation
- **Application Code:** Review the codebase and logs
- **Deployment:** Use the provided scripts and guides

---

**Note:** This deployment connects to the hosted API at `https://hopewellapi-azcvcferesfpgjgm.southafricanorth-01.azurewebsites.net`. Ensure the API is running and accessible before deploying the frontend.



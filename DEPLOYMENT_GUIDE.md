# Hopewell Clinic Frontend - Azure Deployment Guide

This guide will help you deploy the Hopewell Clinic React frontend to Azure App Services and connect it to the hosted API.

## Prerequisites

1. **Azure CLI** - Install from [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Node.js** (v18 or higher) - Already installed in your project
3. **Azure Subscription** - You need an active Azure subscription
4. **PowerShell** - For running deployment scripts
5. **Azure Permissions** - Ensure you have Contributor or Owner role on the subscription/resource group

## Pre-Deployment Checklist

Before starting deployment, verify the following:

1. **Check Azure CLI Login:**
   ```bash
   az account show
   ```
   - Should show your account details and subscription
   - If not logged in, run: `az login`

2. **Verify Permissions:**
   ```bash
   az role assignment list --assignee "your-email@domain.com" --output table
   ```
   - Should show Contributor or Owner role
   - If no roles shown, contact your Azure administrator

3. **Check Existing Resources:**
   ```bash
   az group list --output table
   az webapp list --output table
   ```
   - Look for existing resource groups you can use
   - Check if App Services already exist

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

### Option 3: Deploy to Existing App Service (Recommended for Educational/Enterprise Subscriptions)

If you don't have permissions to create new resources, use existing ones:

1. **Find Existing Resources:**
   ```bash
   az group list --output table
   az webapp list --output table
   ```

2. **Build Application:**
   ```bash
   npm run build
   ```

3. **Copy web.config:**
   ```bash
   Copy-Item "web.config" "build/" -Force
   ```

4. **Create Deployment Package:**
   ```bash
   Compress-Archive -Path "build\*" -DestinationPath "build.zip" -Force
   ```

5. **Deploy to Existing App Service:**
   ```bash
   az webapp deployment source config-zip --resource-group "YOUR-RESOURCE-GROUP" --name "YOUR-APP-SERVICE-NAME" --src "build.zip"
   ```

### Option 4: Manual Deployment (Full Resource Creation)

**⚠️ Requires Contributor/Owner permissions**

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

1. **Authorization Failed Errors:**
   ```
   (AuthorizationFailed) The client 'user@domain.com' does not have authorization to perform action 'Microsoft.Resources/subscriptions/resourcegroups/write'
   ```
   **Solution:**
   - Check your Azure permissions: `az role assignment list --assignee "your-email@domain.com"`
   - Use existing resource groups instead of creating new ones
   - Contact your Azure administrator for proper permissions
   - Use Option 3 (Deploy to Existing App Service) instead

2. **Build fails:**
   - Ensure all dependencies are installed: `npm install`
   - Check for TypeScript errors: `npm run build`
   - Clear node_modules cache: `rm -rf node_modules/.cache`

3. **Deployment fails:**
   - Verify Azure CLI is logged in: `az account show`
   - Check resource group and app service names
   - Ensure you have proper permissions
   - Use existing resources if you can't create new ones

4. **API connection issues:**
   - Verify the API URL is correct
   - Check CORS settings on the API
   - Test API endpoints directly

5. **Routing issues:**
   - Ensure web.config is in the build folder
   - Check that homepage is set to "." in package.json

6. **Resource Group Not Found:**
   ```
   Resource group 'hopewell-clinic-rg' could not be found
   ```
   **Solution:**
   - List available resource groups: `az group list --output table`
   - Use an existing resource group name
   - Or create one if you have permissions

7. **App Service Name Conflicts:**
   ```
   The name 'hopewell-clinic-frontend' is not available
   ```
   **Solution:**
   - Use a unique name with your identifier: `hopewell-clinic-frontend-yourname`
   - Check existing app services: `az webapp list --output table`

### Educational/Enterprise Subscription Issues:

**Common in educational environments:**
- Limited permissions to create resources
- Pre-existing resource groups
- Restricted subscription access

**Workarounds:**
1. Use existing resource groups and App Services
2. Deploy to pre-allocated resources
3. Contact IT administrator for permissions
4. Use Azure Portal for deployment if CLI fails

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

## Quick Reference Commands

### Check Your Environment:
```bash
# Check Azure CLI login
az account show

# List available resource groups
az group list --output table

# List existing App Services
az webapp list --output table

# Check your permissions
az role assignment list --assignee "your-email@domain.com" --output table
```

### Build and Deploy (Using Existing Resources):
```bash
# Build the application
npm run build

# Copy web.config to build folder
Copy-Item "web.config" "build/" -Force

# Create deployment package
Compress-Archive -Path "build\*" -DestinationPath "build.zip" -Force

# Deploy to existing App Service
az webapp deployment source config-zip --resource-group "YOUR-RESOURCE-GROUP" --name "YOUR-APP-SERVICE-NAME" --src "build.zip"

# Get your app URL
az webapp show --resource-group "YOUR-RESOURCE-GROUP" --name "YOUR-APP-SERVICE-NAME" --query "defaultHostName" --output tsv
```

### Success Indicators:
- ✅ Build completes without errors
- ✅ Deployment returns status "Succeeded"
- ✅ App Service state shows "Running"
- ✅ App is accessible at `https://your-app-name.azurewebsites.net`

---

**Note:** This deployment connects to the hosted API at `https://hopewellapi-azcvcferesfpgjgm.southafricanorth-01.azurewebsites.net`. Ensure the API is running and accessible before deploying the frontend.

**For Educational/Enterprise Users:** If you encounter permission issues, use Option 3 (Deploy to Existing App Service) which works with limited permissions.















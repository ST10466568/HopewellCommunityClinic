# 🏥 Hopewell Clinic Frontend - Azure Deployment Guide

[![Azure](https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

This comprehensive guide will help you deploy the Hopewell Clinic React frontend to Azure App Services and connect it to the hosted API. The guide covers everything from initial setup to production deployment with monitoring and security best practices.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [API Configuration](#api-configuration)
- [Deployment Options](#deployment-options)
- [CI/CD Pipeline Setup](#cicd-pipeline-setup)
- [Production Deployment](#production-deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Security Configuration](#security-configuration)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Backup & Recovery](#backup--recovery)
- [Cost Management](#cost-management)
- [Quick Reference](#quick-reference)

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

## 🚀 CI/CD Pipeline Setup

### GitHub Actions Workflow

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  AZURE_WEBAPP_NAME: hopewell-clinic-frontend
  AZURE_WEBAPP_PACKAGE_PATH: '.'
  NODE_VERSION: '18.x'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
      
    - name: Build application
      run: npm run build
      
    - name: Copy web.config
      run: cp web.config build/
      
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}/build
```

### Azure DevOps Pipeline

Create `azure-pipelines.yml`:

```yaml
trigger:
- main
- develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'
  azureWebAppName: 'hopewell-clinic-frontend'

stages:
- stage: Build
  displayName: Build and Test
  jobs:
  - job: BuildJob
    displayName: Build Job
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
      displayName: 'Install Node.js'
      
    - script: |
        npm ci
        npm run build
        npm test -- --coverage --watchAll=false
      displayName: 'Install, Build, and Test'
      
    - task: CopyFiles@2
      inputs:
        sourceFolder: 'web.config'
        contents: 'web.config'
        targetFolder: '$(Build.ArtifactStagingDirectory)/build'
        
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '$(Build.ArtifactStagingDirectory)/build'
        includeRootFolder: false
        archiveType: zip
        archiveFile: $(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip
        
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'drop'

- stage: Deploy
  displayName: Deploy to Azure
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployJob
    displayName: Deploy Job
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Azure-Service-Connection'
              appName: $(azureWebAppName)
              package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
```

### Environment Variables Setup

Configure these secrets in your CI/CD platform:

**GitHub Secrets:**
- `AZURE_WEBAPP_PUBLISH_PROFILE`: Download from Azure Portal > App Service > Get Publish Profile

**Azure DevOps Variables:**
- `Azure-Service-Connection`: Service connection to Azure subscription

## 🔧 Configuration Files

The following files have been created for Azure deployment:

- **web.config** - IIS configuration for React routing
- **.deployment** - Azure deployment configuration
- **deploy-azure.ps1** - Full deployment script
- **deploy-simple.ps1** - Quick deployment script
- **azure-pipelines.yml** - Azure DevOps pipeline
- **.github/workflows/azure-deploy.yml** - GitHub Actions workflow

## Environment Variables

The following environment variables are configured:
- `NODE_ENV=production`
- `API_BASE_URL=https://hopewellapi-azcvcferesfpgjgm.southafricanorth-01.azurewebsites.net/api`

## 🏭 Production Deployment

### Production Environment Setup

1. **Create Production Resource Group:**
   ```bash
   az group create --name hopewell-clinic-prod-rg --location "South Africa North"
   ```

2. **Create Production App Service Plan:**
   ```bash
   az appservice plan create \
     --name hopewell-clinic-prod-plan \
     --resource-group hopewell-clinic-prod-rg \
     --location "South Africa North" \
     --sku P1V2 \
     --is-linux
   ```

3. **Create Production App Service:**
   ```bash
   az webapp create \
     --resource-group hopewell-clinic-prod-rg \
     --plan hopewell-clinic-prod-plan \
     --name hopewell-clinic-frontend-prod \
     --runtime "NODE|18-lts"
   ```

4. **Configure Production Settings:**
   ```bash
   # Enable HTTPS only
   az webapp update \
     --resource-group hopewell-clinic-prod-rg \
     --name hopewell-clinic-frontend-prod \
     --https-only true
   
   # Set production environment variables
   az webapp config appsettings set \
     --resource-group hopewell-clinic-prod-rg \
     --name hopewell-clinic-frontend-prod \
     --settings \
       NODE_ENV=production \
       API_BASE_URL=https://hopewellapi-azcvcferesfpgjgm.southafricanorth-01.azurewebsites.net/api \
       REACT_APP_ENVIRONMENT=production
   ```

### Production Build Process

1. **Optimized Build:**
   ```bash
   # Install dependencies
   npm ci --only=production
   
   # Run production build
   npm run build
   
   # Copy configuration files
   cp web.config build/
   cp .deployment build/
   
   # Create production package
   cd build
   zip -r ../production-build.zip .
   cd ..
   ```

2. **Deploy to Production:**
   ```bash
   az webapp deployment source config-zip \
     --resource-group hopewell-clinic-prod-rg \
     --name hopewell-clinic-frontend-prod \
     --src production-build.zip
   ```

### Production Checklist

- [ ] ✅ HTTPS enabled and enforced
- [ ] ✅ Production environment variables set
- [ ] ✅ Custom domain configured (if applicable)
- [ ] ✅ SSL certificate installed
- [ ] ✅ Monitoring and alerting configured
- [ ] ✅ Backup strategy implemented
- [ ] ✅ Performance testing completed
- [ ] ✅ Security scanning performed
- [ ] ✅ Load testing completed
- [ ] ✅ Disaster recovery plan documented

## 📊 Monitoring & Logging

### Application Insights Setup

1. **Create Application Insights:**
   ```bash
   az monitor app-insights component create \
     --app hopewell-clinic-insights \
     --location "South Africa North" \
     --resource-group hopewell-clinic-prod-rg
   ```

2. **Connect to App Service:**
   ```bash
   az webapp config appsettings set \
     --resource-group hopewell-clinic-prod-rg \
     --name hopewell-clinic-frontend-prod \
     --settings \
       APPINSIGHTS_INSTRUMENTATIONKEY="your-instrumentation-key" \
       APPLICATIONINSIGHTS_CONNECTION_STRING="your-connection-string"
   ```

### Log Analytics Workspace

1. **Create Log Analytics Workspace:**
   ```bash
   az monitor log-analytics workspace create \
     --resource-group hopewell-clinic-prod-rg \
     --workspace-name hopewell-clinic-logs \
     --location "South Africa North"
   ```

2. **Configure Diagnostic Settings:**
   ```bash
   az monitor diagnostic-settings create \
     --name hopewell-clinic-diagnostics \
     --resource-group hopewell-clinic-prod-rg \
     --resource-type Microsoft.Web/sites \
     --resource-name hopewell-clinic-frontend-prod \
     --workspace hopewell-clinic-logs \
     --logs '[{"category":"AppServiceHTTPLogs","enabled":true},{"category":"AppServiceConsoleLogs","enabled":true}]'
   ```

### Monitoring Dashboard

Create a monitoring dashboard with:
- **Application Performance:** Response times, error rates
- **Infrastructure:** CPU, memory, disk usage
- **User Analytics:** Page views, user sessions
- **API Monitoring:** API response times, error rates
- **Security:** Failed login attempts, suspicious activity

## 🔒 Security Configuration

### Security Headers

Configure security headers in `web.config`:

```xml
<system.webServer>
  <httpProtocol>
    <customHeaders>
      <add name="X-Content-Type-Options" value="nosniff" />
      <add name="X-Frame-Options" value="DENY" />
      <add name="X-XSS-Protection" value="1; mode=block" />
      <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
      <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" />
    </customHeaders>
  </httpProtocol>
</system.webServer>
```

### Authentication & Authorization

1. **Azure Active Directory Integration:**
   ```bash
   az webapp auth update \
     --resource-group hopewell-clinic-prod-rg \
     --name hopewell-clinic-frontend-prod \
     --enabled true \
     --action LoginWithAzureActiveDirectory \
     --aad-client-id "your-client-id" \
     --aad-client-secret "your-client-secret" \
     --aad-token-issuer-url "https://login.microsoftonline.com/your-tenant-id"
   ```

2. **CORS Configuration:**
   ```bash
   az webapp cors add \
     --resource-group hopewell-clinic-prod-rg \
     --name hopewell-clinic-frontend-prod \
     --allowed-origins "https://hopewell-clinic-frontend-prod.azurewebsites.net"
   ```

### Security Best Practices

- ✅ **HTTPS Only:** Enforce HTTPS for all communications
- ✅ **Security Headers:** Implement comprehensive security headers
- ✅ **Input Validation:** Validate all user inputs
- ✅ **Authentication:** Implement proper authentication mechanisms
- ✅ **Authorization:** Enforce role-based access control
- ✅ **Secrets Management:** Use Azure Key Vault for sensitive data
- ✅ **Regular Updates:** Keep dependencies updated
- ✅ **Security Scanning:** Regular security vulnerability scans

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

## ⚡ Performance Optimization

### CDN Configuration

1. **Create Azure CDN Profile:**
   ```bash
   az cdn profile create \
     --name hopewell-clinic-cdn \
     --resource-group hopewell-clinic-prod-rg \
     --sku Standard_Microsoft
   ```

2. **Create CDN Endpoint:**
   ```bash
   az cdn endpoint create \
     --name hopewell-clinic-cdn-endpoint \
     --profile-name hopewell-clinic-cdn \
     --resource-group hopewell-clinic-prod-rg \
     --origin "hopewell-clinic-frontend-prod.azurewebsites.net" \
     --origin-host-header "hopewell-clinic-frontend-prod.azurewebsites.net"
   ```

### Build Optimization

1. **Bundle Analysis:**
   ```bash
   npm install --save-dev webpack-bundle-analyzer
   npm run build -- --analyze
   ```

2. **Code Splitting:**
   ```javascript
   // Implement lazy loading for routes
   const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
   const DoctorDashboard = React.lazy(() => import('./components/DoctorDashboard'));
   ```

3. **Asset Optimization:**
   ```bash
   # Optimize images
   npm install --save-dev imagemin imagemin-webp
   
   # Compress assets
   npm install --save-dev compression-webpack-plugin
   ```

### Caching Strategy

1. **Static Asset Caching:**
   ```bash
   az webapp config appsettings set \
     --resource-group hopewell-clinic-prod-rg \
     --name hopewell-clinic-frontend-prod \
     --settings \
       WEBSITE_STATIC_CACHE_CONTROL="public, max-age=31536000"
   ```

2. **Browser Caching Headers:**
   ```xml
   <system.webServer>
     <staticContent>
       <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
     </staticContent>
   </system.webServer>
   ```

## 📈 Scaling

### Auto-Scaling Configuration

1. **Enable Auto-Scale:**
   ```bash
   az monitor autoscale create \
     --resource-group hopewell-clinic-prod-rg \
     --resource hopewell-clinic-prod-plan \
     --resource-type Microsoft.Web/serverfarms \
     --name hopewell-clinic-autoscale \
     --min-count 1 \
     --max-count 10 \
     --count 2
   ```

2. **Scale Rules:**
   ```bash
   # CPU-based scaling
   az monitor autoscale rule create \
     --resource-group hopewell-clinic-prod-rg \
     --autoscale-name hopewell-clinic-autoscale \
     --condition "Percentage CPU > 70 avg 5m" \
     --scale out 1
   
   # Memory-based scaling
   az monitor autoscale rule create \
     --resource-group hopewell-clinic-prod-rg \
     --autoscale-name hopewell-clinic-autoscale \
     --condition "Memory Percentage > 80 avg 5m" \
     --scale out 1
   ```

### Scaling Options

- **Vertical Scaling:** Change App Service plan SKU (B1 → P1V2 → P2V2)
- **Horizontal Scaling:** Enable auto-scaling with multiple instances
- **Performance:** Use Azure CDN for static assets
- **Database:** Scale Azure SQL Database as needed

## 💾 Backup and Recovery

### Automated Backup

1. **Enable Backup:**
   ```bash
   az webapp config backup create \
     --resource-group hopewell-clinic-prod-rg \
     --webapp-name hopewell-clinic-frontend-prod \
     --backup-name hopewell-clinic-backup \
     --frequency 1d \
     --retention 30 \
     --storage-account-url "https://yourstorageaccount.blob.core.windows.net/backups"
   ```

2. **Backup Schedule:**
   ```bash
   az webapp config backup update \
     --resource-group hopewell-clinic-prod-rg \
     --webapp-name hopewell-clinic-frontend-prod \
     --backup-name hopewell-clinic-backup \
     --frequency 1d \
     --retention 30
   ```

### Disaster Recovery

1. **Multi-Region Deployment:**
   ```bash
   # Deploy to secondary region
   az group create --name hopewell-clinic-dr-rg --location "East US"
   az appservice plan create \
     --name hopewell-clinic-dr-plan \
     --resource-group hopewell-clinic-dr-rg \
     --location "East US" \
     --sku P1V2 \
     --is-linux
   ```

2. **Traffic Manager:**
   ```bash
   az network traffic-manager profile create \
     --name hopewell-clinic-tm \
     --resource-group hopewell-clinic-prod-rg \
     --routing-method Priority \
     --unique-dns-name hopewell-clinic-tm
   ```

## 💰 Cost Management

### Cost Optimization Strategies

1. **Resource Right-Sizing:**
   ```bash
   # Monitor current usage
   az monitor metrics list \
     --resource-group hopewell-clinic-prod-rg \
     --resource hopewell-clinic-frontend-prod \
     --resource-type Microsoft.Web/sites \
     --metric "CpuPercentage,MemoryPercentage"
   ```

2. **Reserved Instances:**
   ```bash
   # Purchase reserved capacity for predictable workloads
   az reservations reservation-order create \
     --reservation-order-name hopewell-clinic-reservation \
     --sku Standard_B1s \
     --location "South Africa North" \
     --reserved-resource-type VirtualMachines \
     --billing-scope-id "/subscriptions/your-subscription-id" \
     --term P1Y \
     --quantity 1
   ```

### Cost Monitoring

1. **Budget Alerts:**
   ```bash
   az consumption budget create \
     --budget-name hopewell-clinic-budget \
     --resource-group hopewell-clinic-prod-rg \
     --amount 1000 \
     --category Cost \
     --time-grain Monthly \
     --start-date 2024-01-01 \
     --end-date 2024-12-31
   ```

2. **Cost Analysis:**
   - Monitor daily costs in Azure Cost Management
   - Set up alerts for unexpected cost spikes
   - Regular cost reviews and optimization

### Pricing Tiers

- **Development:** F1 (Free) - Limited features, good for testing
- **Staging:** B1 ($13.14/month) - Basic features, suitable for staging
- **Production:** P1V2 ($73.00/month) - Production-ready with auto-scaling
- **High Traffic:** P2V2 ($146.00/month) - High-performance production

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















# 🚀 Hopewell Clinic Frontend Deployment Instructions

This guide covers deploying the React frontend to Azure App Service or Azure Static Web Apps, required environment variables, and SPA routing/service worker notes.

## 1) Build

- Node LTS recommended (v18+)
- Commands:
  - `npm ci`
  - `npm run build`
- Output: `build/` (upload this to the host)

## 2) Required Environment Variables (Frontend)

Set these in your Azure host (App Service → Configuration → Application settings, or Static Web Apps → Configuration):

- `REACT_APP_API_BASE_URL` = `https://<your-api-host>/api`
- `REACT_APP_VAPID_PUBLIC_KEY` = `<your-web-push-VAPID-public-key>`

Notes:
- The app reads these at build time. If you change them, rebuild and redeploy.
- Without `REACT_APP_VAPID_PUBLIC_KEY`, push notifications will be disabled (UI will still work).

## 3) Azure App Service (Linux) – Recommended

Create or use an existing App Service for static React hosting.

- Stack: Node 18+ (for build tasks) or “Static” if you upload built assets only
- Publish method options:
  - Zip Deploy (Portal → Deployment Center → Zip Deploy) → upload zipped `build/` contents
  - FTP → upload `build/` contents to `/site/wwwroot`
  - GitHub Actions → build and deploy on push

App Service configuration:
- App Settings (Configuration → Application settings):
  - Add `REACT_APP_API_BASE_URL`, `REACT_APP_VAPID_PUBLIC_KEY`
- SPA routing (React Router) – add `web.config` for 404 rewrite:
  - Create `web.config` in the deployed root with:

```
<?xml version="1.0"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

Service Worker:
- Ensure `public/sw.js` is deployed at site root (`/sw.js`) so push notifications can register
- Site must be HTTPS in production for push

## 4) Azure Static Web Apps (Alternative)

- In Azure Portal: Create “Static Web App”
- Framework: React
- Build presets:
  - App location: `/`
  - Api location: (leave empty unless using SWA APIs)
  - Output location: `build`
- Configure SWA secrets:
  - `REACT_APP_API_BASE_URL`, `REACT_APP_VAPID_PUBLIC_KEY`
- SWA handles SPA routes automatically (no web.config needed)

## 5) GitHub Actions (CI/CD)

Example workflow (App Service) – place under `.github/workflows/deploy.yml`:

```
name: Deploy Frontend to Azure App Service

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: |
          echo "REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL" >> $GITHUB_ENV
          echo "REACT_APP_VAPID_PUBLIC_KEY=$REACT_APP_VAPID_PUBLIC_KEY" >> $GITHUB_ENV
      - run: npm run build
      - name: Zip build
        run: |
          cd build
          zip -r ../build.zip .
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ secrets.AZURE_APP_SERVICE_NAME }}
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          package: build.zip
```

Required GitHub secrets:
- `AZURE_APP_SERVICE_NAME`
- `AZURE_PUBLISH_PROFILE` (download from App Service → Get publish profile)
- `REACT_APP_API_BASE_URL`
- `REACT_APP_VAPID_PUBLIC_KEY`

## 6) Post‑Deployment Checklist

- Open site URL
- Verify assets load over HTTPS
- Test login and dashboards
- Test Notification Management page loads settings/history
- Optional: test sending a custom email (backend must implement `/api/Notifications/send-custom` per backend doc)
- If push is enabled: ensure service worker registered (DevTools → Application → Service Workers) and no VAPID warning

## 7) Troubleshooting

- White screen / 404 on deep links → missing SPA rewrite; add `web.config` above (App Service) or use SWA
- “VAPID public key not configured” → set `REACT_APP_VAPID_PUBLIC_KEY` and redeploy
- API calls pointing to wrong host → set `REACT_APP_API_BASE_URL` and rebuild
- Service worker not found → ensure `public/sw.js` deployed at root

## 8) Support
If you need help with any step above, share the App Service name and I’ll provide exact commands/config.







# Samara Deployment Guide

This guide covers deploying Samara to various hosting platforms and environments.

## 🚀 Quick Deployment Options

### Option 1: Netlify (Recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

### Option 2: Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Option 3: Azure Static Web Apps

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.StaticApp)

## 📋 Pre-Deployment Checklist

- [ ] Azure AD application registered
- [ ] Client ID configured in `msalConfig.ts`
- [ ] Redirect URIs updated for production domain
- [ ] Build process tested locally
- [ ] Environment variables configured
- [ ] SSL certificate ready (HTTPS required for OAuth)

## 🔧 Environment Configuration

### 1. Update MSAL Configuration

```typescript
// src/config/msalConfig.ts
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.VITE_AZURE_CLIENT_ID || "your-client-id-here",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: process.env.VITE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

### 2. Environment Variables

Create `.env.production`:

```bash
VITE_AZURE_CLIENT_ID=your-production-client-id
VITE_REDIRECT_URI=https://your-domain.com
VITE_ENVIRONMENT=production
```

## 🌐 Platform-Specific Deployment

### Netlify Deployment

#### Method 1: Git Integration (Recommended)

1. Connect your repository to Netlify
2. Configure build settings:
   ```
   Build command: npm run build
   Publish directory: dist
   ```
3. Add environment variables in Netlify dashboard
4. Deploy automatically on git push

#### Method 2: Manual Deployment

```bash
# Build the project
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

#### Netlify Configuration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Vercel Deployment

#### Method 1: Git Integration

1. Import project in Vercel dashboard
2. Configure build settings automatically detected
3. Add environment variables
4. Deploy on git push

#### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Azure Static Web Apps

#### GitHub Actions Deployment

```yaml
# .github/workflows/azure-static-web-apps.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [main]

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: ""
          output_location: "dist"
        env:
          VITE_AZURE_CLIENT_ID: ${{ secrets.VITE_AZURE_CLIENT_ID }}
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    }
}
```

#### Docker Commands

```bash
# Build image
docker build -t samara .

# Run container
docker run -p 80:80 samara

# Docker Compose
docker-compose up -d
```

## 🔐 Azure AD Production Setup

### 1. Update App Registration

1. Go to Azure Portal > App Registrations
2. Select your Samara app
3. Update **Authentication** settings:
   - Add production redirect URI: `https://your-domain.com`
   - Remove development URIs for security
4. Update **API Permissions** if needed
5. Note the **Application (client) ID**

### 2. Production Security Settings

```typescript
// Enhanced security for production
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.VITE_AZURE_CLIENT_ID!,
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii && process.env.NODE_ENV === "development") {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel:
        process.env.NODE_ENV === "production" ? LogLevel.Error : LogLevel.Info,
    },
  },
};
```

## 🔍 Post-Deployment Verification

### 1. Functional Testing

```bash
# Test authentication flow
curl -I https://your-domain.com
# Should return 200 OK

# Test redirect handling
curl -I https://your-domain.com/some-route
# Should return 200 OK (not 404)
```

### 2. Security Testing

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No sensitive data in client-side code
- [ ] OAuth flow working correctly
- [ ] Token refresh functioning

### 3. Performance Testing

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size optimized

## 🚨 Troubleshooting

### Common Deployment Issues

#### 1. Authentication Errors

**Problem**: "AADSTS50011: The reply URL specified in the request does not match"
**Solution**: Update redirect URIs in Azure AD to match your production domain

#### 2. Build Failures

**Problem**: TypeScript compilation errors
**Solution**:

```bash
# Check for type errors
npm run type-check

# Fix common issues
npm run lint --fix
```

#### 3. Routing Issues

**Problem**: 404 errors on page refresh
**Solution**: Configure server to serve `index.html` for all routes

#### 4. Environment Variables Not Loading

**Problem**: `process.env.VITE_*` variables undefined
**Solution**: Ensure variables are prefixed with `VITE_` and configured in hosting platform

### Performance Issues

#### 1. Large Bundle Size

```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist

# Optimize imports
import { Button } from '@fluentui/react-components';
// Instead of importing entire library
```

#### 2. Slow Loading

- Enable gzip compression on server
- Configure CDN caching headers
- Optimize images and assets

## 📊 Monitoring & Analytics

### 1. Error Tracking

```typescript
// Add error boundary for production
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    console.error("Samara Error:", error, errorInfo);
  }
}
```

### 2. Performance Monitoring

```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 3. Usage Analytics

```typescript
// Track user interactions
const trackEvent = (eventName: string, properties: object) => {
  // Send to analytics service
  if (process.env.NODE_ENV === "production") {
    // Analytics implementation
  }
};
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Samara

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          VITE_AZURE_CLIENT_ID: ${{ secrets.VITE_AZURE_CLIENT_ID }}

      - name: Deploy to production
        run: npm run deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

## 📈 Scaling Considerations

### 1. CDN Configuration

- Configure caching headers for static assets
- Use appropriate cache strategies for different file types
- Enable compression (gzip/brotli)

### 2. Load Balancing

- Use multiple deployment regions
- Configure health checks
- Implement graceful degradation

### 3. Monitoring & Alerting

- Set up uptime monitoring
- Configure error rate alerts
- Monitor performance metrics

---

This deployment guide ensures Samara is properly configured and optimized for production environments while maintaining security and performance standards.

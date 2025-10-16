# 🚀 Frontend Deployment Guide

## Environment Configuration

### Development Environment

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:8000/api/v1",
};
```

### Production Environment

Update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://your-backend-api.com/api/v1",
};
```

## Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm start
   ```

3. **Open browser:**
   Navigate to `http://localhost:4200`

## Production Build

1. **Build for production:**

   ```bash
   npm run build
   ```

2. **Verify build output:**
   - Check `dist/osa-frontend/browser` directory
   - Ensure all assets are generated
   - Test build locally: `npx serve dist/osa-frontend/browser`

## Deployment Options

### Vercel Deployment (Recommended)

1. **Connect Repository:**

   - Import GitHub repository to Vercel
   - Vercel will detect Angular automatically

2. **Configure Build Settings:**

   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/osa-frontend/browser`
   - **Install Command:** `npm install`

3. **Environment Variables:**

   - No environment variables needed (API URL is in environment.prod.ts)

4. **Deploy:**
   - Vercel will build and deploy automatically
   - Get the deployment URL from Vercel dashboard

### Netlify Deployment

1. **Connect Repository:**

   - Import GitHub repository to Netlify

2. **Build Settings:**

   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist/osa-frontend/browser`

3. **Deploy:**
   - Netlify will build and deploy automatically

### Manual Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Upload files:**

   - Upload contents of `dist/osa-frontend/browser` to your web server
   - Ensure proper MIME types for JavaScript/CSS files

3. **Configure server:**
   - Set up SPA routing (redirect all routes to index.html)
   - Enable gzip compression
   - Configure HTTPS

## Server Configuration

### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist/osa-frontend/browser;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

## Testing Deployment

### Pre-deployment Checklist

- [ ] API URL configured correctly in `environment.prod.ts`
- [ ] Build completes without errors: `npm run build`
- [ ] Test build locally: `npx serve dist/osa-frontend/browser`
- [ ] All routes work in local build
- [ ] Authentication flows work
- [ ] API calls work with production URL

### Post-deployment Testing

1. **Basic Functionality:**

   - Application loads without errors
   - Login/register pages accessible
   - API calls work (check browser network tab)

2. **Role-based Access:**

   - Admin dashboard accessible to admins
   - Teacher dashboard accessible to teachers
   - Student dashboard accessible to students
   - Parent dashboard accessible to parents

3. **Core Features:**
   - Course browsing and enrollment
   - Dashboard statistics display
   - Notes system works
   - Theme switching works

## Performance Optimization

### Build Optimizations

1. **Enable Production Build:**

   ```bash
   ng build --configuration production
   ```

2. **Bundle Analysis:**
   ```bash
   npm install -g webpack-bundle-analyzer
   npx webpack-bundle-analyzer dist/osa-frontend/browser/stats.json
   ```

### CDN and Caching

1. **Static Asset CDN:**

   - Host images and assets on CDN
   - Update asset paths in code

2. **Cache Headers:**
   - Set appropriate cache headers for static assets
   - Use service worker for caching strategies

## Troubleshooting

### Common Issues

1. **Build Failures:**

   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear cache: `npm cache clean --force`
   - Check Node.js version compatibility

2. **API Connection Issues:**

   - Verify API URL in environment.prod.ts
   - Check CORS configuration on backend
   - Ensure backend is deployed and accessible

3. **Routing Issues:**

   - Verify server configuration for SPA routing
   - Check that all routes redirect to index.html

4. **Performance Issues:**
   - Enable gzip compression on server
   - Optimize images and assets
   - Use lazy loading for routes

### Debug Mode

Enable debug logging in production:

```typescript
// In environment.prod.ts
export const environment = {
  production: true,
  apiUrl: "https://your-api.com/api/v1",
  debug: true, // Enable for debugging
};
```

## Security Considerations

- **HTTPS Required:** Always deploy with HTTPS
- **Content Security Policy:** Configure CSP headers
- **X-Frame-Options:** Prevent clickjacking attacks
- **Regular Updates:** Keep dependencies updated
- **Environment Variables:** Never expose sensitive data

## Monitoring

### Performance Monitoring

1. **Google Analytics:** Track user interactions
2. **Error Tracking:** Implement error reporting (Sentry, etc.)
3. **Performance Metrics:** Monitor Core Web Vitals

### Health Checks

- Application loads within 3 seconds
- API calls respond within 1 second
- No JavaScript errors in console
- All routes accessible and functional</content>
  <parameter name="oldString">Frontend (Angular 20)

Set src/environments/environment.prod.ts apiUrl to your backend /api/v1

npm ci && npm run build

Deploy to Vercel; output dir: dist/osa-frontend/browser

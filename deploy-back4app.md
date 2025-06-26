# Back4App Deployment Guide for Wrickit

## Prerequisites Complete ✅
Your project is now configured for Back4App deployment with the following files:

### Configuration Files Created:
- `back4app.json` - App configuration and environment variables
- `.back4appignore` - Files to exclude from deployment
- `Dockerfile` - Container configuration
- `nginx.conf` - Web server configuration
- `startup.sh` - Deployment startup script
- `.env.example` - Environment variables template

### Code Updates:
- Updated `server/index.ts` to use environment PORT
- Modified `server/db.ts` for better serverless compatibility
- Added health check endpoint at `/api/health`
- Configured secure session cookies for production
- Updated `Procfile` for proper build process

## Deployment Steps:

### 1. Create Back4App Account
1. Go to https://www.back4app.com/
2. Sign up for a free account
3. Verify your email address

### 2. Create New Application
1. Click "Build new app"
2. Choose "Backend as a Service"
3. Name your app "Wrickit"
4. Select your preferred region
5. Click "Create"

### 3. Set Up Database
1. In your app dashboard, go to "Database" → "Settings"
2. Copy the PostgreSQL connection string
3. Note down these values for environment variables:
   - Host
   - Port (usually 5432)
   - Database name
   - Username
   - Password

### 4. Configure Git Deployment
1. Push your code to GitHub repository
2. In Back4App dashboard, go to "Deploy" → "Git Deploy"
3. Connect your GitHub account
4. Select your repository
5. Choose the main branch

### 5. Set Environment Variables
Go to "App Settings" → "Environment Variables" and add:

```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:5432/database
PGHOST=your_postgres_host
PGPORT=5432
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
SESSION_SECRET=generate_random_32_char_string
```

### 6. Deploy Application
1. Go to "Deploy" → "Git Deploy"
2. Click "Deploy Now"
3. Monitor build logs for any errors
4. Wait for deployment to complete

### 7. Verify Deployment
1. Visit your app URL (ends with `.back4app.io`)
2. Check health endpoint: `your-app.back4app.io/api/health`
3. Test user registration and login
4. Verify database connectivity

## Post-Deployment:

### Custom Domain (Optional)
1. Go to "App Settings" → "Custom Domain"
2. Add your domain name
3. Configure DNS settings as instructed
4. Wait for SSL certificate

### Monitoring
- Use "Logs" section for error tracking
- Check "Analytics" for performance metrics
- Set up alerts for downtime

## Environment Variables Needed:
Copy these from your Back4App database settings:
- `DATABASE_URL` - Full PostgreSQL connection string
- `PGHOST` - Database host
- `PGPORT` - Database port (5432)
- `PGDATABASE` - Database name
- `PGUSER` - Database username
- `PGPASSWORD` - Database password

Generate these:
- `SESSION_SECRET` - Random 32+ character string for session security

## Troubleshooting:
- Build fails: Check all dependencies are in package.json
- Database errors: Verify all environment variables are correct
- App doesn't start: Check logs for specific error messages
- 502 errors: Ensure app is listening on correct PORT environment variable

Your Wrickit app is now ready for Back4App deployment! 🚀
# Deployment Guide for Wrickit Social Platform

This guide covers multiple deployment options for your Wrickit social platform, from cloud platforms to VPS hosting.

## Prerequisites

Before deploying, ensure you have:
- Git repository with your code
- Database (PostgreSQL)
- Email service (SendGrid account)
- Basic understanding of environment variables

## Option 1: Heroku (Recommended for Beginners)

### Step 1: Prepare Heroku Account
1. Create account at https://heroku.com
2. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
3. Login: `heroku login`

### Step 2: Create Heroku App
```bash
# Navigate to your project directory
cd your-project-directory

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create Heroku app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Add SendGrid addon (optional)
heroku addons:create sendgrid:starter
```

### Step 3: Set Environment Variables
```bash
# Set required environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)

# SendGrid (if not using addon)
heroku config:set SENDGRID_API_KEY=your_sendgrid_api_key
```

### Step 4: Deploy
```bash
# Deploy to Heroku
git push heroku main

# Run database migrations
heroku run npm run db:push

# View logs
heroku logs --tail
```

### Step 5: Open Your App
```bash
heroku open
```

## Option 2: Railway (Modern Alternative)

### Step 1: Setup Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Install Railway CLI: `npm install -g @railway/cli`

### Step 2: Deploy
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Add PostgreSQL database
railway add postgresql

# Deploy
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set SESSION_SECRET=$(openssl rand -base64 32)
railway variables set SENDGRID_API_KEY=your_sendgrid_api_key

# Push database schema
railway run npm run db:push
```

## Option 3: Vercel + External Database

### Step 1: Setup Database
Use one of these database providers:
- **Neon** (recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **PlanetScale**: https://planetscale.com

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - DATABASE_URL
# - NODE_ENV=production
# - SESSION_SECRET
# - SENDGRID_API_KEY
```

### Step 3: Configure Database
```bash
# After setting DATABASE_URL, push schema
npm run db:push
```

## Option 4: DigitalOcean App Platform

### Step 1: Create App
1. Go to DigitalOcean App Platform
2. Connect your GitHub repository
3. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`

### Step 2: Add Database
1. Add PostgreSQL database component
2. Set environment variables:
   - `DATABASE_URL` (automatically set)
   - `NODE_ENV=production`
   - `SESSION_SECRET`
   - `SENDGRID_API_KEY`

### Step 3: Deploy
The app will automatically deploy and update on git pushes.

## Option 5: AWS/Google Cloud/Azure

### Using Docker
1. Build image: `docker build -t wrickit-social .`
2. Deploy to your preferred container service:
   - **AWS**: ECS or App Runner
   - **Google Cloud**: Cloud Run
   - **Azure**: Container Instances

### Environment Variables for Cloud Deployment
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secret-key
SENDGRID_API_KEY=your-api-key
PORT=5000
```

## Option 6: VPS Deployment (Advanced)

### Step 1: Server Setup
```bash
# Update server
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 2: Database Setup
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE wrickit;
CREATE USER wrickit_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE wrickit TO wrickit_user;
\q
```

### Step 3: Deploy Application
```bash
# Clone repository
git clone https://github.com/your-username/wrickit-social.git
cd wrickit-social

# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export DATABASE_URL=postgresql://wrickit_user:secure_password@localhost:5432/wrickit
export SESSION_SECRET=$(openssl rand -base64 32)
export SENDGRID_API_KEY=your_sendgrid_api_key

# Build application
npm run build

# Push database schema
npm run db:push

# Start with PM2
pm2 start npm --name "wrickit" -- start
pm2 startup
pm2 save
```

### Step 4: Setup Nginx (Optional)
```bash
# Install Nginx
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/wrickit

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/wrickit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Database Migration

For all deployments, after setting up the database connection:

```bash
# Push current schema to database
npm run db:push

# Or if you have migration files
npm run db:migrate
```

## Environment Variables Reference

### Required Variables
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://user:password@host:5432/database`
- `SESSION_SECRET=random-secret-key`

### Optional Variables
- `SENDGRID_API_KEY=your_sendgrid_api_key` (for email features)
- `PORT=5000` (some platforms set this automatically)

## Security Considerations

### Production Checklist
- [ ] Use strong, random SESSION_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Restrict database access to application only
- [ ] Use environment variables for all secrets
- [ ] Enable database connection limits
- [ ] Set up monitoring and logging
- [ ] Configure CORS properly
- [ ] Use secure headers middleware

### Recommended Security Headers
```javascript
// Add to your Express app
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

## Monitoring and Maintenance

### Recommended Tools
- **Error Tracking**: Sentry, Bugsnag
- **Performance**: New Relic, DataDog
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Database Monitoring**: Built-in platform tools

### Backup Strategy
- Set up automated database backups
- Test restore procedures regularly
- Store backups in multiple locations

## Troubleshooting Common Issues

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

### Database Connection Issues
- Verify DATABASE_URL format
- Check network connectivity
- Confirm database credentials
- Review firewall settings

### Performance Issues
- Enable database connection pooling
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets

## Cost Optimization

### Free Tiers Available
- **Heroku**: Free tier with limitations
- **Railway**: $5/month with generous limits
- **Vercel**: Free for personal projects
- **Neon Database**: Free tier with 0.5GB storage

### Scaling Considerations
- Start with basic plans
- Monitor usage and scale as needed
- Consider database read replicas for high traffic
- Implement caching for better performance

Choose the deployment option that best fits your technical expertise, budget, and scaling requirements!
# Setting Up Neon Database for Wrickit

## Step 1: Create Neon Account

1. **Go to neon.com**
2. **Click "Sign Up"** 
3. **Use your GitHub account** (recommended) or email
4. **No credit card required** for free tier

## Step 2: Create Your Database

1. **After signing up**, you'll see the dashboard
2. **Click "Create Project"**
3. **Settings:**
   - Project name: `wrickit-social-platform`
   - Region: Choose closest to your users (US East recommended)
   - PostgreSQL version: 16 (latest)
   - Compute size: 0.25 vCPU (free tier)

4. **Click "Create Project"**

## Step 3: Get Your Connection String

1. **In your new project dashboard**, click "Connection Details"
2. **Copy the connection string** - it looks like:
   ```
   postgresql://username:password@host.neon.com/database?sslmode=require
   ```
3. **Save this** - you'll need it for your Replit project

## Step 4: Update Your Replit Project

1. **In your Replit project**, go to the "Secrets" tab (lock icon in sidebar)
2. **Add a new secret:**
   - Key: `DATABASE_URL`
   - Value: Your Neon connection string
3. **Click "Add Secret"**

## Step 5: Import Your Database Schema

1. **In your Replit shell**, run:
   ```bash
   psql $DATABASE_URL -f wrickit_schema.sql
   ```
   
   This will create all 26 tables in your new Neon database.

## Step 6: Restart Your Application

1. **Click the "Run" button** in Replit to restart with the new database
2. **Your app will now connect to Neon instead of the temporary Replit database**

## Verification Steps

1. **Check connection** in Replit shell:
   ```bash
   psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
   ```

2. **Test your app** - try registering a new user to verify database writes work

## Benefits You Now Have

✅ **Permanent database** - no 36-day deletion
✅ **0.5GB storage** - plenty for your social platform
✅ **191 hours/month compute** - roughly 6+ hours daily
✅ **Automatic scaling** - sleeps when not used, wakes instantly
✅ **Professional backups** - 7-day point-in-time recovery
✅ **Database branching** - create test copies instantly

## Managing Your Neon Database

- **Neon Dashboard**: View usage, create branches, manage settings
- **SQL Editor**: Run queries directly in Neon's web interface
- **Monitoring**: Track compute hours and storage usage
- **Branching**: Create dev/staging environments instantly

## Cost Monitoring

- **Free tier limits**: 0.5GB storage, 191 compute hours/month
- **Usage tracking**: Monitor in Neon dashboard
- **Alerts**: Set up notifications before hitting limits
- **Upgrade path**: $19/month for 10GB storage if you grow

Your Wrickit social platform now has a professional, permanent database that will grow with your application!
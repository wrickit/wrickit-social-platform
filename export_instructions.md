# Complete Guide: Export Replit Database to Local PostgreSQL 17 on Windows 11

## Part 1: Export Database from Replit

### Step 1: Get Database Connection Details
Your Replit database connection details:
- Database: neondb
- User: neondb_owner
- Host: Available in DATABASE_URL environment variable

### Step 2: Create Database Schema Export
Run this command in your Replit shell to export just the schema:

```bash
pg_dump --schema-only --no-password --no-acl --no-owner $DATABASE_URL > wrickit_schema.sql
```

### Step 3: Create Database Data Export
Run this command to export the data:

```bash
pg_dump --data-only --no-password --no-acl --no-owner $DATABASE_URL > wrickit_data.sql
```

### Step 4: Download Export Files
1. In Replit file explorer, locate `wrickit_schema.sql` and `wrickit_data.sql`
2. Right-click each file and select "Download"
3. Save both files to your Windows 11 PC (e.g., `C:\wrickit_backup\`)

## Part 2: Set Up PostgreSQL 17 on Windows 11

### Step 1: Verify PostgreSQL Installation
Open Command Prompt as Administrator and verify:

```cmd
psql --version
```

If not installed, download from: https://www.postgresql.org/download/windows/

### Step 2: Start PostgreSQL Service
1. Press `Win + R`, type `services.msc`
2. Find "postgresql-x64-17" service
3. Right-click → Start (if not running)
4. Set to "Automatic" startup type

### Step 3: Access PostgreSQL
Open Command Prompt and connect:

```cmd
psql -U postgres
```

Enter your PostgreSQL password when prompted.

## Part 3: Import Database to Local PostgreSQL

### Step 1: Create New Database
In psql terminal:

```sql
CREATE DATABASE wrickit_local;
\c wrickit_local
```

### Step 2: Import Schema
Exit psql (`\q`) and run in Command Prompt:

```cmd
psql -U postgres -d wrickit_local -f "C:\wrickit_backup\wrickit_schema.sql"
```

### Step 3: Import Data
```cmd
psql -U postgres -d wrickit_local -f "C:\wrickit_backup\wrickit_data.sql"
```

### Step 4: Verify Import
Connect to database and check:

```cmd
psql -U postgres -d wrickit_local
```

```sql
\dt
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM posts;
```

## Part 4: Configure Remote Connection from PC to Replit

### Step 1: Set Up Local Development Environment

1. **Clone Project Locally** (if not done):
   ```cmd
   git clone https://github.com/yourusername/wrickit.git
   cd wrickit
   ```

2. **Install Dependencies**:
   ```cmd
   npm install
   ```

3. **Create Local Environment File**:
   Create `.env.local` in project root:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/wrickit_local
   SESSION_SECRET=your-32-character-random-string-here-12345
   NODE_ENV=development
   ```

### Step 2: Configure PostgreSQL for Local Development

1. **Update pg_hba.conf** (usually in `C:\Program Files\PostgreSQL\17\data\`):
   Add this line:
   ```
   host    wrickit_local    postgres    127.0.0.1/32    md5
   ```

2. **Restart PostgreSQL Service**:
   - Open Services (`services.msc`)
   - Restart "postgresql-x64-17"

### Step 3: Test Local Connection

Run your project locally:
```cmd
npm run dev
```

Visit `http://localhost:5000` to verify everything works.

## Part 5: Set Up Remote Connection to Replit Database

### Step 1: Install Database Client Tools

Download and install pgAdmin 4:
- Visit: https://www.pgadmin.org/download/pgadmin-4-windows/
- Install with default settings

### Step 2: Get Replit Database Connection String

In your Replit project, run:
```bash
echo $DATABASE_URL
```

This will show something like:
```
postgresql://username:password@host:port/database
```

### Step 3: Configure pgAdmin Connection

1. **Open pgAdmin 4**
2. **Right-click "Servers" → Register → Server**
3. **General Tab**:
   - Name: "Replit Wrickit DB"

4. **Connection Tab**:
   - Host: (extract from DATABASE_URL)
   - Port: 5432
   - Maintenance database: (database name from URL)
   - Username: (username from URL)
   - Password: (password from URL)
   - Save password: ✓

5. **SSL Tab**:
   - SSL mode: Require

6. **Click Save**

### Step 4: Connect from Your Application

To connect your local application to Replit database, update `.env.local`:

```env
DATABASE_URL=your-replit-database-url-here
SESSION_SECRET=your-session-secret
NODE_ENV=development
```

## Part 6: Database Synchronization Options

### Option A: Manual Sync
Periodically export from Replit and import to local using steps above.

### Option B: Real-time Development
- Use Replit database for development
- Keep local database as backup
- Use your local `.env.local` to switch between databases

### Option C: Two-way Sync Script
Create `sync-db.js`:

```javascript
// This would require careful implementation to avoid data conflicts
// Recommended to use manual sync for safety
```

## Troubleshooting

### Common Issues:

1. **Connection Refused**:
   - Check PostgreSQL service is running
   - Verify port 5432 is open
   - Check pg_hba.conf configuration

2. **Authentication Failed**:
   - Verify username/password
   - Check pg_hba.conf authentication method

3. **SSL Errors with Replit**:
   - Ensure SSL mode is set to "require"
   - Check firewall settings

4. **Permission Errors**:
   - Run Command Prompt as Administrator
   - Check file permissions for SQL dump files

### Useful Commands:

```cmd
# Check PostgreSQL status
sc query postgresql-x64-17

# Restart PostgreSQL
net stop postgresql-x64-17
net start postgresql-x64-17

# Connect with specific parameters
psql -h localhost -p 5432 -U postgres -d wrickit_local
```

## Security Notes

1. **Never commit** `.env.local` to version control
2. **Use strong passwords** for local PostgreSQL
3. **Regularly backup** both local and Replit databases
4. **Limit network access** to your local PostgreSQL instance
5. **Use VPN** when connecting to remote databases from public networks

This setup gives you full control over your database with both local development capabilities and remote access to your Replit instance.
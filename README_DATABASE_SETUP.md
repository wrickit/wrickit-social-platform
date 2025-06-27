# Wrickit Database Export & Local Setup Guide

## Quick Start for Windows 11 + PostgreSQL 17

### Step 1: Download Required Files
From your Replit project, download these files to your PC:
- `wrickit_schema.sql` (database structure)
- `setup_local_environment.bat` (automated setup script)
- `export_instructions.md` (detailed manual instructions)

### Step 2: Run Automated Setup
1. Open Command Prompt as Administrator
2. Navigate to your project folder
3. Run: `setup_local_environment.bat`
4. Follow the prompts and enter your PostgreSQL password when asked

### Step 3: Configure Environment
Edit `.env.local` file created by the script:
```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/wrickit_local
SESSION_SECRET=your-super-secret-32-char-string-here-123456789
NODE_ENV=development
PORT=5000
```

### Step 4: Test Your Setup
```cmd
npm run dev
```
Visit `http://localhost:5000` to verify everything works.

## Remote Database Connection

### Option 1: pgAdmin 4 (Recommended)
1. Download from: https://www.pgadmin.org/download/
2. Create new server connection with your Replit database URL
3. Use SSL mode: "Require"

### Option 2: Command Line Connection
Get your Replit DATABASE_URL and connect directly:
```cmd
psql "your-replit-database-url-here"
```

## Data Export from Replit

### Export Current Data (Run in Replit Shell)
```bash
# Export schema only
pg_dump --schema-only --no-password --no-acl --no-owner $DATABASE_URL > wrickit_schema.sql

# Export data only  
pg_dump --data-only --no-password --no-acl --no-owner $DATABASE_URL > wrickit_data.sql

# Or export everything
pg_dump --no-password --no-acl --no-owner $DATABASE_URL > wrickit_full_backup.sql
```

### Import to Local Database
```cmd
# Import schema first
psql -U postgres -d wrickit_local -f wrickit_schema.sql

# Then import data
psql -U postgres -d wrickit_local -f wrickit_data.sql
```

## Development Workflow Options

### Option A: Local Development
- Use local PostgreSQL database
- Faster development and testing
- Work offline

### Option B: Remote Development  
- Connect directly to Replit database
- Always synchronized
- Requires internet connection

### Option C: Hybrid Approach
- Develop locally
- Sync with Replit database periodically
- Best of both worlds

## Troubleshooting

### Common Issues:

**"psql: command not found"**
- Add PostgreSQL to your PATH: `C:\Program Files\PostgreSQL\17\bin`
- Or install PostgreSQL from official website

**"Authentication failed"**
- Check your PostgreSQL password
- Ensure PostgreSQL service is running (services.msc)
- Verify pg_hba.conf allows local connections

**"Connection refused"**
- Start PostgreSQL service: `net start postgresql-x64-17`
- Check if port 5432 is available
- Verify firewall settings

**"Database does not exist"**
- Create database: `psql -U postgres -c "CREATE DATABASE wrickit_local;"`

### Useful Commands:
```cmd
# Check PostgreSQL service status
sc query postgresql-x64-17

# Connect to PostgreSQL
psql -U postgres

# List databases
\l

# Connect to specific database
\c wrickit_local

# List tables
\dt

# Check table data
SELECT COUNT(*) FROM users;
```

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Use strong passwords** for PostgreSQL
3. **Regular backups** of both local and remote databases
4. **Firewall protection** for local PostgreSQL
5. **VPN usage** for remote connections on public networks

## File Structure After Setup
```
your-project/
├── wrickit_schema.sql          # Database structure
├── wrickit_data.sql           # Database content (if exported)
├── setup_local_environment.bat # Automated setup script
├── .env.local                 # Local environment config (create this)
├── package.json               # Node.js dependencies
└── README_DATABASE_SETUP.md   # This guide
```

## Next Steps
1. Set up your local environment using the automated script
2. Test the connection to ensure everything works
3. Begin local development with your full database
4. Set up pgAdmin for visual database management
5. Create regular backup routines

For detailed manual setup instructions, see `export_instructions.md`.
# 🚀 Deployment Guide for Event Koi

This guide will help you deploy the **Event Koi** application to the web. Since this is a **Next.js + MySQL** project, you have two main options.

---

## 📋 Pre-Deployment Checklist
- [x] Codebase is ready
- [x] Database connection updated to use Environment Variables (`src/lib/db.ts`)
- [ ] You have a GitHub account and the code is pushed to a repository

---

## 🛠 Option 1: Vercel + Cloud Database (Recommended)
**Best for:** Free tier usage, fast global performance, "The Next.js Way".

### Step 1: Push to GitHub
If you haven't already:
1. Create a new repository on GitHub.
2. Push your code:
   ```bash
   git add .
   git commit -m "Ready for deploy"
   git brnach -M main
   # git remote add origin <your-repo-url>
   git push -u origin main
   ```

### Step 2: Set up a Cloud MySQL Database
Since Vercel only hosts the application code, you need a separate place for the database.
**Top Free/Cheap Options:**
1. **Aiven** (Free MySQL tier)
2. **Railway** (Has a trial/usage based MySQL)
3. **PlanetScale** (Excellent for Next.js, but paid plans mostly)

**Example with Aiven/Railway:**
1. Create a MySQL service.
2. Get the **Connection URL** or credentials (Host, User, Password, Port).
3. Connect to this cloud database using your local terminal or a tool like MySQL Workbench/DBeaver.
4. Run your SQL scripts (`database/01_schema.sql`, etc.) on this **cloud database** to set up the tables.

### Step 3: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com) and Sign Up/Login.
2. Click **"Add New Project"** -> **"Import"** (Select your GitHub repo).
3. In the **Environment Variables** section, add the settings from your Cloud Database:
   - `DB_HOST`: (e.g., `mysql-service.railway.internal` or IP)
   - `DB_USER`: (e.g., `root`)
   - `DB_PASSWORD`: (Your cloud db password)
   - `DB_NAME`: `event_koi`
   - `DB_PORT`: (e.g., `3306`)
   - `DB_SSL`: `true` (Most cloud providers require this)
4. Click **Deploy**.

---

## 🚂 Option 2: Railway (All-in-One)
**Best for:** Simplicity. Hosts both the App and Database together easily.

1. Go to [Railway.app](https://railway.app).
2. Login with GitHub.
3. Click **"New Project"**.
4. Select **"Deploy from GitHub repo"** and choose your `event-koi` repo.
5. Right-click on the project canvas -> **"New"** -> **"Database"** -> **"MySQL"**.
6. Click on the new MySQL service -> **"Variables"**.
7. Copy the credentials (MYSQL_USER, MYSQL_PASSWORD, etc.).
8. Go to your Next.js App service -> **"Variables"**.
9. Add the variables mapping them to your code:
   - `DB_HOST` = `${MYSQLHOST}`
   - `DB_USER` = `${MYSQLUSER}`
   - `DB_PASSWORD` = `${MYSQLPASSWORD}`
   - `DB_PORT` = `${MYSQLPORT}`
   - `DB_NAME` = `${MYSQLDATABASE}`
10. Connect to the Railway MySQL (via the "Connect" tab instructions) and run your SQL scripts to initialize the database.

---

## 🖥 Option 3: VPS (DigitalOcean / AWS / Linode)
**Best for:** Full control, mimicking your local setup exactly.

1. Provision an Ubuntu Server.
2. Install Node.js, NPM, and MySQL.
3. Clone your repo.
4. Run `npm install` and `npm run build`.
5. Start the app with PM2: `pm2 start npm --name "event-koi" -- start`.
6. Configure Nginx as a reverse proxy to port 3000.

---

## ⚠️ Important Note on Database
**You MUST run your SQL scripts on the production database.**
When you deploy, the new database starts **empty**. You need to run:
1. `01_schema.sql`
2. `02_procedures_triggers.sql`
3. `03_views_indexes.sql`
4. `04_seed.sql`

To do this remotely:
```bash
mysql -h <cloud-host> -u <cloud-user> -p <cloud-db-name> < database/01_schema.sql
# ... repeat for other files
```

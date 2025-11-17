# Personal Planning System - Mac Setup Guide

Complete guide to get the Personal Planning System running on your Mac.

## Table of Contents
1. [Prerequisites Installation](#prerequisites-installation)
2. [Clone the Repository](#clone-the-repository)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites Installation

### 1. Install Homebrew (if not already installed)

Homebrew is the package manager for macOS.

```bash
# Check if Homebrew is installed
brew --version

# If not installed, install it:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js and npm

```bash
# Install Node.js (version 18 or higher)
brew install node

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Verify PostgreSQL is running
brew services list | grep postgresql
# Should show "started"

# Check PostgreSQL version
psql --version  # Should show 14.x or higher
```

### 4. Get Anthropic API Key

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

---

## Clone the Repository

```bash
# Navigate to your preferred directory
cd ~/Documents  # or wherever you want to store the project

# Clone the repository
git clone https://github.com/sunsetchow/personal-planning-system.git

# Navigate into the project
cd personal-planning-system

# Checkout the correct branch
git checkout claude/ai-planning-system-018AhJF7GjEvrtxt4VZgWVTm
```

---

## Backend Setup

### 1. Create PostgreSQL Database

```bash
# Create the database
createdb personal_planning

# Verify the database was created
psql -l | grep personal_planning
```

**Troubleshooting:** If `createdb` command is not found:
```bash
# Find PostgreSQL bin directory
brew --prefix postgresql@14
# Add to PATH (add this to your ~/.zshrc or ~/.bash_profile)
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
# Reload shell
source ~/.zshrc  # or source ~/.bash_profile
```

### 2. Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install all dependencies
npm install

# This will install all packages listed in package.json
```

### 3. Configure Environment Variables

```bash
# Create .env file from example
cp .env.example .env

# Open .env file in your editor
nano .env
# or
code .env  # if you have VS Code
# or
open -a TextEdit .env
```

**Edit the `.env` file with your actual values:**

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database - Update with your PostgreSQL connection
# For Mac with Homebrew PostgreSQL, the default is:
DATABASE_URL="postgresql://$(whoami)@localhost:5432/personal_planning?schema=public"

# JWT Configuration - Generate a secure random string
# You can generate one with: openssl rand -base64 32
JWT_SECRET=your-generated-secure-random-string-here-min-32-chars
JWT_EXPIRES_IN=7d

# Anthropic API - Add your API key from console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Generate a secure JWT_SECRET:**
```bash
# Run this command to generate a secure random string
openssl rand -base64 32
# Copy the output and paste it as your JWT_SECRET
```

### 4. Set Up Database Schema

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# You'll be prompted to name the migration, for example: "init"
```

### 5. Verify Backend Setup

```bash
# Start the backend server
npm run dev

# You should see:
# ✅ Database connected successfully
# 🚀 Server running on port 5000
# 📝 Environment: development
# 🔗 Health check: http://localhost:5000/health
```

**Test the health endpoint:**
```bash
# In a new terminal window
curl http://localhost:5000/health

# Should return:
# {"success":true,"message":"Server is running","timestamp":"2025-11-17T..."}
```

**Stop the server** (Ctrl+C in the terminal running the server)

---

## Frontend Setup

### 1. Install Frontend Dependencies

```bash
# Open a new terminal window
cd ~/Documents/personal-planning-system/frontend
# (adjust path to match where you cloned the repo)

# Install all dependencies
npm install
```

### 2. Configure Frontend Environment Variables

```bash
# Create .env.local file from example
cp .env.local.example .env.local

# Open .env.local file
nano .env.local
# or
code .env.local
# or
open -a TextEdit .env.local
```

**Edit the `.env.local` file:**

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Verify Frontend Setup

```bash
# Start the frontend development server
npm run dev

# You should see:
# ▲ Next.js 15.x.x
# - Local:        http://localhost:3000
# - Environments: .env.local
# ✓ Ready in Xms
```

**Open your browser** to http://localhost:3000

You should see the Next.js default page.

---

## Running the Application

### Option 1: Using Two Terminal Windows

**Terminal 1 - Backend:**
```bash
cd ~/Documents/personal-planning-system/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd ~/Documents/personal-planning-system/frontend
npm run dev
```

### Option 2: Using tmux (Recommended for convenience)

```bash
# Install tmux if you don't have it
brew install tmux

# Start tmux session
tmux new -s planning-app

# Split window horizontally (Ctrl+B then ")
# In the top pane:
cd ~/Documents/personal-planning-system/backend && npm run dev

# Switch to bottom pane (Ctrl+B then down arrow)
cd ~/Documents/personal-planning-system/frontend && npm run dev

# To detach from tmux: Ctrl+B then D
# To reattach: tmux attach -t planning-app
# To kill session: tmux kill-session -t planning-app
```

### Option 3: Using VS Code (if you use VS Code)

1. Open the project in VS Code:
   ```bash
   cd ~/Documents/personal-planning-system
   code .
   ```

2. Open two terminals in VS Code (Terminal menu → New Terminal)
3. In first terminal: `cd backend && npm run dev`
4. In second terminal: `cd frontend && npm run dev`

---

## Verify Everything is Working

### 1. Check Backend
```bash
# In a new terminal
curl http://localhost:5000/health
```

**Expected output:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-17T..."
}
```

### 2. Check Frontend
Open your browser to: http://localhost:3000

You should see the Next.js application running.

### 3. Check Database Connection
```bash
# Open Prisma Studio to view your database
cd backend
npm run prisma:studio
```

This will open http://localhost:5555 where you can view and edit your database tables.

---

## Troubleshooting

### PostgreSQL Issues

**Issue: "psql: error: connection to server on socket"**
```bash
# Make sure PostgreSQL is running
brew services list | grep postgresql

# If not running, start it
brew services start postgresql@14

# If still having issues, try restarting
brew services restart postgresql@14
```

**Issue: "database does not exist"**
```bash
# Create the database again
createdb personal_planning
```

**Issue: "role does not exist"**
```bash
# Create your user role
psql postgres -c "CREATE ROLE $(whoami) WITH LOGIN SUPERUSER;"
```

### Node.js Issues

**Issue: "Cannot find module" or dependency errors**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: "Port 5000 already in use"**
```bash
# Find what's using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)

# Or change the port in backend/.env
PORT=5001
```

**Issue: "Port 3000 already in use"**
```bash
# Kill the process using port 3000
kill -9 $(lsof -ti:3000)

# Or run frontend on different port
npm run dev -- -p 3001
```

### Prisma Issues

**Issue: "Prisma Client did not initialize yet"**
```bash
cd backend
npm run prisma:generate
```

**Issue: "Migration failed"**
```bash
# Reset the database (WARNING: This deletes all data)
npm run prisma:migrate reset

# Or manually drop and recreate
dropdb personal_planning
createdb personal_planning
npm run prisma:migrate
```

### Environment Variable Issues

**Issue: "Missing required environment variable"**

Make sure your `.env` file exists and has all required variables:
```bash
# Check if .env exists
ls -la backend/.env

# If missing, copy from example
cp backend/.env.example backend/.env

# Then edit with your actual values
nano backend/.env
```

### Permission Issues

**Issue: "EACCES: permission denied"**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /opt/homebrew  # or /usr/local for Intel Macs
```

---

## Quick Reference Commands

### Start Everything
```bash
# Backend
cd backend && npm run dev

# Frontend (in new terminal)
cd frontend && npm run dev

# Prisma Studio (in new terminal)
cd backend && npm run prisma:studio
```

### Stop Everything
- Press `Ctrl+C` in each terminal window

### View Database
```bash
cd backend && npm run prisma:studio
```

### View Logs
- Backend logs appear in the terminal running `npm run dev`
- Frontend logs appear in both terminal and browser console (F12)

### Common Development Commands

**Backend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
```

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Check code quality
```

---

## Next Steps

Once everything is running:

1. **Phase 2**: Implement authentication system
2. **Phase 3**: Build OKR tracking features
3. **Phase 4**: Create daily journal features
4. **Phase 5**: Integrate Claude AI features

Refer to `plan.md` for the complete implementation roadmap.

---

## Getting Help

- **Project Documentation**: See `README.md` in the root directory
- **Implementation Plan**: See `plan.md` for detailed roadmap
- **Code Guidelines**: See `CLAUDE.md` for code quality standards
- **Database Schema**: See `backend/prisma/schema.prisma`

---

## Useful Mac Tools

### Install Optional Development Tools

```bash
# Install VS Code (if you don't have it)
brew install --cask visual-studio-code

# Install Postman (for API testing)
brew install --cask postman

# Install TablePlus (nice PostgreSQL GUI)
brew install --cask tableplus

# Install iTerm2 (better terminal)
brew install --cask iterm2
```

---

**Happy Coding! 🚀**

If you encounter any issues not covered here, check the GitHub issues or create a new one.

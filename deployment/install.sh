#!/bin/bash

# MikroTik Dashboard - Quick Setup Script
# Prerequisites: Node.js 18+, PM2, Git already installed

set -e  # Exit on error

echo "=========================================="
echo "MikroTik Dashboard - Quick Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "❌ Please do not run this script as root"
    exit 1
fi

# Check Node.js
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi
echo "✅ Node.js: $(node --version)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi
echo "✅ npm: $(npm --version)"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found. Installing PM2..."
    npm install -g pm2
fi
echo "✅ PM2: $(pm2 --version)"

# Install dependencies
echo ""
echo "📦 Installing npm packages..."
npm install

# Setup environment
echo ""
echo "⚙️  Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate NEXTAUTH_SECRET
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Get server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    # Update .env file
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" .env
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"http://$SERVER_IP:3500\"|" .env
    
    echo "✅ Environment file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "⚠️  Please edit .env file to configure MikroTik connection:"
echo "   nano .env"
echo "   Update: MIKROTIK_IP, MIKROTIK_USER, MIKROTIK_PASS"
read -p "Press Enter to continue after editing .env..."

# Setup Prisma
echo ""
echo "🗄️  Setting up Prisma..."
npx prisma generate
npx prisma migrate deploy

# Seed database
echo ""
read -p "Seed database with initial data (admin user)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma db seed
    echo "✅ Database seeded"
fi

# Build application
echo ""
echo "🔨 Building application..."
npm run build

# Setup PM2
echo ""
read -p "Setup PM2 for auto-start? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting up PM2..."
    
    # Stop existing processes (if any)
    pm2 delete mikrotik-dashboard 2>/dev/null || true
    pm2 delete mikrotik-worker 2>/dev/null || true
    
    # Start web application
    pm2 start npm --name "mikrotik-dashboard" -- start
    
    # Start worker
    pm2 start npm --name "mikrotik-worker" -- run worker
    
    # Save PM2 process list
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    echo ""
    echo "⚠️  Copy and run the command above to enable PM2 auto-start on boot"
    
    echo "✅ PM2 configured"
fi

# Installation complete
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Application is running on: http://$SERVER_IP:3500"
echo ""
echo "Default login:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change default password after first login!"
echo ""
echo "Useful PM2 commands:"
echo "  - Check status: pm2 status"
echo "  - View logs: pm2 logs mikrotik-dashboard"
echo "  - Restart: pm2 restart mikrotik-dashboard"
echo "  - Stop: pm2 stop mikrotik-dashboard"
echo ""

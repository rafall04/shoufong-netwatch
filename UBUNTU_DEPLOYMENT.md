# MikroTik Dashboard - Ubuntu Deployment Guide

Panduan deployment MikroTik Dashboard di Ubuntu Server/Desktop.

**Prerequisites:** Node.js 18+, PM2, Git sudah terinstall

**Repository:** https://github.com/rafall04/shoufong-netwatch.git

**Database:** SQLite (file-based, tidak perlu PostgreSQL)

---

## 📋 Persyaratan

### Software yang Harus Sudah Terinstall
- **Node.js**: 18.x atau lebih baru
- **npm**: 9.x atau lebih baru
- **PM2**: Latest version (process manager)
- **Git**: Latest version

### Verifikasi Prerequisites

```bash
# Check Node.js
node --version  # Should show v18.x.x or higher

# Check npm
npm --version   # Should show 9.x.x or higher

# Check PM2
pm2 --version

# Check Git
git --version
```

### Install PM2 (jika belum ada)

```bash
npm install -g pm2
```

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/rafall04/shoufong-netwatch.git mikrotik-dashboard
cd mikrotik-dashboard

# Set ownership
sudo chown -R $USER:$USER /opt/mikrotik-dashboard
```

### 2. Install Dependencies

```bash
cd /opt/mikrotik-dashboard
npm install
```

### 3. Setup Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env
```

Isi file `.env` dengan konfigurasi berikut:

```env
# NextAuth
AUTH_SECRET="generate-random-secret-here"
AUTH_TRUST_HOST=true
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

**IMPORTANT:** 
- Database: SQLite (hardcoded di schema: `file:./devicemap.db`)
- **MikroTik configuration via Web UI**, BUKAN di .env!
- Setelah deploy, login dan configure di: **Admin > Config**

### 4. Setup Prisma (SQLite)

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 5. Build Application

```bash
npm run build
```

### 6. Start with PM2

```bash
# Start web application
pm2 start npm --name "mikrotik-dashboard" -- start

# Start worker
pm2 start npm --name "mikrotik-worker" -- run worker

# Save PM2 process list
pm2 save

# Setup auto-start on boot
pm2 startup
# Copy dan jalankan command yang muncul
```

---

## 🏃 Running the Application

### Development Mode

```bash
# Start development server
npm run dev

# Application akan berjalan di http://localhost:3500
```

### Production Mode with PM2

```bash
# Start processes
pm2 start npm --name "mikrotik-dashboard" -- start
pm2 start npm --name "mikrotik-worker" -- run worker

# Save process list
pm2 save

# Application akan berjalan di http://your-server-ip:3500
```

---

## 🔧 PM2 Process Management

### Basic Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs mikrotik-dashboard
pm2 logs mikrotik-worker
pm2 logs  # All logs

# Restart processes
pm2 restart mikrotik-dashboard
pm2 restart mikrotik-worker
pm2 restart all

# Stop processes
pm2 stop mikrotik-dashboard
pm2 stop mikrotik-worker
pm2 stop all

# Delete processes
pm2 delete mikrotik-dashboard
pm2 delete mikrotik-worker
pm2 delete all
```

### Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process information
pm2 info mikrotik-dashboard

# Show logs with timestamp
pm2 logs --timestamp
```

### Auto-Start on Boot

```bash
# Generate startup script
pm2 startup

# Copy dan jalankan command yang muncul
# Contoh: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# Save current process list
pm2 save

# Disable auto-start (if needed)
pm2 unstartup
```

---

## 🔥 Firewall Configuration

### UFW (Uncomplicated Firewall)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow application port
sudo ufw allow 3500/tcp

# Check status
sudo ufw status
```

---

## 📊 Monitoring & Logs

### PM2 Logs

```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs mikrotik-dashboard
pm2 logs mikrotik-worker

# View last 100 lines
pm2 logs --lines 100

# Clear logs
pm2 flush
```

### Database File

```bash
# Check database file
ls -la prisma/devicemap.db

# Backup database
cp prisma/devicemap.db prisma/devicemap.db.backup

# Check database size
du -h prisma/devicemap.db
```

---

## 🔄 Update & Maintenance

### Update Application

```bash
cd /opt/mikrotik-dashboard

# Stop PM2 processes
pm2 stop all

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations (if any)
npx prisma migrate deploy

# Rebuild application
npm run build

# Restart PM2 processes
pm2 restart all
```

### Database Backup

```bash
# Create backup directory
mkdir -p /opt/backups

# Backup database
cp prisma/devicemap.db /opt/backups/devicemap_$(date +%Y%m%d_%H%M%S).db

# Restore from backup
cp /opt/backups/devicemap_20240120_120000.db prisma/devicemap.db
pm2 restart all
```

### Automated Backup (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cp /opt/mikrotik-dashboard/prisma/devicemap.db /opt/backups/devicemap_$(date +\%Y\%m\%d_\%H\%M\%S).db

# Keep only last 7 days of backups
0 3 * * * find /opt/backups -name "devicemap_*.db" -mtime +7 -delete
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs mikrotik-dashboard --lines 50

# Check if port 3500 is already in use
sudo netstat -tulpn | grep 3500

# Restart process
pm2 restart mikrotik-dashboard

# Check Node.js version
node --version  # Should be 18.x or higher
```

### Database Issues

```bash
# Check database file exists
ls -la prisma/devicemap.db

# Regenerate Prisma client
npx prisma generate

# Check database integrity
npx prisma studio  # Opens web UI to view database

# Reset database (WARNING: deletes all data)
rm prisma/devicemap.db
npx prisma migrate deploy
npx prisma db seed
```

### Worker Not Running

```bash
# Check PM2 status
pm2 status

# Check worker logs
pm2 logs mikrotik-worker --lines 50

# Restart worker
pm2 restart mikrotik-worker

# Test MikroTik connection
# Check MIKROTIK_IP, MIKROTIK_USER, MIKROTIK_PASS in .env
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/mikrotik-dashboard

# Fix permissions
chmod -R 755 /opt/mikrotik-dashboard

# Fix database file permissions
chmod 644 prisma/devicemap.db
```

### Port Already in Use

```bash
# Find process using port 3500
sudo lsof -i :3500

# Kill process (replace PID)
sudo kill -9 <PID>

# Or change port in package.json
```

### PM2 Not Auto-Starting After Reboot

```bash
# Check startup script
pm2 startup

# Save process list
pm2 save

# Check if startup script is enabled
systemctl status pm2-username

# Manually start PM2
pm2 resurrect
```

---

## 🔐 Security Best Practices

### 1. Change Default Passwords

```bash
# Login to application and change admin password
# Default: admin / admin123
```

### 2. Secure .env File

```bash
# Restrict .env file permissions
chmod 600 .env

# Never commit .env to git
echo ".env" >> .gitignore
```

### 3. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /opt/mikrotik-dashboard
npm update

# Update PM2
npm install -g pm2@latest
pm2 update
```

### 4. Firewall Configuration

```bash
# Only allow necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 3500/tcp
sudo ufw enable
```

---

## 📱 Access Application

### Network Access
```
http://your-server-ip:3500
```

### Default Login
```
Username: admin
Password: admin123

⚠️ IMPORTANT: Change default password immediately after first login!
```

---

## 📞 Support & Resources

### Useful Commands Cheat Sheet

```bash
# PM2 Management
pm2 status                    # Check status
pm2 logs                      # View logs
pm2 restart all               # Restart all
pm2 stop all                  # Stop all
pm2 monit                     # Monitor

# Application
npm run dev                   # Development mode
npm run build                 # Build for production
npm run worker                # Run worker manually

# Prisma
npx prisma generate           # Generate client
npx prisma migrate deploy     # Run migrations
npx prisma studio             # Open database UI

# Database
cp prisma/devicemap.db backup.db  # Backup
ls -lh prisma/devicemap.db        # Check size
```

### Performance Tuning

```bash
# Increase Node.js memory limit (if needed)
pm2 delete mikrotik-dashboard
pm2 start npm --name "mikrotik-dashboard" --node-args="--max-old-space-size=4096" -- start

# Save configuration
pm2 save
```

---

## ✅ Post-Installation Checklist

- [ ] Node.js 18+ installed
- [ ] PM2 installed
- [ ] Repository cloned
- [ ] Environment variables configured (.env)
- [ ] Dependencies installed (npm install)
- [ ] Prisma setup completed
- [ ] Application built (npm run build)
- [ ] PM2 processes running
- [ ] PM2 auto-start configured
- [ ] Firewall configured
- [ ] Application accessible via browser
- [ ] Default password changed
- [ ] Backup strategy configured

---

## 🎉 Selesai!

Dashboard MikroTik Anda sekarang sudah berjalan di Ubuntu dengan PM2!

Akses aplikasi di: **http://your-server-ip:3500**

Untuk pertanyaan atau masalah, periksa bagian Troubleshooting di atas.

---

**Repository**: https://github.com/rafall04/shoufong-netwatch.git  
**Database**: SQLite (prisma/devicemap.db)  
**Process Manager**: PM2  
**Port**: 3500  
**Last Updated**: January 20, 2026  
**Version**: 3.0

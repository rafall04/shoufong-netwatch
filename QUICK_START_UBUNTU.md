# Quick Start - Ubuntu

Panduan cepat untuk menjalankan MikroTik Dashboard di Ubuntu.

**Prerequisites:** Node.js 18+, PM2, Git sudah terinstall

**Database:** SQLite (file-based, tidak perlu PostgreSQL)

---

## 🚀 Instalasi Cepat (3 Menit)

### 1. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/rafall04/shoufong-netwatch.git mikrotik-dashboard
cd mikrotik-dashboard
sudo chown -R $USER:$USER /opt/mikrotik-dashboard
```

### 2. Install PM2 (jika belum ada)

```bash
npm install -g pm2
```

### 3. Install & Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env
# Edit: NEXTAUTH_SECRET, MIKROTIK_*

# Generate NEXTAUTH_SECRET
openssl rand -base64 32  # Copy hasil ini ke NEXTAUTH_SECRET

# Setup Prisma (SQLite)
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Build
npm run build
```

### 4. Start with PM2

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

## 🤖 Instalasi Otomatis (Script)

```bash
cd /opt/mikrotik-dashboard
chmod +x deployment/install.sh
./deployment/install.sh
```

Script akan otomatis:
- Install PM2 (jika belum ada)
- Install npm packages
- Generate environment file
- Setup Prisma (SQLite)
- Build application
- Start dengan PM2

---

## 📝 Konfigurasi .env

```env
# NextAuth
NEXTAUTH_URL="http://your-server-ip:3500"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

**Generate secret:**
```bash
openssl rand -base64 32
```

**Note:** 
- Tidak perlu DATABASE_URL (SQLite auto-configured di `prisma/devicemap.db`)
- **MikroTik config diatur via Web UI**, bukan .env!
- Setelah install, login dan ke: **Dashboard > Admin > Config**

---

## 🔧 PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs mikrotik-dashboard
pm2 logs mikrotik-worker

# Restart
pm2 restart mikrotik-dashboard
pm2 restart mikrotik-worker
pm2 restart all

# Stop
pm2 stop mikrotik-dashboard
pm2 stop mikrotik-worker
pm2 stop all

# Delete process
pm2 delete mikrotik-dashboard
pm2 delete mikrotik-worker

# Monitor
pm2 monit
```

---

## 🌐 Access Application

**Network:**
```
http://your-server-ip:3500
```

**Default Login:**
- Username: `admin`
- Password: `admin123`

⚠️ **Segera ganti password setelah login pertama!**

---

## 🔄 Update Application

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

# Rebuild
npm run build

# Restart PM2
pm2 restart all
```

---

## 🐛 Troubleshooting

### Application tidak start
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs mikrotik-dashboard --lines 50

# Check port
sudo netstat -tulpn | grep 3500

# Restart
pm2 restart mikrotik-dashboard
```

### Database error
```bash
# Check database file
ls -la prisma/devicemap.db

# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
rm prisma/devicemap.db
npx prisma migrate deploy
npx prisma db seed
```

### Worker tidak berjalan
```bash
# Check status
pm2 status

# Check logs
pm2 logs mikrotik-worker --lines 50

# Restart
pm2 restart mikrotik-worker
```

### PM2 tidak auto-start setelah reboot
```bash
# Setup startup script
pm2 startup

# Copy dan jalankan command yang muncul
# Contoh: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# Save process list
pm2 save
```

---

## ✅ Checklist

- [ ] Node.js 18+ installed
- [ ] PM2 installed
- [ ] Repository cloned
- [ ] .env configured
- [ ] npm install completed
- [ ] Prisma setup completed
- [ ] Application built
- [ ] PM2 processes running
- [ ] PM2 auto-start configured
- [ ] Application accessible
- [ ] Default password changed

---

**Repository:** https://github.com/rafall04/shoufong-netwatch.git  
**Port:** 3500  
**Database:** SQLite (prisma/devicemap.db)  
**Process Manager:** PM2  
**Default Login:** admin / admin123

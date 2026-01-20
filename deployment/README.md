# Deployment Files

Folder ini berisi file-file yang diperlukan untuk deployment di Ubuntu.

**Prerequisites:** Node.js 18+, PM2, Git sudah terinstall

**Database:** SQLite (tidak perlu PostgreSQL)

## Files

### 1. `install.sh`
Automated setup script untuk Ubuntu.

**Usage:**
```bash
chmod +x install.sh
./install.sh
```

Script akan otomatis:
- Check prerequisites (Node.js, npm, PM2)
- Install PM2 jika belum ada
- Install npm packages
- Generate environment file (AUTH_SECRET)
- Setup Prisma (SQLite)
- Build application
- Start dengan PM2

**Note:** MikroTik config via Web UI setelah install!

## Quick Start

### Clone Repository
```bash
cd /opt
sudo git clone https://github.com/rafall04/shoufong-netwatch.git mikrotik-dashboard
cd mikrotik-dashboard
sudo chown -R $USER:$USER /opt/mikrotik-dashboard
```

### Run Installation Script
```bash
chmod +x deployment/install.sh
./deployment/install.sh
```

### Access Application
```
http://your-server-ip:3500
```

**Default Login:**
- Username: admin
- Password: admin123

## Manual Installation

See `QUICK_START_UBUNTU.md` in the root directory for manual installation instructions.

## PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs mikrotik-dashboard
pm2 logs mikrotik-worker

# Restart
pm2 restart all

# Stop
pm2 stop all

# Monitor
pm2 monit
```

## Notes

- Default port: **3500**
- Database: **SQLite** (prisma/devicemap.db)
- Process Manager: **PM2** (bukan systemd)
- MikroTik config: **Via Web UI** (Dashboard > Admin > Config)
- Node.js 18+ and PM2 must be already installed
- No PostgreSQL required (menggunakan SQLite)

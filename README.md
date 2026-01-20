# MikroTik Netwatch Visual Dashboard

Real-time network device monitoring dashboard with visual lane-based mapping, integrated with MikroTik Netwatch for status polling.

**Repository:** https://github.com/rafall04/shoufong-netwatch.git

## 🚀 Quick Start

### Development Mode

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Application will run on **http://localhost:3500**

### Production Deployment (Ubuntu)

See **[QUICK_START_UBUNTU.md](QUICK_START_UBUNTU.md)** for quick installation guide.

See **[UBUNTU_DEPLOYMENT.md](UBUNTU_DEPLOYMENT.md)** for complete deployment documentation.

## 📋 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database

```bash
npx prisma db seed
```

This will create:
- Default admin user (username: `admin`, password: `admin123`)
- Default system configuration

### 5. Configure Environment

Copy `.env.example` to `.env` and configure:

```env
AUTH_SECRET="your-secret-here"
AUTH_TRUST_HOST=true
```

Generate secret with: `openssl rand -base64 32`

**Note:** 
- Database: SQLite (hardcoded di schema: `file:./devicemap.db`)
- MikroTik config: Via Web UI (**Dashboard > Admin > Config**)

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3500](http://localhost:3500) in your browser.

### 7. Run the Background Worker (Required for Monitoring)

In a separate terminal:

```bash
npm run worker
```

The worker polls MikroTik Netwatch and updates device status in real-time.

## 🔐 Default Login

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Change default password immediately after first login!**

## 🧪 Testing

Run all tests:

```bash
npm test
```

## 📁 Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - React components
- `/lib` - Utility functions and Prisma client
- `/prisma` - Database schema and migrations
- `/deployment` - Ubuntu deployment files (systemd, nginx)
- `worker.ts` - Background MikroTik poller

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5
- **UI**: Tailwind CSS, Lucide React icons
- **Map**: React Flow (with device connections and animated flow)
- **Process Manager**: PM2 (production)
- **Testing**: Vitest, fast-check (property-based testing)

## ✨ Key Features

### Visual Network Mapping
- **Interactive Map**: Drag-and-drop device positioning
- **Device Connections**: Visual lines/cables between devices
- **Animated Flow**: Real-time animated data flow on connections
- **Status Colors**: Green (UP), Red (DOWN), Gray (Unknown)
- **Layout Elements**: Lanes, Rooms, Dividers, Labels

### Device Connections
- **Add Connections**: Right-click device → "Add Connection"
- **Connection Types**: Cable, Wireless, Virtual
- **Animated Flow**: Shows data flowing when both devices are UP
- **Status-Based Colors**: Connection color changes based on device status
- **Connection Management**: View, edit, and delete connections
- **Keyboard Shortcut**: Select connection and press Delete to remove

### Real-Time Monitoring
- **Auto-Refresh**: Updates every 20 seconds
- **Manual Refresh**: Sync with MikroTik on-demand
- **Status History**: 24-hour timeline for each device
- **Last Seen**: Track when device was last online

### User Management
- **Role-Based Access**: Admin, Operator, Viewer
- **Permissions**: Viewers can only view, Operators can edit, Admins can manage users

## 🌐 Port Configuration

- **Development**: Port 3500
- **Production**: Port 3500 (configurable in `package.json`)

## 📚 Documentation

- **[QUICK_START_UBUNTU.md](QUICK_START_UBUNTU.md)** - Quick installation guide for Ubuntu
- **[UBUNTU_DEPLOYMENT.md](UBUNTU_DEPLOYMENT.md)** - Complete deployment documentation
- **[deployment/README.md](deployment/README.md)** - Deployment files documentation

## 🔧 Useful Commands

```bash
# Development
npm run dev              # Start dev server (port 3500)
npm run worker           # Start background worker

# Production
npm run build            # Build for production
npm run start            # Start production server (port 3500)

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations (dev)
npx prisma migrate deploy # Run migrations (production)
npx prisma db seed       # Seed database
npx prisma studio        # Open Prisma Studio

# Testing
npm test                 # Run all tests
npm run test:verbose     # Run tests with verbose output
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Windows
netstat -ano | findstr :3500
taskkill /PID <PID> /F

# Linux/Ubuntu
sudo lsof -i :3500
sudo kill -9 <PID>
```

### Database issues
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

### Worker not updating status
```bash
# Check worker logs (PM2)
pm2 logs mikrotik-worker

# Or run worker manually
npm run worker

# Verify MikroTik connection in .env
# Check MIKROTIK_IP, MIKROTIK_USER, MIKROTIK_PASS
```

## 📞 Support

For issues and questions:
1. Check troubleshooting section above
2. See [UBUNTU_DEPLOYMENT.md](UBUNTU_DEPLOYMENT.md) for detailed documentation
3. Check PM2 logs: `pm2 logs mikrotik-dashboard`

## 📄 License

Private project - All rights reserved

---

**Note:** Untuk push ke GitHub, jalankan:
```bash
git add .
git commit -m "Update port to 3500 and add Ubuntu deployment docs"
git push origin main
```

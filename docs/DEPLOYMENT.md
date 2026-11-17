# Equiply Production Deployment & Scheduler Guide

This guide covers host-agnostic production deployment for **Equiply (USTP Campus Equipment Portal)** on Docker-based platforms (Render, Fly.io, Koyeb, Railway) or a university/Linux VPS.

---

## 1. Production Environment Checklist

Set the following environment variables in your host's secrets/config panel (never commit `.env` to Git):

### Core Application
- `APP_NAME="Equiply"`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=` *(generate via `php artisan key:generate --show`)*
- `APP_URL=https://your-equiply-domain.edu.ph`

### Database (MongoDB Atlas)
- `DB_CONNECTION=mongodb`
- `DB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"`
- `DB_DATABASE=equiply_db`

### Cache, Session & Queue
- `CACHE_STORE=database` *(or `file` / `redis`)*
- `SESSION_DRIVER=database` *(or `cookie`)*
- `QUEUE_CONNECTION=sync` *(or `database` with a dedicated `php artisan queue:work` worker)*

### Transactional Email (Choose Option A or Option B)

**Option A: Resend (Recommended — First-Party Laravel Transport)**
```env
MAIL_MAILER=resend
RESEND_KEY=re_your_api_key_here
MAIL_FROM_ADDRESS="noreply@equiply.ustp.edu.ph"
MAIL_FROM_NAME="Equiply • USTP Facility Operations"
```
*(Note: `config/mail.php` also includes a `failover` mailer that falls back from `resend` to `log` if needed.)*

**Option B: Gmail / Institutional SMTP**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=tls
MAIL_USERNAME=your-facility-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM_ADDRESS="your-facility-email@gmail.com"
MAIL_FROM_NAME="Equiply • USTP Facility Operations"
```

---

## 2. Laravel Task Scheduler Setup

Equiply registers two recurring operational commands in `routes/console.php` (both running every 5 minutes with `withoutOverlapping()`):
1. `equiply:expire-unclaimed-reservations` — Releases unclaimed `pending` reservations past their 30-minute pickup window.
2. `equiply:send-loan-reminders` — Dispatches 30-minute due-soon reminders and overdue alerts.

### Option A: Linux / Campus VPS Cron (Recommended for VMs)
Add a single cron entry (`crontab -e`):
```cron
* * * * * cd /var/www/equiply && php artisan schedule:run >> /dev/null 2>&1
```

### Option B: Container / PaaS Worker (Render, Fly.io, Koyeb, Railway)
Run a dedicated background worker service using:
```bash
php artisan schedule:work
```

### Verifying Registered Schedules
```bash
php artisan schedule:list
```

---

## 3. Build & Post-Deploy Commands

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan mongo:ping
php artisan mongo:init-indexes
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

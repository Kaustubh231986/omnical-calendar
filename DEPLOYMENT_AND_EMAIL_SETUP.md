# OmniCal Enterprise — Machine Deployment & Multi-Email Configuration Guide

This guide provides end-to-end instructions for deploying **OmniCal Enterprise** on another machine (local desktop, remote Linux VPS, internal company server, or cloud container) and configuring **multiple distinct email IDs** for each company profile without data cross-contamination.

---

## 📋 Table of Contents
1. [Deployment Architecture](#1-deployment-architecture)
2. [Deploying on Another Machine](#2-deploying-on-another-machine)
   - [Method A: Docker & Docker Compose (Recommended)](#method-a-docker--docker-compose-recommended)
   - [Method B: Node.js & npm (Bare Metal / VPS)](#method-b-nodejs--npm-bare-metal--vps)
   - [Method C: Production Daemon with PM2 or Systemd](#method-c-production-daemon-with-pm2-or-systemd)
   - [Method D: Nginx Reverse Proxy with HTTPS (Let's Encrypt)](#method-d-nginx-reverse-proxy-with-https-lets-encrypt)
3. [Configuring Multiple Email IDs](#3-configuring-multiple-email-ids)
   - [Why Multi-Tenant Email Isolation Matters](#why-multi-tenant-email-isolation-matters)
   - [Google Workspace & Gmail (App Password Setup)](#google-workspace--gmail-app-password-setup)
   - [Microsoft 365 & Outlook](#microsoft-365--outlook)
   - [Custom SMTP / SendGrid / Resend](#custom-smtp--sendgrid--resend)
   - [In-App Multi-Email Gateway Setup](#in-app-multi-email-gateway-setup)
4. [Email Notification & Sync Workflows](#4-email-notification--sync-workflows)
   - [24-Hour Advance Meeting Notice](#24-hour-advance-meeting-notice)
   - [15-Minute Imminent Alert](#15-minute-imminent-alert)
   - [Pre-Meeting Briefing Dispatch](#pre-meeting-briefing-dispatch)
   - [Post-Meeting Recap & Action Items Sync](#post-meeting-recap--action-items-sync)
5. [Troubleshooting & Verification](#5-troubleshooting--verification)

---

## 1. Deployment Architecture

```
                                  [ INTERNET / LAN ]
                                           │
                                           ▼
                            ┌──────────────────────────────┐
                            │      Nginx / Cloudflare      │ (Port 80/443 SSL)
                            └──────────────┬───────────────┘
                                           │ Reverse Proxy
                                           ▼
                            ┌──────────────────────────────┐
                            │      OmniCal Enterprise      │ (Port 3000)
                            │   Master Calendar Engine     │
                            └──────────────┬───────────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                │                          │                          │
                ▼                          ▼                          ▼
     [ Mandar Kanitkar ]        [ Agharkar Foods ]         [ Rajadhyaksha Co ]
   From: mandar@kanitkar.com  From: nitin@agharkar.in   From: yogita@rajadhyaksha.com
     SMTP: smtp.gmail.com       SMTP: smtp.mailgun.org     SMTP: smtp.office365.com
```

- **Master Schedule**: Consolidates 17+ company calendars onto a single timeline.
- **Tenant Isolation**: Each company has its own data partition, client directory, and outbound email gateway.
- **Outbound Email Dispatch**: Meeting notes and alerts are sent **from the matching company's email address**, ensuring recipients never see mismatched brand domains.

---

## 2. Deploying on Another Machine

### Method A: Docker & Docker Compose (Recommended)
*Fastest, zero-dependency installation. Works on Ubuntu, Debian, macOS, Windows, or Fedora.*

1. **Install Docker & Docker Compose** (if not already installed):
   ```bash
   # On Ubuntu / Debian:
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **Clone the repository on the target machine**:
   ```bash
   git clone https://github.com/your-org/omnical-enterprise.git
   cd omnical-enterprise
   ```

3. **Launch the containerized application**:
   ```bash
   docker compose up -d
   ```

4. **Verify container status**:
   ```bash
   docker compose ps
   # Output should show container "omnical-master-calendar" healthy and listening on 0.0.0.0:3000
   ```

5. **Open in your web browser**:
   - Access locally: `http://localhost:3000`
   - Access from LAN: `http://<SERVER_IP>:3000`

---

### Method B: Node.js & npm (Bare Metal / VPS)
*Use this if you prefer running directly on Node.js v20+.*

1. **Verify Node.js version**:
   ```bash
   node -v  # Requires v20.0.0 or higher
   npm -v
   ```

2. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/your-org/omnical-enterprise.git
   cd omnical-enterprise
   npm install
   ```

3. **Build the production bundle**:
   ```bash
   npm run build
   ```

4. **Start the production preview server**:
   ```bash
   # Bind to all network interfaces on port 3000
   npm run preview -- --port 3000 --host 0.0.0.0
   ```

---

### Method C: Production Daemon with PM2 or Systemd
*Ensure the application restarts automatically on server reboot or process crash.*

#### Option 1: Using PM2 (Easiest)
```bash
# Install PM2 globally
npm install -g pm2

# Start OmniCal as a managed daemon
pm2 start "npm run preview -- --port 3000 --host 0.0.0.0" --name "omnical-master-schedule"

# Configure PM2 to start on system boot
pm2 startup
pm2 save
```

#### Option 2: Using Systemd Service Unit (Linux VPS)
Create `/etc/systemd/system/omnical.service`:
```ini
[Unit]
Description=OmniCal Enterprise Master Calendar
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/omnical-enterprise
ExecStart=/usr/bin/npm run preview -- --port 3000 --host 0.0.0.0
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable omnical
sudo systemctl start omnical
sudo systemctl status omnical
```

---

### Method D: Nginx Reverse Proxy with HTTPS (Let's Encrypt)
To expose OmniCal securely on a custom domain (e.g. `calendar.yourcompany.com`):

1. **Create Nginx site configuration** (`/etc/nginx/sites-available/omnical`):
   ```nginx
   server {
       server_name calendar.yourcompany.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Enable site and obtain free SSL**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/omnical /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d calendar.yourcompany.com
   ```

---

## 3. Configuring Multiple Email IDs

### Why Multi-Tenant Email Isolation Matters
If an executive runs **Mandar Kanitkar**, **Agharkar Food & Beverages**, and **Rajadhyaksha Company**, sending meeting briefs for Agharkar Foods from `mandar@kanitkar.com` undermines client trust and brand separation. 

OmniCal solves this by binding each company profile to a dedicated **Email Gateway**:
- When dispatching a meeting brief for **Agharkar Foods**, the email is sent from `nitin@agharkarfoods.in` via Agharkar's SMTP.
- When dispatching for **Rajadhyaksha Co**, the email is sent from `yogita@rajadhyakshaco.com` via Microsoft 365.
- When dispatching for **Mandar Kanitkar**, the email is sent from `mandar@kanitkar.com` via Google Workspace.

---

### Google Workspace & Gmail (App Password Setup)
For Gmail or Google Workspace accounts:
1. Log in to the Google Account for Company A (e.g. `mandar@kanitkar.com`).
2. Go to **Security** ([myaccount.google.com/security](https://myaccount.google.com/security)).
3. Under **How you sign in to Google**, ensure **2-Step Verification** is turned ON.
4. Search for or navigate to **App passwords** ([myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
5. Enter an App Name (e.g., `OmniCal Calendar Dispatcher`) and click **Create**.
6. Google will generate a **16-character password** (e.g., `abcd efgh ijkl mnop`).
7. Enter this into OmniCal:
   - **Provider**: Google Workspace / Gmail
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **User**: `mandar@kanitkar.com`
   - **Password**: *(The 16-character App Password)*
8. Repeat for Company B using Company B's Google account!

---

### Microsoft 365 & Outlook
For Microsoft 365 / Exchange accounts:
- **Host**: `smtp.office365.com`
- **Port**: `587`
- **Authentication**: Modern OAuth2 or SMTP Authenticated submission enabled in Microsoft 365 Admin Center (`Active Users` &gt; `Mail` &gt; `Manage email apps` &gt; check `Authenticated SMTP`).
- **Sender Address**: `user@your-m365-domain.com`

---

### Custom SMTP / SendGrid / Resend
If using transactional email providers:
- **Resend**: Host: `smtp.resend.com`, Port: `587`, User: `resend`, Password: `re_YourApiKeyHere`
- **SendGrid**: Host: `smtp.sendgrid.net`, Port: `587`, User: `apikey`, Password: `SG.YourApiKeyHere`

---

### In-App Multi-Email Gateway Setup
1. In the OmniCal application, click **"Email Gateways"** or open the **"Company Profiles"** tab.
2. Select any company profile (e.g., *Mandar Kanitkar*, *Agharkar Food*, *Rajadhyaksha Co*).
3. Click **"Configure Email Gateway"**.
4. Set the **Sender Name**, **Sender Email**, and **SMTP Credentials**.
5. Add **Team CC Addresses** (e.g., `executive.assistant@kanitkar.com`) so administrative staff are automatically copied on every dispatch.
6. Click **"Send Test Email"** to verify connection and dispatch.

---

## 4. Email Notification & Sync Workflows

### 24-Hour Advance Meeting Notice
- **Trigger**: 24 hours prior to a scheduled session start time.
- **Recipient**: Meeting attendees + Company Team CC list.
- **Content**: Meeting title, start/end time, meeting location or video conference link, and pre-meeting agenda.
- **Sender**: Dispatched strictly from the host company's configured email address.

### 15-Minute Imminent Alert
- **Trigger**: 15 minutes before session start time.
- **Recipient**: Host executive and internal account team.
- **Content**: Quick reminder to review pre-briefing notes and ensure quorum readiness.

### Pre-Meeting Briefing Dispatch
- **How to Send**: Open any meeting on the Master Schedule &gt; switch to **Pre-Meeting Briefing** &gt; click **"Dispatch Briefing to Attendees"**.
- **Action**: Emails structured agendas, target objectives, and talking points to attendees.

### Post-Meeting Recap & Action Items Sync
- **How to Send**: Open meeting &gt; switch to **Post-Meeting Recap & Action Items** &gt; click **"Dispatch Recap to Attendees"**.
- **Action**: Emails executive summary, binding decisions, and action items with assignees.
- **Two-Way Sync**: Click **"Sync Notes to Account Profile"** to vault the notes into the company's CRM partition with an immutable audit log.

---

## 5. Troubleshooting & Verification

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Port 3000 in use** | Another service is using port 3000 | In `docker-compose.yml`, change ports to `"8080:3000"`, or run with `npm run preview -- --port 8080` |
| **Gmail SMTP 535 Authentication Error** | Regular Google account password used instead of App Password | Enable 2-Step Verification and generate an **App Password** at `myaccount.google.com/apppasswords` |
| **Remote machine cannot access port 3000** | Firewall (UFW) blocking port 3000 | Run `sudo ufw allow 3000/tcp` on Ubuntu/Debian |
| **Calendar feeds not updating** | Network timeout or feed URL invalid | Check calendar feed URL in Company Profiles; click **"Sync All Feeds"** to trigger forced reconciliation |

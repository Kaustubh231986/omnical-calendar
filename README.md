# OmniCal Enterprise — Multi-Company Master Schedule & Client Engagement Engine

**OmniCal Enterprise** is a multi-tenant calendar management and client engagement system designed for executives, advisory firms, and multi-business founders who manage schedules across multiple distinct companies. It bridges isolated company profiles into a single, unified master schedule while maintaining cryptographic partition security, enforcing client tier governance (Categories A, B, and C), automating 24-hour advance meeting notifications, and enabling bidirectional pre/post-meeting notes synchronization.

---

## 🌟 Table of Contents
1. [Core Capabilities](#core-capabilities)
2. [End-to-End User Journey](#end-to-end-user-journey)
   - [Phase 1: Company Profile Ingestion & Calendar Layering](#phase-1-company-profile-ingestion--calendar-layering)
   - [Phase 2: Master Schedule Overview & Multi-Calendar Filtering](#phase-2-master-schedule-overview--multi-calendar-filtering)
   - [Phase 3: Automated Advance Alerts & Notification Center](#phase-3-automated-advance-alerts--notification-center)
   - [Phase 4: Pre-Meeting Preparation & Briefing Dispatch](#phase-4-pre-meeting-preparation--briefing-dispatch)
   - [Phase 5: Attendance Quorum & Session Execution](#phase-5-attendance-quorum--session-execution)
   - [Phase 6: Post-Meeting Recap & Two-Way Account Sync](#phase-6-post-meeting-recap--two-way-account-sync)
   - [Phase 7: Client Tier Governance (Category A, B, C)](#phase-7-client-tier-governance-category-a-b-c)
   - [Phase 8: Historical Logs & Attendance Analytics](#phase-8-historical-logs--attendance-analytics)
   - [Phase 9: Executive Engagement Metrics Dashboard](#phase-9-executive-engagement-metrics-dashboard)
3. [Client Tier Rules & Cadence Standard](#client-tier-rules--cadence-standard)
4. [Security & Isolation Model](#security--isolation-model)
5. [Export & Interoperability (RFC 5545 iCal & CSV)](#export--interoperability-rfc-5545-ical--csv)

---

## 1. Core Capabilities

- **Unified Master Schedule with Isolated Profiles**: Merges calendars from 17+ companies (e.g., Mandar Kanitkar, Agharkar Food & Beverages, Rajadhyaksha Company, NBC Company, Joshi Company, etc.) into one master view while keeping all client data, notes, and partitions isolated.
- **Google Calendar-Style Multi-Calendar Checkbox Control**: Left sidebar with color-coded checkboxes allows users to toggle individual company calendars on and off, or drill down into a strict single-tenant view.
- **Automated Advance Notifications**: Fired automatically 24 hours prior to scheduled meetings, followed by 15-minute imminent meeting alerts.
- **Pre/Post-Meeting Notes Sync**: Pre-meeting briefs (agendas, objectives) and post-meeting recaps (decisions, action items) can be dispatched to attendees and synced directly back to the respective company's CRM account.
- **Category A Client Cadence Management**: Dedicated enforcement of mandatory 30-day monthly updates and 90-day quarterly performance reviews for top-tier clients, with automated team reminder scans.
- **Historical Attendance & Engagement Dashboards**: Granular quorum metrics, attendance breakdown by client tier, and CSV audit exports.

---

## 2. End-to-End User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           THE USER JOURNEY AT A GLANCE                      │
│                                                                             │
│  [1. Profile Ingestion] ──► [2. Unified Schedule] ──► [3. 24h Advance Alert]│
│            │                          │                         │           │
│            ▼                          ▼                         ▼           │
│  [4. Pre-Meeting Brief] ──► [5. Quorum & Session] ─► [6. Post-Notes Sync]   │
│            │                          │                         │           │
│            ▼                          ▼                         ▼           │
│  [7. Tier A Cadence]   ──► [8. Historical Logs]  ──► [9. Analytics Metrics] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: Company Profile Ingestion & Calendar Layering
1. **Navigate to Company Profiles**:
   - The user visits the **Company Profiles** tab to review all registered operating entities (e.g., *Mandar Kanitkar*, *Agharkar Food & Beverages*, *Rajadhyaksha Company*, *NBC Company*).
2. **Review Tenant Partition Security**:
   - Each company profile displays its assigned TLS calendar feed endpoint (`feed.ics`), local timezone (e.g., `GMT+05:30 IST`), assigned Lead Account Director, and unique cryptographic partition key (`ENC-PART-...`).
3. **Register New Company Profile**:
   - Click **"+ Add Company Profile"** to register a new operating entity with custom branding color, timezone, and designated executive contact.

---

### Phase 2: Master Schedule Overview & Multi-Calendar Filtering
1. **Google Calendar-Style Left Sidebar**:
   - On the **Master Schedule** tab, the left sidebar displays the **"My calendars"** checklist with distinct color swatches.
   - Users can check or uncheck individual companies to layer or hide their events dynamically.
   - Use the **"All"** and **"None"** buttons for one-click bulk filtering.
2. **Select View Cadence**:
   - **4 Days (Sample)**: Displays the 4-day hourly timeline (Saturday 5 to Tuesday 8) matching Google Calendar with GMT+05:30 time axis, `! SM` all-day banner, and real-time current time indicator.
   - **Month Grid**: Interactive 35-day calendar grid with day counts and meeting pills.
   - **Agenda Stream**: Sequential chronological feed of meetings with quick-action dispatch buttons.
3. **Single Tenant Isolation Mode**:
   - Hover over any company in the sidebar and click **"Isolate"** to enter strict single-company mode, filtering out all other companies' meetings, clients, and alerts.

---

### Phase 3: Automated Advance Alerts & Notification Center
1. **24-Hour Advance Meeting Notifications**:
   - As meetings approach, the system automatically dispatches an advance reminder **24 hours prior** to start time (e.g., *“24h Advance Notice: Yogita Rajadhyaksha Meeting scheduled for tomorrow at 6:00 PM”*).
2. **15-Minute Imminent Alert**:
   - An urgent alert is generated 15 minutes before the session starts, prompting the executive to verify pre-meeting briefing documents.
3. **Interactive Notification Drawer**:
   - Click the **Bell Icon** in the top navigation bar to open the notification drawer.
   - Filter by *All*, *Deadlines*, or *Meetings*.
   - Use the built-in simulator buttons (**"Test 24h Notice"**, **"Test 15m Alert"**, **"Tier A Deadline"**) to test triggers anytime.

---

### Phase 4: Pre-Meeting Preparation & Briefing Dispatch
1. **Open Meeting Dossier**:
   - Click on any event card on the calendar (e.g., *Rahul Ahire*, *Mayuresh Marathe*, or *Yogita Rajadhyaksh*) to open the **Meeting Detail Modal**.
2. **Fill & Edit Pre-Meeting Notes**:
   - Navigate to the **"Pre-Meeting Briefing"** tab.
   - Edit the **Agenda**, add structured **Key Objectives**, and document internal **Talking Points**.
3. **Dispatch Pre-Meeting Briefing**:
   - Click **"Dispatch Briefing to Attendees"**.
   - The system timestamps the dispatch, logs the delivery in the audit ledger, and marks the briefing ready for participants.
4. **Sync Pre-Notes to Company Account**:
   - Click **"Sync to Account Profile"** to record the briefing into the company's secure CRM partition.

---

### Phase 5: Attendance Quorum & Session Execution
1. **Verify Quorum in Real-Time**:
   - In the **"Attendees & Attendance"** tab of the modal, view all scheduled participants.
2. **Mark Attendance Status**:
   - Click **"Attended"**, **"Absent"**, or **"Pending"** for each participant.
   - The system dynamically updates the meeting's attendance rate % and quorum verification score.

---

### Phase 6: Post-Meeting Recap & Two-Way Account Sync
1. **Document Meeting Outcomes**:
   - Navigate to the **"Post-Meeting Recap & Action Items"** tab.
   - Write the **Executive Summary**.
   - Add agreed-upon **Key Decisions** (e.g., *“Approved Rs. 45 Lakhs capex budget for cold storage”*).
2. **Assign Action Items with Deadlines**:
   - Add action items specifying the task, responsible assignee, and target due date.
   - Use interactive checkboxes to track completion.
3. **Dispatch Recap to Attendees**:
   - Click **"Dispatch Recap to Attendees"** to distribute formal minutes to all session attendees.
4. **Sync Notes to Respective Company Account**:
   - Click **"Sync Notes to Account Profile"**.
   - The application writes the finalized minutes, action items, and decisions to the isolated company record and logs a cryptographic audit timestamp.

---

### Phase 7: Client Tier Governance (Category A, B, C)
1. **Navigate to "Client Tiers & Cadence"**:
   - The user opens the **Client Tiers** dashboard to monitor engagement health across all accounts.
2. **Category A Spotlight**:
   - Dedicated governance banner highlights Category A clients (*Yogita Rajadhyaksha*, *Mayuresh Marathe*, *Sandeep Sir*, *Rahul Ahire*, *Arpita Khanvilkar*, *Jegan Sir*).
   - Real-time counters display:
     - **Overdue Monthly Updates**
     - **Deadlines Due in < 7 Days**
     - **Compliant Accounts**
3. **Automated Team Reminder Scan**:
   - Click **"Scan & Trigger Team Reminders"**.
   - The system evaluates all client deadlines against the calendar clock and alerts the team of imminent deadlines.
4. **One-Click Cadence Reset**:
   - **"Dispatch Monthly Update"**: Marks the monthly briefing sent, advances the next deadline by +30 days, and logs a compliance record.
   - **"Log QBR"**: Records the completed quarterly review, advances the deadline by +90 days, and boosts the client health score.
5. **Tier Promotion & Configuration**:
   - Click **"Edit Tier"** on any client card to adjust tier classifications (promote from Tier B to Tier A) or set custom review dates.

---

### Phase 8: Historical Logs & Attendance Analytics
1. **Access Historical Logs**:
   - Switch to the **"Historical Logs & Attendance"** tab.
2. **Review High-Level Metrics**:
   - **Overall Attendance Rate %**
   - **Tier A Executive Quorum %**
   - **Total Historical Sessions Logged**
   - **Action Item Resolution Rate %**
3. **Search & Filter Session History**:
   - Search by client name, meeting type, or keyword.
   - Inspect notes sync status (*Pre-Notes Synced / Post-Notes Synced*).
4. **Export Historical Data**:
   - Click **"Export Logs (CSV)"** to instantly download a comprehensive CSV report for corporate reporting and compliance audits.

---

### Phase 9: Executive Engagement Metrics Dashboard
1. **Navigate to "Engagement Analytics"**:
   - Open the **Analytics** view to examine time allocation and governance adherence.
2. **Executive Time Allocation Chart**:
   - Visual breakdown showing what percentage of total executive meeting hours were dedicated to Category A vs. Category B vs. Category C clients.
3. **Mandatory Cadence Compliance Gauges**:
   - Progress bars tracking on-time delivery of Monthly Updates (Target: 100%) and Quarterly Performance Reviews.
4. **Meeting Volume by Session Type**:
   - Distribution across Quarterly Reviews, Monthly Updates, Executive Follow-ups, and Strategy Alignment sessions.
5. **Portfolio Health & Contract Value Ranking**:
   - Sortable matrix ranking clients by Annual Contract Value (ACV) and engagement health score (0–100).

---

## 3. Client Tier Rules & Cadence Standard

| Category | Target Audience | Mandatory Cadence | Review Requirements | Automated Reminder Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Category A** | Strategic Key Accounts | **Every 30 Days** (Monthly) | Detailed Quarterly Review (every 90 days), bi-weekly follow-up | Alerts at 7 days, 3 days, and on expiration |
| **Category B** | Core Growth Accounts | **Every 60 Days** (Bi-monthly) | Semi-Annual Strategic Review (every 180 days) | Alerts at 7 days before deadline |
| **Category C** | Standard Maintenance | **Every 90 Days** (Quarterly) | Annual Contract Health Check (every 365 days) | Digest summary at 14 days |

---

## 4. Security & Isolation Model

- **Partition Separation**: Each company profile operates in its own isolated cryptographic partition (`ENC-PART-...`).
- **No Data Bleed**: Pre-meeting notes, post-meeting action items, and client contact information stay isolated within the company's designated account profile.
- **Tenant Filter Isolation**: Activating a company's isolated mode ensures no external company events or client details are visible or accessible in the session.

---

## 5. Export & Interoperability

- **RFC 5545 iCalendar (`.ics`)**: Click **"Export .ics"** on the Master Schedule to download an industry-standard calendar feed compatible with Google Calendar, Apple Calendar, and Microsoft Outlook.
- **CSV Attendance & Meeting Ledger**: Download meeting minutes, decisions, and attendance records as tabular CSV datasets.
- **Live LocalStorage Persistence**: All edits, newly scheduled sessions, updated notes, and attendance marks persist seamlessly across browser sessions.

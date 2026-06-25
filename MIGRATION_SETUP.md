# Mehrin ERP — MERN Migration & Setup Guide

Step-by-step guide to run locally, connect MongoDB Atlas, and deploy to **Render** (API) + **Vercel** (frontend).

Your original HTML + Google Sheets app stays in the repo root (`index.html`, `js/`, `css/`) as reference — nothing there is deleted.

---

## What was migrated

| Original (Google Sheets) | MERN equivalent |
|--------------------------|-----------------|
| Apps Script `doPost` API | Express `POST /api` |
| Google Sheets tabs | MongoDB collections (same column names) |
| Vanilla JS + Tailwind CDN | React + Vite + Tailwind v4 |
| Login / users sheet | MongoDB `Users` + JWT-style token |
| All ERP modules | React pages under `client/src/pages/` |
| **Reports System** (all report types + PDF/Word/Excel/PPT) | `ReportsPage` + `reportsEngine.js` + `reportExport.js` |
| **Delivery mark-delivered** | `DeliveryDashboardPage` + `SYNC_DELIVERY_QUEUE` |
| **Transaction Edit** (all txn sheets) | `TxnEditModal` + `TxnLedgerActions` |

**Default login after first server start:** `superadmin` / `password123`

---

## Prerequisites

Install on your PC:

1. **Node.js 20+** — [https://nodejs.org](https://nodejs.org)
2. **Git** — [https://git-scm.com](https://git-scm.com)
3. **MongoDB Atlas account** (free tier is fine) — [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
4. **Render account** (backend) — [https://render.com](https://render.com)
5. **Vercel account** (frontend) — [https://vercel.com](https://vercel.com)

---

## Step 1 — Clone & install dependencies

Open PowerShell:

```powershell
cd "d:\Fahad\MERN\Practices\Mehrin_ERP"

cd server
npm install

cd ..\client
npm install
```

---

## Step 2 — MongoDB Atlas setup

### 2.1 Create cluster

1. Log in to MongoDB Atlas → **Create** → **Shared (free)** cluster.
2. Choose a region close to you (e.g. AWS Bahrain or Mumbai).
3. Wait until cluster status is **Active**.

### 2.2 Database user

1. **Database Access** → **Add New Database User**
2. Username + strong password (save these — you need them in `.env`)
3. Role: **Atlas admin** or **Read and write to any database**

### 2.3 Network access

1. **Network Access** → **Add IP Address**
2. For local dev: **Allow Access from Anywhere** (`0.0.0.0/0`)  
   *(Tighten this in production if you prefer.)*

### 2.4 Get connection string

1. **Database** → **Connect** → **Drivers** → **Node.js**
2. Copy the **SRV connection string** from Atlas (do not paste it into this repo or any markdown file).
3. In Atlas, replace `<password>` with your database user password.
4. Ensure the database name **`mehrin_erp`** appears in the path before the `?` query string.

> **Security:** Keep the connection string only in `server/.env` (local) and in Render environment variables (production). Never commit real URIs to GitHub.

---

## Step 3 — Environment files (local)

### 3.1 Server — `server/.env`

Copy the example file:

```powershell
cd server
copy .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=
CLIENT_TOKEN=MEHRIN-MASTER_TEMPLATE_TOKEN_17062026
ADMIN_ACCOUNT_STATUS=ACTIVE
CLIENT_ORIGIN=http://localhost:5173
```

Paste your Atlas SRV connection string as the value of `MONGODB_URI` (one line, no quotes).

> **Important:** `CLIENT_TOKEN` must match the client env exactly.

### 3.2 Client — `client/.env.local`

```powershell
cd ..\client
copy .env.example .env.local
```

Default contents (usually no change needed for local dev):

```env
VITE_API_URL=http://localhost:5000/api
VITE_CLIENT_TOKEN=MEHRIN-MASTER_TEMPLATE_TOKEN_17062026
VITE_COMPANY_NAME=Mehrin Trading Co.
VITE_VAT_NUMBER=000000000000000
VITE_CR_NUMBER=0000000000
```

> Never commit `.env` or `.env.local` — they are gitignored.

---

## Step 4 — Run locally

**Terminal 1 — API:**

```powershell
cd server
npm run dev
```

You should see: `Server running on port 5000` and MongoDB connected.  
On first run, **superadmin** is auto-created.

**Terminal 2 — Frontend:**

```powershell
cd client
npm run dev
```

Open **http://localhost:5173**  
Login: `superadmin` / `password123`

After UI changes, hard refresh: **Ctrl + Shift + R**

---

## Step 5 — Verify modules

Use the sidebar and confirm each section loads:

| Module | What to check |
|--------|-----------------|
| Dashboard | Totals, cash drawer, refresh |
| HR / Customers / Suppliers | Add record + ledger |
| Internal Transfer | Log handover |
| Expense / Creditor / Income / Capital | Heads + transactions |
| Delivery Dashboard | Pending / delivered lists |
| All Transaction View | Date range load |
| User Access Control | Admin only — create user |

---

## Step 6 — Production build test (optional)

Before deploying:

```powershell
cd client
npm run build
```

If this passes, Vercel deploy will succeed.

---

## Step 7 — Deploy backend (Render)

### 7.1 Push code to GitHub

Ensure your repo is on GitHub (private is fine).

### 7.2 Create Web Service on Render

1. **New** → **Web Service** → connect your repo
2. **Root Directory:** `server`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment variables** (same as `server/.env`):

| Key | Value |
|-----|-------|
| `PORT` | `5000` (Render sets this automatically; keep if required) |
| `MONGODB_URI` | Your Atlas connection string |
| `CLIENT_TOKEN` | Same token as client |
| `CLIENT_ORIGIN` | Your Vercel URL, e.g. `https://mehrin-erp.vercel.app` |
| `ADMIN_ACCOUNT_STATUS` | `ACTIVE` |

6. Deploy → copy your Render URL, e.g. `https://mehrin-erp-api.onrender.com`

> A `render.yaml` file exists in the repo root if you prefer Blueprint deploy.

---

## Step 8 — Deploy frontend (Vercel)

1. **New Project** → import the same GitHub repo
2. **Root Directory:** `client`
3. **Framework:** Vite
4. **Environment variables:**

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com/api` |
| `VITE_CLIENT_TOKEN` | Same as server |
| `VITE_COMPANY_NAME` | Mehrin Trading Co. |
| `VITE_VAT_NUMBER` | Your VAT |
| `VITE_CR_NUMBER` | Your CR |

5. Deploy → open your Vercel URL and log in.

### 8.1 Update Render CORS

After Vercel gives you the final URL, update Render env:

```
CLIENT_ORIGIN=https://your-app.vercel.app
```

Redeploy the Render service so CORS allows your frontend.

---

## Step 9 — Import existing Google Sheet data (optional)

**Skip this step if your Google Sheet is empty** — the MERN app starts fresh in MongoDB. On first server start, `superadmin` / `password123` is created automatically.

If you do have live sheet data to move into MongoDB:

1. Export each sheet tab as **CSV** from Google Sheets.
2. Use a one-time import script (or MongoDB Compass **Import** → CSV into collections named like `HR`, `Customers`, `Expense_Transactions`, etc.).
3. Column headers must match the original sheet names (see `server/src/services/recordService.js` → `SHEET_LAYOUTS`).

**Collections used:**

- `Users`, `HR`, `HR_Transactions`, `Customers`, `Customer_Transactions`
- `Suppliers`, `Supplier_Transactions`, `Internal_Transfers`
- `Expense_Heads`, `Expense_Transactions`, `Creditor_Heads`, `Creditor_Transactions`
- `Income_Heads`, `Income_Transactions`, `Capital_Heads`, `Capital_Transactions`
- `Delivery_Queue`

Each document stores fields as `{ Column_Name: value, ... }` plus `ID` and `sheet`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login fails / empty users | Restart server — `ensureSuperAdmin()` runs on startup |
| MongoDB SRV error on Windows | Already handled in `server/src/config/db.js` (Google DNS). If still failing, use `MONGODB_URI_STANDARD` in `.env` |
| CORS error in browser | Set `CLIENT_ORIGIN` on Render to exact Vercel URL (no trailing slash) |
| Token invalid | Match `CLIENT_TOKEN` / `VITE_CLIENT_TOKEN` on both sides |
| Blank module | Check user permissions in **User Access Control** |
| API 502 on Render free tier | First request after sleep takes ~30s — wait and retry |

---

## Project structure (MERN)

```
Mehrin_ERP/
├── server/          ← Express API + MongoDB
├── client/          ← React frontend
├── js/              ← Original app (reference only)
├── index.html       ← Original app (reference only)
├── render.yaml      ← Render blueprint
└── client/vercel.json
```

---

## If GitHub flagged your MongoDB URI (secret scanning)

GitHub may flag **example** connection strings in markdown even when they are placeholders. Your real URI should live only in `server/.env` (never committed).

### 1. Fix the repo (done in this update)

- Removed `mongodb+srv://...` examples from `MIGRATION_SETUP.md` and `server/.env.example`
- Commit and push the fix (see commands below)

### 2. Rotate Atlas password (recommended)

Even if the alert was a false positive, rotating is quick and safe:

1. MongoDB Atlas → **Database Access**
2. Click your DB user → **Edit** → **Edit Password** → generate a new strong password
3. Update **`server/.env`** locally: set `MONGODB_URI` to the new connection string from Atlas **Connect**
4. Update **`MONGODB_URI`** on **Render** (if already deployed) → redeploy

### 3. Close the GitHub alert

1. GitHub repo → **Security** → **Secret scanning alerts**
2. Open the alert for `MIGRATION_SETUP.md`
3. After pushing the fix, choose **Revoke secret** (rotate password) or **Mark as false positive** if only a placeholder was detected
4. The old string remains in git history on commit `6d592d08` but contains no real password — rotation still protects your live database

### 4. Push the documentation fix

```powershell
cd "d:\Fahad\MERN\Practices\Mehrin_ERP"
git add MIGRATION_SETUP.md server/.env.example
git commit -m "Remove MongoDB URI examples from docs to resolve secret scanning alert"
git push origin main
```

---

## Security checklist before go-live

- [ ] **Never commit** `server/.env` or `client/.env.local` (already in `.gitignore`)
- [ ] If GitHub flagged a MongoDB URI alert, rotate the Atlas DB user password (see below) and dismiss the alert after pushing the doc fix
- [ ] Change `superadmin` password after first login
- [ ] Use a strong random `CLIENT_TOKEN` in production
- [ ] Restrict MongoDB Atlas IP allowlist if possible
- [ ] Do not commit `.env` files
- [ ] Enable HTTPS only (Render + Vercel do this by default)

---

## Still on original HTML only (optional follow-up)

- **Master record Edit** on HR / Customer / Supplier ledgers (forms exist in original HTML but handlers were incomplete there too)
- **Arabic/English i18n** (~5800 lines in `js/i18n-forms.js`)
- **Customer transaction print slips** with QR codes
- **Google Sheet → MongoDB import** (Step 9 below)

---

*Developed by Md. Fahad Hossain — Mehrin Trading Co. ERP*

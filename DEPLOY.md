# ERP Frontend — GitHub + Vercel Guide

One GitHub repo for all clients. One Vercel project per client (each with its own URL and secrets).

---

## What goes where?

| Place | What | Secrets? |
|-------|------|----------|
| **GitHub** | `index.html`, `js/app.js`, `js/auth.js`, scripts | No |
| **Your PC (local)** | `js/config.js` | Yes — never push |
| **Vercel (each client)** | Same code from GitHub + env vars | Yes — stored in Vercel only |

---

## PART A — Push code to GitHub (do this once)

### 1. Install Git (if not done)

Download: https://git-scm.com/download/win  
Then restart Cursor and run: `git --version`

### 2. Create empty repo on GitHub

1. Go to https://github.com/new  
2. Name: `erp-management-system`  
3. **Do not** add README, .gitignore, or license (you already have files)  
4. Click **Create repository**

### 3. Push from your project folder

Open PowerShell:

```powershell
cd "d:\Fahad\MERN\Practices\ERP With User Management"

git init
git add .
git status
```

**Check:** `js/config.js` must **NOT** appear in the list. If it does, stop and fix `.gitignore`.

```powershell
git commit -m "Initial commit: ERP frontend with Vercel deploy config"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/erp-management-system.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username. Sign in when prompted.

---

## PART B — Deploy Client 1 on Vercel (first live site)

### 1. Import the repo

1. Go to https://vercel.com/dashboard  
2. **Add New… → Project**  
3. **Import** your `erp-management-system` repo from GitHub  
4. If GitHub is not connected, click **Connect GitHub Account** and allow access  

### 2. Configure the project

On the import screen:

| Setting | Value |
|---------|--------|
| Project Name | e.g. `client-a-erp` (pick a name for this client) |
| Framework Preset | **Other** |
| Root Directory | `./` (leave default) |
| Build Command | `npm run build` (should auto-detect from `vercel.json`) |
| Output Directory | `.` |

### 3. Add environment variables (IMPORTANT)

Before clicking Deploy, expand **Environment Variables** and add:

| Name | Value |
|------|--------|
| `API_URL` | Your Google Apps Script Web App URL (full `/exec` URL) |
| `CLIENT_TOKEN` | Token that matches your Apps Script backend |

Apply to: **Production**, **Preview**, and **Development**.

### 4. Deploy

Click **Deploy**. Wait 1–2 minutes.

When done, Vercel gives you a URL like:  
`https://client-a-erp.vercel.app`

Open it and test login.

---

## PART C — Add Client 2, 3, … (same code, different backend)

Do **not** create a new GitHub repo. Repeat **Part B** only:

1. Vercel → **Add New → Project**  
2. Import the **same** `erp-management-system` repo  
3. New project name: e.g. `client-b-erp`  
4. Different `API_URL` and `CLIENT_TOKEN` for that client  
5. Deploy  

Each client gets their own URL and their own Google Sheet backend.

---

## PART D — When you change the frontend code

```powershell
cd "d:\Fahad\MERN\Practices\ERP With User Management"
git add .
git commit -m "Describe your change"
git push
```

Vercel redeploys automatically for every connected project.

---

## Local development on your PC

1. Keep `js/config.js` with your test URL and token (already gitignored).  
2. Open `index.html` with **Live Server** in Cursor, or any local static server.  
3. You do **not** need to run `npm run build` locally unless you want to test the Vercel build.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails: missing env vars | Add `API_URL` and `CLIENT_TOKEN` in Vercel → Settings → Environment Variables, then Redeploy |
| Login fails after deploy | Token in Vercel must match Apps Script; URL must end with `/exec` |
| `js/config.js` appeared in `git status` | It must stay gitignored — never `git add` it |
| Blank page | Check browser console; confirm `index.html` loads `./js/app.js` |

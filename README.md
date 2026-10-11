# HydroNexa Software

HydroNexa is an intelligent smart water management and monitoring platform featuring Industry Dashboards, Government Compliance, Real-time Sensor Integrations (ThingSpeak), AI Quality Analytics, and Supabase database services.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v20+ recommended
- **npm** (comes with Node.js)
- **Git**

---

### 2. Project Structure
```text
hydronexa-software/
├── backend/                  # Node.js Express API Server (Port 3001)
│   ├── .env.example          # Sample environment config for backend
│   └── index.js
├── frontend/                 # React + Vite + TypeScript Client (Port 5173)
│   ├── .env.example          # Sample environment config for frontend
│   └── src/
├── .env.example              # Root template
├── update_industry_schema.sql # Database Schema / Migrations
└── README.md
```

---

### 3. Setup Environment Variables

Copy the `.env.example` templates to `.env` in both `backend` and `frontend`:

**Backend:**
```bash
cp backend/.env.example backend/.env
```
*(On Windows PowerShell: `Copy-Item backend\.env.example backend\.env`)*

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
```
*(On Windows PowerShell: `Copy-Item frontend\.env.example frontend\.env`)*

Fill in your Supabase credentials, ThingSpeak keys, SMTP app password, and Gemini API key as provided by your administrator.

---

### 4. Running the Backend

Open a terminal:
```bash
cd backend
npm install
npm start
```
> The backend server starts with `--watch` on port `3001`.

---

### 5. Running the Frontend

Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
> Open [http://localhost:5173](http://localhost:5173) in your browser.

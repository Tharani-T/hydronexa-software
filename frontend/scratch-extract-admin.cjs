const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync('src/routes/admin.dashboard.tsx', 'utf8').split('\n');

function getLines(start, end) {
  return lines.slice(start, end + 1).join('\n');
}

const chunks = {
  MOCK_STATS: getLines(31, 38),
  MOCK_REQUESTS: getLines(39, 44),
  MOCK_CONNECTIONS_DATA: getLines(45, 54),
  AdminDashboard: getLines(55, 237).replace('function AdminDashboard', 'export function AdminDashboard'),
  DashboardOverview: getLines(238, 346).replace('function DashboardOverview', 'export function DashboardOverview'),
  MOCK_MAP_NODES: getLines(347, 354),
  InteractiveMapGraph: getLines(355, 482),
  ContactRequests: getLines(483, 642).replace('function ContactRequests', 'export function ContactRequests'),
  ApproveCTOModal: getLines(643, 773),
  ApproveModal: getLines(774, 1142),
  Field: getLines(1143, 1155),
  Number: getLines(1156, 1156),
  Select: getLines(1157, 1167),
  Slider: getLines(1168, 1178),
  Toggle: getLines(1179, 1189),
  EditIndustryModal: getLines(1190, 1531),
  IndustryManagement: getLines(1532, 1685).replace('function IndustryManagement', 'export function IndustryManagement'),
  PlaceholderView: getLines(1686, 1686).replace('function PlaceholderView', 'export function PlaceholderView'),
  UserManagement: getLines(1687, 1815).replace('function UserManagement', 'export function UserManagement'),
  Reports: getLines(1816, 1919).replace('function Reports', 'export function Reports'),
  Alerts: getLines(1920, 1920).replace('function Alerts', 'export function Alerts'),
  SystemSettings: getLines(1921, lines.length - 1).replace('function SystemSettings', 'export function SystemSettings')
};

const commonImports = `import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Users, Factory, ShieldAlert, 
  Settings, LogOut, Search, Bell, Activity, 
  Droplets, AlertTriangle, FileText, CheckCircle, 
  XCircle, ChevronRight, UserCog, Send, Check,
  ChevronLeft, Gauge, Clock, BellRing, CheckCircle2,
  Sparkles, Download, Eye, EyeOff, MapPin, X, Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/lib/store";
`;

const importsAdminDashboard = commonImports + `
import { useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { DashboardOverview } from "./pages/Overview";
import { ContactRequests } from "./pages/ContactRequests";
import { IndustryManagement } from "./pages/IndustryManagement";
import { PlaceholderView } from "./pages/GovernmentManagement";
import { UserManagement } from "./pages/UserManagement";
import { Reports } from "./pages/Reports";
import { Alerts } from "./pages/Alerts";
import { SystemSettings } from "./pages/SystemSettings";
`;

const adminDir = path.join('src', 'admin');
const dashboardDir = path.join(adminDir, 'dashboard');
const pagesDir = path.join(dashboardDir, 'pages');
const loginDir = path.join(adminDir, 'login');

[adminDir, dashboardDir, pagesDir, loginDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Write Overview.tsx
fs.writeFileSync(path.join(pagesDir, 'Overview.tsx'), 
  commonImports + '\n' + chunks.MOCK_STATS + '\n' + chunks.MOCK_CONNECTIONS_DATA + '\n' + 
  chunks.MOCK_MAP_NODES + '\n' + chunks.InteractiveMapGraph + '\n\n' + chunks.DashboardOverview
);

// Write ContactRequests.tsx
fs.writeFileSync(path.join(pagesDir, 'ContactRequests.tsx'), 
  commonImports + '\n' + chunks.MOCK_REQUESTS + '\n' + chunks.ApproveCTOModal + '\n\n' + chunks.ApproveModal + '\n\n' + chunks.ContactRequests
);

// Write IndustryManagement.tsx
fs.writeFileSync(path.join(pagesDir, 'IndustryManagement.tsx'), 
  commonImports + '\n' + chunks.Field + '\n\n' + chunks.Number + '\n\n' + chunks.Select + '\n\n' + chunks.Slider + '\n\n' + chunks.Toggle + '\n\n' + chunks.EditIndustryModal + '\n\n' + chunks.IndustryManagement
);

// Write GovernmentManagement.tsx
fs.writeFileSync(path.join(pagesDir, 'GovernmentManagement.tsx'), 
  commonImports + '\n' + chunks.PlaceholderView
);

// Write UserManagement.tsx
fs.writeFileSync(path.join(pagesDir, 'UserManagement.tsx'), 
  commonImports + '\n' + chunks.UserManagement
);

// Write Reports.tsx
fs.writeFileSync(path.join(pagesDir, 'Reports.tsx'), 
  commonImports + '\n' + chunks.Reports
);

// Write Alerts.tsx
fs.writeFileSync(path.join(pagesDir, 'Alerts.tsx'), 
  commonImports + '\n' + chunks.Alerts
);

// Write SystemSettings.tsx
fs.writeFileSync(path.join(pagesDir, 'SystemSettings.tsx'), 
  commonImports + '\n' + chunks.SystemSettings
);

// Write AdminDashboard.tsx
fs.writeFileSync(path.join(dashboardDir, 'AdminDashboard.tsx'), 
  importsAdminDashboard + '\n' + chunks.AdminDashboard
);

// Now for login
const loginCode = fs.readFileSync('src/routes/admin.login.tsx', 'utf8');
const loginFunctionLines = loginCode.split('\n');
const loginFunctionStr = loginFunctionLines.slice(14, 166).join('\n').replace('function AdminLogin', 'export function AdminLogin');

const importsAdminLogin = `import { useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Particles } from "@/components/Particles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAppState } from "@/lib/store";
import { supabase } from "@/lib/supabase";
`;

fs.writeFileSync(path.join(loginDir, 'Login.tsx'), 
  importsAdminLogin + '\n' + loginFunctionStr
);

// Now update the route files
const routeDashboardCode = `import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminDashboard } from "@/admin/dashboard/AdminDashboard";

export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("hydronexa:v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.adminAuthed) return;
      }
    }
    throw redirect({ to: "/admin/login" });
  },
  component: AdminDashboard,
});
`;
fs.writeFileSync('src/routes/admin.dashboard.tsx', routeDashboardCode);

const routeLoginCode = `import { createFileRoute } from "@tanstack/react-router";
import { AdminLogin } from "@/admin/login/Login";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});
`;
fs.writeFileSync('src/routes/admin.login.tsx', routeLoginCode);

console.log("Extraction complete.");

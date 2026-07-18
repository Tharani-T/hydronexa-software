// Lightweight global store for HydroNexa state (theme, setup, auth)
import { useEffect, useState } from "react";

const KEY = "hydronexa:v1";

export type IndustryType = "Textile" | "Pulp & Paper" | "Food Processing" | "Steel & Metal" | "Pharma";

export interface SetupData {
  industryType?: IndustryType;
  plantScale?: string;
  processType?: string;
  plantName?: string;
  location?: string;
  email?: string;
  password?: string;
  dailyCapacity?: number;
  ctoLimit?: number;
  monthlyCtoLimit?: number;
  reuseTarget?: number;
  monitoringFrequency?: string;
  shiftTimings?: string;
  workingDays?: string;
  units?: number;
  waterSource?: string;
  benchmark?: string;
  alertSensitivity?: number;
  notifications?: string[];
  aiMonitoring?: boolean;
  complianceAlerts?: boolean;
  sustainabilityReports?: boolean;
  completed?: boolean;
}

export interface UserAccount {
  password?: string;
  setup: SetupData;
}

export interface AppState {
  users: Record<string, UserAccount>; // Kept for offline/legacy
  currentUserEmail: string | null;
  industryAuthed: boolean;
  govAuthed: boolean;
  token: string | null; // JWT token
  setup?: SetupData;
}

const initial: AppState = { users: {}, currentUserEmail: null, industryAuthed: false, govAuthed: false, token: null };

function read(): AppState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as AppState;
    
    // Migration code for legacy single-user data
    if (parsed.setup && Object.keys(parsed.setup).length > 0 && !parsed.users) {
      const email = parsed.setup.email || "demo@hydronexa.com";
      const password = parsed.setup.password || "demo123";
      const migratedUsers: Record<string, UserAccount> = {
        [email]: { password, setup: { ...parsed.setup, email, password } }
      };
      return {
        ...initial,
        users: migratedUsers,
        currentUserEmail: parsed.industryAuthed ? email : null,
        industryAuthed: parsed.industryAuthed,
        govAuthed: parsed.govAuthed,
      };
    }
    
    return { ...initial, ...parsed };
  } catch { return initial; }
}

function write(s: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("hydronexa:update"));
}

export function useAppState() {
  const [rawState, setState] = useState<AppState>(read);
  useEffect(() => {
    setState(read());
    const handler = () => setState(read());
    window.addEventListener("hydronexa:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("hydronexa:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = (patch: Partial<AppState>) => {
    const next = { ...read(), ...patch };
    write(next);
    setState(next);
  };

  // Derived helper for the active user's setup
  const activeUser = rawState.currentUserEmail ? rawState.users[rawState.currentUserEmail] : null;
  const setup = activeUser?.setup || {};

  const updateSetup = async (patch: Partial<SetupData>) => {
    const cur = read();
    const email = cur.currentUserEmail;
    if (!email) return;
    
    const user = cur.users[email] || { setup: {} };
    const nextUser = { ...user, setup: { ...user.setup, ...patch } };
    
    const next = {
      ...cur,
      users: {
        ...cur.users,
        [email]: nextUser
      }
    };
    write(next);
    setState(next);

    // Sync with backend
    if (cur.token) {
      try {
        await fetch('/api/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cur.token}`
          },
          body: JSON.stringify(nextUser.setup)
        });
      } catch (err) {
        console.error("Failed to sync setup with backend:", err);
      }
    }
  };

  const registerUser = async (email: string, pw: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw, role: 'industry' })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Registration failed");
      }
    } catch (err: any) {
      // Fallback to local storage if backend is down
      console.warn("Backend registration failed, falling back to local:", err.message);
      const cur = read();
      if (cur.users[email]) throw new Error("Account already exists.");
      const next = {
        ...cur,
        users: { ...cur.users, [email]: { password: pw, setup: { email, password: pw } } }
      };
      write(next);
      setState(next);
      throw err;
    }
  };

  const loginUser = async (email: string, pw: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Login failed");
      }
      const data = await res.json();
      
      // Fetch setup from backend
      const setupRes = await fetch('/api/setup', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      const setupData = setupRes.ok ? await setupRes.json() : {};

      const cur = read();
      const next = {
        ...cur,
        currentUserEmail: email,
        industryAuthed: true,
        token: data.token,
        users: {
          ...cur.users,
          [email]: { password: pw, setup: { email, ...setupData } }
        }
      };
      write(next);
      setState(next);
      return true;
    } catch (err: any) {
      console.warn("Backend login failed, attempting local fallback:", err.message);
      // Legacy local fallback
      const cur = read();
      const user = cur.users[email];
      if (user && user.password === pw) {
        const next = { ...cur, currentUserEmail: email, industryAuthed: true };
        write(next);
        setState(next);
        return true;
      }
      throw new Error("Invalid credentials");
    }
  };

  // Keep register for legacy components that haven't been updated
  const register = registerUser;

  const resetSetup = () => {
    const cur = read();
    const email = cur.currentUserEmail;
    if (!email) return;
    const next = {
      ...cur,
      users: {
        ...cur.users,
        [email]: { password: cur.users[email].password, setup: { email, password: cur.users[email].password } }
      }
    };
    write(next);
    setState(next);
    
    // Also reset on backend
    if (cur.token) {
      fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cur.token}` },
        body: JSON.stringify({ completed: false }) // Reset flag
      }).catch(console.error);
    }
  };

  // Mimic legacy structure for minimal disruption, but dynamically compute the relevant setup.
  const state = {
    ...rawState,
    setup // dynamically override setup prop in state return value
  };

  return { state, update, updateSetup, resetSetup, register, loginUser, rawState };
}

export const Industries: IndustryType[] = ["Textile", "Pulp & Paper", "Food Processing", "Steel & Metal", "Pharma"];

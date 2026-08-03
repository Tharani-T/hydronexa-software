import { createFileRoute, redirect } from "@tanstack/react-router";
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

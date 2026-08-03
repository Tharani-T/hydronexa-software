import { createFileRoute } from "@tanstack/react-router";
import { AdminLogin } from "@/admin/login/Login";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

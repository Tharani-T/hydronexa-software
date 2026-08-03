import { createFileRoute } from "@tanstack/react-router";
import { GovLogin } from "@/government/login/Login";

export const Route = createFileRoute("/government/login")({
  component: GovLogin,
});

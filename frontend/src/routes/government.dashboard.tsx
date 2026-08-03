import { createFileRoute } from "@tanstack/react-router";
import { GovDashboard } from "@/government/dashboard/GovDashboard";

export const Route = createFileRoute("/government/dashboard")({
  component: GovDashboard,
});


export default GovDashboard;

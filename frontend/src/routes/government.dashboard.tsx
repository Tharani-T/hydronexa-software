import { createFileRoute } from "@tanstack/react-router";
import { GovDashboard } from "@/government/dashboard/GovDashboard";

import { GovLanguageProvider } from "@/government/utils/GovLanguageContext";

function WrappedGovDashboard() {
  return (
    <GovLanguageProvider>
      <GovDashboard />
    </GovLanguageProvider>
  );
}

export const Route = createFileRoute("/government/dashboard")({
  component: WrappedGovDashboard,
});

export default WrappedGovDashboard;

import { createFileRoute } from "@tanstack/react-router";
import { GovLogin } from "@/government/login/Login";

import { GovLanguageProvider } from "@/government/utils/GovLanguageContext";

function WrappedGovLogin() {
  return (
    <GovLanguageProvider>
      <GovLogin />
    </GovLanguageProvider>
  );
}

export const Route = createFileRoute("/government/login")({
  component: WrappedGovLogin,
});

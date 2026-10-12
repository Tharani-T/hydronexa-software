// Approved TNPCB CTO certificate gate.
// The industry is considered "Approved" ONLY when the uploaded
// certificate file is named exactly `gov_TNPCB_2026.pdf`.
// Any other document → "Not Approved" → extracted details stay hidden.

export const APPROVED_CTO_FILENAME = "gov_TNPCB_2026.pdf";

export type CtoDocStatus = "idle" | "verifying" | "approved" | "rejected";

export function isApprovedCtoFile(fileName: string): boolean {
  return fileName.trim().toLowerCase() === APPROVED_CTO_FILENAME.toLowerCase();
}
import textileImg from "@/assets/industry-textile.jpg";
import paperImg from "@/assets/industry-paper.jpg";
import foodImg from "@/assets/industry-food.jpg";
import steelImg from "@/assets/industry-steel.jpg";
import pharmaImg from "@/assets/industry-pharma.jpg";
import { LayoutDashboard, Factory, ShieldCheck, AlertTriangle, Brain, Mail, FileText, ClipboardCheck } from "lucide-react";

export const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "industries", label: "Industries", icon: Factory },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "mail", label: "Compliance Mail", icon: Mail },
  { id: "inspection", label: "Inspection Queue", icon: ClipboardCheck },
  { id: "reports", label: "Reports", icon: FileText },
];

export const monitoredIndustries = [
  { name: "Textile Mills Ltd", img: textileImg, sector: "Textile", cto: 78, reuse: 64, consumption: "12.4 ML", status: "warn" },
  { name: "GreenPaper Industries", img: paperImg, sector: "Pulp & Paper", cto: 62, reuse: 71, consumption: "18.2 ML", status: "ok" },
  { name: "FreshFoods Processing", img: foodImg, sector: "Food Processing", cto: 45, reuse: 82, consumption: "6.8 ML", status: "ok" },
  { name: "MetalWorks Steel Co.", img: steelImg, sector: "Steel & Metal", cto: 91, reuse: 58, consumption: "24.6 ML", status: "danger" },
  { name: "PharmaCare Labs", img: pharmaImg, sector: "Pharma", cto: 53, reuse: 76, consumption: "4.2 ML", status: "ok" },
];

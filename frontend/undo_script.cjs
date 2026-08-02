
const fs = require("fs");
let content = fs.readFileSync("src/routes/industry.dashboard.tsx", "utf-8");

const brokenIndex = content.indexOf("</bufunction");
if (brokenIndex !== -1) {
    let topHalf = content.substring(0, brokenIndex);
    // ensure `</button>\n       </div>\n    </div>\n  );\n}\n\n` is closed correctly before SettingsPanel
    const rcIndex = topHalf.lastIndexOf("<ArrowRight");
    if (rcIndex !== -1) {
         // The ArrowRight line is: `<ArrowRight className="h-4 w-4" /> {btnText}`
         const endOfArrowRight = topHalf.indexOf("{btnText}", rcIndex) + 9;
         topHalf = topHalf.substring(0, endOfArrowRight) + "\n       </button>\n    </div>\n  );\n}\n\n";
    }

    const oldSettings = `function SettingsPanel() {
  const { state, updateSetup } = useAppState();
  const s = state.setup || {};
  return (
    <div className="space-y-5">
      <div className="glass-strong rounded-2xl p-6 border border-cyan/20">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-5 w-5 text-cyan" />
          <h4 className="font-bold">Adaptive Configuration</h4>
        </div>
        <p className="text-xs text-muted-foreground">Changes update your dashboard, quality monitoring, and analytics in real time.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <SettingNumber label="CTO Limit (KL/day)" value={s.ctoLimit ?? 100} onChange={(v) => updateSetup({ ctoLimit: v })} />
        <SettingNumber label="Monthly CTO (KL)" value={s.monthlyCtoLimit ?? 3000} onChange={(v) => updateSetup({ monthlyCtoLimit: v })} />
        <SettingSlider label="Reuse Target %" value={s.reuseTarget ?? 60} onChange={(v) => updateSetup({ reuseTarget: v })} />
        <SettingSlider label="Alert Sensitivity" value={s.alertSensitivity ?? 70} onChange={(v) => updateSetup({ alertSensitivity: v })} />
      </div>
      <div className="flex items-center gap-2 text-xs text-eco">
        <Save className="h-3.5 w-3.5" /> Auto-saved · Dashboard adapting…
      </div>
    </div>
  );
}

function SettingNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="mt-2 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-eco focus:outline-none" />
    </div>
  );
}

function SettingSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex justify-between items-baseline">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
        <span className="text-xl font-bold text-gradient">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="mt-2 w-full accent-eco" />
    </div>
  );
}
`;
    content = topHalf + oldSettings;
    fs.writeFileSync("src/routes/industry.dashboard.tsx", content);
    console.log("Fixed bottom.");
}


import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// "Set reminders to update file drafts over the year" (year dates). Shows a
// banner when the newest dated year has reminders on, has an Original, no
// Final yet, and the last saved file for that year is older than the chosen
// interval (bi-annual 6 months, quarterly 3, monthly 1).
const MONTHS = { biannual: 6, quarterly: 3, monthly: 1 };
const NAMES = { biannual: "six months", quarterly: "three months", monthly: "month" };
const yearOf = (l) => (String(l || "").match(/\b(\d{4})\b/) || [])[1] || "";

function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

export async function checkReminder(country, email, isAdmin) {
  const me = (email || "").toLowerCase();
  const { data: rows } = await supabase.from("country_year_dates").select("year_label, reminder_frequency, set_by").eq("country", country);
  let usable = (rows || []).filter((r) => /^\d{4}$/.test(r.year_label));
  if (country === "Nyika II" && isAdmin) usable = usable.filter((r) => !r.set_by || r.set_by.toLowerCase() === me);
  if (usable.length === 0) return null;
  const year = usable.map((r) => r.year_label).sort().reverse()[0];
  const candidates = usable.filter((r) => r.year_label === year);
  const row = candidates.find((r) => r.set_by && r.set_by.toLowerCase() === me) || candidates[0];
  const freq = row?.reminder_frequency || "none";
  if (!MONTHS[freq]) return null;

  const { data: vs } = await supabase.from("country_versions").select("kind, year_label, created_at, created_by, by:data->>budgetYear").eq("country", country);
  let files = vs || [];
  if (country === "Nyika II") files = files.filter((v) => v.kind === "original" || (v.created_by || "").toLowerCase() === me);
  const inYear = files.filter((v) => (v.kind === "working" ? String(v.by || "").trim() === year : yearOf(v.year_label) === year));
  if (!inYear.some((v) => v.kind === "original")) return null;
  if (inYear.some((v) => v.kind === "final" || v.kind === "final_update")) return null;
  const last = inYear.reduce((m, v) => (v.created_at > m ? v.created_at : m), "");
  const next = addMonths(last, MONTHS[freq]);
  if (next > new Date()) return null;
  return { year, freq, last, interval: NAMES[freq] };
}

export default function ReminderBanner({ country, email, isAdmin, refreshKey, onGoToInputs }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let cancelled = false;
    checkReminder(country, email, isAdmin).then((r) => { if (!cancelled) setInfo(r); }).catch(() => { if (!cancelled) setInfo(null); });
    return () => { cancelled = true; };
  }, [country, email, isAdmin, refreshKey]);
  if (!info) return null;
  return (
    <div style={{ background: "#fff8e8", border: "1px solid #e0b84a", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#5a4000", lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <span>
        <strong>Time to update your {info.year} file.</strong> The last saved file for {info.year} was on {new Date(info.last).toLocaleDateString()}, more than {info.interval === "month" ? "a month" : info.interval} ago. Please review your figures and submit a new draft. You can change how often you get reminders under Year dates in Version History.
      </span>
      {onGoToInputs && (
        <button onClick={onGoToInputs} style={{ marginLeft: "auto", padding: "6px 12px", minHeight: 32, borderRadius: 6, border: "none", background: "#8a6d1f", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          Go to Version History
        </button>
      )}
    </div>
  );
}

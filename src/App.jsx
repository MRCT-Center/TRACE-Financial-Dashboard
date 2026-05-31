import { useState, useEffect, useCallback } from "react";
import { COUNTRY_FLAGS, COLORS as C } from "./utils/metrics";
import { COUNTRIES } from "./data/countries";
import { EXPENSES_REGULAR_ROW_DEFAULTS } from "./data/expensesRegular";
import { FEES_DEFAULT_ROWS, FEES_DEFAULT_COLUMN_LABELS, isLegacyFeesArray, isAllBlankFees, totalFeesRevenue, deriveLegacyFeeFields } from "./data/feesModel";
import { CurrencyProvider, COUNTRY_CURRENCIES, CURRENCIES, useCurrency } from "./utils/CurrencyContext";
import { supabase } from "./supabaseClient";
import { DEMO_MODE } from "./demoConfig";
import LoginPage from "./components/LoginPage";
import IntroPage from "./components/IntroPage";
import Results from "./components/Results";
import GuidedWizard from "./components/GuidedWizard";
import AdminDashboard from "./components/AdminDashboard";

// Mock credentials — Phase 2 will use Supabase Auth
const MOCK_USERS = {
  "admin@mrct.org":      { password: "mrct2026",    role: "admin",    country: null },
  "kenya@trace.org":     { password: "kenya2026",   role: "country",  country: "Kenya" },
  "nigeria@trace.org":   { password: "nigeria2026", role: "country",  country: "Nigeria" },
  "rwanda@trace.org":    { password: "rwanda2026",  role: "country",  country: "Rwanda" },
  "tanzania@trace.org":  { password: "tz2026",      role: "country",  country: "Tanzania" },
  "zimbabwe@trace.org":  { password: "zim2026",     role: "country",  country: "Zimbabwe" },
};

const COUNTRY_NAMES = Object.keys(COUNTRIES);

function deepSet(obj, path, value) {
  const keys = path.split(".");
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const next = cur[k];
    cur[k] = Array.isArray(next) ? [...next] : { ...next };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

const ADMIN_VIEWS = [
  { id: "intro",   label: "Introduction" },
  { id: "wizard",  label: "Inputs"       },
  { id: "results", label: "Results"      },
  { id: "admin",   label: "Admin 🔐"     },
];

const COUNTRY_VIEWS = [
  { id: "intro",   label: "Introduction" },
  { id: "wizard",  label: "Inputs"       },
  { id: "results", label: "Results"      },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("intro");
  const [selectedCountry, setSelectedCountry] = useState("Kenya");
  // countryCache holds live data: either loaded from Supabase or hardcoded fallback
  const [countryCache, setCountryCache] = useState({ ...COUNTRIES });
  const [dbStatus, setDbStatus] = useState("idle"); // idle | loading | ready | error

  // Load all country data from Supabase on mount
  useEffect(() => {
    async function loadFromSupabase() {
      setDbStatus("loading");
      try {
        const { data, error } = await supabase.from("country_data").select("country, data, updated_at");
        if (error) throw error;

        if (!data || data.length === 0) {
          // First run: seed Supabase with hardcoded data. Skip in demo mode so a
          // demo never writes to the database (it falls back to the in-code
          // COUNTRIES dummy data instead). See src/demoConfig.js.
          if (!DEMO_MODE) await seedSupabase();
        } else {
          // Merge Supabase data into cache (Supabase wins over hardcoded).
          // Phase 1 er.* rekey: if a Supabase row carries the legacy expense
          // shape (secSal/secBen/nSal/...) without any post-rekey workbook
          // keys, replace its er and _legacyEr with the fresh countries.js
          // versions so the new Regular Expenses table renders. Rows already
          // saved in the new shape are trusted as-is.
          const NEW_ER_PROBE_KEY = "salaries"; // workbook item present only post-rekey
          // Phase 1 Tier 3 (2026-05-22) irregular rekey: if any Supabase irrProj
          // row lacks a `category` key, it's the legacy {name, funder, amount}
          // shape — substitute the fresh countries.js workbook defaults so the
          // new Irregular Expenses table renders. (Supabase data preserved
          // until Willyanne approves the migration.)
          const isLegacyIrr = (rows) =>
            !Array.isArray(rows) || rows.length === 0 ||
            rows.some((r) => r && typeof r === "object" && r.category === undefined);
          // 2026-05-26 #15: Supabase rows from Friday's seed lack the new
          // "Ethics Committee capital costs (one-time/irregular activities)"
          // category. If the saved data has no row in that category, append
          // the two blank starter rows from countries.js defaults so the new
          // category appears in the UI.
          const ETHICS_COMMITTEE_IRR_CAT = "Ethics Committee capital costs (one-time/irregular activities)";
          const missingEthicsCommitteeCat = (rows) =>
            Array.isArray(rows) && !rows.some((r) => r && r.category === ETHICS_COMMITTEE_IRR_CAT);
          // 2026-05-26 #9: pre-existing Supabase rows have activities arrays
          // with only `{ name, nearTerm, longTerm, note }` — no `description`
          // field. Detect that and substitute fresh workbook defaults so the
          // editable-description UI renders and near/long-term values come
          // from workbook col I/J for all 5 countries.
          const isLegacyActivities = (rows) =>
            !Array.isArray(rows) || rows.length === 0 ||
            rows.some((r) => r && typeof r === "object" && r.description === undefined);
          // 2026-05-26 #11/#12 row-shape rekey: if a Supabase row lacks `erRows`,
          // synthesize it from EXPENSES_REGULAR_ROW_DEFAULTS overlaid with the
          // row's flat `er` amounts so user edits stored in the flat shape
          // survive the rekey.
          const synthEr = (flatEr) => {
            return EXPENSES_REGULAR_ROW_DEFAULTS.map((row) => ({
              ...row,
              amount: flatEr && Object.prototype.hasOwnProperty.call(flatEr, row.key)
                ? flatEr[row.key]
                : row.amount,
            }));
          };
          // 2026-05-26 #19/#20: pre-existing Supabase rows lack `revRegOther`
          // and `revIrr` array shapes (they only had a flat `revOther` number
          // and `ri.{grants,contracts,other,reserves}` rollup). Detect missing
          // or legacy shape and substitute the workbook blank-row defaults
          // from countries.js so the new Revenue UI renders. User-entered
          // Revenue Other / Irregular Revenue rows are preserved if present.
          const isLegacyRevRows = (rows) =>
            !Array.isArray(rows) || rows.length === 0 ||
            rows.some((r) => r && typeof r === "object" && r.category === undefined);
          // Willyanne 2026-05-27 #1/#2: prefix "Secretariat/mgmt." to specific
          // Secretariat-only expense categories on both Regular and Irregular
          // tabs. Existing Supabase rows still carry the old category strings;
          // rewrite them on load so the rendered grouping matches the new
          // labels. (Ethics Committee categories are left alone.)
          const CATEGORY_RENAMES = {
            "Personnel salaries (regular personnel)":              "Secretariat/mgmt. Personnel salaries (regular personnel)",
            "Personnel benefits — insurance (regular personnel)":  "Secretariat/mgmt. Personnel benefits — insurance (regular personnel)",
            "Personnel benefits — pension (regular personnel)":    "Secretariat/mgmt. Personnel benefits — pension (regular personnel)",
            "Recurrent costs (general)":                           "Secretariat/mgmt. Recurrent costs (general)",
            "Recurrent costs (govt fees & compliance)":            "Secretariat/mgmt. Recurrent costs (govt fees & compliance)",
            "Capital costs (durable goods)":                       "Secretariat/mgmt. Capital costs (durable goods)",
            "Capital costs (one-time/irregular activities)":       "Secretariat/mgmt. Capital costs (one-time/irregular activities)",
          };
          const renameCategories = (rows) =>
            Array.isArray(rows)
              ? rows.map((r) =>
                  r && CATEGORY_RENAMES[r?.category]
                    ? { ...r, category: CATEGORY_RENAMES[r.category] }
                    : r,
                )
              : rows;
          // In-Kind aggregate guard (Willyanne 2026-05-29, Tier 12): the
          // Results → Overview In-Kind boxes read the flat ikReg/ikIrr
          // aggregates ({ federal, institutional, other, total }). Pre-Tier-12
          // Supabase rows stored these as zeros for every country except Kenya,
          // so the Overview showed 0 even though the Step 5 In-Kind tab (which
          // falls back to the row defaults) shows the real totals ($93,750
          // regular / $20,000 irregular). When the stored aggregate is missing
          // or zero, re-derive it from the saved In-Kind rows, or from the
          // countries.js workbook defaults when no rows were entered, so the
          // Overview always matches the tab. A real entered aggregate (total > 0,
          // e.g. Kenya or any country that has submitted the wizard) is left as-is.
          const IK_FUNDER_BUCKET = {
            "In-kind contribution (federal)":       "federal",
            "In-kind contribution (institutional)": "institutional",
            "In-kind contribution (other source)":  "other",
          };
          const deriveIkAgg = (rows) => {
            const agg = { federal: 0, institutional: 0, other: 0, total: 0 };
            (Array.isArray(rows) ? rows : []).forEach((r) => {
              const v = Number(r?.amount) || 0;
              agg.total += v;
              const bucket = IK_FUNDER_BUCKET[r?.funder];
              if (bucket) agg[bucket] += v;
            });
            return agg;
          };
          // Stale when: missing, zero/blank total, OR carrying a total but no
          // federal/institutional/other breakdown (e.g. Kenya's pre-Tier-12
          // ikIrr = { total: 20000 } with no funder buckets, which left the
          // Overview bottom-right "Other" understated and inconsistent with the
          // Total). In all these cases re-derive the full { federal, institutional,
          // other, total } shape from the rows or the countries.js defaults.
          const ikIsStale = (agg) => !agg || !(Number(agg.total) > 0) ||
            (agg.federal === undefined && agg.institutional === undefined && agg.other === undefined);
          const updated = { ...COUNTRIES };
          data.forEach(({ country, data: d }) => {
            if (!updated[country]) return;
            const supabaseHasNewShape = d?.er && Object.prototype.hasOwnProperty.call(d.er, NEW_ER_PROBE_KEY);
            const merged = supabaseHasNewShape
              ? { ...updated[country], ...d }
              : {
                  ...updated[country],
                  ...d,
                  er:        updated[country].er,
                  _legacyEr: updated[country]._legacyEr,
                };
            // Irregular shape guard — independent of er probe
            if (isLegacyIrr(d?.irrProj)) {
              merged.irrProj = updated[country].irrProj;
            } else if (missingEthicsCommitteeCat(merged.irrProj)) {
              // Saved data is post-2026-05-22 (category present) but pre-2026-05-26
              // (no Ethics Committee category). Append the 2 new blank rows from
              // defaults so the new category surfaces.
              const ecRows = updated[country].irrProj.filter(
                (r) => r.category === ETHICS_COMMITTEE_IRR_CAT,
              );
              merged.irrProj = [...merged.irrProj, ...ecRows];
            }
            // Regular row-shape guard
            if (!Array.isArray(merged.erRows) || merged.erRows.length === 0) {
              merged.erRows = synthEr(merged.er);
            }
            // Activities row-shape guard (Willyanne 2026-05-26 #9)
            if (isLegacyActivities(d?.activities)) {
              merged.activities = updated[country].activities;
            }
            // Revenue Other + Irregular Revenue guards (Willyanne 2026-05-26 #19/#20)
            if (isLegacyRevRows(d?.revRegOther)) {
              merged.revRegOther = updated[country].revRegOther;
            }
            // Tier 12 (Willyanne 2026-05-29): the Irregular Revenue defaults now
            // seed the first Grant row from the workbook (Gates Foundation,
            // $300,000). Pre-Tier-12 Supabase rows carry the Tier-5 all-blank
            // revIrr rows (correct shape, so not "legacy"), which would hide the
            // new seed. Re-seed when the saved rows are legacy OR entirely blank
            // so the Gates row surfaces; any country that entered real irregular
            // revenue (a row with amount > 0) is preserved.
            const isAllBlankRevIrr = (rows) =>
              Array.isArray(rows) && rows.length > 0 &&
              rows.every((r) => !(Number(r?.amount) > 0));
            if (isLegacyRevRows(d?.revIrr) || isAllBlankRevIrr(d?.revIrr)) {
              merged.revIrr = updated[country].revIrr;
            }
            // Tier 10 (Willyanne 2026-05-28): Regular Revenue from Fees row
            // shape changed from `{ type, ind, ngo, ctPro, ctStu, rev }` to
            // `{ type, cells: { proAny:{amount,count}, ... × 9 } }`. If any
            // saved fee row lacks `cells`, substitute fresh defaults and seed
            // default column labels. Saved fees with the new shape are
            // preserved as-is.
            // Tier 11 (Willyanne 2026-05-28B): the fees defaults are now seeded
            // with the workbook fee schedule. Re-seed when saved fees are
            // legacy-shape OR new-shape-but-all-blank (an untouched Tier 10
            // submit) so the seeded data surfaces; real entered fees are kept.
            if (isLegacyFeesArray(d?.fees) || isAllBlankFees(d?.fees)) {
              merged.fees = JSON.parse(JSON.stringify(FEES_DEFAULT_ROWS));
              merged.feesColumns = JSON.parse(JSON.stringify(FEES_DEFAULT_COLUMN_LABELS));
            } else if (!d?.feesColumns) {
              merged.feesColumns = JSON.parse(JSON.stringify(FEES_DEFAULT_COLUMN_LABELS));
            }
            // In-Kind aggregate guard (Willyanne 2026-05-29, Tier 12)
            if (ikIsStale(merged.ikReg)) {
              const fromRows = deriveIkAgg(merged.ikRegRows);
              merged.ikReg = fromRows.total > 0 ? fromRows : { ...updated[country].ikReg };
            }
            if (ikIsStale(merged.ikIrr)) {
              const fromRows = deriveIkAgg(merged.ikIrrRows);
              merged.ikIrr = fromRows.total > 0 ? fromRows : { ...updated[country].ikIrr };
            }
            // Irregular-expense aggregate guard (Willyanne 2026-05-29, Tier 12):
            // the Overview/metrics irregular-expense KPI reads the flat ei.proj.
            // Pre-Tier-12 Supabase rows carry drifted per-country placeholders
            // (Kenya 350k / Nigeria 248k / Rwanda 150k / Tanzania 200k /
            // Zimbabwe 135k) that disagree with the irrProj rows (all $300,000).
            // ei.proj is by definition Σ irrProj (the wizard writes it that way
            // on submit), so recompute it from the rows whenever they carry a
            // total, making the KPI match the Step 3 Irregular tab for all five.
            const irrProjSum = (Array.isArray(merged.irrProj) ? merged.irrProj : [])
              .reduce((s, r) => s + (Number(r?.amount) || 0), 0);
            if (irrProjSum > 0) merged.ei = { ...merged.ei, proj: irrProjSum };
            // Revenue aggregate guard (Willyanne 2026-05-30 #2/#3/#5/#8/#9): the
            // Overview/Results read the flat revFees / revOther / ri rollups, but
            // the wizard Inputs → Revenue pages total the row arrays (fees,
            // revRegOther, revIrr). Pre-existing Supabase rows carry hand-set
            // placeholders that drifted from those rows (e.g. Rwanda revFees
            // $195k / revOther $15k / ri.grants $180k vs the $331,375 fee
            // schedule, $0 other, and Gates $300,000 grant). Re-derive all three
            // from the now-finalized rows — exactly as the wizard does on submit
            // — so Results matches the Inputs totals for every country. A country
            // that entered real fees/revenue keeps its values (the rows are the
            // source of truth either way).
            if (Array.isArray(merged.fees)) {
              merged.revFees = totalFeesRevenue(merged.fees);
              // Re-derive each row's legacy fields (ctPro/ctStu/ind/ngo/rev)
              // from its cells. The Results-side consumers that still read these
              // — the GapView advocacy review counts and the Revenue "Fee
              // Schedule" table — otherwise show zeros for seeded/loaded data,
              // because deriveLegacyFeeFields previously ran only on wizard
              // submit. cells remain the source of truth (Willyanne 2026-05-31
              // audit: Revenue + Gap pages must reconcile to the fee table).
              merged.fees = merged.fees.map((r) =>
                r && r.cells ? { ...r, ...deriveLegacyFeeFields(r) } : r);
            }
            if (Array.isArray(merged.revRegOther)) {
              merged.revOther = merged.revRegOther
                .reduce((s, r) => s + (Number(r?.amount) || 0), 0);
            }
            if (Array.isArray(merged.revIrr)) {
              merged.ri = merged.revIrr.reduce((acc, r) => {
                const v = Number(r?.amount) || 0;
                if (r?.category === "Grant") acc.grants += v;
                else if (r?.category === "Contract") acc.contracts += v;
                else if (r?.category === "Other 1-time payment") acc.other += v;
                else if (r?.category === "Deferred reserves") acc.reserves += v;
                return acc;
              }, { grants: 0, contracts: 0, other: 0, reserves: 0 });
            }
            // Ethics Committee detail guard (Willyanne 2026-05-30 #7): the
            // Results → Expenses "Ethics Committee — Detailed Breakdown" card
            // reads the flat necDetail, but its source of truth is the er Ethics
            // items on the Inputs → 3. Expenses page. Stale Supabase necDetail
            // drifted (e.g. Rwanda reviewPay $14k vs the $30k workbook value).
            // Re-derive from the er Ethics keys so the card mirrors the inputs.
            if (merged.er) {
              merged.necDetail = {
                reviewPay:   Number(merged.er.necReviewerSalaryReview)   || 0,
                reviewTrain: Number(merged.er.necReviewerSalaryTraining) || 0,
                travelTime:  Number(merged.er.necTravelTimeStipend)      || 0,
                travelCost:  Number(merged.er.necTravelCostStipend)      || 0,
                meetings:    Number(merged.er.necReviewMeetingHosting)   || 0,
              };
            }
            // Category prefix migration (Willyanne 2026-05-27 #1/#2)
            merged.erRows = renameCategories(merged.erRows);
            merged.irrProj = renameCategories(merged.irrProj);
            updated[country] = merged;
          });
          setCountryCache(updated);
        }
        setDbStatus("ready");
      } catch (err) {
        console.warn("Supabase unavailable, using hardcoded data:", err.message);
        setDbStatus("error");
      }
    }
    loadFromSupabase();
  }, []);

  async function seedSupabase() {
    const rows = Object.entries(COUNTRIES).map(([country, data]) => ({
      country,
      data,
      updated_by: "seed",
    }));
    const { error } = await supabase.from("country_data").insert(rows);
    if (error) console.warn("Seed failed:", error.message);
  }

  async function saveCountryData(country, updates) {
    const merged = { ...countryCache[country], ...updates };
    setCountryCache((prev) => ({ ...prev, [country]: merged }));
    // Demo mode: edits update the in-memory cache only (so the UI reflects them
    // this session) but are NEVER persisted to Supabase, so the seeded dummy data
    // stays pristine. A refresh reloads the clean data. See src/demoConfig.js.
    if (DEMO_MODE) return;
    const { error } = await supabase.from("country_data").upsert({
      country,
      data: merged,
      updated_at: new Date().toISOString(),
      updated_by: session?.email || "unknown",
    });
    if (error) console.warn("Save failed:", error.message);
  }

  const handleEdit = useCallback(async (path, value) => {
    const current = countryCache[selectedCountry];
    const updated = deepSet(current, path, value);
    await saveCountryData(selectedCountry, updated);
  }, [selectedCountry, countryCache]); // eslint-disable-line

  function handleLogin(email, password) {
    const user = MOCK_USERS[email.toLowerCase()];
    if (!user || user.password !== password) return "Invalid email or password.";
    const country = user.country || "Kenya";
    setSession({ email: email.toLowerCase(), role: user.role, country });
    setSelectedCountry(country);
    setView("intro");
    return null;
  }

  function handleLogout() {
    setSession(null);
    setView("intro");
  }

  if (!session) return <LoginPage onLogin={handleLogin} />;

  const isAdmin = session.role === "admin";
  const views = isAdmin ? ADMIN_VIEWS : COUNTRY_VIEWS;
  const countryData = countryCache[selectedCountry] || COUNTRIES[selectedCountry];
  const flag = COUNTRY_FLAGS[selectedCountry] || "";

  return (
    <CurrencyProvider country={selectedCountry}>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100svh" }}>
        <Header
          isAdmin={isAdmin}
          selectedCountry={selectedCountry}
          flag={flag}
          countryNames={COUNTRY_NAMES}
          onCountryChange={(c) => setSelectedCountry(c)}
          onLogout={handleLogout}
          email={session.email}
          dbStatus={dbStatus}
          view={view}
        />
        <NavBar views={views} current={view} onSelect={setView} />
        <main style={{ flex: 1, padding: "20px 16px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {view === "intro"   && <IntroPage onNavigate={setView} isAdmin={isAdmin} />}
          {view === "wizard"  && (
            <GuidedWizard
              key={selectedCountry}
              country={selectedCountry}
              data={countryData}
              onSave={(updates) => saveCountryData(selectedCountry, updates)}
            />
          )}
          {view === "results" && <Results country={selectedCountry} data={countryData} flag={flag} onEdit={handleEdit} />}
          {view === "admin"   && isAdmin && (
            <AdminDashboard
              countries={countryCache}
              flags={COUNTRY_FLAGS}
              onNavigate={(c, v) => { setSelectedCountry(c); setView(v); }}
            />
          )}
        </main>
        <footer style={{ background: C.navy, color: "#fff", padding: "12px 20px", fontSize: 12, textAlign: "center", opacity: 0.85 }}>
          TRACE Financial Dashboard · MRCT Center · Prototype {new Date().getFullYear()}
        </footer>
      </div>
    </CurrencyProvider>
  );
}

function Header({ isAdmin, selectedCountry, flag, countryNames, onCountryChange, onLogout, email, dbStatus, view }) {
  const { showLocal, setShowLocal, displayCode, defaultCode, currency } = useCurrency();

  return (
    <header style={{
      background: C.navy,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 20px",
      gap: 12,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <img
          src="/trace-logo.svg"
          alt="TRACE"
          style={{ height: 40, objectFit: "contain" }}
        />
        <div style={{ width: 3, height: 28, background: "#f8df57", flexShrink: 0, marginTop: 17, borderRadius: 2 }} />
        <div style={{ paddingTop: 17 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>Financial Dashboard</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>MRCT Center</div>
            {dbStatus === "loading" && <span style={{ fontSize: 10, opacity: 0.6 }}>⟳ connecting…</span>}
            {dbStatus === "ready"   && !DEMO_MODE && <span style={{ fontSize: 10, color: "#7ecf5a" }}>● live</span>}
            {dbStatus === "ready"   &&  DEMO_MODE && <span style={{ fontSize: 10, color: "#f8df57" }}>● demo (edits not saved)</span>}
            {dbStatus === "error"   && <span style={{ fontSize: 10, color: C.yellow }}>● offline</span>}
          </div>
        </div>
        <div style={{
          alignSelf: "center",
          background: C.red,
          color: "#fff",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          padding: "4px 10px",
          borderRadius: 6,
          whiteSpace: "nowrap",
        }}>
          Draft Version · Do Not Share
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Currency toggle — hidden on the Wizard view, which has its own Step 1 currency control */}
        {defaultCode !== "USD" && view !== "wizard" && (
          <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1px solid rgba(255,255,255,0.25)", borderRadius: 7, overflow: "hidden", fontSize: 12 }}>
            <button
              onClick={() => setShowLocal(true)}
              style={{ padding: "6px 11px", minHeight: 36, background: showLocal ? C.teal : "transparent", color: "#fff", fontWeight: showLocal ? 700 : 400 }}
            >
              {currency.symbol} {currency.code}
            </button>
            <button
              onClick={() => setShowLocal(false)}
              style={{ padding: "6px 11px", minHeight: 36, background: !showLocal ? C.teal : "transparent", color: "#fff", fontWeight: !showLocal ? 700 : 400, borderLeft: "1px solid rgba(255,255,255,0.2)" }}
            >
              $ USD
            </button>
          </div>
        )}

        {isAdmin ? (
          <select
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            style={{ background: C.darkNavy, color: "#fff", border: `1px solid ${C.teal}`, borderRadius: 6, padding: "6px 10px", fontSize: 14, minHeight: 44 }}
          >
            {countryNames.map((c) => (
              <option key={c} value={c}>{COUNTRY_FLAGS[c]} {c}</option>
            ))}
          </select>
        ) : (
          <div style={{ fontSize: 15, fontWeight: 600 }}>{flag} {selectedCountry}</div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>{email}</span>
          <button
            onClick={onLogout}
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 6, padding: "6px 12px", fontSize: 13, minHeight: 44, border: "1px solid rgba(255,255,255,0.2)" }}
          >
            Sign out
          </button>
        </div>
        <img src="/mrct-shield-white.svg" alt="MRCT Center" style={{ height: 40, objectFit: "contain" }} />
      </div>
    </header>
  );
}

function NavBar({ views, current, onSelect }) {
  return (
    <nav style={{ background: C.darkNavy, display: "flex", overflowX: "auto", borderBottom: `3px solid ${C.teal}` }}>
      {views.map((v) => (
        <button
          key={v.id}
          onClick={() => onSelect(v.id)}
          style={{
            color: current === v.id ? C.yellow : "rgba(255,255,255,0.75)",
            borderBottom: current === v.id ? `3px solid ${C.yellow}` : "3px solid transparent",
            padding: "12px 18px",
            fontSize: 13,
            fontWeight: current === v.id ? 700 : 400,
            whiteSpace: "nowrap",
            minHeight: 44,
            marginBottom: -3,
            transition: "color 0.15s",
          }}
        >
          {v.label}
        </button>
      ))}
    </nav>
  );
}

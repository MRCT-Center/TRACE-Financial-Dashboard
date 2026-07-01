import { useState } from "react";
import { COLORS as C } from "../utils/metrics";
import Overview from "./Overview";
import Expenses from "./Expenses";
import Revenue from "./Revenue";
import GapView from "./GapView";
import Activities from "./Activities";
import Forecast from "./Forecast";

const RESULTS_TABS = [
  { id: "overview",   label: "Overview"      },
  { id: "expenses",   label: "Expenses"      },
  { id: "revenue",    label: "Revenue"       },
  { id: "gap",        label: "Gap Analysis"  },
  { id: "activities", label: "Activities"    },
  { id: "forecast",   label: "Forecast"      },
];

export default function Results({ country, data, flag, onEdit, defaultTab = "overview" }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", borderBottom: `1px solid #dde`, paddingBottom: 0 }}>
        {RESULTS_TABS.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? C.teal : C.blueGrey,
                background: "transparent",
                border: "none",
                borderBottom: `3px solid ${isActive ? C.teal : "transparent"}`,
                marginBottom: -1,
                cursor: "pointer",
                whiteSpace: "nowrap",
                minHeight: 44,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === "overview"   && <Overview   country={country} data={data} flag={flag} onEdit={onEdit} />}
        {activeTab === "expenses"   && <Expenses   country={country} data={data} flag={flag} onEdit={onEdit} />}
        {activeTab === "revenue"    && <Revenue    country={country} data={data} flag={flag} onEdit={onEdit} />}
        {activeTab === "gap"        && <GapView    country={country} data={data} flag={flag} onEdit={onEdit} />}
        {activeTab === "activities" && <Activities country={country} data={data} flag={flag} onEdit={onEdit} />}
        {activeTab === "forecast"   && <Forecast   country={country} data={data} flag={flag} onEdit={onEdit} />}
      </div>
    </div>
  );
}

import { ForecastCard, SectionHeader } from "./Activities";
import StepInstructions from "./StepInstructions";
import { FORECAST_INSTRUCTIONS } from "../data/instructions";

// Budget Forecast — its own Results tab as of 2026-07-01 (Willyanne), sitting
// after Activities. Wraps the ForecastCard (defined in Activities.jsx) with a
// section header and the forecasting instructions expander.
export default function Forecast({ country, data, flag, onEdit }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title={`${flag} ${country} — Budget Forecast`} subtitle="Near-term and long-term outlook for the regular operating budget" />
      <StepInstructions stepInstructions={FORECAST_INSTRUCTIONS} />
      <ForecastCard key={country} data={data} onEdit={onEdit} />
    </div>
  );
}

export function gm(d) {
  const te = Object.values(d.er).reduce((a, b) => a + b, 0);
  const ti = Object.values(d.ei).reduce((a, b) => a + b, 0);
  const tr = d.revFees + d.revOther;
  const tri = Object.values(d.ri).reduce((a, b) => a + b, 0);
  const ik = (d.ikReg?.total || 0) + (d.ikIrr?.total || 0);
  return { te, ti, tr, tri, rg: tr - te, ig: tri - ti, cg: (tr - te) + (tri - ti), ik };
}

export const fmt = (n) =>
  typeof n === "number"
    ? n >= 0
      ? `$${n.toLocaleString()}`
      : `-$${Math.abs(n).toLocaleString()}`
    : "$0";

export const fmtPct = (n) => `${Math.round(n)}%`;

export const COUNTRY_FLAGS = {
  Kenya: "🇰🇪",
  Nigeria: "🇳🇬",
  Rwanda: "🇷🇼",
  Tanzania: "🇹🇿",
  Zimbabwe: "🇿🇼",
};

export const COLORS = {
  navy: "#003b58",
  darkNavy: "#002044",
  teal: "#008ba2",
  darkTeal: "#006778",
  red: "#a90533",
  darkRed: "#6f0016",
  lightBG: "#cad6de",
  blueGrey: "#818f98",
  green: "#618F2B",
  orange: "#ED2E36",
  purple: "#7F1E5B",
  steelblue: "#026CAC",
  yellow: "#F8BE15",
  white: "#ffffff",
  offWhite: "#f4f6f8",
};

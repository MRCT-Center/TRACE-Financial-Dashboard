import { createContext, useContext, useState } from "react";

export const CURRENCIES = {
  USD: { code: "USD", symbol: "$",   name: "US Dollar",          rate: 1 },
  KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling",    rate: 129.5 },
  NGN: { code: "NGN", symbol: "₦",   name: "Nigerian Naira",     rate: 1610  },
  RWF: { code: "RWF", symbol: "RF",  name: "Rwandan Franc",      rate: 1405  },
  TZS: { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", rate: 2655  },
  ZWG: { code: "ZWG", symbol: "ZiG", name: "Zimbabwe Gold",      rate: 13.6  },
  // Fictional currency for the worked-example country Nyika. Pegged to the
  // Indonesian rupiah rate so the demo shows a realistic currency conversion
  // without colliding with any real African currency we may add later.
  NYR: { code: "NYR", symbol: "Rp",  name: "Nyika Rupiah",       rate: 16300 },
};

export const COUNTRY_CURRENCIES = {
  Kenya:    "KES",
  Nigeria:  "NGN",
  Rwanda:   "RWF",
  Tanzania: "TZS",
  Zimbabwe: "ZWG",
  Nyika:    "NYR",
};

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children, country }) {
  const defaultCode = COUNTRY_CURRENCIES[country] || "USD";
  const [showLocal, setShowLocal] = useState(true);
  const [rates, setRates] = useState({ ...Object.fromEntries(Object.entries(CURRENCIES).map(([k, v]) => [k, v.rate])) });

  const currency = CURRENCIES[defaultCode] || CURRENCIES.USD;
  const effectiveRate = showLocal ? (rates[defaultCode] || currency.rate) : 1;
  const displayCode = showLocal ? defaultCode : "USD";
  const displaySymbol = showLocal ? currency.symbol : "$";

  function fmt(n) {
    if (typeof n !== "number") return `${displaySymbol}0`;
    const converted = n * effectiveRate;
    const abs = Math.abs(converted);
    const formatted = abs >= 1000000
      ? `${(abs / 1000000).toFixed(2)}M`
      : abs >= 1000
      ? abs.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : abs.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return converted >= 0
      ? `${displaySymbol}${formatted}`
      : `-${displaySymbol}${formatted}`;
  }

  function updateRate(code, rate) {
    setRates((r) => ({ ...r, [code]: rate }));
  }

  return (
    <CurrencyContext.Provider value={{ showLocal, setShowLocal, displayCode, displaySymbol, effectiveRate, currency, rates, updateRate, fmt, defaultCode }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}

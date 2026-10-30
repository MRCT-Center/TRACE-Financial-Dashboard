import { supabase } from "../supabaseClient";
import { changesForKeys } from "./diffCountryData";

// Permanent running log of changes (country_change_log). One entry per save:
// who, when, the draft title, the notes, and the list of changes made.
export const fmtVal = (v) => {
  if (v === null || v === undefined || v === "") return "(blank)";
  if (typeof v === "object") { try { return JSON.stringify(v); } catch { return String(v); } }
  return String(v);
};

export async function addChangeLog({ country, refYear, kind, title, summary, createdBy, changes }) {
  const slim = (changes || []).map((c) => ({ path: c.path, label: c.label, oldValue: c.oldValue, newValue: c.newValue }));
  const { error } = await supabase.from("country_change_log").insert({
    country, ref_year: refYear || "", kind, title: title || null, summary: summary || null,
    created_by: createdBy || "unknown", changes: slim,
  });
  if (error) console.warn("Could not write change log:", error.message);
}

export async function fetchChangeLog(country, refYear) {
  const { data, error } = await supabase
    .from("country_change_log").select("*")
    .eq("country", country).eq("ref_year", refYear || "")
    .order("created_at", { ascending: false });
  if (error) { console.warn("Could not load change log:", error.message); return []; }
  return data || [];
}

// Keep only the changes for one wizard page (by top-level data keys).
export const entriesForKeys = (entries, keys) =>
  entries
    .map((e) => ({ ...e, changes: changesForKeys(e.changes || [], keys) }))
    .filter((e) => e.changes.length > 0);

const KIND = { original: "Original", midpoint: "Midpoint", final: "Final", working: "New draft" };
export const kindLabel = (k) => KIND[k] || k;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Downloads the log as a Word-readable file (HTML saved as .doc).
export function exportLogToWord(country, refYear, entries) {
  const body = entries.map((e) => `
    <h3>${esc(new Date(e.created_at).toLocaleString())} &ndash; ${esc(e.created_by)}</h3>
    <p><b>${esc(kindLabel(e.kind))}</b>${e.title ? ` &ndash; ${esc(e.title)}` : ""}</p>
    ${e.summary ? `<p><i>Notes: ${esc(e.summary)}</i></p>` : ""}
    ${(e.changes || []).length === 0 ? "<p>No input changes recorded for this save.</p>" : `<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;width:100%">
      <tr><th align="left">What changed</th><th align="left">Was</th><th align="left">Now</th></tr>
      ${(e.changes || []).map((c) => `<tr><td>${esc(c.label)}</td><td>${esc(fmtVal(c.oldValue))}</td><td>${esc(fmtVal(c.newValue))}</td></tr>`).join("")}
    </table>`}`).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Change log</title></head><body style="font-family:Calibri,Arial,sans-serif;font-size:11pt">
    <h1>TRACE change log &ndash; ${esc(country)} ${esc(refYear)}</h1>
    <p>Every saved change for ${esc(refYear)}, newest first. Exported ${esc(new Date().toLocaleString())}.</p>${body}</body></html>`;
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `TRACE-change-log-${country.replace(/\s+/g, "-")}-${refYear || "all"}.doc`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

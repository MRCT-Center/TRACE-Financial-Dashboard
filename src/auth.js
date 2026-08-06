import { supabase } from "./supabaseClient";

// ─── Access-control helpers ────────────────────────────────────────────────
// Real Supabase Auth (email + password) plus two tables set up by
// supabase-access-control-migration.sql: access_requests and profiles.
// See AGENTS.md → "Access control" for the full flow.

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return error.message;
  return null;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// Country rep asks MRCT Center for access to a country.
export async function requestAccess({ name, email, country, note }) {
  const { error } = await supabase.from("access_requests").insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    country,
    note: note?.trim() || null,
  });
  if (error) return error.message;
  return null;
}

// Look up the latest request for an email, without needing to be signed in.
export async function checkAccessRequest(email) {
  const { data, error } = await supabase.rpc("check_access_request", {
    p_email: email.trim().toLowerCase(),
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] || null : data || null;
}

// A rep whose request was approved sets their password here. This creates
// the real Supabase Auth user; the profile row (role/country) is finished
// off by ensureProfile() below once a session exists — which happens right
// away if the Supabase project doesn't require email confirmation, or on
// their first sign-in afterward if it does.
export async function claimAccess({ email, password }) {
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return error.message;
  return null;
}

// Called whenever we see a signed-in Supabase user with no app profile yet.
// Backfills role + country from their access_requests history, and marks
// that request 'completed' so it drops off the admin's pending queue.
export async function ensureProfile(user) {
  const { data: existing, error: readErr } = await supabase
    .from("profiles")
    .select("id, role, country")
    .eq("id", user.id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (existing) return existing;

  const req = await checkAccessRequest(user.email);
  const country = req && (req.status === "approved" || req.status === "completed")
    ? req.country
    : null;

  const { data: created, error: insertErr } = await supabase
    .from("profiles")
    .insert({ id: user.id, email: user.email, role: "country", country })
    .select("id, role, country")
    .single();
  if (insertErr) throw new Error(insertErr.message);

  if (req && req.status === "approved") {
    await supabase
      .from("access_requests")
      .update({ status: "completed", decided_at: req.decided_at || new Date().toISOString() })
      .eq("id", req.id)
      .eq("status", "approved");
  }

  return created;
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, country")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

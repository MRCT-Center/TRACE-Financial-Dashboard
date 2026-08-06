# Access Control — setup & rollout steps

Built, then verified by cloning the repo, applying these changes, and running
`npm run lint` + `npm run build` in a sandbox — both pass clean (no new
errors beyond the pre-existing lint debt already in `GuidedWizard.jsx`,
`Overview.jsx`, `Revenue.jsx`, `CurrencyContext.jsx`, which this change
doesn't touch).

## What's in this folder

- `supabase-access-control-migration.sql` — run this first.
- `auth.js` — new file, goes at `src/auth.js`.
- `App.jsx` — replaces `src/App.jsx`.
- `LoginPage.jsx` — replaces `src/components/LoginPage.jsx`.
- `AdminAccessRequests.jsx` — new file, goes at `src/components/AdminAccessRequests.jsx`.
- `AGENTS.md` — replaces the repo's `AGENTS.md` (updated per its own "update
  this file in the same commit" rule).

## 1. Run the SQL migration

Supabase Dashboard → your project (`mrct-trace-dashboard`, `ohnwrvysqbtyxghnlkbx`)
→ SQL Editor → paste in `supabase-access-control-migration.sql` → Run.

This creates two tables (`access_requests`, `profiles`), their row-level
security policies, and one function (`check_access_request`). Safe to re-run —
it uses `if not exists` / `drop policy if exists` throughout.

## 2. Create the MRCT admin account

The self-serve request flow only ever grants the `country` role, on purpose —
the admin account is set up by hand, once:

1. Supabase Dashboard → Authentication → Users → **Add user**. Use whatever
   email/password you want for the admin login (e.g. `admin@mrct.org`).
2. Back in the SQL Editor, run (swap in the email you just used):
   ```sql
   insert into public.profiles (id, email, role, country)
   select id, email, 'admin', null
   from auth.users
   where email = 'admin@mrct.org'
   on conflict (id) do update set role = 'admin';
   ```

## 3. Decide on email confirmation

Supabase Dashboard → Authentication → Settings → **Confirm email**.

- **Off:** a country rep sets their password and is signed in immediately —
  simplest for a low-bandwidth setting.
- **On:** they get a confirmation email first, then sign in normally
  afterward. The code handles both — `ensureProfile()` finishes linking their
  account (role + country) on whichever sign-in actually succeeds.

Either is fine; pick based on how much you trust the "anyone with the
request-access link" surface for now.

## 4. Add the files to the repo

Per `AGENTS.md`'s own convention: on a branch, either paste each file's full
contents over the original in the GitHub web editor, or drop them into your
local clone. Two are new files (`auth.js`, `AdminAccessRequests.jsx`), the
rest replace existing files at the same path.

Push, check the Vercel preview link, then merge to `main`.

## 5. Recreate any demo logins you still need

The old hardcoded logins (`nyika@trace.org` / `nyika2026`, `kenya@trace.org`,
etc.) are gone — they were client-side mock credentials, incompatible with
real auth. If Willyanne still needs the Nyika demo login for prototype demos,
recreate it the same way as the admin account (step 2), just with
`role = 'country'` and `country = 'Nyika'` instead of `'admin'`.

## What to test on the preview link

1. Submit a request from "Request access" as a fake country rep.
2. Sign in as admin → Admin tab → **Access Requests** → approve it.
3. Go back to "Already approved? Set your password" as that rep, set a
   password, confirm you land in the app scoped to the right country.
4. Try denying a request and confirm the claim flow correctly blocks it.
5. Confirm the old mock logins no longer work (expected).

## Known gaps (also logged in AGENTS.md)

No revoke-access UI yet, no way to change someone's role/country after
creation except by hand in Supabase, and no email notification to the admin
when a request comes in — the Access Requests tab has to be checked
manually. Worth deciding if/when you want those.

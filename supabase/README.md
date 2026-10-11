1. Create a project at [supabase.com](https://supabase.com).
2. Go to SQL Editor and copy/paste the contents of `supabase/schema.sql`, then click **Run**.
3. Go to Project Settings > API and copy the `URL` and `anon public` key.
4. Duplicate `.env.example` to `.env` and fill in the values:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Go to Authentication > Providers and ensure "Email" is enabled (Magic Link is typically on by default).
6. **Important Security Step**: After you log in for the first time on your device, go to **Authentication > Configuration > Sign In / Up** (or Policies) and **disable "Enable signups"**. This prevents strangers from creating accounts on your database.
7. To verify Row Level Security, run `supabase/rls-test.sql` in the Supabase SQL Editor.
   If your database enforces `auth.users` foreign keys or signups are disabled, create User B:
   - **Dashboard**: **Authentication > Users > Add user > Create user** (e.g. `user_b@example.com`), then copy the generated UUID.
   - **SQL**:
     ```sql
     INSERT INTO auth.users (id, email) VALUES ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user_b@example.com') ON CONFLICT DO NOTHING;
     ```
   Paste the UUIDs into `supabase/rls-test.sql`. Running the script outputs a clean table of PASS/FAIL rows across all 4 tables (`items`, `tags`, `links`, `device_sync`) and rolls back without leaving test rows behind.
8. Run `npm run dev`.


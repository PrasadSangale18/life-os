# Life OS v2

Life OS is an organizable, multi-device personal operating system designed to manage tasks, notes, and a mind map across five core pillars: Physical, Mental, Relational, Spiritual, and Financial. It is built as a local-first application using React, Zustand, and Dexie (IndexedDB), with an optional Supabase backend for cross-device synchronization.

**IMPORTANT:** Data is stored locally per browser until sync is explicitly turned on and you are signed in.

## Features
- **Local-first Architecture**: Instant load times and full offline support.
- **Pillars & Quadrants**: Eisenhower matrix organization.
- **Inbox & Smart Organizer**: Capture everything instantly, then classify, split, or merge.
- **Mind Map**: Visualize your tasks and domains in both a tree view and a force-directed graph.
- **Notes**: Full markdown support with wiki-linking, tags, and backlinks.
- **Sync**: Optional real-time sync across devices using Supabase.

## Local Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```
   The app works perfectly in local-only mode.

## Supabase Setup (Optional, for Sync)

If you want to sync your data across devices:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor and run the contents of `supabase/schema.sql`.
3. Go to `Authentication > Providers` and ensure the "Email" provider is enabled (Magic Link).
4. Go to `Project Settings > API` and copy your Project URL and anon public key.
5. Create a `.env` file at the root of the project:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
   *(Never commit this file or use any secret admin key).*

## How to Deploy

The application is built to be deployed seamlessly to GitHub Pages.
1. Push the code to the `main` branch.
2. In your GitHub repository settings, go to **Pages** and set the source to **GitHub Actions**.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets.
4. The GitHub Action (`.github/workflows/deploy.yml`) will automatically build, test, and deploy the app to `/life-os/`.

## Backup and Restore

- **Export JSON**: Go to `Settings > Backup & Restore` and click **Export JSON**. This exports your entire local IndexedDB database, including all tasks, notes, tags, and snapshots.
- **Restore JSON**: Click **Restore from JSON**. A prompt will display the counts of the incoming data. Confirming will create an automatic local snapshot before wiping the device and restoring the incoming data.

## Known Limits
- Tags are not currently synced individually in the backend sync engine (they sync as part of the item document if stored there).
- Magic Link authentication relies on Supabase; if the token expires, you must request a new link.
- Large databases (thousands of items) might cause slight pagination delays during initial sync pulls.

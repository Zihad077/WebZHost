# WebZHost 2.0 (Vercel + Firestore)

One project on Vercel. No server, no .env, zero npm packages.

- Website: `index.html`, `app.js`, `config.js`
- API: `api/[...path].js` (Vercel function) + `lib/`
- Data: Firestore database `webzhost` (collection `wz_projects`)
- Settings: hardcoded in `lib/config.js`

## Setup (once)
1. Firebase console > Firestore > database `webzhost` > Rules: paste `firestore.rules` and Publish.
   This replaces old rules. The old `bots` collection is no longer used.
2. Firebase console > Authentication: Email/Password enabled; `webzhost.vercel.app` in Authorized domains.
3. Push this folder to GitHub. Vercel deploys it.

## Limits (Vercel + Firestore)
Upload 4 MB. File 700 KB. 200 files. 5 MB unpacked. Backup 700 KB zipped.
Projects cannot run: Vercel cannot keep programs alive. Start/stop/logs say "not connected".
`lib/runtime.js` can talk to your own execution server later (`runtimeUrl`, `runtimeSecret` in `lib/config.js`).

## Security
Browser calls the API with a Firebase sign-in token. The API checks it, then talks to Firestore with the same token, so the rules limit every user to their own projects. No secret keys are stored. Uploads are checked in memory and never run.
Old code had a hard-coded bot token and a client-side admin passcode. Both are gone. Rotate them anyway.

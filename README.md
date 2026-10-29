# WebZHost 2.0

Control panel for Python and Node.js projects (including Telegram bots). Zero npm dependencies. Node 18+.

## What it is
- **Frontend**: `index.html`, `app.js`, `config.js` (static, deploy on Vercel).
- **API server**: `server.js` + `lib/` (needs a persistent disk, so it does **not** run on Vercel functions).
- **Runtime adapter**: `lib/runtime.js`. The API never runs user code. Connect an execution server to start projects.

## Run locally (no accounts, no cost)
    npm start          # http://localhost:3000, dev sign-in (any name)
    npm test

## Deploy
1. Firebase console: enable Email/Password sign-in. Copy project id, web API key, auth domain, app id.
2. Run the API on a server with a disk. Copy `.env.example` to `.env`, fill it in, `NODE_ENV=production node server.js`. Put it behind HTTPS.
3. Set `ALLOWED_ORIGIN` to your Vercel URL. Edit `config.js`: `window.WEBZ_API = 'https://your-api'`.
4. Deploy this folder to Vercel (static). Add your API URL to `connect-src` in `vercel.json` if you want it stricter.

Production refuses `AUTH_MODE=dev`. Tokens are verified server side (Firebase RS256).

## Execution server contract (optional)
Set `RUNTIME_URL` and `RUNTIME_SECRET`. The API calls, with `Authorization: Bearer <secret>`:
`GET /v1/projects/:id/status` → `{state}`, `GET .../logs` → text, `POST .../start|stop|restart` with `{startCommand,type}`.
The runner must isolate code (container or VM, CPU/RAM limits, restricted network). Not included.

## Security notes
- Old code had a hard-coded Telegram token and a client-side admin passcode. Both are removed. **Rotate that bot token and passcode anyway**: they are in your git history.
- Old Firestore rules may still let clients read bot tokens. Lock them down or delete the `bots` collection.
- Uploads are validated in memory (traversal, symlinks, bombs, CRC). File paths are jailed. Rate limits are in memory per process.

## Limits
Backup/projects live on local disk: back up `DATA_DIR`. Single process only.

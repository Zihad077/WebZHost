# WebZHost 2.0

Control panel for Python and Node.js projects (including Telegram bots). Zero npm dependencies. Node 18+.

## What it is
- **Frontend**: `index.html`, `app.js`, `config.js` (static, deploy on Vercel).
- **API server**: `server.js` + `lib/` (needs a persistent disk, so it does **not** run on Vercel functions).
- **Runtime adapter**: `lib/runtime.js`. The API never runs user code. Connect an execution server to start projects.

## Settings
Everything is hardcoded. No .env. Edit `lib/config.js` (server) and `config.js` (website API address).

## Run locally
    # in lib/config.js set authMode: 'dev', then:
    npm start          # http://localhost:3000
    npm test

## Deploy
1. Firebase console: enable Email/Password sign-in.
2. Run the API on a server with a disk: `NODE_ENV=production node server.js`, behind HTTPS.
3. In `config.js` set `window.WEBZ_API` to that server's URL. Deploy the folder to Vercel (frontend).

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

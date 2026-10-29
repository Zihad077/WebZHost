# Feature status

**Implemented and tested (automated, 10 tests)**: ZIP validation and analyzer; project create from ZIP/template; ownership checks; file list/read/write/delete with path jail; backups, safe restore, corrupt-backup rejection; rule-based log analyzer; Firebase token verification; honest "no runtime" responses (501, status "unknown").

**Implemented, not tested**: web interface (no browser available here; only syntax-checked); Firebase login in the browser; remote runtime adapter; CORS.

**Requires infrastructure**: start/stop/restart, real logs, crash recovery, resource metrics, Analytics (execution server). Persistent API host (disk).

**Not implemented**: Monaco editor (plain textarea), Git import, file upload/rename in File Manager, notifications, bulk actions, analytics charts, redeploy/rollback, plans/payments/admin from old version, light-theme polish checks, responsive testing.

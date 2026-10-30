# Feature status

**Implemented and tested (automated, 10 tests, fake Firestore)**: ZIP validation and analyzer; create from ZIP/template; ownership checks; file list/read/save/delete with path checks; backups; atomic restore; corrupt-backup rejection; project delete cleans everything; log analyzer; Firebase token check; honest "not connected" for start/stop.

**Implemented, NOT tested**: calls to real Firestore (only a fake was used); Firestore rules; the web interface in a browser; Firebase login in the browser.

**Needs extra infrastructure**: start/stop/restart, real logs, crash recovery, resource charts.

**Not built**: Monaco editor, Git import, file upload/rename, notifications, analytics charts, redeploy/rollback, plans/payments/admin from the old site.

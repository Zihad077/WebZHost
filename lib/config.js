'use strict';
// All settings are hardcoded here. No .env needed. Nothing in this file is secret.
const SETTINGS = {
  authMode: 'firebase',                      // 'firebase' (real). 'dev' is for tests only.
  allowedOrigin: '',                         // empty = same site (recommended)
  maxUploadMB: 4,                            // Vercel functions accept about 4.5 MB
  databaseId: 'webzhost',                    // your Firestore database name
  firestoreBase: 'https://firestore.googleapis.com/v1',
  firebase: {                                // public web config (safe in the browser)
    apiKey: 'AIzaSyCJEMrW8FADRRmKD1WSEOsE9lVoOWoxYtU',
    authDomain: 'bothostz.firebaseapp.com',
    projectId: 'bothostz',
    appId: '1:506392978902:web:7e962842404f5e91d07077',
  },
  runtimeUrl: '',                            // execution server URL (leave empty: none)
  runtimeSecret: '',
};
function loadConfig(over = {}) {
  const S = { ...SETTINGS, ...over };
  if (process.env.NODE_ENV === 'production' && S.authMode === 'dev') throw new Error('authMode "dev" is not allowed in production.');
  return {
    authMode: S.authMode, allowedOrigin: S.allowedOrigin, maxUploadBytes: S.maxUploadMB * 2 ** 20,
    projectId: S.firebase.projectId, firebaseProjectId: S.firebase.projectId, databaseId: S.databaseId, firestoreBase: S.firestoreBase,
    publicFirebase: S.authMode === 'firebase' ? S.firebase : null, runtimeUrl: S.runtimeUrl, runtimeSecret: S.runtimeSecret,
  };
}
module.exports = { loadConfig };

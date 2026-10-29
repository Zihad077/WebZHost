'use strict';
// All settings are hardcoded here. Edit this file. No .env needed.
const SETTINGS = {
  port: 3000,
  dataDir: './data',                         // folder on a persistent disk
  authMode: 'firebase',                      // 'firebase' (real) or 'dev' (local testing only)
  allowedOrigin: 'https://webzhost.vercel.app', // where the website is hosted
  maxUploadMB: 25,
  firebase: {                                // public web config (safe in the browser)
    apiKey: 'AIzaSyCJEMrW8FADRRmKD1WSEOsE9lVoOWoxYtU',
    authDomain: 'bothostz.firebaseapp.com',
    projectId: 'bothostz',
    appId: '1:506392978902:web:7e962842404f5e91d07077',
  },
  runtimeUrl: '',                            // execution server URL (leave empty if none)
  runtimeSecret: '',                         // execution server secret
};
// `over` is only used by tests to change a setting.
function loadConfig(over = {}) {
  const S = { ...SETTINGS, ...over }, prod = process.env.NODE_ENV === 'production';
  if (prod && S.authMode === 'dev') throw new Error('authMode "dev" is not allowed in production.');
  return {
    port: S.port, dataDir: S.dataDir, authMode: S.authMode, allowedOrigin: S.allowedOrigin,
    firebaseProjectId: S.firebase.projectId, maxUploadBytes: S.maxUploadMB * 2 ** 20,
    publicFirebase: S.authMode === 'firebase' ? S.firebase : null,
    runtimeUrl: S.runtimeUrl, runtimeSecret: S.runtimeSecret,
  };
}
module.exports = { loadConfig };

'use strict';
function loadConfig(env = process.env) {
  const prod = env.NODE_ENV === 'production';
  const authMode = env.AUTH_MODE || (prod ? 'firebase' : 'dev');
  if (prod && authMode === 'dev') throw new Error('AUTH_MODE=dev is not allowed when NODE_ENV=production.');
  if (authMode === 'firebase' && !env.FIREBASE_PROJECT_ID) throw new Error('FIREBASE_PROJECT_ID is required for firebase auth.');
  return {
    port: Number(env.PORT) || 3000, dataDir: env.DATA_DIR || './.data', authMode,
    firebaseProjectId: env.FIREBASE_PROJECT_ID || '', allowedOrigin: env.ALLOWED_ORIGIN || '',
    maxUploadBytes: (Number(env.MAX_UPLOAD_MB) || 25) * 2 ** 20,
    publicFirebase: authMode === 'firebase' ? { apiKey: env.FIREBASE_API_KEY || '', authDomain: env.FIREBASE_AUTH_DOMAIN || '', projectId: env.FIREBASE_PROJECT_ID, appId: env.FIREBASE_APP_ID || '' } : null,
    runtimeUrl: env.RUNTIME_URL || '', runtimeSecret: env.RUNTIME_SECRET || '',
  };
}
module.exports = { loadConfig };

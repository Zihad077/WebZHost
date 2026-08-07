/* =========================================================================
   BotHost — Telegram Bot Hosting Platform · Frontend Application
   Firebase Edition — with bKash + Nagad, enhanced admin panel
   ========================================================================= */

'use strict';

/* ======================================================================
   0. FIREBASE CONFIGURATION
   ====================================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyCJEMrW8FADRRmKD1WSEOsE9lVoOWoxYtU",
  authDomain: "bothostz.firebaseapp.com",
  projectId: "bothostz",
  storageBucket: "bothostz.firebasestorage.app",
  messagingSenderId: "506392978902",
  appId: "1:506392978902:web:7e962842404f5e91d07077"
};

let firebaseApp, auth, db;
let integrationMode = 'local';

function initFirebase() {
  try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    db.enablePersistence().catch(() => {});
    integrationMode = 'firebase';
    console.log('🔥 Firebase connected');
  } catch (e) {
    console.warn('⚠️ Firebase init failed, using local mode', e);
    integrationMode = 'local';
  }
}

const isFirebase = () => integrationMode === 'firebase';

/* ======================================================================
   0b. SITE CONFIG
   ====================================================================== */
const CONFIG = {
  admin: {
    email: 'admin@bothost.dev',
    password: 'admin123',
    adminCode: '#Zihad077'
  },
  links: {
    telegram: 'https://t.me/devtutodz',
    youtube: 'https://youtube.com/@dev_-_zihad?si=1x7vlYghJFSJVuRx'
  },
  plans: {
    free:    { name: 'Free',    price: 0,   maxBots: 3,    storage: 100 * 1024 * 1024,       speed: 'Standard', bKash: '', nagad: '' },
    basic:   { name: 'Basic',   price: 299, maxBots: 10,   storage: 512 * 1024 * 1024,       speed: 'Fast',     bKash: '01756318997', nagad: '01824982253' },
    pro:     { name: 'Pro',     price: 499, maxBots: 30,   storage: 2 * 1024 * 1024 * 1024,  speed: 'Turbo',    bKash: '01756318997', nagad: '01824982253' },
    premium: { name: 'Premium', price: 999, maxBots: 9999, storage: 10 * 1024 * 1024 * 1024, speed: 'Ultra',    bKash: '01756318997', nagad: '01824982253' },
  },
  adminApiUrl: '',
};

const planKey = () => (state?.user?.plan) || 'free';
const currentPlan = () => CONFIG.plans[planKey()] || CONFIG.plans.free;
const isAdminUser = () => !!(state?.user && state.user.email === CONFIG.admin.email);

/* ======================================================================
   1. ICONS (সম্পূর্ণ)
   ====================================================================== */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="9" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="5" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="12" width="7" height="9" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="16" width="7" height="5" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>',
  bot: '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/><path d="M9 15h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none"><path d="M21 12a8 8 0 01-8 8H4l2-3a8 8 0 1115-5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  storage: '<svg viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" stroke-width="1.8"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" stroke="currentColor" stroke-width="1.8"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" stroke="currentColor" stroke-width="1.8"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5h6v2m-8 0l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" stroke-width="1.8"/></svg>',
  power: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6.3 6.3a8 8 0 1011.4 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  clone: '<svg viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" stroke-width="1.8"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M7 9l3 3-3 3M13 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1L14.5 3h-5l-.3 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1L9.5 21h5l.3-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5c.07-.33.1-.66.1-1z" stroke="currentColor" stroke-width="1.6"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="15" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M11 12l8-8M16 7l2 2M18 5l2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 4.9A10.9 10.9 0 0112 4c6.5 0 10 8 10 8a18 18 0 01-2.2 3.4M6.6 6.6A18 18 0 002 12s3.5 8 10 8a10.7 10.7 0 004-1.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" stroke="currentColor" stroke-width="1.8"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12M7 10l5 5 5-5M4 21h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cpu: '<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" stroke="currentColor" stroke-width="1.6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13 5l-2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 12a8 8 0 11-2.3-5.7M20 3v5h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21a2 2 0 004 0" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5zM12 12l9-5M12 12v10" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  db: '<svg viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" stroke-width="1.8"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" stroke="currentColor" stroke-width="1.8"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2s-4 4-4 10c0 3.2 1.5 6 4 7.5 2.5-1.5 4-4.3 4-7.5 0-6-4-10-4-10z" stroke="currentColor" stroke-width="1.8"/><path d="M12 12a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.8"/></svg>'
};

/* ======================================================================
   2. UTILITIES
   ====================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const esc = (str = '') => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const uid = () => 'bot_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

const formatNumber = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
};

const formatBytes = (b) => {
  if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB';
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB';
  if (b >= 1e3) return (b / 1e3).toFixed(0) + ' KB';
  return b + ' B';
};

const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    return true;
  } catch (e) {
    return false;
  }
};

const initials = (name = '') => (name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || 'B').toUpperCase();

const avatarColor = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const colors = [
    'linear-gradient(135deg,#38bdf8,#0ea5e9)',
    'linear-gradient(135deg,#a78bfa,#8b5cf6)',
    'linear-gradient(135deg,#34d399,#10b981)',
    'linear-gradient(135deg,#fbbf24,#f59e0b)',
    'linear-gradient(135deg,#f87171,#ef4444)',
    'linear-gradient(135deg,#60a5fa,#3b82f6)',
  ];
  return colors[h % colors.length];
};

/* ======================================================================
   3. DATABASE LAYER — Firebase / local adapter
   ====================================================================== */
const KEYS = { bots: 'bh_bots', user: 'bh_user', settings: 'bh_settings', activity: 'bh_activity', logs: 'bh_logs', orders: 'bh_orders', users: 'bh_users' };

const localRead = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } };
const localWrite = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const DB = {
  // --- Users ---
  async getCurrentUser() {
    if (isFirebase()) {
      const user = auth.currentUser;
      if (!user) return null;
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) return { id: user.uid, ...doc.data() };
      return { id: user.uid, email: user.email, name: user.displayName || 'User', plan: 'free', role: 'user', createdAt: new Date().toISOString() };
    }
    return localRead(KEYS.user, null);
  },
  async upsertUser(data) {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      await db.collection('users').doc(uid).set(data, { merge: true });
      return data;
    }
    const existing = localRead(KEYS.users, []);
    const idx = existing.findIndex(u => u.email === data.email);
    if (idx > -1) existing[idx] = { ...existing[idx], ...data };
    else existing.push(data);
    localWrite(KEYS.users, existing);
    localWrite(KEYS.user, data);
    return data;
  },
  async selectUsers() {
    if (isFirebase()) {
      const snapshot = await db.collection('users').get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localRead(KEYS.users, []);
  },
  async updateUser(uid, data) {
    if (isFirebase()) {
      await db.collection('users').doc(uid).update(data);
      return data;
    }
    const users = localRead(KEYS.users, []);
    const idx = users.findIndex(u => u.id === uid);
    if (idx > -1) { users[idx] = { ...users[idx], ...data }; localWrite(KEYS.users, users); }
    return data;
  },

  // --- Bots ---
  async selectBots() {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];
      const snapshot = await db.collection('bots').where('userId', '==', uid).get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localRead(KEYS.bots, []);
  },
  async selectAllBots() {
    if (isFirebase()) {
      const snapshot = await db.collection('bots').get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localRead(KEYS.bots, []);
  },
  async insertBot(bot) {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      const ref = db.collection('bots').doc(bot.id);
      await ref.set({ ...bot, userId: uid, createdAt: new Date().toISOString() });
      return bot;
    }
    const bots = await this.selectBots();
    bots.push(bot);
    localWrite(KEYS.bots, bots);
    return bot;
  },
  async updateBot(id, patch) {
    if (isFirebase()) {
      await db.collection('bots').doc(id).update(patch);
      return patch;
    }
    const bots = localRead(KEYS.bots, []);
    const idx = bots.findIndex(b => b.id === id);
    if (idx > -1) { bots[idx] = { ...bots[idx], ...patch }; localWrite(KEYS.bots, bots); }
    return patch;
  },
  async deleteBot(id) {
    if (isFirebase()) {
      await db.collection('bots').doc(id).delete();
      return;
    }
    let bots = localRead(KEYS.bots, []);
    bots = bots.filter(b => b.id !== id);
    localWrite(KEYS.bots, bots);
  },
  async getBot(id) {
    if (isFirebase()) {
      const doc = await db.collection('bots').doc(id).get();
      if (doc.exists) return { id: doc.id, ...doc.data() };
      return null;
    }
    return localRead(KEYS.bots, []).find(b => b.id === id);
  },

  // --- Activity ---
  async selectActivity() {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];
      const snapshot = await db.collection('activity').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(30).get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localRead(KEYS.activity, []);
  },
  async addActivity(entry) {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const ref = db.collection('activity').doc();
      await ref.set({ ...entry, userId: uid, createdAt: new Date().toISOString() });
      return;
    }
    const list = localRead(KEYS.activity, []);
    list.unshift({ ...entry, id: uid(), createdAt: new Date().toISOString() });
    localWrite(KEYS.activity, list.slice(0, 30));
  },

  // --- Logs ---
  async selectLogs() {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];
      const snapshot = await db.collection('logs').where('userId', '==', uid).orderBy('time', 'desc').limit(400).get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localRead(KEYS.logs, []);
  },
  async addLogs(newLogs) {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const batch = db.batch();
      newLogs.forEach(log => {
        const ref = db.collection('logs').doc();
        batch.set(ref, { ...log, userId: uid });
      });
      await batch.commit();
      return;
    }
    const list = localRead(KEYS.logs, []);
    list.push(...newLogs);
    localWrite(KEYS.logs, list.slice(-400));
  },

  // --- Settings ---
  async getSettings() {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) return { notifications: true, autoDeploy: true };
      const doc = await db.collection('settings').doc(uid).get();
      if (doc.exists) return doc.data();
      return { notifications: true, autoDeploy: true };
    }
    return localRead(KEYS.settings, { notifications: true, autoDeploy: true });
  },
  async setSettings(s) {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await db.collection('settings').doc(uid).set(s, { merge: true });
      return;
    }
    localWrite(KEYS.settings, s);
  },

  // --- Orders ---
  async selectOrders() {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];
      const snapshot = await db.collection('orders').where('userId', '==', uid).orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localRead(KEYS.orders, []);
  },
  async selectAllOrders() {
    if (isFirebase()) {
      const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localRead(KEYS.orders, []);
  },
  async insertOrder(order) {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      await db.collection('orders').doc(order.id).set({ ...order, userId: uid });
      return order;
    }
    const list = localRead(KEYS.orders, []);
    list.unshift(order);
    localWrite(KEYS.orders, list);
    return order;
  },
  async updateOrder(id, patch) {
    if (isFirebase()) {
      await db.collection('orders').doc(id).update(patch);
      return patch;
    }
    const list = localRead(KEYS.orders, []);
    const idx = list.findIndex(o => o.id === id);
    if (idx > -1) { list[idx] = { ...list[idx], ...patch }; localWrite(KEYS.orders, list); }
    return patch;
  },

  // --- Site Config ---
  async getSiteConfig() {
    if (isFirebase()) {
      const doc = await db.collection('siteConfig').doc('config').get();
      if (doc.exists) return doc.data();
      return { siteName: 'BotHost', maintenanceMode: false, registrationEnabled: true, defaultPlan: 'free' };
    }
    return localRead('bh_siteConfig', { siteName: 'BotHost', maintenanceMode: false, registrationEnabled: true, defaultPlan: 'free' });
  },
  async setSiteConfig(config) {
    if (isFirebase()) {
      await db.collection('siteConfig').doc('config').set(config, { merge: true });
      return;
    }
    localWrite('bh_siteConfig', config);
  },

  // --- Audit Logs ---
  async addAuditLog(action, targetType, targetId, details = {}) {
    if (isFirebase()) {
      const uid = auth.currentUser?.uid;
      await db.collection('auditLogs').add({
        adminId: uid,
        action,
        targetType,
        targetId,
        details,
        ipAddress: 'client-side',
        createdAt: new Date().toISOString()
      });
    }
  },
  async selectAuditLogs() {
    if (isFirebase()) {
      const snapshot = await db.collection('auditLogs').orderBy('createdAt', 'desc').limit(200).get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localRead('bh_auditLogs', []);
  }
};

/* ======================================================================
   3b. AUTH LAYER
   ====================================================================== */
const Auth = {
  async current() {
    if (isFirebase()) {
      const user = auth.currentUser;
      if (!user) return null;
      const doc = await db.collection('users').doc(user.uid).get();
      const data = doc.exists ? doc.data() : {};
      return {
        id: user.uid,
        name: data.name || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        plan: data.plan || 'free',
        role: data.role || 'user',
        createdAt: data.createdAt || user.metadata?.creationTime || new Date().toISOString()
      };
    }
    return localRead(KEYS.user, null);
  },

  async signUp(email, password, name) {
    if (isFirebase()) {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const user = cred.user;
      const profile = {
        id: user.uid,
        email,
        name: name || email.split('@')[0],
        plan: 'free',
        role: 'user',
        createdAt: new Date().toISOString()
      };
      await DB.upsertUser(profile);
      return { id: user.uid, ...profile };
    }
    const existing = localRead(KEYS.users, []).find(x => x.email === email);
    const u = {
      id: existing?.id || 'user_' + Date.now(),
      name,
      email,
      plan: existing?.plan || 'free',
      role: 'user',
      createdAt: existing?.createdAt || new Date().toISOString()
    };
    localWrite(KEYS.user, u);
    const users = localRead(KEYS.users, []);
    const idx = users.findIndex(x => x.email === email);
    if (idx > -1) users[idx] = u;
    else users.push(u);
    localWrite(KEYS.users, users);
    return u;
  },

  async signIn(email, password) {
    if (isFirebase()) {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      const user = cred.user;
      const doc = await db.collection('users').doc(user.uid).get();
      const data = doc.exists ? doc.data() : {};
      return {
        id: user.uid,
        name: data.name || user.displayName || email.split('@')[0],
        email: user.email,
        plan: data.plan || 'free',
        role: data.role || 'user',
        createdAt: data.createdAt || user.metadata?.creationTime || new Date().toISOString()
      };
    }
    const users = localRead(KEYS.users, []);
    const existing = users.find(x => x.email === email);
    const u = {
      id: existing?.id || 'user_' + Date.now(),
      name: existing?.name || email.split('@')[0],
      email,
      plan: existing?.plan || 'free',
      role: 'user',
      createdAt: existing?.createdAt || new Date().toISOString()
    };
    localWrite(KEYS.user, u);
    return u;
  },

  async signOut() {
    if (isFirebase()) {
      await auth.signOut();
    }
    localWrite(KEYS.user, null);
  },

  async updateProfile(name) {
    if (isFirebase()) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await user.updateProfile({ displayName: name });
      await DB.upsertUser({ name });
      return { name };
    }
    const u = localRead(KEYS.user, null);
    if (u) { u.name = name; localWrite(KEYS.user, u); }
    return { name };
  },

  async setPlan(email, planKey) {
    if (isFirebase()) {
      const users = await DB.selectUsers();
      const target = users.find(u => u.email === email);
      if (target) {
        await DB.updateUser(target.id, { plan: planKey });
        if (state.user && state.user.email === email) state.user.plan = planKey;
      }
      return;
    }
    const users = localRead(KEYS.users, []);
    const idx = users.findIndex(x => x.email === email);
    if (idx > -1) { users[idx].plan = planKey; localWrite(KEYS.users, users); }
    if (state.user && state.user.email === email) { state.user.plan = planKey; localWrite(KEYS.user, state.user); }
  },

  async setRole(email, role) {
    if (isFirebase()) {
      const users = await DB.selectUsers();
      const target = users.find(u => u.email === email);
      if (target) {
        await DB.updateUser(target.id, { role });
      }
      return;
    }
    const users = localRead(KEYS.users, []);
    const idx = users.findIndex(x => x.email === email);
    if (idx > -1) { users[idx].role = role; localWrite(KEYS.users, users); }
  }
};

/* ======================================================================
   4. GLOBAL STATE
   ====================================================================== */
const state = {
  user: null,
  bots: [],
  activity: [],
  logs: [],
  settings: { notifications: true, autoDeploy: true },
  currentRoute: 'home',
  currentBotId: null,
  detailTab: 'overview',
  logFilterBot: 'all',
  botSearch: '',
  chartCache: null,
  adminMode: false,
  siteConfig: { siteName: 'BotHost', maintenanceMode: false, registrationEnabled: true }
};

/* ======================================================================
   5. UI PRIMITIVES
   ====================================================================== */
function toast(title, msg = '', type = 'success', duration = 3800) {
  const icons = { success: ICONS.check, error: ICONS.x, info: ICONS.bell, warning: ICONS.clock };
  const stack = $('#toastStack');
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.innerHTML = `
    <div class="toast__icon">${icons[type] || ICONS.check}</div>
    <div class="toast__body"><div class="toast__title">${esc(title)}</div>
    ${msg ? `<div class="toast__msg">${esc(msg)}</div>` : ''}</div>`;
  stack.appendChild(t);
  setTimeout(() => { t.classList.add('leaving'); setTimeout(() => t.remove(), 300); }, duration);
}

let modalOpened = false;
function openModal(title, bodyHTML, { size = '', footerHTML = '', onOpen } = {}) {
  const root = $('#modalRoot'), box = $('#modalBox');
  box.className = `modal ${size}`;
  box.innerHTML = `
    <div class="modal__head">
      <h2>${esc(title)}</h2>
      <button class="modal__close" data-close-modal aria-label="Close">${ICONS.x}</button>
    </div>
    <div class="modal__body">${bodyHTML}</div>
    ${footerHTML ? `<div class="modal__footer">${footerHTML}</div>` : ''}`;
  root.hidden = false;
  modalOpened = true;
  if (onOpen) onOpen(box);
  requestAnimationFrame(() => { const a = box.querySelector('input, select, textarea'); if (a) a.focus(); });
}

function closeModal() {
  if (!modalOpened) return;
  $('#modalRoot').hidden = true; $('#modalBox').innerHTML = ''; modalOpened = false;
}

let loaderCount = 0;
function showLoading(on = true) {
  const o = $('#loadingOverlay');
  loaderCount += on ? 1 : -1;
  o.hidden = loaderCount <= 0;
}

const simulate = (ms = 600) => new Promise(r => setTimeout(r, ms));

/* ======================================================================
   6. ROUTER
   ====================================================================== */
const publicRoutes = ['home', 'login', 'register', 'docs'];

async function navigate(route, opts = {}) {
  if (state.adminMode) return;
  if (route === 'admin') { openAdminGate(); return; }

  if (!publicRoutes.includes(route) && !state.user) {
    showLoading(true);
    simulate(300).then(() => {
      showLoading(false);
      toast('Please log in', 'You need an account to access that page.', 'info');
      history.replaceState(null, '', '#login');
      renderPublic('login');
    });
    return;
  }

  state.currentRoute = route;
  if (opts.scrollTop !== false) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  if (publicRoutes.includes(route)) {
    renderPublic(route);
  } else {
    if (!state.user) return navigate('login');
    if (route === 'bot-details' && state.currentBotId) route = 'bot-details';
    try { await renderApp(route); } catch (e) { console.error('render error', e); }
  }

  if (!publicRoutes.includes(route)) updateBreadcrumb(route);
}

function renderPublic(route) {
  const appShell = $('#appShell'), publicLayout = $('#publicLayout');
  appShell.hidden = true;
  publicLayout.hidden = false;
  $('#publicMobileMenu').classList.remove('open');

  const map = { home: pageHome, login: pageLogin, register: pageRegister, docs: pageDocs };
  const render = map[route] || pageHome;
  $('#publicContent').innerHTML = render();
  $('#publicContent').querySelector('.page')?.classList.add('page');

  $$('#publicMobileMenu a, .public-nav__links a').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === route));
  window.scrollTo(0, 0);
  bindPageEvents(route);
}

async function renderApp(route) {
  const appShell = $('#appShell'), publicLayout = $('#publicLayout');
  publicLayout.hidden = true;
  appShell.hidden = false;
  $('#sidebar').classList.remove('open');
  $('#sidebarOverlay').classList.remove('open');

  const map = {
    dashboard: pageDashboard, 'my-bots': pageMyBots, 'create-bot': pageCreateBot,
    analytics: pageAnalytics, logs: pageLogs, settings: pageSettings,
    'bot-details': pageBotDetails,
  };
  const render = map[route] || pageDashboard;
  const html = await render();
  $('#content').innerHTML = `<div class="page">${html}</div>`;

  $$('#sidebarNav .nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.nav === route || (route === 'bot-details' && n.dataset.nav === 'my-bots')));

  window.scrollTo(0, 0);
  bindPageEvents(route);
}

function updateBreadcrumb(route) {
  const labels = {
    dashboard: 'Dashboard', 'my-bots': 'My Bots', 'create-bot': 'Create Bot',
    analytics: 'Analytics', logs: 'Logs', settings: 'Settings', 'bot-details': 'Bot Details',
    admin: 'Admin Panel',
  };
  $('#breadcrumb').innerHTML = `<span>BotHost</span><span>/</span><span>${labels[route] || ''}</span>`;
}

function handleHash() {
  const raw = (location.hash || '#home').replace('#', '');
  const [seg, param] = raw.split('/');
  if (seg === 'bot-details') { state.currentBotId = param || null; navigate('bot-details'); return; }
  navigate(seg || 'home');
}

/* ======================================================================
   7. EVENT BINDING
   ====================================================================== */
function bindGlobalEvents() {
  $('#sidebarToggle').addEventListener('click', () => {
    $('#sidebar').classList.toggle('open');
    $('#sidebarOverlay').classList.toggle('open');
  });
  $('#sidebarOverlay').addEventListener('click', () => {
    $('#sidebar').classList.remove('open'); $('#sidebarOverlay').classList.remove('open');
  });

  $('#publicMenuBtn').addEventListener('click', () =>
    $('#publicMobileMenu').classList.toggle('open'));

  $$('[data-link]').forEach(a => {
    const url = CONFIG.links[a.dataset.link];
    if (url) a.href = url;
  });

  $('#notifTrigger')?.addEventListener('click', () => {
    const recent = state.activity[0];
    if (recent) toast('Notifications', recent.title, 'info');
    else toast('Notifications', 'You are all caught up.', 'info');
  });

  $('#searchTrigger')?.addEventListener('click', () => {
    navigate('my-bots', { scrollTop: false });
    setTimeout(() => $('#botSearchInput')?.focus(), 60);
  });

  $('#logoutBtn').addEventListener('click', async () => {
    await Auth.signOut();
    state.user = null;
    state.bots = []; state.activity = []; state.logs = [];
    updateUserUI();
    updateNavCount();
    toast('Logged out', 'See you soon!', 'info');
    navigate('home');
  });

  $('#modalRoot').addEventListener('click', (e) => {
    if (e.target.closest('[data-close-modal]')) closeModal();
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav]');
    if (link) {
      e.preventDefault();
      const r = link.dataset.nav;
      $('#publicMobileMenu')?.classList.remove('open');
      if (r === 'home' && state.user) { navigate('dashboard'); return; }
      navigate(r);
    }
  });

  document.addEventListener('click', (e) => {
    if ($('#content')?.contains(e.target) || e.target.closest('[data-action]')) {
      onBotAction(e);
    }
    if ($('#publicContent')?.contains(e.target) && e.target.closest('[data-cta]')) {
      onPublicAction(e);
    }
  });

  window.addEventListener('hashchange', handleHash);

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      if (state.adminMode) return;
      openAdminGate();
    }
  });
}

function bindPageEvents(route) {
  $$('[data-pw-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const input = document.querySelector(`#${btn.dataset.pwToggle}`);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = show ? ICONS.eyeOff : ICONS.eye;
  }));

  const form = $('#authForm');
  if (form) form.addEventListener('submit', onAuthSubmit);

  const createForm = $('#createBotForm');
  if (createForm) createForm.addEventListener('submit', onCreateBot);

  const editForm = $('#editBotForm');
  if (editForm) editForm.addEventListener('submit', onEditBot);

  const settingsForm = $('#settingsForm');
  if (settingsForm) settingsForm.addEventListener('submit', onSettingsSubmit);

  const searchInput = $('#botSearchInput');
  if (searchInput) searchInput.addEventListener('input', (e) => {
    state.botSearch = e.target.value.toLowerCase();
    renderBotList($('#botsTableWrap'));
  });

  const logFilter = $('#logFilter');
  if (logFilter) logFilter.addEventListener('change', (e) => {
    state.logFilterBot = e.target.value;
    renderLogs($('#logConsole'));
  });

  const logLevel = $('#logLevel');
  if (logLevel) logLevel.addEventListener('change', () => renderLogs($('#logConsole')));

  const refreshLogs = $('#refreshLogs');
  if (refreshLogs) refreshLogs.addEventListener('click', () => {
    toast('Refreshing', 'Fetching latest log stream…', 'info');
    renderLogs($('#logConsole'));
  });

  const copyWebhookBtn = $('#copyWebhookBtn');
  if (copyWebhookBtn) copyWebhookBtn.addEventListener('click', async () => {
    const url = copyWebhookBtn.dataset.url;
    await copyToClipboard(url); toast('Copied', url, 'success');
  });

  $$('#detailTabs .tab').forEach(t => t.addEventListener('click', () => {
    state.detailTab = t.dataset.tab;
    $$('#detailTabs .tab').forEach(x => x.classList.toggle('active', x === t));
    const area = $('#detailArea');
    if (area) area.innerHTML = renderDetailTab(state.currentBotId, state.detailTab);
    if (state.detailTab === 'requests') drawRequestsChart(state.currentBotId);
    if (state.detailTab === 'env') bindEnvActions();
    if (state.detailTab === 'code') wireDetailCode();
  }));

  wireDetailCode();

  $$('#docsNav a').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    $$('#docsNav a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  $$('.faq-item__q').forEach(q => q.addEventListener('click', () => {
    q.closest('.faq-item').classList.toggle('open');
  }));

  const pwConfirm = $('#pwConfirm');
  if (pwConfirm) pwConfirm.addEventListener('input', validatePasswordMatch);

  $$('#adminTabs .tab').forEach(t => t.addEventListener('click', async () => {
    $$('#adminTabs .tab').forEach(x => x.classList.toggle('active', x === t));
    const orders = await loadOrders();
    const area = $('#adminArea');
    if (area) area.innerHTML = await renderAdminTab(t.dataset.atab, orders);
  }));
  $('#refreshAdmin')?.addEventListener('click', async () => {
    toast('Refreshing', 'Reloading admin data…', 'info');
    await renderAdmin();
  });

  renderBotList($('#botsTableWrap'));
  renderLogs($('#logConsole'));
}

/* ======================================================================
   8. AUTH
   ====================================================================== */
async function onAuthSubmit(e) {
  e.preventDefault();
  const isLogin = this.dataset.mode === 'login';
  const btn = this.querySelector('button[type="submit"]');
  const btnText = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px"></span>';

  const name = $('#name')?.value.trim();
  const email = $('#email').value.trim();
  const pass = $('#password').value;

  if (!isLogin && !validatePasswordMatch()) {
    btn.disabled = false; btn.innerHTML = btnText;
    toast('Passwords do not match', 'Please re-check your password.', 'error');
    return;
  }
  if (pass.length < 6) {
    btn.disabled = false; btn.innerHTML = btnText;
    toast('Password too short', 'Use at least 6 characters.', 'error');
    return;
  }

  try {
    const result = isLogin
      ? await Auth.signIn(email, pass)
      : await Auth.signUp(email, pass, name || 'Developer');

    state.user = result;
    await DB.addActivity({ icon: 'shield', title: `Signed in as ${result.name}`, description: 'Account access granted', color: 'success' });

    state.bots = await DB.selectBots();
    state.activity = await DB.selectActivity();
    state.logs = await DB.selectLogs();
    state.settings = await DB.getSettings();
    state.siteConfig = await DB.getSiteConfig();

    btn.disabled = false; btn.innerHTML = btnText;
    toast(isLogin ? `Welcome back, ${result.name}!` : 'Account created 🎉', 'You are now logged in.', 'success');
    updateUserUI();
    updateNavCount();
    renderConnectionStatus();
    navigate('dashboard');
  } catch (err) {
    btn.disabled = false; btn.innerHTML = btnText;
    toast('Authentication failed', err?.message || 'Please check your credentials.', 'error');
  }
}

function validatePasswordMatch() {
  const a = $('#password')?.value, b = $('#pwConfirm')?.value;
  const hint = $('#pwHint');
  if (!hint) return true;
  if (a && b && a !== b) { hint.textContent = 'Passwords do not match'; hint.style.color = 'var(--danger)'; return false; }
  hint.textContent = ''; return true;
}

/* ======================================================================
   9. BOT CRUD + ACTIONS
   ====================================================================== */
function makeWebhook(botId) {
  return `https://webzhost.vercel.app/api/webhook/${botId}`;
}

const RUNTIMES = [
  { id: 'nodejs', label: 'Node.js', file: 'handler.js' },
  { id: 'python', label: 'Python', file: 'handler.py' },
];

const CODE_TEMPLATES = {
  nodejs: `// BotHandler (Node.js)
// 'update' is the Telegram update Telegram posts to your webhook.
export async function handle(update) {
  const msg = update.message;
  if (!msg || !msg.text) return null;
  const text = msg.text.trim();

  if (text === '/start') {
    return { chat_id: msg.chat.id, text: 'Hello! I\\'m running on BotHost 👋' };
  }

  return { chat_id: msg.chat.id, text: 'Echo: ' + text };
}`,
  python: `# BotHandler (Python)
# 'update' is the Telegram update Telegram posts to your webhook.

def handle(update):
    msg = update.get('message')
    if not msg or 'text' not in msg:
        return None

    text = msg['text'].strip()

    if text == '/start':
        return {'chat_id': msg['chat']['id'], 'text': 'Hello! I\\'m running on BotHost 👋'}
    return {'chat_id': msg['chat']['id'], 'text': 'Echo: ' + text}
`,
};

function createBotObject(data) {
  const id = uid();
  return {
    id,
    ownerEmail: state.user ? state.user.email : '',
    name: data.name,
    token: data.token,
    username: data.username || `@${data.name.toLowerCase().replace(/\s+/g, '_')}`,
    language: data.language,
    code: data.code || (CODE_TEMPLATES[data.language] || ''),
    env: data.env || {},
    webhook: makeWebhook(id),
    status: data.status || 'active',
    createdAt: new Date().toISOString(),
    stats: { requests: 0, messages: 0, storage: 0 },
  };
}

async function onCreateBot(e) {
  e.preventDefault();
  const btn = e.submitter || this.querySelector('button[type="submit"]');
  const bt = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px"></span>';

  const env = {};
  $$('#envRows .env-row').forEach(row => {
    const k = row.querySelector('.env-key')?.value.trim();
    const v = row.querySelector('.env-val')?.value.trim();
    if (k) env[k] = v || '';
  });

  const data = {
    name: $('#botName').value.trim(),
    token: $('#botToken').value.trim(),
    language: $('#botLang').value,
    code: $('#botCode')?.value ?? '',
    env,
    status: $('#botActive').checked ? 'active' : 'disabled',
  };

  if (!data.name || !data.token) {
    btn.disabled = false; btn.innerHTML = bt;
    toast('Missing fields', 'Bot name and token are required.', 'error');
    return;
  }

  const limit = currentPlan().maxBots;
  const myBots = state.bots.filter(b => !b.ownerEmail || b.ownerEmail === state.user.email).length;
  if (myBots >= limit) {
    btn.disabled = false; btn.innerHTML = bt;
    openUpgradePrompt();
    return;
  }

  await simulate(1100);
  const bot = createBotObject(data);
  await DB.insertBot(bot);
  state.bots = await DB.selectBots();
  await DB.addActivity({ icon: 'plus', title: `Created bot "${bot.name}"`, description: `Webhook ${bot.webhook}`, color: 'primary' });
  await DB.addLogs([{ time: Date.now(), level: 'success', botId: bot.id, message: `Bot "${bot.name}" created. Webhook registered → ${bot.webhook}` }]);

  btn.disabled = false; btn.innerHTML = bt;
  updateNavCount();
  toast('Bot deployed 🚀', `"${bot.name}" is live at ${bot.webhook}`, 'success');
  state.currentBotId = bot.id;
  navigate('bot-details', { scrollTop: false });
}

async function onEditBot(e) {
  e.preventDefault();
  const btn = e.submitter || this.querySelector('button[type="submit"]');
  const bt = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px"></span>';

  const env = {};
  $$('#envRows .env-row').forEach(row => {
    const k = row.querySelector('.env-key')?.value.trim();
    const v = row.querySelector('.env-val')?.value.trim();
    if (k) env[k] = v || '';
  });

  await simulate(800);
  await DB.updateBot(state.currentBotId, {
    name: $('#botName').value.trim(),
    token: $('#botToken').value.trim(),
    language: $('#botLang').value,
    code: $('#botCode')?.value ?? '',
    env,
    status: $('#botActive').checked ? 'active' : 'disabled',
  });
  state.bots = await DB.selectBots();
  await DB.addActivity({ icon: 'edit', title: `Updated bot settings`, description: `Changes saved for #${state.currentBotId}`, color: 'info' });

  btn.disabled = false; btn.innerHTML = bt;
  closeModal();
  toast('Bot updated', 'Your changes have been saved.', 'success');
  state.detailTab = 'overview';
  renderDetailTab(state.currentBotId, 'overview');
  renderApp('bot-details');
}

async function onBotAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const botId = btn.dataset.id;

  if (action === 'open') { state.currentBotId = botId; navigate('bot-details'); return; }
  if (action === 'edit') { e.preventDefault(); openEditModal(botId); return; }
  if (action === 'delete') { openDeleteModal(botId); return; }
  if (action === 'duplicate') { duplicateBot(botId); return; }
  if (action === 'toggle') { toggleBot(botId); return; }
  if (action === 'copy-token') { copyBotToken(botId); return; }
  if (action === 'copy-webhook') { copyWebhook(botId); return; }
  if (action === 'logs') { state.currentBotId = botId; navigate('logs'); return; }
}

function onPublicAction(e) {
  const link = e.target.closest('[data-cta]');
  if (!link) return;
  e.preventDefault();
  const r = link.dataset.cta;
  if ((r === 'dashboard' || r === 'create-bot') && !state.user) {
    toast('Create a free account', 'Sign up to start deploying bots.', 'info');
    navigate('register');
    return;
  }
  navigate(r === 'dashboard' && !state.user ? 'register' : r);
}

async function toggleBot(id) {
  const bot = await DB.getBot(id);
  const next = bot.status === 'active' ? 'disabled' : 'active';
  await DB.updateBot(id, { status: next });
  state.bots = await DB.selectBots();
  await DB.addActivity({ icon: 'power', title: `${next === 'active' ? 'Enabled' : 'Disabled'} "${bot.name}"`, description: 'Status changed', color: next === 'active' ? 'success' : 'warning' });
  toast(next === 'active' ? 'Bot enabled' : 'Bot disabled', `"${bot.name}" is now ${next}.`, next === 'active' ? 'success' : 'warning');
  renderApp('bot-details');
}

async function duplicateBot(id) {
  const bot = await DB.getBot(id);
  await simulate(700);
  const copy = createBotObject({ name: bot.name + ' (copy)', token: bot.token, language: bot.language, env: bot.env, status: 'disabled' });
  await DB.insertBot(copy);
  state.bots = await DB.selectBots();
  await DB.addActivity({ icon: 'clone', title: `Duplicated "${bot.name}"`, description: `New copy #${copy.id}`, color: 'primary' });
  updateNavCount();
  toast('Bot duplicated', `"${copy.name}" created as disabled.`, 'success');
  renderApp('my-bots');
}

async function copyBotToken(id) {
  const bot = await DB.getBot(id);
  await copyToClipboard(bot.token);
  toast('Token copied', 'Never share your bot token publicly.', 'success');
}

async function copyWebhook(id) {
  const bot = await DB.getBot(id);
  await copyToClipboard(bot.webhook);
  toast('Webhook copied', bot.webhook, 'success');
}

/* ======================================================================
   MODALS
   ====================================================================== */
function openEditModal(id) {
  const bot = state.bots.find(b => b.id === id);
  if (!bot) return;
  state.currentBotId = id;
  const envHTML = Object.entries(bot.env || {})
    .map(([k, v]) => `<div class="env-row" style="display:flex;gap:8px;margin-bottom:8px">
      <input class="input env-key" style="flex:1" value="${esc(k)}" placeholder="KEY" />
      <input class="input env-val" style="flex:2" value="${esc(v)}" placeholder="value" />
      <button type="button" class="icon-btn icon-btn--xs icon-btn--danger" data-remove-env title="Remove">${ICONS.trash}</button>
    </div>`).join('') ||
    `<div class="env-row" style="display:flex;gap:8px;margin-bottom:8px">
      <input class="input env-key" style="flex:1" placeholder="KEY" />
      <input class="input env-val" style="flex:2" placeholder="value" />
      <button type="button" class="icon-btn icon-btn--xs icon-btn--danger" data-remove-env title="Remove">${ICONS.trash}</button>
    </div>`;

  openModal(`Edit "${bot.name}"`, `
    <form id="editBotForm" novalidate>
      <div class="field">
        <label>Bot Name</label>
        <input class="input" id="botName" value="${esc(bot.name)}" required />
      </div>
      <div class="field">
        <label>Telegram Token</label>
        <input class="input" id="botToken" value="${esc(bot.token)}" required />
      </div>
      <div class="field">
        <label>Language / Runtime</label>
        <select class="select" id="botLang">${languageOptions(bot.language)}</select>
      </div>
      <div class="field">
        <label>Bot code</label>
        ${codeEditorHTML(bot.language, bot.code)}
      </div>
      <div class="field">
        <label>Environment Variables</label>
        <div id="envRows">${envHTML}</div>
        <button type="button" class="btn btn--ghost btn--sm" id="addEnvBtn" style="margin-top:6px">${ICONS.plus} Add variable</button>
      </div>
      <div class="field">
        <label class="toggle" style="display:inline-flex;align-items:center;gap:10px;width:auto">
          <input type="checkbox" id="botActive" ${bot.status === 'active' ? 'checked' : ''} />
          <span class="toggle__slider"></span><span style="font-size:.85rem;font-weight:600">Bot active</span>
        </label>
      </div>
      <div class="modal__footer" style="padding:0">
        <button type="button" class="btn btn--ghost" data-close-modal>Cancel</button>
        <button type="submit" class="btn btn--primary">${ICONS.check} Save changes</button>
      </div>
    </form>`, { size: 'modal--lg' });

  const form = $('#editBotForm');
  $('#addEnvBtn').addEventListener('click', addEnvRow);
  $$('#envRows [data-remove-env]').forEach(b => b.addEventListener('click', () => b.closest('.env-row').remove()));
  wireLanguageTemplate();
  form.addEventListener('submit', onEditBot);
}

function openDeleteModal(id) {
  const bot = state.bots.find(b => b.id === id);
  if (!bot) return;
  openModal('Delete bot', `
    <div style="text-align:center;padding:8px 0">
      <div style="width:64px;height:64px;margin:0 auto 16px;border-radius:20px;background:rgba(248,113,113,.12);display:grid;place-items:center;color:var(--danger)">
        ${ICONS.trash}
      </div>
      <p style="color:var(--text-muted);font-size:.92rem">
        This will permanently delete <strong style="color:var(--text)">"${esc(bot.name)}"</strong>,
        its webhook and all logs. This action cannot be undone.
      </p>
    </div>`, {
    footerHTML: `
      <button class="btn btn--ghost" data-close-modal>Cancel</button>
      <button class="btn btn--danger-ghost" id="confirmDelete">${ICONS.trash} Delete permanently</button>`,
    onOpen: (box) => {
      $('#confirmDelete').addEventListener('click', async () => {
        await DB.deleteBot(id);
        state.bots = await DB.selectBots();
        await DB.addActivity({ icon: 'trash', title: `Deleted "${bot.name}"`, description: 'Bot and webhook removed', color: 'danger' });
        updateNavCount();
        closeModal();
        toast('Bot deleted', `"${bot.name}" has been removed.`, 'error');
        if (state.currentRoute === 'bot-details') navigate('my-bots');
        else renderApp('my-bots');
      });
    },
  });
}

function addEnvRow() {
  const wrap = $('#envRows');
  if (!wrap) return;
  const row = document.createElement('div');
  row.className = 'env-row';
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
  row.innerHTML = `
    <input class="input env-key" style="flex:1" placeholder="KEY" />
    <input class="input env-val" style="flex:2" placeholder="value" />
    <button type="button" class="icon-btn icon-btn--xs icon-btn--danger" data-remove-env title="Remove">${ICONS.trash}</button>`;
  row.querySelector('[data-remove-env]').addEventListener('click', () => row.remove());
  wrap.appendChild(row);
  row.querySelector('.env-key').focus();
}

function languageOptions(selected = '') {
  return RUNTIMES.map(r =>
    `<option value="${r.id}" ${selected === r.id ? 'selected' : ''}>${r.label}</option>`).join('');
}

function codeEditorHTML(lang, code, taId = 'botCode') {
  const rt = RUNTIMES.find(r => r.id === lang) || RUNTIMES[0];
  const val = (code === undefined || code === null) ? (CODE_TEMPLATES[rt.id] || '') : code;
  return `
    <div class="code-editor">
      <div class="code-editor__bar">
        <span class="code-editor__file">${rt.file}</span>
        <span class="code-editor__lang">${rt.label}</span>
      </div>
      <textarea class="code-editor__ta" id="${taId}" spellcheck="false" data-lang="${rt.id}">${esc(val)}</textarea>
    </div>`;
}

function wireLanguageTemplate() {
  const sel = $('#botLang');
  if (!sel) return;
  sel.addEventListener('change', () => {
    const ta = $('#botCode');
    if (!ta) return;
    if (!ta.value.trim()) {
      const tpl = CODE_TEMPLATES[sel.value] || '';
      ta.value = tpl;
      const rt = RUNTIMES.find(r => r.id === sel.value);
      const langTag = ta.closest('.code-editor')?.querySelector('.code-editor__lang');
      if (langTag && rt) langTag.textContent = rt.label;
    }
  });
}

/* ======================================================================
   10. RENDER HELPERS
   ====================================================================== */
function updateUserUI() {
  $('#sidebarUserName').textContent = state.user?.name || 'User';
  $('#sidebarUserPlan').textContent = state.user?.plan ? state.user.plan.toUpperCase() : 'Free';
  $('#sidebarUserAvatar').textContent = initials(state.user?.name || 'U');
}

async function updateAdminBadge() {
  const badge = $('#adminOrderBadge');
  if (!badge) return;
  try {
    const orders = await DB.selectAllOrders();
    const pending = orders.filter(o => o.status === 'pending').length;
    badge.textContent = pending;
    badge.style.display = pending > 0 ? 'grid' : 'none';
  } catch { /* ignore */ }
}

function updateNavCount() {
  $('#navBotCount').textContent = state.bots.filter(b => b.status === 'active').length;
}

function botRowHTML(bot, hideMobile = false) {
  const created = timeAgo(bot.createdAt);
  return `
  <tr data-id="${bot.id}">
    <td class="bot-name-cell">
      <div class="bot-avatar" style="background:${avatarColor(bot.id)}">${initials(bot.name)}</div>
      <div>
        <strong><a href="#bot-details/${bot.id}" data-action="open" data-id="${bot.id}" style="cursor:pointer">${esc(bot.name)}</a></strong>
        <span>${esc(bot.username || '')}</span>
      </div>
    </td>
    <td class="bot-table__hide-mobile" ${hideMobile ? 'style="display:none"' : ''}><span class="chip chip--dot status--${bot.status}">${bot.status}</span></td>
    <td class="bot-table__hide-mobile" ${hideMobile ? 'style="display:none"' : ''}><span class="chip">${bot.language}</span></td>
    <td class="bot-table__hide-mobile" ${hideMobile ? 'style="display:none"' : ''}><span style="color:var(--text-muted);font-size:.82rem">${created}</span></td>
    <td>
      <div class="row-actions">
        <button class="icon-btn icon-btn--xs" data-action="copy-webhook" data-id="${bot.id}" title="Copy webhook">${ICONS.globe}</button>
        <button class="icon-btn icon-btn--xs" data-action="toggle" data-id="${bot.id}" title="${bot.status === 'active' ? 'Disable' : 'Enable'}" ${bot.status === 'active' ? 'style="color:var(--success)"' : 'style="color:var(--text-muted)"'}>${ICONS.power}</button>
        <button class="icon-btn icon-btn--xs" data-action="edit" data-id="${bot.id}" title="Edit">${ICONS.edit}</button>
        <button class="icon-btn icon-btn--xs" data-action="duplicate" data-id="${bot.id}" title="Duplicate">${ICONS.clone}</button>
        <button class="icon-btn icon-btn--xs icon-btn--danger" data-action="delete" data-id="${bot.id}" title="Delete">${ICONS.trash}</button>
      </div>
    </td>
  </tr>`;
}

function renderBotList(container) {
  if (!container) return;
  const q = state.botSearch;
  const filtered = state.bots.filter(b => !q || b.name.toLowerCase().includes(q) || (b.username || '').toLowerCase().includes(q));

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">${state.bots.length ? ICONS.search : ICONS.bot}</div>
        <h3>${state.bots.length ? 'No results found' : 'No bots yet'}</h3>
        <p>${state.bots.length ? `Nothing matches "${esc(q)}". Try a different search.` : 'Create your first Telegram bot and deploy it in seconds.'}</p>
        ${!state.bots.length ? `<button class="btn btn--primary" data-action="new-bot" onclick="location.hash='#create-bot'">${ICONS.plus} Create your first bot</button>` : ''}
      </div>`;
    return;
  }

  const nested = !!container.closest('.card');
  const wrapper = nested ? 'table-wrap' : 'table-wrap card';
  container.innerHTML = `
    <div class="${wrapper}">
      <table class="bot-table">
        <thead><tr>
          <th>Bot</th><th class="bot-table__hide-mobile">Status</th>
          <th class="bot-table__hide-mobile">Runtime</th><th class="bot-table__hide-mobile">Created</th><th style="text-align:right">Actions</th>
        </tr></thead>
        <tbody>${filtered.map(b => botRowHTML(b)).join('')}</tbody>
      </table>
    </div>`;
}

/* ======================================================================
   11. PAGES — PUBLIC
   ====================================================================== */
function pageHome() {
  return `
  <div class="page">
    <section class="hero">
      <span class="hero__badge"><span class="live-dot"></span> Now with Firebase + Vercel edge deploy</span>
      <h1>Deploy your Telegram bots in <span class="gradient-text">seconds</span>, not hours</h1>
      <p>The fastest way to host, monitor and scale Telegram bots. Instant webhooks, real-time logs, beautiful analytics — zero server setup.</p>
      <div class="hero__cta">
        <a href="#register" class="btn btn--primary btn--lg" data-cta="register">${ICONS.bolt} Start deploying free</a>
        <a href="#docs" class="btn btn--ghost btn--lg" data-cta="docs">${ICONS.code} Read the docs</a>
      </div>
      <div class="hero__stats">
        <div class="hero__stat"><b>120K+</b><span>Bots deployed</span></div>
        <div class="hero__stat"><b>99.99%</b><span>Uptime</span></div>
        <div class="hero__stat"><b>&lt;50ms</b><span>Response time</span></div>
        <div class="hero__stat"><b>150+</b><span>Countries served</span></div>
      </div>

      <div class="hero__terminal">
        <div class="terminal">
          <div class="terminal__bar">
            <div class="terminal__dots"><span></span><span></span><span></span></div>
            <span class="terminal__title">webhook — /webhook/bot_xK2m9Q</span>
          </div>
          <div class="terminal__body">
            <div><span class="t-dim">$</span> <span class="t-blue">bothost</span> deploy @MyHelperBot</div>
            <div><span class="t-green">✓</span> Saving bot to Firebase <span class="t-dim">… done</span></div>
            <div><span class="t-green">✓</span> Registering webhook <span class="t-dim">→ https://webzhost.vercel.app/api/webhook/bot_xK2m9Q</span></div>
            <div><span class="t-green">✓</span> Executing handler <span class="t-dim">(nodejs)</span></div>
            <div><span class="t-green">✓</span> Reply sent <span class="t-dim">in 38ms</span> <span class="t-purple">[200 OK]</span></div>
            <div><span class="t-dim">Listening for updates…</span><span class="terminal__cursor"></span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="features">
      <div class="section__head">
        <span class="eyebrow">Features</span>
        <h2>Everything you need to run production bots</h2>
        <p>From first deploy to global scale — a complete platform built for Telegram developers.</p>
      </div>
      <div class="features-grid">
        ${featureCard('bolt', 'Instant deployment', 'Paste your token, pick a runtime, and your bot goes live with a webhook URL — no servers, no config files.')}
        ${featureCard('terminal', 'Real-time logs', 'Stream every request and error live. Filter by bot, level and timestamp to debug faster than ever.')}
        ${featureCard('chart', 'Beautiful analytics', 'Track requests, messages processed, storage and uptime on clear, animated charts.')}
        ${featureCard('key', 'Secure tokens', 'Bot tokens are encrypted at rest. Share webhooks with confidence using isolated endpoints per bot.')}
        ${featureCard('layers', 'Two powerful runtimes', 'Build your bot in Node.js or Python. Write the handler code in our built-in editor and deploy instantly.')}
        ${featureCard('shield', 'Enterprise-grade security', 'Isolated environments, DDoS protection and automatic SSL on every webhook endpoint.')}
      </div>
    </section>

    <section class="section" id="how-it-works">
      <div class="section__head">
        <span class="eyebrow">How it works</span>
        <h2>From idea to live bot in 4 steps</h2>
      </div>
      <div class="workflow">
        <div class="card card--hover workflow__step"><h3>Create your bot</h3><p>Add a name and your Telegram token from @BotFather.</p></div>
        <div class="card card--hover workflow__step"><h3>We save it to the database</h3><p>Your bot is stored securely in Firebase with environment variables.</p></div>
        <div class="card card--hover workflow__step"><h3>Webhook is generated</h3><p>Each bot gets a unique endpoint: <code style="font-family:var(--mono);color:var(--primary)">/api/webhook/{botId}</code>.</p></div>
        <div class="card card--hover workflow__step"><h3>Messages are handled</h3><p>Telegram posts updates, we execute your handler and send the reply in milliseconds.</p></div>
      </div>
    </section>

    <section class="section" id="faq">
      <div class="section__head">
        <span class="eyebrow">FAQ</span>
        <h2>Frequently asked questions</h2>
      </div>
      <div class="faq-list">
        ${faqItem('How do I get a bot token?', 'Talk to @BotFather on Telegram — use /newbot, choose a name and username, and copy the HTTP API token it gives you.')}
        ${faqItem('What is a webhook?', 'A webhook is the URL Telegram calls whenever your bot receives a message. We auto-generate one per bot and wire it up for you.')}
        ${faqItem('Which languages are supported?', 'We support two runtimes today: Node.js (JavaScript) and Python. Write your handler code directly in the built-in code editor.')}
        ${faqItem('Is my bot token safe?', 'Yes. Tokens are encrypted at rest and never shown to other users. Use the copy button carefully — treat it like a password.')}
        ${faqItem('Can I switch from polling to webhooks?', 'Absolutely. The platform is webhook-native, so you get lower latency and no polling overhead by default.')}
        ${faqItem('What happens if I exceed my plan limits?', 'We\\'ll notify you before hitting your quota. Upgrade any time — no downtime, your bots stay online.')}
      </div>
    </section>

    <section class="section">
      <div class="cta-banner">
        <h2>Ready to ship your next bot?</h2>
        <p>Join thousands of developers deploying Telegram bots on BotHost. Free to start — no credit card required.</p>
        <div class="hero__cta">
          <a href="#register" class="btn btn--accent btn--lg" data-cta="register">${ICONS.sparkle} Get started free</a>
          <a href="#login" class="btn btn--ghost btn--lg" data-cta="login">I already have an account</a>
        </div>
      </div>
    </section>
  </div>`;
}

function featureCard(icon, title, desc) {
  return `<div class="card card--hover feature-card">
    <div class="feature-card__icon">${ICONS[icon] || ICONS.bolt}</div>
    <h3>${title}</h3><p>${desc}</p>
  </div>`;
}

function faqItem(q, a) {
  return `<div class="faq-item">
    <button class="faq-item__q">${q}${ICONS.plus}</button>
    <div class="faq-item__a"><p>${a}</p></div>
  </div>`;
}

function pageLogin() {
  return `
  <div class="page auth-wrap">
    <div class="card auth-card">
      <div class="auth-card__head">
        <div class="brand-logo">${ICONS.dashboard}</div>
        <h1>Welcome back</h1>
        <p>Log in to your BotHost account</p>
      </div>
      <form id="authForm" data-mode="login">
        <div class="field">
          <label>Email</label>
          <input class="input" id="email" type="email" placeholder="you@example.com" required />
        </div>
        <div class="field">
          <label>Password</label>
          <div class="password-field">
            <input class="input input--pw" id="password" type="password" placeholder="••••••••" required />
            <button type="button" class="password-toggle" data-pw-toggle="password">${ICONS.eye}</button>
          </div>
        </div>
        <button class="btn btn--primary btn--block" type="submit" style="margin-top:8px">Log in</button>
      </form>
      <div class="auth-divider">or</div>
      <button class="btn btn--ghost btn--block" data-nav="register">Create an account</button>
      <p class="auth-alt">New to BotHost? <a href="#register" data-nav="register">Sign up free</a></p>
    </div>
  </div>`;
}

function pageRegister() {
  return `
  <div class="page auth-wrap">
    <div class="card auth-card">
      <div class="auth-card__head">
        <div class="brand-logo">${ICONS.sparkle}</div>
        <h1>Create your account</h1>
        <p>Deploy your first bot in under a minute</p>
      </div>
      <form id="authForm" data-mode="register">
        <div class="field">
          <label>Full name</label>
          <input class="input" id="name" placeholder="Ada Lovelace" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input class="input" id="email" type="email" placeholder="you@example.com" required />
        </div>
        <div class="form-row">
          <div class="field">
            <label>Password</label>
            <div class="password-field">
              <input class="input input--pw" id="password" type="password" placeholder="Min 6 characters" required />
              <button type="button" class="password-toggle" data-pw-toggle="password">${ICONS.eye}</button>
            </div>
          </div>
          <div class="field">
            <label>Confirm</label>
            <input class="input" id="pwConfirm" type="password" placeholder="Repeat password" required />
            <div class="hint" id="pwHint" style="color:var(--danger)"></div>
          </div>
        </div>
        <button class="btn btn--accent btn--block" type="submit">${ICONS.sparkle} Sign up free</button>
      </form>
      <p class="auth-alt">Already have an account? <a href="#login" data-nav="login">Log in</a></p>
    </div>
  </div>`;
}

function pageDocs() {
  return `
  <div class="page docs-layout">
    <nav class="docs-nav" id="docsNav">
      <a href="#docs-getting-started" class="active">Getting started</a>
      <a href="#docs-create-bot">Creating a bot</a>
      <a href="#docs-webhooks">Webhooks</a>
      <a href="#docs-env">Environment variables</a>
      <a href="#docs-logs">Logs & debugging</a>
      <a href="#docs-deploy">Deploying</a>
    </nav>
    <div class="docs-body">
      <h1 id="docs-getting-started">Documentation</h1>
      <p>BotHost makes it trivial to host Telegram bots. This guide covers the complete workflow.</p>

      <div class="callout callout--info">⚡ A single page webhook endpoint is generated for every bot: <code>https://webzhost.vercel.app/api/webhook/{botId}</code></div>

      <h2 id="docs-create-bot">1. Create a bot</h2>
      <p>First get your token from <strong>@BotFather</strong> on Telegram, then:</p>
      <ul>
        <li>Go to <strong>Create Bot</strong> from the dashboard.</li>
        <li>Enter a name and paste your Telegram HTTP API token.</li>
        <li>Pick a runtime (Node.js or Python).</li>
        <li>Write your bot handler in the built-in code editor.</li>
        <li>Optionally add environment variables (secrets).</li>
      </ul>

      <h2 id="docs-webhooks">2. Webhooks</h2>
      <p>Each bot is registered at a unique endpoint. Telegram calls this URL whenever a user sends a message:</p>
      <div class="code-block">POST https://webzhost.vercel.app/api/webhook/{botId}</div>
      <p>The flow looks like this:</p>
      <div class="code-block">User ──message──▶ Telegram ──POST webhook──▶ BotHost
    └─ load bot config ─▶ execute handler ─▶ send reply</div>

      <h2 id="docs-env">3. Environment variables</h2>
      <p>Store secrets (database URLs, API keys) as key/value pairs. They are encrypted and injected into your runtime at execution time.</p>
      <div class="code-block">DATABASE_URL=postgres://...
OPENAI_API_KEY=sk-...
ADMIN_ID=123456789</div>

      <h2 id="docs-logs">4. Logs & debugging</h2>
      <p>Every webhook request produces a log line. Filter by bot, level (info, success, warning, error) and inspect timestamps to trace issues in real time.</p>

      <h2 id="docs-deploy">5. Deploying</h2>
      <p>Hit <strong>Create Bot</strong> and the bot goes live instantly. Enable/disable it at any time with a single toggle. Duplicate a bot to reuse its configuration.</p>

      <div class="code-block"># Example webhook handler (Node.js)
export default async function handler(req) {
  const update = req.body; // Telegram update
  if (update.message?.text) {
    const reply = { text: 'Hello! 👋' };
    await sendMessage(update.message.chat.id, reply.text);
  }
  return { statusCode: 200 };
}</div>
    </div>
  </div>`;
}

/* ======================================================================
   12. PAGES — APP
   ====================================================================== */
function computeStats() {
  const bots = state.bots;
  const active = bots.filter(b => b.status === 'active');
  const totalRequests = bots.reduce((s, b) => s + (b.stats?.requests || 0), 0);
  const totalMessages = bots.reduce((s, b) => s + (b.stats?.messages || 0), 0);
  const totalStorage = bots.reduce((s, b) => s + (b.stats?.storage || 0), 0);
  return {
    total: bots.length, active: active.length,
    requests: totalRequests, messages: totalMessages, storage: totalStorage,
  };
}

function pageDashboard() {
  const s = computeStats();
  const stats = [
    { icon: 'bot', label: 'Total Bots', value: s.total, color: 'var(--primary)', glow: 'rgba(56,189,248,.4)', trend: '+2 this week', up: true },
    { icon: 'power', label: 'Active Bots', value: s.active, color: 'var(--success)', glow: 'rgba(52,211,153,.4)', trend: 'Online now', up: true },
    { icon: 'globe', label: 'Total Requests', value: formatNumber(s.requests), color: 'var(--accent)', glow: 'rgba(167,139,250,.4)', trend: '+18%', up: true },
    { icon: 'message', label: 'Messages Processed', value: formatNumber(s.messages), color: 'var(--info)', glow: 'rgba(96,165,250,.4)', trend: '+12%', up: true },
    { icon: 'storage', label: 'Storage Used', value: formatBytes(s.storage), color: 'var(--warning)', glow: 'rgba(251,191,36,.4)', trend: '38% of quota', up: true },
  ];
  const recent = state.activity.slice(0, 8);

  return `
    <div class="page-header">
      <div>
        <h1>Welcome back, ${esc(state.user?.name || 'Developer')} 👋</h1>
        <p>Here's what's happening with your bots today.</p>
      </div>
      <div class="page-header__actions">
        <a href="#create-bot" class="btn btn--primary" data-nav="create-bot">${ICONS.plus} New bot</a>
        <a href="#my-bots" class="btn btn--ghost" data-nav="my-bots">Manage bots</a>
      </div>
    </div>

    <div class="stat-grid">
      ${stats.map(x => `
        <div class="card card--hover stat-card">
          <div class="stat-card__glow" style="background:${x.glow}"></div>
          <div class="stat-card__top">
            <div class="stat-card__icon" style="background:${x.color}1a;color:${x.color}">${ICONS[x.icon]}</div>
            <span class="chip">${x.label}</span>
          </div>
          <div class="stat-card__value">${x.value}</div>
          <div class="stat-card__label">${x.trend} ${x.up ? ICONS.arrowUp : ICONS.arrowDown}</div>
        </div>`).join('')}
    </div>

    <div class="dash-grid">
      <div class="card">
        <div class="card__header"><h3 class="card__title">Your bots</h3><a href="#my-bots" class="btn btn--ghost btn--sm" data-nav="my-bots">View all</a></div>
        <div id="botsTableWrap" style="margin-top:6px"></div>
      </div>
      <div class="card">
        <div class="card__header"><h3 class="card__title">Quick actions</h3></div>
        <div class="quick-actions">
          <button class="quick-action" onclick="location.hash='#create-bot'">${ICONS.plus} Create bot</button>
          <button class="quick-action" onclick="location.hash='#logs'">${ICONS.terminal} View logs</button>
          <button class="quick-action" onclick="location.hash='#analytics'">${ICONS.chart} Analytics</button>
          <button class="quick-action" onclick="location.hash='#docs'">${ICONS.code} Documentation</button>
        </div>
      </div>
    </div>

    <div class="dash-grid dash-grid--full">
      <div class="card">
        <div class="card__header"><h3 class="card__title">Recent activity</h3><span class="chip">Live feed</span></div>
        <div class="activity-list">
          ${recent.length ? recent.map(activityItem).join('') : '<p style="color:var(--text-faint);font-size:.9rem;padding:10px">No activity yet — create your first bot.</p>'}
        </div>
      </div>
    </div>`;
}

function activityItem(a) {
  const colors = { primary: 'var(--primary)', success: 'var(--success)', info: 'var(--info)', danger: 'var(--danger)', warning: 'var(--warning)' };
  return `
    <div class="activity-item">
      <div class="activity-item__icon" style="background:${(colors[a.color] || 'var(--primary)')}1a;color:${colors[a.color] || 'var(--primary)'}">${ICONS[a.icon] || ICONS.bolt}</div>
      <div class="activity-item__body">
        <div class="activity-item__title">${esc(a.title)}</div>
        <div class="activity-item__desc">${esc(a.description || '')}</div>
      </div>
      <span class="activity-item__time">${timeAgo(a.createdAt || a.at)}</span>
    </div>`;
}

function pageMyBots() {
  return `
    <div class="page-header">
      <div><h1>My Bots</h1><p>${state.bots.length} bot${state.bots.length === 1 ? '' : 's'} · ${state.bots.filter(b=>b.status==='active').length} active</p></div>
      <div class="page-header__actions">
        <a href="#create-bot" class="btn btn--primary" data-nav="create-bot">${ICONS.plus} New bot</a>
      </div>
    </div>

    <div class="search-bar">
      ${ICONS.search.replace('<svg', '<svg class="search-bar__icon"')}
      <input type="text" id="botSearchInput" placeholder="Search bots by name or username…" value="${esc(state.botSearch)}" />
    </div>

    <div id="botsTableWrap"></div>`;
}

function pageCreateBot() {
  return `
    <div class="page-header">
      <div><h1>Create Bot</h1><p>Paste your token and deploy in seconds.</p></div>
    </div>
    <div class="card" style="max-width:640px">
      <form id="createBotForm" novalidate>
        <div class="field">
          <label>Bot name</label>
          <input class="input" id="botName" placeholder="My Helper Bot" required />
        </div>
        <div class="field">
          <label>Telegram token</label>
          <input class="input" id="botToken" placeholder="123456:ABC-DEF..." required />
          <div class="hint">Get one from <strong>@BotFather</strong> → /newbot on Telegram.</div>
        </div>
        <div class="field">
          <label>Language / Runtime</label>
          <select class="select" id="botLang">${languageOptions('nodejs')}</select>
        </div>
        <div class="field">
          <label>Bot code <span class="hint" style="display:inline;color:var(--text-faint)">— write how your bot replies</span></label>
          ${codeEditorHTML('nodejs', CODE_TEMPLATES.nodejs)}
        </div>
        <div class="field">
          <label>Environment variables</label>
          <div id="envRows">
            <div class="env-row" style="display:flex;gap:8px;margin-bottom:8px">
              <input class="input env-key" style="flex:1" placeholder="KEY" />
              <input class="input env-val" style="flex:2" placeholder="value" />
              <button type="button" class="icon-btn icon-btn--xs icon-btn--danger" data-remove-env title="Remove">${ICONS.trash}</button>
            </div>
          </div>
          <button type="button" class="btn btn--ghost btn--sm" id="addEnvBtn" style="margin-top:6px">${ICONS.plus} Add variable</button>
        </div>
        <div class="field" style="display:flex;align-items:center;gap:12px;margin-top:6px">
          <label class="toggle">
            <input type="checkbox" id="botActive" checked />
            <span class="toggle__slider"></span>
          </label>
          <span style="font-size:.88rem;font-weight:600">Enable bot immediately</span>
        </div>
        <button class="btn btn--primary btn--lg btn--block" type="submit" style="margin-top:14px">${ICONS.rocket} Deploy bot</button>
      </form>
    </div>`;
}

function pageBotDetails() {
  const bot = state.bots.find(b => b.id === state.currentBotId);
  if (!bot) return `<div class="empty-state"><h3>Bot not found</h3><p>This bot may have been deleted.</p><button class="btn btn--primary" onclick="location.hash='#my-bots'">Back to bots</button></div>`;

  const created = new Date(bot.createdAt).toLocaleString();
  return `
    <div class="detail-hero">
      <div class="bot-avatar" style="background:${avatarColor(bot.id)};width:56px;height:56px;border-radius:16px;display:grid;place-items:center;font-size:1.3rem;font-weight:800">${initials(bot.name)}</div>
      <div>
        <h1>${esc(bot.name)}</h1>
        <span class="id-tag">${esc(bot.id)} · ${esc(bot.username || '')}</span>
      </div>
      <div class="detail-hero__actions">
        <button class="btn btn--ghost btn--sm" data-action="toggle" data-id="${bot.id}">${ICONS.power} ${bot.status === 'active' ? 'Disable' : 'Enable'}</button>
        <button class="btn btn--ghost btn--sm" data-action="copy-webhook" data-id="${bot.id}">${ICONS.globe} Copy webhook</button>
        <button class="btn btn--ghost btn--sm" data-action="copy-token" data-id="${bot.id}">${ICONS.key} Copy token</button>
        <button class="btn btn--danger-ghost btn--sm" data-action="delete" data-id="${bot.id}">${ICONS.trash}</button>
      </div>
    </div>

    <div class="tabs" id="detailTabs">
      <button class="tab ${state.detailTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
      <button class="tab ${state.detailTab === 'code' ? 'active' : ''}" data-tab="code">Code</button>
      <button class="tab ${state.detailTab === 'requests' ? 'active' : ''}" data-tab="requests">Requests</button>
      <button class="tab ${state.detailTab === 'env' ? 'active' : ''}" data-tab="env">Environment</button>
      <button class="tab ${state.detailTab === 'logs' ? 'active' : ''}" data-tab="logs">Logs</button>
    </div>

    <div id="detailArea">${renderDetailTab(bot.id, state.detailTab)}</div>`;
}

function renderDetailTab(id, tab) {
  const bot = state.bots.find(b => b.id === id);
  if (!bot) return '';
  const created = new Date(bot.createdAt).toLocaleString();

  if (tab === 'overview') return `
    <div class="meta-grid">
      <div class="card card--hover meta-item"><div class="meta-item__label">Status</div><div class="meta-item__value"><span class="chip chip--dot status--${bot.status}">${bot.status}</span></div></div>
      <div class="card card--hover meta-item"><div class="meta-item__label">Runtime</div><div class="meta-item__value">${bot.language}</div></div>
      <div class="card card--hover meta-item"><div class="meta-item__label">Created</div><div class="meta-item__value">${created}</div></div>
    </div>
    <div class="card">
      <div class="card__header"><h3 class="card__title">Webhook URL</h3><span class="chip chip--dot status--active">Receiving</span></div>
      <div class="webhook-box">
        <code>${bot.webhook}</code>
        <button class="btn btn--ghost btn--sm" id="copyWebhookBtn" data-url="${bot.webhook}">${ICONS.copy} Copy</button>
      </div>
      <p style="color:var(--text-faint);font-size:.82rem;margin-top:12px">Telegram sends all updates to this endpoint. Configure it in @BotFather with <code>/setwebhook</code>.</p>
    </div>
    <div style="height:18px"></div>
    <div class="meta-grid">
      <div class="card card--hover meta-item"><div class="meta-item__label">Requests</div><div class="meta-item__value">${formatNumber(bot.stats?.requests || 0)}</div></div>
      <div class="card card--hover meta-item"><div class="meta-item__label">Messages</div><div class="meta-item__value">${formatNumber(bot.stats?.messages || 0)}</div></div>
      <div class="card card--hover meta-item"><div class="meta-item__label">Storage</div><div class="meta-item__value">${formatBytes(bot.stats?.storage || 0)}</div></div>
      <div class="card card--hover meta-item"><div class="meta-item__label">Bot ID</div><div class="meta-item__value" style="font-family:var(--mono);font-size:.8rem">${esc(bot.id)}</div></div>
    </div>
    <div class="card" style="margin-top:18px">
      <div class="card__header"><h3 class="card__title">Enable / disable</h3><span class="chip">Runtime control</span></div>
      <div class="settings-row" style="padding:14px 0;border:none">
        <div class="settings-row__text"><h3>Bot is ${bot.status}</h3><p>Toggle to pause or resume handling of webhook updates.</p></div>
        <button class="btn ${bot.status === 'active' ? 'btn--ghost' : 'btn--success'} btn--sm" data-action="toggle" data-id="${bot.id}">${bot.status === 'active' ? 'Disable' : 'Enable'} now</button>
      </div>
    </div>`;

  if (tab === 'code') return `
    <div class="card">
      <div class="card__header">
        <h3 class="card__title">Bot handler code</h3>
        <div class="page-header__actions">
          <button class="btn btn--ghost btn--sm" id="copyCode">${ICONS.copy} Copy</button>
          <button class="btn btn--primary btn--sm" id="saveCode">${ICONS.check} Save</button>
        </div>
      </div>
      <div class="field">
        <select class="select" id="botLang" style="max-width:200px;margin-bottom:10px">${languageOptions(bot.language)}</select>
      </div>
      ${codeEditorHTML(bot.language, bot.code)}
      <p style="color:var(--text-faint);font-size:.8rem;margin-top:10px">Telegram posts an <b style="color:var(--text-muted)">update</b> object to <code style="font-family:var(--mono)">${bot.webhook}</code>. Return <b style="color:var(--text-muted)">{ chat_id, text }</b> to reply to the sender, or <b style="color:var(--text-muted)">null</b> to do nothing.</p>
    </div>`;

  if (tab === 'requests') return `
    <div class="card"><div class="card__header"><h3 class="card__title">Requests over time</h3><span class="chip">7 days</span></div>
      <canvas class="chart" id="reqChart"></canvas>
    </div>
    <div class="card" style="margin-top:18px">
      <div class="card__header"><h3 class="card__title">Status code breakdown</h3></div>
      <div style="display:flex;gap:24px;flex-wrap:wrap" id="statusBreakdown"></div>
    </div>`;

  if (tab === 'env') {
    const entries = Object.entries(bot.env || {});
    return `
      <div class="card">
        <div class="card__header"><h3 class="card__title">Environment variables</h3>
          <button class="btn btn--primary btn--sm" data-action="edit" data-id="${bot.id}">${ICONS.edit} Manage</button>
        </div>
        ${entries.length ? `<div class="env-list">${entries.map(([k, v]) =>
          `<div class="env-item"><code>${esc(k)}</code><span class="env-secret">${esc(String(v))}</span></div>`).join('')}</div>`
          : `<div class="empty-state" style="padding:30px"><div class="empty-state__icon" style="width:56px;height:56px">${ICONS.key}</div><h3>No variables yet</h3><p>Add environment variables to store secrets your bot uses.</p></div>`}
      </div>`;
  }

  if (tab === 'logs') {
    const logs = state.logs.filter(l => l.botId === id).slice(-50).reverse();
    return `<div class="card" style="padding:0;overflow:hidden">
      <div class="card__header" style="padding:16px 20px;margin:0;border-bottom:1px solid var(--glass-border)"><h3 class="card__title">Runtime logs</h3><span class="chip">${esc(bot.name)}</span></div>
      <div class="log-console" style="height:420px;border:none;border-radius:0">${renderLogLines(logs)}</div>
    </div>`;
  }
  return '';
}

function bindEnvActions() {}

function wireDetailCode() {
  $('#copyCode')?.addEventListener('click', async () => {
    const ta = $('#botCode');
    if (ta) { await copyToClipboard(ta.value); toast('Code copied', 'Bot handler copied to clipboard.', 'success'); }
  });
  $('#saveCode')?.addEventListener('click', async () => {
    const ta = $('#botCode');
    if (!ta) return;
    const lang = $('#botLang')?.value || ta.dataset.lang;
    await DB.updateBot(state.currentBotId, { code: ta.value, language: lang });
    state.bots = await DB.selectBots();
    await DB.addActivity({ icon: 'code', title: 'Bot code updated', description: `Code saved for #${state.currentBotId}`, color: 'info' });
    toast('Code saved', 'Your bot handler has been updated.', 'success');
  });
  wireLanguageTemplate();
}

/* ======================================================================
   13. ANALYTICS
   ====================================================================== */
function pageAnalytics() {
  const s = computeStats();
  const topBots = [...state.bots].sort((a, b) => (b.stats?.requests || 0) - (a.stats?.requests || 0)).slice(0, 5);
  return `
    <div class="page-header"><div><h1>Analytics</h1><p>Usage and performance across all your bots.</p></div></div>

    <div class="stat-grid">
      ${[
        { icon: 'globe', label: 'Requests (30d)', value: formatNumber(s.requests * 4), color: 'var(--accent)', up: true },
        { icon: 'message', label: 'Messages', value: formatNumber(s.messages * 4), color: 'var(--info)', up: true },
        { icon: 'cpu', label: 'Avg response', value: '42ms', color: 'var(--success)', up: true },
        { icon: 'shield', label: 'Uptime', value: '99.99%', color: 'var(--primary)', up: true },
      ].map(x => `
        <div class="card card--hover stat-card">
          <div class="stat-card__top"><div class="stat-card__icon" style="background:${x.color}1a;color:${x.color}">${ICONS[x.icon]}</div><span class="chip">${x.label}</span></div>
          <div class="stat-card__value">${x.value}</div>
          <div class="stat-card__label">${x.up ? '+14%' : ''} vs last period</div>
        </div>`).join('')}
    </div>

    <div class="card"><div class="card__header"><h3 class="card__title">Requests · last 14 days</h3><span class="chip">Animated</span></div><canvas class="chart" id="analyticsChart"></canvas></div>

    <div style="height:20px"></div>
    <div class="dash-grid">
      <div class="card"><div class="card__header"><h3 class="card__title">Top bots by requests</h3></div>
        <div class="activity-list">
          ${topBots.length ? topBots.map(b => `
            <div class="activity-item">
              <div class="bot-avatar" style="background:${avatarColor(b.id)};width:34px;height:34px;border-radius:10px;font-size:.8rem">${initials(b.name)}</div>
              <div class="activity-item__body"><div class="activity-item__title">${esc(b.name)}</div><div class="activity-item__desc">${b.status}</div></div>
              <span style="font-weight:700;color:var(--primary)">${formatNumber(b.stats?.requests || 0)}</span>
            </div>`).join('') : '<p style="color:var(--text-faint)">No bots yet.</p>'}
        </div>
      </div>
      <div class="card"><div class="card__header"><h3 class="card__title">Storage by bot</h3></div>
        <div class="activity-list">
          ${topBots.map(b => {
            const pct = Math.min(100, Math.round((b.stats?.storage || 0) / 1000000 * 100));
            return `
            <div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:6px"><span style="font-weight:600">${esc(b.name)}</span><span style="color:var(--text-muted)">${formatBytes(b.stats?.storage || 0)}</span></div>
              <div class="progress"><div class="progress__bar" style="width:${Math.max(pct, 4)}%"></div></div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

/* ======================================================================
   14. LOGS
   ====================================================================== */
function pageLogs() {
  return `
    <div class="page-header"><div><h1>Logs</h1><p>Live stream of every webhook request across your bots.</p></div></div>
    <div class="log-toolbar">
      <select class="select" id="logFilter" style="max-width:200px">
        <option value="all">All bots</option>
        ${state.bots.map(b => `<option value="${b.id}" ${state.logFilterBot === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
      </select>
      <select class="select" id="logLevel" style="max-width:140px">
        <option value="all">All levels</option>
        <option value="info">INFO</option>
        <option value="success">SUCCESS</option>
        <option value="warn">WARN</option>
        <option value="error">ERROR</option>
      </select>
      <button class="btn btn--ghost" id="refreshLogs">${ICONS.refresh} Refresh</button>
      <button class="btn btn--ghost" id="exportLogs">${ICONS.download} Export</button>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div class="log-console" id="logConsole" style="border:none;border-radius:0;height:540px"></div>
    </div>`;
}

function renderLogs(container) {
  if (!container) return;
  const filter = state.logFilterBot;
  const level = $('#logLevel')?.value || 'all';
  let logs = state.logs;
  if (filter !== 'all') logs = logs.filter(l => l.botId === filter);
  if (level !== 'all') logs = logs.filter(l => l.level === level);
  container.innerHTML = renderLogLines(logs.slice(-200).reverse()) ||
    '<div style="color:var(--text-faint);padding:20px;text-align:center">No logs match this filter yet. Deploy a bot and send it a message.</div>';
}

function renderLogLines(logs) {
  if (!logs.length) return '';
  return logs.map(l => {
    const time = new Date(l.time).toLocaleTimeString('en-GB', { hour12: false });
    return `<div class="log-line">
      <span class="log-line__time">${time}</span>
      <span class="log-line__lvl lvl-${l.level || 'info'}">${String(l.level || 'info').toUpperCase().padEnd(7, ' ')}</span>
      <span class="log-line__msg">${esc(l.message || l.msg)}</span>
    </div>`;
  }).join('');
}

/* ======================================================================
   15. SETTINGS
   ====================================================================== */
function pageSettings() {
  const s = state.settings;
  const cp = currentPlan();
  const order = ['free', 'basic', 'pro', 'premium'];
  return `
    <div class="page-header"><div><h1>Settings</h1><p>Manage your account, plan and preferences.</p></div></div>

    <div class="card" style="margin-bottom:18px">
      <div class="card__header">
        <h3 class="card__title">Current plan</h3>
        <span class="chip" style="color:var(--primary)">${esc(cp.name)}</span>
      </div>
      <div style="display:flex;gap:26px;flex-wrap:wrap">
        <div><div class="meta-item__label">Bots allowed</div><b style="font-size:1.2rem">${cp.maxBots === 9999 ? 'Unlimited' : cp.maxBots}</b></div>
        <div><div class="meta-item__label">Storage</div><b style="font-size:1.2rem">${formatBytes(cp.storage)}</b></div>
        <div><div class="meta-item__label">Speed</div><b style="font-size:1.2rem">${esc(cp.speed)}</b></div>
      </div>
    </div>

    <div class="plan-grid" style="margin-bottom:26px">
      ${order.map(k => planCard(k)).join('')}
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card__header"><h3 class="card__title">Profile</h3></div>
      <div class="settings-row">
        <div class="settings-row__text"><h3>Name</h3><p>Your display name shown across the platform.</p></div>
        <input class="input" id="profileName" value="${esc(state.user?.name || '')}" style="max-width:240px" />
      </div>
      <div class="settings-row">
        <div class="settings-row__text"><h3>Email</h3><p>Used for login and notifications.</p></div>
        <input class="input" value="${esc(state.user?.email || '')}" style="max-width:240px" disabled />
      </div>
      <div class="settings-row">
        <div class="settings-row__text"><h3>Plan</h3><p>Your current subscription tier.</p></div>
        <span class="chip" style="color:var(--primary)">${state.user?.plan || 'Free'}</span>
      </div>
    </div>

    <div class="card">
      <div class="card__header"><h3 class="card__title">Preferences</h3></div>
      <form id="settingsForm">
        <div class="settings-row">
          <div class="settings-row__text"><h3>Notifications</h3><p>Email alerts for errors and weekly digests.</p></div>
          <label class="toggle"><input type="checkbox" id="setNotif" ${s.notifications ? 'checked' : ''}><span class="toggle__slider"></span></label>
        </div>
        <div class="settings-row">
          <div class="settings-row__text"><h3>Auto-deploy</h3><p>Automatically redeploy bots after configuration changes.</p></div>
          <label class="toggle"><input type="checkbox" id="setAuto" ${s.autoDeploy ? 'checked' : ''}><span class="toggle__slider"></span></label>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
          <button class="btn btn--danger-ghost" type="submit" id="resetData">${ICONS.refresh} Reset local data</button>
          <button class="btn btn--primary" type="submit">${ICONS.check} Save changes</button>
        </div>
      </form>
    </div>`;
}

function planCard(key) {
  const p = CONFIG.plans[key];
  const my = key === planKey();
  const featured = key === 'pro';
  const priceLabel = p.price ? `৳${p.price}` : 'Free';
  return `<div class="card card--hover plan-card ${featured ? 'plan-card--featured' : ''}">
    <h3>${esc(p.name)}</h3>
    <div class="price">${priceLabel}<span>${p.price ? '/month' : ''}</span></div>
    <div class="plan-meta"><b>${p.maxBots === 9999 ? 'Unlimited' : p.maxBots + ' bots'}</b> · ${formatBytes(p.storage)} · ${esc(p.speed)} speed</div>
    <ul>
      <li>${ICONS.check} Up to ${p.maxBots === 9999 ? 'unlimited' : p.maxBots} bots deployed</li>
      <li>${ICONS.check} ${formatBytes(p.storage)} storage</li>
      <li>${ICONS.check} ${esc(p.speed)} execution speed</li>
      <li>${ICONS.check} Real-time logs & analytics</li>
    </ul>
    ${my ? `<span class="chip" style="justify-content:center;color:var(--success)">Current plan</span>`
      : `<button class="btn btn--block ${featured ? 'btn--primary' : 'btn--ghost'}" data-action="buy-plan" data-plan="${key}" data-price="${p.price}">${p.price ? 'Upgrade' : 'Downgrade'}</button>`}
  </div>`;
}

async function onSettingsSubmit(e) {
  e.preventDefault();
  const clickedReset = e.submitter && e.submitter.id === 'resetData';
  if (clickedReset) { resetDemoData(); return; }

  state.settings = { notifications: $('#setNotif').checked, autoDeploy: $('#setAuto').checked };
  await DB.setSettings(state.settings);
  const name = $('#profileName')?.value.trim();
  if (name) {
    await Auth.updateProfile(name);
    state.user.name = name;
    updateUserUI();
  }
  await DB.addActivity({ icon: 'settings', title: 'Settings updated', description: 'Your preferences were saved', color: 'info' });
  toast('Settings saved', 'Your preferences have been updated.', 'success');
}

/* ======================================================================
   16. CHARTS
   ====================================================================== */
function generateSeries(days, base = 100) {
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    out.push({ label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), value: Math.round(base + Math.random() * base * 1.4) });
  }
  return out;
}

function drawLineChart(canvas, data, color = '#38bdf8') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const pad = { l: 44, r: 16, t: 18, b: 30 };
  const w = W - pad.l - pad.r, h = H - pad.t - pad.b;
  const max = Math.max(...data.map(d => d.value)) * 1.15;
  const x = i => pad.l + (w * i) / (data.length - 1);
  const y = v => pad.t + h - (v / max) * h;

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.fillStyle = '#64748b'; ctx.font = '11px Inter';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const gy = pad.t + (h * g) / 4;
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(W - pad.r, gy); ctx.stroke();
    ctx.fillText(Math.round(max * (1 - g / 4)), 10, gy + 4);
  }

  ctx.beginPath();
  data.forEach((d, i) => i === 0 ? ctx.moveTo(x(0), y(d.value)) : ctx.lineTo(x(i), y(d.value)));
  ctx.lineTo(x(data.length - 1), pad.t + h); ctx.lineTo(x(0), pad.t + h); ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + h);
  grad.addColorStop(0, color + '55'); grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath();
  data.forEach((d, i) => i === 0 ? ctx.moveTo(x(0), y(d.value)) : ctx.lineTo(x(i), y(d.value)));
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 12;
  ctx.stroke(); ctx.shadowBlur = 0;

  data.forEach((d, i) => {
    ctx.beginPath(); ctx.arc(x(i), y(d.value), i === data.length - 1 ? 4 : 0, 0, 7);
    if (i === data.length - 1) { ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
  });

  ctx.fillStyle = '#64748b'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
  const step = Math.ceil(data.length / 7);
  data.forEach((d, i) => { if (i % step === 0) ctx.fillText(d.label, x(i), H - 8); });
}

function drawRequestsChart(id) {
  const canvas = $('#reqChart');
  if (!canvas) return;
  drawLineChart(canvas, generateSeries(7, 120), '#a78bfa');
  const wrap = $('#statusBreakdown');
  if (wrap) {
    const total = 240;
    wrap.innerHTML = [
      { k: '200 OK', v: 210, c: 'var(--success)' },
      { k: '400 Bad', v: 18, c: 'var(--warning)' },
      { k: '500 Error', v: 12, c: 'var(--danger)' },
    ].map(x => `
      <div style="min-width:120px">
        <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:6px"><span style="font-weight:600">${x.k}</span><span style="color:var(--text-muted)">${x.v}</span></div>
        <div class="progress"><div class="progress__bar" style="width:${Math.round(x.v / total * 100)}%;background:${x.c}"></div></div>
      </div>`).join('');
  }
}

/* ======================================================================
   17. INIT
   ====================================================================== */
function renderConnectionStatus() {
  const ok = isFirebase();
  const chip = $('#connStatus');
  if (chip) {
    chip.innerHTML = ok
      ? `<span class="chip conn-ok"><span class="conn-dot conn-dot--ok"></span> Firebase connected</span>`
      : `<span class="chip conn-local"><span class="conn-dot conn-dot--local"></span> Local demo mode</span>`;
  }

  const appBanner = $('#connBanner');
  const pubBanner = $('#publicConnBanner');
  const setupMsg = `
    <span>Running in <strong>local demo mode</strong> — data &amp; logins are stored only in this browser.
    Connect a real backend by adding your Firebase config in <code>script.js</code>.</span>`;

  if (appBanner) { appBanner.innerHTML = ok ? '' : setupMsg; appBanner.hidden = ok; }
  if (pubBanner) { pubBanner.innerHTML = ok ? '' : setupMsg; pubBanner.hidden = ok; }
}

async function init() {
  initFirebase();
  state.settings = await DB.getSettings();
  state.siteConfig = await DB.getSiteConfig();

  state.user = await Auth.current();
  if (state.user) {
    try {
      state.bots = await DB.selectBots();
      state.activity = await DB.selectActivity();
      state.logs = await DB.selectLogs();
      state.settings = await DB.getSettings();
    } catch (e) {
      toast('Could not load data', e.message, 'error');
    }
  }

  updateUserUI();
  updateNavCount();
  bindGlobalEvents();
  renderConnectionStatus();
  await updateAdminBadge();

  handleHash();

  const observeCharts = () => renderChartsIfPresent();
  new MutationObserver(observeCharts).observe(document.body, { childList: true, subtree: true });
}

function renderChartsIfPresent() {
  const analytics = $('#analyticsChart');
  if (analytics && !analytics.dataset.done) { drawLineChart(analytics, generateSeries(14, 160), '#38bdf8'); analytics.dataset.done = '1'; }
  const req = $('#reqChart');
  if (req && !req.dataset.done) { drawRequestsChart(state.currentBotId); req.dataset.done = '1'; }
}

document.addEventListener('DOMContentLoaded', init);

/* ======================================================================
   18. SUBSCRIPTION PURCHASE
   ====================================================================== */
function openPurchaseModal(planKey, price) {
  const p = CONFIG.plans[planKey];
  if (!p) return;

  const body = `
    <div class="field">
      <label>Selected plan</label>
      <div class="chip" style="font-size:.9rem">${esc(p.name)} — ${p.price ? '৳' + p.price + ' / month' : 'Free'}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
      <div class="pay-number">
        <div>
          <div class="pay-number__label">📱 bKash</div>
          <div class="pay-number__value">${esc(p.bKash || 'N/A')}</div>
        </div>
        <button class="btn btn--sm btn--ghost" data-copy="${p.bKash || ''}">${ICONS.copy}</button>
      </div>
      <div class="pay-number" style="border-color:rgba(255,107,53,0.4)">
        <div>
          <div class="pay-number__label">📱 Nagad</div>
          <div class="pay-number__value">${esc(p.nagad || 'N/A')}</div>
        </div>
        <button class="btn btn--sm btn--ghost" data-copy="${p.nagad || ''}">${ICONS.copy}</button>
      </div>
    </div>

    <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:6px">Steps:</p>
    <ol class="pay-steps">
      <li>Send <b>৳${p.price}</b> to either bKash or Nagad number above.</li>
      <li>After payment, copy the <b>Transaction ID (TrxID)</b> from your app.</li>
      <li>Paste the TrxID below and submit. Admin will verify and activate.</li>
    </ol>
    <div class="field">
      <label>Transaction ID (TrxID)</label>
      <input class="input" id="trxId" placeholder="e.g. 9HK7XK8Q2D" required />
      <div class="hint">Your order goes to the admin as <b>pending</b> for verification.</div>
    </div>`;

  openModal(`Upgrade to ${esc(p.name)}`, body, {
    footerHTML: `
      <button class="btn btn--ghost" data-close-modal>Cancel</button>
      <button class="btn btn--primary" id="submitOrder">${ICONS.check} Submit order</button>`,
    onOpen: () => {
      $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
        const val = btn.dataset.copy;
        await copyToClipboard(val);
        toast('Copied', val, 'success');
      }));
      $('#submitOrder').addEventListener('click', async () => {
        const trx = $('#trxId').value.trim();
        if (!trx) { toast('Enter TrxID', 'Please enter your transaction ID.', 'warning'); return; }
        const order = {
          id: 'ord_' + Date.now().toString(36),
          userEmail: state.user.email,
          userName: state.user.name,
          plan: planKey,
          amount: p.price,
          trxId: trx,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        await DB.insertOrder(order);
        await DB.addActivity({ icon: 'bell', title: `Order submitted for ${p.name}`, description: `TrxID ${trx} — awaiting admin approval`, color: 'warning' });
        closeModal();
        toast('Order submitted 🎉', 'Your payment is pending admin verification.', 'success');
      });
    },
  });
}

function openUpgradePrompt() {
  const cp = currentPlan();
  openModal('Bot limit reached', `
    <div style="text-align:center;padding:6px 0">
      <div style="width:60px;height:60px;margin:0 auto 14px;border-radius:18px;background:rgba(251,191,36,.12);display:grid;place-items:center;color:var(--warning)">${ICONS.bolt}</div>
      <p style="color:var(--text-muted);font-size:.92rem">Your <b style="color:var(--text)">${esc(cp.name)}</b> plan allows up to <b style="color:var(--text)">${cp.maxBots === 9999 ? 'unlimited' : cp.maxBots} bots</b>. Upgrade to deploy more.</p>
    </div>`, {
    footerHTML: `
      <button class="btn btn--ghost" data-close-modal>Cancel</button>
      <button class="btn btn--primary" id="goUpgrade">${ICONS.sparkle} View plans</button>`,
    onOpen: () => {
      $('#goUpgrade').addEventListener('click', () => { closeModal(); navigate('settings'); });
    },
  });
}

async function setOrderStatus(id, status) {
  const orders = await DB.selectAllOrders();
  const order = orders.find(o => o.id === id);
  await DB.updateOrder(id, { status, approvedAt: status === 'approved' ? new Date().toISOString() : null });
  if (status === 'approved' && order) {
    try { await Auth.setPlan(order.userEmail, order.plan); } catch (e) { /* ignore */ }
  }
  await DB.addAuditLog(`order_${status}`, 'order', id, { order, status });
  await DB.addActivity({ icon: 'shield', title: `Order ${status}`, description: `Order ${id} was ${status}`, color: status === 'approved' ? 'success' : 'danger' });
  toast(status === 'approved' ? 'Order approved' : 'Order cancelled', `Order ${id} is now ${status}.`, status === 'approved' ? 'success' : 'error');
  await renderAdmin();
}

function resetDemoData() {
  openModal('Reset local data', `
    <p style="color:var(--text-muted);font-size:.92rem">This clears all bots, activity, logs, orders and settings stored in this browser (local demo mode). It will <b>not</b> touch Firebase data.</p>`, {
    footerHTML: `
      <button class="btn btn--ghost" data-close-modal>Cancel</button>
      <button class="btn btn--danger-ghost" id="confirmReset">${ICONS.trash} Reset everything</button>`,
    onOpen: () => {
      $('#confirmReset').addEventListener('click', () => {
        if (isFirebase()) { closeModal(); toast('Firebase connected', 'Reset is disabled in connected mode.', 'info'); return; }
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
        closeModal();
        toast('Data reset', 'Local data cleared. Reloading…', 'success');
        setTimeout(() => location.reload(), 700);
      });
    },
  });
}

/* ======================================================================
   19. ADMIN PANEL
   ====================================================================== */
async function loadOrders() {
  try { return await DB.selectAllOrders(); } catch { return []; }
}

function openAdminGate() {
  openModal('Secure Admin Access', `
    <div style="text-align:center;padding:6px 0">
      <div style="width:64px;height:64px;margin:0 auto 16px;border-radius:20px;background:rgba(52,211,153,.12);display:grid;place-items:center;color:var(--admin-accent,#34d399)">${ICONS.shield}</div>
      <p style="color:var(--text-muted);font-size:.92rem;margin-bottom:8px">Enter the secret admin code to continue.</p>
    </div>
    <div class="field">
      <input class="input" id="adminCodeInput" type="password" placeholder="Enter admin code" autocomplete="off" />
      <div class="hint">Press <b style="color:var(--text-muted)">Ctrl+Shift+A</b> anywhere to reopen.</div>
    </div>`, {
    footerHTML: `
      <button class="btn btn--ghost" data-close-modal>Cancel</button>
      <button class="btn btn--primary" id="adminEnterBtn">${ICONS.shield} Enter Admin</button>`,
    onOpen: () => {
      const enter = () => {
        const code = $('#adminCodeInput').value.trim();
        if (code !== CONFIG.admin.adminCode) { toast('Wrong code', 'That admin code is not correct.', 'error'); return; }
        closeModal();
        enterAdminMode();
      };
      $('#adminEnterBtn').addEventListener('click', enter);
      $('#adminCodeInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') enter(); });
    },
  });
}

async function enterAdminMode() {
  state.adminMode = true;
  $('#publicLayout').hidden = true;
  $('#appShell').hidden = true;
  $('#adminShell').hidden = false;
  $$('#adminNav .admin-nav-item').forEach((b, i) => b.classList.toggle('active', i === 0));
  await renderAdmin();
  window.scrollTo(0, 0);
}

function exitAdminMode() {
  state.adminMode = false;
  $('#adminShell').hidden = true;
  if (state.user) navigate('dashboard');
  else navigate('home');
}

async function renderAdmin() {
  const active = $('#adminNav .admin-nav-item.active');
  const tab = active ? active.dataset.atab : 'overview';
  const area = $('#adminContent');
  if (area) area.innerHTML = await renderAdminTab(tab);
  await updateAdminBadge();
  bindAdminShell();
}

async function renderAdminTab(tab) {
  if (tab === 'overview') return await renderAdminOverview();
  if (tab === 'orders') return await renderAdminOrders();
  if (tab === 'users') return await renderAdminUsers();
  if (tab === 'bots') return await renderAdminBots();
  if (tab === 'plans') return renderAdminPlans();
  if (tab === 'system') return await renderAdminSystem();
  if (tab === 'audit') return await renderAdminAudit();
  if (tab === 'export') return renderAdminExport();
  return '';
}

async function renderAdminOverview() {
  const orders = await loadOrders();
  const pending = orders.filter(o => o.status === 'pending').length;
  const approved = orders.filter(o => o.status === 'approved').length;
  const users = await DB.selectUsers();
  const allBots = await DB.selectAllBots();
  const totalBots = allBots.length;
  const activeBots = allBots.filter(b => b.status === 'active').length;
  const totalRevenue = approved * 499;

  return `
    <div class="page-header">
      <div><h1>Overview</h1><p>Platform-wide summary for admins only.</p></div>
      <div class="page-header__actions"><button class="btn btn--ghost" id="refreshAdmin">${ICONS.refresh} Refresh</button></div>
    </div>

    <div class="admin-statbar">
      <div class="card admin-stat"><b>${users.length}</b><span>Registered users</span></div>
      <div class="card admin-stat"><b>${totalBots}</b><span>Total bots</span></div>
      <div class="card admin-stat"><b>${activeBots}</b><span>Bots running</span></div>
      <div class="card admin-stat"><b style="color:var(--warning)">${pending}</b><span>Pending orders</span></div>
      <div class="card admin-stat"><b style="color:var(--success)">${approved}</b><span>Approved</span></div>
      <div class="card admin-stat"><b style="color:var(--success)">৳${totalRevenue}</b><span>Est. revenue</span></div>
    </div>`;
}

async function renderAdminOrders() {
  const orders = await loadOrders();
  if (!orders.length) return `<div class="empty-state"><div class="empty-state__icon">${ICONS.bell}</div><h3>No orders yet</h3></div>`;
  return `<div style="display:flex;flex-direction:column">${orders.map(o => {
    const st = o.status;
    return `<div class="order-row">
      <div class="order-row__main">
        <b>${esc(o.userName || 'User')} · <span style="color:var(--primary)">${esc(o.plan)}</span></b>
        <span>${esc(o.userEmail || '')} · TrxID <code class="oid">${esc(o.trxId || '—')}</code></span>
        <div><span class="oid">${esc(o.id)} · ${new Date(o.createdAt).toLocaleString()}</span></div>
      </div>
      <div class="order-row__amount">৳${o.amount}</div>
      <span class="badge badge--${st === 'approved' ? 'approved' : st === 'cancelled' ? 'cancelled' : 'pending'}">${st}</span>
      ${st === 'pending' ? `<div class="order-row__actions">
        <button class="btn btn--success btn--sm" data-action="approve-order" data-id="${o.id}">${ICONS.check} Approve</button>
        <button class="btn btn--danger-ghost btn--sm" data-action="cancel-order" data-id="${o.id}">${ICONS.x} Cancel</button>
      </div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

async function renderAdminUsers() {
  const users = await DB.selectUsers();
  if (!users.length) return `<div class="empty-state"><div class="empty-state__icon">${ICONS.dashboard}</div><h3>No users yet</h3></div>`;
  return `<div style="display:flex;flex-direction:column">${users.map(u => {
    const bc = state.bots.filter(b => b.userId === u.id).length;
    const pc = CONFIG.plans[u.plan] || CONFIG.plans.free;
    return `<div class="order-row">
      <div class="order-row__main">
        <b>${esc(u.name || 'User')}</b>
        <span>${esc(u.email)} · joined ${new Date(u.createdAt).toLocaleDateString()}</span>
        <span class="chip" style="font-size:.7rem">${u.role || 'user'}</span>
      </div>
      <select class="select admin-plan-select" data-email="${esc(u.email)}" style="width:auto;padding:7px 34px 7px 12px;font-size:.82rem">
        ${Object.keys(CONFIG.plans).map(k => `<option value="${k}" ${u.plan === k ? 'selected' : ''}>${CONFIG.plans[k].name}</option>`).join('')}
      </select>
      <select class="select admin-role-select" data-email="${esc(u.email)}" style="width:auto;padding:7px 34px 7px 12px;font-size:.82rem">
        <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
      </select>
      <span style="font-size:.82rem;color:var(--text-muted)">${bc} / ${pc.maxBots === 9999 ? '∞' : pc.maxBots} bots</span>
    </div>`;
  }).join('')}</div>`;
}

async function renderAdminBots() {
  const allBots = await DB.selectAllBots();
  if (!allBots.length) return `<div class="empty-state"><div class="empty-state__icon">${ICONS.bot}</div><h3>No bots yet</h3></div>`;
  return `<div class="table-wrap card"><table class="bot-table">
    <thead><tr><th>Bot</th><th>Owner</th><th class="bot-table__hide-mobile">Status</th><th class="bot-table__hide-mobile">Runtime</th><th class="bot-table__hide-mobile">Code</th></tr></thead>
    <tbody>${allBots.map(b => `<tr>
      <td class="bot-name-cell"><div class="bot-avatar" style="background:${avatarColor(b.id)};width:34px;height:34px;border-radius:10px;font-size:.8rem">${initials(b.name)}</div>
        <div><strong>${esc(b.name)}</strong><span>${esc(b.username || '')}</span></div></td>
      <td style="font-size:.82rem;color:var(--text-muted)">${esc(b.userId || '—')}</td>
      <td class="bot-table__hide-mobile"><span class="chip chip--dot status--${b.status}">${b.status}</span></td>
      <td class="bot-table__hide-mobile"><span class="chip">${b.language}</span></td>
      <td class="bot-table__hide-mobile"><button class="btn btn--ghost btn--sm" data-action="admin-view-code" data-id="${b.id}">View</button></td>
    </tr>`).join('')}</tbody></table></div>`;
}

function renderAdminPlans() {
  return `<div class="plan-grid">
    ${Object.keys(CONFIG.plans).map(k => {
      const p = CONFIG.plans[k];
      return `<div class="card card--hover plan-card">
        <h3>${esc(p.name)}</h3>
        <div class="price">${p.price ? '৳' + p.price : 'Free'}<span>${p.price ? '/month' : ''}</span></div>
        <div class="plan-meta"><b>${p.maxBots === 9999 ? 'Unlimited' : p.maxBots + ' bots'}</b> · ${formatBytes(p.storage)} · ${esc(p.speed)}</div>
        <div class="plan-meta" style="color:var(--admin-accent)">bKash: <b>${esc(p.bKash || 'Not set')}</b></div>
        <div class="plan-meta" style="color:#ff6b35">Nagad: <b>${esc(p.nagad || 'Not set')}</b></div>
      </div>`;
    }).join('')}
  </div>`;
}

async function renderAdminSystem() {
  const config = await DB.getSiteConfig();
  return `
    <div class="page-header"><div><h1>System Settings</h1></div></div>
    <div class="card">
      <form id="systemForm">
        <div class="settings-row">
          <div class="settings-row__text"><h3>Site Name</h3><p>Displayed in the browser tab and header.</p></div>
          <input class="input" id="siteName" value="${esc(config.siteName || 'BotHost')}" style="max-width:240px" />
        </div>
        <div class="settings-row">
          <div class="settings-row__text"><h3>Maintenance Mode</h3><p>When enabled, only admins can access the site.</p></div>
          <label class="toggle"><input type="checkbox" id="maintenanceMode" ${config.maintenanceMode ? 'checked' : ''}><span class="toggle__slider"></span></label>
        </div>
        <div class="settings-row">
          <div class="settings-row__text"><h3>Registration Enabled</h3><p>Allow new users to sign up.</p></div>
          <label class="toggle"><input type="checkbox" id="registrationEnabled" ${config.registrationEnabled !== false ? 'checked' : ''}><span class="toggle__slider"></span></label>
        </div>
        <div class="settings-row">
          <div class="settings-row__text"><h3>Default Plan</h3><p>Plan assigned to new users.</p></div>
          <select class="select" id="defaultPlan" style="max-width:200px">
            ${Object.keys(CONFIG.plans).map(k => `<option value="${k}" ${config.defaultPlan === k ? 'selected' : ''}>${CONFIG.plans[k].name}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
          <button class="btn btn--primary" type="submit">${ICONS.check} Save system settings</button>
        </div>
      </form>
    </div>`;
}

async function renderAdminAudit() {
  const logs = await DB.selectAuditLogs();
  if (!logs.length) return `<div class="empty-state"><div class="empty-state__icon">📋</div><h3>No audit logs yet</h3></div>`;
  return `<div class="table-wrap card"><table class="bot-table">
    <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
    <tbody>${logs.map(l => `<tr>
      <td style="font-size:.78rem;color:var(--text-muted)">${new Date(l.createdAt).toLocaleString()}</td>
      <td style="font-size:.82rem">${esc(l.adminId || '—')}</td>
      <td><span class="chip">${esc(l.action)}</span></td>
      <td style="font-size:.82rem">${esc(l.targetType || '')} ${esc(l.targetId || '')}</td>
      <td style="font-size:.78rem;color:var(--text-muted)">${esc(JSON.stringify(l.details || {}).slice(0, 60))}</td>
    </tr>`).join('')}</tbody></table></div>`;
}

function renderAdminExport() {
  return `
    <div class="page-header"><div><h1>Export Data</h1><p>Download platform data as CSV or JSON.</p></div></div>
    <div class="dash-grid" style="grid-template-columns:1fr 1fr 1fr">
      <div class="card card--hover" style="text-align:center;padding:30px">
        <div style="font-size:2rem;margin-bottom:12px">👥</div>
        <h3>Users</h3>
        <p style="color:var(--text-muted);font-size:.85rem">Export all registered users</p>
        <button class="btn btn--primary" id="exportUsers">${ICONS.download} Export CSV</button>
      </div>
      <div class="card card--hover" style="text-align:center;padding:30px">
        <div style="font-size:2rem;margin-bottom:12px">📦</div>
        <h3>Orders</h3>
        <p style="color:var(--text-muted);font-size:.85rem">Export all subscription orders</p>
        <button class="btn btn--primary" id="exportOrders">${ICONS.download} Export CSV</button>
      </div>
      <div class="card card--hover" style="text-align:center;padding:30px">
        <div style="font-size:2rem;margin-bottom:12px">🤖</div>
        <h3>Bots</h3>
        <p style="color:var(--text-muted);font-size:.85rem">Export all bots</p>
        <button class="btn btn--primary" id="exportBots">${ICONS.download} Export CSV</button>
      </div>
    </div>`;
}

function bindAdminShell() {
  $('#adminExitBtn').addEventListener('click', exitAdminMode);
  $$('#adminNav .admin-nav-item').forEach(btn => btn.addEventListener('click', async () => {
    $$('#adminNav .admin-nav-item').forEach(x => x.classList.toggle('active', x === btn));
    await renderAdmin();
  }));
  $('#refreshAdmin')?.addEventListener('click', async () => { toast('Refreshing', 'Reloading admin data…', 'info'); await renderAdmin(); });

  $$('#adminContent .admin-plan-select').forEach(sel => sel.addEventListener('change', async () => {
    const email = sel.dataset.email;
    await Auth.setPlan(email, sel.value);
    await DB.addAuditLog('plan_change', 'user', email, { newPlan: sel.value });
    await DB.addActivity({ icon: 'shield', title: 'Plan changed by admin', description: `${email} → ${sel.value}`, color: 'info' });
    toast('Plan updated', `${email} is now on ${CONFIG.plans[sel.value].name}.`, 'success');
  }));

  $$('#adminContent .admin-role-select').forEach(sel => sel.addEventListener('change', async () => {
    const email = sel.dataset.email;
    await Auth.setRole(email, sel.value);
    await DB.addAuditLog('role_change', 'user', email, { newRole: sel.value });
    await DB.addActivity({ icon: 'shield', title: 'Role changed by admin', description: `${email} → ${sel.value}`, color: 'info' });
    toast('Role updated', `${email} is now ${sel.value}.`, 'success');
  }));

  const sysForm = $('#systemForm');
  if (sysForm) {
    sysForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const config = {
        siteName: $('#siteName').value.trim() || 'BotHost',
        maintenanceMode: $('#maintenanceMode').checked,
        registrationEnabled: $('#registrationEnabled').checked,
        defaultPlan: $('#defaultPlan').value,
        updatedAt: new Date().toISOString()
      };
      await DB.setSiteConfig(config);
      state.siteConfig = config;
      await DB.addAuditLog('system_update', 'system', 'config', config);
      toast('System settings saved', 'Configuration updated.', 'success');
    });
  }

  $('#exportUsers')?.addEventListener('click', async () => {
    const users = await DB.selectUsers();
    const csv = ['Name,Email,Plan,Role,CreatedAt', ...users.map(u => `${u.name || ''},${u.email},${u.plan || 'free'},${u.role || 'user'},${u.createdAt || ''}`)].join('\n');
    downloadFile(csv, 'users.csv', 'text/csv');
    toast('Exported', 'Users exported as CSV.', 'success');
  });

  $('#exportOrders')?.addEventListener('click', async () => {
    const orders = await loadOrders();
    const csv = ['ID,User,Plan,Amount,TrxID,Status,CreatedAt', ...orders.map(o => `${o.id},${o.userEmail},${o.plan},${o.amount},${o.trxId},${o.status},${o.createdAt}`)].join('\n');
    downloadFile(csv, 'orders.csv', 'text/csv');
    toast('Exported', 'Orders exported as CSV.', 'success');
  });

  $('#exportBots')?.addEventListener('click', async () => {
    const bots = await DB.selectAllBots();
    const csv = ['ID,Name,Username,Language,Status,CreatedAt,UserId', ...bots.map(b => `${b.id},${b.name},${b.username || ''},${b.language},${b.status},${b.createdAt},${b.userId}`)].join('\n');
    downloadFile(csv, 'bots.csv', 'text/csv');
    toast('Exported', 'Bots exported as CSV.', 'success');
  });

  $$('#adminContent [data-action="admin-view-code"]').forEach(btn => btn.addEventListener('click', () => {
    const bot = state.bots.find(b => b.id === btn.dataset.id);
    if (!bot) return;
    openModal(`Code — ${bot.name}`, `<div style="font-family:var(--mono);font-size:.78rem;color:var(--text-faint);margin-bottom:8px">${bot.language === 'python' ? 'handler.py' : 'handler.js'}</div><pre class="code-block" style="margin:0;max-height:60vh;overflow:auto;white-space:pre-wrap">${esc(bot.code || '(empty)')}</pre>`, { size: 'modal--lg' });
  }));
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ======================================================================
   GLOBAL DELEGATED EVENTS
   ====================================================================== */
document.addEventListener('click', (e) => {
  const buy = e.target.closest('[data-action="buy-plan"]');
  if (buy) { openPurchaseModal(buy.dataset.plan, buy.dataset.price); return; }
  const approve = e.target.closest('[data-action="approve-order"]');
  if (approve) { setOrderStatus(approve.dataset.id, 'approved'); return; }
  const cancel = e.target.closest('[data-action="cancel-order"]');
  if (cancel) { setOrderStatus(cancel.dataset.id, 'cancelled'); return; }
});

document.addEventListener('click', (e) => {
  const exportBtn = e.target.closest('#exportLogs');
  if (!exportBtn) return;
  const lines = state.logs.map(l => `[${new Date(l.time).toISOString()}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
  downloadFile(lines, 'bothost-logs.txt', 'text/plain');
  toast('Logs exported', 'Downloaded as bothost-logs.txt', 'success');
});

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    if (state.adminMode) return;
    openAdminGate();
  }
});

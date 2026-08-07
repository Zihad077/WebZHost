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
let integrationMode = 'local'; // 'firebase' | 'local'

function initFirebase() {
  try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    // Enable offline persistence
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

/* ======================================================================
   1. ICONS (same as before — omitted for brevity, copy from your original)
   ====================================================================== */
// ... (your existing ICONS object — unchanged)

/* ======================================================================
   2. UTILITIES (same as before — copy from your original)
   ====================================================================== */
// ... (your existing $, $$, esc, uid, timeAgo, formatNumber, formatBytes, copyToClipboard, initials, avatarColor — unchanged)

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

  // --- Site Config (admin only) ---
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
      const ip = 'server-side'; // Will be set server-side in production
      await db.collection('auditLogs').add({
        adminId: uid,
        action,
        targetType,
        targetId,
        details,
        ipAddress: ip,
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
   3b. AUTH LAYER — Firebase Auth / local fallback
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
   5. UI PRIMITIVES — Toast, Modal, Loading (same as before)
   ====================================================================== */
// ... (copy your existing toast, openModal, closeModal, showLoading, simulate functions)

/* ======================================================================
   6. ROUTER (same as before — unchanged)
   ====================================================================== */
// ... (copy your existing navigate, renderPublic, renderApp, updateBreadcrumb, handleHash functions)

/* ======================================================================
   7. EVENT BINDING (same as before — unchanged)
   ====================================================================== */
// ... (copy your existing bindGlobalEvents, bindPageEvents functions)

/* ======================================================================
   8. AUTH (updated for Firebase)
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

/* ======================================================================
   9. BOT CRUD + ACTIONS (same as before — unchanged)
   ====================================================================== */
// ... (copy your existing makeWebhook, createBotObject, onCreateBot, onEditBot, onBotAction, onPublicAction, toggleBot, duplicateBot, copyBotToken, copyWebhook, openEditModal, openDeleteModal, addEnvRow, languageOptions, codeEditorHTML, wireLanguageTemplate)

/* ======================================================================
   10. RENDER HELPERS (same as before — unchanged)
   ====================================================================== */
// ... (copy your existing updateUserUI, updateAdminBadge, updateNavCount, botRowHTML, renderBotList)

/* ======================================================================
   11. PAGES — PUBLIC (same as before — unchanged)
   ====================================================================== */
// ... (copy your existing pageHome, featureCard, faqItem, pageLogin, pageRegister, pageDocs)

/* ======================================================================
   12. PAGES — APP (same as before — unchanged)
   ====================================================================== */
// ... (copy your existing computeStats, pageDashboard, activityItem, pageMyBots, pageCreateBot, pageBotDetails, renderDetailTab, bindEnvActions, wireDetailCode)

/* ======================================================================
   13. ANALYTICS (same as before — unchanged)
   ====================================================================== */
// ... (copy your existing pageAnalytics, generateSeries, drawLineChart, drawRequestsChart)

/* ======================================================================
   14. LOGS (same as before — unchanged)
   ====================================================================== */
// ... (copy your existing pageLogs, renderLogs, renderLogLines)

/* ======================================================================
   15. SETTINGS (updated with both bKash and Nagad)
   ====================================================================== */
function pageSettings() {
  const s = state.settings;
  const myKey = planKey();
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
   16. CHARTS (same as before — unchanged)
   ====================================================================== */
// ... (copy your existing generateSeries, drawLineChart, drawRequestsChart)

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
   18. SUBSCRIPTION PURCHASE (bKash + Nagad)
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
   19. ADMIN PANEL — Enhanced with System, Audit, Export
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
  const totalRevenue = approved * 499; // estimate

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

/* Bind admin-shell interactions */
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

  // System form
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

  // Export buttons
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
   GLOBAL DELEGATED EVENTS (placed at the end)
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

// Keyboard shortcut for admin
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    if (state.adminMode) return;
    openAdminGate();
  }
});

/* ======================================================================
   MAKE SURE ALL MISSING FUNCTIONS ARE COPIED FROM YOUR ORIGINAL SCRIPT
   ====================================================================== */
// IMPORTANT: You must copy these from your original script.js:
// - ICONS object (all SVG icons)
// - $, $$, esc, uid, timeAgo, formatNumber, formatBytes, copyToClipboard, initials, avatarColor
// - toast, openModal, closeModal, showLoading, simulate
// - navigate, renderPublic, renderApp, updateBreadcrumb, handleHash
// - bindGlobalEvents, bindPageEvents
// - validatePasswordMatch
// - makeWebhook, createBotObject, onCreateBot, onEditBot, onBotAction, onPublicAction, toggleBot, duplicateBot, copyBotToken, copyWebhook, openEditModal, openDeleteModal, addEnvRow, languageOptions, codeEditorHTML, wireLanguageTemplate
// - updateUserUI, updateAdminBadge, updateNavCount, botRowHTML, renderBotList
// - pageHome, featureCard, faqItem, pageLogin, pageRegister, pageDocs
// - computeStats, pageDashboard, activityItem, pageMyBots, pageCreateBot, pageBotDetails, renderDetailTab, bindEnvActions, wireDetailCode
// - pageAnalytics, generateSeries, drawLineChart, drawRequestsChart
// - pageLogs, renderLogs, renderLogLines
// - planKey, currentPlan, isAdminUser

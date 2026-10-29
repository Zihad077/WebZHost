const API = (window.WEBZ_API || '').replace(/\/$/, ''), $ = s => document.querySelector(s), root = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let cfg, devToken = sessionStorage.getItem('wz_dev'), fb = null, dirty = false;
const toast = (m, bad) => { const d = document.createElement('div'); d.textContent = m; if (bad) d.style.borderColor = 'var(--er)'; $('#toast').append(d); setTimeout(() => d.remove(), 5000); };
const theme = t => { document.documentElement.dataset.theme = t; localStorage.setItem('wz_theme', t); };
theme(localStorage.getItem('wz_theme') || 'dark');
const tok = async () => cfg.authMode === 'dev' ? 'dev:' + devToken : await fb.user.getIdToken();

async function api(p, o = {}, raw) {
  const r = await fetch(API + '/api' + p, { ...o, headers: { ...(o.headers || {}), Authorization: 'Bearer ' + await tok() } });
  if (raw && r.ok) return r;
  const b = (r.headers.get('content-type') || '').includes('json') ? await r.json() : {};
  if (!r.ok) throw Object.assign(new Error(b.error || r.statusText), { status: r.status, body: b });
  return b;
}
const act = async (fn, ok) => { try { const r = await fn(); if (ok) toast(ok); return r; } catch (e) { toast(e.message, true); } };
const download = async (p, name) => { const r = await api(p, {}, true); const u = URL.createObjectURL(await r.blob()); Object.assign(document.createElement('a'), { href: u, download: name }).click(); URL.revokeObjectURL(u); };
const findings = a => (a?.findings || []).map(f => `<div class="li"><span class="${f.level}">${esc(f.level.toUpperCase())}</span><span>${esc(f.message)}</span></div>`).join('') || '<div class="info">No problems found.</div>';
const shell = (nav, body) => root.innerHTML = `<nav><b>WebZHost</b>${[['#/', 'Dashboard'], ['#/projects', 'Projects'], ['#/new', 'New project'], ['#/docs', 'Docs']].map(([h, t]) => `<a href="${h}" class="${nav === h ? 'on' : ''}">${t}</a>`).join('')}<span class="sp"></span><button class="sec" id="th">Theme</button><button class="sec" id="lo">Sign out</button></nav><main>${body}</main>`;

function login() {
  const fbMode = cfg.authMode === 'firebase';
  root.innerHTML = `<form class="card login" id="lf"><h1>WebZHost</h1>${fbMode ? '<input name="e" type="email" placeholder="Email" required autocomplete="username"><input name="p" type="password" placeholder="Password" required minlength="6" autocomplete="current-password">' : '<p class="info">Dev mode: pick any name. Not for production.</p><input name="e" placeholder="Name" required pattern="[\\w.\\-]{1,40}">'}<div class="row"><button>Sign in</button>${fbMode ? '<button type="button" class="sec" id="reg">Create account</button>' : ''}</div></form>`;
  const go = async (create) => {
    const f = $('#lf'); if (!f.reportValidity()) return;
    const { e, p } = Object.fromEntries(new FormData(f));
    if (!fbMode) { devToken = e; sessionStorage.setItem('wz_dev', e); return route(); }
    await act(async () => { const a = fb.m; await (create ? a.createUserWithEmailAndPassword : a.signInWithEmailAndPassword)(fb.auth, e, p); });
  };
  $('#lf').onsubmit = e => { e.preventDefault(); go(false); }; if (fbMode) $('#reg').onclick = () => go(true);
}

async function pDash() {
  const ps = await api('/projects'), bad = ps.filter(p => p.errors).length;
  shell('#/', `<h1>Dashboard</h1>${cfg.runtime.available ? '' : '<div class="card warning">No execution server is connected. Projects can be stored, edited, checked and backed up, but not started. See Docs.</div>'}
  <div class="grid"><div class="card"><div class="n">${ps.length}</div>Projects</div><div class="card"><div class="n">${bad}</div>With errors</div><div class="card"><div class="n">${ps.length - bad}</div>Ready to deploy</div></div>
  <h2>Recent</h2><div class="card">${ps.slice(0, 5).map(p => `<div class="li"><a href="#/p/${p.id}">${esc(p.name)}</a><span class="tag">${esc(p.type)}</span><span class="sp"></span><span class="info">${esc(new Date(p.updatedAt).toLocaleString())}</span></div>`).join('') || 'No projects yet. <a href="#/new">Create one</a>.'}</div>`);
}
async function pList() {
  const ps = await api('/projects'); let q = '', sort = 'new', page = 0;
  const draw = () => {
    let l = ps.filter(p => p.name.toLowerCase().includes(q.toLowerCase())); if (sort === 'name') l = [...l].sort((a, b) => a.name.localeCompare(b.name));
    const pages = Math.max(1, Math.ceil(l.length / 10)); page = Math.min(page, pages - 1);
    $('#list').innerHTML = l.slice(page * 10, page * 10 + 10).map(p => `<div class="li"><a href="#/p/${p.id}">${esc(p.name)}</a><span class="tag">${esc(p.type)}</span>${p.errors ? `<span class="tag error">${p.errors} errors</span>` : ''}</div>`).join('') || '<div class="info">No projects found.</div>';
    $('#pg').textContent = `Page ${page + 1} of ${pages}`;
  };
  shell('#/projects', `<h1>Projects</h1><div class="row"><input id="q" placeholder="Search" aria-label="Search"><select id="so" aria-label="Sort"><option value="new">Newest</option><option value="name">Name</option></select><span class="sp"></span><button class="sec" id="pv">Prev</button><span id="pg"></span><button class="sec" id="nx">Next</button></div><div class="card" id="list"></div>`);
  $('#q').oninput = e => { q = e.target.value; page = 0; draw(); }; $('#so').onchange = e => { sort = e.target.value; draw(); };
  $('#pv').onclick = () => { page = Math.max(0, page - 1); draw(); }; $('#nx').onclick = () => { page++; draw(); }; draw();
}
async function pNew() {
  const tpls = await api('/templates');
  shell('#/new', `<h1>New project</h1><form class="card" id="zf"><h3>Upload ZIP</h3><div class="row"><input name="name" placeholder="Project name" required><input name="file" type="file" accept=".zip" required></div><button>Upload and check</button><div id="res"></div><p class="info">Max ${cfg.maxUploadMB} MB. The ZIP is checked, never run.</p></form>
  <form class="card" id="tf"><h3>From template</h3><div class="row"><input name="name" placeholder="Project name" required><select name="t">${tpls.map(t => `<option value="${esc(t.id)}">${esc(t.label)}</option>`).join('')}</select></div><button>Create</button></form>`);
  const done = r => { location.hash = '#/p/' + r.meta.id; };
  $('#zf').onsubmit = async e => { e.preventDefault(); const d = new FormData(e.target), f = d.get('file');
    try { done(await api('/projects?name=' + encodeURIComponent(d.get('name')), { method: 'POST', body: f, headers: { 'Content-Type': 'application/zip' } })); }
    catch (er) { toast(er.message, true); $('#res').innerHTML = findings(er.body?.analysis); } };
  $('#tf').onsubmit = async e => { e.preventDefault(); const d = new FormData(e.target); const r = await act(() => api(`/projects?name=${encodeURIComponent(d.get('name'))}&template=${d.get('t')}`, { method: 'POST' })); if (r) done(r); };
}

async function pProject(id, tab = 'overview') {
  const m = await api('/projects/' + id), T = ['overview', 'files', 'health', 'logs', 'backups'];
  const head = `<h1>${esc(m.name)} <span class="tag">${esc(m.type)}</span> <span class="tag">${esc(m.runtime.state)}</span></h1><div class="tabs">${T.map(t => `<a href="#/p/${id}/${t}" class="${t === tab ? 'on' : ''}">${t}</a>`).join('')}</div>`;
  shell('#/projects', head + '<div id="tab"></div>'); const el = $('#tab');
  if (tab === 'overview') {
    el.innerHTML = `<div class="card"><div class="li"><span>Start command</span><span class="sp"></span><code>${esc(m.startCommand || 'not detected')}</code></div><div class="li"><span>Created</span><span class="sp"></span>${esc(new Date(m.createdAt).toLocaleString())}</div><div class="li"><span>Checks</span><span class="sp"></span>${m.errors} errors, ${m.warnings} warnings</div></div>
    <div class="row"><button data-a="start">Start</button><button class="sec" data-a="stop">Stop</button><button class="sec" data-a="restart">Restart</button><span class="sp"></span><button class="sec" id="rn">Rename</button><button class="sec" id="ex">Export ZIP</button><button class="dan" id="dl">Delete</button></div>
    ${m.runtimeAvailable ? '' : '<p class="warning">Start, stop and restart need an execution server (not connected).</p>'}<h3>Deployments</h3><div class="card">${m.deployments.map(d => `<div class="li"><span class="tag">${esc(d.status)}</span><span>${esc(d.note)}</span><span class="sp"></span><span class="info">${esc(new Date(d.at).toLocaleString())}</span></div>`).join('')}</div>`;
    el.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => { const r = await act(() => api(`/projects/${id}/${b.dataset.a}`, { method: 'POST' }), 'Done'); if (r) route(); });
    $('#rn').onclick = async () => { const n = prompt('New name', m.name); if (n && await act(() => api(`/projects/${id}/rename`, { method: 'POST', body: JSON.stringify({ name: n }) }), 'Renamed')) route(); };
    $('#ex').onclick = () => act(() => download(`/projects/${id}/export`, m.name + '.zip'));
    $('#dl').onclick = async () => { if (confirm(`Delete "${m.name}" and its backups? This cannot be undone.`) && await act(() => api(`/projects/${id}?confirm=yes`, { method: 'DELETE' }), 'Deleted')) location.hash = '#/projects'; };
  }
  if (tab === 'files') fileTab(id, el);
  if (tab === 'health') { const a = await api(`/projects/${id}/health`); el.innerHTML = `<div class="card"><p>Type: <b>${esc(a.type)}</b> · Entry: <b>${esc(a.entry || 'none')}</b> · Files: ${a.fileCount}</p>${findings(a)}</div><p class="info">Rule-based checks. They do not find every bug.</p>`; }
  if (tab === 'logs') {
    const l = await api(`/projects/${id}/logs`);
    if (!l.available) return el.innerHTML = '<div class="card">No logs: no execution server is connected, so nothing is running.</div>';
    el.innerHTML = `<div class="row"><input id="lf" placeholder="Filter" aria-label="Filter logs"><button class="sec" id="cp">Copy</button><button class="sec" id="rf">Refresh</button></div>${l.analysis.findings.map(f => `<div class="card"><b>${esc(f.title)}</b> ×${f.count}<br>${esc(f.cause)}<br>Fix: ${esc(f.fix)}</div>`).join('')}<div class="card"><pre id="lt"></pre></div>`;
    const lines = l.text.split('\n'), draw = q => $('#lt').textContent = lines.filter(x => x.toLowerCase().includes(q.toLowerCase())).join('\n') || 'No log lines.';
    draw(''); $('#lf').oninput = e => draw(e.target.value); $('#cp').onclick = () => navigator.clipboard.writeText(l.text).then(() => toast('Copied')); $('#rf').onclick = route;
  }
  if (tab === 'backups') {
    const bs = await api(`/projects/${id}/backups`);
    el.innerHTML = `<div class="row"><button id="mk">Create backup</button></div><div class="card">${bs.map(b => `<div class="li"><span>${esc(b.id)}</span><span class="info">${(b.size / 1024).toFixed(1)} KB</span><span class="sp"></span><button class="sec" data-d="${esc(b.id)}">Download</button><button class="sec" data-r="${esc(b.id)}">Restore</button></div>`).join('') || 'No backups yet.'}</div>`;
    $('#mk').onclick = async () => { if (await act(() => api(`/projects/${id}/backups`, { method: 'POST' }), 'Backup created')) route(); };
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => act(() => download(`/projects/${id}/backups/${b.dataset.d}`, b.dataset.d + '.zip')));
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = async () => { if (confirm('Replace current files with this backup? A safety backup is made first.') && await act(() => api(`/projects/${id}/backups/${b.dataset.r}/restore`, { method: 'POST', body: JSON.stringify({ confirm: true }) }), 'Restored')) route(); });
  }
}
async function fileTab(id, el, dir = '') {
  const r = await api(`/projects/${id}/files?path=${encodeURIComponent(dir)}`), up = dir.split('/').slice(0, -1).join('/');
  el.innerHTML = `<div class="row"><b>/${esc(dir)}</b><span class="sp"></span><button class="sec" id="nf">New file</button></div><div class="card" id="fl">${dir ? '<div class="li"><a href="#" id="up">..</a></div>' : ''}${r.entries.map(e => `<div class="li"><a href="#" data-p="${esc((dir ? dir + '/' : '') + e.name)}" data-d="${e.dir ? 1 : ''}">${e.dir ? '📁 ' : ''}${esc(e.name)}</a><span class="sp"></span><span class="info">${e.dir ? '' : e.size + ' B'}</span></div>`).join('') || '<div class="info">Empty folder.</div>'}</div><div id="ed"></div>`;
  const back = e => { e.preventDefault(); if (!dirty || confirm('Discard unsaved changes?')) { dirty = false; fileTab(id, el, up); } };
  if (dir) $('#up').onclick = back;
  el.querySelectorAll('[data-p]').forEach(a => a.onclick = async e => { e.preventDefault(); if (dirty && !confirm('Discard unsaved changes?')) return; dirty = false;
    if (a.dataset.d) return fileTab(id, el, a.dataset.p); const f = await act(() => api(`/projects/${id}/files?path=${encodeURIComponent(a.dataset.p)}`)); if (f) edit(id, a.dataset.p, f.content, dir, el); });
  $('#nf').onclick = () => { const n = prompt('File path (e.g. utils/helper.py)'); if (n) edit(id, (dir ? dir + '/' : '') + n.replace(/^\/+/, ''), '', dir, el); };
}
function edit(id, path, content, dir, el) {
  $('#ed').innerHTML = `<div class="row"><b id="fn"></b><span id="dt" class="warning"></span><span class="sp"></span><button id="sv">Save</button><button class="dan" id="rm">Delete</button></div><textarea id="tx" spellcheck="false" aria-label="File content"></textarea>`;
  $('#fn').textContent = path; $('#tx').value = content; dirty = false;
  $('#tx').oninput = () => { dirty = true; $('#dt').textContent = 'unsaved'; };
  $('#sv').onclick = async () => { if (await act(() => api(`/projects/${id}/files?path=${encodeURIComponent(path)}`, { method: 'PUT', body: $('#tx').value }), 'Saved')) { dirty = false; $('#dt').textContent = ''; } };
  $('#rm').onclick = async () => { if (confirm(`Delete ${path}?`) && await act(() => api(`/projects/${id}/files?path=${encodeURIComponent(path)}`, { method: 'DELETE' }), 'Deleted')) { dirty = false; fileTab(id, el, dir); } };
}
const pDocs = () => shell('#/docs', `<h1>Docs</h1><div class="card"><h3>Getting started</h3><p>Create a project from a ZIP or a template. WebZHost checks it, stores it, and lets you edit files, run health checks and make backups.</p><h3>Supported projects</h3><p>Python (requirements.txt + .py) and Node.js (package.json). The start command is suggested, never run during upload.</p><h3>Running projects</h3><p>The web app never runs your code. Start, stop, restart and logs need an execution server set with RUNTIME_URL and RUNTIME_SECRET. Until then, status shows "unknown".</p><h3>Common errors</h3><p>"Unsafe path": the ZIP has ../ or absolute paths. "No entry point": add main.py or index.js. "Checksum mismatch": the ZIP is damaged; zip it again.</p><h3>Backups</h3><p>Restore checks the whole backup first and makes a safety backup. A damaged backup never replaces your files.</p></div>`);

async function route() {
  if (!(cfg.authMode === 'dev' ? devToken : fb?.user)) return login();
  const h = location.hash.replace(/^#\/?/, '').split('/');
  try { if (h[0] === 'projects') await pList(); else if (h[0] === 'new') await pNew(); else if (h[0] === 'docs') pDocs(); else if (h[0] === 'p' && /^[a-f0-9]{16}$/.test(h[1] || '')) await pProject(h[1], h[2]); else await pDash(); }
  catch (e) { if (e.status === 401) return signOut(); shell('', `<h1>Error</h1><div class="card error">${esc(e.message)}</div>`); }
  $('#th').onclick = () => theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); $('#lo').onclick = signOut;
}
function signOut() { sessionStorage.removeItem('wz_dev'); devToken = null; if (fb) fb.m.signOut(fb.auth); else login(); }
window.addEventListener('hashchange', () => { if (!dirty || confirm('Discard unsaved changes?')) { dirty = false; route(); } else history.back(); });
window.addEventListener('beforeunload', e => { if (dirty) e.preventDefault(); });
(async () => {
  try { cfg = await (await fetch(API + '/api/config')).json(); } catch { root.innerHTML = '<div class="card login error">Cannot reach the API. Check config.js.</div>'; return; }
  if (cfg.authMode === 'firebase') {
    const v = '10.12.0', [A, M] = await Promise.all([import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`), import(`https://www.gstatic.com/firebasejs/${v}/firebase-auth.js`)]);
    const auth = M.getAuth(A.initializeApp(cfg.firebase)); fb = { auth, m: M, user: null };
    M.onAuthStateChanged(auth, u => { fb.user = u; route(); });
  } else route();
})();

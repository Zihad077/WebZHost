'use strict';
// Runtime adapter. The control plane never runs user code. Without a runner, every
// lifecycle call fails honestly with 501 and status is "unknown" (never "running").
const { httpErr } = require('./util');
function createRuntime(cfg) {
  if (!cfg.runtimeUrl || !cfg.runtimeSecret) {
    const na = () => { throw httpErr(501, 'No execution server is connected. Set RUNTIME_URL and RUNTIME_SECRET (see README).', { code: 'RUNTIME_UNAVAILABLE' }); };
    return { kind: 'none', available: false, status: async () => ({ state: 'unknown' }), logs: async () => '', start: na, stop: na, restart: na };
  }
  const call = async (method, p, body) => {
    const r = await fetch(cfg.runtimeUrl.replace(/\/$/, '') + p, { method, headers: { Authorization: 'Bearer ' + cfg.runtimeSecret, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw httpErr(502, 'Execution server error: ' + r.status);
    return r;
  };
  const act = a => (id, spec) => call('POST', `/v1/projects/${id}/${a}`, spec).then(r => r.json());
  return { kind: 'remote', available: true,
    status: id => call('GET', `/v1/projects/${id}/status`).then(r => r.json()).catch(() => ({ state: 'unknown' })),
    logs: id => call('GET', `/v1/projects/${id}/logs`).then(r => r.text()).catch(() => ''),
    start: act('start'), stop: act('stop'), restart: act('restart') };
}
module.exports = { createRuntime };

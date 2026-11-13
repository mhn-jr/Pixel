/* Mini App v1.16.0 — هشدار قیمت با «مدل داده و هستهٔ یکسان با اپ اصلی» + همگام‌سازی دوطرفه (مرحلهٔ ۱)
   - مدل هر هشدار همان مدل اپ اصلی است (js/179a → اینجا alerts-core.js، بدون تغییر): c{op,v,v2,ref} · iv · tr · ex · msg · n{app,toast,sound,tg,hook} ·
     sch · st(active|paused|triggered|expired) · lp · fa/fp/fb/cnt · u · del. موتور (evalCond/canFire/inSchedule/render) از همان هسته است؛ پس شرط‌ها
     (۹ نوع: عبور، بالا، پایین، بزرگ‌تر، کوچک‌تر، ورود/خروج کانال، درصد) و ماشه‌ها (یک‌بار/هر کندل/هر دقیقه/هر بار) در مینی‌اپ هم درست کار می‌کنند.
   - همگام‌سازی: با سرور اپ اصلی (/api/alerts) و هویت تلگرام (هدر X-Tg-Init = initData). آدرس سرور: ONELLA_SYNC_URL (پایین) یا localStorage
     onella_sync_url یا ?api=https://... در آدرس مینی‌اپ. سرور فقط وقتی جواب می‌دهد که در اپ اصلی «اعمال در مینی‌اپ تلگرام» روشن باشد (۴۰۳ = خاموش).
     ادغام: آخرین u برنده؛ حذف = del:1 (tombstone)؛ اطلاعات شلیک (fa/fp/cnt) هرگز عقب نمی‌رود.
   - هشدارهایی که نمی‌شود به سرور داد (ایران، آتی «=F») فقط محلی می‌مانند (local:true) و همگام نمی‌شوند.
   - ذخیرهٔ محلی مثل قبل: CloudStorage تلگرام (هر هشدار یک کلید onella_al_<id> + فهرست onella_alerts_idx) و آینهٔ localStorage با userId.
   - هشدارهای قدیمی مینی‌اپ (cond/price/repeat/expiresAt/active) هنگام بارگذاری یک‌بار به مدل تازه تبدیل می‌شوند.
   - API قدیمی (add/remove/setActive/setShared/list/listActive/check/…) حفظ شده؛ list/listActive «نمای سازگار» (price/cond/active/firedAt/…) برمی‌گردانند. */
(function () {
  var C = window.OnellaAlertsCore;
  if (!C) { try { console.warn('alerts-core.js بارگذاری نشده'); } catch (_) {} return; }
  var KEY = 'onella_alerts_v1';
  var IDX_KEY = 'onella_alerts_idx';
  var ITEM_PREFIX = 'onella_al_';
  var SYNC_LS = 'onella_sync_url';
  /* آدرس عمومی HTTPS سرور اپ اصلی (بدون / آخر) — مثلاً 'https://onella.example.com'. خالی = همگام‌سازی خاموش. */
  var ONELLA_SYNC_URL = '';
  var MAX = 50, SYNC_EVERY = 15000;
  var USER_ID = null;
  try {
    var _u = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
    if (_u && typeof _u.id === 'number') USER_ID = String(_u.id);
  } catch (_) { USER_ID = null; }
  function localKey() { return USER_ID ? KEY + '_' + USER_ID : KEY; }
  function isFa() { try { return String(document.documentElement.lang || '').toLowerCase().indexOf('en') !== 0; } catch (_) { return true; } }

  var store = [];
  var dirtyIds = {};
  var idxDirty = false;
  var lastCloudError = null, lastLocalError = null;
  var listeners = [];
  function emit() { listeners.slice().forEach(function (f) { try { f(); } catch (_) {} }); }

  /* ---------- نگاشت نماد: مینی‌اپ ⇄ اپ اصلی ---------- */
  function toMain(sym, provider, mode) {
    sym = String(sym || '');
    if (mode === 'iran' || provider === 'iran-rate') return null;
    if (provider === 'binance' && /USDT$/.test(sym) && /^[A-Z0-9]{2,20}USDT$/.test(sym)) return { sym: sym, qs: sym.replace(/USDT$/, '') + '/USDT', kind: 'crypto' };
    if (provider === 'yahoo') {
      if (/^[A-Z]{6}=X$/.test(sym)) { var fx = sym.slice(0, 6); return { sym: fx, qs: fx, kind: 'forex' }; }
      if (/^[A-Z0-9][A-Z0-9.\-]{0,14}$/.test(sym)) return { sym: sym, qs: sym, kind: 'stock' };
    }
    return null;
  }
  function msymOf(a) {
    if (a.ms) return a.ms;
    if (a.kind === 'crypto') return a.sym;
    if (a.kind === 'forex') return a.sym + '=X';
    if (a.kind === 'stock' || a.kind === 'etf') return a.sym;
    return a.sym;
  }
  function providerOf(a) {
    if (a.provider) return a.provider;
    if (a.kind === 'crypto') return 'binance';
    if (a.kind === 'forex' || a.kind === 'stock' || a.kind === 'etf') return 'yahoo';
    return null;
  }
  var OP2COND = { cross: 'cross', up: 'crossUp', down: 'crossDown', gt: 'above', lt: 'below' };
  var COND2OP = { cross: 'cross', crossUp: 'up', crossDown: 'down', above: 'gt', below: 'lt' };
  function linePrice(a) {
    var c = a.c || {}, v = +c.v;
    if (c.op === 'pctup') return +c.ref * (1 + v / 100);
    if (c.op === 'pctdown') return +c.ref * (1 - v / 100);
    return v;
  }
  function view(a) {
    var lang = isFa() ? 'fa' : 'en', ms = msymOf(a), price = linePrice(a);
    var msg = a.msg ? C.render(a.msg, a, a.fp || +a.c.v || 0, Date.now(), lang) : (a.label || ms) + ' — ' + C.describe(a.c, lang);
    var v = {};
    Object.keys(a).forEach(function (k) { v[k] = a[k]; });
    v.gsym = a.sym; v.sym = ms; v.msym = ms; v.price = price; v.cond = OP2COND[a.c.op] || 'cross';
    v.repeat = a.tr === 'once' ? 'once' : 'every'; v.expiresAt = a.ex || null; v.active = a.st === 'active';
    v.firedAt = a.fa || null; v.firedPrice = a.fp || null; v.mode = a.mode || 'usd'; v.provider = providerOf(a);
    v.label = a.label || ms; v.shared = !!a.shared; v.sharedVia = a.sharedVia || null; v.msg = msg; v.createdAt = a.ca; v.updatedAt = a.u;
    return v;
  }

  /* ---------- backend: CloudStorage تلگرام (اول) + localStorage (آینه/جایگزین) ---------- */
  var tgCS = null;
  try { tgCS = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) || null; } catch (_) { tgCS = null; }
  function csGetItem(key) { return new Promise(function (res) { try { tgCS.getItem(key, function (err, v) { res(err ? null : (typeof v === 'string' ? v : null)); }); } catch (_) { res(null); } }); }
  function csSetItem(key, value) { return new Promise(function (res) { try { tgCS.setItem(key, value, function (err) { res(!err); }); } catch (_) { res(false); } }); }
  function csRemoveItem(key) { return new Promise(function (res) { try { tgCS.removeItem(key, function (err) { res(!err); }); } catch (_) { res(false); } }); }
  function csGetItems(keys) { return new Promise(function (res) { try { tgCS.getItems(keys, function (err, vals) { res(err ? null : (vals || null)); }); } catch (_) { res(null); } }); }
  function readLocal() { try { var r = JSON.parse(localStorage.getItem(localKey()) || 'null'); return Array.isArray(r) ? r : []; } catch (_) { return []; } }

  /* تبدیل هشدار قدیمیِ مینی‌اپ (cond/price/…) به مدل تازه — یک‌بار */
  function migrate(x) {
    if (!x || !x.id) return null;
    if (x.c && x.c.op) return x;
    var op = COND2OP[x.cond] || 'cross', price = +x.price;
    if (!(price > 0)) return null;
    var m = toMain(x.sym, x.provider, x.mode), now = Date.now();
    var st = x.active ? 'active' : (x.firedAt && x.repeat !== 'every' ? 'triggered' : 'paused');
    var a = {
      id: String(x.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40), sym: m ? m.sym : String(x.sym || ''), qs: m ? m.qs : String(x.sym || ''), kind: m ? m.kind : 'crypto',
      c: { op: op, v: price }, iv: 'chart', tfl: '', tr: x.repeat === 'every' ? 'every' : 'once', ex: +x.expiresAt > 0 ? +x.expiresAt : 0,
      msg: String(x.msg || '').slice(0, 300), n: { app: true, toast: true, sound: false, tg: !!x.shared, hook: false }, hookUrl: '', sch: { m: 'all' },
      st: st, lp: null, fa: +x.firedAt > 0 ? +x.firedAt : 0, fb: null, cnt: x.firedAt ? 1 : 0, fp: +x.firedPrice > 0 ? +x.firedPrice : null,
      ca: +x.createdAt || now, u: +x.updatedAt || now,
      label: x.label || x.sym, mode: x.mode || 'usd', provider: x.provider || null, shared: !!x.shared, sharedVia: x.sharedVia || null, ms: String(x.sym || '')
    };
    if (!m) a.local = true;
    return a;
  }
  function stamp(a) { dirtyIds[a.id] = 1; }
  var ready, readyResolve, loadStarted = false;
  function loadAll() {
    if (loadStarted) return ready;
    loadStarted = true;
    ready = new Promise(function (res) { readyResolve = res; });
    var snap = {}; store.forEach(function (a) { snap[a.id] = a.u; });
    function finish(arr) {
      var src = [];
      (arr || []).forEach(function (x) { var m = migrate(x); if (m) { if (!(x.c && x.c.op)) stamp(m); src.push(m); } });
      var changed = store.filter(function (a) { return !(a.id in snap) || snap[a.id] !== a.u; });
      if (changed.length) {
        var by = {}; src.forEach(function (x) { by[x.id] = x; });
        changed.forEach(function (x) { by[x.id] = x; });
        src = Object.keys(by).map(function (k) { return by[k]; });
      }
      var cutoff = Date.now() - 7 * 864e5;
      src = src.filter(function (a) { if (a.del && a.u < cutoff) { if (tgCS) csRemoveItem(ITEM_PREFIX + a.id); return false; } return true; });
      store = src;
      readyResolve(true);
      emit();
      setTimeout(function () { sync(false); }, 300);
    }
    if (!tgCS) { finish(readLocal()); return ready; }
    csGetItem(IDX_KEY).then(function (idxRaw) {
      var ids = []; try { ids = JSON.parse(idxRaw || 'null') || []; } catch (_) { ids = []; }
      if (!Array.isArray(ids)) ids = [];
      if (!ids.length) { finish([]); return; }
      return csGetItems(ids.map(function (id) { return ITEM_PREFIX + id; })).then(function (vals) {
        var arr = [];
        ids.forEach(function (id) { var v = vals && vals[ITEM_PREFIX + id]; if (typeof v === 'string') { try { var a = JSON.parse(v); if (a && a.id) arr.push(a); } catch (_) {} } });
        finish(arr);
      });
    }).catch(function () { finish([]); });
    return ready;
  }
  var saveT = null;
  function save() { idxDirty = true; if (saveT) return; saveT = setTimeout(flush, 20); }
  function flush() {
    saveT = null;
    try { localStorage.setItem(localKey(), JSON.stringify(store)); lastLocalError = null; } catch (e) { lastLocalError = String((e && e.message) || e); }
    if (!tgCS) { dirtyIds = {}; idxDirty = false; return; }
    var ids = Object.keys(dirtyIds); dirtyIds = {};
    var wantIdx = idxDirty; idxDirty = false;
    var live = {}; store.forEach(function (a) { live[a.id] = a; });
    var p = wantIdx ? csSetItem(IDX_KEY, JSON.stringify(store.map(function (a) { return a.id; }))) : Promise.resolve(true);
    p.then(function (ok) {
      if (!ok) { lastCloudError = 'index write failed'; return null; }
      return Promise.all(ids.map(function (id) { return live[id] ? csSetItem(ITEM_PREFIX + id, JSON.stringify(live[id])) : csRemoveItem(ITEM_PREFIX + id); }));
    }).then(function (rs) { if (rs) lastCloudError = rs.some(function (r) { return !r; }) ? 'item write failed' : null; })
      .catch(function (e) { lastCloudError = String((e && e.message) || e); });
  }
  function touch(a, t) { a.u = t || Date.now(); stamp(a); save(); if (!a.local) scheduleSync(); }
  loadAll();

  /* ---------- همگام‌سازی با سرور اپ اصلی ---------- */
  var SY = { st: 'off', at: 0, msg: '' };   // off | idle | ok | disabled | auth | net | server
  var syncDirty = false, syncT = null, syncing = false, pollTimer = null;
  var BRIDGE_URL = 'https://pixelminiapp.mahanjafari039.workers.dev';   // ورکر کلادفلر مینی‌اپ = پل به سرور اصلی (بدون آدرس/تونل)
  var AUTO_URL = '';   // v1.16.4: اگر مینی‌اپ از خود سرور اصلی باز شده باشد (همان origin)، بدون هیچ تنظیمی همان سرور است
  function syncUrl() {
    try { var q = new URLSearchParams(location.search).get('api'); if (q && /^https:\/\/[^\s]+$/.test(q)) { var qq = q.replace(/\/+$/, ''); localStorage.setItem(SYNC_LS, qq); if (tgCS) csSetItem(SYNC_LS, qq); } } catch (_) {}
    var v = ''; try { v = localStorage.getItem(SYNC_LS) || ''; } catch (_) {}
    return String(AUTO_URL || v || window.ONELLA_SYNC_URL || ONELLA_SYNC_URL || '').replace(/\/+$/, '');
  }
  function initData() { try { return (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || ''; } catch (_) { return ''; } }
  function syncOn() { return !!initData(); }   // آدرس مستقیم یا پل ورکر؛ فقط هویت تلگرام لازم است
  function setSy(st, msg) { var ch = SY.st !== st; SY.st = st; SY.msg = msg || ''; if (st === 'ok') SY.at = Date.now(); if (ch || st === 'ok') emit(); }
  function req(method, path, body) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null, t = ctl && setTimeout(function () { ctl.abort(); }, 12000);
    return fetch(syncUrl() + '/api/alerts' + path, { method: method, headers: { 'Content-Type': 'application/json', 'X-Tg-Init': initData() }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (t) clearTimeout(t); return r.json().catch(function () { return {}; }).then(function (j) { j.http = r.status; if (!r.ok) j.ok = false; return j; }); })
      .catch(function () { if (t) clearTimeout(t); return { ok: false, error: 'network', http: 0 }; });
  }
  function mergeIn(remote) {
    var by = {}; store.forEach(function (a) { by[a.id] = a; });
    var changed = false;
    remote.forEach(function (r) {
      if (!r || !r.id || !r.c) return;
      var l = by[r.id];
      if (!l) { if (!r.del) { store.push(r); stamp(r); changed = true; } return; }
      if (r.u > l.u) {
        ['mode', 'provider', 'label', 'shared', 'sharedVia', 'ms'].forEach(function (k) { if (l[k] != null && r[k] == null) r[k] = l[k]; });
        if (l.lp && !r.lp) r.lp = l.lp;
        store[store.indexOf(l)] = r; stamp(r); changed = true;
      } else if (r.fa > l.fa) { l.fa = r.fa; l.fp = r.fp; l.cnt = r.cnt; l.fb = r.fb; if (r.st === 'triggered') l.st = 'triggered'; stamp(l); changed = true; }
    });
    if (changed) { save(); emit(); }
  }
  function scheduleSync() { if (!syncOn()) return; syncDirty = true; clearTimeout(syncT); syncT = setTimeout(function () { sync(true); }, 700); }
  function sync(force) {
    if (!syncOn() || typeof fetch !== 'function') { setSy('off'); return Promise.resolve(false); }
    if (syncing) { if (force) scheduleSync(); return Promise.resolve(false); }
    syncing = true;
    var push = syncDirty || force, direct = !!syncUrl(), mine = store.filter(function (a) { return !a.local; });
    SY.mode = direct ? 'direct' : 'bridge';
    var p = direct ? (push ? req('PUT', '/sync', { items: mine }) : req('GET', '/list'))
      : fetch(BRIDGE_URL + '/mini-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData: initData(), items: mine }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.http = r.status; if (!r.ok) j.ok = false; return j; }); })
        .catch(function () { return { ok: false, error: 'network', http: 0 }; });
    return p.then(function (r) {
      syncing = false;
      if (r.http === 403) { setSy('disabled'); return false; }
      if (r.http === 401) { setSy('auth', r.error || ''); return false; }
      if (r.error === 'network') { setSy('net'); return false; }
      if (!r.ok) { setSy('server', r.error || ('HTTP ' + r.http)); return false; }
      if (r.mini === false) { setSy('disabled'); return false; }
      if (push) syncDirty = false;
      mergeIn(r.items || []);
      setSy('ok');
      return true;
    });
  }
  function startPoll() {
    if (pollTimer) return;
    var hid = function () { try { return !!document.hidden; } catch (_) { return false; } };
    pollTimer = setInterval(function () { if (!hid()) sync(false); }, SYNC_EVERY);   /* v1.16.6: ۱۵ ثانیه (فقط خواندن؛ نوشتن KV فقط با تغییر) */
    try { document.addEventListener('visibilitychange', function () { if (!hid()) sync(false); }); } catch (_) {}
  }
  startPoll();
  /* v1.16.3 — آدرس سرور خودکار: از ?api= دکمهٔ ربات (ذخیره در localStorage + CloudStorage). اگر localStorage خالی شد از CloudStorage برمی‌گردد. */
  syncUrl();
  try {
    if (location.protocol === 'https:' && typeof fetch === 'function') {
      fetch(location.origin + '/api/alerts/status', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (j && j.ok && j.telegram) { AUTO_URL = location.origin; emit(); sync(true); }
      }).catch(function () {});
    }
  } catch (_) {}
  if (tgCS) { try { if (!localStorage.getItem(SYNC_LS)) csGetItem(SYNC_LS).then(function (v) { if (v && /^https:\/\//.test(v)) { try { localStorage.setItem(SYNC_LS, v); } catch (_) {} sync(true); } }); } catch (_) {} }

  /* ---------- API ---------- */
  var seq = 0;
  function mkId() { return 'a' + Date.now().toString(36) + (seq++).toString(36) + Math.floor(Math.random() * 1e5).toString(36); }
  function condLabel(cond, lang) {
    var fa = lang !== 'en';
    if (cond === 'crossUp') return fa ? 'عبور به بالا' : 'Crossing up';
    if (cond === 'crossDown') return fa ? 'عبور به پایین' : 'Crossing down';
    if (cond === 'above') return fa ? 'بالاتر از' : 'Greater than';
    if (cond === 'below') return fa ? 'پایین‌تر از' : 'Less than';
    return fa ? 'عبور' : 'Crossing';
  }
  function defaultMsg(a, lang) { return (a.label || a.sym || '') + ' — ' + condLabel(a.cond, lang) + ' ' + a.price; }
  function rawFind(id) { for (var i = 0; i < store.length; i++) if (store[i].id === id && !store[i].del) return store[i]; return null; }
  function liveCount() { return store.filter(function (a) { return !a.del && a.st === 'active'; }).length; }
  /* ورودی قدیمی {sym,label,mode,provider,cond,price,repeat,expiresAt,msg} یا تازه {c:{op,v,v2,ref},tr,iv,ex,n,sch,msg} (+ lp: قیمت فعلی، tg: اعلان تلگرام) */
  function add(a) {
    if (!a || typeof a.sym !== 'string' || !a.sym) return null;
    if (liveCount() >= MAX) return null;
    var now = Date.now(), m = toMain(a.sym, a.provider, a.mode);
    var c = a.c && a.c.op ? a.c : { op: COND2OP[a.cond] || 'cross', v: +a.price };
    var raw = {
      id: mkId(), sym: m ? m.sym : a.sym, qs: m ? m.qs : a.sym, kind: m ? m.kind : 'crypto', c: c, iv: a.iv || 'chart', tr: a.tr || (a.repeat === 'every' ? 'every' : 'once'),
      ex: a.ex != null ? a.ex : ((typeof a.expiresAt === 'number' && a.expiresAt > now) ? a.expiresAt : 0),
      msg: (typeof a.msg === 'string' && a.msg.trim()) ? a.msg.trim().slice(0, 300) : '', n: a.n || { app: true, toast: true, sound: false, tg: !!a.tg, hook: false }, sch: a.sch || { m: 'all' }, hookUrl: a.hookUrl || '', tfl: a.tfl || '',
      st: 'active', lp: a.lp > 0 ? +a.lp : null, fa: 0, fb: null, cnt: 0, fp: null, ca: now, u: now
    };
    var it;
    if (m) { it = C.normalize(raw, now); if (!it) return null; }
    else { if (!(+c.v > 0) || !C.OPS[c.op]) return null; it = raw; it.local = true; }
    it.label = a.label || a.sym; it.mode = a.mode || 'usd'; it.provider = (a.provider === 'yahoo' || a.provider === 'binance' || a.provider === 'iran-rate') ? a.provider : null; it.ms = a.sym;
    it.shared = false; it.sharedVia = null;
    if (!it.msg && !(a.c && a.c.op)) it.msg = defaultMsg({ label: it.label, cond: OP2COND[c.op] || 'cross', price: linePrice(it) }, 'fa');
    store.push(it); stamp(it); save(); if (!it.local) scheduleSync(); emit();
    return view(it);
  }
  /* ویرایش کامل (همان فیلدهای فرم اپ اصلی): f = {c,iv,tr,ex,msg,n,sch,hookUrl,lp}. تغییر شرط ← شلیک قبلی صفر و دوباره فعال. */
  function update(id, f) {
    var a = rawFind(id); if (!a || !f) return false;
    var now = Date.now(), cand = JSON.parse(JSON.stringify(a));
    ['c', 'iv', 'tr', 'ex', 'msg', 'n', 'sch', 'hookUrl'].forEach(function (k) { if (f[k] !== undefined) cand[k] = f[k]; });
    var condChanged = JSON.stringify(cand.c) !== JSON.stringify(a.c);
    var out;
    if (a.local) { if (!(+cand.c.v > 0) || !C.OPS[cand.c.op]) return false; out = cand; cand.hookUrl = ''; cand.n = Object.assign({}, cand.n, { tg: false, hook: false }); }
    else { out = C.normalize(cand, now); if (!out) return false; }
    ['c', 'iv', 'tr', 'ex', 'msg', 'n', 'sch', 'hookUrl'].forEach(function (k) { a[k] = out[k]; });
    if (condChanged) { a.fa = 0; a.fb = null; a.fp = null; a.cnt = 0; a.lp = f.lp > 0 ? +f.lp : null; if (a.st === 'triggered' || a.st === 'expired') a.st = 'active'; }
    else if (a.st === 'expired' && (!a.ex || a.ex > now)) a.st = 'active';
    a.srv = !a.local && (a.n.tg || a.n.hook);
    touch(a, now); return true;
  }
  function remove(id) { var a = rawFind(id); if (!a) return false; a.del = 1; touch(a); return true; }
  function find(id) { var a = rawFind(id); return a ? view(a) : null; }
  function setActive(id, on) {
    var a = rawFind(id); if (!a) return false;
    var now = Date.now();
    if (on) { a.st = 'active'; a.fa = 0; a.fb = null; a.lp = null; if (a.ex && a.ex < now) a.ex = now + 30 * 864e5; } else a.st = 'paused';
    touch(a, now); return true;
  }
  function setShared(id, on, via) {
    var a = rawFind(id); if (!a) return false;
    a.shared = !!on; a.sharedVia = a.shared ? (via === 'worker' ? 'worker' : 'bot') : null; stamp(a); save(); return true;
  }
  function setTg(id, on) { var a = rawFind(id); if (!a || a.local) return false; a.n = Object.assign({}, a.n, { tg: !!on }); touch(a); return true; }
  function list(sym) { return store.filter(function (a) { return !a.del && (!sym || msymOf(a) === sym); }).map(view); }
  function listActive(sym) { return list(sym).filter(function (x) { return x.active; }); }
  function pruneExpired(now) {
    now = now || Date.now(); var ch = false;
    store.forEach(function (a) { if (!a.del && a.st === 'active' && C.expired(a, now)) { a.st = 'expired'; touch(a, now); ch = true; } });
    return ch;
  }
  function postFired(a, price, at) {
    if (!syncOn() || SY.st !== 'ok') return;
    req('POST', '/fired', { id: a.id, price: price, at: at, tfMs: 0 }).then(function () { setTimeout(function () { sync(false); }, 1500); });
  }
  /* بررسی یک قیمت تازه برای یک نمادِ مینی‌اپ؛ هشدارهای شلیک‌شده را (نمای سازگار + quiet) برمی‌گرداند. */
  function check(sym, price, now) {
    now = now || Date.now();
    var out = [];
    if (typeof price !== 'number' || !isFinite(price) || price <= 0) return out;
    pruneExpired(now);
    var dirty = false;
    store.forEach(function (a) {
      if (a.del || a.st !== 'active' || msymOf(a) !== sym) return;
      if (a.n && a.n.tg && !a.local && SY.st === 'ok' && SY.mode === 'bridge') return;   /* پل: هشدار تلگرام‌دار را سرور می‌سنجد و می‌فرستد (جلوگیری از پیام دوبل) */
      var prev = a.lp, hit = C.evalCond(a.c, prev, price);
      if (prev !== price) { a.lp = price; dirty = true; }
      if (!hit || !C.canFire(a, now, 0)) return;
      a.fa = now; a.fp = price; a.cnt = (a.cnt || 0) + 1; a.fb = C.barId(now, C.intervalMs(a.iv, 0)); if (a.tr === 'once') a.st = 'triggered';
      a.u = now; stamp(a); dirty = true;
      var v = view(a); v.quiet = !C.inSchedule(a.sch, now); out.push(v);
      if (a.n && a.n.tg && !a.local && !a.shared && syncOn() && SY.st === 'ok') postFired(a, price, now); else if (!a.local) scheduleSync();
    });
    if (dirty) save();
    return out;
  }
  var api = {
    add: add, update: update, rawGet: function (id) { var a = rawFind(id); return a ? JSON.parse(JSON.stringify(a)) : null; }, remove: remove, find: find, setActive: setActive, setShared: setShared, setTg: setTg, list: list, listActive: listActive,
    check: check, pruneExpired: pruneExpired, condLabel: condLabel, defaultMsg: defaultMsg,
    describe: function (a, lang) { return C.describe(a.c, lang); },
    trLabel: function (a, lang) { var t = C.TRIGGERS[a.tr]; return t ? t[lang === 'en' ? 1 : 0] : ''; },
    onChange: function (f) { if (typeof f === 'function') listeners.push(f); },
    sync: function () { return sync(true); },
    syncState: function () { return { url: true, mode: SY.mode || (syncUrl() ? 'direct' : 'bridge'), tg: !!initData(), st: SY.st, at: SY.at, msg: SY.msg }; },
    /* v1.16.3 — آدرس سرور اپ اصلی را از داخل مینی‌اپ بگذار/پاک کن (در localStorage) و فوراً همگام کن. */
    setSyncUrl: function (v) {
      v = String(v || '').trim().replace(/\/+$/, '');
      if (v && !/^https:\/\/[^\s\/]+(\/[^\s]*)?$/.test(v)) return false;
      try { if (v) localStorage.setItem(SYNC_LS, v); else localStorage.removeItem(SYNC_LS); } catch (_) { return false; }
      SY.st = 'idle'; emit(); return sync(true).then(function () { return true; });
    },
    syncUrlValue: function () { return syncUrl(); },
    syncable: function (sym, provider, mode) { return !!toMain(sym, provider, mode); },
    syncOk: function () { return syncOn() && SY.st === 'ok'; },
    reload: function () { loadStarted = false; return loadAll(); },
    backend: function () { return { cloud: !!tgCS, local: true, cloudError: lastCloudError, localError: lastLocalError, userId: USER_ID, sync: SY.st }; },
    MAX: MAX
  };
  Object.defineProperty(api, 'ready', { get: function () { return ready; } });
  window.OnellaAlerts = api;
})();

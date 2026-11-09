/* Mini App v1.10.0 — هشدار قیمت (به سبک دیالوگ تریدینگ‌ویو، ولی با موتور خود اپ):
   - شرط: عبور (هر جهت) / عبور به بالا / عبور به پایین / بالاتر از / پایین‌تر از.
   - تکرار: فقط یک بار / هر بار. انقضا: ۱ روز / ۱ هفته / ۱ ماه / بدون انقضا (پیش‌فرض ۱ ماه).
   - پیام: خودکار «نماد + شرط + قیمت»، قابل ویرایش.
   - ذخیره (v1.10.0 — «سیستم کش»): اول CloudStorage تلگرام (سرور تلگرام، وابسته به
     کاربر+ربات — با بستن/باز کردن مینی‌اپ و حتی نصب دوباره می‌ماند) و localStorage
     هم‌زمان آینه می‌شود؛ اگر CloudStorage نبود (مرورگر بیرون تلگرام) فقط
     localStorage. علت: localStorage در WebView تلگرام قابل‌اعتماد نیست و پاک
     می‌شد (گزارش کاربر ۲۰۲۶-۱۱-۰۹: آلرت ذخیره نمی‌شد) — و خطای ذخیره قبلاً
     بی‌صدا قورت داده می‌شد؛ حالا backend() خطا را نشان می‌دهد.
   - هر آلرت یک کلید جدا در CloudStorage دارد (سقف ۴۰۹۶ نویسه برای هر مقدار):
     onella_al_<id> + یک فهرست onella_alerts_idx. بارگذاری، ادغام است (جدیدترین
     updatedAt می‌برد؛ حذف‌های همین جلسه با tombstone زنده نمی‌شوند).
   - بررسی فقط وقتی مینی‌اپ باز است (قیمت زنده/پولینگ) — وقتی بسته است هیچ هشداری
     نمی‌رسد؛ برای پیام تلگرام، آلرت با «📲 پیام تلگرام» به ربات فرستاده می‌شود
     (ربات نگهبانی می‌کند؛ نیازمند روشن بودن کامپیوتر).
   - عبور با «تغییر سمت قیمت نسبت به هدف» تشخیص داده می‌شود (نه با یک تیک)؛
     بالاتر/پایین‌تر با گذار نادرست→درست و مسلح‌شدن دوباره وقتی قیمت برگشت.
   - هیچ عددی ساخته نمی‌شود: قیمت فقط همان قیمت تازهٔ نماد است که app.js می‌دهد. */
(function () {
  var KEY = 'onella_alerts_v1';
  var IDX_KEY = 'onella_alerts_idx';
  var ITEM_PREFIX = 'onella_al_';
  var MAX = 50;
  var CONDS = ['cross', 'crossUp', 'crossDown', 'above', 'below'];
  var store = [];
  var tombstones = [];
  var dirty = false;
  var lastCloudError = null, lastLocalError = null;

  /* ---------- backend: CloudStorage تلگرام (اول) + localStorage (آینه/جایگزین) ---------- */
  var tgCS = null;
  try { tgCS = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) || null; } catch (_) { tgCS = null; }
  function csGetItem(key) {
    return new Promise(function (res) {
      try { tgCS.getItem(key, function (err, v) { res(err ? null : (typeof v === 'string' ? v : null)); }); }
      catch (_) { res(null); }
    });
  }
  function csSetItem(key, value) {
    return new Promise(function (res) {
      try { tgCS.setItem(key, value, function (err) { res(!err); }); }
      catch (_) { res(false); }
    });
  }
  function csRemoveItem(key) {
    return new Promise(function (res) {
      try { tgCS.removeItem(key, function (err) { res(!err); }); }
      catch (_) { res(false); }
    });
  }
  function csGetItems(keys) {
    return new Promise(function (res) {
      try {
        tgCS.getItems(keys, function (err, vals) {
          if (err) { res(null); return; }
          res(vals || null);
        });
      } catch (_) { res(null); }
    });
  }
  function readLocal() {
    try { var r = JSON.parse(localStorage.getItem(KEY) || 'null'); return Array.isArray(r) ? r : []; }
    catch (_) { return []; }
  }
  /* اجتماع دو فهرست بر اساس id — جدیدترین updatedAt می‌برد؛ حذف‌های همین جلسه زنده نمی‌شوند. */
  function unionById(a, b) {
    var byId = {};
    var out = [];
    [a, b].forEach(function (arr) {
      (arr || []).forEach(function (x) {
        if (!x || !x.id || tombstones.indexOf(x.id) >= 0) return;
        var cur = byId[x.id];
        if (!cur) { byId[x.id] = x; out.push(x); }
        else if ((x.updatedAt || 0) >= (cur.updatedAt || 0)) {
          var i = out.indexOf(cur);
          if (i >= 0) out[i] = x;
          byId[x.id] = x;
        }
      });
    });
    return out;
  }
  var ready, readyResolve;
  var loadStarted = false;
  function loadAll() {
    if (loadStarted) return ready;
    loadStarted = true;
    ready = new Promise(function (res) { readyResolve = res; });
    var local = readLocal();
    var snapIds = store.map(function (a) { return a.id; });
    var snapTombs = tombstones.slice();
    /* بارگذاری یعنی جایگزینی با دادهٔ خوانده‌شده — نه ادغام با حافظهٔ قدیمی
       (وگرنه «پاک‌کردن» هیچ‌وقت خالی نمی‌کند). فقط اگر حین بارگذاری چیزی
       اضافه/حذف شده باشد، همان تغییر روی نتیجه ادغام می‌شود. */
    function finish(cloudArr) {
      var merged = unionById(cloudArr || [], local);
      var mutated = store.some(function (a) { return snapIds.indexOf(a.id) < 0; }) ||
        tombstones.some(function (t) { return snapTombs.indexOf(t) < 0; });
      store = mutated ? unionById(store, merged) : merged;
      readyResolve(true);
    }
    if (!tgCS) { finish([]); return ready; }
    csGetItem(IDX_KEY).then(function (idxRaw) {
      var ids = [];
      try { ids = JSON.parse(idxRaw || 'null') || []; } catch (_) { ids = []; }
      if (!Array.isArray(ids)) ids = [];
      if (!ids.length) {
        finish([]);
        if (local.length) { dirty = true; save(); } // مهاجرت یک‌بارهٔ local به cloud
        return;
      }
      return csGetItems(ids.map(function (id) { return ITEM_PREFIX + id; })).then(function (vals) {
        var arr = [];
        ids.forEach(function (id) {
          var v = vals && vals[ITEM_PREFIX + id];
          if (typeof v === 'string') { try { var a = JSON.parse(v); if (a && a.id) arr.push(a); } catch (_) {} }
        });
        finish(arr);
      });
    }).catch(function () { finish([]); });
    return ready;
  }
  function save() {
    if (!dirty) return;
    dirty = false;
    try { localStorage.setItem(KEY, JSON.stringify(store)); lastLocalError = null; }
    catch (e) { lastLocalError = String((e && e.message) || e); }
    if (!tgCS) return;
    var idx = store.map(function (a) { return a.id; });
    var dead = tombstones.splice(0);
    csSetItem(IDX_KEY, JSON.stringify(idx)).then(function (ok) {
      if (!ok) { lastCloudError = 'index write failed'; return null; }
      var ps = store.map(function (a) { return csSetItem(ITEM_PREFIX + a.id, JSON.stringify(a)); });
      return Promise.all(ps);
    }).then(function (results) {
      if (!results) return;
      lastCloudError = results.some(function (r) { return !r; }) ? 'item write failed' : null;
    }).catch(function (e) { lastCloudError = String((e && e.message) || e); });
    dead.forEach(function (id) { csRemoveItem(ITEM_PREFIX + id); });
  }
  loadAll();

  function mkId() { return 'a' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36); }
  function condLabel(cond, lang) {
    var fa = lang !== 'en';
    if (cond === 'crossUp') return fa ? 'عبور به بالا' : 'Crossing up';
    if (cond === 'crossDown') return fa ? 'عبور به پایین' : 'Crossing down';
    if (cond === 'above') return fa ? 'بالاتر از' : 'Greater than';
    if (cond === 'below') return fa ? 'پایین‌تر از' : 'Less than';
    return fa ? 'عبور' : 'Crossing';
  }
  function defaultMsg(a, lang) {
    var sym = a.label || a.sym || '';
    return sym + ' — ' + condLabel(a.cond, lang) + ' ' + a.price;
  }
  function add(a) {
    if (!a || typeof a.sym !== 'string' || !a.sym) return null;
    if (CONDS.indexOf(a.cond) < 0) a.cond = 'cross';
    var price = +a.price;
    if (!isFinite(price) || price <= 0) return null;
    var active = store.filter(function (x) { return x.active; });
    if (active.length >= MAX) return null;
    var now = Date.now();
    var it = {
      id: mkId(), sym: a.sym, label: a.label || a.sym, mode: a.mode || 'usd',
      cond: a.cond, price: price, repeat: a.repeat === 'every' ? 'every' : 'once',
      expiresAt: (typeof a.expiresAt === 'number' && a.expiresAt > now) ? a.expiresAt : null,
      msg: (typeof a.msg === 'string' && a.msg.trim()) ? a.msg.trim().slice(0, 120) : '',
      active: true, armed: true, lastSide: 0, createdAt: now, firedAt: null, firedPrice: null,
      shared: false, sharedAt: null, updatedAt: now
    };
    if (!it.msg) it.msg = defaultMsg(it, 'fa');
    store.push(it); dirty = true; save();
    return it;
  }
  function remove(id) {
    var i, found = false;
    for (i = 0; i < store.length; i++) if (store[i].id === id) { store.splice(i, 1); found = true; break; }
    if (found) { if (tombstones.indexOf(id) < 0) tombstones.push(id); dirty = true; save(); }
    return found;
  }
  function find(id) {
    var i;
    for (i = 0; i < store.length; i++) if (store[i].id === id) return store[i];
    return null;
  }
  function setActive(id, on) {
    var a = find(id);
    if (!a) return false;
    a.active = !!on;
    if (a.active) { a.armed = true; a.lastSide = 0; }
    a.updatedAt = Date.now(); dirty = true; save();
    return true;
  }
  function setShared(id, on) {
    var a = find(id);
    if (!a) return false;
    a.shared = !!on;
    a.sharedAt = a.shared ? Date.now() : null;
    a.updatedAt = Date.now(); dirty = true; save();
    return true;
  }
  function list(sym) {
    if (!sym) return store.slice();
    return store.filter(function (x) { return x.sym === sym; });
  }
  function listActive(sym) { return list(sym).filter(function (x) { return x.active; }); }
  function pruneExpired(now) {
    now = now || Date.now();
    var changed = false, i;
    for (i = 0; i < store.length; i++) {
      var a = store[i];
      if (a.active && a.expiresAt && now > a.expiresAt) { a.active = false; a.updatedAt = now; changed = true; }
    }
    if (changed) { dirty = true; save(); }
    return changed;
  }
  function sideOf(price, target) { return price > target ? 1 : price < target ? -1 : 0; }
  /* بررسی یک قیمت تازه برای یک نماد؛ fired[] برمی‌گرداند و حالت را ذخیره می‌کند.
     prevPrice فقط برای «عبور» لازم نیست — سمتِ فعلی با lastSide مقایسه می‌شود. */
  function check(sym, price, now) {
    now = now || Date.now();
    var out = [];
    if (typeof price !== 'number' || !isFinite(price)) return out;
    pruneExpired(now);
    var i, a, changed = false;
    for (i = 0; i < store.length; i++) {
      a = store[i];
      if (!a.active || a.sym !== sym) continue;
      var fire = false, side = sideOf(price, a.price);
      if (a.cond === 'cross' || a.cond === 'crossUp' || a.cond === 'crossDown') {
        if (a.lastSide === 0) { if (side !== 0) { a.lastSide = side; changed = true; } continue; }
        if (side !== 0 && side !== a.lastSide) {
          if (a.cond === 'cross') fire = true;
          else if (a.cond === 'crossUp' && a.lastSide < 0 && side > 0) fire = true;
          else if (a.cond === 'crossDown' && a.lastSide > 0 && side < 0) fire = true;
          a.lastSide = side; changed = true;
        } else if (side !== 0 && a.lastSide !== side) { a.lastSide = side; changed = true; }
      } else if (a.cond === 'above') {
        var above = price >= a.price;
        if (above && a.armed) fire = true;
        if (a.armed !== !above) { a.armed = !above; changed = true; }
      } else if (a.cond === 'below') {
        var below = price <= a.price;
        if (below && a.armed) fire = true;
        if (a.armed !== !below) { a.armed = !below; changed = true; }
      }
      if (fire) {
        a.firedAt = now; a.firedPrice = price; a.updatedAt = now; changed = true;
        if (a.repeat === 'once') a.active = false;
        out.push(a);
      }
    }
    if (changed) { dirty = true; save(); }
    return out;
  }
  var api = {
    add: add, remove: remove, setActive: setActive, setShared: setShared,
    list: list, listActive: listActive,
    check: check, pruneExpired: pruneExpired, condLabel: condLabel, defaultMsg: defaultMsg,
    reload: function () { loadStarted = false; return loadAll(); },
    backend: function () { return { cloud: !!tgCS, local: true, cloudError: lastCloudError, localError: lastLocalError }; },
    MAX: MAX
  };
  Object.defineProperty(api, 'ready', { get: function () { return ready; } });
  window.OnellaAlerts = api;
})();

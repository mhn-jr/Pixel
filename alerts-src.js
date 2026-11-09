/* Mini App v1.9.0 — هشدار قیمت (به سبک دیالوگ تریدینگ‌ویو، ولی با موتور خود اپ):
   - شرط: عبور (هر جهت) / عبور به بالا / عبور به پایین / بالاتر از / پایین‌تر از.
   - تکرار: فقط یک بار / هر بار. انقضا: ۱ روز / ۱ هفته / ۱ ماه / بدون انقضا (پیش‌فرض ۱ ماه).
   - پیام: خودکار «نماد + شرط + قیمت»، قابل ویرایش.
   - ذخیره در localStorage (کلید onella_alerts_v1، سقف ۵۰ هشدار فعال در کل).
   - بررسی فقط وقتی مینی‌اپ باز است (قیمت زنده/پولینگ) — وقتی بسته است هیچ هشداری
     نمی‌رسد؛ سرور/پوش ندارد. این محدودیت در مودال هم نوشته می‌شود، نه در سکوت.
   - عبور با «تغییر سمت قیمت نسبت به هدف» تشخیص داده می‌شود (نه با یک تیک)؛
     بالاتر/پایین‌تر با گذار نادرست→درست و مسلح‌شدن دوباره وقتی قیمت برگشت.
   - هیچ عددی ساخته نمی‌شود: قیمت فقط همان قیمت تازهٔ نماد است که app.js می‌دهد. */
(function () {
  var KEY = 'onella_alerts_v1';
  var MAX = 50;
  var CONDS = ['cross', 'crossUp', 'crossDown', 'above', 'below'];
  var store = [];
  function load() {
    try { var r = JSON.parse(localStorage.getItem(KEY) || 'null'); store = Array.isArray(r) ? r : []; }
    catch (_) { store = []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {} }
  load();
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
      active: true, armed: true, lastSide: 0, createdAt: now, firedAt: null, firedPrice: null
    };
    if (!it.msg) it.msg = defaultMsg(it, 'fa');
    store.push(it); save();
    return it;
  }
  function remove(id) {
    var i, found = false;
    for (i = 0; i < store.length; i++) if (store[i].id === id) { store.splice(i, 1); found = true; break; }
    if (found) save();
    return found;
  }
  function setActive(id, on) {
    var a = null, i;
    for (i = 0; i < store.length; i++) if (store[i].id === id) a = store[i];
    if (!a) return false;
    a.active = !!on;
    if (a.active) { a.armed = true; a.lastSide = 0; }
    save();
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
      if (a.active && a.expiresAt && now > a.expiresAt) { a.active = false; changed = true; }
    }
    if (changed) save();
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
    var i, a;
    for (i = 0; i < store.length; i++) {
      a = store[i];
      if (!a.active || a.sym !== sym) continue;
      var fire = false, side = sideOf(price, a.price);
      if (a.cond === 'cross' || a.cond === 'crossUp' || a.cond === 'crossDown') {
        if (a.lastSide === 0) { a.lastSide = side; continue; }
        if (side !== 0 && side !== a.lastSide) {
          if (a.cond === 'cross') fire = true;
          else if (a.cond === 'crossUp' && a.lastSide < 0 && side > 0) fire = true;
          else if (a.cond === 'crossDown' && a.lastSide > 0 && side < 0) fire = true;
          a.lastSide = side;
        } else if (side !== 0) a.lastSide = side;
      } else if (a.cond === 'above') {
        var above = price >= a.price;
        if (above && a.armed) fire = true;
        a.armed = !above;
      } else if (a.cond === 'below') {
        var below = price <= a.price;
        if (below && a.armed) fire = true;
        a.armed = !below;
      }
      if (fire) {
        a.firedAt = now; a.firedPrice = price;
        if (a.repeat === 'once') a.active = false;
        out.push(a);
      }
    }
    if (out.length) save();
    else {
      /* lastSide/armed هم تغییر حالت است — اگر عوض شد ذخیره کن. */
      save();
    }
    return out;
  }
  window.OnellaAlerts = {
    add: add, remove: remove, setActive: setActive, list: list, listActive: listActive,
    check: check, pruneExpired: pruneExpired, condLabel: condLabel, defaultMsg: defaultMsg,
    reload: load, MAX: MAX
  };
})();

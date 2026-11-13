/* Onella — هستهٔ خالص هشدار قیمت (js/179a) — بدون DOM، بدون شبکه، بدون ذخیره‌سازی.
   یک منبع حقیقت برای مرورگر (js/179) و سرور (server/alerts.js با require): شرط‌ها، ماشه، انقضا، برنامهٔ اعلان، قالب پیام، پاک‌سازی ورودی.
   API: OnellaAlertsCore = { OPS, TRIGGERS, INTERVALS, evalCond, describe, intervalMs, barId, canFire, expired, inSchedule, render, normalize, defaults }
   تست: node tests/alerts-core-tests.js */
(function (root) {
'use strict';
/* شرط‌ها: key ← [نام فارسی, نام انگلیسی, نوع مقدار: 1 عدد | 2 دو عدد (کانال) | p درصد] */
var OPS = {
  cross:   ['عبور (Crossing)', 'Crossing', 1],
  up:      ['عبور رو به بالا', 'Crossing up', 1],
  down:    ['عبور رو به پایین', 'Crossing down', 1],
  gt:      ['بزرگ‌تر از', 'Greater than', 1],
  lt:      ['کوچک‌تر از', 'Less than', 1],
  inch:    ['ورود به کانال', 'Entering channel', 2],
  outch:   ['خروج از کانال', 'Exiting channel', 2],
  pctup:   ['افزایش درصدی', 'Moving up %', 'p'],
  pctdown: ['کاهش درصدی', 'Moving down %', 'p']
};
var TRIGGERS = {
  once:     ['فقط یک‌بار', 'Once only'],
  bar:      ['یک‌بار در هر کندل', 'Once per bar'],
  minute:   ['یک‌بار در دقیقه', 'Once per minute'],
  every:    ['هر بار', 'Every time']
};
var INTERVALS = { chart: 0, '1m': 60e3, '5m': 300e3, '15m': 900e3, '30m': 1800e3, '1h': 3600e3, '4h': 14400e3, '1d': 86400e3, '1w': 604800e3 };
var MAXN = 100, MAXMSG = 300;

function num(v) { v = +v; return isFinite(v) ? v : NaN; }
function fmtNum(v) {
  v = +v; if (!isFinite(v)) return '—';
  var a = Math.abs(v), d = a >= 1000 ? 2 : a >= 1 ? 4 : a >= 0.01 ? 6 : 8;
  var s = v.toFixed(d); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.');
}
function lohi(c) { var a = num(c.v), b = num(c.v2); return a <= b ? [a, b] : [b, a]; }

/* آیا در حرکت prev → price شرط برقرار شد؟ (prev ممکن است null باشد: عبور/ورود/خروج بدون prev نمی‌شود) */
function evalCond(c, prev, price) {
  if (!c || !isFinite(price)) return false;
  var v = num(c.v), has = prev != null && isFinite(prev), ref;
  switch (c.op) {
    case 'cross': return has && isFinite(v) && ((prev < v && price >= v) || (prev > v && price <= v));
    case 'up':    return has && isFinite(v) && prev < v && price >= v;
    case 'down':  return has && isFinite(v) && prev > v && price <= v;
    case 'gt':    return isFinite(v) && price > v;
    case 'lt':    return isFinite(v) && price < v;
    case 'inch':  { var r = lohi(c); if (!has || !isFinite(r[0]) || !isFinite(r[1])) return false; var wasIn = prev >= r[0] && prev <= r[1], isIn = price >= r[0] && price <= r[1]; return !wasIn && isIn; }
    case 'outch': { var q = lohi(c); if (!has || !isFinite(q[0]) || !isFinite(q[1])) return false; var wi = prev >= q[0] && prev <= q[1], ii = price >= q[0] && price <= q[1]; return wi && !ii; }
    case 'pctup':   ref = num(c.ref); return isFinite(v) && ref > 0 && (price - ref) / ref * 100 >= v;
    case 'pctdown': ref = num(c.ref); return isFinite(v) && ref > 0 && (ref - price) / ref * 100 >= v;
  }
  return false;
}
function describe(c, lang) {
  var i = lang === 'en' ? 1 : 0, o = OPS[c && c.op]; if (!o) return '';
  var n = o[i];
  if (o[2] === 2) { var r = lohi(c); return n + ' ' + fmtNum(r[0]) + ' – ' + fmtNum(r[1]); }
  if (o[2] === 'p') return n + ' ' + fmtNum(c.v) + '%';
  return n + ' ' + fmtNum(c.v);
}
function intervalMs(iv, chartTfMs) { var m = INTERVALS[iv]; return m ? m : (chartTfMs > 0 ? chartTfMs : 86400e3); }
function barId(now, ms) { return Math.floor(now / ms); }

/* آیا هشدار الان اجازهٔ شلیک دارد؟ (وضعیت/انقضا/نوع ماشه) — a.fa آخرین شلیک، a.fb شناسهٔ کندلِ آخرین شلیک */
function canFire(a, now, chartTfMs) {
  if (!a || a.st !== 'active') return false;
  if (expired(a, now)) return false;
  var last = +a.fa || 0;
  switch (a.tr) {
    case 'once':   return !last;
    case 'bar':    return a.fb !== barId(now, intervalMs(a.iv, chartTfMs));
    case 'minute': return now - last >= 60e3;
    case 'every':  return now - last >= 10e3;
  }
  return !last;
}
function expired(a, now) { return !!(a && a.ex && +a.ex > 0 && now >= +a.ex); }

/* برنامهٔ اعلان: s = {m:'all'|'custom', from:'HH:MM', to:'HH:MM', days:[0..6], off:دقیقه‌ی اختلاف با UTC} — خارج از برنامه اعلان بی‌صدا می‌ماند */
function inSchedule(s, now) {
  if (!s || s.m !== 'custom') return true;
  var off = isFinite(+s.off) ? +s.off : 0, d = new Date(now + off * 60e3);
  var day = d.getUTCDay(), mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (Array.isArray(s.days) && s.days.length && s.days.indexOf(day) < 0) return false;
  function mm(t) { var m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  var a = mm(s.from), b = mm(s.to); if (a == null || b == null) return true;
  return a <= b ? (mins >= a && mins <= b) : (mins >= a || mins <= b);
}

/* قالب پیام: {{ticker}} {{price}} {{interval}} {{condition}} {{time}} {{value}} */
function render(tpl, a, price, now, lang) {
  var t = String(tpl || '');
  var map = { ticker: a.sym, price: fmtNum(price), interval: a.iv === 'chart' ? (a.tfl || '') : a.iv, condition: describe(a.c, lang), time: new Date(now).toISOString().replace('T', ' ').slice(0, 19) + ' UTC', value: fmtNum(a.c && a.c.v) };
  return t.replace(/\{\{\s*(ticker|price|interval|condition|time|value)\s*\}\}/g, function (_, k) { return map[k]; }).slice(0, MAXMSG);
}
function defaultMessage(a, lang) { return '{{ticker}}, ' + '{{interval}}' + ', ' + describe(a.c, lang); }

/* پاک‌سازی ورودی ناقابل‌اعتماد (کلاینت/مینی‌اپ/سرور). null = نامعتبر */
function normalize(x, now) {
  if (!x || typeof x !== 'object') return null;
  var id = String(x.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40); if (!id) return null;
  var sym = String(x.sym || '').toUpperCase().replace(/[^A-Z0-9:._\/-]/g, '').slice(0, 30); if (!sym) return null;
  var c = x.c || {}, op = OPS[c.op] ? c.op : null; if (!op) return null;
  var out = { id: id, sym: sym, kind: String(x.kind || 'crypto').replace(/[^a-z_]/g, '').slice(0, 12) || 'crypto', c: { op: op } };
  var need = OPS[op][2];
  out.c.v = num(c.v); if (!isFinite(out.c.v) || (need !== 'p' && out.c.v <= 0) || (need === 'p' && (out.c.v <= 0 || out.c.v > 1000))) return null;
  if (need === 2) { out.c.v2 = num(c.v2); if (!isFinite(out.c.v2) || out.c.v2 <= 0) return null; }
  if (need === 'p') { out.c.ref = num(c.ref); if (!(out.c.ref > 0)) return null; }
  out.qs = String(x.qs || sym).toUpperCase().replace(/[^A-Z0-9:._\/-]/g, '').slice(0, 30) || sym;   /* نمادِ درگاه قیمت (مثلاً BTC/USDT) */
  out.iv = INTERVALS.hasOwnProperty(x.iv) ? x.iv : 'chart';
  out.tfl = String(x.tfl || '').replace(/[^0-9a-zA-Z]/g, '').slice(0, 5);
  out.tr = TRIGGERS[x.tr] ? x.tr : 'once';
  out.ex = +x.ex > 0 ? Math.min(+x.ex, (now || Date.now()) + 366 * 86400e3 * 3) : 0;
  out.msg = String(x.msg == null ? '' : x.msg).slice(0, MAXMSG);
  var n = x.n || {};
  out.n = { app: n.app !== false, toast: n.toast !== false, sound: !!n.sound, tg: !!n.tg, hook: !!n.hook };
  out.hookUrl = n.hook && /^https:\/\/[^\s]{4,300}$/.test(String(x.hookUrl || '')) ? String(x.hookUrl) : '';
  if (!out.hookUrl) out.n.hook = false;
  var s = x.sch || {};
  out.sch = s.m === 'custom' ? { m: 'custom', from: /^\d{1,2}:\d{2}$/.test(s.from) ? s.from : '09:00', to: /^\d{1,2}:\d{2}$/.test(s.to) ? s.to : '22:00', days: Array.isArray(s.days) ? s.days.filter(function (d) { return d >= 0 && d <= 6; }).slice(0, 7) : [], off: Math.max(-840, Math.min(840, +s.off || 0)) } : { m: 'all' };
  out.st = x.st === 'paused' || x.st === 'triggered' || x.st === 'expired' ? x.st : 'active';
  out.lp = isFinite(+x.lp) && +x.lp > 0 ? +x.lp : null;      /* آخرین قیمتِ دیده‌شده (برای تشخیص عبور) */
  out.fa = +x.fa > 0 ? +x.fa : 0; out.fb = isFinite(+x.fb) ? +x.fb : null; out.cnt = Math.max(0, Math.min(1e6, +x.cnt || 0));
  out.fp = isFinite(+x.fp) && +x.fp > 0 ? +x.fp : null;       /* قیمتِ آخرین شلیک */
  out.ca = +x.ca > 0 ? +x.ca : (now || Date.now()); out.u = +x.u > 0 ? +x.u : out.ca;
  if (x.del) out.del = 1;
  return out;
}
function defaults() { return { tr: 'once', iv: 'chart', n: { app: true, toast: true, sound: false, tg: false, hook: false }, sch: { m: 'all' } }; }

var api = { OPS: OPS, TRIGGERS: TRIGGERS, INTERVALS: INTERVALS, MAXN: MAXN, fmtNum: fmtNum, evalCond: evalCond, describe: describe, intervalMs: intervalMs, barId: barId, canFire: canFire, expired: expired, inSchedule: inSchedule, render: render, defaultMessage: defaultMessage, normalize: normalize, defaults: defaults };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) root.OnellaAlertsCore = api;
})(typeof window !== 'undefined' ? window : null);

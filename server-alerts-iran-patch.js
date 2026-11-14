// ============================================================================
// server-alerts-iran-patch.js — پچ سرور اپ اصلی برای همگام‌سازی هشدارهای ایران
// Mini App v1.17.0 — ⚠️ UNVERIFIED (تأییدنشده) ⚠️
// ----------------------------------------------------------------------------
// وضعیت: این فایل در این محیط آزمایش نشده است، چون server/alerts.js اپ اصلی
// در این workspace نیست (نه در درخت محلی P2 و نه در زیپ v1.350) و
// tools/alerts-sync-test.js هم بدون ONELLA_ROOT اجرا نمی‌شود
// (Cannot find module '../../Onella/server/alerts.js').
// پس قبل از اینکه روی سرور زنده بگذاری، قدم‌های «نصب» پایین را با چشم بخوان و
// بعد از نصب، یک هشدار ایران در مینی‌اپ بساز و ببین پیام تلگرام می‌رسد یا نه.
//
// چه می‌کند: به سرور یاد می‌دهد هشدارهای ایران را (که مینی‌اپ v1.17.0 با
// kind ‏«iran» و «iranrate» می‌فرستد) بپذیرد، قیمت‌شان را بگیرد و مثل بقیهٔ
// هشدارها هنگام شلیک پیام تلگرام بفرستد.
//
// قرارداد مینی‌اپ ⇄ سرور (v1.17.0 — در alerts-src.js هم همین است):
//   - سهام بورس/فرابورس: { sym: 'فولاد', qs: 'فولاد', kind: 'iran' }
//     قیمت به ریال است؛ سرور قیمت را از مفید می‌گیرد.
//   - نرخ‌های ایران: { sym: 'usd', qs: 'usd', kind: 'iranrate' }
//     قیمت به تومان است؛ سرور قیمت را از نر‌خسنج می‌گیرد.
//     توجه: kind ‏«iranrate» بدون خط تیره است — هستهٔ مشترک (alerts-core.js)
//     خط تیره را حذف می‌کند، پس «iran-rate» در هر دو طرف به «iranrate»
//     تبدیل می‌شد و ناهماهنگ می‌شد.
//   - آتی «=F» هنوز همگام نمی‌شود و محلی می‌ماند (مثل قبل).
//
// نصب (حدود ۲ دقیقه، ۳ قدم — بدون تغییر در منطق بقیهٔ هشدارها):
//   قدم ۱ — در جایی که createAlerts صدا زده می‌شود (server.js یا همان فایلی
//     که سرور آلرت را می‌سازد)، آرگومان quote را با withIranQuotes بپوشان:
//       const { withIranQuotes } = require('./server-alerts-iran-patch.js');
//       const svc = createAlerts({
//         env, fetch, send, body, log,
//         quote: withIranQuotes(myQuoteFn, fetch, 'https://pixelminiapp.mahanjafari039.workers.dev'),
//       });
//     اگر سرور تو quote ندارد (quote: async () => null) هم همین کار را بکن؛
//     فقط به‌جای myQuoteFn همان () => null را بده.
//   قدم ۲ — در حلقهٔ اعتبارسنجی آیتم‌های PUT /sync، kind های «iran» و
//     «iranrate» را بپذیر (تابع acceptsIranKind همین‌جاست). قانون مهم:
//     سرور هرگز نباید کل PUT را به‌خاطر یک kind ناشناخته 400 کند — فقط
//     همان آیتم را از items پاسخ حذف کند (یا در rejected بیاورد)؛ مینی‌اپ
//     نبودن آیتم در پاسخ را به‌معنای «رد شد» می‌فهمد و هشدار را محلی نگه می‌دارد.
//   قدم ۳ — در پاسخ‌های PUT /sync و GET /list، فیلد iran: true را اضافه کن
//     تا کلاینت بداند سرور ایران را پشتیبانی می‌کند:
//       { ok: true, iran: true, items: [...] }
//   قدم ۴ (فقط اگر سرور از همان alerts-core.js مشترک استفاده می‌کند) —
//     در normalize همان هسته، sym و qs با عبارت منظم ASCII-only
//     (/[^A-Z0-9:._\/-]/g) پاک می‌شوند و نماد فارسی «فولاد» به رشتهٔ خالی
//     تبدیل می‌شود و هشدار حذف می‌شود. همان دو خط را مثل مینی‌اپ عوض کن:
//       .replace(/[^A-Z0-9:._\/-]/g, '')   →   .replace(/[^\p{L}\p{N}:._\/-]/gu, '')
//     (برای sym و برای qs — هر دو خط، در alerts-core.js.)
//
// فرض‌های این پچ (اگر در سرور تو فرق می‌کند، همان‌جا عوضش کن):
//   الف) تابع quote سرور یک عدد (قیمت لحظه‌ای) یا null برمی‌گرداند. اگر
//     quote تو یک آبجکت برمی‌گرداند (مثلاً { price, ... })، خروجی priceIran
//     را همان‌جا به همان شکل برگردان.
//   ب) ورکر مینی‌اپ در دسترس سرور است:
//     https://pixelminiapp.mahanjafari039.workers.dev
//     (مسیر /mofid?kind=bulk&symbols=... همان مسیری است که مینی‌اپ استفاده می‌کند.)
//   ج) live.json نر‌خسنج مستقیم از سرور خوانده می‌شود؛ اگر نشد، از مسیر
//     پروکسی ورکر (/nerkhsanj?u=...) استفاده می‌شود. اگر سرور تو خودش به
//     مفید/TSETMC یا نر‌خسنج دسترسی مستقیم دارد، priceIran را با همان
//     فراخوانی خودت جایگزین کن — فقط امضا و خروجی (عدد یا null) را نگه دار.
//   د) ارسال تلگرام هنگام شلیک از قبل در سرور هست (fetch تزریق‌شده) و نیازی
//     به تغییر ندارد — فقط قیمت ایران از quote پوشیده‌شده می‌آید.
// ============================================================================
'use strict';

var WORKER_URL = 'https://pixelminiapp.mahanjafari039.workers.dev';
var NERKHSANJ_LIVE = 'https://nerkh.jahankhahan.shop/data/live.json';

/* همان نگاشت مینی‌اپ (app.js — IRAN_KEYS): کلید نرخ مینی‌اپ ← کلید واقعی live.json.
   مثقال = mesghal (نه mithqal)؛ سکهٔ امامی = coin؛ طلای ۱۸ عیار = gold. */
var IRAN_KEYS = {
  usd: 'dollar', eur: 'euro', gold18: 'gold', emami: 'coin', bahar: 'bahar',
  half: 'half', quarter: 'quarter', mithqal: 'mesghal', tether: 'tether',
  bitcoin: 'bitcoin', gold24: 'gold24', gram: 'gram', silver: 'silver',
  aed: 'aed', gbp: 'pound',
};

var IRAN_KINDS = ['iran', 'iranrate'];

function isIranKind(kind) { return IRAN_KINDS.indexOf(kind) !== -1; }

/* قدم ۲ — در اعتبارسنجی PUT /sync: این kind ها قابل قبول‌اند. */
function acceptsIranKind(kind) { return isIranKind(kind); }

function num(v) { var n = +v; return isFinite(n) && n > 0 ? n : null; }

async function fetchJson(fetchFn, url, timeoutMs) {
  var ctrl = null, timer = null;
  try {
    if (typeof AbortController !== 'undefined') {
      ctrl = new AbortController();
      timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, timeoutMs || 10000);
    }
    var r = await fetchFn(url, ctrl ? { signal: ctrl.signal } : undefined);
    if (!r || !r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* قیمت سهام بورس/فرابورس (ریال) از ورکر مینی‌اپ — همان /mofid?kind=bulk که
   مینی‌اپ استفاده می‌کند؛ پاسخ: { quotes: [{ symbol, price, ... }] }. */
async function priceIranStock(fetchFn, workerUrl, sym) {
  var base = String(workerUrl || WORKER_URL).replace(/\/$/, '');
  var j = await fetchJson(fetchFn, base + '/mofid?kind=bulk&symbols=' + encodeURIComponent(sym), 20000);
  var quotes = j && Array.isArray(j.quotes) ? j.quotes : [];
  for (var i = 0; i < quotes.length; i++) {
    var q = quotes[i] || {};
    if (String(q.symbol || q.sym || '') === sym) return num(q.price != null ? q.price : (q.last != null ? q.last : q.close));
  }
  return null;
}

/* قیمت نرخ ایران (تومان) از live.json نر‌خسنج؛ اول مستقیم، اگر نشد از پروکسی ورکر. */
async function priceIranRate(fetchFn, workerUrl, key) {
  var k = IRAN_KEYS[key];
  if (!k) return null;
  var j = await fetchJson(fetchFn, NERKHSANJ_LIVE, 10000);
  if (!j || !j.rates) {
    var base = String(workerUrl || WORKER_URL).replace(/\/$/, '');
    j = await fetchJson(fetchFn, base + '/nerkhsanj?u=' + encodeURIComponent(NERKHSANJ_LIVE), 10000);
  }
  var rates = j && j.rates;
  return rates ? num(rates[k]) : null;
}

/* قیمت یک هشدار ایران؛ برای بقیهٔ kind ها null برمی‌گرداند (یعنی «به من ربطی ندارد»). */
async function priceIran(alert, fetchFn, workerUrl) {
  if (!alert || !isIranKind(alert.kind)) return null;
  if (alert.kind === 'iran') return priceIranStock(fetchFn, workerUrl, String(alert.sym || alert.qs || ''));
  return priceIranRate(fetchFn, workerUrl, String(alert.sym || alert.qs || ''));
}

/* قدم ۱ — پوشاندن quote تزریق‌شده به createAlerts. امضا و خروجی quote اصلی
   حفظ می‌شود؛ فقط هشدارهای ایران از priceIran قیمت می‌گیرند. */
function withIranQuotes(quoteFn, fetchFn, workerUrl) {
  var orig = typeof quoteFn === 'function' ? quoteFn : async function () { return null; };
  var f = typeof fetchFn === 'function' ? fetchFn : fetch;
  var w = workerUrl || WORKER_URL;
  return async function (alert) {
    if (alert && isIranKind(alert.kind)) {
      var p = await priceIran(alert, f, w);
      if (p != null) return p;
      return null;   /* قیمت ایران پیدا نشد: هشدار این دور سنجیده نمی‌شود، حذف نمی‌شود */
    }
    return orig(alert);
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { withIranQuotes: withIranQuotes, priceIran: priceIran, isIranKind: isIranKind, acceptsIranKind: acceptsIranKind, IRAN_KINDS: IRAN_KINDS, IRAN_KEYS: IRAN_KEYS, WORKER_URL: WORKER_URL };
}

'use strict';
/* Onella Telegram Mini App — Cloudflare Worker پروکسی (پلن رایگان: ۱۰۰٬۰۰۰ درخواست/روز).
   فقط برای دادهٔ عمومی بازار است؛ هیچ کلید/توکنی ندارد و نمی‌خواهد.
   چرا لازم است؟ مرورگر مستقیم به Yahoo و Google News و Nerkhsanj دسترسی ندارد (CORS).
   ورکر فقط به هاست‌های مجازِ زیر درخواست می‌فرستد و هدر CORS می‌گذارد — پروکسی باز نیست.
   مسیرها (همان‌هایی که app.js صدا می‌زند):
     /yahoo-chart?u=<url کامل>  → v8 chart (کندل + قیمت)
     /yahoo-quote?u=<SYMBOL>    → v7 quote با crumb (قیمت + بنیادی)؛ اگر نشد، v8 chart
     /rss?u=<url کامل>          → Google News RSS / CoinDesk RSS
     /nerkhsanj?u=<url کامل>    → Nerkhsanj live.json
     /binance?u=<url کامل>      → Binance vision (قیمت/کندل کریپتو) — وقتی گوشی/PC مستقیم نمی‌رسد
     /coingecko?u=<url کامل>    → CoinGecko (قیمت/کندل/بنیادی کریپتو)
     /iran?u=<url کامل>         → صرافی ایرانی: Exir tickers، Wallex markets/UDF، Nobitex stats/orderbook
   نصب: wrangler deploy — یا در داشبورد Cloudflare: Workers & Pages → Create →
   این فایل را به‌عنوان Worker بگذار و آدرسش را در app.js در PROXY_URL بنویس.
   منطق Yahoo دقیقاً همان yahoo.js ربات است (crumb + cookie، کش در حافظه، fallback به v8). */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const TIMEOUT_MS = 15000;

const ALLOW = [
  { host: 'query2.finance.yahoo.com', prefix: '/v8/finance/chart/' },
  { host: 'news.google.com', prefix: '/rss/' },
  { host: 'www.coindesk.com', prefix: '/arc/outboundfeeds/rss/' },
  { host: 'nerkh.jahankhahan.shop', prefix: '/data/live.json' },
  // v1.0.2 — کریپتو از ورکر (گوشی/PC مستقیم به Binance/CoinGecko نمی‌رسد):
  { host: 'data-api.binance.vision', prefix: '/api/v3/' },
  { host: 'api.coingecko.com', prefix: '/api/v3/' },
  // v1.0.2 — صرافی ایرانی (قیمت ریالی؛ مرورگر مستقیم CORS بلاک است):
  { host: 'api.exir.io', prefix: '/v2/tickers' },
  { host: 'api.wallex.ir', prefix: '/v1/markets' },
  { host: 'api.wallex.ir', prefix: '/v1/udf/history' },
  { host: 'api.nobitex.ir', prefix: '/market/stats' },
  { host: 'api.nobitex.ir', prefix: '/v2/orderbook/' }
];

function corsHeaders(extra) {
  const h = new Headers(extra || {});
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  h.set('Access-Control-Allow-Headers', '*');
  return h;
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: corsHeaders({ 'Content-Type': 'application/json' }) });
}
function allowedTarget(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    for (const a of ALLOW) {
      if (u.host === a.host && u.pathname.indexOf(a.prefix) === 0) return u.toString();
    }
    return null;
  } catch (e) { return null; }
}

/* ---- Yahoo quote — همان yahoo.js ربات ---- */
let creds = null; // {crumb, cookie}
async function refreshCreds() {
  const r1 = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': UA }, redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const setCookie = (r1.headers && typeof r1.headers.get === 'function')
    ? (r1.headers.get('set-cookie') || '') : '';
  const cookie = setCookie.split(',').map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
  const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: Object.assign({ 'User-Agent': UA }, cookie ? { Cookie: cookie } : {}),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const crumb = (await r2.text()).trim();
  if (!crumb || !/^[A-Za-z0-9._-]+$/.test(crumb)) throw new Error('no crumb');
  creds = { crumb, cookie };
  return creds;
}
async function getJson(url, headers) {
  const r = await fetch(url, {
    headers: Object.assign({ 'User-Agent': UA, Accept: 'application/json' }, headers || {}),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const text = await r.text();
  let body = null;
  try { body = JSON.parse(text); } catch (e) { body = null; }
  return { status: r.status, ok: r.ok, body, text };
}
async function quoteOnce(symbol, c) {
  const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(symbol)
    + (c && c.crumb ? '&crumb=' + encodeURIComponent(c.crumb) : '');
  const headers = {};
  if (c && c.cookie) headers.Cookie = c.cookie;
  const r = await getJson(url, headers);
  if (!r.ok) return { status: r.status, quote: null };
  const res = r.body && r.body.quoteResponse && r.body.quoteResponse.result;
  const q = Array.isArray(res) && res[0] ? res[0] : null;
  if (!q || !(q.regularMarketPrice > 0)) return { status: r.status, quote: null };
  const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const str = v => (typeof v === 'string' && v ? v : null);
  return {
    status: r.status,
    quote: {
      price: q.regularMarketPrice,
      changePct: num(q.regularMarketChangePercent),
      high: num(q.regularMarketDayHigh), low: num(q.regularMarketDayLow),
      open: num(q.regularMarketOpen), prevClose: num(q.regularMarketPreviousClose),
      volume: num(q.regularMarketVolume),
      marketCap: num(q.marketCap),
      pe: num(q.trailingPE) ?? num(q.forwardPE),
      peForward: num(q.forwardPE),
      pb: num(q.priceToBook),
      trailingEps: num(q.trailingEps),
      beta: num(q.beta),
      sharesOutstanding: num(q.sharesOutstanding),
      avg50: num(q.fiftyDayAverage),
      avg200: num(q.twoHundredDayAverage),
      earningsTs: (typeof q.earningsTimestamp === 'number' && q.earningsTimestamp > 0) ? q.earningsTimestamp : null,
      divYield: num(q.dividendYield),
      week52High: num(q.fiftyTwoWeekHigh), week52Low: num(q.fiftyTwoWeekLow),
      name: str(q.longName) || str(q.shortName),
      currency: str(q.currency), exchange: str(q.fullExchangeName) || str(q.exchange)
    }
  };
}
async function chartQuote(sym) {
  try {
    const url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=5d&interval=1d';
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!r.ok) return null;
    const body = await r.json();
    const res0 = body && body.chart && Array.isArray(body.chart.result) && body.chart.result[0];
    if (!res0 || !res0.meta) return null;
    const meta = res0.meta;
    let price = (typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) ? meta.regularMarketPrice : null;
    if (!price) {
      const closes = res0.indicators && res0.indicators.quote && res0.indicators.quote[0] && res0.indicators.quote[0].close;
      if (Array.isArray(closes)) {
        for (let i = closes.length - 1; i >= 0; i--) {
          if (typeof closes[i] === 'number' && closes[i] > 0) { price = closes[i]; break; }
        }
      }
    }
    if (!price) return null;
    const prev = (typeof meta.previousClose === 'number' && meta.previousClose > 0) ? meta.previousClose : null;
    return {
      price, changePct: prev ? ((price - prev) / prev) * 100 : null,
      high: null, low: null, open: null, prevClose: prev, volume: null,
      marketCap: null, pe: null, peForward: null, pb: null, divYield: null,
      week52High: null, week52Low: null,
      name: meta.longName || meta.shortName || null,
      currency: meta.currency || null, exchange: meta.fullExchangeName || meta.exchangeName || null
    };
  } catch (e) { return null; }
}
async function getQuote(symbol) {
  const sym = String(symbol || '').trim();
  if (!sym) return null;
  try {
    if (!creds) await refreshCreds();
    let r = await quoteOnce(sym, creds);
    if (!r.quote && r.status === 401) { await refreshCreds(); r = await quoteOnce(sym, creds); }
    if (r.quote) return r.quote;
  } catch (e) { /* به v8 می‌افتد */ }
  return chartQuote(sym);
}

/* ---- روت اصلی ---- */
async function handle(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const url = new URL(req.url);
  const kind = url.pathname.replace(/^\/+/, '').split('/')[0];
  const target = url.searchParams.get('u') || '';

  if (kind === 'yahoo-quote') {
    if (!/^[A-Za-z0-9.^=-]+$/.test(target)) return json({ quote: null }, 400);
    const q = await getQuote(target);
    const res = json({ quote: q });
    res.headers.set('Cache-Control', 'public, max-age=30');
    return res;
  }
  if (kind === 'yahoo-chart' || kind === 'rss' || kind === 'nerkhsanj' || kind === 'binance' || kind === 'coingecko' || kind === 'iran') {
    const ok = allowedTarget(target);
    if (!ok) return json({ error: 'not allowed' }, 403);
    try {
      const r = await fetch(ok, {
        headers: { 'User-Agent': UA, Accept: kind === 'rss' ? 'application/rss+xml, application/xml, text/xml' : 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      const body = await r.text();
      const h = corsHeaders({ 'Content-Type': r.headers.get('content-type') || (kind === 'rss' ? 'application/rss+xml' : 'application/json') });
      h.set('Cache-Control', 'public, max-age=30');
      return new Response(body, { status: r.status, headers: h });
    } catch (e) {
      return json({ error: 'upstream failed' }, 502);
    }
  }
  return json({ error: 'unknown route', routes: ['yahoo-chart', 'yahoo-quote', 'rss', 'nerkhsanj', 'binance', 'coingecko', 'iran'] }, 404);
}

addEventListener('fetch', function (event) {
  event.respondWith(handle(event.request));
});

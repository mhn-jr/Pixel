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
   منطق Yahoo دقیقاً همان yahoo.js ربات است (crumb + cookie، کش در حافظه، fallback به v8).
   v1.1.0 — مفید (بورس/فرابورس ایران): /mofid?kind=resolve&symbol=فولاد → ISIN از فهرست
   stockTickers خود مفید (کش ۱۰ دقیقه؛ فقط ردیف CommonStock با ISIN معتبر)؛
   /mofid?kind=history&isin=..&resolution=..&from=..&to=.. → کندل UDF (t/o/h/l/c/v).
   هدر accept-info و Referer را ورکر می‌گذارد (مرورگر Referer نمی‌تواند بگذارد).
   v1.1.0 — OKX: /okx?u=<url> برای کندل ۱ ثانیه‌ای (fallback کریپتو وقتی Binance نرسد).
   v1.2.0 — داشبورد: /yahoo-multi?symbols=AAPL,MSFT (یک تماس برای همهٔ نمادهای Yahoo)
   و /mofid?kind=bulk&symbols=فولاد,فملی (قیمت پایانی + تغییر روزانهٔ نمادهای بورس/فرابورس).
   v1.11.0 — سرویس آلرت (سریع + هر اکانت جدا): POST /alert-add و /alert-del و
   GET /alert-list + Cron هر ۱ دقیقه. مینی‌اپ آلرت را مستقیم به همین ورکر
   می‌فرستد (نه sendData به ربات روی PC)؛ ورکر initData تلگرام را با توکن
   اعتبارسنجی می‌کند، آلرت را در KV با کلیدِ userId ذخیره می‌کند (هر اکانت
   فقط مال خودش را می‌بیند)، و همان لحظه با Bot API پیام تأیید می‌فرستد
   (۱–۲ ثانیه، بدون polling و بدون PC). شلیک هم با Cron ورکر است (هر دقیقه
   قیمت Binance←Yahoo را می‌گیرد و پیام ردشدن می‌فرستد). نیازمند داشبورد:
   KV binding با نام ALERTS_KV + Secret با نام TELEGRAM_BOT_TOKEN + Cron
   Trigger با عبارت `* * * * *`. توکن هرگز در این فایل نیست. اگر KV یا
   توکن تنظیم نشده باشد، /alert-add با ok:false برمی‌گردد و مینی‌اپ به
   sendData (ربات روی PC) برمی‌گردد — دو بار ثبت نمی‌شود.
   v1.11.1 — Binance vision از IP ورکر 403 می‌دهد (تست زنده ۲۰۲۶-۱۱-۰۹:
   DOT/BTC/ETH همه 403، درحالی‌که مستقیم 200 است؛ CoinGecko هم از همان
   IP با 429 سهمیه‌اش تمام شده). پس قیمت کریپتو در alertPrice با OKX
   جبران می‌شود (تست زنده: DOT-USDT با last=0.8683 آمد) — بدون OKX،
   همهٔ آلرت‌های کریپتو unsupported می‌شدند.
   v1.11.2 — روت تازه POST /alert-list-bot: ربات PC فهرست KV را برای
   «هشدارهای من» می‌گیرد (قبلاً فقط فایل محلی خودش را می‌دید — از ۷–۸
   آلرت فقط یدونه می‌آمد). احراز با HMAC توکن روی "userId:ts" است.
   عنوان پیام ردشدن هم «هشدار به صدا درآمد» شد («رد شد» مثل ردشدنِ
   درخواست خوانده می‌شد). */

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
  { host: 'api.nobitex.ir', prefix: '/v2/orderbook/' },
  // v1.1.0 — OKX (کندل کریپتو، از جمله ۱ ثانیه‌ای):
  { host: 'www.okx.com', prefix: '/api/v5/market/' },
  // v1.2.3 — خبر: BBC (وقتی Google News از IP ورکر 503 می‌دهد، خوراک جایگزین
  // برای بازارهای غیرکریپتو؛ CoinDesk برای کریپتو از قبل بود).
  { host: 'feeds.bbci.co.uk', prefix: '/news/' },
  { host: 'feeds.bbci.co.uk', prefix: '/persian/' },
  // v1.7.0 — خبر: خوراک‌های RSS مستقیم بدون کلید، پروب‌شده ۲۰۲۶-۱۱-۰۹
  // (نبض بورس، ایبنا، فردای اقتصاد، کوین‌تلگراف، CNBC، فدرال رزرو، EIA).
  { host: 'nabzebourse.com', prefix: '/fa/rss/' },
  { host: 'www.ibena.ir', prefix: '/rss' },
  { host: 'ibena.ir', prefix: '/rss' },
  { host: 'www.fardayeeghtesad.com', prefix: '/rss' },
  { host: 'cointelegraph.com', prefix: '/rss' },
  { host: 'www.cnbc.com', prefix: '/id/' },
  { host: 'www.federalreserve.gov', prefix: '/feeds/' },
  { host: 'www.eia.gov', prefix: '/rss/' }
];

function corsHeaders(extra) {
  const h = new Headers(extra || {});
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      /* v1.8.0 — برای تب «عمق» نمادهای یاهو (بهترین خرید/فروش + اندازه) و
         «حجم در برابر میانگین» در بنیادی؛ Yahoo v7 این فیلدها را می‌دهد
         (قیمت‌ها با تأخیر ~۱۵ دقیقه‌اند — در UI گفته می‌شود). */
      bid: num(q.bid), ask: num(q.ask),
      bidSize: num(q.bidSize), askSize: num(q.askSize),
      avgVolume: num(q.averageDailyVolume3Month),
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
      /* v1.8.0 — v8 این‌ها را ندارد؛ صریح null تا renderFund/Depth همان
         «در دسترس نیست» صادقانه را نشان دهند، نه عدد ساختگی. */
      bid: null, ask: null, bidSize: null, askSize: null, avgVolume: null,
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

/* ---- Yahoo چندنمادی (داشبورد v1.2.0) — یک تماس برای همهٔ نمادها ---- */
async function quoteMulti(symbols, c) {
  const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(symbols.join(','))
    + (c && c.crumb ? '&crumb=' + encodeURIComponent(c.crumb) : '');
  const headers = {};
  if (c && c.cookie) headers.Cookie = c.cookie;
  const r = await getJson(url, headers);
  if (!r.ok) return { status: r.status, quotes: [] };
  const res = r.body && r.body.quoteResponse && r.body.quoteResponse.result;
  if (!Array.isArray(res)) return { status: r.status, quotes: [] };
  const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const str = v => (typeof v === 'string' && v ? v : null);
  const quotes = [];
  for (const q of res) {
    if (!(q.regularMarketPrice > 0)) continue;
    quotes.push({
      symbol: str(q.symbol),
      price: q.regularMarketPrice,
      changePct: num(q.regularMarketChangePercent),
      high: num(q.regularMarketDayHigh), low: num(q.regularMarketDayLow),
      open: num(q.regularMarketOpen), prevClose: num(q.regularMarketPreviousClose),
      volume: num(q.regularMarketVolume), marketCap: num(q.marketCap),
      name: str(q.longName) || str(q.shortName), currency: str(q.currency)
    });
  }
  return { status: r.status, quotes };
}
async function getQuotes(symbols) {
  const list = symbols.map(s => String(s || '').trim()).filter(s => /^[A-Za-z0-9.^=-]+$/.test(s)).slice(0, 100);
  if (!list.length) return [];
  try {
    if (!creds) await refreshCreds();
    let r = await quoteMulti(list, creds);
    if (!r.quotes.length && r.status === 401) { await refreshCreds(); r = await quoteMulti(list, creds); }
    if (r.quotes.length) return r.quotes;
  } catch (e) { /* به v8 می‌افتد */ }
  /* v1.2.3 — اگر v7 خالی برگرداند (مثلاً 429 از IP اشتراکی Cloudflare)، با
     v8 chart تک‌نمادی جبران کن؛ سقف ۴۵ نماد تا زیر سقف ۵۰ ساب‌ری‌کوئست پلن
     رایگان بمانیم (چندتاییِ اول = سهام/ETF/فارکس/کالا). */
  try {
    const take = list.slice(0, 45);
    const out = [];
    for (let i = 0; i < take.length; i += 15) {
      const chunk = take.slice(i, i + 15);
      const got = await Promise.all(chunk.map(async (s) => {
        const q = await chartQuote(s);
        return q ? Object.assign({ symbol: s }, q) : null;
      }));
      for (const q of got) if (q) out.push(q);
    }
    return out;
  } catch (e) { return []; }
}

/* ---- مفید (بورس/فرابورس ایران) — v1.1.0 ---- */
const MOFID_GATEWAY = 'https://bv.emofid.com/gateway';
const mofidAcceptInfo = () => `${Date.now() * 4564567}.3094776426`;
function mofidHeaders() {
  return {
    'User-Agent': UA, Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
    Origin: 'https://bv.emofid.com', Referer: 'https://bv.emofid.com/market',
    'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Site': 'same-origin',
    'accept-info': mofidAcceptInfo()
  };
}
function normFa(s) {
  return String(s || '').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').replace(/[\u200c\u200f]/g, '').replace(/\s+/g, ' ').trim();
}
let mofidTickers = { at: 0, list: null };
async function mofidTickersList() {
  if (mofidTickers.list && Date.now() - mofidTickers.at < 600000) return mofidTickers.list;
  const r = await fetch(MOFID_GATEWAY + '/stockTickers', {
    headers: mofidHeaders(), signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!r.ok) throw new Error('tickers ' + r.status);
  const list = await r.json();
  if (!Array.isArray(list) || !list.length) throw new Error('tickers empty');
  mofidTickers = { at: Date.now(), list };
  return list;
}
function mofidPickRow(list, symbol) {
  const q = normFa(symbol);
  const rows = list.filter(x => x && normFa(x.s) === q);
  if (!rows.length) return null;
  const validIsin = x => x && typeof x.i === 'string' && /^IR[A-Z0-9]{10}$/.test(x.i);
  // نماد دقیق + CommonStock + ISIN معتبر (ردیف «محصول»/«شاخص صنعت» با همان نماد را نمی‌خواهیم).
  return rows.find(x => x.t === 'CommonStock' && validIsin(x))
    || rows.find(x => validIsin(x))
    || null;
}
async function mofidResolve(symbol) {
  try {
    const list = await mofidTickersList();
    const row = mofidPickRow(list, symbol);
    if (!row) return { ok: false };
    return { ok: true, isin: row.i, title: row.n || null, exchange: row.ExchangeNameFA || null };
  } catch (e) { return { ok: false, error: String(e && e.message || e).slice(0, 120) }; }
}
async function mofidHistory(isin, resolution, from, to, adj) {
  if (!/^IR[A-Z0-9]{10}$/.test(isin || '')) return json({ error: 'bad isin' }, 400);
  if (!/^(1|5|15|30|60|1D|1W)$/.test(resolution || '')) return json({ error: 'bad resolution' }, 400);
  if (!/^\d+$/.test(String(from)) || !/^\d+$/.test(String(to))) return json({ error: 'bad window' }, 400);
  const u = MOFID_GATEWAY + '/quotes/history?symbol=' + encodeURIComponent(isin)
    + '&resolution=' + resolution + '&from_time=' + from + '&to_time=' + to + '&adjusted=' + (adj === '1' ? 'true' : 'false');
  try {
    let r = await fetch(u, { headers: mofidHeaders(), signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (r.status === 401 || r.status === 403) {
      r = await fetch(u, { headers: mofidHeaders(), signal: AbortSignal.timeout(TIMEOUT_MS) });
    }
    const body = await r.text();
    const h = corsHeaders({ 'Content-Type': 'application/json' });
    h.set('Cache-Control', 'public, max-age=20');
    return new Response(body, { status: r.status, headers: h });
  } catch (e) {
    return json({ error: 'upstream failed' }, 502);
  }
}

/* ---- مفید چندنمادی (داشبورد v1.2.0) — قیمت پایانی + تغییر روزانهٔ ۳۰ نماد
   با یک تماس؛ ورکر تاریخچهٔ ۷ روزهٔ هر نماد را موازی می‌گیرد و از ۲ قیمت
   پایانی آخر، تغییر را حساب می‌کند. نمادی که تاریخچه ندهد، حذف می‌شود (نه عدد ساختگی). */
async function mofidHistoryJson(isin, resolution, from, to, adj) {
  const u = MOFID_GATEWAY + '/quotes/history?symbol=' + encodeURIComponent(isin)
    + '&resolution=' + resolution + '&from_time=' + from + '&to_time=' + to + '&adjusted=' + (adj === '1' ? 'true' : 'false');
  try {
    let r = await fetch(u, { headers: mofidHeaders(), signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (r.status === 401 || r.status === 403) {
      r = await fetch(u, { headers: mofidHeaders(), signal: AbortSignal.timeout(TIMEOUT_MS) });
    }
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || j.s !== 'ok' || !Array.isArray(j.c) || j.c.length < 2) return null;
    return j;
  } catch (e) { return null; }
}
async function mofidBulk(symbols) {
  let list;
  try { list = await mofidTickersList(); } catch (e) { return []; }
  const to = Math.floor(Date.now() / 1000), from = to - 7 * 86400;
  const jobs = symbols.map(async (sym) => {
    try {
      const row = mofidPickRow(list, sym);
      if (!row) return null;
      const j = await mofidHistoryJson(row.i, '1D', from, to, '0');
      if (!j) return null;
      const closes = j.c.filter(v => typeof v === 'number' && Number.isFinite(v) && v > 0);
      if (closes.length < 2) return null;
      const last = closes[closes.length - 1], prev = closes[closes.length - 2];
      return { symbol: sym, isin: row.i, price: last,
        changePct: prev > 0 ? ((last - prev) / prev) * 100 : null,
        asOf: (j.t && j.t.length) ? j.t[j.t.length - 1] * 1000 : null };
    } catch (e) { return null; }
  });
  const out = await Promise.all(jobs);
  return out.filter(Boolean);
}

/* ---- سرویس آلرت v1.11.0 ----
   چرا ورکر؟ تأیید و شلیک آلرت از PC با polling می‌آمد: هر getUpdates تا
   ۳۵ ثانیه هنگ می‌کرد و ۵ دقیقه هیچ poll موفقی نبود (لاگ ۲۰۲۶-۱۱-۰۹)؛
   پس پیام فعال‌شدن/ردشدن یا دیر می‌آمد یا اصلاً نمی‌آمد. ورکر از
   دیتاسنتر Cloudflare مستقیم با api.telegram.org حرف می‌زند — بدون VPN،
   بدون polling — پس تأیید در ۱–۲ ثانیه و شلیک در حداکثر ۱ دقیقه (Cron)
   می‌رسد، حتی با PC خاموش. جداسازی اکانت هم اینجاست: کلید KV شامل
   userId تلگرام است، پس دو اکانت روی یک گوشی هیچ آلرتی را با هم
   نمی‌بینند (باگ v1.10.0: آینهٔ localStorage مشترکِ دستگاه بود). */
function alertEnv(name) {
  try { const v = globalThis[name]; return (typeof v === 'string' && v) ? v : null; } catch (e) { return null; }
}
function alertKV() {
  try { const kv = globalThis.ALERTS_KV; return (kv && typeof kv.get === 'function') ? kv : null; } catch (e) { return null; }
}
function fmtNum(n) {
  const v = +n;
  if (!isFinite(v)) return String(n);
  return v.toLocaleString('en-US', { maximumFractionDigits: 8 });
}
function fmtDate(ms, lang) {
  try { return new Date(ms).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; }
}
function fmtTimeUTC(ms) {
  try { const d = new Date(ms); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); } catch (e) { return ''; }
}
/* v1.11.2 — چیدمان راست‌چین پیام‌های هشدار: هر خط با RLM (U+200F) شروع
   می‌شود تا در تلگرام همهٔ خط‌ها راست‌چین شوند؛ وگرنه خط‌هایی که با
   ایموجی + لاتین شروع می‌شوند (💰 AVAX/USDT) چپ‌چین می‌شوند و متن
   «یکی چپ، یکی راست» دیده می‌شود (گزارش مالک ۲۰۲۶-۱۱-۰۹ + اسکرین‌شات).
   عنوان و نماد و قیمت‌ها بولد‌اند (parse_mode=HTML در tgSend) و پیام
   خودکار مینی‌اپ («نماد — شرط قیمت») که تکراری است، حذف می‌شود. */
const RLM = '\u200F'; // U+200F RIGHT-TO-LEFT MARK
function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function rtlLines(lines) {
  return lines.map(l => (l ? RLM + l : l)).join('\n');
}
function isAutoMsg(msg, label, price) {
  if (!msg || !label) return false;
  const m = String(msg).trim();
  if (!m.startsWith(label)) return false;
  return m.includes(fmtNum(price)) || m.includes(String(price));
}
function alertDirWord(cond, lang) {
  const fa = lang === 'fa';
  if (cond === 'crossUp') return fa ? 'عبور به بالا از' : 'crossing up through';
  if (cond === 'crossDown') return fa ? 'عبور به پایین از' : 'crossing down through';
  if (cond === 'above') return fa ? 'بالاتر از' : 'above';
  if (cond === 'below') return fa ? 'پایین‌تر از' : 'below';
  return fa ? 'عبور از' : 'crossing';
}
function alertRepeatWord(repeat, lang) {
  return repeat === 'every' ? (lang === 'fa' ? 'هر بار' : 'Every time') : (lang === 'fa' ? 'فقط یک بار' : 'Once only');
}
/* پیام فعال‌شدن و پیام ردشدن — همان چیدمان در ربات PC (v1.8.9) تا هر دو
   مسیر یک پیام بدهند؛ فقط قیمتِ الان / قیمتِ ردشدن + تکرار + انقضا اضافه‌اند. */
function alertAddedText(a, nowPrice, lang) {
  const fa = lang === 'fa';
  const lines = [
    fa ? '✅ <b>هشدار فعال شد</b>' : '✅ <b>Alert armed</b>',
    '💰 <b>' + escHtml(a.label) + '</b>',
    '🎯 ' + alertDirWord(a.cond, lang) + ' <b>' + fmtNum(a.price) + '</b>'
  ];
  if (typeof nowPrice === 'number' && isFinite(nowPrice)) lines.push((fa ? '📍 قیمت الان: ' : '📍 Price now: ') + '<b>' + fmtNum(nowPrice) + '</b>');
  lines.push('🔁 ' + alertRepeatWord(a.repeat, lang));
  if (a.expiresAt) lines.push('⏳ ' + (fa ? 'تا ' : 'until ') + fmtDate(a.expiresAt, lang));
  if (a.msg && !isAutoMsg(a.msg, a.label, a.price)) lines.push('💬 ' + escHtml(a.msg));
  return rtlLines(lines);
}
function alertFiredText(a, firedPrice, lang) {
  const fa = lang === 'fa';
  const lines = [
    fa ? '🔔 <b>هشدار به صدا درآمد</b>' : '🔔 <b>Alert triggered</b>',
    '💰 <b>' + escHtml(a.label) + '</b>',
    '🎯 ' + (fa ? 'هدف: ' : 'Target: ') + alertDirWord(a.cond, lang) + ' <b>' + fmtNum(a.price) + '</b>',
    '📈 ' + (fa ? 'قیمت ردشدن: ' : 'Price at trigger: ') + '<b>' + fmtNum(firedPrice) + '</b>',
    '🕐 ' + fmtTimeUTC(Date.now()) + ' UTC'
  ];
  lines.push('🔁 ' + (a.repeat === 'every'
    ? (fa ? 'هر بار — دوباره مسلح شد' : 'Every time — re-armed')
    : (fa ? 'فقط یک بار — حذف شد' : 'Once only — removed')));
  if (a.msg && !isAutoMsg(a.msg, a.label, a.price)) lines.push('💬 ' + escHtml(a.msg));
  return rtlLines(lines);
}
async function hmacBytes(keyBytes, msgStr) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msgStr));
  return new Uint8Array(sig);
}
function toHex(buf) { return [...buf].map(b => b.toString(16).padStart(2, '0')).join(''); }
/* اعتبارسنجی initData تلگرام (مستندات Bot API): secret = HMAC(WebAppData, token)،
   hash = HMAC(secret, sorted key=value ها بدون hash). auth_date حداکثر ۱ روزه. */
async function validateInitData(initData, token) {
  if (!initData || !token || typeof crypto === 'undefined' || !crypto.subtle) return { ok: false, error: 'bad_initdata' };
  let params;
  try { params = new URLSearchParams(initData); } catch (e) { return { ok: false, error: 'bad_initdata' }; }
  const hash = params.get('hash');
  if (!hash) return { ok: false, error: 'bad_initdata' };
  const authDate = parseInt(params.get('auth_date') || '0', 10);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return { ok: false, error: 'stale_initdata' };
  const pairs = [];
  params.forEach((v, k) => { if (k !== 'hash') pairs.push(k + '=' + v); });
  pairs.sort();
  let user = null;
  try { user = JSON.parse(params.get('user') || 'null'); } catch (e) { user = null; }
  if (!user || typeof user.id !== 'number') return { ok: false, error: 'bad_initdata' };
  const secret = await hmacBytes(new TextEncoder().encode('WebAppData'), token);
  const expected = toHex(await hmacBytes(secret, pairs.join('\n')));
  if (expected !== String(hash).toLowerCase()) return { ok: false, error: 'bad_initdata' };
  return { ok: true, user };
}
async function tgSend(token, chatId, text) {
  try {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(10000)
    });
    return r.ok;
  } catch (e) { return false; }
}
async function binancePrice(sym) {
  try {
    const r = await fetch('https://data-api.binance.vision/api/v3/ticker/price?symbol=' + encodeURIComponent(sym), { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    const p = +j.price;
    return (isFinite(p) && p > 0) ? p : null;
  } catch (e) { return null; }
}
/* v1.11.1 — OKX: قیمت لحظه‌ای کریپتو از IP ورکر. Binance vision از IP
   اشتراکی Cloudflare با 403 جواب می‌دهد (تست زنده ۲۰۲۶-۱۱-۰۹) و CoinGecko
   هم از همان IP سهمیه‌اش را تمام کرده (429)؛ OKX با last=0.8683 برای
   DOT-USDT آمد. همهٔ ۱۶ کریپتوی اپ جفت -USDT در OKX دارند. */
async function okxPrice(sym) {
  const inst = String(sym || '').replace(/USDT$/, '') + '-USDT';
  if (!/^[A-Z0-9]+-USDT$/.test(inst)) return null;
  try {
    const r = await fetch('https://www.okx.com/api/v5/market/ticker?instId=' + inst, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    const last = j && j.data && j.data[0] && +j.data[0].last;
    return (isFinite(last) && last > 0) ? last : null;
  } catch (e) { return null; }
}
async function alertPrice(a) {
  if (a.provider === 'binance') {
    const p = await binancePrice(a.sym); if (p) return p;
    const o = await okxPrice(a.sym); if (o) return o; // v1.11.1: Binance از IP ورکر 403 است
  }
  try { const q = await getQuote(a.sym); if (q && q.price) return q.price; } catch (e) { /* به OKX/Binance می‌افتد */ }
  if (a.provider !== 'yahoo') {
    const p = await binancePrice(a.sym); if (p) return p;
    const o = await okxPrice(a.sym); if (o) return o;
  }
  return null;
}
const ALERT_CONDS = ['cross', 'crossUp', 'crossDown', 'above', 'below'];
function sideOf(price, target) { return price > target ? 1 : price < target ? -1 : 0; }
function evalAlert(a, price) {
  const now = Date.now();
  if (a.expiresAt && now > a.expiresAt) return { fire: false, expired: true };
  let fire = false;
  if (a.cond === 'cross' || a.cond === 'crossUp' || a.cond === 'crossDown') {
    const side = sideOf(price, a.price);
    if (!a.lastSide) { if (side !== 0) a.lastSide = side; }
    else if (side !== 0 && side !== a.lastSide) {
      if (a.cond === 'cross') fire = true;
      else if (a.cond === 'crossUp' && a.lastSide < 0 && side > 0) fire = true;
      else if (a.cond === 'crossDown' && a.lastSide > 0 && side < 0) fire = true;
      a.lastSide = side;
    }
  } else if (a.cond === 'above') {
    const ok = price >= a.price;
    if (ok && a.armed) fire = true;
    a.armed = !ok;
  } else if (a.cond === 'below') {
    const ok = price <= a.price;
    if (ok && a.armed) fire = true;
    a.armed = !ok;
  }
  return { fire };
}
function alertKVKey(userId, id) { return 'al:' + userId + ':' + id; }
async function kvIndexGet(kv, userId) {
  try { const raw = await kv.get('idx:' + userId); const arr = JSON.parse(raw || 'null'); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
}
async function kvIndexPut(kv, userId, ids) { try { await kv.put('idx:' + userId, JSON.stringify(ids)); } catch (e) { /* ذخیرهٔ آلرت مهم‌تر از فهرست است */ } }
async function handleAlertAdd(req) {
  const kv = alertKV();
  const token = alertEnv('TELEGRAM_BOT_TOKEN');
  if (!kv) return json({ ok: false, error: 'no_kv' }, 503);
  if (!token) return json({ ok: false, error: 'no_token' }, 503);
  let body = null;
  try { body = await req.json(); } catch (e) { return json({ ok: false, error: 'bad' }, 400); }
  const v = await validateInitData(body && body.initData, token);
  if (!v.ok) return json({ ok: false, error: v.error || 'bad_initdata' }, 401);
  const userId = String(v.user.id);
  const lang = (v.user.language_code === 'fa') ? 'fa' : 'en';
  const a = (body && body.alert) || {};
  const sym = typeof a.sym === 'string' ? a.sym.trim() : '';
  const price = +a.price;
  if (!sym || !ALERT_CONDS.includes(a.cond) || !isFinite(price) || price <= 0) return json({ ok: false, error: 'bad' }, 400);
  const provider = a.provider === 'yahoo' ? 'yahoo' : 'binance';
  const rec = {
    id: (typeof a.miniAppId === 'string' && a.miniAppId) ? a.miniAppId : ('w' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36)),
    userId, chatId: v.user.id, lang, sym, label: (typeof a.label === 'string' && a.label) ? a.label : sym,
    provider, cond: a.cond, price,
    repeat: a.repeat === 'every' ? 'every' : 'once',
    expiresAt: (typeof a.expiresAt === 'number' && a.expiresAt > Date.now()) ? a.expiresAt : null,
    msg: (typeof a.msg === 'string') ? a.msg.trim().slice(0, 120) : '',
    active: true, armed: true, lastSide: 0, createdAt: Date.now(), updatedAt: Date.now(), source: 'worker'
  };
  const nowPrice = await alertPrice(rec);
  if (!nowPrice) return json({ ok: false, error: 'unsupported' });
  const ids = await kvIndexGet(kv, userId);
  if (ids.includes(rec.id)) return json({ ok: true, id: rec.id, duplicate: true, price: nowPrice });
  if (ids.length >= 50) return json({ ok: false, error: 'limit' }, 400);
  await kv.put(alertKVKey(userId, rec.id), JSON.stringify(rec));
  ids.push(rec.id);
  await kvIndexPut(kv, userId, ids);
  await tgSend(token, v.user.id, alertAddedText(rec, nowPrice, lang));
  return json({ ok: true, id: rec.id, price: nowPrice });
}
async function handleAlertDel(req) {
  const kv = alertKV();
  const token = alertEnv('TELEGRAM_BOT_TOKEN');
  if (!kv || !token) return json({ ok: false, error: 'no_kv' }, 503);
  let body = null;
  try { body = await req.json(); } catch (e) { return json({ ok: false, error: 'bad' }, 400); }
  const v = await validateInitData(body && body.initData, token);
  if (!v.ok) return json({ ok: false, error: v.error || 'bad_initdata' }, 401);
  const userId = String(v.user.id);
  const id = typeof body.miniAppId === 'string' ? body.miniAppId : '';
  if (!id) return json({ ok: false, error: 'bad' }, 400);
  await kv.delete(alertKVKey(userId, id));
  const ids = await kvIndexGet(kv, userId);
  await kvIndexPut(kv, userId, ids.filter(x => x !== id));
  return json({ ok: true });
}
async function handleAlertList(req) {
  const kv = alertKV();
  const token = alertEnv('TELEGRAM_BOT_TOKEN');
  if (!kv || !token) return json({ ok: false, error: 'no_kv' }, 503);
  const url = new URL(req.url);
  const v = await validateInitData(url.searchParams.get('initData') || '', token);
  if (!v.ok) return json({ ok: false, error: v.error || 'bad_initdata' }, 401);
  const userId = String(v.user.id);
  const ids = await kvIndexGet(kv, userId);
  const out = [];
  for (const id of ids) {
    try { const raw = await kv.get(alertKVKey(userId, id)); if (raw) { const a = JSON.parse(raw); if (a && a.id) out.push(a); } } catch (e) { /* رد می‌شود */ }
  }
  return json({ ok: true, alerts: out });
}
/* v1.11.2 — فهرست برای ربات PC: «هشدارهای من» در ربات فقط فایل محلی خودش
   را می‌دید، ولی آلرت‌های ورکر در KV هستند — برای همین از ۷–۸ آلرت فقط
   یدونه (قدیمیِ sendData) نشان داده می‌شد. ربات با همین روت فهرست KV را
   می‌گیرد و با فهرست محلی ادغام می‌کند. احراز: HMAC-SHA256 با توکن ربات
   روی "userId:ts" (توکن هرگز فرستاده نمی‌شود) + ts حداکثر ۵ دقیقه‌ای. */
async function handleAlertListBot(req) {
  const kv = alertKV();
  const token = alertEnv('TELEGRAM_BOT_TOKEN');
  if (!kv || !token) return json({ ok: false, error: 'no_kv' }, 503);
  let body = null;
  try { body = await req.json(); } catch (e) { return json({ ok: false, error: 'bad' }, 400); }
  const userId = String((body && body.userId) || '');
  const ts = +((body && body.ts) || 0);
  const sig = String((body && body.sig) || '');
  if (!userId || !ts || Math.abs(Date.now() - ts) > 300000) return json({ ok: false, error: 'bad' }, 400);
  const expected = toHex(await hmacBytes(new TextEncoder().encode(token), userId + ':' + ts));
  if (!sig || expected !== sig.toLowerCase()) return json({ ok: false, error: 'bad_auth' }, 401);
  const ids = await kvIndexGet(kv, userId);
  const out = [];
  for (const id of ids) {
    try { const raw = await kv.get(alertKVKey(userId, id)); if (raw) { const a = JSON.parse(raw); if (a && a.id) out.push(a); } } catch (e) { /* رد می‌شود */ }
  }
  return json({ ok: true, alerts: out });
}
/* Cron هر دقیقه: همهٔ آلرت‌ها را می‌خواند، قیمت هر نماد را یک بار می‌گیرد،
   ردشده‌ها را می‌فرستد. once → حذف؛ every → دوباره مسلح؛ منقضی → حذف. */
async function runAlertCron() {
  const kv = alertKV();
  const token = alertEnv('TELEGRAM_BOT_TOKEN');
  if (!kv || !token) return { ok: false, error: 'no_kv_or_token' };
  let cursor = null, keys = [];
  try {
    do {
      const page = await kv.list({ prefix: 'al:', cursor });
      for (const k of (page.keys || [])) keys.push(k.name);
      cursor = page.list_complete ? null : page.cursor;
    } while (cursor);
  } catch (e) { return { ok: false, error: 'list_failed' }; }
  keys = keys.slice(0, 1000);
  const alerts = [];
  for (const name of keys) {
    try { const raw = await kv.get(name); if (raw) { const a = JSON.parse(raw); if (a && a.id && a.userId) alerts.push(a); } } catch (e) { /* رد می‌شود */ }
  }
  if (!alerts.length) return { ok: true, checked: 0, fired: 0 };
  const bySym = new Map();
  for (const a of alerts) {
    const k = a.provider + '|' + a.sym;
    if (!bySym.has(k)) bySym.set(k, []);
    bySym.get(k).push(a);
  }
  let fired = 0;
  for (const [key, list] of bySym) {
    const price = await alertPrice(list[0]);
    if (!price) continue;
    for (const a of list) {
      const r = evalAlert(a, price);
      if (r.expired) { await kv.delete(alertKVKey(a.userId, a.id)); continue; }
      if (!r.fire) {
        a.updatedAt = Date.now();
        await kv.put(alertKVKey(a.userId, a.id), JSON.stringify(a));
        continue;
      }
      const lang = a.lang === 'fa' ? 'fa' : 'en';
      const sent = await tgSend(token, a.chatId, alertFiredText(a, price, lang));
      if (!sent) continue;
      fired++;
      if (a.repeat === 'every') {
        a.updatedAt = Date.now();
        await kv.put(alertKVKey(a.userId, a.id), JSON.stringify(a));
      } else {
        await kv.delete(alertKVKey(a.userId, a.id));
        const ids = await kvIndexGet(kv, a.userId);
        await kvIndexPut(kv, a.userId, ids.filter(x => x !== a.id));
      }
    }
  }
  return { ok: true, checked: alerts.length, fired };
}

/* ---- روت اصلی ---- */
async function handle(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const url = new URL(req.url);
  const kind = url.pathname.replace(/^\/+/, '').split('/')[0];
  const target = url.searchParams.get('u') || '';

  /* v1.11.0 — سرویس آلرت: اولِ همه، چون POST است و بدنهٔ JSON دارد. */
  if (kind === 'alert-list-bot') {
    if (req.method !== 'POST') return json({ ok: false, error: 'bad' }, 405);
    return handleAlertListBot(req);
  }
  if (kind === 'alert-add' || kind === 'alert-del' || kind === 'alert-list') {
    if (kind === 'alert-add') {
      if (req.method !== 'POST') return json({ ok: false, error: 'bad' }, 405);
      return handleAlertAdd(req);
    }
    if (kind === 'alert-del') {
      if (req.method !== 'POST') return json({ ok: false, error: 'bad' }, 405);
      return handleAlertDel(req);
    }
    if (req.method !== 'GET') return json({ ok: false, error: 'bad' }, 405);
    return handleAlertList(req);
  }

  if (kind === 'mofid') {
    const k = url.searchParams.get('kind') || '';
    if (k === 'resolve') {
      const sym = url.searchParams.get('symbol') || '';
      if (!sym) return json({ ok: false }, 400);
      const res = json(await mofidResolve(sym));
      res.headers.set('Cache-Control', 'public, max-age=60');
      return res;
    }
    if (k === 'history') {
      return mofidHistory(
        url.searchParams.get('isin') || '',
        url.searchParams.get('resolution') || '',
        url.searchParams.get('from') || '',
        url.searchParams.get('to') || '',
        url.searchParams.get('adj') || '0'
      );
    }
    if (k === 'bulk') {
      const syms = (url.searchParams.get('symbols') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 40);
      if (!syms.length) return json({ quotes: [] }, 400);
      const res = json({ quotes: await mofidBulk(syms) });
      res.headers.set('Cache-Control', 'public, max-age=60');
      return res;
    }
    return json({ error: 'bad kind' }, 400);
  }

  if (kind === 'yahoo-multi') {
    const syms = (url.searchParams.get('symbols') || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!syms.length) return json({ quotes: [] }, 400);
    const q = await getQuotes(syms);
    const res = json({ quotes: q });
    res.headers.set('Cache-Control', 'public, max-age=30');
    return res;
  }
  if (kind === 'yahoo-search') {
    const q = (url.searchParams.get('q') || '').trim();
    if (!q || q.length > 40) return json({ quotes: [] }, 400);
    try {
      if (!creds) await refreshCreds();
      const base = 'https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(q) + '&quotesCount=10&newsCount=0';
      const withCreds = () => {
        const headers = { 'User-Agent': UA, Accept: 'application/json' };
        if (creds && creds.cookie) headers.Cookie = creds.cookie;
        const u = base + (creds && creds.crumb ? '&crumb=' + encodeURIComponent(creds.crumb) : '');
        return getJson(u, headers);
      };
      let r = await withCreds();
      if (!r.ok && r.status === 401) { await refreshCreds(); r = await withCreds(); }
      const arr = r.body && r.body.quotes;
      const out = (Array.isArray(arr) ? arr : [])
        .filter(x => x && typeof x.symbol === 'string' && /^[A-Za-z0-9.^=-]+$/.test(x.symbol))
        .slice(0, 10)
        .map(x => ({ symbol: x.symbol, name: x.shortname || x.longname || null, exchange: x.exchange || null, type: x.quoteType || null }));
      const res = json({ quotes: out });
      res.headers.set('Cache-Control', 'public, max-age=60');
      return res;
    } catch (e) { return json({ quotes: [] }); }
  }
  if (kind === 'yahoo-quote') {
    if (!/^[A-Za-z0-9.^=-]+$/.test(target)) return json({ quote: null }, 400);
    const q = await getQuote(target);
    const res = json({ quote: q });
    res.headers.set('Cache-Control', 'public, max-age=30');
    return res;
  }
  if (kind === 'yahoo-chart' || kind === 'rss' || kind === 'nerkhsanj' || kind === 'binance' || kind === 'coingecko' || kind === 'iran' || kind === 'okx') {
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
  return json({ error: 'unknown route', routes: ['yahoo-chart', 'yahoo-quote', 'yahoo-multi', 'rss', 'nerkhsanj', 'binance', 'coingecko', 'iran', 'okx', 'mofid', 'alert-add', 'alert-del', 'alert-list', 'alert-list-bot'] }, 404);
}

addEventListener('fetch', function (event) {
  event.respondWith(handle(event.request));
});
/* v1.11.0 — Cron شلیک آلرت (هر ۱ دقیقه، از داشبورد: Triggers → Cron `* * * * *`). */
addEventListener('scheduled', function (event) {
  event.waitUntil(runAlertCron());
});

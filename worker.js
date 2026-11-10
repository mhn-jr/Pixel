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
   درخواست خوانده می‌شد).
   v1.13.0 — پست کانال وقتی PC خاموش است (جانشین، نه جایگزین): اصل مالک —
   اول پروژهٔ اصلی + PC؛ اگر PC خاموش بود ورکر پست‌های کانال را می‌فرستد.
   هماهنگی با دو نگهبان: (۱) ضربان — ربات PC هر ۵ دقیقه POST /pc-heartbeat
   می‌زند (HMAC با توکن) و ورکر فقط وقتی ضربان بیش از ۱۰ دقیقه قدیمی است
   پست می‌کند؛ (۲) علامت اسلات — PC بعد از هر پست موفق، کلید اسلات را با
   POST /channel-posted در KV علامت می‌زند و ورکر آن اسلات را هرگز دوباره
   نمی‌فرستد. اسلات‌ها از ضربان می‌آیند (پیش‌فرض خلاصه ۰۹:۰۰ و ۲۱:۰۰، قیمت
   ۰۹/۱۹/۰۰ تهران)؛ ورکر ۵ دقیقه بعد از اسلات وارد می‌شود (مهلت به PC) و
   فقط تازه‌ترین اسلاتِ رسیده را می‌فرستد. متن تنها — عکس ثابت کانال روی
   PC است و ورکر فایل آپلود نمی‌کند. پست زمان‌بندی‌شدهٔ تک‌بار و خلاصهٔ DM
   هنوز فقط با PC می‌آیند.
   v1.14.0 — پست اخبار کانال هم وقتی PC خاموش است: همان اسلات ۱۸:۴۵، ۱۰ خبر
   با سهم‌بندی نوبتی بین بازارها (در کانال فارسی بورس و فرابورس هم هست)،
   هر خبر با تاثیر و نمادش؛ + روت GET /status برای اینکه مدیر ببیند ضربان
   و آخرین پست‌های کانال در چه حال‌اند. */

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
/* v1.14.3 — عکسِ پست کانال از گیت‌هاب: تلگرام sendPhoto با URL هم قبول
   می‌کند؛ پس ورکر لازم نیست فایل آپلود کند — عکس‌ها در همان ریپوی گیت‌هاب
   (mhn-jr.github.io/Pixel) هستند و ورکر فقط آدرسشان را می‌فرستد. همان
   منطقِ PC: متن ≤۱۰۲۴ کاراکتر → عکس با کپشن؛ طولانی‌تر (خبر) → عکس
   (بدون کپشن) + متن جدا. اگر عکس ناموفق بود، متن تنها می‌رود. */
const CH_PHOTO_BASE = 'https://mhn-jr.github.io/Pixel/';
const CH_PHOTOS = {
  digest: { en: 'channel-digest-en.jpg', fa: 'channel-digest-fa.jpg' },
  prices: { en: 'channel-prices-en.jpg', fa: 'channel-prices-fa.jpg' },
  news: { en: 'channel-news-en.jpg', fa: 'channel-news-fa.jpg' }
};
async function tgSendPhoto(token, chatId, photoUrl, caption) {
  try {
    const body = { chat_id: chatId, photo: photoUrl };
    if (caption) { body.caption = caption; body.parse_mode = 'HTML'; }
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendPhoto', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
    return r.ok;
  } catch (e) { return false; }
}
async function postChannelWithPhoto(token, c, kind, text) {
  const file = CH_PHOTOS[kind] && CH_PHOTOS[kind][c.lang];
  if (file) {
    const url = CH_PHOTO_BASE + file;
    if (text.length <= 1024) {
      if (await tgSendPhoto(token, c.chatId, url, text)) return true;
    } else if (await tgSendPhoto(token, c.chatId, url, null)) {
      return await tgSend(token, c.chatId, text);
    }
  }
  return await tgSend(token, c.chatId, text);
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

/* ---- v1.13.0 — پست کانال وقتی PC خاموش است (جانشین، نه جایگزین) ----
   متن‌ها دقیقاً همان ساختار پست‌های PC را دارند (channel.js + digest.js +
   digest-snapshot.js) ولی با مسیرهای قیمتیِ خودِ ورکر: OKX برای کریپتو،
   Yahoo برای سهام/فارکس/کالا/شاخص، Nerkhsanj برای نرخ‌های ایران،
   alternative.me برای ترس و طمع، Forex Factory برای رویداد. هر پایه که
   نیاید، خطش حذف می‌شود — عدد ساختگی هرگز. هر اسلات یک تلاشِ محدود دارد؛
   اسلاتِ کاملاً ناموفق علامت نمی‌خورد و تیکِ بعدِ Cron دوباره امتحانش
   می‌کند (همان قانون PC). */
const CH_TZ = 'Asia/Tehran';
const CH_GRACE_MS = 5 * 60 * 1000; // مهلت به PC بعد از اسلات
const CH_HEARTBEAT_FRESH_MS = 10 * 60 * 1000; // ضربان تازه‌تر از این = PC زنده است
const CH_DIGEST_TIMES = ['09:00', '21:00'];
const CH_PRICE_HOURS = [9, 19, 0];

function tehranParts(ms) {
  try {
    const dtf = new Intl.DateTimeFormat('en-CA', { timeZone: CH_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    const p = {};
    for (const x of dtf.formatToParts(new Date(ms))) p[x.type] = x.value;
    return { day: p.year + '-' + p.month + '-' + p.day, hm: p.hour + ':' + p.minute, hour: +p.hour };
  } catch (e) {
    const d = new Date(ms + (3 * 60 + 30) * 60000);
    return { day: d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'), hm: String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'), hour: d.getUTCHours() };
  }
}
function tehranOffsetMinutes(ms) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: CH_TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(ms)).map(p => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return Math.round((asUtc - ms) / 60000);
}
function tehranWallToMs(day, hhmm) {
  const [y, m, d] = day.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  const naive = Date.UTC(y, m - 1, d, h, mi);
  return naive - tehranOffsetMinutes(naive) * 60000;
}
function chTimeTehran(ms) {
  try { return new Intl.DateTimeFormat('en-GB', { timeZone: CH_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms)); } catch (e) { return ''; }
}
function chDateTehran(ms, lang) {
  if (lang === 'fa') {
    try { return new Intl.DateTimeFormat('fa-IR', { timeZone: CH_TZ, calendar: 'persian', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ms)); } catch (e) { /* پایین */ }
  }
  try { return new Intl.DateTimeFormat('en-GB', { timeZone: CH_TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms)); } catch (e) { return ''; }
}
function chFmtPrice(n) {
  if (Math.abs(n) < 10) return Number(n).toLocaleString('en-US', { maximumFractionDigits: 5 });
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function chEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function chRenderLines(lang, lines) {
  const kept = (lines || []).filter(x => x !== null && x !== undefined && x !== '');
  if (lang === 'fa') return kept.map(x => '\u200F' + x).join('\n');
  return kept.join('\n');
}
function chFmtChg(v) { return (v >= 0 ? '+' : '') + (Math.round(v * 100) / 100) + '%'; }

/* OKX با تغییر ۲۴ ساعته (last + open24h) — okxPrice فقط last می‌دهد. */
async function okxTicker(sym) {
  const inst = String(sym || '').replace(/USDT$/, '') + '-USDT';
  if (!/^[A-Z0-9]+-USDT$/.test(inst)) return null;
  try {
    const r = await fetch('https://www.okx.com/api/v5/market/ticker?instId=' + inst, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    const d0 = j && j.data && j.data[0];
    const last = d0 && +d0.last;
    if (!isFinite(last) || last <= 0) return null;
    const open24 = d0 && +d0.open24h;
    return { price: last, changePct: (isFinite(open24) && open24 > 0) ? ((last - open24) / open24) * 100 : null };
  } catch (e) { return null; }
}
async function nerkhsanjLive() {
  try {
    const r = await fetch('https://nerkh.jahankhahan.shop/data/live.json', { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || !j.rates) return null;
    return j;
  } catch (e) { return null; }
}
async function fearGreed() {
  try {
    const r = await fetch('https://api.alternative.me/fng/?limit=1', { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = await r.json();
    const d = j && j.data && j.data[0];
    if (!d || !isFinite(+d.value)) return null;
    return { value: +d.value, label: String(d.value_classification || '') };
  } catch (e) { return null; }
}
/* رویداد اقتصادی — همان پارس econ.js: فید تازه date را ISO با افست می‌دهد
   ("2026-11-08T17:30:00-05:00") و time ندارد؛ قالب قدیمیِ "MM-DD-YYYY" +
   "8:30am" فقط به‌عنوان جانشین مانده. */
function ffEventTime(dateStr, timeStr) {
  if (dateStr && String(dateStr).includes('T')) {
    const ms = Date.parse(String(dateStr));
    return Number.isFinite(ms) ? ms : null;
  }
  if (!dateStr || !timeStr || /all day/i.test(timeStr)) return null;
  const dm = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(dateStr).trim());
  const tm = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(String(timeStr).trim());
  if (!dm || !tm) return null;
  let h = +tm[1] % 12;
  if (/pm/i.test(tm[3])) h += 12;
  const naiveUtc = Date.UTC(+dm[3], +dm[1] - 1, +dm[2], h, +tm[2]);
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(naiveUtc)).map(p => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  const off = Math.round((asUtc - naiveUtc) / 60000);
  return naiveUtc - off * 60000;
}
async function ffNextHighImpact(nowMs) {
  try {
    const r = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return { ok: false, event: null };
    const j = await r.json().catch(() => []);
    if (!Array.isArray(j)) return { ok: false, event: null };
    let best = null;
    for (const e of j) {
      if (String((e && e.impact) || '') !== 'High') continue;
      const t = ffEventTime(e.date, e.time);
      if (t === null || t < nowMs) continue;
      if (!best || t < best.timeMs) best = { title: String(e.title || ''), timeMs: t };
    }
    return { ok: true, event: best };
  } catch (e) { return { ok: false, event: null }; }
}

/* فهرست قیمت کانال — همان ۱۹ نماد + ترتیب + ایموجیِ channel.js.
   گروه‌بندی (v1.14.1، مثل PC): سرگروه جدا + هر نماد یک خط؛ LRM جلوی «$»
   در فارسی تا «$» پشت عدد نپرد. */
const CH_PRICE_SYMBOLS = [
  { kind: 'nerkh', key: 'tether', group: 'iran', emoji: '💵', name: { en: 'Tether', fa: 'تتر' } },
  { kind: 'nerkh', key: 'gold', group: 'iran', emoji: '🥇', name: { en: 'Gold 18k', fa: 'طلا ۱۸ عیار' } },
  { kind: 'okx', sym: 'BTCUSDT', group: 'crypto', emoji: '🟧', name: { en: 'Bitcoin', fa: 'بیت‌کوین' } },
  { kind: 'okx', sym: 'PAXGUSDT', group: 'mixed', emoji: '🟨', name: { en: 'XAUUSD', fa: 'XAUUSD' } },
  { kind: 'yahoo', sym: '^DJI', group: 'mixed', emoji: '🟦', name: { en: 'US30', fa: 'US30' } },
  { kind: 'yahoo', sym: 'EURUSD=X', group: 'forex', emoji: '💱', name: { en: 'EURUSD', fa: 'EURUSD' } },
  { kind: 'yahoo', sym: '^NDX', group: 'mixed', emoji: '🟪', name: { en: 'NDX', fa: 'NDX' } },
  { kind: 'yahoo', sym: 'CL=F', group: 'mixed', emoji: '🛢️', name: { en: 'USOIL', fa: 'USOIL' } },
  { kind: 'okx', sym: 'ETHUSDT', group: 'crypto', emoji: '🔷', name: { en: 'Ethereum', fa: 'اتریوم' } },
  { kind: 'nerkh', key: 'half', group: 'iran', emoji: '🟠', name: { en: 'Half Coin', fa: 'نیم سکه' } },
  { kind: 'nerkh', key: 'quarter', group: 'iran', emoji: '🟡', name: { en: 'Quarter Coin', fa: 'ربع سکه' } },
  { kind: 'nerkh', key: 'coin', group: 'iran', emoji: '🟢', name: { en: 'Full Coin (New)', fa: 'سکه تمام جدید' } },
  { kind: 'nerkh', key: 'bahar', group: 'iran', emoji: '⚪', name: { en: 'Full Coin (Old)', fa: 'سکه تمام قدیم' } },
  { kind: 'yahoo', sym: 'AAPL', group: 'stocks', emoji: '📱', name: { en: 'Apple', fa: 'اپل' } },
  { kind: 'yahoo', sym: 'MSFT', group: 'stocks', emoji: '💻', name: { en: 'Microsoft', fa: 'مایکروسافت' } },
  { kind: 'yahoo', sym: 'NVDA', group: 'stocks', emoji: '🎮', name: { en: 'NVIDIA', fa: 'انویدیا' } },
  { kind: 'nerkh', key: 'silver', group: 'mixed', emoji: '🥈', name: { en: 'Silver', fa: 'نقره' } },
  { kind: 'yahoo', sym: 'BZ=F', group: 'mixed', emoji: '⛽', name: { en: 'Brent', fa: 'نفت برنت' } },
  { kind: 'yahoo', sym: 'HG=F', group: 'mixed', emoji: '🟤', name: { en: 'Copper', fa: 'مس' } }
];
const CH_PRICE_GROUPS = [
  { key: 'iran', emoji: '🇮🇷', label: { en: 'Iran', fa: 'ایران' } },
  { key: 'crypto', emoji: '🪙', label: { en: 'Crypto', fa: 'کریپتو' } },
  { key: 'stocks', emoji: '📈', label: { en: 'Stocks', fa: 'سهام' } },
  { key: 'forex', emoji: '💱', label: { en: 'Forex', fa: 'فارکس' } },
  { key: 'mixed', emoji: '🥇', label: { en: 'Gold, Commodities & Indices', fa: 'طلا، کالا و شاخص' } }
];
function buildChannelPrices(lang, data, nowMs) {
  const fa = lang === 'fa';
  const head = fa ? '📊 قیمت بازارها — ' + chTimeTehran(nowMs) : '📊 Market prices — ' + chTimeTehran(nowMs);
  const byGroup = {};
  for (const g of CH_PRICE_GROUPS) byGroup[g.key] = [];
  for (const s of CH_PRICE_SYMBOLS) {
    let price = null, chg = null, toman = false;
    if (s.kind === 'nerkh') {
      const v = data.nerkh && data.nerkh.rates && data.nerkh.rates[s.key];
      if (typeof v === 'number' && v > 0) { price = v; toman = true; }
    } else if (s.kind === 'okx') {
      const q = data.okx && data.okx.get(s.sym);
      if (q) { price = q.price; chg = q.changePct; }
    } else {
      const q = data.yahoo && data.yahoo.get(s.sym);
      if (q) { price = q.price; chg = q.changePct; }
    }
    if (price === null) continue;
    const chgStr = (typeof chg === 'number') ? ' (' + chFmtChg(chg) + ')' : '';
    const name = s.name[fa ? 'fa' : 'en'];
    if (toman) byGroup[s.group].push(s.emoji + ' ' + name + ': ' + chFmtPrice(price) + (fa ? ' تومان' : ' Toman'));
    else byGroup[s.group].push(s.emoji + ' ' + name + ': ' + (fa ? '\u200E' : '') + '$' + chFmtPrice(price) + chgStr);
  }
  const lines = [head];
  for (const g of CH_PRICE_GROUPS) {
    if (!byGroup[g.key].length) continue;
    lines.push(g.emoji + ' ' + g.label[fa ? 'fa' : 'en']);
    lines.push(...byGroup[g.key]);
  }
  if (lines.length < 2) return null;
  const foot = '📅 ' + chDateTehran(nowMs, lang) + ' — ' + chTimeTehran(nowMs);
  return chRenderLines(lang, lines.concat([foot]));
}

/* خلاصهٔ ۱۵ نمادی — همان گروه‌ها و جانشین‌های digest-snapshot.js؛ جانشین
   فقط هم‌ارز می‌گیرد (کریپتو←کریپتو با OKX، بقیه با Yahoo) تا واحدِ سلول
   ($ یا تومان) قاطی نشود. */
const CH_QUERY = {
  BTC: { src: 'okx', key: 'BTCUSDT', name: 'BTC' }, ETH: { src: 'okx', key: 'ETHUSDT', name: 'ETH' },
  SOL: { src: 'okx', key: 'SOLUSDT', name: 'SOL' }, BNB: { src: 'okx', key: 'BNBUSDT', name: 'BNB' },
  XRP: { src: 'okx', key: 'XRPUSDT', name: 'XRP' }, DOGE: { src: 'okx', key: 'DOGEUSDT', name: 'DOGE' },
  TRX: { src: 'okx', key: 'TRXUSDT', name: 'TRX' }, ADA: { src: 'okx', key: 'ADAUSDT', name: 'ADA' },
  AAPL: { src: 'yahoo', key: 'AAPL', name: 'AAPL' }, MSFT: { src: 'yahoo', key: 'MSFT', name: 'MSFT' },
  NVDA: { src: 'yahoo', key: 'NVDA', name: 'NVDA' }, TSLA: { src: 'yahoo', key: 'TSLA', name: 'TSLA' },
  GOOGL: { src: 'yahoo', key: 'GOOGL', name: 'Google' }, AMZN: { src: 'yahoo', key: 'AMZN', name: 'Amazon' },
  META: { src: 'yahoo', key: 'META', name: 'Meta' },
  EURUSD: { src: 'yahoo', key: 'EURUSD=X', name: 'EURUSD' }, GBPUSD: { src: 'yahoo', key: 'GBPUSD=X', name: 'GBPUSD' },
  USDJPY: { src: 'yahoo', key: 'USDJPY=X', name: 'USDJPY' }, AUDUSD: { src: 'yahoo', key: 'AUDUSD=X', name: 'AUDUSD' },
  USDCHF: { src: 'yahoo', key: 'USDCHF=X', name: 'USDCHF' }, EURGBP: { src: 'yahoo', key: 'EURGBP=X', name: 'EURGBP' },
  NZDUSD: { src: 'yahoo', key: 'NZDUSD=X', name: 'NZDUSD' },
  XAUUSD: { src: 'okx', key: 'PAXGUSDT', name: 'XAUUSD' },
  USOIL: { src: 'yahoo', key: 'CL=F', name: 'USOIL' }, 'BZ=F': { src: 'yahoo', key: 'BZ=F', name: 'Brent' },
  US30: { src: 'yahoo', key: '^DJI', name: 'US30' }, '^GSPC': { src: 'yahoo', key: '^GSPC', name: 'S&P 500' },
  '^NDX': { src: 'yahoo', key: '^NDX', name: 'NDX' }
};
const CH_DIGEST_GROUPS = [
  { key: 'crypto', emoji: '🪙', label: { en: 'Crypto', fa: 'کریپتو' }, cells: [
    { q: 'BTC', subs: ['ETH', 'SOL', 'XRP', 'DOGE'] },
    { q: 'ETH', subs: ['BTC', 'SOL', 'TRX', 'XRP'] },
    { q: 'SOL', subs: ['XRP', 'ADA', 'TRX'] },
    { q: 'BNB', subs: ['XRP', 'ADA', 'SOL'] } ] },
  { key: 'stocks', emoji: '📈', label: { en: 'Stocks', fa: 'سهام' }, cells: [
    { q: 'AAPL', subs: ['MSFT', 'GOOGL', 'AMZN'] },
    { q: 'MSFT', subs: ['GOOGL', 'AMZN', 'META'] },
    { q: 'NVDA', subs: ['META', 'AMZN', 'GOOGL'] },
    { q: 'TSLA', subs: ['META', 'GOOGL', 'AMZN'] } ] },
  { key: 'forex', emoji: '💱', label: { en: 'Forex', fa: 'فارکس' }, cells: [
    { q: 'EURUSD', subs: ['GBPUSD', 'USDCHF', 'EURGBP'] },
    { q: 'GBPUSD', subs: ['USDCHF', 'EURGBP', 'NZDUSD'] },
    { q: 'USDJPY', subs: ['USDCHF', 'EURGBP', 'NZDUSD'] },
    { q: 'AUDUSD', subs: ['NZDUSD', 'USDCHF', 'EURGBP'] } ] },
  { key: 'mixed', emoji: '🥇', label: { en: 'Gold, Oil & Dow', fa: 'طلا، نفت و داو' }, cells: [
    { q: 'XAUUSD', subs: [] },
    { q: 'USOIL', subs: ['BZ=F'] },
    { q: 'US30', subs: ['^GSPC', '^NDX'] } ] }
];
function chTryCell(cands, data, used) {
  for (const q of cands) {
    const r = CH_QUERY[q];
    if (!r) continue;
    const key = r.src + ':' + r.key;
    if (used.has(key)) continue;
    const quote = r.src === 'okx' ? (data.okx && data.okx.get(r.key)) : (data.yahoo && data.yahoo.get(r.key));
    if (!quote || typeof quote.price !== 'number' || !(quote.price > 0)) continue;
    used.add(key);
    const chg = (typeof quote.changePct === 'number') ? ' (' + chFmtChg(quote.changePct) + ')' : '';
    return { text: r.name + ' $' + chFmtPrice(quote.price) + chg, changePct: quote.changePct, name: r.name };
  }
  return null;
}
function chFormatMoodLine(moods, lang) {
  if (!moods || !moods.length) return null;
  const fa = lang === 'fa';
  return ['📊 ' + (fa ? 'حال بازار:' : 'Market mood:')].concat(
    moods.map(m => m.label + ' ' + m.green + '/' + m.total + (fa ? ' سبز' : ' green')));
}
function buildChannelDigest(lang, data, nowMs) {
  const fa = lang === 'fa';
  const header = fa ? '📊 خلاصهٔ امروز — ' + chDateTehran(nowMs, lang) : "📊 Today's digest — " + chDateTehran(nowMs, lang);
  const lines = [header];
  const moods = [];
  const all = [];
  const used = new Set();
  for (const g of CH_DIGEST_GROUPS) {
    const cells = [];
    for (const cell of g.cells) {
      const found = chTryCell([cell.q].concat(cell.subs), data, used);
      if (found) { cells.push(found); if (typeof found.changePct === 'number') all.push(found); }
    }
    if (!cells.length) continue;
    // چیدمان تازه (دستور مالک ۲۰۲۶-۱۱-۱۰): هر نماد یک خط جدا — مثل خلاصهٔ PC.
    lines.push(g.emoji + ' ' + g.label[fa ? 'fa' : 'en']);
    for (const c of cells) lines.push(c.text);
    const withChg = cells.filter(c => typeof c.changePct === 'number');
    if (withChg.length) moods.push({ label: g.label[fa ? 'fa' : 'en'], green: withChg.filter(c => c.changePct > 0).length, total: withChg.length });
  }
  if (lines.length < 2) return null; // هیچ گروهی نیامد — پست خالی نمی‌فرستیم
  if (all.length >= 2) {
    const best = all.reduce((a, b) => (b.changePct > a.changePct ? b : a));
    const worst = all.reduce((a, b) => (b.changePct < a.changePct ? b : a));
    if (best !== worst) {
      lines.push('🏆 ' + (fa ? 'بیشترین رشد: ' : 'Top gainer: ') + best.name + ' ' + chFmtChg(best.changePct)
        + (fa ? ' • بیشترین افت: ' : ' • Top loser: ') + worst.name + ' ' + chFmtChg(worst.changePct));
    }
  }
  if (data.fg) {
    lines.push('😨 ' + (fa
      ? 'ترس و طمع کریپتو: ' + data.fg.value + ' (' + data.fg.label + ')'
      : 'Crypto Fear & Greed: ' + data.fg.value + ' (' + data.fg.label + ')'));
  }
  const moodLines = chFormatMoodLine(moods, lang);
  if (moodLines) lines.push(...moodLines);
  if (data.event) {
    const t = chTimeTehran(data.event.timeMs);
    lines.push(fa
      ? 'مهم‌ترین رویداد امروز: ' + chEsc(data.event.title) + ' — ساعت ' + t + ' به وقت تو'
      : 'Top event today: ' + chEsc(data.event.title) + ' — ' + t + ' your time');
  } else if (data.eventOk) {
    lines.push(fa ? 'امروز رویداد با تأثیر زیاد نیست.' : 'No high-impact events today.');
  }
  return chRenderLines(lang, lines);
}

/* یک پاسِ موازی و محدود برای هر دو پست — بدون تلاشِ ۵ دقیقه‌ایِ PC؛
   اگر اسلاتی ناموفق ماند، تیکِ بعدِ Cron دوباره امتحانش می‌کند. */
async function fetchChannelData(nowMs) {
  const okxSyms = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'TRXUSDT', 'PAXGUSDT'];
  const yahooSyms = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCHF=X', 'EURGBP=X', 'NZDUSD=X', 'CL=F', 'BZ=F', 'HG=F', '^DJI', '^NDX', '^GSPC'];
  const [nerkh, okxList, yahooList, fg, ev] = await Promise.all([
    nerkhsanjLive().catch(() => null),
    Promise.all(okxSyms.map(async (s) => { const q = await okxTicker(s).catch(() => null); return q ? [s, q] : null; })),
    getQuotes(yahooSyms).catch(() => []),
    fearGreed().catch(() => null),
    ffNextHighImpact(nowMs).catch(() => ({ ok: false, event: null }))
  ]);
  const okx = new Map(); for (const x of okxList) if (x) okx.set(x[0], x[1]);
  const yahoo = new Map(); for (const q of (yahooList || [])) if (q && q.symbol) yahoo.set(q.symbol, q);
  return { nerkh, okx, yahoo, fg, event: ev && ev.event, eventOk: !!(ev && ev.ok) };
}

/* ---- v1.14.0 — اخبار کانال (همان منطق news.js ربات، برای ورکر) ----
   ۱۰ خبر مهم، سهم‌بندی نوبتی بین بازارها؛ در کانال فارسی بورس و فرابورس
   هم هست. هر خبر: تاثیر (تخمینی، از کلیدواژهٔ تیتر) + نمادِ مربوط. اگر
   خوراکی از IP ورکر نیامد، آن بازار کمتر می‌گیرد و بقیه جایش را پر می‌کنند. */
const CH_NEWS_TIMES = ['18:45'];
const CH_NEWS_ORDER = {
  en: ['crypto', 'stocks', 'etf', 'commodity', 'forex'],
  fa: ['crypto', 'iran', 'stocks', 'commodity', 'etf', 'forex']
};
const CH_NEWS_META = {
  crypto: { emoji: '🪙', label: { en: 'Crypto', fa: 'کریپتو' } },
  iran: { emoji: '🇮🇷', label: { en: 'Iran Stocks', fa: 'بورس و فرابورس' } },
  stocks: { emoji: '📈', label: { en: 'Stocks', fa: 'سهام' } },
  etf: { emoji: '🧺', label: { en: 'ETFs', fa: 'صندوق‌ها (ETF)' } },
  commodity: { emoji: '🥇', label: { en: 'Commodities', fa: 'کالا' } },
  forex: { emoji: '💱', label: { en: 'Forex', fa: 'فارکس' } }
};
const CH_NEWS_SOURCES = {
  'CoinDesk': { en: 'CoinDesk', fa: 'کوین‌دسک' },
  'Cointelegraph': { en: 'Cointelegraph', fa: 'کوین‌تلگراف' },
  'CNBC': { en: 'CNBC', fa: 'سی‌ان‌بی‌سی' },
  'BBC': { en: 'BBC', fa: 'بی‌بی‌سی' },
  'Google News': { en: 'Google News', fa: 'گوگل نیوز' },
  'EIA': { en: 'EIA', fa: 'EIA' },
  'Nabze Bourse': { en: 'Nabze Bourse', fa: 'نبض بورس' },
  'IBENA': { en: 'IBENA', fa: 'ایبنا' },
  'Fardaye Eghtesad': { en: 'Fardaye Eghtesad', fa: 'فردای اقتصاد' }
};
function chGnewsUrl(q, lang) {
  const fa = lang === 'fa';
  return 'https://news.google.com/rss/search?q=' + encodeURIComponent(q) + '&hl=' + (fa ? 'fa' : 'en-US') + '&gl=' + (fa ? 'IR' : 'US') + '&ceid=' + (fa ? 'IR:fa' : 'US:en');
}
const CH_NEWS_FEEDS = {
  en: [
    { market: 'crypto', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
    { market: 'crypto', url: 'https://cointelegraph.com/rss', source: 'Cointelegraph' },
    { market: 'stocks', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC' },
    { market: 'stocks', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC' },
    { market: 'etf', url: chGnewsUrl('ETF', 'en'), source: 'Google News' },
    { market: 'commodity', url: 'https://www.eia.gov/rss/todayinenergy.xml', source: 'EIA' },
    { market: 'commodity', url: chGnewsUrl('oil gold prices', 'en'), source: 'Google News' },
    { market: 'forex', url: chGnewsUrl('forex market', 'en'), source: 'Google News' }
  ],
  fa: [
    { market: 'crypto', url: chGnewsUrl('ارز دیجیتال بیت کوین', 'fa'), source: 'Google News' },
    { market: 'stocks', url: chGnewsUrl('بورس آمریکا', 'fa'), source: 'Google News' },
    { market: 'etf', url: chGnewsUrl('ETF صندوق', 'fa'), source: 'Google News' },
    { market: 'commodity', url: chGnewsUrl('قیمت نفت و طلا', 'fa'), source: 'Google News' },
    { market: 'forex', url: chGnewsUrl('بازار ارز', 'fa'), source: 'Google News' },
    { market: null, url: 'https://nabzebourse.com/fa/rss/allnews', source: 'Nabze Bourse' },
    { market: null, url: 'https://www.ibena.ir/rss', source: 'IBENA' },
    { market: null, url: 'https://www.fardayeeghtesad.com/rss', source: 'Fardaye Eghtesad' }
  ]
};
const CH_MARKET_KEYWORDS = [
  { market: 'iran', keys: ['فرابورس', 'بورس تهران', 'شاخص کل', 'بازار سرمایه', 'عرضه اولیه', 'بورس'] },
  { market: 'etf', keys: ['etf', 'exchange-traded', 'صندوق', 'ای‌تی‌اف'] },
  { market: 'crypto', keys: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'solana', 'xrp', 'dogecoin', 'doge', 'cardano', 'blockchain', 'بیت‌کوین', 'بیتکوین', 'اتریوم', 'ارز دیجیتال', 'کریپتو', 'رمزارز', 'سولانا', 'بلاکچین'] },
  { market: 'commodity', keys: ['gold', 'silver', 'oil', 'brent', 'copper', 'platinum', 'palladium', 'opec', 'طلا', 'سکه', 'نفت', 'نقره', 'مس', 'پلاتین', 'برنت', 'اوپک', 'انس'] },
  { market: 'forex', keys: ['forex', 'dollar', 'euro', 'eur/usd', 'gbp', 'yen', 'currency', 'exchange rate', 'دلار', 'یورو', 'ارز', 'تتر', 'نرخ ارز', 'ین'] },
  { market: 'stocks', keys: ['stock', 'shares', 'earnings', 'nasdaq', 's&p', 'dow', 'apple', 'microsoft', 'nvidia', 'tesla', 'ipo', 'بورس', 'سهام', 'شاخص', 'نماد', 'درآمد', 'اپل', 'مایکروسافت', 'انویدیا', 'تسلا'] }
];
function chClassifyNewsMarket(title, fallback) {
  const t = ' ' + String(title || '').toLowerCase() + ' ';
  for (const e of CH_MARKET_KEYWORDS) {
    for (const k of e.keys) if (t.includes(k.toLowerCase())) return e.market;
  }
  return fallback || 'stocks';
}
function chStripCdata(s) { return String(s || '').replace(/^<!\[CDATA\[|\]\]>$/g, '').trim(); }
function chStripSource(title) { return String(title || '').replace(/\s+-\s+[^-]+$/, '').trim(); }
function chParseRss(xml) {
  const items = [];
  if (!xml || typeof xml !== 'string') return items;
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const b of blocks) {
    const t = b.match(/<title>([\s\S]*?)<\/title>/);
    const l = b.match(/<link>([\s\S]*?)<\/link>/);
    const d = b.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const title = chStripSource(chStripCdata(t && t[1]));
    if (!title) continue;
    const when = d ? new Date(chStripCdata(d[1])) : null;
    items.push({ title, link: chStripCdata(l && l[1]), time: (when && !Number.isNaN(when.getTime())) ? when.getTime() : null });
  }
  return items;
}
const CH_SYMBOL_TAGS = [
  { tag: 'BTC', keys: ['bitcoin', 'btc', 'بیت‌کوین', 'بیتکوین', 'بیت کوین'] },
  { tag: 'ETH', keys: ['ethereum', 'eth', 'اتریوم', 'اتر'] },
  { tag: 'SOL', keys: ['solana', 'sol', 'سولانا'] },
  { tag: 'XRP', keys: ['xrp', 'ripple', 'ریپل'] },
  { tag: 'DOGE', keys: ['dogecoin', 'doge', 'دوج‌کوین', 'دوجکوین'] },
  { tag: 'AAPL', keys: ['apple', 'aapl', 'اپل'] },
  { tag: 'MSFT', keys: ['microsoft', 'msft', 'مایکروسافت'] },
  { tag: 'NVDA', keys: ['nvidia', 'nvda', 'انویدیا'] },
  { tag: 'TSLA', keys: ['tesla', 'tsla', 'تسلا'] },
  { tag: 'USOIL', keys: ['طلای سیاه', 'oil', 'نفت', 'brent', 'برنت'] },
  { tag: 'XAUUSD', keys: ['gold', 'طلا', 'انس'] },
  { tag: 'EURUSD', keys: ['euro', 'eur/usd', 'یورو'] },
  { tag: 'US30', keys: ['dow jones', 'dow', 'داو'] }
];
function chDetectSymbolTag(title) {
  const t = ' ' + String(title || '').toLowerCase() + ' ';
  for (const e of CH_SYMBOL_TAGS) {
    for (const k of e.keys) if (t.includes(k.toLowerCase())) return e.tag;
  }
  return null;
}
const CH_IMPACT_HIGH = ['fed', 'federal reserve', 'interest rate', 'rate cut', 'rate hike', 'cpi', 'inflation', 'sec', 'etf', 'bankruptcy', 'bankrupt', 'hack', 'hacked', 'war', 'sanction', 'ban', 'earnings', 'halving', 'lawsuit', 'crash', 'collapse', 'recession', 'نرخ بهره', 'فدرال رزرو', 'تورم', 'ورشکستگی', 'هک', 'جنگ', 'تحریم', 'ممنوع', 'درآمد', 'هاوینگ', 'شکایت', 'سقوط', 'رکود'];
const CH_IMPACT_MED = ['partnership', 'listing', 'upgrade', 'analyst', 'forecast', 'launch', 'adoption', 'merger', 'acquisition', 'ceo', 'update', 'همکاری', 'لیست', 'ارتقا', 'تحلیلگر', 'پیش‌بینی', 'راه‌اندازی', 'ادغام', 'مدیرعامل'];
function chImpactOf(title) {
  const t = String(title || '').toLowerCase();
  for (const k of CH_IMPACT_HIGH) if (t.includes(k.toLowerCase())) return 'high';
  for (const k of CH_IMPACT_MED) if (t.includes(k.toLowerCase())) return 'medium';
  return 'low';
}
function chImpactLabel(level, lang) {
  const fa = lang === 'fa';
  if (level === 'high') return fa ? '🔴 تاثیر بالا' : '🔴 High impact';
  if (level === 'medium') return fa ? '🟡 تاثیر متوسط' : '🟡 Medium impact';
  return fa ? '⚪ تاثیر کم' : '⚪ Low impact';
}
async function fetchChannelNews(lang) {
  const fa = lang === 'fa';
  const order = CH_NEWS_ORDER[fa ? 'fa' : 'en'];
  const feeds = CH_NEWS_FEEDS[fa ? 'fa' : 'en'];
  const lists = await Promise.all(feeds.map(async (f) => {
    try {
      const r = await fetch(f.url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) return [];
      return chParseRss(await r.text()).map(it => ({ ...it, market: f.market, source: f.source }));
    } catch (e) { return []; }
  }));
  const seen = new Set();
  const byMarket = {};
  for (const m of order) byMarket[m] = [];
  const key = t => String(t || '').toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();
  for (const list of lists) {
    for (const it of list) {
      const k = key(it.title);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const m = it.market || chClassifyNewsMarket(it.title, 'stocks');
      if (!byMarket[m]) continue;
      byMarket[m].push({ title: it.title, link: it.link || '', time: it.time || null, source: it.source, market: m });
    }
  }
  for (const m of order) byMarket[m].sort((a, b) => (b.time || 0) - (a.time || 0));
  const picked = [];
  let guard = 0;
  while (picked.length < 10 && guard++ < 30) {
    let took = false;
    for (const m of order) {
      if (picked.length >= 10) break;
      const it = byMarket[m].shift();
      if (it) { picked.push(it); took = true; }
    }
    if (!took) break;
  }
  const groups = [];
  for (const m of order) {
    const items = picked.filter(p => p.market === m);
    if (items.length) groups.push({ key: m, emoji: CH_NEWS_META[m].emoji, label: CH_NEWS_META[m].label, items });
  }
  return { groups, total: picked.length };
}
function buildChannelNews(lang, res, nowMs) {
  const fa = lang === 'fa';
  if (!res || !res.total) return null;
  const header = fa
    ? '📰 اخبار بازار جهانی — ' + chDateTehran(nowMs, lang)
    : '📰 World Market News — ' + chDateTehran(nowMs, lang);
  const lines = [header];
  let n = 0;
  for (const g of res.groups) {
    lines.push(g.emoji + ' ' + g.label[fa ? 'fa' : 'en']);
    for (const it of g.items) {
      n++;
      const title = it.link
        ? '<a href="' + chEsc(it.link) + '"><b>' + chEsc(it.title) + '</b></a>'
        : '<b>' + chEsc(it.title) + '</b>';
      lines.push(n + '. ' + title);
      const sym = chDetectSymbolTag(it.title);
      const meta = [];
      const tm = chTimeTehran(it.time);
      if (tm) meta.push('🕐 ' + tm);
      const src = CH_NEWS_SOURCES[it.source];
      if (src) meta.push(src[fa ? 'fa' : 'en']);
      if (sym) meta.push('[' + sym + ']');
      meta.push(chImpactLabel(chImpactOf(it.title), lang));
      lines.push(meta.join(' • '));
    }
  }
  lines.push(fa
    ? 'تاثیر از روی کلیدواژهٔ تیتر تخمین زده شده؛ قطعی نیست.'
    : 'Impact is estimated from headline keywords, not measured.');
  return chRenderLines(lang, lines);
}

/* ضربان PC: {ts, channels:[{chatId,lang}], digestTimes, priceHours} — با
   HMAC توکن روی 'pc-heartbeat:' + ts. */
async function handlePcHeartbeat(req) {
  const kv = alertKV();
  const token = alertEnv('TELEGRAM_BOT_TOKEN');
  if (!kv || !token) return json({ ok: false, error: 'no_kv' }, 503);
  let body = null;
  try { body = await req.json(); } catch (e) { return json({ ok: false, error: 'bad' }, 400); }
  const ts = +((body && body.ts) || 0);
  const sig = String((body && body.sig) || '');
  if (!ts || Math.abs(Date.now() - ts) > 300000) return json({ ok: false, error: 'bad' }, 400);
  const expected = toHex(await hmacBytes(new TextEncoder().encode(token), 'pc-heartbeat:' + ts));
  if (!sig || expected !== sig.toLowerCase()) return json({ ok: false, error: 'bad_auth' }, 401);
  const channels = Array.isArray(body.channels)
    ? body.channels.filter(c => c && c.chatId && (c.lang === 'en' || c.lang === 'fa')).map(c => ({ chatId: String(c.chatId), lang: c.lang })).slice(0, 4)
    : [];
  if (!channels.length) return json({ ok: false, error: 'no_channels' }, 400);
  const digestTimes = Array.isArray(body.digestTimes)
    ? body.digestTimes.filter(t => /^\d{2}:\d{2}$/.test(String(t))).slice(0, 8) : CH_DIGEST_TIMES;
  const priceHours = Array.isArray(body.priceHours)
    ? body.priceHours.filter(h => Number.isInteger(h) && h >= 0 && h <= 23).slice(0, 12) : CH_PRICE_HOURS;
  const newsTimes = Array.isArray(body.newsTimes)
    ? body.newsTimes.filter(t => /^\d{2}:\d{2}$/.test(String(t))).slice(0, 8) : CH_NEWS_TIMES;
  await kv.put('pc-heartbeat', JSON.stringify({ ts, channels, digestTimes: digestTimes.length ? digestTimes : CH_DIGEST_TIMES, priceHours: priceHours.length ? priceHours : CH_PRICE_HOURS, newsTimes: newsTimes.length ? newsTimes : CH_NEWS_TIMES }));
  return json({ ok: true });
}
/* علامت اسلاتِ PC — کلیدِ channel.js ('digest:YYYY-MM-DD:HH:MM' یا
   'prices:YYYY-MM-DD:HH')؛ HMAC روی 'channel-posted:' + key + ':' + ts. */
async function handleChannelPosted(req) {
  const kv = alertKV();
  const token = alertEnv('TELEGRAM_BOT_TOKEN');
  if (!kv || !token) return json({ ok: false, error: 'no_kv' }, 503);
  let body = null;
  try { body = await req.json(); } catch (e) { return json({ ok: false, error: 'bad' }, 400); }
  const key = String((body && body.key) || '');
  const ts = +((body && body.ts) || 0);
  const sig = String((body && body.sig) || '');
  if (!/^(digest|prices|news):\d{4}-\d{2}-\d{2}:(\d{2}:\d{2}|\d{2})$/.test(key) || !ts || Math.abs(Date.now() - ts) > 300000) return json({ ok: false, error: 'bad' }, 400);
  const expected = toHex(await hmacBytes(new TextEncoder().encode(token), 'channel-posted:' + key + ':' + ts));
  if (!sig || expected !== sig.toLowerCase()) return json({ ok: false, error: 'bad_auth' }, 401);
  await kv.put('ch:' + key, '1');
  return json({ ok: true });
}

/* Cron هر دقیقه: اگر ضربان تازه است PC زنده است و ورکر ساکت می‌ماند؛ اگر
   قدیمی است، تازه‌ترین اسلاتِ رسیده (با ۵ دقیقه مهلت) را می‌فرستد. */
async function runChannelCron(nowMs) {
  const kv = alertKV();
  const token = alertEnv('TELEGRAM_BOT_TOKEN');
  if (!kv || !token) return { ok: false, error: 'no_kv_or_token' };
  let hb = null;
  try { hb = JSON.parse(await kv.get('pc-heartbeat') || 'null'); } catch (e) { return { ok: false, error: 'bad_heartbeat' }; }
  if (!hb || !Array.isArray(hb.channels) || !hb.channels.length) return { ok: false, error: 'no_heartbeat' };
  const now = nowMs || Date.now();
  if (isFinite(+hb.ts) && now - hb.ts < CH_HEARTBEAT_FRESH_MS) return { ok: true, skipped: 'pc_alive' };
  const channels = hb.channels.filter(c => c && c.chatId && (c.lang === 'en' || c.lang === 'fa')).slice(0, 4);
  if (!channels.length) return { ok: false, error: 'no_channels' };
  const digestTimes = (Array.isArray(hb.digestTimes) && hb.digestTimes.length ? hb.digestTimes : CH_DIGEST_TIMES).filter(t => /^\d{2}:\d{2}$/.test(String(t)));
  const priceHours = (Array.isArray(hb.priceHours) && hb.priceHours.length ? hb.priceHours : CH_PRICE_HOURS).filter(h => Number.isInteger(h) && h >= 0 && h <= 23);
  const newsTimes = (Array.isArray(hb.newsTimes) && hb.newsTimes.length ? hb.newsTimes : CH_NEWS_TIMES).filter(t => /^\d{2}:\d{2}$/.test(String(t)));
  const tp = tehranParts(now);
  const out = { ok: true, digest: null, prices: null, news: null };
  let dataPromise = null;
  const getData = () => (dataPromise || (dataPromise = fetchChannelData(now)));
  const dueDigest = [...digestTimes].sort().filter(t => tp.hm >= t).pop();
  if (dueDigest) {
    const key = 'ch:digest:' + tp.day + ':' + dueDigest;
    const marked = await kv.get(key).catch(() => null);
    if (!marked && now >= tehranWallToMs(tp.day, dueDigest) + CH_GRACE_MS) {
      const data = await getData();
      let sent = 0;
      for (const c of channels) {
        const text = buildChannelDigest(c.lang, data, now);
        if (!text) continue;
        if (await postChannelWithPhoto(token, c, 'digest', text)) sent++;
      }
      if (sent > 0) { await kv.put(key, '1').catch(() => {}); out.digest = sent; }
    }
  }
  const duePrice = [...priceHours].sort((a, b) => a - b).filter(h => tp.hour >= h).pop();
  if (duePrice !== undefined) {
    const hh = String(duePrice).padStart(2, '0');
    const key = 'ch:prices:' + tp.day + ':' + hh;
    const marked = await kv.get(key).catch(() => null);
    if (!marked && now >= tehranWallToMs(tp.day, hh + ':00') + CH_GRACE_MS) {
      const data = await getData();
      let sent = 0;
      for (const c of channels) {
        const text = buildChannelPrices(c.lang, data, now);
        if (!text) continue;
        if (await postChannelWithPhoto(token, c, 'prices', text)) sent++;
      }
      if (sent > 0) { await kv.put(key, '1').catch(() => {}); out.prices = sent; }
    }
  }
  const dueNews = [...newsTimes].sort().filter(t => tp.hm >= t).pop();
  if (dueNews) {
    const key = 'ch:news:' + tp.day + ':' + dueNews;
    const marked = await kv.get(key).catch(() => null);
    if (!marked && now >= tehranWallToMs(tp.day, dueNews) + CH_GRACE_MS) {
      let sent = 0;
      for (const c of channels) {
        const res = await fetchChannelNews(c.lang).catch(() => null);
        const text = res ? buildChannelNews(c.lang, res, now) : null;
        if (!text) continue;
        if (await postChannelWithPhoto(token, c, 'news', text)) sent++;
      }
      if (sent > 0) { await kv.put(key, '1').catch(() => {}); out.news = sent; }
    }
  }
  return out;
}

/* GET /status — وضعیت جانشینِ کانال برای پنل مدیر: ضربان PC چند دقیقه پیش
   بوده و آخرین پست‌های کانال (خلاصه/قیمت/اخبار) کِی علامت خورده‌اند. بدون
   احراز — فقط زمان‌ها و وضعیت‌هاست، هیچ دادهٔ حساسی ندارد. */
async function handleStatus() {
  const kv = alertKV();
  if (!kv) return json({ ok: false, error: 'no_kv' }, 503);
  let hb = null;
  try { hb = JSON.parse(await kv.get('pc-heartbeat') || 'null'); } catch (e) { /* خالی */ }
  let last = {};
  try {
    const page = await kv.list({ prefix: 'ch:', limit: 100 });
    const keys = (page.keys || []).map(k => k.name).sort().reverse();
    for (const k of keys) {
      const kind = k.split(':')[1];
      if (kind && !last[kind]) last[kind] = k.slice(3);
    }
  } catch (e) { /* خالی */ }
  return json({
    ok: true,
    heartbeatAgeMin: hb && isFinite(+hb.ts) ? Math.max(0, Math.round((Date.now() - hb.ts) / 60000)) : null,
    channels: hb && Array.isArray(hb.channels) ? hb.channels : [],
    digestTimes: hb && hb.digestTimes ? hb.digestTimes : CH_DIGEST_TIMES,
    priceHours: hb && hb.priceHours ? hb.priceHours : CH_PRICE_HOURS,
    newsTimes: hb && hb.newsTimes ? hb.newsTimes : CH_NEWS_TIMES,
    lastPosted: last
  });
}

/* v1.14.2 — ادمینِ وب (صفحهٔ دومِ گیت‌هاب، admin.html): POST /admin با
   رمزِ ADMIN_SECRET. فقط «ارسال دستی» خلاصه/قیمت/خبر به کانال‌ها — جایگزینِ
   /admin تلگرامی نیست؛ /admin تلگرامیِ PC اولویت دارد و این صفحه فقط وقتی
   PC خاموش است به کار می‌آید (دستور مالک ۲۰۲۶-۱۱-۱۰). رمز هرگز در صفحه یا
   ریپو نیست — کاربر یک بار در صفحه تایپش می‌کند و در localStorage همان گوشی
   می‌ماند؛ بدون رمز یا با رمز اشتباه → 401. کانال‌ها از ضربانِ PC در KV
   می‌آیند (همانِ Cron) — پس حتی با PC خاموش، مقصدها معلوم‌اند. ارسال دستی
   اسلاتِ زمان‌بندی را علامت نمی‌زند (مثل postNow در PC) — پستِ زمان‌بندیِ
   بعدی سر جایش می‌آید. خبرِ دستی هم مثل Cronِ ورکر متن‌تنهاست (بدون عکس). */
async function handleAdmin(req) {
  const kv = alertKV();
  const token = alertEnv('TELEGRAM_BOT_TOKEN');
  const secret = alertEnv('ADMIN_SECRET');
  if (!kv || !token || !secret) return json({ ok: false, error: 'admin_not_configured' }, 503);
  let body = {};
  try { body = await req.json(); } catch (e) { return json({ ok: false, error: 'bad_json' }, 400); }
  if (!body || typeof body.secret !== 'string' || body.secret !== secret) return json({ ok: false, error: 'unauthorized' }, 401);
  const action = body.action === 'send' ? 'send' : 'preview';
  const kind = body.kind;
  if (kind !== 'news' && kind !== 'prices' && kind !== 'digest') return json({ ok: false, error: 'bad_kind' }, 400);
  const target = body.target;
  if (target !== 'fa' && target !== 'en' && target !== 'both') return json({ ok: false, error: 'bad_target' }, 400);
  let hb = null;
  try { hb = JSON.parse(await kv.get('pc-heartbeat') || 'null'); } catch (e) { /* خالی */ }
  if (!hb || !Array.isArray(hb.channels) || !hb.channels.length) return json({ ok: false, error: 'no_heartbeat' }, 503);
  const langs = target === 'both' ? ['fa', 'en'] : [target];
  const channels = hb.channels.filter(c => c && c.chatId && langs.includes(c.lang)).slice(0, 4);
  if (!channels.length) return json({ ok: false, error: 'no_channel' }, 503);
  const now = Date.now();
  const texts = {};
  if (kind === 'news') {
    for (const c of channels) {
      const res = await fetchChannelNews(c.lang).catch(() => null);
      const text = res ? buildChannelNews(c.lang, res, now) : null;
      if (text) texts[c.lang] = text;
    }
  } else {
    const data = await fetchChannelData(now).catch(() => null);
    if (!data) return json({ ok: false, error: 'no_data' }, 502);
    for (const c of channels) {
      const text = kind === 'prices' ? buildChannelPrices(c.lang, data, now) : buildChannelDigest(c.lang, data, now);
      if (text) texts[c.lang] = text;
    }
  }
  if (!Object.keys(texts).length) return json({ ok: false, error: 'empty' }, 502);
  if (action === 'preview') return json({ ok: true, kind, target, texts });
  const posted = [];
  for (const c of channels) {
    if (!texts[c.lang]) continue;
    if (await postChannelWithPhoto(token, c, kind, texts[c.lang])) posted.push(c.lang);
  }
  if (!posted.length) return json({ ok: false, error: 'send_failed' }, 502);
  return json({ ok: true, kind, target, posted });
}

/* ---- روت اصلی ---- */
async function handle(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const url = new URL(req.url);
  const kind = url.pathname.replace(/^\/+/, '').split('/')[0];
  const target = url.searchParams.get('u') || '';

  /* v1.14.0 — وضعیت جانشینِ کانال (بدون احراز؛ فقط زمان‌ها). */
  if (kind === 'status') {
    if (req.method !== 'GET') return json({ ok: false, error: 'bad' }, 405);
    return handleStatus();
  }
  /* v1.14.2 — ادمینِ وب (صفحهٔ دومِ گیت‌هاب). */
  if (kind === 'admin') {
    if (req.method !== 'POST') return json({ ok: false, error: 'bad' }, 405);
    return handleAdmin(req);
  }
  if (kind === 'pc-heartbeat') {
    if (req.method !== 'POST') return json({ ok: false, error: 'bad' }, 405);
    return handlePcHeartbeat(req);
  }
  if (kind === 'channel-posted') {
    if (req.method !== 'POST') return json({ ok: false, error: 'bad' }, 405);
    return handleChannelPosted(req);
  }
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
  return json({ error: 'unknown route', routes: ['yahoo-chart', 'yahoo-quote', 'yahoo-multi', 'rss', 'nerkhsanj', 'binance', 'coingecko', 'iran', 'okx', 'mofid', 'alert-add', 'alert-del', 'alert-list', 'alert-list-bot', 'pc-heartbeat', 'channel-posted', 'status', 'admin'] }, 404);
}

addEventListener('fetch', function (event) {
  event.respondWith(handle(event.request));
});
/* v1.11.0 — Cron شلیک آلرت (هر ۱ دقیقه، از داشبورد: Triggers → Cron `* * * * *`).
   v1.13.0 — همان تیک، پست کانالِ جانشین را هم می‌چکد؛ نتیجهٔ برگشتی همان
   نتیجهٔ آلرت است تا تست‌ها و رفتارِ قبلی عوض نشوند. */
addEventListener('scheduled', function (event) {
  event.waitUntil((async () => {
    const [al] = await Promise.all([
      runAlertCron(),
      runChannelCron().catch(e => ({ ok: false, error: String(e && e.message) }))
    ]);
    return al;
  })());
});

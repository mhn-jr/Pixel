'use strict';
(function () {
/* Onella Telegram Bot — خبرهای مهم (v1.8.0).
   فقط RSS بدون کلید: Google News برای هر نماد و هر بازار + CoinDesk برای بازار کریپتو.
   «مهم» یعنی ۵ خبر آخرِ تازه — هیچ امتیاز اهمیتی ساخته نمی‌شود.
   نام منبع از آخر تیتر جدا می‌شود (قانون ۲۰۲۶-۱۱-۰۸: منبع در UI نشان داده نمی‌شود). */

/* Mini App: display.js ربات به‌صورت inline در app.js است (window.__miniDisplay) */
const { esc, section } = window.__miniDisplay;

const GNEWS = 'https://news.google.com/rss/search';
const COINDESK_RSS = 'https://www.coindesk.com/arc/outboundfeeds/rss/';
// v1.2.3 — خوراک جایگزین خبر (وقتی Google News از IP ورکر 503 می‌دهد):
// BBC Business برای بازارهای جهانی، BBC Persian برای نرخ/بورس ایران.
const BBC_BUSINESS = 'https://feeds.bbci.co.uk/news/business/rss.xml';
const BBC_PERSIAN = 'https://feeds.bbci.co.uk/persian/rss.xml';
/* v1.7.0 — خوراک‌های RSS مستقیم بدون کلید، پروب‌شده ۲۰۲۶-۱۱-۰۹ (همه 200 و
   پر از خبر، از یک سرور خارجی): نبض بورس (بورس تهران)، ایبنا (اقتصاد کلان/
   بانکی)، فردای اقتصاد (اقتصاد + بورس)، کوین‌تلگراف، CNBC، فدرال رزرو، EIA.
   تسنیم از IP خارجی جواب نداد (سرور اتصال را می‌بندد)، Majid API و StreamData
   منبع خبری عمومی نیستند (اولی وجود ندارد، دومی پروکسی پولی است)، SheedNews
   کلید می‌خواهد (پلن رایگان ۲۰ درخواست/روز) — هیچ‌کدام وصل نشد. */
const NABZ_RSS = 'https://nabzebourse.com/fa/rss/allnews';
const IBENA_RSS = 'https://www.ibena.ir/rss';
const FARDAY_RSS = 'https://www.fardayeeghtesad.com/rss';
const COINTELEGRAPH_RSS = 'https://cointelegraph.com/rss';
const CNBC_TOP = 'https://www.cnbc.com/id/100003114/device/rss/rss.html';
const CNBC_BIZ = 'https://www.cnbc.com/id/10001147/device/rss/rss.html';
const FED_RSS = 'https://www.federalreserve.gov/feeds/press_all.xml';
const EIA_RSS = 'https://www.eia.gov/rss/todayinenergy.xml';
/* زنجیرهٔ جایگزین هر بازار — اول Google News (جست‌وجوی مخصوص نماد؛ وقتی کار
   کند مرتبط‌ترین است)، بعد خوراک‌های مستقیم به ترتیب ربط. خبرهای خوراک‌ها
   عمومیِ بازارند و فیلتر نمادی نمی‌خورند (فیلتر، خبر را خالی می‌کرد). */
const MARKET_FEEDS = {
  crypto: [COINDESK_RSS, COINTELEGRAPH_RSS, BBC_BUSINESS],
  stock: [CNBC_TOP, CNBC_BIZ, BBC_BUSINESS],
  index: [CNBC_TOP, BBC_BUSINESS],
  commodity: [EIA_RSS, CNBC_TOP, BBC_BUSINESS],
  forex: [CNBC_TOP, FED_RSS, BBC_BUSINESS],
  'iran-stock': [NABZ_RSS, FARDAY_RSS, IBENA_RSS, BBC_PERSIAN],
  'iran-rate': [IBENA_RSS, FARDAY_RSS, NABZ_RSS, BBC_PERSIAN]
};
const FALLBACK_RSS = {
  stock: BBC_BUSINESS, index: BBC_BUSINESS, commodity: BBC_BUSINESS, forex: BBC_BUSINESS,
  'iran-rate': BBC_PERSIAN, 'iran-stock': BBC_PERSIAN
};

const COIN_NAMES = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB', XRP: 'XRP',
  DOGE: 'Dogecoin', ADA: 'Cardano', TRX: 'Tron', LINK: 'Chainlink',
  DOT: 'Polkadot', AVAX: 'Avalanche', LTC: 'Litecoin', TON: 'Toncoin'
};

// برچسب نماد هر خبر: تیتر را با کلیدواژه‌های نمادها می‌سنجیم (انگلیسی + فارسی).
// اگر هیچ نمادی نخورد، برچسب بازار می‌خورد (مثلاً [Crypto]).
const SYMBOL_TAGS = [
  { tag: 'BTC', keys: ['bitcoin', 'btc', 'بیت‌کوین', 'بیتکوین', 'بیت کوین'] },
  { tag: 'ETH', keys: ['ethereum', 'eth', 'اتریوم', 'اتر'] },
  { tag: 'SOL', keys: ['solana', 'sol', 'سولانا'] },
  { tag: 'XRP', keys: ['xrp', 'ripple', 'ریپل'] },
  { tag: 'DOGE', keys: ['dogecoin', 'doge', 'دوج‌کوین', 'دوجکوین'] },
  { tag: 'AAPL', keys: ['apple', 'aapl', 'اپل'] },
  { tag: 'MSFT', keys: ['microsoft', 'msft', 'مایکروسافت'] },
  { tag: 'NVDA', keys: ['nvidia', 'nvda', 'انویدیا'] },
  { tag: 'TSLA', keys: ['tesla', 'tsla', 'تسلا'] },
  { tag: 'XAUUSD', keys: ['gold', 'طلا', 'انس'] },
  { tag: 'USOIL', keys: ['oil', 'نفت', 'brent', 'برنت'] },
  { tag: 'EURUSD', keys: ['euro', 'eur/usd', 'یورو'] },
  { tag: 'US30', keys: ['dow jones', 'dow', 'داو'] }
];

function detectSymbolTag(title) {
  const t = ' ' + String(title || '').toLowerCase() + ' ';
  for (const e of SYMBOL_TAGS) {
    for (const k of e.keys) {
      if (t.includes(k.toLowerCase())) return e.tag;
    }
  }
  return null;
}

// میزان تاثیر خبر — تخمین از روی کلیدواژهٔ تیتر، نه اندازه‌گیری واقعی.
// high: تصمیم‌های پولی/قانونی/بحران؛ medium: رویدادهای شرکتی؛ low: بقیه.
const IMPACT_HIGH = [
  'fed', 'federal reserve', 'interest rate', 'rate cut', 'rate hike', 'cpi', 'inflation',
  'sec', 'etf', 'bankruptcy', 'bankrupt', 'hack', 'hacked', 'war', 'sanction', 'ban',
  'earnings', 'halving', 'lawsuit', 'crash', 'collapse', 'recession',
  'نرخ بهره', 'فدرال رزرو', 'تورم', 'ورشکستگی', 'هک', 'جنگ', 'تحریم', 'ممنوع',
  'درآمد', 'هاوینگ', 'شکایت', 'سقوط', 'رکود'
];
const IMPACT_MED = [
  'partnership', 'listing', 'upgrade', 'analyst', 'forecast', 'launch', 'adoption',
  'merger', 'acquisition', 'ceo', 'update',
  'همکاری', 'لیست', 'ارتقا', 'تحلیلگر', 'پیش‌بینی', 'راه‌اندازی', 'ادغام', 'مدیرعامل'
];

function impactOf(title) {
  const t = String(title || '').toLowerCase();
  for (const k of IMPACT_HIGH) if (t.includes(k.toLowerCase())) return 'high';
  for (const k of IMPACT_MED) if (t.includes(k.toLowerCase())) return 'medium';
  return 'low';
}

function impactLabel(level, lang) {
  const fa = lang === 'fa';
  if (level === 'high') return fa ? '🔴 تاثیر بالا' : '🔴 High impact';
  if (level === 'medium') return fa ? '🟡 تاثیر متوسط' : '🟡 Medium impact';
  return fa ? '⚪ تاثیر کم' : '⚪ Low impact';
}

function stripCdata(s) {
  return String(s || '').replace(/^<!\[CDATA\[|\]\]>$/g, '').trim();
}

function stripSource(title) {
  // تیتر گوگل‌نیوز «... - Reuters» تمام می‌شود — منبع را از تیتر برمی‌داریم.
  return String(title || '').replace(/\s+-\s+[^-]+$/, '').trim();
}

function parseRss(xml) {
  const items = [];
  if (!xml || typeof xml !== 'string') return items;
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const b of blocks) {
    const t = b.match(/<title>([\s\S]*?)<\/title>/);
    const l = b.match(/<link>([\s\S]*?)<\/link>/);
    const d = b.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const title = stripSource(stripCdata(t && t[1]));
    if (!title) continue;
    const when = d ? new Date(stripCdata(d[1])) : null;
    items.push({
      title,
      link: stripCdata(l && l[1]),
      time: (when && !Number.isNaN(when.getTime())) ? when.getTime() : null
    });
  }
  return items;
}

function fmtTimeUTC(ms, lang) {
  if (!ms) return '';
  /* v1.14.7 — در منطقهٔ زمانیِ انتخاب‌شده (پیش‌فرض UTC) + برچسب زون؛
     بدون OnellaDate/OnellaTZ همان قالب قبلی UTC می‌ماند. */
  try {
    if (typeof window !== 'undefined' && window.OnellaDate && window.OnellaTZ) {
      var zl = window.OnellaTZ.shortLabel(window.OnellaTZ.get());
      return window.OnellaDate.fmt(ms, 'cd') + ' ' + window.OnellaDate.fmt(ms, 'hm') + ' ' + zl;
    }
  } catch (_) {}
  const d = new Date(ms);
  const day = d.getUTCDate();
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return day + ' ' + mon + ' ' + hh + ':' + mm + ' UTC';
}

function createNews(opts) {
  opts = opts || {};
  const fetchImpl = opts.fetchImpl || fetch;
  const timeoutMs = opts.timeoutMs || 8000;

  async function fetchRss(url) {
    try {
      const r = await fetchImpl(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!r.ok) return [];
      return parseRss(await r.text());
    } catch (e) { return []; }
  }

  function symbolQuery(quote, lang) {
    if (!quote) return '';
    if (quote.provider === 'binance') {
      const base = (quote.symbol || '').replace(/USDT$/, '');
      return COIN_NAMES[base] || base;
    }
    if (quote.provider === 'iran-rate' || quote.provider === 'iran-stock') {
      return quote.display || quote.symbol || '';
    }
    if (quote.provider === 'yahoo') {
      const s = quote.symbol || '';
      if (s.slice(-2) === '=X') return (quote.display || s).replace('=X', '') + ' forex';
      if (s.slice(-2) === '=F') return quote.display || s;
      if (s[0] === '^') return quote.display || s;
      return (quote.display || s) + ' stock';
    }
    return quote.display || quote.symbol || '';
  }

  function marketQuery(market, lang) {
    const fa = lang === 'fa';
    if (market === 'crypto') return null; // CoinDesk
    if (market === 'stock') return fa ? 'بورس آمریکا' : 'US stock market';
    if (market === 'forex') return fa ? 'بازار ارز' : 'forex market';
    if (market === 'commodity') return fa ? 'قیمت نفت و طلا' : 'oil gold prices';
    if (market === 'index') return fa ? 'شاخص بورس' : 'stock market index';
    if (market === 'iran-rate') return fa ? 'قیمت دلار و طلا' : 'Iran currency gold';
    if (market === 'iran-stock') return fa ? 'بورس تهران' : 'Tehran stock exchange';
    /* v1.8.0 — داشبورد و جاهای دیگر بازار را با کلید کاتولوگ صدا می‌زنند
       ('boorse'/'farabourse')، نه 'iran-stock'؛ همان خبر بورس تهران است. */
    if (market === 'boorse' || market === 'farabourse') return fa ? 'بورس تهران' : 'Tehran stock exchange';
    return fa ? 'بازارهای مالی' : 'financial markets';
  }

  function marketKeyOf(quote) {
    if (!quote) return null;
    /* v1.8.0 — نمادهای بورس/فرابورس providerشان 'mofid' است، نه 'iran-stock'؛
       تا حالا marketKeyOf برای آن‌ها null برمی‌گرداند و خبر نماد هیچ زنجیرهٔ
       جایگزینی نداشت (فقط Google News انگلیسی — عملاً خالی). */
    if (quote.provider === 'mofid') return 'iran-stock';
    if (quote.provider === 'iran-stock') return 'iran-stock';
    if (quote.provider === 'iran-rate') return 'iran-rate';
    if (quote.provider === 'binance') return 'crypto';
    if (quote.provider === 'yahoo') {
      const s = quote.symbol || '';
      if (s.slice(-2) === '=X') return 'forex';
      if (s.slice(-2) === '=F') return 'commodity';
      if (s[0] === '^') return 'index';
      return 'stock';
    }
    return null;
  }

  async function firstNonEmpty(urls, limit) {
    for (const u of urls || []) {
      const items = await fetchRss(u);
      if (items.length) return items.slice(0, limit || 5);
    }
    return [];
  }

  async function symbolNews(quote, lang, limit) {
    const q = symbolQuery(quote, lang);
    if (!q) return [];
    /* v1.8.0 — مفید هم فارسی است (نماد بورس تهران)؛ مثل iran-rate با hl=fa و gl=IR. */
    const isFa = (quote.provider === 'iran-rate' || quote.provider === 'iran-stock' || quote.provider === 'mofid');
    const hl = isFa ? 'fa' : 'en-US';
    const gl = isFa ? 'IR' : 'US';
    const ceid = isFa ? 'IR:fa' : 'US:en';
    const url = GNEWS + '?q=' + encodeURIComponent(q) + '&hl=' + hl + '&gl=' + gl + '&ceid=' + ceid;
    var items = await fetchRss(url);
    /* v1.7.0 — Google News از IP ورکر 503 می‌دهد، پس خبر نماد دیگر فقط به آن
       وابسته نیست: اگر خالی آمد، خوراک‌های مستقیم بازار را به ترتیب می‌گیرد. */
    if (!items.length) {
      const key = marketKeyOf(quote);
      if (key && MARKET_FEEDS[key]) items = await firstNonEmpty(MARKET_FEEDS[key], limit || 5);
    }
    return items.slice(0, limit || 5);
  }

  async function marketNews(market, lang, limit) {
    if (market === 'crypto') {
      var ci = await firstNonEmpty(MARKET_FEEDS.crypto, limit || 5);
      return ci;
    }
    const q = marketQuery(market, lang);
    if (!q) return [];
    const fa = lang === 'fa';
    const url = GNEWS + '?q=' + encodeURIComponent(q) + '&hl=' + (fa ? 'fa' : 'en-US') + '&gl=' + (fa ? 'IR' : 'US') + '&ceid=' + (fa ? 'IR:fa' : 'US:en');
    var items = await fetchRss(url);
    /* v1.2.3 — Google News از IP ورکر 503 می‌دهد (بلاک «ترافیک غیرعادی»)؛
       اگر هیچ خبری نیامد، خوراک‌های مستقیم بازار را به ترتیب می‌گیرد. */
    /* v1.8.0 — کلید خوراک 'boorse'/'farabourse' همان 'iran-stock' است. */
    var feedKey = (market === 'boorse' || market === 'farabourse') ? 'iran-stock' : market;
    if (!items.length && MARKET_FEEDS[feedKey]) items = await firstNonEmpty(MARKET_FEEDS[feedKey], limit || 5);
    return items.slice(0, limit || 5);
  }

  // هر خبر: برچسب نماد + تیتر + زمان + میزان تاثیر (تخمینی).
  // tag: برچسب ثابت همهٔ خبرها (خبر نماد) یا null (خبر بازار: از تیتر تشخیص داده می‌شود).
  // خوراک «مهم و تاثیرگذار»: خبر بازارهای اصلی را موازی می‌گیرد، فقط تاثیر بالا
  // نگه می‌دارد (اگر کمتر از ۳ تا بود، با متوسط پر می‌کند تا ۸ تا)، تکراری‌ها را
  // حذف می‌کند و تازه‌ترین‌ها را اول می‌گذارد. برچسب نماد/تاثیر را formatNewsList می‌زند.
  /* v1.8.0 — 'iran-stock' اضافه شد: خبرهای مهم داشبورد تا حالا بورس تهران را
     نداشت (فقط نرخ ایران بود). */
  const IMPACT_MARKETS = ['crypto', 'stock', 'forex', 'commodity', 'index', 'iran-rate', 'iran-stock'];

  async function impactfulNews(lang, limit) {
    const all = [];
    const seen = new Set();
    const lists = await Promise.all(IMPACT_MARKETS.map(m => marketNews(m, lang, 5)));
    for (const list of lists) for (const it of list) all.push(it);
    const key = t => String(t || '').toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();
    const high = [], med = [], low = [];
    for (const it of all) {
      const k = key(it.title);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const lv = impactOf(it.title);
      if (lv === 'high') high.push(it);
      else if (lv === 'medium') med.push(it);
      else low.push(it);
    }
    const pick = high.concat(med);
    pick.sort((a, b) => (b.time || 0) - (a.time || 0));
    // v1.2.1 (Mini App): اگر خبر مهم کم بود، با خبرهای کم‌تاثیرِ همان بازارها پر می‌کنیم
    // تا داشبورد همیشه ۶ تا ۱۰ خبر داشته باشد — نه فقط یک خبر.
    const lim = limit || 8;
    if (pick.length < lim) {
      low.sort((a, b) => (b.time || 0) - (a.time || 0));
      pick.push(...low.slice(0, lim - pick.length));
    }
    return pick.slice(0, lim);
  }

  function formatNewsList(title, items, lang, tag, marketTag) {
    const fa = lang === 'fa';
    const L = [];
    if (!items || items.length === 0) {
      L.push(fa ? 'خبری پیدا نشد.' : 'No news found.');
      return section(lang, title, L);
    }
    for (const it of items) {
      const sym = tag || detectSymbolTag(it.title) || marketTag || (fa ? 'بازار' : 'Market');
      const impact = impactOf(it.title);
      L.push('• <b>[' + esc(sym) + ']</b> ' + esc(it.title)
        + (it.time ? ' (' + esc(fmtTimeUTC(it.time, lang)) + ')' : '')
        + ' — ' + esc(impactLabel(impact, lang)));
    }
    return section(lang, title, L,
      fa ? 'تاثیر از روی کلیدواژهٔ تیتر تخمین زده شده؛ قطعی نیست.' : 'Impact is estimated from headline keywords, not measured.');
  }

  return { symbolNews, marketNews, impactfulNews, formatNewsList, parseRss, symbolQuery, marketQuery, marketKeyOf, impactOf, impactLabel, detectSymbolTag };
}

window.OnellaNews = { createNews, parseRss };

})();

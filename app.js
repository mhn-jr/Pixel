'use strict';
/* Onella Nelora Lite v1.1.0 — منطق مینی‌اپ (صفحهٔ استاتیک؛ بدون سرور).
   چارت = چارت بومی خود اونلا (chart-style.js + native-chart.js — همان فایل‌های اپ،
   فقط UI اپ حذف شده). تحلیل = همان موتور محلی ربات (analysis-src.js).
   خبر = همان RSS ربات (news-src.js). آیکون = asset-icons.js (پورت js/114 اپ).
   داده:
     مستقیم (CORS دارد): Binance (کریپتو)، CoinGecko (بنیادی کریپتو)، Frankfurter (قیمت فارکس)
     با پروکسی (PROXY_URL — ورکر Cloudflare): Yahoo (سهام/فارکس/کالا/شاخص)، Google News، Nerkhsanj،
     کریپتو (Binance/CoinGecko/OKX + صرافی ایرانی) وقتی گوشی/PC مستقیم نمی‌رسد،
     مفید (بورس/فرابورس ایران — کندل + قیمت پایانی؛ TSETMC از IP خارجی بلاک است و اینجا نمی‌آید).
   بدون پروکسی، آن بازارها «در دسترس نیست» می‌گیرند — هرگز عدد ساختگی نمی‌آید.
   زنده (کریپتو): WebSocket کندل Binance (wss://data-stream.binance.vision)؛ اگر WS نرسید،
   پولینگ REST (هر ۲ ثانیه برای 1s، هر ۱۰ ثانیه برای بقیه) از همان زنجیرهٔ قیمت/کندل.
   قانون تایم‌فریم زیر ۱ دقیقه: فقط 1s و فقط برای کریپتو (Binance/OKX)؛
   اگر 1s برای نمادی نیامد، چارت قبلی می‌ماند و تایم‌فریم برمی‌گردد (هرگز جایگزینی خاموش). */
(function () {
  // آدرس ورکر پروکسی را اینجا بگذار (مثلاً https://onella-mini-proxy.<user>.workers.dev)؛
  // خالی = فقط دادهٔ مستقیم (کریپتو کامل + قیمت فارکس).
  var PROXY_URL = 'https://pixelminiapp.mahanjafari039.workers.dev';

  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  var lang = 'en';
  try {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code === 'fa') lang = 'fa';
    else if ((navigator.language || '').slice(0, 2) === 'fa') lang = 'fa';
  } catch (e) { /* en */ }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  var L = {
    en: { catalog: 'Catalog', back: '‹ Back', price: 'Price', change24: '24h change', high: 'High 24h', low: 'Low 24h', volume: 'Volume 24h',
      chart: 'Chart', analysis: 'Analysis', fundamentals: 'Fundamentals', news: 'News', impactNews: 'Important & impactful news',
      notAvailable: 'Not available right now.', needProxy: 'Needs the proxy — set PROXY_URL in app.js (see README).',
      iranStockNote: 'Iran stocks need the bot on your PC — they are blocked from foreign IPs.',
      loading: 'Loading…', noCandles: 'No candles for this symbol.', noNews: 'No news found.', noFund: 'No fundamentals for this symbol.',
      trend: 'Trend', rsi: 'RSI (14)', bollinger: 'Bollinger (20, 2σ)', support: 'Support', resistance: 'Resistance', atr: 'ATR (14)',
      change: 'Change', bandWidth: 'Band width', range20: '20-candle range', pos20: 'Position in 20-range', volumeRatio: 'Volume vs avg',
      onlyAnalysis: 'Analysis only — not a signal, not a prediction, not trading advice.',
      impactEst: 'Impact is a keyword estimate, not certain.', openInBot: 'Open in bot', chooseMarket: 'Choose a market:', chooseSymbol: 'Choose a symbol:' },
    fa: { catalog: 'کاتولوگ', back: '‹ بازگشت', price: 'قیمت', change24: 'تغییر ۲۴ ساعت', high: 'سقف ۲۴ ساعت', low: 'کف ۲۴ ساعت', volume: 'حجم ۲۴ ساعت',
      chart: 'چارت', analysis: 'تحلیل', fundamentals: 'بنیادی', news: 'خبر', impactNews: 'خبرهای مهم و تاثیرگذار',
      notAvailable: 'فعلاً در دسترس نیست.', needProxy: 'به پروکسی نیاز دارد — PROXY_URL را در app.js بگذار (README را ببین).',
      iranStockNote: 'سهام ایران به ربات روی PC نیاز دارد — از IP خارجی بلاک است.',
      loading: 'در حال بارگذاری…', noCandles: 'برای این نماد کندل نیست.', noNews: 'خبری پیدا نشد.', noFund: 'برای این نماد بنیادی نیست.',
      trend: 'روند', rsi: 'RSI (14)', bollinger: 'بولینگر (۲۰، ۲σ)', support: 'حمایت', resistance: 'مقاومت', atr: 'ATR (14)',
      change: 'تغییر', bandWidth: 'پهنای باند', range20: 'دامنهٔ نوسان ۲۰ کندل', pos20: 'جای قیمت در بازهٔ ۲۰ کندل', volumeRatio: 'حجم نسبت به میانگین',
      onlyAnalysis: 'فقط تحلیل است — نه سیگنال، نه پیش‌بینی، نه توصیهٔ معامله.',
      impactEst: 'تاثیر از روی کلیدواژهٔ تیتر تخمین زده شده؛ قطعی نیست.', openInBot: 'باز کردن در ربات', chooseMarket: 'بازار را انتخاب کن:', chooseSymbol: 'نماد را انتخاب کن:' }
  };
  var T = function (k) { return (L[lang] && L[lang][k]) || L.en[k] || k; };
  var $ = function (id) { return document.getElementById(id); };
  window.$ = $;

  /* ---- کاتولوگ — ۸ بازار، هر کدام ۱۵ نماد پیشنهادی (v1.1.0) ---- */
  var MARKETS = {
    crypto: { label: 'Crypto', fa: 'کریپتو', quotes: [
      { label: 'BTC', provider: 'binance', symbol: 'BTCUSDT', display: 'BTC/USDT', kw: 'بیت کوین بیتکوین' },
      { label: 'ETH', provider: 'binance', symbol: 'ETHUSDT', display: 'ETH/USDT', kw: 'اتریوم' },
      { label: 'SOL', provider: 'binance', symbol: 'SOLUSDT', display: 'SOL/USDT', kw: 'سولانا' },
      { label: 'BNB', provider: 'binance', symbol: 'BNBUSDT', display: 'BNB/USDT', kw: 'بایننس' },
      { label: 'XRP', provider: 'binance', symbol: 'XRPUSDT', display: 'XRP/USDT', kw: 'ریپل' },
      { label: 'DOGE', provider: 'binance', symbol: 'DOGEUSDT', display: 'DOGE/USDT', kw: 'دوج دوج کوین' },
      { label: 'ADA', provider: 'binance', symbol: 'ADAUSDT', display: 'ADA/USDT', kw: 'کاردانو' },
      { label: 'TRX', provider: 'binance', symbol: 'TRXUSDT', display: 'TRX/USDT', kw: 'ترون' },
      { label: 'AVAX', provider: 'binance', symbol: 'AVAXUSDT', display: 'AVAX/USDT', kw: 'آوالانچ' },
      { label: 'LINK', provider: 'binance', symbol: 'LINKUSDT', display: 'LINK/USDT', kw: 'چین لینک' },
      { label: 'DOT', provider: 'binance', symbol: 'DOTUSDT', display: 'DOT/USDT', kw: 'پولکادات' },
      { label: 'LTC', provider: 'binance', symbol: 'LTCUSDT', display: 'LTC/USDT', kw: 'لایت کوین' },
      { label: 'BCH', provider: 'binance', symbol: 'BCHUSDT', display: 'BCH/USDT', kw: 'بیت کوین کش' },
      { label: 'NEAR', provider: 'binance', symbol: 'NEARUSDT', display: 'NEAR/USDT', kw: 'نیر' },
      { label: 'TON', provider: 'binance', symbol: 'TONUSDT', display: 'TON/USDT', kw: 'تون کوین' } ] },
    stocks: { label: 'Stocks', fa: 'سهام', quotes: [
      { label: 'AAPL', provider: 'yahoo', symbol: 'AAPL', display: 'AAPL', kw: 'اپل' },
      { label: 'MSFT', provider: 'yahoo', symbol: 'MSFT', display: 'MSFT', kw: 'مایکروسافت' },
      { label: 'NVDA', provider: 'yahoo', symbol: 'NVDA', display: 'NVDA', kw: 'انویدیا' },
      { label: 'TSLA', provider: 'yahoo', symbol: 'TSLA', display: 'TSLA', kw: 'تسلا' },
      { label: 'AMZN', provider: 'yahoo', symbol: 'AMZN', display: 'AMZN', kw: 'آمازون' },
      { label: 'GOOGL', provider: 'yahoo', symbol: 'GOOGL', display: 'GOOGL', kw: 'گوگل' },
      { label: 'META', provider: 'yahoo', symbol: 'META', display: 'META', kw: 'متا فیسبوک' },
      { label: 'AMD', provider: 'yahoo', symbol: 'AMD', display: 'AMD', kw: 'ای ام دی' },
      { label: 'NFLX', provider: 'yahoo', symbol: 'NFLX', display: 'NFLX', kw: 'نتفلیکس' },
      { label: 'JPM', provider: 'yahoo', symbol: 'JPM', display: 'JPM', kw: 'جی پی مورگان' },
      { label: 'V', provider: 'yahoo', symbol: 'V', display: 'V', kw: 'ویزا' },
      { label: 'MA', provider: 'yahoo', symbol: 'MA', display: 'MA', kw: 'مسترکارت' },
      { label: 'XOM', provider: 'yahoo', symbol: 'XOM', display: 'XOM', kw: 'اکسون' },
      { label: 'BAC', provider: 'yahoo', symbol: 'BAC', display: 'BAC', kw: 'بنک آمریکا' },
      { label: 'UNH', provider: 'yahoo', symbol: 'UNH', display: 'UNH', kw: 'یونایتد' } ] },
    forex: { label: 'Forex', fa: 'فارکس', quotes: [
      { label: 'EUR/USD', provider: 'yahoo', symbol: 'EURUSD=X', display: 'EUR/USD' },
      { label: 'GBP/USD', provider: 'yahoo', symbol: 'GBPUSD=X', display: 'GBP/USD' },
      { label: 'USD/JPY', provider: 'yahoo', symbol: 'USDJPY=X', display: 'USD/JPY' },
      { label: 'AUD/USD', provider: 'yahoo', symbol: 'AUDUSD=X', display: 'AUD/USD' },
      { label: 'USD/CHF', provider: 'yahoo', symbol: 'USDCHF=X', display: 'USD/CHF' },
      { label: 'USD/CAD', provider: 'yahoo', symbol: 'USDCAD=X', display: 'USD/CAD' },
      { label: 'NZD/USD', provider: 'yahoo', symbol: 'NZDUSD=X', display: 'NZD/USD' },
      { label: 'EUR/GBP', provider: 'yahoo', symbol: 'EURGBP=X', display: 'EUR/GBP' },
      { label: 'EUR/JPY', provider: 'yahoo', symbol: 'EURJPY=X', display: 'EUR/JPY' },
      { label: 'GBP/JPY', provider: 'yahoo', symbol: 'GBPJPY=X', display: 'GBP/JPY' },
      { label: 'EUR/CHF', provider: 'yahoo', symbol: 'EURCHF=X', display: 'EUR/CHF' },
      { label: 'AUD/JPY', provider: 'yahoo', symbol: 'AUDJPY=X', display: 'AUD/JPY' },
      { label: 'EUR/AUD', provider: 'yahoo', symbol: 'EURAUD=X', display: 'EUR/AUD' },
      { label: 'GBP/AUD', provider: 'yahoo', symbol: 'GBPAUD=X', display: 'GBP/AUD' },
      { label: 'USD/MXN', provider: 'yahoo', symbol: 'USDMXN=X', display: 'USD/MXN' } ] },
    commodities: { label: 'Gold & Commodities', fa: 'طلا و کالا', quotes: [
      { label: 'Gold', provider: 'yahoo', symbol: 'GC=F', display: 'Gold (GC=F)', kw: 'طلا انس' },
      { label: 'Silver', provider: 'yahoo', symbol: 'SI=F', display: 'Silver (SI=F)', kw: 'نقره' },
      { label: 'Oil (WTI)', provider: 'yahoo', symbol: 'CL=F', display: 'Oil (CL=F)', kw: 'نفت' },
      { label: 'Oil (Brent)', provider: 'yahoo', symbol: 'BZ=F', display: 'Oil (BZ=F)', kw: 'نفت برنت' },
      { label: 'Nat. Gas', provider: 'yahoo', symbol: 'NG=F', display: 'Natural Gas (NG=F)', kw: 'گاز طبیعی' },
      { label: 'Copper', provider: 'yahoo', symbol: 'HG=F', display: 'Copper (HG=F)', kw: 'مس' },
      { label: 'Platinum', provider: 'yahoo', symbol: 'PL=F', display: 'Platinum (PL=F)', kw: 'پلاتین' },
      { label: 'Palladium', provider: 'yahoo', symbol: 'PA=F', display: 'Palladium (PA=F)', kw: 'پالادیوم' },
      { label: 'Corn', provider: 'yahoo', symbol: 'ZC=F', display: 'Corn (ZC=F)', kw: 'ذرت' },
      { label: 'Wheat', provider: 'yahoo', symbol: 'ZW=F', display: 'Wheat (ZW=F)', kw: 'گندم' },
      { label: 'Soybeans', provider: 'yahoo', symbol: 'ZS=F', display: 'Soybeans (ZS=F)', kw: 'سویا' },
      { label: 'Coffee', provider: 'yahoo', symbol: 'KC=F', display: 'Coffee (KC=F)', kw: 'قهوه' },
      { label: 'Sugar', provider: 'yahoo', symbol: 'SB=F', display: 'Sugar (SB=F)', kw: 'شکر' },
      { label: 'Cotton', provider: 'yahoo', symbol: 'CT=F', display: 'Cotton (CT=F)', kw: 'پنبه' },
      { label: 'Cocoa', provider: 'yahoo', symbol: 'CC=F', display: 'Cocoa (CC=F)', kw: 'کاکائو' } ] },
    iran: { label: 'Iran', fa: 'ایران', quotes: [
      { label: 'USD', provider: 'iran-rate', symbol: 'usd', display: 'دلار (تومان)', fa: 'دلار' },
      { label: 'EUR', provider: 'iran-rate', symbol: 'eur', display: 'یورو (تومان)', fa: 'یورو' },
      { label: 'Gold 18k', provider: 'iran-rate', symbol: 'gold18', display: 'طلا ۱۸ عیار (تومان)', fa: 'طلا' },
      { label: 'Emami Coin', provider: 'iran-rate', symbol: 'emami', display: 'سکه امامی (تومان)', fa: 'سکه امامی' },
      { label: 'Bahar Coin', provider: 'iran-rate', symbol: 'bahar', display: 'سکه بهار (تومان)', fa: 'سکه بهار' },
      { label: 'Half Coin', provider: 'iran-rate', symbol: 'half', display: 'نیم سکه (تومان)', fa: 'نیم سکه' },
      { label: 'Quarter Coin', provider: 'iran-rate', symbol: 'quarter', display: 'ربع سکه (تومان)', fa: 'ربع سکه' },
      { label: 'Mithqal', provider: 'iran-rate', symbol: 'mithqal', display: 'مثقال طلا (تومان)', fa: 'مثقال' },
      { label: 'Tether', provider: 'iran-rate', symbol: 'tether', display: 'تتر (تومان)', fa: 'تتر' },
      { label: 'Bitcoin', provider: 'iran-rate', symbol: 'bitcoin', display: 'بیت‌کوین (تومان)', fa: 'بیت کوین' },
      { label: 'Gold 24k', provider: 'iran-rate', symbol: 'gold24', display: 'طلای ۲۴ عیار (تومان)', fa: 'طلای ۲۴' },
      { label: 'Gram Coin', provider: 'iran-rate', symbol: 'gram', display: 'سکه گرمی (تومان)', fa: 'سکه گرمی' },
      { label: 'Silver', provider: 'iran-rate', symbol: 'silver', display: 'نقره (تومان)', fa: 'نقره' },
      { label: 'AED', provider: 'iran-rate', symbol: 'aed', display: 'درهم (تومان)', fa: 'درهم' },
      { label: 'GBP', provider: 'iran-rate', symbol: 'gbp', display: 'پوند (تومان)', fa: 'پوند' } ] },
    indices: { label: 'Indices', fa: 'شاخص‌ها', quotes: [
      { label: 'S&P 500', provider: 'yahoo', symbol: '^GSPC', display: 'S&P 500' },
      { label: 'Dow', provider: 'yahoo', symbol: '^DJI', display: 'Dow Jones' },
      { label: 'Nasdaq', provider: 'yahoo', symbol: '^IXIC', display: 'Nasdaq' },
      { label: 'DAX', provider: 'yahoo', symbol: '^GDAXI', display: 'DAX' },
      { label: 'FTSE', provider: 'yahoo', symbol: '^FTSE', display: 'FTSE' },
      { label: 'Nikkei', provider: 'yahoo', symbol: '^N225', display: 'Nikkei 225' },
      { label: 'CAC 40', provider: 'yahoo', symbol: '^FCHI', display: 'CAC 40' },
      { label: 'Euro Stoxx 50', provider: 'yahoo', symbol: '^STOXX50E', display: 'Euro Stoxx 50' },
      { label: 'Hang Seng', provider: 'yahoo', symbol: '^HSI', display: 'Hang Seng' },
      { label: 'ASX 200', provider: 'yahoo', symbol: '^AXJO', display: 'ASX 200' },
      { label: 'TSX', provider: 'yahoo', symbol: '^GSPTSE', display: 'TSX' },
      { label: 'Bovespa', provider: 'yahoo', symbol: '^BVSP', display: 'Bovespa' },
      { label: 'IPC', provider: 'yahoo', symbol: '^MXX', display: 'IPC' },
      { label: 'KOSPI', provider: 'yahoo', symbol: '^KS11', display: 'KOSPI' },
      { label: 'TWII', provider: 'yahoo', symbol: '^TWII', display: 'TWII' } ] },
    boorse: { label: 'Bourse (TSE)', fa: 'بورس', quotes: [
      { label: 'فولاد', provider: 'mofid', symbol: 'فولاد', display: 'فولاد (ریال)' },
      { label: 'فملی', provider: 'mofid', symbol: 'فملی', display: 'فملی (ریال)' },
      { label: 'شستا', provider: 'mofid', symbol: 'شستا', display: 'شستا (ریال)' },
      { label: 'خودرو', provider: 'mofid', symbol: 'خودرو', display: 'خودرو (ریال)' },
      { label: 'خساپا', provider: 'mofid', symbol: 'خساپا', display: 'خساپا (ریال)' },
      { label: 'وبملت', provider: 'mofid', symbol: 'وبملت', display: 'وبملت (ریال)' },
      { label: 'وتجارت', provider: 'mofid', symbol: 'وتجارت', display: 'وتجارت (ریال)' },
      { label: 'وبصادر', provider: 'mofid', symbol: 'وبصادر', display: 'وبصادر (ریال)' },
      { label: 'فارس', provider: 'mofid', symbol: 'فارس', display: 'فارس (ریال)' },
      { label: 'شپنا', provider: 'mofid', symbol: 'شپنا', display: 'شپنا (ریال)' },
      { label: 'شبندر', provider: 'mofid', symbol: 'شبندر', display: 'شبندر (ریال)' },
      { label: 'کگل', provider: 'mofid', symbol: 'کگل', display: 'کگل (ریال)' },
      { label: 'کچاد', provider: 'mofid', symbol: 'کچاد', display: 'کچاد (ریال)' },
      { label: 'ومعادن', provider: 'mofid', symbol: 'ومعادن', display: 'ومعادن (ریال)' },
      { label: 'حکشتی', provider: 'mofid', symbol: 'حکشتی', display: 'حکشتی (ریال)' } ] },
    farabourse: { label: 'Farabourse (OTC)', fa: 'فرابورس', quotes: [
      { label: 'آریا', provider: 'mofid', symbol: 'آریا', display: 'آریا (ریال)' },
      { label: 'زاگرس', provider: 'mofid', symbol: 'زاگرس', display: 'زاگرس (ریال)' },
      { label: 'بپاس', provider: 'mofid', symbol: 'بپاس', display: 'بپاس (ریال)' },
      { label: 'شگویا', provider: 'mofid', symbol: 'شگویا', display: 'شگویا (ریال)' },
      { label: 'هرمز', provider: 'mofid', symbol: 'هرمز', display: 'هرمز (ریال)' },
      { label: 'فجهان', provider: 'mofid', symbol: 'فجهان', display: 'فجهان (ریال)' },
      { label: 'تجلی', provider: 'mofid', symbol: 'تجلی', display: 'تجلی (ریال)' },
      { label: 'انتخاب', provider: 'mofid', symbol: 'انتخاب', display: 'انتخاب (ریال)' },
      { label: 'کگهر', provider: 'mofid', symbol: 'کگهر', display: 'کگهر (ریال)' },
      { label: 'وسپهر', provider: 'mofid', symbol: 'وسپهر', display: 'وسپهر (ریال)' },
      { label: 'فرابورس', provider: 'mofid', symbol: 'فرابورس', display: 'فرابورس (ریال)' },
      { label: 'سامان', provider: 'mofid', symbol: 'سامان', display: 'سامان (ریال)' },
      { label: 'دی', provider: 'mofid', symbol: 'دی', display: 'دی (ریال)' },
      { label: 'غدیس', provider: 'mofid', symbol: 'غدیس', display: 'غدیس (ریال)' },
      { label: 'کرمان', provider: 'mofid', symbol: 'کرمان', display: 'کرمان (ریال)' } ] }
  };
  /* تایم‌فریم‌ها — هر provider به‌اندازهٔ توانش (v1.1.0: 1s فقط کریپتو). */
  var TF_ALL = ['1s', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
  var TFS = {
    binance: TF_ALL,
    yahoo: ['5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
    mofid: ['5m', '15m', '30m', '1h', '1d', '1w'],
    'iran-rate': []
  };
  /* آیکون SVG بازارها (خطی، ۲۴×۲۴، مثل ناوبری اپ اصلی). */
  var MARKET_SVG = {
    crypto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M8.8 9.2h5.4M8.8 14.8h5.4"/></svg>',
    stocks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 20v-6M11 20V6M17 20v-9"/><path d="M3 20h18"/></svg>',
    forex: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4"/></svg>',
    commodities: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17.5l2.5-7h11l2.5 7z"/><path d="M9 10.5l1-3h4l1 3"/></svg>',
    iran: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6.5 9.5h.01M17.5 14.5h.01"/></svg>',
    indices: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 3 8-9"/><path d="M15 5h5v5"/></svg>',
    boorse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 9l9-5 9 5M4 9v11M20 9v11M8 12v5M12 12v5M16 12v5M2 20h20"/></svg>',
    farabourse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9l1-4h14l1 4M4 9v11M20 9v11M4 9h16M9 20v-6h6v6"/></svg>'
  };

  /* ---- ابزار کوچک ---- */
  window.fmt = function (p) { return p >= 1000 ? p.toLocaleString('en', { maximumFractionDigits: 2 }) : p >= 1 ? p.toFixed(3) : Number(p.toPrecision(4)).toString(); };
  function fmt(n, d) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(d === undefined ? 3 : d);
    return Number(n.toPrecision(4)).toString();
  }
  function fmtPct(n) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
    return (n >= 0 ? '+' : '') + (Math.round(n * 100) / 100) + '%';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function normQ(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').replace(/[\u200c\u200f]/g, '').replace(/\s+/g, ' ').trim();
  }
  function withTimeout(p, ms) {
    return Promise.race([Promise.resolve(p), new Promise(function (res) { setTimeout(function () { res(null); }, ms); })]).catch(function () { return null; });
  }
  async function fetchJSON(url, ms) {
    try {
      var r = await withTimeout(fetch(url, { headers: { Accept: 'application/json' } }), ms || 8000);
      if (!r || !r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }
  function proxyUrl(kind, target) {
    if (!PROXY_URL) return null;
    return PROXY_URL.replace(/\/$/, '') + '/' + kind + '?u=' + encodeURIComponent(target);
  }
  // v1.0.2: گرفتن JSON از ورکر؛ بدون PROXY_URL یعنی null (همان رفتار قبلی، بدون پروکسی).
  async function viaWorker(kind, url, ms) {
    var u = proxyUrl(kind, url);
    if (!u) return null;
    return fetchJSON(u, ms || 10000);
  }

  /* ---- داده: کریپتو (مستقیم Binance) ---- */
  var CG_IDS = { BTCUSDT: 'bitcoin', ETHUSDT: 'ethereum', SOLUSDT: 'solana', BNBUSDT: 'binancecoin', XRPUSDT: 'ripple', DOGEUSDT: 'dogecoin', ADAUSDT: 'cardano', TRXUSDT: 'tron', AVAXUSDT: 'avalanche-2', LINKUSDT: 'chainlink', DOTUSDT: 'polkadot', LTCUSDT: 'litecoin', BCHUSDT: 'bitcoin-cash', NEARUSDT: 'near', TONUSDT: 'toncoin' }; // v1.0.1: برای fallback قیمت/کندل کریپتو از ایران
  function parseCgTicker(g, id) {
    var c = g && g[id];
    if (!c || !(c.usd > 0)) return null;
    return { price: c.usd, changePct: (typeof c.usd_24h_change === 'number' ? c.usd_24h_change : null),
      high: (typeof c.usd_24h_high === 'number' ? c.usd_24h_high : null),
      low: (typeof c.usd_24h_low === 'number' ? c.usd_24h_low : null),
      volume: (typeof c.usd_24h_vol === 'number' ? c.usd_24h_vol : null), currency: 'USD' };
  }
  function parseBinanceTicker(j) {
    if (!j || !(+j.lastPrice > 0)) return null;
    return { price: +j.lastPrice, changePct: +j.priceChangePercent, high: +j.highPrice, low: +j.lowPrice, volume: +j.volume, currency: 'USDT' };
  }
  async function binanceTicker(sym) {
    var bUrl = 'https://data-api.binance.vision/api/v3/ticker/24hr?symbol=' + encodeURIComponent(sym);
    var r = parseBinanceTicker(await fetchJSON(bUrl, 8000));
    if (r) return r;
    // v1.0.1: Binance از IP ایران بلاک است — fallback به CoinGecko (قیمت + تغییر ۲۴س + حجم ۲۴س).
    var id = CG_IDS[sym];
    var cgUrl = id ? 'https://api.coingecko.com/api/v3/simple/price?ids=' + id + '&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_24hr_high=true&include_24hr_low=true' : null;
    if (cgUrl) {
      var cg = parseCgTicker(await fetchJSON(cgUrl, 8000), id);
      if (cg) return cg;
    }
    // v1.0.2: مستقیم نشد — از ورکر (Cloudflare)؛ ورکر از IP خودش به Binance/CoinGecko می‌رسد.
    r = parseBinanceTicker(await viaWorker('binance', bUrl, 10000));
    if (r) return r;
    if (cgUrl) {
      var cgw = parseCgTicker(await viaWorker('coingecko', cgUrl, 10000), id);
      if (cgw) return cgw;
    }
    // v1.0.2: قیمت جهانی نیامد — null. قیمت ایرانی «خودکار» جایگزین نمی‌شود؛
    // انتخاب دومِ کاربر است (loadSymbol جداگانه می‌گیرد و با دکمهٔ «دلار | تومان» نشان می‌دهد).
    return null;
  }
  // v1.0.2: قیمت کریپتو از صرافی ایرانی — Exir بعد Wallex بعد Nobitex.
  // واحد: Exir و Wallex «تومان» مستقیم‌اند (پروب ۲۰۲۶-۱۱-۰۹: BTC اکسیر ۲۰٬۳۲۰٬۷۰۰٬۰۰۰، والکس ۲۰٬۱۶۴٬۰۲۷٬۱۸۴)؛
  // فقط Nobitex ریالی است (÷۱۰ = تومان). اگر ورکر نوبیتکس را نگیرد (بلاک IP خارجی)، زنجیره همان‌جا تمام می‌شود.
  var IRAN_BASE = { BTCUSDT: 'btc', ETHUSDT: 'eth', SOLUSDT: 'sol', BNBUSDT: 'bnb', XRPUSDT: 'xrp', DOGEUSDT: 'doge', ADAUSDT: 'ada', TRXUSDT: 'trx', AVAXUSDT: 'avax', LINKUSDT: 'link', DOTUSDT: 'dot', LTCUSDT: 'ltc', BCHUSDT: 'bch', NEARUSDT: 'near', TONUSDT: 'ton' };
  var WALLEX_SYM = { BTCUSDT: 'BTCTMN', ETHUSDT: 'ETHTMN', SOLUSDT: 'SOLTMN', BNBUSDT: 'BNBTMN', XRPUSDT: 'XRPTMN', DOGEUSDT: 'DOGETMN', ADAUSDT: 'ADATMN', TRXUSDT: 'TRXTMN', AVAXUSDT: 'AVAXTMN', LINKUSDT: 'LINKTMN', DOTUSDT: 'DOTTMN', LTCUSDT: 'LTCTMN', BCHUSDT: 'BCHTMN', NEARUSDT: 'NEARTMN', TONUSDT: 'TONTMN' };
  async function iranCryptoPrice(sym) {
    var base = IRAN_BASE[sym];
    if (!base) return null;
    var ej = await viaWorker('iran', 'https://api.exir.io/v2/tickers', 10000);
    var t = ej && ej[base + '-irt'];
    if (t && +t.last > 0) {
      var ch = (typeof t.open === 'number' && t.open > 0) ? ((+t.last - t.open) / t.open) * 100 : null;
      return { price: +t.last, changePct: ch,
        high: (typeof t.high === 'number' ? t.high : null),
        low: (typeof t.low === 'number' ? t.low : null),
        volume: null, currency: 'Toman', iran: true };
    }
    var wj = await viaWorker('iran', 'https://api.wallex.ir/v1/markets', 10000);
    var ws = wj && wj.result && wj.result.symbols && wj.result.symbols[WALLEX_SYM[sym]];
    var wst = ws && ws.stats;
    if (wst && +wst.lastPrice > 0) {
      return { price: +wst.lastPrice, changePct: (typeof wst['24h_ch'] === 'number' ? wst['24h_ch'] : null),
        high: null, low: null, volume: null, currency: 'Toman', iran: true };
    }
    var nj = await viaWorker('iran', 'https://api.nobitex.ir/market/stats?srcCurrency=' + base + '&dstCurrency=irt', 10000);
    var ns = nj && nj.stats && nj.stats[base + '-irt'];
    if (ns && +ns.latest > 0) {
      return { price: +ns.latest / 10, changePct: (typeof ns.dayChange === 'number' ? ns.dayChange : null),
        high: (typeof ns.dayHigh === 'number' ? +ns.dayHigh / 10 : null),
        low: (typeof ns.dayLow === 'number' ? +ns.dayLow / 10 : null),
        volume: null, currency: 'Toman', iran: true };
    }
    return null;
  }
  function parseBinanceKlines(j) {
    if (!Array.isArray(j)) return null;
    var out = [];
    for (var i = 0; i < j.length; i++) {
      var k = j[i];
      if (!Array.isArray(k) || k.length < 11) continue;
      out.push({ t: +k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] });
    }
    return out.length >= 2 ? out : null;
  }
  function parseCgOhlc(o) {
    if (!Array.isArray(o)) return null;
    var out = [];
    for (var i = 0; i < o.length; i++) {
      var r = o[i];
      if (!Array.isArray(r) || r.length < 5) continue;
      out.push({ t: +r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: 0 });
    }
    return out.length >= 2 ? out : null;
  }
  // v1.1.0: کندل OKX (fallback کریپتو؛ ۱ ثانیه‌ای هم دارد). پاسخ نزولی می‌آید — برعکس می‌کنیم.
  function parseOkxCandles(j) {
    if (!j || j.code !== '0' || !Array.isArray(j.data)) return null;
    var out = [];
    for (var i = j.data.length - 1; i >= 0; i--) {
      var r = j.data[i];
      if (!Array.isArray(r) || r.length < 6) continue;
      out.push({ t: +r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[5] || 0 });
    }
    return out.length >= 2 ? out : null;
  }
  var OKX_BAR = { '1s': '1s', '5m': '5m', '15m': '15m', '30m': '30m', '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W', '1M': '1M' };
  async function okxCandles(sym, interval, limit) {
    var bar = OKX_BAR[interval];
    if (!bar) return null;
    var inst = sym.replace(/USDT$/, '') + '-USDT';
    var oUrl = 'https://www.okx.com/api/v5/market/candles?instId=' + inst + '&bar=' + bar + '&limit=' + (limit || 200);
    var out = parseOkxCandles(await fetchJSON(oUrl, 10000));
    if (out) return out;
    return parseOkxCandles(await viaWorker('okx', oUrl, 12000));
  }
  async function binanceKlines(sym, interval, limit) {
    var bUrl = 'https://data-api.binance.vision/api/v3/klines?symbol=' + encodeURIComponent(sym) + '&interval=' + interval + '&limit=' + (limit || 200);
    var out = parseBinanceKlines(await fetchJSON(bUrl, 10000));
    if (out) return out;
    // v1.1.0: CoinGecko OHLC فقط ۴ ساعته است — فقط برای 4h و 1d معنا دارد؛ برای بقیه
    // تایم‌فریم‌ها سراغش نمی‌رویم (کندل اشتباه نشان ندهیم).
    var id = CG_IDS[sym];
    var cgUrl = null;
    if (id && (interval === '4h' || interval === '1d')) {
      var days = interval === '1d' ? 30 : 7;
      cgUrl = 'https://api.coingecko.com/api/v3/coins/' + id + '/ohlc?vs_currency=usd&days=' + days;
      var o = parseCgOhlc(await fetchJSON(cgUrl, 10000));
      if (o) return o;
    }
    // v1.0.2: مستقیم نشد — از ورکر (Binance بعد CoinGecko بعد OKX).
    out = parseBinanceKlines(await viaWorker('binance', bUrl, 12000));
    if (out) return out;
    if (cgUrl) {
      var ow = parseCgOhlc(await viaWorker('coingecko', cgUrl, 12000));
      if (ow) return ow;
    }
    return okxCandles(sym, interval, limit);
  }
  /* ---- داده: Yahoo (فقط با پروکسی — مرورگر مستقیم بلاک است) ---- */
  var YAHOO_TF = { '5m': ['5d', '5m'], '15m': ['5d', '15m'], '30m': ['1mo', '30m'], '1h': ['1mo', '1h'], '4h': ['3mo', '1h'], '1d': ['1y', '1d'], '1w': ['2y', '1wk'], '1M': ['5y', '1mo'] };
  async function yahooChart(sym, range, interval) {
    var u = proxyUrl('yahoo-chart', 'https://query2.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=' + range + '&interval=' + interval);
    if (!u) return null;
    var j = await fetchJSON(u, 12000);
    var res0 = j && j.chart && Array.isArray(j.chart.result) && j.chart.result[0];
    if (!res0) return null;
    var ts = res0.timestamp || [], q = (res0.indicators && res0.indicators.quote && res0.indicators.quote[0]) || {};
    var out = [];
    for (var i = 0; i < ts.length; i++) {
      var c = q.close && q.close[i], o = q.open && q.open[i], h = q.high && q.high[i], l = q.low && q.low[i], v = q.volume && q.volume[i];
      if (typeof c !== 'number') continue;
      out.push({ t: ts[i] * 1000, o: (typeof o === 'number' ? o : c), h: (typeof h === 'number' ? h : c), l: (typeof l === 'number' ? l : c), c: c, v: (typeof v === 'number' ? v : 0) });
    }
    return { candles: out.length >= 2 ? out : null, meta: res0.meta || null };
  }
  async function yahooQuote(sym) {
    var u = proxyUrl('yahoo-quote', sym);
    if (!u) return null;
    var j = await fetchJSON(u, 15000);
    return (j && j.quote) ? j.quote : null;
  }
  /* ---- داده: فارکس مستقیم (Frankfurter) — فقط قیمت ---- */
  var FX_PAIRS = { 'EURUSD=X': ['EUR', 'USD'], 'GBPUSD=X': ['GBP', 'USD'], 'USDJPY=X': ['USD', 'JPY'], 'AUDUSD=X': ['AUD', 'USD'], 'USDCHF=X': ['USD', 'CHF'], 'USDCAD=X': ['USD', 'CAD'], 'NZDUSD=X': ['NZD', 'USD'], 'EURGBP=X': ['EUR', 'GBP'], 'EURJPY=X': ['EUR', 'JPY'], 'GBPJPY=X': ['GBP', 'JPY'], 'EURCHF=X': ['EUR', 'CHF'], 'AUDJPY=X': ['AUD', 'JPY'], 'EURAUD=X': ['EUR', 'AUD'], 'GBPAUD=X': ['GBP', 'AUD'], 'USDMXN=X': ['USD', 'MXN'] };
  async function frankfurterPrice(sym) {
    var p = FX_PAIRS[sym];
    if (!p) return null;
    var j = await fetchJSON('https://api.frankfurter.app/latest?from=' + p[0] + '&to=' + p[1], 8000);
    if (!j || !j.rates || !(j.rates[p[1]] > 0)) return null;
    return { price: j.rates[p[1]], changePct: null, high: null, low: null, open: null, prevClose: null, volume: null, currency: p[1] };
  }
  /* ---- داده: ایران (Nerkhsanj — فقط با پروکسی) ---- */
  // کلید واقعی live.json (پروب ۲۰۲۶-۱۱-۰۹، ۲۸ ردیف)؛ مثقال = mesghal (نه mithqal).
  var IRAN_KEYS = { usd: 'dollar', eur: 'euro', gold18: 'gold', emami: 'coin', bahar: 'bahar', half: 'half', quarter: 'quarter', mithqal: 'mesghal', tether: 'tether', bitcoin: 'bitcoin', gold24: 'gold24', gram: 'gram', silver: 'silver', aed: 'aed', gbp: 'pound' };
  async function iranRate(key) {
    var u = proxyUrl('nerkhsanj', 'https://nerkh.jahankhahan.shop/data/live.json');
    if (!u) return null;
    var j = await fetchJSON(u, 10000);
    var rates = j && j.rates;
    var k = IRAN_KEYS[key];
    if (!rates || !k || !(rates[k] > 0)) return null;
    return { price: rates[k], changePct: null, high: null, low: null, open: null, prevClose: null, volume: null, currency: 'Toman' };
  }
  /* ---- داده: بنیادی کریپتو (مستقیم CoinGecko) ---- */
  async function coingeckoFund(sym) {
    var id = CG_IDS[sym];
    if (!id) return null;
    var fundUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + id + '&price_change_percentage=24h,7d,30d';
    var j = await fetchJSON(fundUrl, 10000);
    if (!Array.isArray(j) || !j[0]) j = await viaWorker('coingecko', fundUrl, 12000); // v1.0.2: مستقیم نشد — از ورکر.
    if (!Array.isArray(j) || !j[0]) return null;
    var c = j[0];
    return { name: c.name, rank: c.market_cap_rank, marketCap: c.market_cap, fdv: c.fully_diluted_valuation, volume24: c.total_volume,
      chg24: c.price_change_percentage_24h_in_currency, chg7d: c.price_change_percentage_7d_in_currency, chg30d: c.price_change_percentage_30d_in_currency,
      circulating: c.circulating_supply, total: c.total_supply, max: c.max_supply, ath: c.ath, athChange: c.ath_change_percentage, atl: c.atl, atlChange: c.atl_change_percentage };
  }
  /* ---- داده: بورس/فرابورس ایران — مفید از ورکر (v1.1.0) ----
     قیمت = آخرین قیمت پایانی (تیک زنده ندارد)؛ کندل = UDF مفید.
     ISIN از فهرست stockTickers خود مفید می‌آید (ورکر ردیف CommonStock با ISIN معتبر را
     برمی‌گزیند — ردیف «محصول»/«شاخص صنعت» با همان نماد کنار گذاشته می‌شود). */
  var MOFID_RES = { '5m': '5', '15m': '15', '30m': '30', '1h': '60', '1d': '1D', '1w': '1W' };
  var mofidCache = {};
  async function mofidResolve(symbol) {
    if (mofidCache[symbol]) return mofidCache[symbol];
    if (!PROXY_URL) return null;
    var j = await fetchJSON(PROXY_URL.replace(/\/$/, '') + '/mofid?kind=resolve&symbol=' + encodeURIComponent(symbol), 12000);
    if (!j || !j.ok || !j.isin) return null;
    mofidCache[symbol] = j;
    return j;
  }
  function parseMofidUdf(j) {
    if (!j || j.s !== 'ok' || !Array.isArray(j.t) || !Array.isArray(j.c)) return null;
    var out = [];
    for (var i = 0; i < j.t.length; i++) {
      var t = +j.t[i], o = j.o && +j.o[i], h = j.h && +j.h[i], l = j.l && +j.l[i], c = +j.c[i], v = j.v ? (+j.v[i] || 0) : 0;
      if (!Number.isFinite(t) || !Number.isFinite(c) || !Number.isFinite(o) || !Number.isFinite(h) || !Number.isFinite(l)) continue;
      if (h < Math.max(o, c, l) || l > Math.min(o, c, h)) continue;
      out.push({ t: t * 1000, o: o, h: h, l: l, c: c, v: v });
    }
    return out.length >= 2 ? out : null;
  }
  async function mofidHistory(isin, resolution, fromSec, toSec, adj) {
    if (!PROXY_URL) return null;
    var u = PROXY_URL.replace(/\/$/, '') + '/mofid?kind=history&isin=' + encodeURIComponent(isin)
      + '&resolution=' + resolution + '&from=' + fromSec + '&to=' + toSec + '&adj=' + (adj ? '1' : '0');
    return fetchJSON(u, 12000);
  }
  async function mofidCandles(symbol, tf) {
    var res = MOFID_RES[tf];
    if (!res) return null;
    var r = await mofidResolve(symbol);
    if (!r) return null;
    var to = Math.floor(Date.now() / 1000);
    var days = tf === '1d' ? 150 : tf === '1w' ? 400 : 14;
    var from = to - days * 86400;
    // نردبان واریانت (همان P56): ثانیه/بازهٔ کامل ← میلی‌ثانیه ← adjusted=true.
    var j = await mofidHistory(r.isin, res, from, to, 0);
    var out = parseMofidUdf(j);
    if (out) return out;
    j = await mofidHistory(r.isin, res, from * 1000, to * 1000, 0);
    out = parseMofidUdf(j);
    if (out) return out;
    j = await mofidHistory(r.isin, res, from, to, 1);
    return parseMofidUdf(j);
  }
  async function mofidPrice(symbol) {
    var cs = await mofidCandles(symbol, '1d');
    if (!cs || cs.length < 2) return null;
    var last = cs[cs.length - 1], prev = cs[cs.length - 2];
    return { price: last.c, changePct: prev.c > 0 ? ((last.c - prev.c) / prev.c) * 100 : null,
      high: null, low: null, open: null, prevClose: prev.c, volume: null, currency: 'Rial',
      closeLabel: true, asOf: last.t };
  }

  /* ---- وضعیت ---- */
  var state = { view: 'catalog', market: null, quote: null, tf: '1h', tab: 'chart', candles: null, quoteRes: null, loading: 0, priceUsd: null, priceIran: null, priceMode: 'usd', candlesDone: false, searchQ: '', liveMode: null, mofidAsOf: null };

  /* ---- سیم‌کشی چارت اونلا (chart-style + native-chart) ---- */
  window.__ov = window.__ov || {};
  /* cs/cur/pair/tf: در native-chart.js روی window نگاشت شده‌اند (shim) — اینجا فقط مقدار می‌دهیم. */
  var nInit = false, demo = false, tvOn = false, tvInit = false;
  function T(fa, en) { return lang === 'fa' ? fa : en; }
  window.T = T;
  window.nInit = false; window.demo = false; window.tvOn = false; window.tvInit = false;
  function marketPairName() { return state.quote ? state.quote.display + '  ' : ''; }
  window.marketPairName = marketPairName;
  async function candlesFor() {
    // همان امضای loadNative اونلا: { d: candles, ... } — داده از همین مینی‌اپ می‌آید.
    if (!state.candles || state.candles.length < 2) return { d: [], error: 'no-candles' };
    return { d: state.candles.slice(), offline: false };
  }
  window.candlesFor = candlesFor;
  // draw() و head() و loadNative() از native-chart.js می‌آیند (global).

  /* ---- رندر: کاتولوگ + سرچ ---- */
  function iconHtml(q) {
    try {
      if (window.MiniIcons && window.MiniIcons.badgeFor) return window.MiniIcons.badgeFor(q);
    } catch (e) {}
    return '<span class="oa-ic oa-ic-letter">' + esc(String(q.label || '?').slice(0, 1)) + '</span>';
  }
  function marketLabel(k) {
    var m = MARKETS[k];
    return lang === 'fa' ? (m.fa || m.label) : m.label;
  }
  function show(view) {
    state.view = view;
    stopLive();
    $('view-catalog').style.display = view === 'catalog' ? '' : 'none';
    $('view-symbol').style.display = view === 'symbol' ? '' : 'none';
    $('backBtn').style.display = view === 'symbol' ? '' : 'none';
    if (view === 'catalog') { if (state.searchQ) renderSearch(state.searchQ); else renderCatalog(); }
    if (tg) { try { tg.expand(); } catch (e) {} }
  }
  function renderCatalog() {
    $('catalogTitle').textContent = T('کاتولوگ', 'Catalog');
    var html = '';
    Object.keys(MARKETS).forEach(function (k) {
      var m = MARKETS[k];
      html += '<div class="mkt"><div class="mkt-h"><span class="mkt-ic">' + (MARKET_SVG[k] || '') + '</span>' + esc(marketLabel(k)) + '</div><div class="syms">';
      m.quotes.forEach(function (q) {
        html += '<button class="sym" data-provider="' + q.provider + '" data-symbol="' + esc(q.symbol) + '"><span class="sym-ic">' + iconHtml(q) + '</span><span class="sym-lb">' + esc(q.label) + '</span></button>';
      });
      html += '</div></div>';
    });
    $('catalog').innerHTML = html;
    $('searchResults').innerHTML = '';
    bindSymbolButtons($('catalog'));
  }
  function bindSymbolButtons(root) {
    root.querySelectorAll('.sym, .srow').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = null;
        Object.keys(MARKETS).forEach(function (k) {
          MARKETS[k].quotes.forEach(function (x) { if (x.provider === b.dataset.provider && x.symbol === b.dataset.symbol) q = x; });
        });
        if (q) openSymbol(q);
      });
    });
  }
  function renderSearch(q) {
    state.searchQ = q;
    var nq = normQ(q);
    if (!nq) { renderCatalog(); return; }
    $('catalogTitle').textContent = T('نتایج جستجو', 'Search results');
    var html = '', total = 0;
    Object.keys(MARKETS).forEach(function (k) {
      var m = MARKETS[k];
      var hits = m.quotes.filter(function (x) {
        var hay = normQ(x.label + ' ' + x.display + ' ' + x.symbol + ' ' + (x.kw || '') + ' ' + (x.fa || '') + ' ' + m.label + ' ' + (m.fa || ''));
        return hay.indexOf(nq) !== -1;
      });
      if (!hits.length) return;
      html += '<div class="mkt"><div class="mkt-h"><span class="mkt-ic">' + (MARKET_SVG[k] || '') + '</span>' + esc(marketLabel(k)) + '</div><div class="srows">';
      hits.slice(0, 15).forEach(function (x) {
        total++;
        html += '<button class="srow" data-provider="' + x.provider + '" data-symbol="' + esc(x.symbol) + '"><span class="sym-ic">' + iconHtml(x) + '</span><span class="srow-lb">' + esc(x.label) + '</span><span class="srow-ds">' + esc(x.display) + '</span></button>';
      });
      html += '</div></div>';
    });
    $('catalog').innerHTML = '';
    $('searchResults').innerHTML = html || '<div class="na">' + esc(T('چیزی پیدا نشد.', 'Nothing found.')) + '</div>';
    bindSymbolButtons($('searchResults'));
  }

  /* ---- رندر: نماد ---- */
  function row(label, value) {
    return '<div class="row"><span>' + esc(label) + '</span><b>' + value + '</b></div>';
  }
  function openSymbol(q) {
    stopLive();
    state.quote = q;
    state.tab = 'chart';
    state.candles = null; state.quoteRes = null;
    state.priceUsd = null; state.priceIran = null; state.priceMode = 'usd'; state.candlesDone = false;
    state.mofidAsOf = null; state.liveMode = null;
    // تایم‌فریم فعلی اگر برای این provider نیست (مثلاً 1s برای سهام) → 1h.
    var tfs = TFS[q.provider] || [];
    if (tfs.indexOf(state.tf) === -1) state.tf = '1h';
    try { window.__ov.st = 7; window.__ov.pan = 0; } catch (e) {}
    window.pair.sym = q.symbol; window.pair.base = q.label; window.pair.kind = (q.provider === 'binance') ? 'crypto' : 'other';
    window.tf = state.tf;
    show('symbol');
    $('symTitle').innerHTML = '<span class="sym-title-ic">' + iconHtml(q) + '</span>' + esc(q.display);
    $('priceBox').innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    $('tab-chart').innerHTML = '';
    $('tab-analysis').innerHTML = '';
    $('tab-fund').innerHTML = '';
    $('tab-news').innerHTML = '';
    setTab('chart');
    // v1.0.3: اگر loadSymbol به هر دلیلی خطا داد، صفحه روی «در حال بارگذاری» گیر نکند.
    try {
      var _lp = loadSymbol();
      if (_lp && _lp.catch) _lp.catch(function (e) {
        try { console.error('[mini] loadSymbol failed', e); } catch (e0) {}
        try { state.candlesDone = true; renderPriceBox(false, false); $('tab-chart').innerHTML = '<div class="na">خطا: ' + esc(String(e && e.message || e)) + '</div>'; naTabs(); } catch (e2) {}
      });
    } catch (e) { try { console.error('[mini] openSymbol failed', e); } catch (e0) {} }
  }
  function setTab(tab) {
    state.tab = tab;
    ['chart', 'analysis', 'fund', 'news'].forEach(function (t) {
      $('tabBtn-' + t).classList.toggle('on', t === tab);
      $('tab-' + t).style.display = t === tab ? '' : 'none';
    });
    if (tab === 'chart' && state.candles) { setTimeout(function () { try { window.draw(); } catch (e) {} }, 30); }
    if (tab === 'analysis') renderAnalysis();
    if (tab === 'fund') renderFund();
    if (tab === 'news') renderNews();
  }
  function setTf(t) {
    var tfs = TFS[state.quote.provider] || [];
    if (tfs.indexOf(t) === -1) return;
    stopLive();
    var prevTf = state.tf;
    state.tf = t; window.tf = t;
    try { window.__ov.st = 7; window.__ov.pan = 0; } catch (e) {}
    document.querySelectorAll('#tfRow button').forEach(function (b) { b.classList.toggle('on', b.dataset.tf === t); });
    loadCandles(prevTf);
  }

  // v1.0.2: قیمت دلاری پیش‌فرض است؛ قیمت ایرانی (تومان) انتخاب دومِ کاربر است —
  // با دکمهٔ «دلار | تومان» عوض می‌شود، نه خودکار. اگر قیمت جهانی نیامد، باکس «در دسترس نیست»
  // می‌شود ولی دکمهٔ تومان (اگر قیمت ایرانی رسید) هنوز هست تا کاربر خودش انتخاب کند.
  function liveBadge() {
    if (!state.liveMode) return '';
    var cls = state.liveMode === 'ws' ? 'live-ws' : 'live-poll';
    var txt = state.liveMode === 'ws' ? T('● زنده', '● LIVE') : T('● به‌روزرسانی دوره‌ای', '● Updating');
    return ' <span class="live-dot ' + cls + '">' + esc(txt) + '</span>';
  }
  function renderPriceBox(needProxy, iranBlocked) {
    var q = state.quote;
    var p = state.priceMode === 'iran' ? state.priceIran : state.priceUsd;
    var canSwitch = !!(state.priceUsd && state.priceIran);
    var iranOnly = !state.priceUsd && !!state.priceIran;
    if (!p) {
      $('priceBox').innerHTML = '<div class="na">' + esc(T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>'
        + (iranBlocked ? '<div class="hint">' + esc(T('سهام ایران به ربات روی PC نیاز دارد — از IP خارجی بلاک است.', 'Iran stocks need the bot on your PC — they are blocked from foreign IPs.')) + '</div>'
        : (needProxy ? '<div class="hint">' + esc(T('به پروکسی نیاز دارد — PROXY_URL را در app.js بگذار (README را ببین).', 'Needs the proxy — set PROXY_URL in app.js (see README).')) + '</div>' : ''))
        + (iranOnly ? '<div class="seg"><button type="button" data-mode="iran">' + esc(T('قیمت ایران (تومان)', 'Iran price (Toman)')) + '</button></div>' : '');
      bindPriceMode();
      return;
    }
    var unit = ' ' + (p.currency || '');
    var ch = (typeof p.changePct === 'number') ? ' <span class="' + (p.changePct >= 0 ? 'up' : 'dn') + '">' + fmtPct(p.changePct) + '</span>' : '';
    var subLabel = p.closeLabel
      ? esc(T('قیمت پایانی', 'Closing price')) + (state.mofidAsOf ? ' • ' + esc(mofidDate(state.mofidAsOf)) : '')
      : esc(T('تغییر ۲۴ ساعت', '24h change')) + ': ' + ch;
    $('priceBox').innerHTML = '<div class="big"><span class="big-v">' + fmt(p.price) + '</span><span class="unit">' + esc(unit) + '</span></div>'
      + '<div class="sub">' + subLabel + liveBadge() + '</div>'
      + ((p.high != null) ? row(T('سقف ۲۴ ساعت', 'High 24h'), fmt(p.high)) : '')
      + ((p.low != null) ? row(T('کف ۲۴ ساعت', 'Low 24h'), fmt(p.low)) : '')
      + ((p.volume != null) ? row(T('حجم ۲۴ ساعت', 'Volume 24h'), fmt(p.volume)) : '')
      + (canSwitch ? '<div class="seg"><button type="button" data-mode="usd"' + (state.priceMode === 'usd' ? ' class="on"' : '') + '>' + esc(T('دلار', 'USD')) + '</button>'
        + '<button type="button" data-mode="iran"' + (state.priceMode === 'iran' ? ' class="on"' : '') + '>' + esc(T('تومان', 'Toman')) + '</button></div>' : '');
    bindPriceMode();
  }
  function mofidDate(ms) {
    try { return new Date(ms).toLocaleDateString('fa-IR'); } catch (e) { return new Date(ms).toISOString().slice(0, 10); }
  }
  // به‌روزرسانی سبک قیمت در حالت زنده (بدون بازسازی کل باکس).
  function updateLivePrice(price) {
    var big = document.querySelector('#priceBox .big-v');
    if (big) big.textContent = fmt(price);
  }
  function bindPriceMode() {
    var btns = $('priceBox').querySelectorAll('[data-mode]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.priceMode = b.dataset.mode;
        renderPriceBox(false, false);
      });
    });
  }
  function naTabs(msgKey) {
    // v1.0.2: وقتی قیمت/کندل نیامد، تب‌ها روی «در حال بارگذاری» گیر نکنند.
    var m = '<div class="na">' + esc(T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>';
    $('tab-analysis').innerHTML = m;
    $('tab-fund').innerHTML = m;
    $('tab-news').innerHTML = m;
  }

  async function loadSymbol() {
    var q = state.quote;
    var my = ++state.loading;
    // قیمت — دلاری و ایرانی موازی گرفته می‌شوند؛ دلاری پیش‌فرض است، ایرانی انتخاب دوم.
    var price = null, needProxy = false, iranBlocked = false;
    if (q.provider === 'binance') {
      var both = await Promise.all([binanceTicker(q.symbol), iranCryptoPrice(q.symbol)]);
      price = both[0];
      state.priceUsd = both[0];
      state.priceIran = both[1];
      state.priceMode = 'usd';
    }
    else if (q.provider === 'yahoo') {
      if (FX_PAIRS[q.symbol]) price = await frankfurterPrice(q.symbol);
      if (!price) { var yq = await yahooQuote(q.symbol); if (yq) { price = yq; state.quoteRes = yq; } else needProxy = true; }
      else { var yq2 = await yahooQuote(q.symbol); if (yq2) state.quoteRes = yq2; }
      state.priceUsd = price;
    }
    else if (q.provider === 'iran-rate') { price = await iranRate(q.symbol); if (!price) needProxy = true; state.priceUsd = price; }
    else if (q.provider === 'mofid') {
      price = await mofidPrice(q.symbol);
      if (price) state.mofidAsOf = price.asOf;
      else needProxy = true;
      state.priceUsd = price;
    }
    if (my !== state.loading) return;
    if (!price) {
      state.candlesDone = true; // کندلی در راه نیست — تب تحلیل «در حال بارگذاری» نماند.
      renderPriceBox(needProxy, iranBlocked);
      $('tab-chart').innerHTML = '<div class="na">' + esc(T('برای این نماد کندل نیست.', 'No candles for this symbol.')) + '</div>';
      naTabs();
      return;
    }
    renderPriceBox(needProxy, iranBlocked);
    loadCandles();
    renderFund();
    renderNews();
  }

  async function loadCandles(prevTf) {
    var q = state.quote;
    if (!q) return;
    var my = state.loading;
    var candles = null;
    var hadCandles = !!(state.candles && state.candles.length >= 2);
    if (q.provider === 'binance') {
      var limit = state.tf === '1s' ? 500 : 200;
      candles = await binanceKlines(q.symbol, state.tf, limit);
      if (candles && candles.length >= 2) {
        // v1.0.1: اگر کندل‌ها از CoinGecko آمدند، فاصله‌شان ۴ ساعت است — تایم‌فریم واقعی را ثبت کن
        // تا دکمهٔ تایم‌فریم و شمارش معکوس کندل، همان ۴ ساعته را نشان بدهند (نه 1h).
        var gap = candles.length > 1 ? candles[1].t - candles[0].t : 0;
        if (gap >= 3.5 * 3600 * 1000 && gap <= 4.5 * 3600 * 1000 && state.tf !== '4h' && state.tf !== '1d') {
          state.tf = '4h'; window.tf = '4h';
        }
      }
    } else if (q.provider === 'yahoo') {
      var ytf = YAHOO_TF[state.tf] || ['1mo', '1h'];
      var r = await yahooChart(q.symbol, ytf[0], ytf[1]);
      if (r && r.candles) {
        candles = r.candles;
        if (state.tf === '4h') candles = aggregateCandles(candles, 4); // Yahoo 4h ندارد — از ۴×۱h می‌سازیم (همان ربات)
      }
    } else if (q.provider === 'mofid') {
      candles = await mofidCandles(q.symbol, state.tf);
    }
    if (my !== state.loading) return;
    if (!candles) {
      // v1.1.0: اگر تایم‌فریم جدید کندل نداد و چارت قبلی هست، چارت می‌ماند و تایم‌فریم برمی‌گردد.
      if (hadCandles && prevTf) {
        state.tf = prevTf; window.tf = prevTf;
        document.querySelectorAll('#tfRow button').forEach(function (b) { b.classList.toggle('on', b.dataset.tf === prevTf); });
        $('tab-chart').querySelector('.tf-note') && $('tab-chart').querySelector('.tf-note').remove();
        var note = document.createElement('div');
        note.className = 'warn tf-note';
        note.textContent = T('این کندل برای این نماد پشتیبانی نمی‌شود.', 'This candle timeframe is not supported for this symbol.');
        $('tab-chart').appendChild(note);
        return;
      }
      state.candles = null;
      state.candlesDone = true;
      $('tab-chart').innerHTML = '<div class="na">' + esc(T('برای این نماد کندل نیست.', 'No candles for this symbol.')) + '</div>';
      if (state.tab === 'analysis') renderAnalysis();
      return;
    }
    state.candles = candles;
    state.candlesDone = true;
    if (state.tab === 'analysis') renderAnalysis();
    // چارت اونلا: cs را می‌گیرد و draw می‌کند (همان draw اپ).
    window.cs = candles.slice();
    window.cur = -1;
    renderChartShell();
    try { window.draw(); } catch (e) { $('tab-chart').innerHTML = '<div class="na">' + esc(String(e && e.message || e)) + '</div>'; }
    if (state.tab === 'analysis') renderAnalysis();
    if (q.provider === 'binance') startLive();
  }
  function aggregateCandles(csArr, n) {
    var out = [];
    for (var i = 0; i + n - 1 < csArr.length; i += n) {
      var g = csArr.slice(i, i + n);
      out.push({ t: g[0].t, o: g[0].o, h: Math.max.apply(null, g.map(function (c) { return c.h; })), l: Math.min.apply(null, g.map(function (c) { return c.l; })), c: g[g.length - 1].c, v: g.reduce(function (a, c) { return a + (c.v || 0); }, 0) });
    }
    return out.length >= 2 ? out : null;
  }

  /* ---- چارت: نوار ابزار، زوم، تمام‌صفحه، ژست‌ها (v1.1.0) ---- */
  var CHART_TYPES = [['candle', 'کندل', 'Candles'], ['hollow', 'توخالی', 'Hollow'], ['bars', 'بار', 'OHLC'], ['ha', 'هیکین‌آشی', 'Heikin Ashi'], ['line', 'خطی', 'Line'], ['area', 'ناحیه‌ای', 'Area']];
  function chartTypeLabel(t) {
    for (var i = 0; i < CHART_TYPES.length; i++) if (CHART_TYPES[i][0] === t) return lang === 'fa' ? CHART_TYPES[i][1] : CHART_TYPES[i][2];
    return t;
  }
  function zoomBy(f) {
    try {
      window.__ov = window.__ov || {};
      var st = (window.__ov.st || 7) * f;
      window.__ov.st = Math.max(2, Math.min(40, st));
      window.draw(); window.head();
    } catch (e) {}
  }
  function toggleFs() {
    var wrap = $('tab-chart');
    if (!wrap) return;
    if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} return; }
    if (wrap.requestFullscreen) {
      try {
        var p = wrap.requestFullscreen();
        if (p && p.catch) p.catch(function () { cssFs(true); });
      } catch (e) { cssFs(true); }
    } else cssFs(!wrap.classList.contains('fs'));
  }
  function cssFs(on) {
    var tc = $('tab-chart');
    if (!tc) return;
    tc.classList.toggle('fs', !!on);
    var btn = $('fsBtn');
    if (btn) btn.textContent = on ? '✕' : '⛶';
    setTimeout(function () { try { window.draw(); window.head(); } catch (e) {} }, 120);
  }
  function renderChartShell() {
    var types = (window.OnellaChartStyle && window.OnellaChartStyle.types) || ['candle'];
    var cur = 'candle';
    try { cur = window.OnellaChartStyle.get().type || 'candle'; } catch (e) {}
    var maOn = false, volOn = false;
    try { maOn = !!window.OnellaChartStyle.get().ma; volOn = !!window.OnellaChartStyle.get().vol; } catch (e) {}
    var tfs = TFS[state.quote.provider] || [];
    $('tab-chart').innerHTML =
      '<div id="px" class="px"></div>'
      + '<div class="chartwrap" id="chartWrap"><div id="nv" style="position:relative;height:260px"><canvas id="cc" style="width:100%;height:260px;display:block"></canvas></div></div>'
      + '<div class="toolbar" id="chartToolbar">'
      + '<button class="tbtn" id="typeBtn" type="button">' + esc(chartTypeLabel(cur)) + '</button>'
      + '<button class="tbtn' + (maOn ? ' on' : '') + '" id="maBtn" type="button">MA20</button>'
      + '<button class="tbtn' + (volOn ? ' on' : '') + '" id="volBtn" type="button">' + esc(T('حجم', 'Vol')) + '</button>'
      + '<button class="tbtn" id="zoomOutBtn" type="button">−</button>'
      + '<button class="tbtn" id="zoomInBtn" type="button">+</button>'
      + '<button class="tbtn" id="fsBtn" type="button">⛶</button>'
      + '</div>'
      + '<div id="tfRow" class="seg">' + tfs.map(function (k) {
          return '<button data-tf="' + k + '"' + (state.tf === k ? ' class="on"' : '') + '>' + k + '</button>';
        }).join('') + '</div>';
    document.querySelectorAll('#tfRow button').forEach(function (b) {
      b.addEventListener('click', function () { setTf(b.dataset.tf); });
    });
    // سوییچ نوع چارت (چرخه‌ای، ۶ نوع اپ اصلی).
    $('typeBtn').addEventListener('click', function () {
      try {
        var cur2 = window.OnellaChartStyle.get().type;
        var idx = types.indexOf(cur2);
        var nx = types[(idx + 1) % types.length];
        window.OnellaChartStyle.set({ type: nx });
        $('typeBtn').textContent = chartTypeLabel(nx);
        window.draw();
      } catch (e) {}
    });
    $('maBtn').addEventListener('click', function () {
      try {
        var v = !window.OnellaChartStyle.get().ma;
        window.OnellaChartStyle.set({ ma: v ? 1 : 0 });
        $('maBtn').classList.toggle('on', v);
        window.draw();
      } catch (e) {}
    });
    $('volBtn').addEventListener('click', function () {
      try {
        var v2 = !window.OnellaChartStyle.get().vol;
        window.OnellaChartStyle.set({ vol: v2 ? 1 : 0 });
        $('volBtn').classList.toggle('on', v2);
        window.draw();
      } catch (e) {}
    });
    $('zoomInBtn').addEventListener('click', function () { zoomBy(1.4); });
    $('zoomOutBtn').addEventListener('click', function () { zoomBy(1 / 1.4); });
    $('fsBtn').addEventListener('click', function () { toggleFs(); });
    document.addEventListener('fullscreenchange', function () {
      var on = !!document.fullscreenElement;
      var btn = $('fsBtn');
      if (btn) btn.textContent = on ? '✕' : '⛶';
      if (!on) cssFs(false);
      setTimeout(function () { try { window.draw(); window.head(); } catch (e) {} }, 120);
    });
    // ژست‌ها روی کندل: پینچ (زوم)، چرخ موس (زوم)، کشیدن (جابه‌جایی)؛ هاور = کراس‌هِر اپ.
    var cvs = $('cc');
    var pointers = new Map(), pinchD = 0, pinchSt = 0, dragX = null, dragPan = 0, dragging = false;
    function ptrPos(e) { var r = cvs.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width }; }
    cvs.addEventListener('pointerdown', function (e) {
      try { cvs.setPointerCapture(e.pointerId); } catch (err) {}
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        var pts = Array.from(pointers.values());
        pinchD = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchSt = (window.__ov && window.__ov.st) || 7;
        dragging = false;
      } else if (pointers.size === 1) {
        dragX = e.clientX; dragPan = (window.__ov && window.__ov.pan) || 0; dragging = false;
      }
    });
    cvs.addEventListener('pointermove', function (e) {
      var p = ptrPos(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        var pts = Array.from(pointers.values());
        var d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchD > 0 && d > 0) {
          try {
            window.__ov = window.__ov || {};
            window.__ov.st = Math.max(2, Math.min(40, pinchSt * d / pinchD));
            window.draw(); window.head();
          } catch (err) {}
        }
        return;
      }
      if (pointers.size === 1 && dragX !== null) {
        var dx = e.clientX - dragX;
        if (Math.abs(dx) > 6) dragging = true;
        if (dragging) {
          try {
            var st = ((window.__ov || {}).st || 7);
            var maxPan = Math.max(0, (window.cs ? window.cs.length : 0) - Math.floor(p.w / st));
            window.__ov = window.__ov || {};
            window.__ov.pan = Math.max(0, Math.min(maxPan, dragPan + dx / st));
            window.draw(); window.head();
          } catch (err) {}
          return;
        }
      }
      // کراس‌هِر: همان pointermove اپ (native-chart.js).
      var st2 = ((window.__ov || {}).st || 7);
      var n = Math.min(cs.length, Math.floor((p.w - 46) / st2));
      var i = Math.floor(p.x / st2);
      window.cur = (i >= 0 && i < n) ? i : -1;
      try { window.head(); window.draw(); } catch (err) {}
    });
    function ptrEnd(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchD = 0;
      if (pointers.size === 0) { dragX = null; dragging = false; }
    }
    cvs.addEventListener('pointerup', ptrEnd);
    cvs.addEventListener('pointercancel', ptrEnd);
    cvs.addEventListener('pointerleave', function () { if (pointers.size === 0) { window.cur = -1; try { window.head(); window.draw(); } catch (err) {} } });
    cvs.addEventListener('wheel', function (e) {
      try { e.preventDefault(); } catch (err) {}
      zoomBy(e.deltaY < 0 ? 1.25 : 0.8);
    }, { passive: false });
    try { window.head(); } catch (e) {}
  }

  /* ---- زنده (کریپتو): WebSocket کندل Binance + پولینگ REST به‌عنوان fallback ---- */
  var live = { ws: null, timer: null, mode: null, sym: null, tf: null, lastDraw: 0 };
  function stopLive() {
    try { if (live.ws) live.ws.close(); } catch (e) {}
    live.ws = null;
    if (live.timer) { clearInterval(live.timer); live.timer = null; }
    if (live.mode) { live.mode = null; state.liveMode = null; }
    live.sym = null; live.tf = null;
  }
  function startLive() {
    stopLive();
    if (!state.quote || state.quote.provider !== 'binance' || !state.candles || state.view !== 'symbol') return;
    live.sym = state.quote.symbol; live.tf = state.tf;
    if (typeof WebSocket === 'undefined') { startPollLive(); return; }
    try {
      var ws = new WebSocket('wss://data-stream.binance.vision/ws/' + live.sym.toLowerCase() + '@kline_' + live.tf);
      live.ws = ws; live.mode = 'ws'; state.liveMode = 'ws';
      ws.onmessage = function (ev) {
        try {
          var d = JSON.parse(ev.data), k = d && d.k;
          if (!k || k.s !== live.sym) return;
          mergeLiveKline({ t: +k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c, v: +k.v });
        } catch (e) {}
      };
      ws.onclose = function () { if (live.ws === ws) { live.ws = null; startPollLive(); } };
      ws.onerror = function () { if (live.ws === ws) { try { ws.close(); } catch (e) {} } };
      // اگر WS در ۶ ثانیه باز نشد (IP بلاک/فیلتر)، به پولینگ می‌افتیم.
      setTimeout(function () {
        if (live.ws === ws && ws.readyState !== 1) { try { ws.close(); } catch (e) {} }
      }, 6000);
    } catch (e) { startPollLive(); }
    refreshLiveBadge();
  }
  function startPollLive() {
    if (live.timer || !live.sym) return;
    live.mode = 'poll'; state.liveMode = 'poll';
    refreshLiveBadge();
    var ms = live.tf === '1s' ? 2000 : 10000;
    live.timer = setInterval(function () { pollLiveTick(); }, ms);
  }
  function refreshLiveBadge() {
    var sub = document.querySelector('#priceBox .sub');
    if (!sub) return;
    // بج زنده را تازه کن (بدون بازسازی کل باکس).
    var old = sub.querySelector('.live-dot');
    if (old) old.remove();
    if (!state.liveMode) return;
    var sp = document.createElement('span');
    sp.className = 'live-dot ' + (state.liveMode === 'ws' ? 'live-ws' : 'live-poll');
    sp.textContent = ' ' + (state.liveMode === 'ws' ? T('● زنده', '● LIVE') : T('● به‌روزرسانی دوره‌ای', '● Updating'));
    sub.appendChild(sp);
  }
  async function pollLiveTick() {
    if (!state.quote || state.quote.provider !== 'binance' || state.view !== 'symbol') return;
    if (document.hidden) return;
    var ks = await binanceKlines(state.quote.symbol, state.tf, 5);
    if (ks && ks.length) mergeLiveKlines(ks);
    var tk = await binanceTicker(state.quote.symbol);
    if (tk) {
      state.priceUsd = tk;
      updateLivePrice(tk.price);
      if (typeof tk.changePct === 'number') {
        // تغییر ۲۴س را تازه کن — renderPriceBox خودش بج زنده را هم می‌گذارد.
        renderPriceBox(false, false);
      }
    }
  }
  function mergeLiveKline(k) {
    var cs = state.candles;
    if (!cs || !cs.length) return;
    var last = cs[cs.length - 1];
    if (last && last.t === k.t) cs[cs.length - 1] = k;
    else if (!last || k.t > last.t) { cs.push(k); if (cs.length > 500) cs.shift(); }
    else return;
    window.cs = cs;
    updateLivePrice(k.c);
    throttledDraw();
  }
  function mergeLiveKlines(ks) {
    var cs = state.candles;
    if (!cs || !ks.length) return;
    var changed = false;
    ks.forEach(function (k) {
      var last = cs[cs.length - 1];
      if (last && last.t === k.t) { cs[cs.length - 1] = k; changed = true; }
      else if (!last || k.t > last.t) { cs.push(k); changed = true; }
    });
    if (changed) {
      if (cs.length > 500) cs.splice(0, cs.length - 500);
      window.cs = cs;
      updateLivePrice(cs[cs.length - 1].c);
      throttledDraw();
    }
  }
  function throttledDraw() {
    var now = Date.now();
    if (now - live.lastDraw < 400) return;
    live.lastDraw = now;
    try { window.draw(); window.head(); } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopLive();
    else if (state.view === 'symbol' && state.quote && state.quote.provider === 'binance' && state.candles) startLive();
  });

  /* ---- تحلیل (همان موتور ربات؛ DOM به‌جای HTML تلگرام) ---- */
  function renderAnalysis() {
    var el = $('tab-analysis');
    if (!state.candles) {
      // v1.0.2: اگر بارگذاری کندل تمام شد و کندلی نیست، «نیست» نشان بده — نه «در حال بارگذاری» برای همیشه.
      if (state.candlesDone) {
        el.innerHTML = '<div class="na">' + esc(T('برای این نماد کندل نیست.', 'No candles for this symbol.')) + '</div>';
      } else {
        el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
      }
      return;
    }
    if (state.candles.length < 35) {
      el.innerHTML = '<div class="na">' + esc(T('برای تحلیل حداقل ۳۵ کندل لازم است.', 'At least 35 candles are needed for analysis.')) + '</div>';
      return;
    }
    var A = window.OnellaAnalysis;
    var a = A.analyze(state.candles, A.marketOf(state.quote));
    var closes = state.candles.map(function (c) { return c.c; });
    var back = { '1s': [60, 3600], '5m': [12, 288], '15m': [96, 672], '30m': [48, 336], '1h': [24, 168], '4h': [6, 42], '1d': [1, 7], '1w': [1, 4], '1M': [1, 3] }[state.tf] || [24, 168];
    var chgS = A.changeBack(closes, back[0]), chgL = A.changeBack(closes, back[1]);
    var ind = A.MARKET_INDICATORS[A.marketOf(state.quote)] || { volume: true, atr: true, macd: true, w52: false };
    var trendTxt = a.trend === 'up' ? T('صعودی', 'Uptrend') : a.trend === 'down' ? T('نزولی', 'Downtrend') : T('خنثی', 'Neutral');
    var html = '<div class="rows">'
      + row(T('تغییر', 'Change') + ' (' + back[0] + ')', fmtPct(chgS))
      + row(T('تغییر', 'Change') + ' (' + back[1] + ')', fmtPct(chgL))
      + row(T('روند', 'Trend'), esc(trendTxt) + ' — EMA20 ' + fmt(a.e20) + ' • EMA50 ' + fmt(a.e50)
        + (a.e200 != null ? ' • EMA200 ' + fmt(a.e200) + ' (' + (a.longTrend === 'up' ? T('صعودی', 'up') : a.longTrend === 'down' ? T('نزولی', 'down') : T('خنثی', 'neutral')) + ')' : '')
        + (a.macd ? ' • MACD ' + fmt(a.macd.hist) : ''))
      + row(T('RSI (14)', 'RSI (14)'), (a.rsi == null ? '—' : a.rsi.toFixed(1)))
      + (a.bb ? row(T('بولینگر (۲۰، ۲σ)', 'Bollinger (20, 2σ)'), fmt(a.bb.upper) + ' • ' + fmt(a.bb.mid) + ' • ' + fmt(a.bb.lower) + ' — ' + Math.round(a.bb.pos) + '%') : '')
      + (a.bb ? row(T('پهنای باند', 'Band width'), (a.bb.widthPct == null ? '—' : a.bb.widthPct.toFixed(2) + '%')) : '')
      + row(T('حمایت', 'Support'), fmt(a.lo20))
      + row(T('مقاومت', 'Resistance'), fmt(a.hi20))
      + row(T('جای قیمت در بازهٔ ۲۰ کندل', 'Position in 20-range'), (a.pos == null ? '—' : Math.round(a.pos) + '%'))
      + row(T('دامنهٔ نوسان ۲۰ کندل', '20-candle range'), (a.rangePct == null ? '—' : a.rangePct.toFixed(2) + '%'))
      + (ind.w52 && state.quoteRes && state.quoteRes.week52High ? row('52W', fmt(state.quoteRes.week52Low) + ' – ' + fmt(state.quoteRes.week52High)) : '')
      + (ind.atr ? row(T('ATR (14)', 'ATR (14)'), (a.atrPct == null ? '—' : a.atrPct.toFixed(2) + '%')) : '')
      + (ind.volume ? row(T('حجم نسبت به میانگین', 'Volume vs avg'), (a.volRatio == null ? '—' : a.volRatio.toFixed(2) + '×')) : '')
      + '</div><div class="warn">' + esc(T('فقط تحلیل است — نه سیگنال، نه پیش‌بینی، نه توصیهٔ معامله.', 'Analysis only — not a signal, not a prediction, not trading advice.')) + '</div>';
    el.innerHTML = html;
  }

  /* ---- بنیادی ---- */
  function renderFund() {
    var el = $('tab-fund');
    var q = state.quote;
    if (!q) return;
    el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    if (q.provider === 'binance') {
      coingeckoFund(q.symbol).then(function (f) {
        if (!f) { el.innerHTML = '<div class="na">' + esc(T('برای این نماد بنیادی نیست.', 'No fundamentals for this symbol.')) + '</div>'; return; }
        el.innerHTML = '<div class="rows">'
          + (f.rank ? row('#', String(f.rank)) : '')
          + row(T('ارزش بازار', 'Market cap'), f.marketCap ? '$' + fmt(f.marketCap) : '—')
          + row('FDV', f.fdv ? '$' + fmt(f.fdv) : '—')
          + row(T('حجم ۲۴ ساعت', 'Volume 24h'), f.volume24 ? '$' + fmt(f.volume24) : '—')
          + row(T('تغییر ۲۴ ساعت', 'Change 24h'), fmtPct(f.chg24))
          + row(T('تغییر ۷ روز', 'Change 7d'), fmtPct(f.chg7d))
          + row(T('تغییر ۳۰ روز', 'Change 30d'), fmtPct(f.chg30d))
          + row(T('در گردش', 'Circulating'), f.circulating ? fmt(f.circulating) : '—')
          + row(T('سقف تاریخی', 'ATH'), f.ath ? '$' + fmt(f.ath) + (f.athChange != null ? ' (' + fmtPct(f.athChange) + ')' : '') : '—')
          + row(T('کف تاریخی', 'ATL'), f.atl ? '$' + fmt(f.atl) : '—')
          + '</div>';
      });
      return;
    }
    if (q.provider === 'yahoo') {
      if (!state.quoteRes) {
        el.innerHTML = '<div class="na">' + esc(T('برای این نماد بنیادی نیست.', 'No fundamentals for this symbol.')) + '</div>'
          + '<div class="hint">' + esc(T('به پروکسی نیاز دارد — PROXY_URL را در app.js بگذار (README را ببین).', 'Needs the proxy — set PROXY_URL in app.js (see README).')) + '</div>';
        return;
      }
      var r = state.quoteRes;
      var dy = (typeof r.divYield === 'number') ? ((r.divYield > 0.05 ? r.divYield : r.divYield * 100).toFixed(2) + '%') : '—';
      el.innerHTML = '<div class="rows">'
        + (r.name ? row(T('نام', 'Name'), esc(r.name)) : '')
        + row(T('ارزش بازار', 'Market cap'), r.marketCap ? '$' + fmt(r.marketCap) : '—')
        + row('P/E', r.pe != null ? fmt(r.pe) : '—')
        + row('P/E (forward)', r.peForward != null ? fmt(r.peForward) : '—')
        + row('P/B', r.pb != null ? fmt(r.pb) : '—')
        + row('EPS', r.trailingEps != null ? fmt(r.trailingEps) : '—')
        + row('Beta', r.beta != null ? fmt(r.beta) : '—')
        + row(T('سود تقسیمی', 'Dividend'), dy)
        + row(T('سهام در گردش', 'Shares outstanding'), r.sharesOutstanding ? fmt(r.sharesOutstanding) : '—')
        + row(T('میانگین ۵۰ روزه', '50-day avg'), r.avg50 != null ? fmt(r.avg50) : '—')
        + row(T('میانگین ۲۰۰ روزه', '200-day avg'), r.avg200 != null ? fmt(r.avg200) : '—')
        + ((r.week52High != null) ? row('52W', fmt(r.week52Low) + ' – ' + fmt(r.week52High)) : '')
        + (r.exchange ? row(T('بورس', 'Exchange'), esc(r.exchange)) : '')
        + '</div>';
      return;
    }
    el.innerHTML = '<div class="na">' + esc(T('برای این نماد بنیادی نیست.', 'No fundamentals for this symbol.')) + '</div>';
  }

  /* ---- خبر (همان RSS ربات؛ با پروکسی) ---- */
  function renderNews() {
    var el = $('tab-news');
    var q = state.quote;
    if (!q) return;
    el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    var N = window.OnellaNews.createNews({ fetchImpl: proxyFetch });
    var symTag = (q.provider === 'binance') ? q.symbol.replace(/USDT$/, '') : q.symbol;
    N.symbolNews(q, lang, 5).then(function (items) {
      if (!items || !items.length) {
        el.innerHTML = '<div class="na">' + esc(T('خبری پیدا نشد.', 'No news found.')) + '</div>'
          + (!PROXY_URL ? '<div class="hint">' + esc(T('به پروکسی نیاز دارد — PROXY_URL را در app.js بگذار (README را ببین).', 'Needs the proxy — set PROXY_URL in app.js (see README).')) + '</div>' : '');
        return;
      }
      var html = '<div class="news">';
      items.forEach(function (it) {
        var tag = symTag;
        var lv = N.impactOf(it.title);
        html += '<div class="news-item"><div class="news-tag">[' + esc(tag) + '] ' + impactBadge(lv) + '</div>'
          + '<div class="news-title">' + esc(it.title) + '</div>'
          + (it.time ? '<div class="news-time">' + new Date(it.time).toUTCString().slice(5, 22) + ' UTC</div>' : '')
          + '</div>';
      });
      html += '</div><div class="warn">' + esc(T('تاثیر از روی کلیدواژهٔ تیتر تخمین زده شده؛ قطعی نیست.', 'Impact is a keyword estimate, not certain.')) + '</div>';
      el.innerHTML = html;
    });
  }
  function impactBadge(lv) {
    if (lv === 'high') return '<span class="imp high">🔴 ' + esc(lang === 'fa' ? 'تاثیر بالا' : 'High impact') + '</span>';
    if (lv === 'medium') return '<span class="imp med">🟡 ' + esc(lang === 'fa' ? 'تاثیر متوسط' : 'Medium impact') + '</span>';
    return '<span class="imp low">⚪ ' + esc(lang === 'fa' ? 'تاثیر کم' : 'Low impact') + '</span>';
  }
  // fetch خبر از پروکسی (RSS گوگل‌نیوز / CoinDesk) — بدون پروکسی مرورگر CORS را بلاک می‌کند
  // و fetchRss ربات [] برمی‌گرداند؛ پس در آن حالت مستقیم امتحان نمی‌کنیم.
  async function proxyFetch(url, opts) {
    var u = proxyUrl('rss', url);
    if (!u) throw new Error('no-proxy');
    return fetch(u, opts);
  }

  /* ---- شروع ---- */
  function init() {
    if (tg) {
      try { tg.ready(); tg.expand(); } catch (e) {}
      try { tg.BackButton.onClick(function () { show('catalog'); }); } catch (e) {}
    }
    $('backBtn').addEventListener('click', function () { show('catalog'); });
    ['chart', 'analysis', 'fund', 'news'].forEach(function (t) {
      $('tabBtn-' + t).addEventListener('click', function () { setTab(t); });
    });
    $('tabBtn-chart').textContent = T('چارت', 'Chart');
    $('tabBtn-analysis').textContent = T('تحلیل', 'Analysis');
    $('tabBtn-fund').textContent = T('بنیادی', 'Fundamentals');
    $('tabBtn-news').textContent = T('خبر', 'News');
    $('backBtn').textContent = T('‹ بازگشت', '‹ Back');
    var si = $('searchInput');
    if (si) {
      si.placeholder = T('نماد یا بازار را جستجو کن…', 'Search symbols or markets…');
      si.addEventListener('input', function () { renderSearch(si.value); });
    }
    window.addEventListener('beforeunload', function () { stopLive(); });
    show('catalog');
  }
  /* برای تست از کنسول مرورگر: window.__miniApp.openSymbol({provider:'binance',symbol:'BTCUSDT',display:'BTC/USDT',label:'BTC'}) */
  window.__miniApp = { openSymbol: openSymbol, setTf: setTf, setTab: setTab, state: state, renderPriceBox: renderPriceBox, renderSearch: renderSearch, renderCatalog: renderCatalog, zoomBy: zoomBy, toggleFs: toggleFs, startLive: startLive, stopLive: stopLive, MARKETS: MARKETS, TFS: TFS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

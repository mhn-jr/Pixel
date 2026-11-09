'use strict';
/* Onella Nelora Lite v1.2.0 — منطق مینی‌اپ (صفحهٔ استاتیک؛ بدون سرور).
   دیزاین = کپیِ دیدنیِ خود اپ Onella Nelora (نه فقط الهام): همان توکن‌ها،
   همان چیدمان صفحهٔ چارت (گیج بالا، تب‌های بازار، نوار انتخاب نماد، تایم‌فریم
   بالای چارت)، همان مودال سرچ (تب بازار + باکس بزرگ + ردیف آیکون‌دار + ستاره).
   چارت = چارت بومی خود اونلا (chart-style.js + native-chart.js — همان فایل‌های اپ،
   فقط UI اپ حذف شده). تحلیل = همان موتور محلی ربات (analysis-src.js).
   خبر = همان RSS ربات (news-src.js). آیکون = asset-icons.js (پورت js/114 اپ).
   دو تب اصلی پایین صفحه: چارت (کاتولوگ + نماد) و داشبورد (حرارت بازار،
   ۵ صعودی/۵ نزولی، اخبار مهم با نماد + درصد تاثیر تخمینی).
   ژست‌های چارت به سبک TradingView (js/06 اپ): اسکرول روی محور قیمت = زوم
   عمودی مقیاس قیمت، کشیدن روی محور قیمت = کش‌آمدن/فشرده‌شدن مقیاس، کشیدن
   عمودی روی چارت = جابه‌جایی قیمت، دوبار لمس محور قیمت = مقیاس خودکار،
   اسکرول روی چارت = زوم افقی حول نشانگر، دکمهٔ A = مقیاس خودکار، ⏭ = آخرین کندل.
   داده:
     مستقیم (CORS دارد): Binance (کریپتو)، CoinGecko (بنیادی/بازار کریپتو)، Frankfurter (قیمت فارکس)
     با پروکسی (PROXY_URL — ورکر Cloudflare): Yahoo (سهام/فارکس/کالا/شاخص/ETF + چندنمادی)،
     Google News، Nerkhsanj، کریپتو (Binance/CoinGecko/OKX + صرافی ایرانی) وقتی گوشی/PC مستقیم نمی‌رسد،
     مفید (بورس/فرابورس ایران — کندل + قیمت پایانی + چندنمادی داشبورد؛ TSETMC از IP خارجی بلاک است و اینجا نمی‌آید).
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
      impactEst: 'Impact is a keyword estimate, not certain.', openInBot: 'Open in bot', chooseMarket: 'Choose a market:', chooseSymbol: 'Choose a symbol:',
      chartTab: 'Chart', dashTab: 'Dashboard', dashboard: 'Dashboard', marketHeat: 'Market heat', topGainers: 'Top 5 gainers', topLosers: 'Top 5 losers',
      importantNews: 'Important news', searchIn: 'Search in', watchlist: 'Watchlist', noFavs: 'No starred symbols yet — tap the star on any symbol.', refresh: 'Refresh',
      evidence: 'Evidence confluence', bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral',
      autoScale: 'Auto scale', latest: 'Latest candle', tools: 'Tools', fib: 'Fibonacci', sr: 'Support / Resistance', tl: 'Trendline', bb: 'Bollinger', pv: 'Pivot',
      noChangeData: 'No daily-change data for this market in the source.', needsWorker120: 'Needs the new Worker (v1.2.0) — redeploy worker.js on Cloudflare.' },
    fa: { catalog: 'کاتولوگ', back: '‹ بازگشت', price: 'قیمت', change24: 'تغییر ۲۴ ساعت', high: 'سقف ۲۴ ساعت', low: 'کف ۲۴ ساعت', volume: 'حجم ۲۴ ساعت',
      chart: 'چارت', analysis: 'تحلیل', fundamentals: 'بنیادی', news: 'خبر', impactNews: 'خبرهای مهم و تاثیرگذار',
      notAvailable: 'فعلاً در دسترس نیست.', needProxy: 'به پروکسی نیاز دارد — PROXY_URL را در app.js بگذار (README را ببین).',
      iranStockNote: 'سهام ایران به ربات روی PC نیاز دارد — از IP خارجی بلاک است.',
      loading: 'در حال بارگذاری…', noCandles: 'برای این نماد کندل نیست.', noNews: 'خبری پیدا نشد.', noFund: 'برای این نماد بنیادی نیست.',
      trend: 'روند', rsi: 'RSI (14)', bollinger: 'بولینگر (۲۰، ۲σ)', support: 'حمایت', resistance: 'مقاومت', atr: 'ATR (14)',
      change: 'تغییر', bandWidth: 'پهنای باند', range20: 'دامنهٔ نوسان ۲۰ کندل', pos20: 'جای قیمت در بازهٔ ۲۰ کندل', volumeRatio: 'حجم نسبت به میانگین',
      onlyAnalysis: 'فقط تحلیل است — نه سیگنال، نه پیش‌بینی، نه توصیهٔ معامله.',
      impactEst: 'تاثیر از روی کلیدواژهٔ تیتر تخمین زده شده؛ قطعی نیست.', openInBot: 'باز کردن در ربات', chooseMarket: 'بازار را انتخاب کن:', chooseSymbol: 'نماد را انتخاب کن:',
      chartTab: 'چارت', dashTab: 'داشبورد', dashboard: 'داشبورد', marketHeat: 'حرارت بازار', topGainers: '۵ نماد صعودی', topLosers: '۵ نماد نزولی',
      importantNews: 'اخبار مهم', searchIn: 'جستجو در', watchlist: 'واچ‌لیست', noFavs: 'هنوز نمادی ستاره‌دار نکردی — روی ستارهٔ هر نماد بزن.', refresh: 'تازه‌کردن',
      evidence: 'همگرایی شواهد', bullish: 'صعودی', bearish: 'نزولی', neutral: 'خنثی',
      autoScale: 'مقیاس خودکار', latest: 'آخرین کندل', tools: 'ابزار', fib: 'فیبوناچی', sr: 'حمایت/مقاومت', tl: 'خط روند', bb: 'بولینگر', pv: 'پیوت',
      noChangeData: 'برای این بازار تغییر روزانه در منبع نیست.', needsWorker120: 'ورکر جدید (v1.2.0) لازم است — worker.js را در کلودفلیر دوباره دیپلوی کن.' }
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
    etf: { label: 'ETF', fa: 'ETF', quotes: [
      { label: 'SPY', provider: 'yahoo', symbol: 'SPY', display: 'SPY', kw: 'اس اند پی' },
      { label: 'QQQ', provider: 'yahoo', symbol: 'QQQ', display: 'QQQ', kw: 'نزدک' },
      { label: 'DIA', provider: 'yahoo', symbol: 'DIA', display: 'DIA', kw: 'داو' },
      { label: 'IWM', provider: 'yahoo', symbol: 'IWM', display: 'IWM', kw: 'راسل' },
      { label: 'VTI', provider: 'yahoo', symbol: 'VTI', display: 'VTI', kw: 'کل بازار' },
      { label: 'GLD', provider: 'yahoo', symbol: 'GLD', display: 'GLD', kw: 'طلا' },
      { label: 'SLV', provider: 'yahoo', symbol: 'SLV', display: 'SLV', kw: 'نقره' },
      { label: 'USO', provider: 'yahoo', symbol: 'USO', display: 'USO', kw: 'نفت' },
      { label: 'TLT', provider: 'yahoo', symbol: 'TLT', display: 'TLT', kw: 'اوراق' },
      { label: 'SCHD', provider: 'yahoo', symbol: 'SCHD', display: 'SCHD', kw: 'سود تقسیمی' },
      { label: 'XLK', provider: 'yahoo', symbol: 'XLK', display: 'XLK', kw: 'فناوری' },
      { label: 'XLF', provider: 'yahoo', symbol: 'XLF', display: 'XLF', kw: 'مالی' },
      { label: 'ARKK', provider: 'yahoo', symbol: 'ARKK', display: 'ARKK', kw: 'آرک نوآوری' },
      { label: 'VWO', provider: 'yahoo', symbol: 'VWO', display: 'VWO', kw: 'بازار نوظهور' },
      { label: 'EEM', provider: 'yahoo', symbol: 'EEM', display: 'EEM', kw: 'بازار نوظهور' } ] },
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
      /* v1.2.1 — XAU/USD: یاهو XAUUSD=X ندارد (و XAU-USD دادهٔ واقعی ندارد)؛
         PAX Gold روی Binance دقیقاً طلای اونس بر حسب دلار است (1 PAXG = 1 اونس) و
         هم کندل زنده می‌دهد هم دفتر سفارش — پس XAU/USD با همین نماد می‌آید. */
      { label: 'XAU/USD', provider: 'binance', symbol: 'PAXGUSDT', display: 'XAU/USD', kw: 'طلا انس دلار پکس گلد' },
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
  /* تایم‌فریم‌ها — هر provider به‌اندازهٔ توانش (v1.2.0: 1m و 3m اضافه شد؛ 3m برای Yahoo/مفید از تجمیع ۱ دقیقه‌ای ساخته می‌شود). */
  var TF_ALL = ['1s', '1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
  var TFS = {
    binance: TF_ALL,
    yahoo: ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
    mofid: ['1m', '3m', '5m', '15m', '30m', '1h', '1d', '1w'],
    'iran-rate': []
  };
  /* آیکون SVG بازارها (خطی، ۲۴×۲۴، مثل ناوبری اپ اصلی). */
  var MARKET_SVG = {
    crypto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M8.8 9.2h5.4M8.8 14.8h5.4"/></svg>',
    stocks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 20v-6M11 20V6M17 20v-9"/><path d="M3 20h18"/></svg>',
    etf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
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
  var CG_IDS = { BTCUSDT: 'bitcoin', ETHUSDT: 'ethereum', SOLUSDT: 'solana', BNBUSDT: 'binancecoin', XRPUSDT: 'ripple', DOGEUSDT: 'dogecoin', ADAUSDT: 'cardano', TRXUSDT: 'tron', AVAXUSDT: 'avalanche-2', LINKUSDT: 'chainlink', DOTUSDT: 'polkadot', LTCUSDT: 'litecoin', BCHUSDT: 'bitcoin-cash', NEARUSDT: 'near', TONUSDT: 'toncoin', PAXGUSDT: 'pax-gold' }; // v1.0.1: برای fallback قیمت/کندل کریپتو از ایران — v1.2.1: PAXG = XAU/USD
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
  var OKX_BAR = { '1s': '1s', '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m', '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W', '1M': '1M' };
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
  var YAHOO_TF = { '1m': ['1d', '1m'], '3m': ['1d', '1m'], '5m': ['5d', '5m'], '15m': ['5d', '15m'], '30m': ['1mo', '30m'], '1h': ['1mo', '1h'], '4h': ['3mo', '1h'], '1d': ['1y', '1d'], '1w': ['2y', '1wk'], '1M': ['5y', '1mo'] };
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
  var MOFID_RES = { '1m': '1', '3m': '1', '5m': '5', '15m': '15', '30m': '30', '1h': '60', '1d': '1D', '1w': '1W' };
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
  var state = { view: 'catalog', mainTab: 'chart', catalogMarket: 'crypto', market: null, quote: null, tf: '1h', tab: 'chart', candles: null, quoteRes: null, loading: 0, priceUsd: null, priceIran: null, priceMode: 'usd', candlesDone: false, searchQ: '', liveMode: null, mofidAsOf: null };

  /* ---- واچ‌لیست (ستاره) — localStorage؛ کلید provider|symbol ---- */
  var FAV_KEY = 'miniapp_favs';
  function favKey(q) { return q.provider + '|' + q.symbol; }
  function loadFavs() {
    try { var a = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function isFav(q) { return loadFavs().indexOf(favKey(q)) !== -1; }
  function toggleFav(q) {
    var a = loadFavs(), k = favKey(q), i = a.indexOf(k);
    if (i === -1) a.push(k); else a.splice(i, 1);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); } catch (e) {}
    return i === -1;
  }
  /* جستجوی نماد از روی provider+symbol (برای باز کردن از داشبورد/مودال). */
  var QUOTE_LOOKUP = {};
  Object.keys(MARKETS).forEach(function (k) {
    MARKETS[k].quotes.forEach(function (q) { QUOTE_LOOKUP[q.provider + '|' + q.symbol] = q; });
  });
  /* v1.2.3 — نمادهای پویا (از جستجوی زنده: مفید/Yahoo): خارج از کاتولوگ ثابت‌اند،
     ولی باز کردن/ستاره‌دار کردن/واچ‌لیست آن‌ها باید مثل نمادهای کاتولوگ کار کند. */
  var DYNAMIC_QUOTES = {};
  function rememberQuote(q) {
    if (q && q.provider && q.symbol) DYNAMIC_QUOTES[q.provider + '|' + q.symbol] = q;
    return q;
  }
  function lookupQuote(provider, symbol) { return QUOTE_LOOKUP[provider + '|' + symbol] || DYNAMIC_QUOTES[provider + '|' + symbol] || null; }
  /* v1.2.3 — جستجوی زندهٔ Yahoo (سهام/ETF خارج از کاتولوگ) از ورکر. */
  async function yahooSearch(q) {
    if (!PROXY_URL || !q) return [];
    var j = await fetchJSON(PROXY_URL.replace(/\/$/, '') + '/yahoo-search?q=' + encodeURIComponent(q), 12000);
    return (j && Array.isArray(j.quotes)) ? j.quotes : [];
  }
  /* ترتیب تب‌های بازار (مثل اپ اصلی + ایران). */
  var MARKET_ORDER = ['crypto', 'stocks', 'etf', 'forex', 'commodities', 'iran', 'indices', 'boorse', 'farabourse'];
  /* v1.2.2 — پالت مینیمال: رنگ ثابت هر بازار (نقطهٔ تب + آیکون سربرگ بخش). */
  var MKT_COLOR = { crypto: 'var(--p-vol)', stocks: 'var(--p-trend)', etf: 'var(--p-etf)', forex: 'var(--p-mom)', commodities: 'var(--p-vola)', iran: 'var(--p-cndl)', indices: 'var(--p-lvl)', boorse: 'var(--p-cndl)', farabourse: 'var(--p-cndl)' };
  /* v1.2.1 — آیکون‌های SVG اپ (به‌جای ایموجی؛ stroke currentColor، هماهنگ با تم). */
  var ICON = {
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 21h18"/><path d="M7 17v-6"/><path d="M12 17V7"/><path d="M17 17v-3"/></svg>',
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"/></svg>',
    trendUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
    trendDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7l-6 6-4-4-8 8"/><path d="M10 17H3v-7"/></svg>',
    news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10"/><path d="M7 13h6"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
    starOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
    levels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>',
    waves: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></svg>',
    fund: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.2 15.9A10 10 0 1 1 8 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
    /* v1.2.2 — دکمهٔ شناور ابزارهای چارت: دقیقاً همان SVG اپ اصلی
       (js/54-onella-v68-protools.js:154 — دکمهٔ «ابزارهای Onella»): قاب
       گرد با گرادیان نارنجی→بنفش، شعلهٔ گرادیانی، خط صعودی سفید. */
    tools: '<svg viewBox="0 0 24 24" width="24" height="24"><defs><linearGradient id="oplg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a1f"/><stop offset="1" stop-color="#b07cff"/></linearGradient></defs><rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="rgba(255,140,40,.12)" stroke="url(#oplg)" stroke-width="1.6"/><path d="M12 3.6c.9 3 4.6 4.8 4.6 8.7a4.6 4.6 0 0 1-9.2 0c0-1.8.9-2.9 1.8-3.8.2 1.2.8 2 1.5 2.3C10.3 8.2 10.6 5.8 12 3.6z" fill="url(#oplg)"/><path d="M5 18.5l5-4 3 2.2 6-6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="18.5" r="1.7" fill="#fff"/><circle cx="19" cy="12.7" r="1.7" fill="#fff"/></svg>'
  };

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
    stopDepthPoll();
    var chartTab = state.mainTab === 'chart';
    $('view-catalog').style.display = (chartTab && view === 'catalog') ? '' : 'none';
    $('view-symbol').style.display = (chartTab && view === 'symbol') ? '' : 'none';
    $('view-dash').style.display = chartTab ? 'none' : '';
    $('backBtn').style.display = (chartTab && view === 'symbol') ? '' : 'none';
    if (chartTab && view === 'catalog') { if (state.searchQ) renderSearch(state.searchQ); else renderCatalog(); }
    if (tg) { try { tg.expand(); } catch (e) {} }
  }
  function showMainTab(tab) {
    state.mainTab = tab;
    $('mainTab-chart').classList.toggle('on', tab === 'chart');
    $('mainTab-dash').classList.toggle('on', tab === 'dash');
    if (tab === 'dash') { stopLive(); loadDash(false); }
    show(state.view);
  }
  /* v1.2.0 — کاتولوگ تب‌دار (مثل اپ اصلی): یک بازار در هر لحظه + واچ‌لیست. */
  function renderCatalog() {
    $('catalogTitle').textContent = T('کاتولوگ', 'Catalog');
    var tabsHtml = '';
    MARKET_ORDER.forEach(function (k) {
      tabsHtml += '<button type="button" data-mkt="' + k + '"' + (state.catalogMarket === k ? ' class="on"' : '') + '><span class="mkt-dot" style="background:' + (MKT_COLOR[k] || 'var(--mut)') + '"></span>' + esc(marketLabel(k)) + '</button>';
    });
    tabsHtml += '<button type="button" data-mkt="wl"' + (state.catalogMarket === 'wl' ? ' class="on"' : '') + '>' + ICON.star + ' ' + esc(T('واچ‌لیست', 'Watchlist')) + '</button>';
    $('catalogTabs').innerHTML = tabsHtml;
    $('catalogTabs').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { state.catalogMarket = b.dataset.mkt; renderCatalog(); });
    });
    var html = '';
    if (state.catalogMarket === 'wl') {
      var favs = loadFavs().map(function (k) { var p = k.split('|'); return lookupQuote(p[0], p[1]); }).filter(Boolean);
      if (!favs.length) {
        html = '<div class="na">' + esc(T('هنوز نمادی ستاره‌دار نکردی — روی ستارهٔ هر نماد بزن.', 'No starred symbols yet — tap the star on any symbol.')) + '</div>';
      } else {
        html = '<div class="mkt"><div class="srows">';
        favs.forEach(function (q) {
          html += '<button class="srow" data-provider="' + q.provider + '" data-symbol="' + esc(q.symbol) + '"><span class="sym-ic">' + iconHtml(q) + '</span><span class="srow-lb">' + esc(q.label) + '</span><span class="srow-ds">' + esc(q.display) + '</span></button>';
        });
        html += '</div></div>';
      }
      $('catalog').innerHTML = html;
      bindSymbolButtons($('catalog'));
      $('searchResults').innerHTML = '';
      return;
    }
    var m = MARKETS[state.catalogMarket];
    if (!m) { state.catalogMarket = 'crypto'; renderCatalog(); return; }
    html = '<div class="mkt"><div class="mkt-h"><span class="mkt-ic" style="color:' + (MKT_COLOR[state.catalogMarket] || 'var(--acc)') + '">' + (MARKET_SVG[state.catalogMarket] || '') + '</span>' + esc(marketLabel(state.catalogMarket)) + '</div><div class="syms">';
    m.quotes.forEach(function (q) {
      html += '<button class="sym" data-provider="' + q.provider + '" data-symbol="' + esc(q.symbol) + '"><span class="sym-ic">' + iconHtml(q) + '</span><span class="sym-lb">' + esc(q.label) + '</span></button>';
    });
    html += '</div></div>';
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
      html += '<div class="mkt"><div class="mkt-h"><span class="mkt-ic" style="color:' + (MKT_COLOR[k] || 'var(--acc)') + '">' + (MARKET_SVG[k] || '') + '</span>' + esc(marketLabel(k)) + '</div><div class="srows">';
      hits.slice(0, 15).forEach(function (x) {
        total++;
        html += '<button class="srow" data-provider="' + x.provider + '" data-symbol="' + esc(x.symbol) + '"><span class="sym-ic">' + iconHtml(x) + '</span><span class="srow-lb">' + esc(x.label) + '</span><span class="srow-ds">' + esc(x.display) + '</span></button>';
      });
      html += '</div></div>';
    });
    $('catalog').innerHTML = '';
    $('searchResults').innerHTML = html || '<div class="na">' + esc(T('چیزی پیدا نشد.', 'Nothing found.')) + '</div>';
    bindSymbolButtons($('searchResults'));
    /* v1.2.3 — اگر در کاتولوگ ثابت چیزی پیدا نشد، جستجوی زنده: نماد فارسی
       → مفید (هر نماد بورس/فرابورس)، نماد لاتین → Yahoo (هر سهام/ETF). */
    if (!total) {
      var sq = ++searchSeq;
      setTimeout(function () { liveSearchFallback(q, sq); }, 350);
    }
  }
  var searchSeq = 0;
  function liveSearchFallback(q, sq) {
    if (sq !== searchSeq || state.searchQ !== q || !$('searchResults')) return;
    var nq = normQ(q);
    if (!nq || nq.length < 2) return;
    var isFa = /[؀-ۿ]/.test(q);
    var done = function (rows) {
      if (sq !== searchSeq || state.searchQ !== q || !$('searchResults')) return;
      if (!rows || !rows.length) return;
      var html = '<div class="mkt"><div class="mkt-h"><span class="mkt-ic" style="color:var(--acc)">' + (isFa ? (MARKET_SVG.boorse || '') : (MARKET_SVG.stocks || '')) + '</span>' + esc(isFa ? T('بورس / فرابورس — جستجوی زنده', 'TSE / Farabourse — live search') : T('سهام — جستجوی زنده', 'Stocks — live search')) + '</div><div class="srows">';
      rows.forEach(function (x) {
        html += '<button class="srow" data-live="1" data-provider="' + x.provider + '" data-symbol="' + esc(x.symbol) + '"><span class="sym-ic">' + iconHtml(x) + '</span><span class="srow-lb">' + esc(x.label) + '</span><span class="srow-ds">' + esc(x.display) + '</span></button>';
      });
      html += '</div></div>';
      $('searchResults').innerHTML = html;
      bindLiveRows($('searchResults'));
    };
    if (isFa) {
      mofidResolve(nq).then(function (r) {
        if (!r) return done([]);
        done([rememberQuote({ label: nq, provider: 'mofid', symbol: nq, display: (r.title || nq) + ' (ریال)' })]);
      }).catch(function () {});
    } else {
      yahooSearch(nq).then(function (rs) {
        done(rs.map(function (r) {
          return rememberQuote({ label: r.symbol, provider: 'yahoo', symbol: r.symbol, display: (r.name || r.symbol) + (r.exchange ? ' · ' + r.exchange : '') });
        }));
      }).catch(function () {});
    }
  }
  /* ردیف‌های جستجوی زنده: نماد خارج از کاتولوگ است — مستقیم باز می‌شود. */
  function bindLiveRows(root) {
    root.querySelectorAll('[data-live="1"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = lookupQuote(b.dataset.provider, b.dataset.symbol);
        if (q) openSymbol(q);
      });
    });
  }

  /* ---- مودال سرچ (v1.2.0 — کپیِ سرچ اپ اصلی: تب بازار + باکس بزرگ + ردیف آیکون‌دار + ستاره) ---- */
  var sm = { market: 'crypto', q: '' };
  var SM_PLACEHOLDER = {
    crypto: { fa: 'جستجوی ارز دیجیتال: BTC، SOL، PEPE ...', en: 'Search crypto: BTC, SOL, PEPE ...' },
    stocks: { fa: 'جستجوی سهام: AAPL، TSLA ...', en: 'Search stocks: AAPL, TSLA ...' },
    etf: { fa: 'جستجوی ETF: SPY، QQQ ...', en: 'Search ETFs: SPY, QQQ ...' },
    forex: { fa: 'جستجوی جفت‌ارز: EUR/USD ...', en: 'Search forex: EUR/USD ...' },
    commodities: { fa: 'جستجوی کالا: طلا، نفت ...', en: 'Search commodities: gold, oil ...' },
    iran: { fa: 'جستجوی نرخ ایران: دلار، طلا ...', en: 'Search Iran rates: dollar, gold ...' },
    indices: { fa: 'جستجوی شاخص: S&P 500 ...', en: 'Search indices: S&P 500 ...' },
    boorse: { fa: 'جستجوی بورس: فولاد، فملی ...', en: 'Search TSE: Foolad ...' },
    farabourse: { fa: 'جستجوی فرابورس: آریا ...', en: 'Search Farabourse: Aria ...' },
    wl: { fa: 'جستجو در واچ‌لیست…', en: 'Search watchlist…' }
  };
  function smPlaceholder() {
    var p = SM_PLACEHOLDER[sm.market] || SM_PLACEHOLDER.crypto;
    return lang === 'fa' ? p.fa : p.en;
  }
  function openSearchModal(market) {
    if (market && (MARKETS[market] || market === 'wl')) sm.market = market;
    else if (state.quote) {
      var cur = null;
      Object.keys(MARKETS).forEach(function (k) { MARKETS[k].quotes.forEach(function (q) { if (q === state.quote) cur = k; }); });
      if (cur) sm.market = cur;
    }
    $('smInput').value = '';
    sm.q = '';
    renderSmTabs();
    renderSmBody();
    $('searchModal').classList.add('open');
    setTimeout(function () { try { $('smInput').focus(); } catch (e) {} }, 50);
  }
  function closeSearchModal() { $('searchModal').classList.remove('open'); }
  function renderSmTabs() {
    var html = '';
    MARKET_ORDER.forEach(function (k) {
      html += '<button type="button" data-mkt="' + k + '"' + (sm.market === k ? ' class="on"' : '') + '><span class="mkt-dot" style="background:' + (MKT_COLOR[k] || 'var(--mut)') + '"></span>' + esc(marketLabel(k)) + '</button>';
    });
    html += '<button type="button" data-mkt="wl"' + (sm.market === 'wl' ? ' class="on"' : '') + '>' + ICON.star + ' ' + esc(T('واچ‌لیست', 'Watchlist')) + '</button>';
    $('smTabs').innerHTML = html;
    $('smTabs').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { sm.market = b.dataset.mkt; renderSmTabs(); renderSmBody(); });
    });
    $('smTitle').textContent = T('جستجو در ', 'Search in ') + (sm.market === 'wl' ? T('واچ‌لیست', 'Watchlist') : marketLabel(sm.market));
    $('smInput').placeholder = smPlaceholder();
  }
  function smRowsFor(market, nq) {
    var list = [];
    if (market === 'wl') {
      list = loadFavs().map(function (k) { var p = k.split('|'); return lookupQuote(p[0], p[1]); }).filter(Boolean);
    } else {
      var m = MARKETS[market];
      if (!m) return [];
      list = m.quotes.slice();
    }
    if (!nq) return list;
    return list.filter(function (x) {
      var hay = normQ(x.label + ' ' + x.display + ' ' + x.symbol + ' ' + (x.kw || '') + ' ' + (x.fa || ''));
      return hay.indexOf(nq) !== -1;
    });
  }
  var smLiveSeq = 0;
  function renderSmBody() {
    var nq = normQ(sm.q);
    var list = smRowsFor(sm.market, nq);
    var html = '';
    if (!list.length) {
      /* v1.2.3 — در کاتولوگ نبود؟ جستجوی زنده (با تاخیر کوتاه تا هر حرف یک تماس نشود). */
      var liveOk = (sm.market === 'boorse' || sm.market === 'farabourse' || sm.market === 'stocks' || sm.market === 'etf');
      if (liveOk && nq && nq.length >= 2) {
        html = '<div class="na">' + esc(T('در حال جستجو…', 'Searching…')) + '</div>';
        var sq = ++smLiveSeq;
        setTimeout(function () { smLiveLookup(nq, sq); }, 350);
      } else {
        html = '<div class="na">' + esc(sm.market === 'wl' ? T('هنوز نمادی ستاره‌دار نکردی — روی ستارهٔ هر نماد بزن.', 'No starred symbols yet — tap the star on any symbol.') : T('چیزی پیدا نشد.', 'Nothing found.')) + '</div>';
      }
    } else {
      list.slice(0, 30).forEach(function (x) {
        var mk = '';
        Object.keys(MARKETS).forEach(function (k) { if (MARKETS[k].quotes.indexOf(x) !== -1) mk = k; });
        var sub = esc(x.display) + (mk ? ' · ' + esc(marketLabel(mk)) : '');
        html += '<button class="sm-row" data-provider="' + x.provider + '" data-symbol="' + esc(x.symbol) + '"><span class="sym-ic">' + iconHtml(x) + '</span><span><span class="srow-lb">' + esc(x.label) + '</span><div class="srow-ds">' + sub + '</div></span><span class="sm-star' + (isFav(x) ? '' : ' off') + '" data-fav="' + x.provider + '|' + esc(x.symbol) + '">' + (isFav(x) ? ICON.star : ICON.starOff) + '</span></button>';
      });
    }
    $('smBody').innerHTML = html;
    bindSmBody();
  }
  function bindSmBody() {
    $('smBody').querySelectorAll('.sm-star').forEach(function (s) {
      s.addEventListener('click', function (e) {
        e.stopPropagation();
        var parts = s.dataset.fav.split('|');
        var q = lookupQuote(parts[0], parts[1]);
        if (!q) return;
        var now = toggleFav(q);
        s.innerHTML = now ? ICON.star : ICON.starOff;
        s.classList.toggle('off', !now);
        if (sm.market === 'wl') renderSmBody();
      });
    });
    $('smBody').querySelectorAll('.sm-row').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = lookupQuote(b.dataset.provider, b.dataset.symbol);
        if (!q) return;
        closeSearchModal();
        openSymbol(q);
      });
    });
  }
  function smLiveLookup(nq, sq) {
    if (sq !== smLiveSeq || normQ(sm.q) !== nq || !$('searchModal').classList.contains('open')) return;
    var isMofid = (sm.market === 'boorse' || sm.market === 'farabourse');
    var done = function (rows) {
      if (sq !== smLiveSeq || normQ(sm.q) !== nq || !$('searchModal').classList.contains('open')) return;
      if (!rows || !rows.length) {
        $('smBody').innerHTML = '<div class="na">' + esc(T('چیزی پیدا نشد.', 'Nothing found.')) + '</div>';
        return;
      }
      var mk = sm.market;
      var html = '';
      rows.forEach(function (x) {
        var sub = esc(x.display) + ' · ' + esc(marketLabel(mk));
        html += '<button class="sm-row" data-provider="' + x.provider + '" data-symbol="' + esc(x.symbol) + '"><span class="sym-ic">' + iconHtml(x) + '</span><span><span class="srow-lb">' + esc(x.label) + '</span><div class="srow-ds">' + sub + '</div></span><span class="sm-star' + (isFav(x) ? '' : ' off') + '" data-fav="' + x.provider + '|' + esc(x.symbol) + '">' + (isFav(x) ? ICON.star : ICON.starOff) + '</span></button>';
      });
      $('smBody').innerHTML = html;
      bindSmBody();
    };
    if (isMofid) {
      mofidResolve(nq).then(function (r) {
        if (!r) return done([]);
        done([rememberQuote({ label: nq, provider: 'mofid', symbol: nq, display: (r.title || nq) + ' (ریال)' })]);
      }).catch(function () { done([]); });
    } else {
      yahooSearch(nq).then(function (rs) {
        done(rs.map(function (r) {
          return rememberQuote({ label: r.symbol, provider: 'yahoo', symbol: r.symbol, display: (r.name || r.symbol) + (r.exchange ? ' · ' + r.exchange : '') });
        }));
      }).catch(function () { done([]); });
    }
  }

  /* ---- رندر: نماد ---- */
  function row(label, value) {
    return '<div class="row"><span>' + esc(label) + '</span><b>' + value + '</b></div>';
  }
  function openSymbol(q) {
    stopLive();
    stopDepthPoll();
    rememberQuote(q);
    state.quote = q;
    state.tab = 'chart';
    state.candles = null; state.quoteRes = null;
    state.priceUsd = null; state.priceIran = null; state.priceMode = 'usd'; state.candlesDone = false;
    state.mofidAsOf = null; state.liveMode = null;
    // تایم‌فریم فعلی اگر برای این provider نیست (مثلاً 1s برای سهام) → 1h.
    var tfs = TFS[q.provider] || [];
    if (tfs.indexOf(state.tf) === -1) state.tf = '1h';
    try { window.__ov.st = 7; window.__ov.pan = 0; window.__ov.pm = null; } catch (e) {}
    window.pair.sym = q.symbol; window.pair.base = q.label; window.pair.kind = (q.provider === 'binance') ? 'crypto' : 'other';
    window.tf = state.tf;
    show('symbol');
    $('symTitle').innerHTML = '<span class="sym-title-ic">' + iconHtml(q) + '</span>' + esc(q.display);
    $('symBarIc').innerHTML = iconHtml(q);
    $('symBarTx').textContent = '▼ ' + q.display;
    $('gaugeBox').innerHTML = '';
    $('priceBox').innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    $('tab-chart').innerHTML = '';
    $('tab-analysis').innerHTML = '';
    $('tab-fund').innerHTML = '';
    $('tab-news').innerHTML = '';
    $('tab-depth').innerHTML = '';
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
    ['chart', 'analysis', 'fund', 'news', 'depth'].forEach(function (t) {
      $('tabBtn-' + t).classList.toggle('on', t === tab);
      $('tab-' + t).style.display = t === tab ? '' : 'none';
    });
    if (tab !== 'depth') stopDepthPoll();
    if (tab === 'chart' && state.candles) { setTimeout(function () { try { window.draw(); window.head(); } catch (e) {} }, 30); }
    if (tab === 'analysis') renderAnalysis();
    if (tab === 'fund') renderFund();
    if (tab === 'news') renderNews();
    if (tab === 'depth') renderDepth();
  }
  function setTf(t) {
    var tfs = TFS[state.quote.provider] || [];
    if (tfs.indexOf(t) === -1) return;
    stopLive();
    var prevTf = state.tf;
    state.tf = t; window.tf = t;
    try { window.__ov.st = 7; window.__ov.pan = 0; window.__ov.pm = null; } catch (e) {}
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
    $('tab-depth').innerHTML = m;
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
        if (state.tf === '3m') candles = aggregateCandles(candles, 3); // Yahoo 3m ندارد — از ۳×۱m می‌سازیم
      }
    } else if (q.provider === 'mofid') {
      if (state.tf === '3m') {
        var m1 = await mofidCandles(q.symbol, '1m');
        candles = m1 ? aggregateCandles(m1, 3) : null; // مفید 3m ندارد — از ۳×۱m می‌سازیم
      } else {
        candles = await mofidCandles(q.symbol, state.tf);
      }
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
    // v1.2.1: بعد از draw() حتماً head() هم صدا زده شود — __geo تازه است و برچسب
    // قیمت آخر روی محور (positionLastPxTag) با همان head() جابه‌جا می‌شود.
    try { window.draw(); window.head(); } catch (e) { $('tab-chart').innerHTML = '<div class="na">' + esc(String(e && e.message || e)) + '</div>'; }
    renderGauge();
    refreshAxisBtns();
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

  /* ---- مقیاس قیمت دستی (v1.2.0 — پورت js/06 اپ، به سبک TradingView) ----
     pm = بازهٔ دستی قیمت در window.__ov.pm؛ draw() خود native-chart.js آن را می‌خواند.
     در حالت لگاریتمی، جابه‌جایی/مقیاس روی ln(قیمت) انجام می‌شود. */
  function pmPan(m, dy, G) {
    var k = dy / (G.ph - G.vh);
    if (G.log && m.lo > 0) { var a = Math.log(m.hi), b = Math.log(m.lo), d = k * (a - b); return { hi: Math.exp(a + d), lo: Math.exp(b + d) }; }
    var dp = k * (m.hi - m.lo);
    return { hi: m.hi + dp, lo: m.lo + dp };
  }
  function pmScale(m, f, G) {
    if (G.log && m.lo > 0) { var a = Math.log(m.hi), b = Math.log(m.lo), c = (a + b) / 2, h = (a - b) / 2 * f; return { hi: Math.exp(c + h), lo: Math.exp(c - h) }; }
    var c2 = (m.hi + m.lo) / 2, h2 = (m.hi - m.lo) / 2 * f;
    return { hi: c2 + h2, lo: c2 - h2 };
  }
  function autoScale() {
    try { window.__ov.pm = null; } catch (e) {}
    var b = $('tvAutoBtn'); if (b) b.style.display = 'none';
    try { window.draw(); window.head(); } catch (e) {}
  }
  function toLatest() {
    try { window.__ov.pan = 0; } catch (e) {}
    var b = $('tvLatestBtn'); if (b) b.style.display = 'none';
    try { window.draw(); window.head(); } catch (e) {}
  }
  function refreshAxisBtns() {
    var a = $('tvAutoBtn'), l = $('tvLatestBtn');
    if (a) a.style.display = (window.__ov && window.__ov.pm) ? '' : 'none';
    if (l) l.style.display = ((window.__ov && window.__ov.pan) || 0) >= 1 ? '' : 'none';
  }

  /* ---- گیج همگرایی شواهد (v1.2.0 — همان امتیازدهی js/01-13 اپ، بدون MTF) ----
     رای‌ها: EMA20 ±۲، EMA20/50 ±۲، EMA200 ±۱، MACD ±۱، RSI ±۱، ساختار ±۲، حجم ±۱، شکست ±۲؛
     امتیاز = ۵۰ + (bull−bear)/maxScore × ۴۵ (۰ تا ۱۰۰)؛ گرایش: ‎≥۷۰ صعودی، ‎≤۳۰ نزولی، وگرنه خنثی. */
  function oaPivotSeriesLocal(period) {
    period = period || 3;
    var csArr = state.candles, hs = [], ls = [];
    for (var i = period; i < csArr.length - period; i++) {
      var hi = true, lo = true;
      for (var j = 1; j <= period; j++) {
        if (csArr[i].h <= csArr[i - j].h || csArr[i].h <= csArr[i + j].h) hi = false;
        if (csArr[i].l >= csArr[i - j].l || csArr[i].l >= csArr[i + j].l) lo = false;
      }
      if (hi) hs.push({ i: i, p: csArr[i].h });
      if (lo) ls.push({ i: i, p: csArr[i].l });
    }
    return { hs: hs, ls: ls };
  }
  function confluence() {
    var csArr = state.candles;
    if (!csArr || csArr.length < 35) return null;
    var A = window.OnellaAnalysis;
    if (!A) return null;
    var a = A.analyze(csArr, A.marketOf(state.quote));
    if (!a) return null;
    var closes = csArr.map(function (c) { return c.c; });
    var p = closes[closes.length - 1], clPrev = closes[closes.length - 2];
    var piv = oaPivotSeriesLocal(3), hiP = piv.hs.slice(-4), loP = piv.ls.slice(-4);
    var htrend = hiP.length >= 2 ? (hiP[hiP.length - 1].p > hiP[hiP.length - 2].p ? 'HH' : hiP[hiP.length - 1].p < hiP[hiP.length - 2].p ? 'LH' : 'EQ') : null;
    var ltrend = loP.length >= 2 ? (loP[loP.length - 1].p > loP[loP.length - 2].p ? 'HL' : loP[loP.length - 1].p < loP[loP.length - 2].p ? 'LL' : 'EQ') : null;
    var structure = (htrend === 'HH' && ltrend === 'HL') ? 'bull' : (htrend === 'LH' && ltrend === 'LL') ? 'bear' : 'mixed';
    var cs2 = null;
    try { cs2 = window.analyzeCS ? window.analyzeCS() : null; } catch (e) {}
    var R1 = cs2 && cs2.R1 > 0 ? cs2.R1 : a.hi20, S1 = cs2 && cs2.S1 > 0 ? cs2.S1 : a.lo20;
    var breakout = p > R1 && clPrev <= R1 ? 'up' : p < S1 && clPrev >= S1 ? 'down' : p > R1 ? 'up' : p < S1 ? 'down' : 'none';
    var bull = 0, bear = 0, maxScore = 0, reasons = [];
    function vote(v, why, w) {
      if (v == null) return;
      maxScore += w;
      if (v > 0) { bull += v; reasons.push('+' + why); }
      else if (v < 0) { bear += -v; reasons.push('-' + why); }
    }
    vote(a.e20 != null ? (p > a.e20 ? 2 : -2) : null, 'EMA20', 2);
    vote(a.e20 != null && a.e50 != null ? (a.e20 > a.e50 ? 2 : -2) : null, 'EMA20/50', 2);
    vote(a.e200 != null ? (p > a.e200 ? 1 : -1) : null, 'EMA200', 1);
    vote(a.macd ? (a.macd.hist > 0 ? 1 : -1) : null, 'MACD', 1);
    vote(a.rsi != null ? (a.rsi > 55 && a.rsi < 75 ? 1 : a.rsi < 45 ? -1 : 0) : null, 'RSI', 1);
    vote(structure === 'bull' ? 2 : structure === 'bear' ? -2 : 0, 'Structure', 2);
    vote(a.volRatio != null && a.volRatio > 1.35 ? (p > clPrev ? 1 : -1) : 0, 'Volume', 1);
    vote(breakout === 'up' ? 2 : breakout === 'down' ? -2 : 0, 'Breakout', 2);
    var score = maxScore > 0 ? Math.max(0, Math.min(100, Math.round(50 + ((bull - bear) / maxScore) * 45))) : 50;
    var bias = score >= 70 ? 'up' : score <= 30 ? 'down' : 'neutral';
    return { score: score, bias: bias, reasons: reasons };
  }
  function renderGauge() {
    var box = $('gaugeBox');
    if (!box) return;
    var c = confluence();
    if (!c) { box.innerHTML = ''; return; }
    var biasTxt = c.bias === 'up' ? T('صعودی', 'Bullish') : c.bias === 'down' ? T('نزولی', 'Bearish') : T('خنثی', 'Neutral');
    var col = c.bias === 'up' ? '#2ecc8f' : c.bias === 'down' ? '#ff5d6c' : '#ffb347';
    var cx = 45, cy = 42, r = 34;
    var ang = Math.PI * (1 - c.score / 100);
    var nx = cx + r * Math.cos(ang), ny = cy - r * Math.sin(ang);
    var ex = cx + r * Math.cos(ang), ey = cy - r * Math.sin(ang);
    // نیم‌دایرهٔ بالا: از (11,42) تا انتهای کمان — largeArc همیشه ۰ (بازهٔ کمان
    // score×1.8 درجه است، حداکثر ۱۸۰ درجه) و sweep=1 (جهت زاویهٔ مثبت در
    // مختصات SVG با y رو به پایین = روی نیم‌دایرهٔ بالا).
    // اشتباه v1.2.0: برای score>50، largeArc=1 می‌شد → کمان ۲۳۴ درجه‌ای که از
    // viewBox بیرون می‌زد (بالاترین نقطه y=-19). اشتباه v1.2.1 (من): جهت sweep
    // را برعکس خواندم و ۰ گذاشتم → هر دو کمان رفتند پایینِ دایره، در حالی که
    // عقربه بالا را نشان می‌داد. با ریاضیِ کمان SVG ثابت شد: sweep=1 بالا است.
    var arc = 'M 11 42 A 34 34 0 0 1 ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
    var sym = state.quote ? state.quote.display : '';
    box.innerHTML = '<div class="gauge">'
      + '<svg width="90" height="48" viewBox="0 0 90 48"><path d="M 11 42 A 34 34 0 0 1 79 42" fill="none" stroke="#1c2740" stroke-width="6" stroke-linecap="round"/>'
      + (c.score > 0 ? '<path d="' + arc + '" fill="none" stroke="' + col + '" stroke-width="6" stroke-linecap="round"/>' : '')
      + '<line x1="' + cx + '" y1="' + cy + '" x2="' + nx.toFixed(1) + '" y2="' + ny.toFixed(1) + '" stroke="#e6e9ef" stroke-width="2" stroke-linecap="round"/>'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#e6e9ef"/></svg>'
      + '<div><div class="g-txt">' + esc(biasTxt) + ' · ' + esc(T('همگرایی شواهد', 'Evidence confluence')) + ' ' + c.score + '/100</div>'
      + '<div class="g-sub">' + esc(sym) + (c.reasons.length ? ' · ' + esc(c.reasons.join(' ')) : '') + '</div></div></div>';
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
    var toolOn = window.on || {};
    /* v1.2.2 — ۱۱ ابزار: ۵ قبلی + EMA، VWAP، دونچیان، کلتنر، سوپرترند، SAR.
       همه پشت دکمهٔ شناور (FAB) روی چارت باز می‌شوند، نه ردیف زیر چارت. */
    var TOOLS = [['fib', 'فیبوناچی', 'Fibonacci'], ['sr', 'حمایت/مقاومت', 'Support/Resistance'], ['tl', 'خط روند', 'Trendline'], ['bb', 'بولینگر', 'Bollinger'], ['pv', 'پیوت', 'Pivot'], ['ema', 'میانگین نمایی', 'EMA'], ['vwap', 'وی‌واپ', 'VWAP'], ['donch', 'دونچیان', 'Donchian'], ['kelt', 'کلتنر', 'Keltner'], ['super', 'سوپرترند', 'Supertrend'], ['sar', 'پارابولیک', 'SAR']];
    $('tab-chart').innerHTML =
      '<div id="tfRow" class="seg">' + tfs.map(function (k) {
          return '<button data-tf="' + k + '"' + (state.tf === k ? ' class="on"' : '') + '>' + k + '</button>';
        }).join('') + '</div>'
      + '<div class="chartwrap" id="chartWrap"><div id="nv" style="position:relative;height:260px"><div id="px" class="px px-ov"></div><div id="lastPxTag" style="display:none"></div><canvas id="cc" dir="ltr" style="width:100%;height:260px;display:block"></canvas><button class="axis-btn" id="tvAutoBtn" type="button" style="display:none">A</button><button class="axis-btn" id="tvLatestBtn" type="button" style="display:none">⏭</button><button class="tools-fab" id="toolsFab" type="button" title="' + esc(T('ابزارهای چارت', 'Chart tools')) + '">' + ICON.tools + '</button>'
      + '<div class="tools-panel" id="toolsPanel"><div class="tools-panel-h"><span>' + esc(T('ابزارهای چارت', 'Chart tools')) + '</span><button class="tbtn" id="toolsClose" type="button">✕</button></div><div class="chart-tools" id="chartTools">' + TOOLS.map(function (t) {
          return '<button class="tbtn' + (toolOn[t[0]] ? ' on' : '') + '" data-tool="' + t[0] + '" type="button">' + esc(lang === 'fa' ? t[1] : t[2]) + '</button>';
        }).join('') + '</div><div class="tool-note" id="toolNote"></div></div></div></div>'
      + '<div class="toolbar" id="chartToolbar">'
      + '<button class="tbtn" id="typeBtn" type="button">' + esc(chartTypeLabel(cur)) + '</button>'
      + '<button class="tbtn' + (maOn ? ' on' : '') + '" id="maBtn" type="button">MA20</button>'
      + '<button class="tbtn' + (volOn ? ' on' : '') + '" id="volBtn" type="button">' + esc(T('حجم', 'Vol')) + '</button>'
      + '<button class="tbtn" id="zoomOutBtn" type="button">−</button>'
      + '<button class="tbtn" id="zoomInBtn" type="button">+</button>'
      + '<button class="tbtn" id="fsBtn" type="button">⛶</button>'
      + '</div>'
      + '</div>';
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
    $('tvAutoBtn').addEventListener('click', function () { autoScale(); });
    $('tvLatestBtn').addEventListener('click', function () { toLatest(); });
    // ابزارهای دستی روی چارت — پشت دکمهٔ شناور (FAB) با همان SVG اپ اصلی؛
    // پنل ۱۱ ابزار + خوانش ابزار. همان drawTools اپ؛ خوانش ابزار داخل پنل است.
    document.querySelectorAll('#chartTools .tbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.tool;
        var o = window.on || {};
        o[id] = !o[id];
        b.classList.toggle('on', !!o[id]);
        var note = $('toolNote');
        try {
          if (o[id]) { if (note) note.textContent = (typeof toolNote === 'function') ? toolNote(id) : ''; }
          else if (note) {
            var other = TOOLS.map(function (t) { return t[0]; }).find(function (x) { return o[x]; });
            note.textContent = other && typeof toolNote === 'function' ? toolNote(other) : '';
          }
        } catch (e) {}
        try { window.draw(); } catch (e) {}
      });
    });
    // دکمهٔ شناور ابزارها (FAB): باز/بسته کردن پنل ابزار روی چارت.
    (function () {
      var fab = $('toolsFab'), panel = $('toolsPanel');
      if (!fab || !panel) return;
      fab.addEventListener('click', function () { panel.classList.toggle('open'); });
      var tc = $('toolsClose');
      if (tc) tc.addEventListener('click', function () { panel.classList.remove('open'); });
    })();
    document.addEventListener('fullscreenchange', function () {
      var on = !!document.fullscreenElement;
      var btn = $('fsBtn');
      if (btn) btn.textContent = on ? '✕' : '⛶';
      if (!on) cssFs(false);
      setTimeout(function () { try { window.draw(); window.head(); } catch (e) {} }, 120);
    });
    // ژست‌های TradingView (پورت js/06 اپ): اسکرول روی محور قیمت = زوم عمودی؛
    // کشیدن روی محور قیمت = کش‌آمدن مقیاس؛ کشیدن عمودی روی چارت = جابه‌جایی قیمت؛
    // دوبار لمس محور قیمت = مقیاس خودکار؛ اسکرول روی چارت = زوم افقی حول نشانگر.
    var cvs = $('cc');
    var pointers = new Map(), pinchD = 0, pinchSt = 0, dragX = null, dragY = null, dragPan = 0;
    var pm0 = null, gMode = null, gVert = false, gMoved = false, gx0 = 0, gy0 = 0, gs0 = 7, gPan0 = 0, gLastTap = { t: 0, x: 0, y: 0 };
    function ptrPos(e) { var r = cvs.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; }
    function axisW() { var G = window.__geo || {}; return Math.max(56, G.pw || 46); }
    function zoneOf(p) { if (p.y > p.h - 22) return 't'; if (p.x > p.w - axisW()) return 'p'; return 'c'; }
    cvs.addEventListener('pointerdown', function (e) {
      try { cvs.setPointerCapture(e.pointerId); } catch (err) {}
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var p = ptrPos(e);
      if (pointers.size === 2) {
        gMode = 'pinch'; gMoved = true;
        var pts = Array.from(pointers.values());
        pinchD = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchSt = (window.__ov && window.__ov.st) || 7;
        return;
      }
      gx0 = p.x; gy0 = p.y; gs0 = (window.__ov && window.__ov.st) || 7; gPan0 = (window.__ov && window.__ov.pan) || 0;
      dragX = e.clientX; dragY = e.clientY; dragPan = gPan0; gMoved = false; gVert = false;
      var G = window.__geo || {};
      pm0 = (window.__ov && window.__ov.pm) ? { hi: window.__ov.pm.hi, lo: window.__ov.pm.lo } : (G.hi != null ? { hi: G.hi, lo: G.lo } : null);
      gMode = zoneOf(p) === 'p' ? 'pscale' : 'pan';
    });
    cvs.addEventListener('pointermove', function (e) {
      var p = ptrPos(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && gMode === 'pinch') {
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
      if (pointers.size === 1 && gMode) {
        var dx = e.clientX - dragX, dy = e.clientY - dragY;
        if (!gMoved && Math.hypot(p.x - gx0, p.y - gy0) > 8) gMoved = true;
        if (gMode === 'pscale' && pm0) {
          try {
            window.__ov = window.__ov || {};
            window.__ov.pm = pmScale(pm0, Math.exp(dy / 170), window.__geo || {});
            window.draw(); window.head(); refreshAxisBtns();
          } catch (err) {}
          return;
        }
        if (gMode === 'pan') {
          if (!gVert && gMoved && Math.abs(dy) > 14 && Math.abs(dy) > 1.6 * Math.abs(dx)) gVert = true;
          try {
            window.__ov = window.__ov || {};
            if (gVert && pm0 && (window.__geo || {}).ph) {
              window.__ov.pm = pmPan(pm0, dy, window.__geo);
            } else {
              var st = ((window.__ov || {}).st || 7);
              var maxPan = Math.max(0, (window.cs ? window.cs.length : 0) - Math.floor(p.w / st));
              window.__ov.pan = Math.max(0, Math.min(maxPan, dragPan + dx / st));
            }
            window.draw(); window.head(); refreshAxisBtns();
          } catch (err) {}
          return;
        }
      }
      // کراس‌هِر: همان pointermove اپ (native-chart.js).
      if (pointers.size === 0) {
        var st2 = ((window.__ov || {}).st || 7);
        var n = Math.min(cs.length, Math.floor((p.w - 46) / st2));
        var i = Math.floor(p.x / st2);
        window.cur = (i >= 0 && i < n) ? i : -1;
        try { window.head(); window.draw(); } catch (err) {}
      }
    });
    function ptrEnd(e) {
      var wasMode = gMode;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchD = 0;
      if (pointers.size === 0) {
        dragX = null; dragY = null;
        if (!gMoved && wasMode) {
          var now = Date.now(), p = ptrPos(e), z = zoneOf(p);
          if (now - gLastTap.t < 330 && Math.hypot(p.x - gLastTap.x, p.y - gLastTap.y) < 30) {
            gLastTap.t = 0;
            if (z === 'p') autoScale();
            else if (z === 't') { try { window.__ov.st = 7; window.__ov.pan = 0; window.draw(); window.head(); } catch (err) {} }
            else { autoScale(); toLatest(); }
          } else gLastTap = { t: now, x: p.x, y: p.y };
        }
        gMode = null;
      }
    }
    cvs.addEventListener('pointerup', ptrEnd);
    cvs.addEventListener('pointercancel', ptrEnd);
    cvs.addEventListener('pointerleave', function () { if (pointers.size === 0) { window.cur = -1; try { window.head(); window.draw(); } catch (err) {} } });
    cvs.addEventListener('wheel', function (e) {
      try { e.preventDefault(); } catch (err) {}
      var G = window.__geo || {}, r = cvs.getBoundingClientRect(), x = e.clientX - r.left;
      if (x > r.width - axisW() && G.hi != null) {
        // اسکرول روی محور قیمت = زوم عمودی مقیاس قیمت (مثل TradingView)
        try {
          window.__ov = window.__ov || {};
          window.__ov.pm = pmScale(window.__ov.pm || { hi: G.hi, lo: G.lo }, e.deltaY < 0 ? 0.9 : 1.1, G);
          window.draw(); window.head(); refreshAxisBtns();
        } catch (err) {}
        return;
      }
      // اسکرول روی چارت = زوم افقی حول نشانگر (کندل زیر ماوس ثابت می‌ماند)
      try {
        var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        var f = Math.exp(-Math.max(-120, Math.min(120, dy)) * 0.0016);
        var st0 = (window.__ov && window.__ov.st) || G.st || 7;
        var st2 = Math.min(40, Math.max(2, st0 * f));
        var len = (typeof cs !== 'undefined' && cs) ? cs.length : 0;
        if (len && G.st && G.off != null) {
          var ip = G.off + (x - G.st / 2) / G.st;
          var cwid = (G.W || cvs.clientWidth) - (G.pw || 46);
          var n2 = Math.floor(cwid / st2);
          window.__ov = window.__ov || {};
          window.__ov.st = st2;
          var maxPan = Math.max(0, len - Math.floor(cwid / st2));
          window.__ov.pan = Math.max(0, Math.min(maxPan, len - n2 - (ip - (x - st2 / 2) / st2)));
        } else { window.__ov = window.__ov || {}; window.__ov.st = st2; }
        window.draw(); window.head(); refreshAxisBtns();
      } catch (err) {}
    }, { passive: false });
    cvs.addEventListener('dblclick', function (e) {
      var p = ptrPos(e), z = zoneOf(p);
      if (z === 'p') autoScale();
      else { autoScale(); toLatest(); }
    });
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
  /* v1.2.1 — برچسب قیمت آخر روی محور قیمت (سبک TradingView): دقیقاً همان کندلی را
     نشان می‌دهد که head() نشان می‌دهد (کراس‌هیر فعال → کندل زیر کراس‌هیر، وگرنه
     آخرین کندل — مثل head()، بدون pan)؛ رنگش جهت همان کندل است. هر بار head()
     صدا زده شود، برچسب هم جابه‌جا می‌شود (wrap یک‌باره در init). */
  function positionLastPxTag() {
    var tag = document.getElementById('lastPxTag');
    if (!tag) return;
    var cs = window.cs;
    var G = window.__geo;
    if (!cs || !cs.length || !G || typeof G.Y !== 'function') { tag.style.display = 'none'; return; }
    var W = G.W || 360, stH = (window.__ov && window.__ov.st) || 7;
    var n = Math.min(cs.length, Math.floor((W - 46) / stH));
    var cur = window.cur;
    var i = (typeof cur === 'number' && cur >= 0 && cur < n) ? cs.length - n + cur : cs.length - 1;
    var c = cs[i];
    if (!c || typeof c.c !== 'number') { tag.style.display = 'none'; return; }
    var y = G.Y(c.c);
    if (!Number.isFinite(y)) { tag.style.display = 'none'; return; }
    tag.style.top = Math.max(9, Math.min((G.ph || 240) - 9, y)) + 'px';
    tag.textContent = fmt(c.c);
    tag.className = (c.c >= c.o) ? '' : 'dn';
    tag.style.display = '';
  }
  function wrapHeadOnce() {
    if (window.__pxTagWrapped || typeof window.head !== 'function') return;
    window.__pxTagWrapped = true;
    var _head = window.head;
    window.head = function () {
      var r = _head.apply(this, arguments);
      try { positionLastPxTag(); } catch (e) {}
      return r;
    };
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
    var trendCls = a.trend === 'up' ? 'up' : a.trend === 'down' ? 'dn' : '';
    var rsiWord = a.rsi == null ? '—' : a.rsi >= 70 ? T('اشباع خرید', 'Overbought') : a.rsi <= 30 ? T('اشباع فروش', 'Oversold') : a.rsi >= 50 ? T('قدرت نسبی بالا', 'Above 50') : T('قدرت نسبی پایین', 'Below 50');
    var macdTxt = a.macd ? (a.macd.hist >= 0 ? T('مثبت', 'Positive') : T('منفی', 'Negative')) + ' (' + fmt(a.macd.hist) + ')' : '—';
    var vols = state.candles.map(function (c) { return c.v || 0; });
    var lastVol = vols.length ? vols[vols.length - 1] : 0;
    var avgVol = 0;
    if (vols.length >= 20) { var vs = 0; for (var vi = vols.length - 20; vi < vols.length; vi++) vs += vols[vi]; avgVol = vs / 20; }
    var cs2 = null;
    try { cs2 = window.analyzeCS ? window.analyzeCS() : null; } catch (e) {}
    /* v1.2.2 — تحلیل قوی: ۷ کارت + خلاصه. شاخص‌های تازه (ADX، استوکاستیک،
       کراس EMA9/21، OBV، روند حجم، خوانش کندل، ساختار، رژیم نوسان/فشردگی،
       آرای موافق/مخالف) همه از همان کندل‌ها حساب می‌شوند — عدد ساختگی نیست.
       توصیفی است: نه سیگنال، نه پیش‌بینی، نه توصیهٔ معامله. */
    var adxW = a.adx == null ? null : a.adx.adx >= 25 ? T('قوی', 'strong') : a.adx.adx >= 20 ? T('متوسط', 'moderate') : T('ضعیف', 'weak');
    var stW = a.stoch == null ? null : a.stoch.k >= 80 ? T('اشباع خرید', 'overbought') : a.stoch.k <= 20 ? T('اشباع فروش', 'oversold') : a.stoch.k >= 50 ? T('بالای ۵۰', 'above 50') : T('زیر ۵۰', 'below 50');
    var structW = a.structure === 'bull' ? T('سقف‌ها و کف‌های بالاتر', 'higher highs & lows') : a.structure === 'bear' ? T('سقف‌ها و کف‌های پایین‌تر', 'lower highs & lows') : a.structure === 'mixed' ? T('مختلط', 'mixed') : null;
    var crossTxt = a.emaCross == null ? T('کراس تازه‌ای نیست', 'no recent cross') : (a.emaCross.type === 'golden' ? T('کراس طلایی', 'golden cross') : T('کراس مرگ', 'death cross')) + ' · ' + a.emaCross.barsAgo + ' ' + T('کندل پیش', 'candles ago');
    var shapeW = a.candle == null ? null : a.candle.shape === 'doji' ? T('دوجی', 'doji') : a.candle.shape === 'hammer' ? T('چکش', 'hammer') : a.candle.shape === 'shooting' ? T('شهاب', 'shooting star') : a.candle.shape === 'marubozu' ? T('ماروبوزو', 'marubozu') : a.candle.shape === 'flat' ? T('بدون بدنه', 'flat') : T('معمولی', 'normal');
    var volTW = a.volTrend === 'up' ? T('در حال افزایش', 'rising') : a.volTrend === 'down' ? T('در حال کاهش', 'falling') : a.volTrend === 'flat' ? T('ثابت', 'flat') : null;
    var obvW = a.obvDir === 'up' ? T('رو به بالا', 'rising') : a.obvDir === 'down' ? T('رو به پایین', 'falling') : a.obvDir === 'flat' ? T('ثابت', 'flat') : null;
    var atrRW = a.atrRegime == null ? null : a.atrRegime.level === 'high' ? T('بالاتر از معمول', 'above usual') : a.atrRegime.level === 'low' ? T('پایین‌تر از معمول', 'below usual') : T('معمولی', 'usual');
    var sqW = a.bbSqueeze === 'squeeze' ? T('فشرده', 'squeezed') : a.bbSqueeze === 'wide' ? T('باز', 'wide') : a.bbSqueeze === 'normal' ? T('معمولی', 'normal') : null;
    var vTot = a.votes.bull + a.votes.bear;
    var vDir = a.votes.bull > a.votes.bear ? T('صعود', 'up') : a.votes.bear > a.votes.bull ? T('نزول', 'down') : T('توافق نیست', 'no agreement');
    var vLead = a.votes.bull > a.votes.bear ? a.votes.bull : a.votes.bear;
    var sumTxt = esc(T('روند', 'Trend')) + ' ' + esc(trendTxt)
      + (adxW ? ' · ' + esc(T('قدرت روند', 'trend strength')) + ' ' + esc(adxW) + (a.adx ? ' (ADX ' + a.adx.adx.toFixed(0) + ')' : '') : '')
      + '<br>' + esc(T('همگرایی شاخص‌ها', 'Indicator agreement')) + ': ' + (vTot ? vLead + ' ' + esc(T('از', 'of')) + ' ' + vTot + ' ' + esc(T('موافق', 'agree on')) + ' ' + esc(vDir) : '—')
      + (structW ? '<br>' + esc(T('ساختار', 'Structure')) + ': ' + esc(structW) : '')
      + '<br>' + esc(T('نزدیک‌ترین سطح', 'Nearest level')) + ': ' + esc(T('مقاومت', 'Resistance')) + ' ' + fmt(cs2 ? cs2.R1 : a.hi20) + ' · ' + esc(T('حمایت', 'Support')) + ' ' + fmt(cs2 ? cs2.S1 : a.lo20);
    var html = '<div class="an-grid">'
      + '<div class="an-card wide an-sum"><h4>' + ICON.book + esc(T('خلاصهٔ تحلیل', 'Analysis summary')) + '</h4>'
      + '<div class="an-big ' + trendCls + '">' + esc(trendTxt) + '</div>'
      + '<div class="an-sub">' + sumTxt + '</div></div>'
      + '<div class="an-card an-trend"><h4>' + ICON.trendUp + esc(T('روند', 'Trend')) + '</h4>'
      + '<div class="an-big ' + trendCls + '">' + esc(trendTxt) + '</div>'
      + '<div class="an-sub">EMA20 ' + fmt(a.e20) + ' · EMA50 ' + fmt(a.e50)
      + (a.e200 != null ? '<br>EMA200 ' + fmt(a.e200) + ' (' + (a.longTrend === 'up' ? T('صعودی', 'up') : a.longTrend === 'down' ? T('نزولی', 'down') : T('خنثی', 'neutral')) + ')' : '')
      + (a.e9 != null && a.e21 != null ? '<br>EMA9 ' + fmt(a.e9) + ' · EMA21 ' + fmt(a.e21) + ' — ' + esc(crossTxt) : '')
      + (adxW ? '<br>ADX ' + a.adx.adx.toFixed(1) + ' (' + esc(adxW) + ') · DI+ ' + a.adx.diPlus.toFixed(0) + ' / DI− ' + a.adx.diMinus.toFixed(0) : '')
      + (structW ? '<br>' + esc(structW) : '')
      + '<br>' + esc(T('تغییر', 'Change')) + ' ' + fmtPct(chgS) + ' · ' + fmtPct(chgL) + '</div></div>'
      + '<div class="an-card an-mom"><h4>' + ICON.activity + 'RSI / MACD / Stoch</h4>'
      + '<div class="an-big">' + (a.rsi == null ? '—' : a.rsi.toFixed(1)) + ' <small style="font-size:12px;color:var(--mut)">' + esc(rsiWord) + '</small></div>'
      + '<div class="an-sub">MACD ' + esc(macdTxt)
      + (a.macd ? (a.macdAboveZero ? ' · ' + esc(T('بالای صفر', 'above zero')) : ' · ' + esc(T('زیر صفر', 'below zero'))) + (a.macdHistRising != null ? ' · ' + esc(T('هیستوگرام', 'histogram')) + ' ' + (a.macdHistRising ? esc(T('در حال رشد', 'growing')) : esc(T('در حال کوچک شدن', 'shrinking'))) : '') + '<br>' + esc(T('خط', 'Line')) + ' ' + fmt(a.macd.line, 4) + ' · ' + esc(T('سیگنال', 'Signal')) + ' ' + fmt(a.macd.signal, 4) : '')
      + (a.stoch ? '<br>Stoch %K ' + a.stoch.k.toFixed(1) + ' · %D ' + (a.stoch.d == null ? '—' : a.stoch.d.toFixed(1)) + ' (' + esc(stW) + ')' : '')
      + '</div></div>'
      + (ind.atr ? '<div class="an-card an-vola"><h4>' + ICON.waves + esc(T('نوسان', 'Volatility')) + '</h4>'
      + '<div class="an-big">' + (a.atrPct == null ? '—' : a.atrPct.toFixed(2) + '%') + ' <small style="font-size:12px;color:var(--mut)">ATR</small></div>'
      + '<div class="an-sub">' + (atrRW ? esc(T('رژیم نوسان', 'Volatility regime')) + ': ' + esc(atrRW) + (a.atrRegime.rising != null ? ' (' + (a.atrRegime.rising ? esc(T('در حال افزایش', 'rising')) : esc(T('در حال کاهش', 'falling'))) + ')' : '') + '<br>' : '')
      + (a.bb ? esc(T('بولینگر', 'Bollinger')) + ' ' + fmt(a.bb.upper) + ' / ' + fmt(a.bb.mid) + ' / ' + fmt(a.bb.lower) + ' (' + Math.round(a.bb.pos) + '٪)' + (sqW ? ' — ' + esc(T('باند', 'band')) + ' ' + esc(sqW) : '') + '<br>' + esc(T('پهنا', 'Width')) + ' ' + (a.bb.widthPct == null ? '—' : a.bb.widthPct.toFixed(2) + '%') + '<br>' : '')
      + esc(T('دامنهٔ ۲۰ کندل', '20-candle range')) + ' ' + (a.rangePct == null ? '—' : a.rangePct.toFixed(2) + '%') + '</div></div>' : '')
      + (ind.volume ? '<div class="an-card an-vol"><h4>' + ICON.volume + esc(T('حجم', 'Volume')) + '</h4>'
      + '<div class="an-big">' + (a.volRatio == null ? '—' : a.volRatio.toFixed(2) + '×') + '</div>'
      + '<div class="an-sub">' + esc(T('حجم آخر', 'Last volume')) + ' ' + fmt(lastVol) + ' · ' + esc(T('میانگین ۲۰', '20 avg')) + ' ' + fmt(avgVol)
      + (volTW ? '<br>' + esc(T('روند حجم', 'Volume trend')) + ': ' + esc(volTW) : '')
      + (obvW ? '<br>OBV: ' + esc(obvW) : '')
      + '</div></div>' : '')
      + '<div class="an-card an-cndl"><h4>' + ICON.chart + esc(T('کندل آخر', 'Last candle')) + '</h4>'
      + '<div class="an-big">' + (shapeW || '—') + '</div>'
      + '<div class="an-sub">' + (a.candle ? esc(T('بدنه', 'Body')) + ' ' + a.candle.bodyPct.toFixed(0) + '% · ' + esc(T('فیتیلهٔ بالا', 'upper wick')) + ' ' + a.candle.upperWickPct.toFixed(0) + '% · ' + esc(T('فیتیلهٔ پایین', 'lower wick')) + ' ' + a.candle.lowerWickPct.toFixed(0) + '%' + '<br>' + esc(T('جهت کندل', 'Candle direction')) + ': ' + (a.candle.dir === 'up' ? esc(T('صعودی', 'up')) : a.candle.dir === 'down' ? esc(T('نزولی', 'down')) : esc(T('خنثی', 'flat'))) : '—') + '</div></div>'
      + '<div class="an-card wide an-lvl"><h4>' + ICON.levels + esc(T('سطوح', 'Levels')) + '</h4>'
      + row(T('مقاومت ۱', 'Resistance 1'), fmt(cs2 ? cs2.R1 : a.hi20))
      + row(T('مقاومت ۲', 'Resistance 2'), fmt(cs2 ? cs2.R2 : a.hi20))
      + row(T('حمایت ۱', 'Support 1'), fmt(cs2 ? cs2.S1 : a.lo20))
      + row(T('حمایت ۲', 'Support 2'), fmt(cs2 ? cs2.S2 : a.lo20))
      + row(T('جای قیمت در بازهٔ ۲۰ کندل', 'Position in 20-range'), (a.pos == null ? '—' : Math.round(a.pos) + '%'))
      + (ind.w52 && state.quoteRes && state.quoteRes.week52High ? row('52W', fmt(state.quoteRes.week52Low) + ' – ' + fmt(state.quoteRes.week52High)) : '')
      + '</div></div><div class="warn">' + esc(T('فقط تحلیل است — نه سیگنال، نه پیش‌بینی، نه توصیهٔ معامله.', 'Analysis only — not a signal, not a prediction, not trading advice.')) + '</div>';
    el.innerHTML = html;
  }

  /* ---- بنیادی ---- */
  /* v1.2.1 — کارت بنیادی: یک کارت برای هر متریک (به‌جای ردیف ساده). */
  function fundCard(lb, v, wide) {
    return '<div class="fund-card' + (wide ? ' wide' : '') + '"><div class="fc-lb">' + lb + '</div><div class="fc-v">' + v + '</div></div>';
  }
  function pctSpan(v) {
    if (typeof v !== 'number') return '—';
    return '<span class="' + (v >= 0 ? 'up' : 'dn') + '">' + fmtPct(v) + '</span>';
  }
  function renderFund() {
    var el = $('tab-fund');
    var q = state.quote;
    if (!q) return;
    el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    if (q.provider === 'binance') {
      coingeckoFund(q.symbol).then(function (f) {
        if (!f) { el.innerHTML = '<div class="na">' + esc(T('برای این نماد بنیادی نیست.', 'No fundamentals for this symbol.')) + '</div>'; return; }
        el.innerHTML = '<div class="fund-grid">'
          + (f.rank ? fundCard('#', String(f.rank)) : '')
          + fundCard(esc(T('ارزش بازار', 'Market cap')), f.marketCap ? '$' + fmt(f.marketCap) : '—')
          + fundCard('FDV', f.fdv ? '$' + fmt(f.fdv) : '—')
          + fundCard(esc(T('حجم ۲۴ ساعت', 'Volume 24h')), f.volume24 ? '$' + fmt(f.volume24) : '—')
          + fundCard(esc(T('تغییر ۲۴ ساعت', 'Change 24h')), pctSpan(f.chg24))
          + fundCard(esc(T('تغییر ۷ روز', 'Change 7d')), pctSpan(f.chg7d))
          + fundCard(esc(T('تغییر ۳۰ روز', 'Change 30d')), pctSpan(f.chg30d))
          + fundCard(esc(T('در گردش', 'Circulating')), f.circulating ? fmt(f.circulating) : '—')
          + fundCard(esc(T('سقف تاریخی', 'ATH')), f.ath ? '$' + fmt(f.ath) + (f.athChange != null ? ' <small>(' + fmtPct(f.athChange) + ')</small>' : '') : '—')
          + fundCard(esc(T('کف تاریخی', 'ATL')), f.atl ? '$' + fmt(f.atl) : '—')
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
      el.innerHTML = '<div class="fund-grid">'
        + (r.name ? fundCard(esc(T('نام', 'Name')), esc(r.name), true) : '')
        + fundCard(esc(T('ارزش بازار', 'Market cap')), r.marketCap ? '$' + fmt(r.marketCap) : '—')
        + fundCard('P/E', r.pe != null ? fmt(r.pe) : '—')
        + fundCard('P/E (forward)', r.peForward != null ? fmt(r.peForward) : '—')
        + fundCard('P/B', r.pb != null ? fmt(r.pb) : '—')
        + fundCard('EPS', r.trailingEps != null ? fmt(r.trailingEps) : '—')
        + fundCard('Beta', r.beta != null ? fmt(r.beta) : '—')
        + fundCard(esc(T('سود تقسیمی', 'Dividend')), dy)
        + fundCard(esc(T('سهام در گردش', 'Shares outstanding')), r.sharesOutstanding ? fmt(r.sharesOutstanding) : '—')
        + fundCard(esc(T('میانگین ۵۰ روزه', '50-day avg')), r.avg50 != null ? fmt(r.avg50) : '—')
        + fundCard(esc(T('میانگین ۲۰۰ روزه', '200-day avg')), r.avg200 != null ? fmt(r.avg200) : '—')
        + ((r.week52High != null) ? fundCard('52W', fmt(r.week52Low) + ' – ' + fmt(r.week52High), true) : '')
        + (r.exchange ? fundCard(esc(T('بورس', 'Exchange')), esc(r.exchange)) : '')
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
        html += '<div class="news-card"><div class="news-tag"><span class="news-chip">[' + esc(tag) + ']</span>' + impactBadge(lv) + '</div>'
          + '<div class="news-title">' + esc(it.title) + '</div>'
          + (it.time ? '<div class="news-time">' + new Date(it.time).toUTCString().slice(5, 22) + ' UTC</div>' : '')
          + '</div>';
      });
      html += '</div><div class="warn">' + esc(T('تاثیر از روی کلیدواژهٔ تیتر تخمین زده شده؛ قطعی نیست.', 'Impact is a keyword estimate, not certain.')) + '</div>';
      el.innerHTML = html;
    });
  }
  function impactBadge(lv) {
    if (lv === 'high') return '<span class="imp high"><span class="imp-dot high"></span>' + esc(lang === 'fa' ? 'تاثیر بالا' : 'High impact') + '</span>';
    if (lv === 'medium') return '<span class="imp med"><span class="imp-dot med"></span>' + esc(lang === 'fa' ? 'تاثیر متوسط' : 'Medium impact') + '</span>';
    return '<span class="imp low"><span class="imp-dot low"></span>' + esc(lang === 'fa' ? 'تاثیر کم' : 'Low impact') + '</span>';
  }
  // fetch خبر از پروکسی (RSS گوگل‌نیوز / CoinDesk) — بدون پروکسی مرورگر CORS را بلاک می‌کند
  // و fetchRss ربات [] برمی‌گرداند؛ پس در آن حالت مستقیم امتحان نمی‌کنیم.
  async function proxyFetch(url, opts) {
    var u = proxyUrl('rss', url);
    if (!u) throw new Error('no-proxy');
    return fetch(u, opts);
  }

  /* ---- دفتر سفارش «عمق» (v1.2.1) ----
     فقط برای کریپتو (Binance): depth مستقیم Binance، fallback ورکر، بعد OKX books.
     فقط وقتی تب عمق باز است پول می‌شود (۵ ثانیه)؛ با خروج از تب/نماد، پول قطع می‌شود. */
  var depthTimer = null, depthSym = null;
  function stopDepthPoll() {
    if (depthTimer) { clearInterval(depthTimer); depthTimer = null; }
    depthSym = null;
  }
  function parseDepth(j) {
    if (!j || !Array.isArray(j.bids) || !Array.isArray(j.asks)) return null;
    var norm = function (arr) {
      return arr.map(function (r) { return [+r[0], +r[1]]; }).filter(function (r) { return Number.isFinite(r[0]) && Number.isFinite(r[1]) && r[0] > 0 && r[1] > 0; });
    };
    var bids = norm(j.bids).sort(function (a, b) { return b[0] - a[0]; });
    var asks = norm(j.asks).sort(function (a, b) { return a[0] - b[0]; });
    if (!bids.length || !asks.length) return null;
    return { bids: bids, asks: asks };
  }
  async function fetchDepth(sym) {
    var u = 'https://data-api.binance.vision/api/v3/depth?symbol=' + encodeURIComponent(sym) + '&limit=20';
    var d = parseDepth(await fetchJSON(u, 8000));
    if (d) return d;
    d = parseDepth(await viaWorker('binance', u, 10000));
    if (d) return d;
    // OKX books (fallback): instId = BASE-USDT، هر سطر [قیمت، مقدار، ...].
    var inst = sym.replace(/USDT$/, '') + '-USDT';
    var oUrl = 'https://www.okx.com/api/v5/market/books?instId=' + inst + '&sz=20';
    var oj = await fetchJSON(oUrl, 10000);
    if (!oj) oj = await viaWorker('okx', oUrl, 12000);
    var book = oj && Array.isArray(oj.data) && oj.data[0];
    if (book) return parseDepth(book);
    return null;
  }
  function renderDepthData(el, d) {
    var bids = d.bids.slice(0, 10), asks = d.asks.slice(0, 10);
    var bestBid = bids[0][0], bestAsk = asks[0][0];
    var spread = bestAsk - bestBid, spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : null;
    var sumQ = function (arr) { return arr.reduce(function (a, r) { return a + r[1]; }, 0); };
    var bidQ = sumQ(bids), askQ = sumQ(asks);
    var bidPct = (bidQ + askQ) > 0 ? Math.round((bidQ / (bidQ + askQ)) * 100) : 50;
    var maxQ = 0;
    bids.concat(asks).forEach(function (r) { if (r[1] > maxQ) maxQ = r[1]; });
    var obRow = function (r, cum, cls) {
      var w = maxQ > 0 ? Math.max(2, Math.round((r[1] / maxQ) * 100)) : 0;
      return '<div class="ob-row ' + cls + '"><span class="ob-bar" style="width:' + w + '%"></span><span class="ob-p">' + fmt(r[0]) + '</span><span>' + fmt(r[1]) + '</span><span>' + fmt(cum) + '</span></div>';
    };
    var html = '<div class="ob-wrap">';
    html += '<div class="ob-head"><span>' + esc(T('بهترین خرید', 'Best bid')) + ' <b class="up">' + fmt(bestBid) + '</b></span>'
      + '<span>' + esc(T('بهترین فروش', 'Best ask')) + ' <b class="dn">' + fmt(bestAsk) + '</b></span>'
      + '<button type="button" id="obRefresh">↻</button></div>';
    html += '<div class="ob-imb"><span class="ib-bid" style="width:' + bidPct + '%"></span><span class="ib-ask" style="width:' + (100 - bidPct) + '%"></span></div>'
      + '<div class="ob-sub">' + esc(T('خرید', 'Buy')) + ' ' + bidPct + '٪ · ' + esc(T('فروش', 'Sell')) + ' ' + (100 - bidPct) + '٪</div>';
    html += '<div class="ob-cols"><span>' + esc(T('قیمت', 'Price')) + '</span><span>' + esc(T('مقدار', 'Amount')) + '</span><span>' + esc(T('جمع', 'Total')) + '</span></div>';
    // فروش‌ها: کمترین قیمتِ فروش نزدیک اسپرد است — پس از بالا (دورتر) تا پایین (نزدیک) می‌چینیم.
    var cum = 0, askRows = [];
    asks.forEach(function (r) { cum += r[1]; askRows.push(obRow(r, cum, 'ob-ask')); });
    html += askRows.reverse().join('');
    html += '<div class="ob-spread">' + esc(T('اسپرد', 'Spread')) + ' ' + fmt(spread) + (spreadPct != null ? ' (' + spreadPct.toFixed(3) + '٪)' : '') + '</div>';
    cum = 0;
    bids.forEach(function (r) { cum += r[1]; html += obRow(r, cum, 'ob-bid'); });
    html += '</div><div class="warn">' + esc(T('دفتر سفارش لحظه‌ای است و هر ۵ ثانیه تازه می‌شود — نه سیگنال، نه توصیهٔ معامله.', 'Live order book, refreshed every 5s — not a signal, not trading advice.')) + '</div>';
    el.innerHTML = html;
    var rb = document.getElementById('obRefresh');
    if (rb) rb.addEventListener('click', function () { renderDepth(); });
  }
  function renderDepth() {
    var el = $('tab-depth');
    var q = state.quote;
    if (!q) return;
    stopDepthPoll();
    if (q.provider !== 'binance') {
      el.innerHTML = '<div class="na">' + esc(T('دفتر سفارش فقط برای نمادهای کریپتو (Binance) در دسترس است.', 'Order book is only available for crypto symbols (Binance).')) + '</div>';
      return;
    }
    el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    depthSym = q.symbol;
    fetchDepth(q.symbol).then(function (d) {
      if (depthSym !== q.symbol || state.tab !== 'depth') return;
      if (!d) { el.innerHTML = '<div class="na">' + esc(T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>'; return; }
      renderDepthData(el, d);
      depthTimer = setInterval(function () {
        if (state.tab !== 'depth' || state.view !== 'symbol' || depthSym !== q.symbol) { stopDepthPoll(); return; }
        fetchDepth(q.symbol).then(function (d2) { if (d2 && depthSym === q.symbol && state.tab === 'depth') renderDepthData(el, d2); });
      }, 5000);
    });
  }

  /* ---- داشبورد (v1.2.0) ----
     حرارت بازار = سهم نمادهای مثبت + میانگین تغییر روزانهٔ هر بازار (از دادهٔ واقعی همان روز).
     ۵ صعودی/۵ نزولی = بزرگ‌ترین تغییرهای روزانهٔ ۲۴ ساعته در کل کاتولوگ (کریپتو از CoinGecko،
     سهام/ETF/فارکس/کالا/شاخص از Yahoo چندنمادی، بورس/فرابورس از مفید چندنمادی).
     نرخ‌های ایران تغییر روزانه ندارند (live.json فقط قیمت لحظه‌ای دارد) — در داشبورد نمی‌آیند.
     درصد تاثیر خبر = نگاشت سطح کلیدواژه‌ای ربات (بالا ۸۵٪ / متوسط ۶۰٪ / کم ۳۵٪) + ۱۰٪ اگر
     نماد در تیتر باشد (سقف ۹۵٪) — تخمین است، نه اندازه‌گیری واقعی. */
  var dashCache = { at: 0, data: null };
  var dashSeq = 0;
  var CG_MARKET_IDS = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'dogecoin', 'cardano', 'tron', 'avalanche-2', 'chainlink', 'polkadot', 'litecoin', 'bitcoin-cash', 'near', 'toncoin'];
  async function cgMarkets() {
    var u = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + CG_MARKET_IDS.join(',') + '&price_change_percentage=24h';
    var j = await fetchJSON(u, 10000);
    if (!Array.isArray(j) || !j.length) j = await viaWorker('coingecko', u, 12000);
    if (!Array.isArray(j)) return [];
    return j.filter(function (c) { return c && typeof c.current_price === 'number' && c.current_price > 0; }).map(function (c) {
      return { id: c.id, price: c.current_price, changePct: (typeof c.price_change_percentage_24h === 'number' ? c.price_change_percentage_24h : null), volume: c.total_volume || null, marketCap: c.market_cap || null };
    });
  }
  async function yahooMulti(symbols) {
    if (!PROXY_URL || !symbols.length) return [];
    var j = await fetchJSON(PROXY_URL.replace(/\/$/, '') + '/yahoo-multi?symbols=' + encodeURIComponent(symbols.join(',')), 15000);
    return (j && Array.isArray(j.quotes)) ? j.quotes : [];
  }
  async function mofidBulk(symbols) {
    if (!PROXY_URL || !symbols.length) return [];
    var j = await fetchJSON(PROXY_URL.replace(/\/$/, '') + '/mofid?kind=bulk&symbols=' + encodeURIComponent(symbols.join(',')), 20000);
    return (j && Array.isArray(j.quotes)) ? j.quotes : [];
  }
  /* v1.2.3 — داشبورد تدریجی: هر پایه که رسید همان لحظه روی داشبورد می‌نشیند
     (کریپتو/طلا اول، سهام/بورس وقتی رسیدند) و خبر هم موازی گرفته می‌شود،
     نه بعد از پایه‌ها. قبلاً همه‌چیز پشت کندترین پایه (Yahoo/مفید، گاهی
     ۴۲۹ یا تایم‌اوت) می‌ماند و تا دقیقه‌ها فقط «در حال بارگذاری» دیده
     می‌شد؛ بعد هم یک‌باره همه‌چیز می‌آمد — برای همین اول فقط کریپتو و
     طلا و کالا دیده می‌شد و بقیه «بعد از چند دقیقه» می‌آمدند، و خبر
     «اول همیشه خالی» بود (چون رندر خبر پشت همان صف بود). */
  async function loadDash(force) {
    var now = Date.now();
    if (!force && dashCache.data && now - dashCache.at < 60000) { renderDash(dashCache.data); return; }
    var seq = ++dashSeq;
    $('dashHeat').innerHTML = '<div class="dash-sec"><div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div></div>';
    $('dashMovers').innerHTML = '';
    $('dashNews').innerHTML = '';
    $('dashNote').textContent = '';
    var yahooSyms = [];
    ['stocks', 'etf', 'forex', 'commodities', 'indices'].forEach(function (k) {
      MARKETS[k].quotes.forEach(function (q) { if (q.provider === 'yahoo') yahooSyms.push(q.symbol); });
    });
    var mofidSyms = [];
    ['boorse', 'farabourse'].forEach(function (k) {
      MARKETS[k].quotes.forEach(function (q) { mofidSyms.push(q.symbol); });
    });
    var live = { rows: [], news: null, newsDone: false, mktDone: 0, done: 0, total: 5, at: now };
    function partial() {
      if (seq !== dashSeq) return;
      renderDash({ rows: live.rows, news: live.news || [], newsLoading: !live.newsDone,
        rowsLoading: live.mktDone < 4, yahooOk: true, mofidOk: true, cgOk: true, at: now });
    }
    function legDone() {
      live.done++;
      if (live.done >= live.total && seq === dashSeq) {
        var data = { rows: live.rows, news: live.news || [], newsLoading: false,
          rowsLoading: false, yahooOk: true, mofidOk: true, cgOk: true, at: now };
        dashCache = { at: now, data: data };
        renderDash(data);
      }
    }
    function mktLegDone() { live.mktDone++; legDone(); }
    /* برگرداندن Promise.all یعنی await loadDash() تا رندر نهایی صبر می‌کند
       (هارنس و هر صداکنندهٔ دیگر روی همین حساب می‌کنند) — رندرهای تدریجی
       وسط راه با partial() انجام می‌شوند. */
    var legs = [
    cgMarkets().then(function (cg) {
      if (seq !== dashSeq) return;
      var cgById = {};
      cg.forEach(function (c) { cgById[c.id] = c; });
      var rows = [];
      MARKETS.crypto.quotes.forEach(function (q) {
        var c = cgById[CG_IDS[q.symbol]];
        if (c && typeof c.changePct === 'number') rows.push({ quote: q, market: 'crypto', price: c.price, changePct: c.changePct, currency: 'USD' });
      });
      live.rows = live.rows.concat(rows);
      partial();
    }).catch(function () {}).then(mktLegDone),
    yahooMulti(yahooSyms).then(function (yq) {
      if (seq !== dashSeq) return;
      var yBySym = {};
      yq.forEach(function (r) { if (r && r.symbol) yBySym[r.symbol] = r; });
      var rows = [];
      ['stocks', 'etf', 'forex', 'commodities', 'indices'].forEach(function (k) {
        MARKETS[k].quotes.forEach(function (q) {
          var r = yBySym[q.symbol];
          if (r && typeof r.changePct === 'number') rows.push({ quote: q, market: k, price: r.price, changePct: r.changePct, currency: r.currency || 'USD' });
        });
      });
      live.rows = live.rows.concat(rows);
      partial();
    }).catch(function () {}).then(mktLegDone),
    mofidBulk(mofidSyms).then(function (mq) {
      if (seq !== dashSeq) return;
      var mBySym = {};
      mq.forEach(function (r) { if (r && r.symbol) mBySym[r.symbol] = r; });
      var rows = [];
      ['boorse', 'farabourse'].forEach(function (k) {
        MARKETS[k].quotes.forEach(function (q) {
          var r = mBySym[q.symbol];
          if (r && typeof r.changePct === 'number') rows.push({ quote: q, market: k, price: r.price, changePct: r.changePct, currency: 'Rial' });
        });
      });
      live.rows = live.rows.concat(rows);
      partial();
    }).catch(function () {}).then(mktLegDone),
    binanceTicker('PAXGUSDT').then(function (paxg) {
      if (seq !== dashSeq) return;
      if (paxg && typeof paxg.changePct === 'number') {
        live.rows = live.rows.concat([{ quote: MARKETS.commodities.quotes[0], market: 'commodities', price: paxg.price, changePct: paxg.changePct, currency: 'USDT' }]);
        partial();
      }
    }).catch(function () {}).then(mktLegDone),
    (async function () {
      try {
        var N0 = window.OnellaNews.createNews({ fetchImpl: proxyFetch });
        live.news = await N0.impactfulNews(lang, 10);
      } catch (e) { live.news = []; }
      live.newsDone = true;
      partial();
    })().then(legDone)
    ];
    await Promise.all(legs);
  }
  function renderDash(data) {
    var byMarket = {};
    data.rows.forEach(function (r) {
      if (!byMarket[r.market]) byMarket[r.market] = { up: 0, total: 0, sum: 0 };
      byMarket[r.market].total++;
      byMarket[r.market].sum += r.changePct;
      if (r.changePct > 0) byMarket[r.market].up++;
    });
    var allChg = data.rows.map(function (r) { return r.changePct; });
    var avgAll = allChg.length ? allChg.reduce(function (a, b) { return a + b; }, 0) / allChg.length : null;
    var tempTxt = avgAll == null ? '—' : avgAll > 2 ? T('داغ', 'Hot') : avgAll > 0.5 ? T('گرم', 'Warm') : avgAll < -2 ? T('سرد', 'Cold') : avgAll < -0.5 ? T('خنک', 'Cool') : T('خنثی', 'Neutral');
    var heatHtml = '<div class="dash-sec"><h3>' + ICON.flame + esc(T('حرارت بازار', 'Market heat')) + '</h3>';
    if (avgAll != null) {
      heatHtml += '<div class="heat-row"><span class="heat-lb">' + esc(T('دمای بازار', 'Market temp')) + '</span><span class="heat-v ' + (avgAll >= 0 ? 'up' : 'dn') + '">' + esc(tempTxt) + ' ' + fmtPct(avgAll) + '</span></div>';
    }
    MARKET_ORDER.forEach(function (k) {
      var b = byMarket[k];
      if (!b) return;
      var upPct = Math.round((b.up / b.total) * 100);
      var avg = b.sum / b.total;
      heatHtml += '<div class="heat-row"><span class="heat-lb">' + esc(marketLabel(k)) + '</span>'
        + '<span class="heat-bar"><span class="hb-up" style="width:' + upPct + '%"></span><span class="hb-dn" style="width:' + (100 - upPct) + '%"></span></span>'
        + '<span class="heat-v ' + (avg >= 0 ? 'up' : 'dn') + '">' + fmtPct(avg) + '</span></div>';
    });
    if (!data.rows.length) heatHtml += '<div class="' + (data.rowsLoading ? 'muted' : 'na') + '">' + esc(data.rowsLoading ? T('در حال بارگذاری…', 'Loading…') : T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>';
    heatHtml += '</div>';
    $('dashHeat').innerHTML = heatHtml;
    var sorted = data.rows.slice().sort(function (a, b) { return b.changePct - a.changePct; });
    var up5 = sorted.slice(0, 5), dn5 = sorted.slice(-5).reverse();
    function moverRow(r) {
      return '<button class="mv-row" data-provider="' + r.quote.provider + '" data-symbol="' + esc(r.quote.symbol) + '"><span class="sym-ic">' + iconHtml(r.quote) + '</span><span><span class="mv-lb">' + esc(r.quote.label) + '</span><div class="mv-ds">' + esc(r.quote.display) + ' · ' + esc(marketLabel(r.market)) + '</div></span><span class="mv-px"><b>' + fmt(r.price) + ' ' + esc(r.currency) + '</b><span class="' + (r.changePct >= 0 ? 'up' : 'dn') + '">' + fmtPct(r.changePct) + '</span></span></button>';
    }
    var mvEmpty = '<div class="' + (data.rowsLoading ? 'muted' : 'na') + '">' + esc(data.rowsLoading ? T('در حال بارگذاری…', 'Loading…') : T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>';
    var mvHtml = '<div class="dash-sec"><h3>' + ICON.trendUp + esc(T('۵ نماد صعودی', 'Top 5 gainers')) + '</h3>' + (up5.length ? up5.map(moverRow).join('') : mvEmpty) + '</div>'
      + '<div class="dash-sec"><h3>' + ICON.trendDown + esc(T('۵ نماد نزولی', 'Top 5 losers')) + '</h3>' + (dn5.length ? dn5.map(moverRow).join('') : mvEmpty) + '</div>';
    $('dashMovers').innerHTML = mvHtml;
    $('dashMovers').querySelectorAll('.mv-row').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = lookupQuote(b.dataset.provider, b.dataset.symbol);
        if (q) { showMainTab('chart'); openSymbol(q); }
      });
    });
    var N = null;
    try { N = window.OnellaNews.createNews({ fetchImpl: proxyFetch }); } catch (e) {}
    var newsHtml = '<div class="dash-sec"><h3>' + ICON.news + esc(T('اخبار مهم', 'Important news')) + '</h3>';
    if (data.newsLoading) {
      newsHtml += '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    } else if (!data.news || !data.news.length) {
      newsHtml += '<div class="na">' + esc(T('خبری پیدا نشد.', 'No news found.')) + '</div>';
    } else {
      data.news.forEach(function (it) {
        var tag = lang === 'fa' ? 'بازار' : 'Market', lv = 'low';
        try { tag = (N && N.detectSymbolTag(it.title)) || tag; lv = N ? N.impactOf(it.title) : 'low'; } catch (e) {}
        /* v1.2.2 — درصد تاثیر حذف شد (دستور مالک: ۹۵٪/۴۵٪ عددهای ساختگی و
           گمراه‌کننده بودند): مثل تب خبرِ نماد، فقط سطح تاثیر با بج نشان داده
           می‌شود — بالا/متوسط/کم — بدون هیچ درصدی. */
        newsHtml += '<div class="news-card"><div class="news-tag"><span class="news-chip">[' + esc(tag) + ']</span>' + impactBadge(lv) + '</div>'
          + '<div class="news-title">' + esc(it.title) + '</div>'
          + (it.time ? '<div class="news-time">' + new Date(it.time).toUTCString().slice(5, 22) + ' UTC</div>' : '')
          + '</div>';
      });
      newsHtml += '<div class="warn">' + esc(T('تاثیر از روی کلیدواژهٔ تیتر تخمین زده شده؛ قطعی نیست.', 'Impact is a keyword estimate, not certain.')) + '</div>';
    }
    newsHtml += '</div>';
    $('dashNews').innerHTML = newsHtml;
    /* v1.2.1 — نوشتهٔ داشبورد به دستور کاربر حذف شد (متن ورکر/نرخ ایران دیگر نشان داده نمی‌شود). */
    $('dashNote').textContent = '';
  }

  /* ---- شروع ---- */
  function init() {
    if (tg) {
      try { tg.ready(); tg.expand(); } catch (e) {}
      try { tg.BackButton.onClick(function () { if (state.mainTab === 'dash') showMainTab('chart'); else show('catalog'); }); } catch (e) {}
    }
    $('backBtn').addEventListener('click', function () { show('catalog'); });
    ['chart', 'analysis', 'fund', 'news', 'depth'].forEach(function (t) {
      $('tabBtn-' + t).addEventListener('click', function () { setTab(t); });
    });
    $('tabBtn-chart').textContent = T('چارت', 'Chart');
    $('tabBtn-analysis').textContent = T('تحلیل', 'Analysis');
    $('tabBtn-fund').textContent = T('بنیادی', 'Fundamentals');
    $('tabBtn-news').textContent = T('خبر', 'News');
    $('tabBtn-depth').textContent = T('عمق', 'Depth');
    $('backBtn').textContent = T('‹ بازگشت', '‹ Back');
    $('mainTab-chart').innerHTML = ICON.chart + esc(T('چارت', 'Chart'));
    $('mainTab-dash').innerHTML = ICON.dash + esc(T('داشبورد', 'Dashboard'));
    wrapHeadOnce();
    $('mainTab-chart').addEventListener('click', function () { showMainTab('chart'); });
    $('mainTab-dash').addEventListener('click', function () { showMainTab('dash'); });
    $('dashTitle').textContent = T('داشبورد', 'Dashboard');
    $('dashRefresh').addEventListener('click', function () { loadDash(true); });
    var si = $('searchInput');
    if (si) {
      si.placeholder = T('نماد یا بازار را جستجو کن…', 'Search symbols or markets…');
    }
    $('searchTrigger').addEventListener('click', function () { openSearchModal(state.catalogMarket); });
    $('symBar').addEventListener('click', function () { openSearchModal(); });
    $('smClose').addEventListener('click', function () { closeSearchModal(); });
    $('smInput').addEventListener('input', function () { sm.q = $('smInput').value; renderSmBody(); });
    window.addEventListener('beforeunload', function () { stopLive(); });
    show('catalog');
  }
  /* برای تست از کنسول مرورگر: window.__miniApp.openSymbol({provider:'binance',symbol:'BTCUSDT',display:'BTC/USDT',label:'BTC'}) */
  window.__miniApp = { openSymbol: openSymbol, setTf: setTf, setTab: setTab, state: state, renderPriceBox: renderPriceBox, renderSearch: renderSearch, renderCatalog: renderCatalog, zoomBy: zoomBy, toggleFs: toggleFs, startLive: startLive, stopLive: stopLive, MARKETS: MARKETS, TFS: TFS,
    showMainTab: showMainTab, openSearchModal: openSearchModal, closeSearchModal: closeSearchModal, renderSmBody: renderSmBody, renderSmTabs: renderSmTabs, sm: sm,
    loadDash: loadDash, renderDash: renderDash, confluence: confluence, renderGauge: renderGauge, renderDepth: renderDepth, fetchDepth: fetchDepth, stopDepthPoll: stopDepthPoll, positionLastPxTag: positionLastPxTag,
    yahooSearch: yahooSearch, mofidResolve: mofidResolve, rememberQuote: rememberQuote,
    pmScale: pmScale, pmPan: pmPan, autoScale: autoScale, toLatest: toLatest, refreshAxisBtns: refreshAxisBtns,
    toggleFav: toggleFav, isFav: isFav, lookupQuote: lookupQuote, yahooMulti: yahooMulti, mofidBulk: mofidBulk, cgMarkets: cgMarkets };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

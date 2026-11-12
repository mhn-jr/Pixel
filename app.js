'use strict';
/* Onella Nelora Lite v1.11.2 — منطق مینی‌اپ (صفحهٔ استاتیک؛ بدون سرور).
   v1.11.2: (۱) قیمت لحظه‌ای زیر هر هشدار فعال — در مودال هشدار، زیر هر
   هشدار فعال «قیمت الان + فاصله تا هدف» می‌آید و هر ۳۰ ثانیه تازه می‌شود
   (برای همهٔ نمادها، نه فقط نماد فعلی)؛ سربرگ فهرست هم «هشدارهای من» شد.
   v1.11.0: (۱) آلرت سریع از ورکر — «📲 پیام تلگرام» اول به همین ورکر
   (POST /alert-add با initData) می‌رود؛ ورکر همان لحظه تأیید می‌فرستد و
   Cron هر دقیقه شلیک می‌کند (PC خاموش هم کار می‌کند). فقط اگر ورکر
   در دسترس نباشد به sendData (ربات روی PC) برمی‌گردد — دو بار ثبت
   نمی‌شود؛ (۲) جداسازی اکانت — کش آلرت فقط CloudStorage همان کاربر
   است؛ localStorage مشترکِ دستگاه دیگر ادغام/مهاجرت نمی‌شود؛
   (۳) فهرست هشدارها همهٔ نمادها را نشان می‌دهد (نماد فعلی اول، بعد
   سایر نمادها)؛ قبلاً فقط نماد فعلی دیده می‌شد.
   v1.10.0: (۱) سیستم کش آلرت — ذخیره در CloudStorage تلگرام (سرور تلگرام،
   با بستن/باز کردن می‌ماند) + آینهٔ localStorage؛ علت: localStorage در WebView
   تلگرام پاک می‌شد و آلرت ذخیره نمی‌شد؛ خطای ذخیره هم دیگر بی‌صدا نیست؛
   (۲) آلرت مشترک با ربات — گزینهٔ «📲 پیام تلگرام» در دیالوگ آلرت (sendData):
   آلرت به ربات می‌رسد، ربات نگهبانی می‌کند و وقتی قیمت برسد در چت پیام می‌دهد؛
   کریپتو + سهام، ایران فعلاً فقط داخل مینی‌اپ.
   v1.9.1: (۱) دکمهٔ + روی محور قیمت (سبک تریدینگ‌ویو) + خط ردیابی قیمت — با حرکت
   روی محور، + دنبال قیمت می‌آید؛ زدن + منوی هشدار/خط افقی را باز می‌کند (long-press
   هم سر جایش هست)؛ (۲) گزینهٔ آخر نوار ابزار/تنظیمات دیگر زیر صفحه نمی‌ماند —
   پنل‌ها به ارتفاع چارت محدود شدند + دکمهٔ ﹀ برای اسکرول؛ (۳) کراس‌هیر تریدینگ‌ویو:
   خط افقی آزادانه قیمتِ زیر انگشت را نشان می‌دهد با آهنربای نرم به O/H/L/C، خط
   عمودی روی پنل‌های RSI/MACD هم ادامه می‌یابد، برچسب محور قیمتِ نشانگر را می‌گوید؛
   (۴) جعبهٔ OHLC در صفحه جا می‌شود، سمت مخالف انگشت می‌نشیند و بعد از برداشتن
   انگشت می‌ماند (با یک ضربه روی چارت خاموش می‌شود).
   v1.9.0: (۱) نام هیچ منبع/سرویس در UI نمی‌آید — برچسب‌ها و hintها عمومی‌اند؛
   (۲) ابزارهای چارت بیشتر شد: ایچیموکو + روبان EMA، پنل استوکاستیک + OBV،
   رسم پرتو افقی + خط عمودی؛ (۳) هشدار قیمت به سبک تریدینگ‌ویو: دیالوگ
   (شرط/عبور/تکرار/انقضا/پیام) + نگه‌داشتن روی محور قیمت → منوی هشدار/خط افقی
   + خط هشدار روی چارت؛ بررسی فقط وقتی مینی‌اپ باز است (بدون پوش/سرور).
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
  /* v1.14.7 — همگام‌سازی زون ذخیره‌شدهٔ انتخاب‌گر (onella_tz_v1) با موتور تاریخ
     چارت (onella_date_v1)؛ اگر اختلاف باشد، انتخاب‌گر برنده است. */
  try {
    if (window.OnellaTZ && window.OnellaDate && window.OnellaTZ.get() !== window.OnellaDate.get().timeZone) window.OnellaDate.setTZ(window.OnellaTZ.get());
  } catch (e) {}
  var L = {
    en: { catalog: 'Catalog', back: '‹ Back', price: 'Price', change24: '24h change', high: 'High 24h', low: 'Low 24h', volume: 'Volume 24h',
      chart: 'Chart', analysis: 'Analysis', fundamentals: 'Fundamentals', news: 'News', impactNews: 'Important & impactful news',
      notAvailable: 'Not available right now.', needProxy: 'Data is not available from here right now.',
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
    fa: { catalog: 'کاتالوگ', back: '‹ بازگشت', price: 'قیمت', change24: 'تغییر ۲۴ ساعت', high: 'سقف ۲۴ ساعت', low: 'کف ۲۴ ساعت', volume: 'حجم ۲۴ ساعت',
      chart: 'چارت', analysis: 'تحلیل', fundamentals: 'بنیادی', news: 'خبر', impactNews: 'خبرهای مهم و تاثیرگذار',
      notAvailable: 'فعلاً در دسترس نیست.', needProxy: 'داده فعلاً از اینجا در دسترس نیست.',
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
      { label: 'XAU/USD', provider: 'binance', symbol: 'PAXGUSDT', display: 'XAU/USD (PAXG)', kw: 'طلا انس دلار پکس گلد' },
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
  /* v1.14.7 — زمان خبر در منطقهٔ زمانیِ انتخاب‌شده (پیش‌فرض UTC) + برچسب زون. */
  function fmtNewsTime(ms) {
    try {
      if (window.OnellaDate) return window.OnellaDate.fmt(ms, 'cd') + ' ' + window.OnellaDate.fmt(ms, 'hm') + ' ' + (window.OnellaTZ ? window.OnellaTZ.shortLabel(window.OnellaTZ.get()) : 'UTC');
    } catch (e) {}
    return new Date(ms).toUTCString().slice(5, 22) + ' UTC';
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
    /* v1.8.0 — live.json فقط قیمت لحظه‌ای ندارد: فیلد `change` همان کلیدها را با
       تغییر روزانهٔ ٪ دارد (پروب زندهٔ ۲۰۲۶-۱۱-۰۹: dollar ‏-0.39، ‏gold ‏+0.5)؛
       تا حالا نادیده گرفته می‌شد و نرخ‌های ایران «تغییر روزانه ندارند» فرض
       می‌شدند — اشتباه بود. `date`/`time` هم شمسی‌اند (مثلاً 1405/08/18 17:25). */
    var ch = j.change && typeof j.change[k] === 'number' ? j.change[k] : null;
    return { price: rates[k], changePct: ch, high: null, low: null, open: null, prevClose: null, volume: null, currency: 'Toman',
      asOf: (j.date ? String(j.date) : '') + (j.time ? ' ' + String(j.time) : '') };
  }
  /* ---- داده: بنیادی کریپتو (مستقیم CoinGecko) ---- */
  async function coingeckoFund(sym) {
    var id = CG_IDS[sym];
    if (!id) return null;
    var fundUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + id + '&price_change_percentage=24h,7d,30d,1y';
    var j = await fetchJSON(fundUrl, 10000);
    if (!Array.isArray(j) || !j[0]) j = await viaWorker('coingecko', fundUrl, 12000); // v1.0.2: مستقیم نشد — از ورکر.
    if (!Array.isArray(j) || !j[0]) return null;
    var c = j[0];
    return { name: c.name, rank: c.market_cap_rank, marketCap: c.market_cap, fdv: c.fully_diluted_valuation, volume24: c.total_volume,
      chg24: c.price_change_percentage_24h_in_currency, chg7d: c.price_change_percentage_7d_in_currency, chg30d: c.price_change_percentage_30d_in_currency,
      chg1y: c.price_change_percentage_1y_in_currency,
      circulating: c.circulating_supply, total: c.total_supply, max: c.max_supply, ath: c.ath, athChange: c.ath_change_percentage, atl: c.atl, atlChange: c.atl_change_percentage };
  }
  /* ---- داده: بورس/فرابورس ایران — مفید از ورکر (v1.1.0) ----
     قیمت = آخرین قیمت پایانی (تیک زنده ندارد)؛ کندل = UDF مفید.
     ISIN از فهرست stockTickers خود مفید می‌آید (ورکر ردیف CommonStock با ISIN معتبر را
     برمی‌گزیند — ردیف «محصول»/«شاخص صنعت» با همان نماد کنار گذاشته می‌شود). */
  var MOFID_RES = { '1m': '1', '3m': '1', '5m': '5', '15m': '15', '30m': '30', '1h': '60', '1d': '1D', '1w': '1W' };
  var mofidCache = {};
  /* v1.8.0 — کش کوتاه کندل روزانهٔ مفید: قیمت (mofidPrice) و بنیادی (renderFund)
     هر دو همان کندل ۱d صدو پنجاه روزه را می‌خواهند؛ دو بار نگیریم (۵ دقیقه). */
  var mofidDailyCache = {};
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
    if (tf === '1d') {
      var cd = mofidDailyCache[symbol];
      if (cd && Date.now() - cd.at < 300000 && cd.data) return cd.data.slice();
    }
    var r = await mofidResolve(symbol);
    if (!r) return null;
    var to = Math.floor(Date.now() / 1000);
    var days = tf === '1d' ? 150 : tf === '1w' ? 400 : 14;
    var from = to - days * 86400;
    // نردبان واریانت (همان P56): ثانیه/بازهٔ کامل ← میلی‌ثانیه ← adjusted=true.
    var j = await mofidHistory(r.isin, res, from, to, 0);
    var out = parseMofidUdf(j);
    if (out) { if (tf === '1d') mofidDailyCache[symbol] = { at: Date.now(), data: out }; return out; }
    j = await mofidHistory(r.isin, res, from * 1000, to * 1000, 0);
    out = parseMofidUdf(j);
    if (out) { if (tf === '1d') mofidDailyCache[symbol] = { at: Date.now(), data: out }; return out; }
    j = await mofidHistory(r.isin, res, from, to, 1);
    out = parseMofidUdf(j);
    if (out && tf === '1d') mofidDailyCache[symbol] = { at: Date.now(), data: out };
    return out;
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
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path></svg>',
    /* v1.14.7 — ساعت زنگ‌دار برای دکمهٔ Alert و ردیف هشدارِ شیت محور قیمت. */
    alarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 2.5"></path><path d="M9 2.5L7.5 4"></path><path d="M15 2.5l1.5 1.5"></path></svg>',
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
    $('catalogTitle').textContent = T('کاتالوگ', 'Catalog');
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
    state.priceUsd = null; state.priceIran = null; state.priceMode = storedPriceMode(); state.candlesDone = false;
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
    var tfBtn = $('tfBtn');
    if (tfBtn) tfBtn.innerHTML = '<span class="tf-cur">' + esc(t) + '</span> ▾';
    document.querySelectorAll('#tfPanel button').forEach(function (b) { b.classList.toggle('on', b.dataset.tf === t); });
    var tfPanel = $('tfPanel');
    if (tfPanel) tfPanel.classList.remove('open');
    loadCandles(prevTf);
  }

  // v1.6.0 — حالت ارز (دلار/تومان) انتخاب کاربر است و می‌ماند: در localStorage ذخیره
  // می‌شود؛ اولین تیک زنده آن را به دلار برنمی‌گرداند؛ چارت هم با همان انتخاب نشان
  // داده می‌شود (کندل‌های دلاری × نرخ تومانِ روز — ضریب window.__dispMul).
  function storedPriceMode() {
    try { var m = localStorage.getItem('onella_cur_v1'); return (m === 'iran') ? 'iran' : 'usd'; } catch (e) { return 'usd'; }
  }
  function dispMul() {
    if (state.priceMode === 'iran' && state.priceIran && state.priceUsd && state.priceUsd.price) {
      var r = state.priceIran.price / state.priceUsd.price;
      return (isFinite(r) && r > 0) ? r : 1;
    }
    return 1;
  }
  function applyDispMul() { try { window.__dispMul = dispMul(); } catch (e) { window.__dispMul = 1; } }
  function setPriceMode(mode) {
    state.priceMode = mode;
    try { localStorage.setItem('onella_cur_v1', mode); } catch (e) {}
    applyDispMul();
    renderPriceBox(false, false);
    try { window.draw(); window.head(); } catch (e) {}
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
    var p = (state.priceMode === 'iran' && state.priceIran) ? state.priceIran : state.priceUsd;
    var canSwitch = !!(state.priceUsd && state.priceIran);
    var iranOnly = !state.priceUsd && !!state.priceIran;
    if (!p) {
      $('priceBox').innerHTML = '<div class="na">' + esc(T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>'
        + (needProxy ? '<div class="hint">' + esc(T('داده فعلاً از اینجا در دسترس نیست.', 'Data is not available from here right now.')) + '</div>' : '')
        + (iranOnly ? '<div class="seg"><button type="button" data-mode="iran">' + esc(T('قیمت ایران (تومان)', 'Iran price (Toman)')) + '</button></div>' : '');
      bindPriceMode();
      return;
    }
    var unit = ' ' + (p.currency || '');
    var ch = (typeof p.changePct === 'number') ? ' <span class="' + (p.changePct >= 0 ? 'up' : 'dn') + '">' + fmtPct(p.changePct) + '</span>' : '';
    var subLabel = p.closeLabel
      ? esc(T('قیمت پایانی', 'Closing price')) + (state.mofidAsOf ? ' • ' + esc(mofidDate(state.mofidAsOf)) : '')
      : esc(T('تغییر ۲۴ ساعت', '24h change')) + ': ' + ch;    var stats = '';
    if (p.high != null || p.low != null || p.volume != null) {
      stats = '<div class="px-stats">'
        + (p.high != null ? '<div class="px-stat"><div class="px-lb">' + esc(T('سقف ۲۴ ساعت', 'High 24h')) + '</div><div class="px-v">' + fmt(p.high) + '</div></div>' : '')
        + (p.low != null ? '<div class="px-stat"><div class="px-lb">' + esc(T('کف ۲۴ ساعت', 'Low 24h')) + '</div><div class="px-v">' + fmt(p.low) + '</div></div>' : '')
        + (p.volume != null ? '<div class="px-stat"><div class="px-lb">' + esc(T('حجم ۲۴ ساعت', 'Volume 24h')) + '</div><div class="px-v">' + fmt(p.volume) + '</div></div>' : '')
        + '</div>';
    }
    $('priceBox').innerHTML = '<div class="big"><span class="big-v">' + fmt(p.price) + '</span><span class="unit">' + esc(unit) + '</span></div>'
      + '<div class="sub">' + subLabel + liveBadge() + '</div>'
      + stats
      + (canSwitch ? '<div class="seg"><button type="button" data-mode="usd"' + (state.priceMode === 'usd' ? ' class="on"' : '') + '>' + esc(T('دلار', 'USD')) + '</button>'
        + '<button type="button" data-mode="iran"' + (state.priceMode === 'iran' ? ' class="on"' : '') + '>' + esc(T('تومان', 'Toman')) + '</button></div>' : '');
    bindPriceMode();
  }
  function mofidDate(ms) {
    try { if (window.OnellaDate) return window.OnellaDate.fmt(ms, 'cd'); } catch (e) {}
    try { return new Date(ms).toLocaleDateString('fa-IR-u-ca-gregory'); } catch (e) { return new Date(ms).toISOString().slice(0, 10); }
  }
  // به‌روزرسانی سبک قیمت در حالت زنده (بدون بازسازی کل باکس).
  // v1.6.0 — در حالت تومان، تیک زندهٔ دلاری (Binance) عدد باکس را به دلار برنمی‌گرداند.
  function updateLivePrice(price) {
    var big = document.querySelector('#priceBox .big-v');
    if (!big) return;
    if (state.priceMode === 'iran' && state.priceIran) { big.textContent = fmt(state.priceIran.price); return; }
    big.textContent = fmt(price);
  }
  function bindPriceMode() {
    var btns = $('priceBox').querySelectorAll('[data-mode]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () { setPriceMode(b.dataset.mode); });
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
      applyDispMul(); // v1.6.0 — حالت ارز با آمدن قیمت‌ها ریست نمی‌شود.
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
        var tfBtn2 = $('tfBtn');
        if (tfBtn2) tfBtn2.innerHTML = '<span class="tf-cur">' + esc(prevTf) + '</span> ▾';
        document.querySelectorAll('#tfPanel button').forEach(function (b) { b.classList.toggle('on', b.dataset.tf === prevTf); });
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
    checkAlertsNow(curAlertPrice()); // v1.9.0 — قیمت اول هم هشدار را چک می‌کند (سمت را می‌سنجد، شلیک نمی‌کند).
    startAlertPoll(); // v1.9.0 — برای بازارهای غیرکریپتو، پولینگ ۳۰ ثانیه‌ای هشدار.
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
  /* v1.7.0 — آیکون جهت: سبز = صعودی، قرمز = نزولی، زرد = خنثی (دایره + پیکان).
     در گیج، کارت خلاصه و کارت‌های تحلیل استفاده می‌شود. */
  function dirSvg(dir, size) {
    var s = size || 20;
    if (dir === 'bull') return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#2ecc8f"/><path d="M7 14.5l3.5-4 2.5 2.5 4-4.5" stroke="#04120b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 8.5v3h-3" stroke="#04120b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (dir === 'bear') return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#ff5d6c"/><path d="M7 9.5l3.5 4 2.5-2.5 4 4.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 15.5v-3h-3" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#ffb347"/><path d="M7 12h10" stroke="#3a2a00" stroke-width="2.2" stroke-linecap="round"/></svg>';
  }
  function dirWord(dir) {
    return dir === 'bull' ? T('صعودی', 'Bullish') : dir === 'bear' ? T('نزولی', 'Bearish') : T('خنثی', 'Neutral');
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
      + '<div><div class="g-txt">' + dirSvg(c.bias === 'up' ? 'bull' : c.bias === 'down' ? 'bear' : 'flat', 22) + ' ' + esc(biasTxt) + ' · ' + esc(T('همگرایی شواهد', 'Evidence confluence')) + ' ' + c.score + '/100</div>'
      + '<div class="g-sub">' + esc(sym) + (c.reasons.length ? ' · ' + esc(c.reasons.join(' ')) : '') + '</div></div></div>';
  }

  /* ---- چارت: نوار ابزار، زوم، تمام‌صفحه، ژست‌ها (v1.1.0) ---- */
  function zoomBy(f) {
    try {
      window.__ov = window.__ov || {};
      var st = (window.__ov.st || 7) * f;
      window.__ov.st = Math.max(2, Math.min(40, st));
      window.draw(); window.head();
    } catch (e) {}
  }
  /* v1.14.8 — تمام‌صفحهٔ واقعی در مینی‌اپ تلگرام (باگ #۷): نسخهٔ قبلی فقط
     Element.requestFullscreen را صدا می‌زد؛ در WebView تلگرام (به‌خصوص iOS)
     آن API یا نیست یا بی‌صدا رد می‌شود و دکمه هیچ کاری نمی‌کرد.
     ترتیب: (۱) Telegram.WebApp.requestFullscreen (WebApp 8.0+)،
     (۲) requestFullscreen استاندارد روی کانتینر چارت (اگر تا ۷۰۰ms واقعاً
     وارد تمام‌صفحه نشد، به (۳) می‌رویم)، (۳) حالت درون‌برنامه‌ای (.fs).
     fsMode وضعیت واقعی را نگه می‌دارد تا زدن دوبارهٔ دکمه همیشه خارج شود. */
  var fsMode = 'none'; /* 'none' | 'css' | 'tg' (css + تمام‌صفحهٔ تلگرام) */
  var fsNativeTimer = null;
  var focusOn = false;
  /* v1.14.8 — آیکن‌های تمام‌صفحه این‌جا هستند (نه در renderChartShell): applyFsUI
     بیرون از renderChartShell است و به آن‌ها نیاز دارد — تعریفِ داخلِ renderChartShell
     همان باگ #۷ بود: در WebView تلگرام، cssFs → applyFsUI روی FS_ICONSِ ناموجود
     ReferenceError می‌داد و دکمه هیچ کاری نمی‌کرد. */
  var FS_ICONS = {
    on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5a1 1 0 0 1 1-1h4"></path><path d="M20 9V5a1 1 0 0 0-1-1h-4"></path><path d="M4 15v4a1 1 0 0 0 1 1h4"></path><path d="M20 15v4a1 1 0 0 1-1 1h-4"></path></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5a1 1 0 0 1-1 1H4"></path><path d="M15 4v5a1 1 0 0 0 1 1h4"></path><path d="M9 20v-5a1 1 0 0 0-1-1H4"></path><path d="M15 20v-5a1 1 0 0 1 1-1h4"></path></svg>'
  };
  function fsSupportedTg() { try { return !!(tg && typeof tg.requestFullscreen === 'function'); } catch (e) { return false; } }
  function applyFsUI(on) {
    var btn = $('fsBtn');
    if (btn) btn.innerHTML = on ? FS_ICONS.off : FS_ICONS.on;
    var fb = $('focusBtn');
    if (fb) fb.style.display = on ? '' : 'none';
    if (!on) exitFocusMode(true);
  }
  function toggleFs() {
    if (fsMode !== 'none') { exitFs(); return; }
    enterFs();
  }
  function redrawChartSoon() {
    var f = function () { try { if ($('cc')) { window.draw(); window.head(); } } catch (e) {} };
    setTimeout(f, 80); setTimeout(f, 350);
  }
  function setFsClass(on) {
    var tc = $('tab-chart');
    if (tc) tc.classList.toggle('fs', !!on);
    try { document.body.classList.toggle('fs-lock', !!on); } catch (e) {}
  }
  /* v1.15.4 — تمام‌صفحه (باگ: چارت بزرگ نمی‌شد و تمرکز کار نمی‌کرد):
     نسخهٔ قبلی در تلگرام فقط Telegram.WebApp.requestFullscreen را صدا می‌زد (که فقط
     هدرِ خودِ تلگرام را برمی‌دارد) و کلاس .fs هم position:fixed نداشت؛ مسیر native هم
     در WebViewِ تلگرام نامطمئن بود. حالا لایهٔ CSS (.fs = ثابت و تمام‌قد) همیشه اعمال
     می‌شود — پس همه‌جا کار می‌کند — و اگر تلگرام ≥۸٫۰ بود، بهترین‌تلاش
     requestFullscreen هم زده می‌شود تا هدر تلگرام هم برود. */
  function enterFs() {
    if (!$('tab-chart')) return;
    fsMode = 'css';
    if (fsSupportedTg()) {
      try { tg.requestFullscreen(); fsMode = 'tg'; } catch (e) { fsMode = 'css'; }
    }
    setFsClass(true);
    applyFsUI(true);
    redrawChartSoon();
  }
  function exitFs() {
    if (fsMode === 'tg') {
      try { if (tg && tg.isFullscreen && typeof tg.exitFullscreen === 'function') tg.exitFullscreen(); } catch (e) {}
    }
    fsMode = 'none';
    setFsClass(false);
    applyFsUI(false);
    redrawChartSoon();
  }
  /* v1.14.8 — حالت تمرکز (فقط داخل تمام‌صفحه): فقط خودِ چارت دیده می‌شود.
     خروج از تمام‌صفحه تمرکز را هم خاموش می‌کند. */
  function enterFocusMode() {
    if (fsMode === 'none' || focusOn) return;
    focusOn = true;
    try { document.body.classList.add('focus-mode'); } catch (e) {}
    var fb = $('focusExitBtn'); if (fb) fb.style.display = '';
    setTimeout(function () { try { window.draw(); window.head(); } catch (e) {} }, 120);
  }
  function exitFocusMode(silent) {
    if (!focusOn) return;
    focusOn = false;
    try { document.body.classList.remove('focus-mode'); } catch (e) {}
    var fb = $('focusExitBtn'); if (fb) fb.style.display = 'none';
    if (!silent) setTimeout(function () { try { window.draw(); window.head(); } catch (e) {} }, 120);
  }
  function toggleFocusMode() { if (focusOn) exitFocusMode(); else enterFocusMode(); }
  function renderChartShell() {
    /* v1.9.1 — با هر بار ساخت دوبارهٔ چارت، وضعیت کراس‌هیر ریست می‌شود. */
    xhPinned = false;
    try { window.__xhPrice = null; } catch (e) {}
    var tfs = TFS[state.quote.provider] || [];
    var toolOn = window.on || {};
    /* v1.2.2 — ۱۱ ابزار: ۵ قبلی + EMA، VWAP، دونچیان، کلتنر، سوپرترند، SAR.
       همه پشت دکمهٔ شناور (FAB) روی چارت باز می‌شوند، نه ردیف زیر چارت. */
    var TOOLS = [['fib', 'فیبوناچی', 'Fibonacci'], ['sr', 'حمایت/مقاومت', 'Support/Resistance'], ['tl', 'خط روند', 'Trendline'], ['bb', 'بولینگر', 'Bollinger'], ['pv', 'پیوت', 'Pivot'], ['ema', 'میانگین نمایی', 'EMA'], ['vwap', 'وی‌واپ', 'VWAP'], ['donch', 'دونچیان', 'Donchian'], ['kelt', 'کلتنر', 'Keltner'], ['super', 'سوپرترند', 'Supertrend'], ['sar', 'پارابولیک', 'SAR'], ['ichi', 'ایچیموکو', 'Ichimoku'], ['ribbon', 'روبان میانگین', 'EMA ribbon']];
    /* v1.4.0 — ۵ ابزار رسم تعاملی (مرحله ۳): در همان پنل شناور، زیر ابزارهای محاسبه‌شده.
       v1.9.0 — +۲ رسم: پرتو افقی (از نقطه به راست) و خط عمودی (در زمان نقطه).
       v1.14.7 — +۵ رسم به سبک تریدینگ‌ویو: نشانگر (انتخاب)، قلم آزاد، خط‌کش، آهنربا،
       پاک‌کن — هر ردیف آیکون + برچسب فارسی دارد (نوار بلند قابل‌اسکرول).
       v1.14.8 — +۱۱ رسم (دستور مالک: «هرچه بیشتر»): پیکان، دایره، بیضی، مثلث،
       کانال موازی، اکستنشن فیبوناچی، بادبزن فیبوناچی، چنگال، برچسب قیمت،
       خط شکسته، هایلایتر — همه در همان گروه «ابزارهای رسم». */
    var DRAW_TOOLS = [['cursor', 'نشانگر', 'Cursor'], ['trend', 'خط روند', 'Trendline'], ['hline', 'خط افقی', 'Horizontal'], ['vline', 'خط عمودی', 'Vertical'], ['ray', 'پرتو افقی', 'Ray'], ['fib', 'فیبوناچی', 'Fibonacci'], ['brush', 'قلم', 'Brush'], ['text', 'متن', 'Text'], ['measure', 'خط‌کش', 'Measure'], ['rect', 'مستطیل', 'Rectangle'], ['magnet', 'آهنربا', 'Magnet'], ['eraser', 'پاک‌کن', 'Eraser'],
      ['arrow', 'پیکان', 'Arrow'], ['circle', 'دایره', 'Circle'], ['ellipse', 'بیضی', 'Ellipse'], ['triangle', 'مثلث', 'Triangle'], ['channel', 'کانال موازی', 'Parallel channel'], ['fibext', 'اکستنشن فیبوناچی', 'Fib extension'], ['fibfan', 'بادبزن فیبوناچی', 'Fib fan'], ['pitchfork', 'چنگال', 'Pitchfork'], ['pricelabel', 'برچسب قیمت', 'Price label'], ['polyline', 'خط شکسته', 'Polyline'], ['highlighter', 'هایلایتر', 'Highlighter']];
    /* v1.5.0 — آیکون‌های نوار ابزار (SVG ساده، بدون self-closing تا ماک تست هم parse کند). */
    var IC = function (inner) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'; };
    var TOOL_ICONS = {
      fib: IC('<path d="M4 6h16"></path><path d="M4 11h12"></path><path d="M4 16h16"></path><path d="M4 21h8"></path>'),
      sr: IC('<path d="M4 7h16"></path><path d="M4 17h16"></path><path d="M12 4v3"></path><path d="M12 17v3"></path>'),
      tl: IC('<path d="M5 19L19 5"></path>'),
      bb: IC('<path d="M4 8c4-3 12-3 16 0"></path><path d="M4 16c4 3 12 3 16 0"></path><path d="M4 12h16"></path>'),
      pv: IC('<path d="M4 12h16"></path><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"></circle>'),
      ema: IC('<path d="M3 14c3-6 6 4 9-2s6 4 9-2"></path>'),
      vwap: IC('<path d="M4 11h16"></path><path d="M7 16v4"></path><path d="M12 14v6"></path><path d="M17 16v4"></path>'),
      donch: IC('<path d="M4 6h16"></path><path d="M4 18h16"></path><path d="M4 6v12"></path><path d="M20 6v12"></path>'),
      kelt: IC('<path d="M4 7h16"></path><path d="M4 17h16"></path><path d="M4 12h16" stroke-dasharray="3 3"></path>'),
      super: IC('<path d="M4 18h6v-6h6v-4h4"></path>'),
      sar: IC('<circle cx="6" cy="18" r="1.8" fill="currentColor" stroke="none"></circle><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"></circle><circle cx="18" cy="6" r="1.8" fill="currentColor" stroke="none"></circle>'),
      ichi: IC('<path d="M4 9c4-3 12-3 16 0"></path><path d="M4 15c4 3 12 3 16 0"></path><path d="M4 12h16" stroke-dasharray="3 3"></path>'),
      ribbon: IC('<path d="M3 8c5-3 10 3 18-2"></path><path d="M3 13c5-3 10 3 18-2"></path><path d="M3 18c5-3 10 3 18-2"></path>')
    };
    var DRAW_ICONS = {
      cursor: IC('<path d="M6 3l13 7.5-5.6 1.4-2.6 5.6L8.4 12 6 3z"></path>'),
      trend: IC('<path d="M5 19L19 5"></path><circle cx="5" cy="19" r="2" fill="currentColor" stroke="none"></circle><circle cx="19" cy="5" r="2" fill="currentColor" stroke="none"></circle>'),
      hline: IC('<path d="M3 12h18"></path>'),
      vline: IC('<path d="M12 3v18"></path><path d="M8 7l4-4 4 4"></path>'),
      ray: IC('<path d="M4 12h16"></path><path d="M16 8l4 4-4 4"></path>'),
      fib: IC('<path d="M5 5l14 14"></path><path d="M5 8h14"></path><path d="M5 13h14"></path><path d="M5 18h14"></path>'),
      brush: IC('<path d="M18 3l3 3-8.5 8.5-3-3L18 3z"></path><path d="M9.5 12.5L5 17l4.5.5-1-5z"></path><path d="M4 20c1.5.6 3.2-.3 3.8-1.8"></path>'),
      text: IC('<path d="M6 6h12"></path><path d="M12 6v12"></path>'),
      measure: IC('<path d="M3 17L17 3l4 4L7 21l-4-4z"></path><path d="M8 12l2 2"></path><path d="M11 9l2 2"></path><path d="M14 6l2 2"></path>'),
      rect: IC('<rect x="5" y="7" width="14" height="10" rx="1"></rect>'),
      magnet: IC('<path d="M6 4v8a6 6 0 0 0 12 0V4"></path><path d="M6 4h4v4H6z"></path><path d="M14 4h4v4h-4z"></path>'),
      eraser: IC('<path d="M9 19l-5.5-5.5L13 4l5.5 5.5L13 15H9z"></path><path d="M4 21h16"></path>'),
      /* v1.14.8 — آیکون ابزارهای تازه. */
      arrow: IC('<path d="M4 20L20 4"></path><path d="M14 4h6v6"></path>'),
      circle: IC('<circle cx="12" cy="12" r="8"></circle>'),
      ellipse: IC('<ellipse cx="12" cy="12" rx="9" ry="6"></ellipse>'),
      triangle: IC('<path d="M12 4l9 16H3z"></path>'),
      channel: IC('<path d="M4 8l16-4"></path><path d="M4 16l16-4"></path>'),
      fibext: IC('<path d="M5 5l14 14"></path><path d="M5 9h14"></path><path d="M5 14h14"></path><path d="M5 19h11"></path><path d="M18 17l3 3"></path>'),
      fibfan: IC('<path d="M5 19L19 5"></path><path d="M5 19l14-2"></path><path d="M5 19l12 4"></path>'),
      pitchfork: IC('<path d="M5 5l14 7"></path><path d="M5 19l14-7"></path><path d="M5 12h14"></path>'),
      pricelabel: IC('<path d="M4 4h11v7l-6 6-5-5z"></path><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"></circle><path d="M9 17v4"></path>'),
      polyline: IC('<path d="M4 18l4-8 4 5 4-9 4 4"></path>'),
      highlighter: IC('<path d="M14 4l6 6-9 9H5v-6l9-9z"></path><path d="M4 20h16"></path>')
    };
    var TRASH_ICON = IC('<path d="M5 7h14"></path><path d="M9 7V5h6v2"></path><path d="M8 7l1 12h6l1-12"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>');
    var CLEAR_ICON = IC('<path d="M6 6l12 12"></path><path d="M18 6L6 18"></path>');
    var BELL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path></svg>';
    var SET_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="#f06a15" stroke-width="1.8" stroke-linecap="round"><path d="M7 3v4"></path><path d="M7 15v6"></path><rect x="4.5" y="7" width="5" height="8" rx="1" fill="#f06a15" stroke="none"></rect><path d="M17 3v3"></path><path d="M17 14v7"></path><rect x="14.5" y="6" width="5" height="8" rx="1" fill="#f06a15" stroke="none"></rect></svg>';
    /* v1.6.0 — تمام‌صفحه از نوار ابزار پایین چارت به گوشهٔ بالا-راست چارت رفت. */
    /* (آیکن‌های FS_ICONS بیرون از renderChartShell‌اند — کنار applyFsUI.) */
    /* v1.6.0 — تایم‌فریم: یک تب واحد (دکمهٔ تایم‌فریم فعلی + پنل بازشونده)، جای ردیف ۱۱ دکمه. */
    /* v1.5.0 — پنل تنظیمات چارت (مثل اپ اصلی): نوع چارت + رنگ کندل‌ها + کلیدها. */
    var SET_TYPES = [['candle', 'کندل', 'Candles'], ['hollow', 'توخالی', 'Hollow'], ['bars', 'بار OHLC', 'OHLC'], ['line', 'خطی', 'Line'], ['area', 'ناحیه‌ای', 'Area'], ['ha', 'هیکین‌آشی', 'Heikin Ashi']];
    var SET_TYPE_ICONS = {
      candle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="7" width="6" height="10" rx="1" fill="currentColor" stroke="none"></rect><path d="M12 3v4"></path><path d="M12 17v4"></path></svg>',
      hollow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="7" width="6" height="10" rx="1"></rect><path d="M12 3v4"></path><path d="M12 17v4"></path></svg>',
      bars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 4v16"></path><path d="M12 8H7"></path><path d="M12 15h5"></path></svg>',
      line: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l4-6 4 3 4-7 4 4"></path></svg>',
      area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l4-6 4 3 4-7 4 4v10H4z" fill="currentColor" fill-opacity="0.25" stroke="none"></path><path d="M4 16l4-6 4 3 4-7 4 4"></path></svg>',
      ha: '<span style="font-size:16px;font-weight:800;line-height:22px">HA</span>'
    };
    var SET_PALS = [['def', '#2ecc8f', '#ff5d6c', 'پیش‌فرض', 'Default'], ['tv', '#26a69a', '#ef5350', 'فیروزه‌ای/قرمز', 'Teal/Red'], ['cb', '#3b82f6', '#f59e0b', 'کم‌بینایی رنگ', 'Colorblind'], ['rv', '#ef5350', '#3b82f6', 'معکوس', 'Reversed'], ['mono', '#e6e9ef', '#6b7280', 'تک‌رنگ', 'Mono']];
    var SET_TOGGLES = [['vol', 'حجم معاملات', 'Volume'], ['ma', 'میانگین ۲۰', 'MA20'], ['grid', 'شبکه', 'Grid'], ['last', 'خط قیمت زنده', 'Last price line'], ['pct', 'مقیاس درصدی', 'Percentage scale'], ['log', 'مقیاس لگاریتمی', 'Log scale'], ['lock', 'قفل مقیاس قیمت', 'Lock price scale'], ['rob', 'مقیاس مقاوم', 'Robust scale'], ['cd', 'شمارش معکوس کندل', 'Countdown']];
    var st = { type: 'candle', vol: 1, ma: 1, grid: 1, last: 1, pct: 0, log: 0, lock: 0, rob: 0, cd: 1, pal: 'def' };
    try { var _st = window.OnellaChartStyle.get(); if (_st) st = _st; } catch (e) {}
    /* v1.14.8 — پنل‌های اندیکاتور در تنظیمات چارت (جایگزین دکمه‌های نوار ابزار پایین). */
    var SET_PANES = [['rsi', 'RSI', 'RSI'], ['macd', 'MACD', 'MACD'], ['stoch', 'استوکاستیک', 'Stochastic'], ['obv', 'OBV', 'OBV']];
    var panesOn = { rsi: true, macd: true, stoch: false, obv: false };
    try { if (window.OnellaPanes && window.OnellaPanes.on) panesOn = window.OnellaPanes.on; } catch (e) {}
    var FOCUS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8V5a1 1 0 0 1 1-1h3"></path><path d="M20 8V5a1 1 0 0 0-1-1h-3"></path><path d="M4 16v3a1 1 0 0 0 1 1h3"></path><path d="M20 16v3a1 1 0 0 1-1 1h-3"></path><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"></circle></svg>';
    $('tab-chart').innerHTML =
      '<div id="tfRow" class="tf-wrap"><div class="tf-group"><button id="tfBtn" type="button" title="' + esc(T('تایم‌فریم', 'Timeframe')) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg><span class="tf-cur">' + esc(state.tf) + '</span> ▾</button>'
      + '<button id="fsBtn" class="tf-fs" type="button" title="' + esc(T('تمام‌صفحه', 'Fullscreen')) + '">' + FS_ICONS.on + '</button>'
      + '<button class="tf-alert" id="focusBtn" type="button" style="display:none" title="' + esc(T('تمرکز', 'Focus')) + '">' + FOCUS_ICON + '<span>' + esc(T('تمرکز', 'Focus')) + '</span></button></div>'
      + '<div class="tf-group"><button class="tf-fs" id="setBtn" type="button" title="' + esc(T('تنظیمات چارت', 'Chart settings')) + '">' + SET_ICON + '</button>'
      + '<button class="tf-alert" id="alertTopBtn" type="button" title="' + esc(T('هشدار قیمت', 'Price alert')) + '">' + ICON.alarm + '<span>Alert</span><span class="al-badge" id="alertBadge" style="display:none">0</span></button>'
      + '<button class="tf-fs" id="toolsFab" type="button" title="' + esc(T('ابزارهای چارت', 'Chart tools')) + '">' + ICON.tools + '</button></div>'
      + '<div id="tfPanel" class="tf-panel">' + tfs.map(function (k) {
          return '<button data-tf="' + k + '"' + (state.tf === k ? ' class="on"' : '') + ' type="button">' + k + '</button>';
        }).join('') + '</div></div>'
      + '<div class="chartwrap" id="chartWrap"><div id="nv" style="position:relative;height:260px"><div id="px" class="px px-ov"></div><div id="lastPxTag" style="display:none"></div><div id="xhBox" class="xh-box" dir="ltr" style="display:none"></div><canvas id="cc" dir="ltr" style="width:100%;height:260px;display:block"></canvas><button class="axis-btn" id="tvAutoBtn" type="button" style="display:none">A</button><button class="axis-btn" id="tvLatestBtn" type="button" style="display:none">⏭</button><div class="axis-track" id="axisTrack" style="display:none"></div>'
      + '<div class="tools-strip" id="toolsStrip"><div class="strip-sec-h">' + esc(T('اندیکاتورها', 'Indicators')) + '</div><div class="strip-group" id="chartTools">' + TOOLS.map(function (t) {
          return '<button class="tbtn' + (toolOn[t[0]] ? ' on' : '') + '" data-tool="' + t[0] + '" type="button" title="' + esc(lang === 'fa' ? t[1] : t[2]) + '">' + (TOOL_ICONS[t[0]] || esc(lang === 'fa' ? t[1] : t[2])) + '<span class="tb-lb">' + esc(lang === 'fa' ? t[1] : t[2]) + '</span></button>';
        }).join('') + '</div><div class="strip-sep"></div><div class="strip-sec-h">' + esc(T('ابزارهای رسم', 'Drawing tools')) + '</div><div class="strip-group" id="drawTools">' + DRAW_TOOLS.map(function (t) {
          return '<button class="tbtn" data-draw="' + t[0] + '" type="button" title="' + esc(lang === 'fa' ? t[1] : t[2]) + '">' + (DRAW_ICONS[t[0]] || esc(lang === 'fa' ? t[1] : t[2])) + '<span class="tb-lb">' + esc(lang === 'fa' ? t[1] : t[2]) + '</span></button>';
        }).join('') + '</div><div class="strip-sep"></div><div class="strip-sec-h">' + esc(T('اقدامات', 'Actions')) + '</div><div class="strip-group"><button class="tbtn" id="delDrawBtn" type="button" disabled title="' + esc(T('حذف انتخاب‌شده', 'Delete selected')) + '">' + TRASH_ICON + '<span class="tb-lb">' + esc(T('حذف', 'Delete')) + '</span></button><button class="tbtn" id="clearDrawBtn" type="button" title="' + esc(T('پاک کردن همه', 'Clear all')) + '">' + CLEAR_ICON + '<span class="tb-lb">' + esc(T('پاک کردن همه', 'Clear all')) + '</span></button></div></div>'
      + '<button class="strip-more" id="stripMore" type="button" style="display:none">﹀</button>'
      + '<button id="focusExitBtn" type="button" style="display:none">✕ ' + esc(T('خروج از تمرکز', 'Exit focus')) + '</button>'
      + '<div class="settings-panel" id="settingsPanel"><div class="settings-panel-h"><span>' + esc(T('تنظیمات چارت', 'Chart settings')) + '</span><button class="tbtn" id="setClose" type="button">✕</button></div><div class="set-sec-h">' + esc(T('نوع چارت', 'Chart type')) + '</div><div class="set-type-grid" id="setTypes">' + SET_TYPES.map(function (t) {
          return '<button class="set-type' + (st.type === t[0] ? ' on' : '') + '" data-type="' + t[0] + '" type="button">' + (SET_TYPE_ICONS[t[0]] || '') + '<span>' + esc(lang === 'fa' ? t[1] : t[2]) + '</span></button>';
        }).join('') + '</div><div class="set-sec-h">' + esc(T('رنگ کندل‌ها', 'Candle colors')) + '</div><div class="set-pal-row" id="setPals">' + SET_PALS.map(function (p) {
          return '<button class="set-pal' + (st.pal === p[0] ? ' on' : '') + '" data-pal="' + p[0] + '" type="button" title="' + esc(lang === 'fa' ? p[3] : p[4]) + '"><span class="sw" style="background:' + p[1] + '"></span><span class="sw" style="background:' + p[2] + '"></span></button>';
        }).join('') + '</div><div class="set-sec-h">' + esc(T('نمایش', 'Display')) + '</div><div id="setToggles">' + SET_TOGGLES.map(function (tg) {
          return '<div class="set-row"><span>' + esc(lang === 'fa' ? tg[1] : tg[2]) + '</span><button class="switch' + (st[tg[0]] ? ' on' : '') + '" data-set="' + tg[0] + '" type="button" aria-label="' + esc(lang === 'fa' ? tg[1] : tg[2]) + '"></button></div>';
        }).join('') + '</div><div class="set-sec-h">' + esc(T('پنل‌های اندیکاتور', 'Indicator panels')) + '</div><div id="setPanes">' + SET_PANES.map(function (pn) {
          return '<div class="set-row"><span>' + esc(lang === 'fa' ? pn[1] : pn[2]) + '</span><button class="switch' + (panesOn[pn[0]] ? ' on' : '') + '" id="setPane' + pn[0][0].toUpperCase() + pn[0].slice(1) + '" data-pane="' + pn[0] + '" type="button" aria-label="' + esc(lang === 'fa' ? pn[1] : pn[2]) + '"></button></div>';
        }).join('') + '</div><div class="set-sec-h">' + esc(T('بزرگ‌نمایی', 'Zoom')) + '</div><div class="set-zoom-row"><button class="tbtn" id="setZoomOut" type="button">−</button><button class="tbtn" id="setZoomIn" type="button">+</button></div></div></div></div>'
      + '<div class="chart-status"><button id="tzClockBtn" type="button" dir="ltr" title="' + esc(T('منطقهٔ زمانی', 'Timezone')) + '"></button></div>'
      + '<div class="tool-note-bar" id="toolNote" style="display:none"></div>'
      + '<div class="panes" id="panes"><div class="pane-row" id="rsiRow"><div class="pane-h"><span>RSI (14)</span><b id="rsiVal">—</b></div><canvas id="rsiCv" class="pane-cv" dir="ltr"></canvas></div><div class="pane-row" id="macdRow"><div class="pane-h"><span>MACD (12, 26, 9)</span><b id="macdVal">—</b></div><canvas id="macdCv" class="pane-cv" dir="ltr"></canvas></div><div class="pane-row" id="stochRow" style="display:none"><div class="pane-h"><span>استوکاستیک (14, 3, 3)</span><b id="stochVal">—</b></div><canvas id="stochCv" class="pane-cv" dir="ltr"></canvas></div><div class="pane-row" id="obvRow" style="display:none"><div class="pane-h"><span>OBV</span><b id="obvVal">—</b></div><canvas id="obvCv" class="pane-cv" dir="ltr"></canvas></div></div>'
      + '</div>';
    // v1.6.0 — تب واحد تایم‌فریم: دکمه باز/بسته می‌کند، انتخاب از پنل.
    $('tfBtn').addEventListener('click', function (e) { try { e.stopPropagation(); } catch (e2) {} var p = $('tfPanel'); if (p) p.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      var p = $('tfPanel');
      if (p && p.classList.contains('open') && !(e.target && e.target.closest && e.target.closest('#tfRow'))) p.classList.remove('open');
    });
    document.querySelectorAll('#tfPanel button').forEach(function (b) {
      b.addEventListener('click', function () { setTf(b.dataset.tf); });
    });
    /* v1.14.8 — نوار ابزار پایین حذف شد (باگ‌های #۵/#۶ + قانون کلی): نوع چارت
       فقط در تنظیمات چارت است، MA20/حجم فقط در کلیدهای نمایش، VWAP/EMA20 فقط
       در نوار ابزارها، Alert فقط دکمهٔ بالای چارت، پنل‌ها فقط در تنظیمات،
       زوم فقط در تنظیمات. پس این‌جا فقط همگام‌سازیِ نوار ابزارها می‌ماند. */
    (function () {
      var sync = function () {
        var sb = document.querySelector('#chartTools [data-tool="vwap"]');
        if (sb) sb.classList.toggle('on', !!(window.on || {}).vwap);
        var se = document.querySelector('#chartTools [data-tool="ema"]');
        if (se) se.classList.toggle('on', !!(window.on || {}).ema);
      };
      window.__syncVwapEma = sync;
    })();
    /* v1.14.7 — دکمهٔ Alert کنار تنظیمات چارت + ساعت زنده/انتخاب‌گر منطقهٔ زمانی. */
    var alertTopBtn = $('alertTopBtn');
    if (alertTopBtn) alertTopBtn.addEventListener('click', function () { openAlertModal(); });
    var tzClockBtn = $('tzClockBtn');
    if (tzClockBtn) tzClockBtn.addEventListener('click', function () { openTZPicker(); });
    startClockTick();
    refreshAlertBadge();
    try { if (window.OnellaPanes) window.OnellaPanes.applyVis(); } catch (e) {}
    try { if (window.OnellaPanes && window.OnellaPanes.attachPaneGestures) window.OnellaPanes.attachPaneGestures(); } catch (e) {}
    /* v1.14.8 — بزرگ‌نمایی در تنظیمات چارت + حالت تمرکز (داخل تمام‌صفحه). */
    var zIn = $('setZoomIn'), zOut = $('setZoomOut');
    if (zIn) zIn.addEventListener('click', function () { zoomBy(1.4); });
    if (zOut) zOut.addEventListener('click', function () { zoomBy(1 / 1.4); });
    var focusBtn = $('focusBtn');
    if (focusBtn) focusBtn.addEventListener('click', function () { toggleFocusMode(); });
    var focusExitBtn = $('focusExitBtn');
    if (focusExitBtn) focusExitBtn.addEventListener('click', function () { exitFocusMode(); });
    $('fsBtn').addEventListener('click', function () { toggleFs(); });
    $('tvAutoBtn').addEventListener('click', function () { autoScale(); });
    $('tvLatestBtn').addEventListener('click', function () { toLatest(); });
    // v1.5.0 — نوار ابزار عمودی + پنل تنظیمات چارت (مثل اپ اصلی): باز کردن یکی،
    // دیگری را می‌بندد. خوانش ابزار حالا در نوار باریک زیر چارت است (#toolNote).
    function syncSettingsUI() {
      try {
        var s2 = window.OnellaChartStyle.get();
        document.querySelectorAll('#setTypes .set-type').forEach(function (b) { b.classList.toggle('on', b.dataset.type === s2.type); });
        document.querySelectorAll('#setPals .set-pal').forEach(function (b) { b.classList.toggle('on', b.dataset.pal === s2.pal); });
        document.querySelectorAll('#setToggles .switch').forEach(function (b) { b.classList.toggle('on', !!s2[b.dataset.set]); });
      } catch (e) {}
    }
    document.querySelectorAll('#setTypes .set-type').forEach(function (b) {
      b.addEventListener('click', function () {
        try { window.OnellaChartStyle.set({ type: b.dataset.type }); } catch (e) {}
        syncSettingsUI();
      });
    });
    document.querySelectorAll('#setPals .set-pal').forEach(function (b) {
      b.addEventListener('click', function () {
        try { window.OnellaChartStyle.set({ pal: b.dataset.pal }); } catch (e) {}
        syncSettingsUI();
      });
    });
    document.querySelectorAll('#setToggles .switch').forEach(function (b) {
      b.addEventListener('click', function () {
        try {
          var k = b.dataset.set, o = {};
          o[k] = window.OnellaChartStyle.get()[k] ? 0 : 1;
          window.OnellaChartStyle.set(o);
        } catch (e) {}
        syncSettingsUI();
      });
    });
    /* v1.14.8 — سوییچ پنل‌های اندیکاتور در تنظیمات چارت (جایگزین دکمه‌های
       RSI/MACD/Stoch/OBV نوار ابزار پایین؛ حالت در localStorage می‌ماند). */
    document.querySelectorAll('#setPanes .switch').forEach(function (b) {
      b.addEventListener('click', function () {
        try { if (window.OnellaPanes) window.OnellaPanes.toggle(b.dataset.pane); } catch (e) {}
      });
    });
    // ابزارهای دستی روی چارت — نوار عمودی آیکون‌دار؛ خوانش ابزار در نوار زیر چارت.
    document.querySelectorAll('#chartTools .tbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.tool;
        var o = window.on || {};
        o[id] = !o[id];
        b.classList.toggle('on', !!o[id]);
        if (typeof window.__syncVwapEma === 'function') window.__syncVwapEma();
        var note = $('toolNote');
        try {
          if (o[id]) { if (note) note.textContent = (typeof toolNote === 'function') ? toolNote(id) : ''; }
          else if (note) {
            var other = TOOLS.map(function (t) { return t[0]; }).find(function (x) { return o[x]; });
            note.textContent = other && typeof toolNote === 'function' ? toolNote(other) : '';
          }
        } catch (e) {}
        try { if (note) note.style.display = (note.textContent || '') ? '' : 'none'; } catch (e) {}
        try { window.draw(); } catch (e) {}
      });
    });
    // v1.4.0 — ابزارهای رسم (مرحله ۳): انتخاب ابزار، حذف رسم انتخاب‌شده، پاک کردن همهٔ رسم‌های نماد.
    document.querySelectorAll('#drawTools .tbtn').forEach(function (b) {
      b.addEventListener('click', function () { try { if (window.OnellaDraw) window.OnellaDraw.setTool(b.dataset.draw); } catch (e) {} });
    });
    var delDrawBtn = $('delDrawBtn');
    if (delDrawBtn) delDrawBtn.addEventListener('click', function () { try { if (window.OnellaDraw) { window.OnellaDraw.removeSelected(); window.draw(); } } catch (e) {} });
    var clearDrawBtn = $('clearDrawBtn');
    if (clearDrawBtn) clearDrawBtn.addEventListener('click', function () {
      try {
        if (!window.OnellaDraw) return;
        var ok = (typeof confirm === 'function') ? confirm(T('همهٔ رسم‌های این نماد پاک شوند؟', 'Clear all drawings for this symbol?')) : true;
        if (ok) { window.OnellaDraw.clearCurrent(); window.draw(); }
      } catch (e) {}
    });
    try { if (window.OnellaDraw) window.OnellaDraw.syncUI(); } catch (e) {}
    // دکمهٔ شناور ابزارها (FAB): باز/بسته کردن نوار ابزار؛ دکمهٔ تنظیمات: پنل تنظیمات.
    (function () {
      var fab = $('toolsFab'), strip = $('toolsStrip'), setP = $('settingsPanel'), sb = $('setBtn');
      if (fab && strip) fab.addEventListener('click', function () {
        var open = !strip.classList.contains('open');
        strip.classList.toggle('open', open);
        if (open && setP) { setP.classList.remove('open'); if (sb) sb.classList.remove('on'); }
        if (open) { try { var onBtn = strip.querySelector('.tbtn.on'); if (onBtn && onBtn.scrollIntoView) onBtn.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
        updateStripMore();
      });
      if (strip) strip.addEventListener('scroll', updateStripMore);
      var more = $('stripMore');
      if (more && strip) more.addEventListener('click', function () {
        /* v1.14.8 — فوتر ثابت پنل: ⌄ = اسکرول به پایین؛ ⌃ (در انتها) = برگشت به بالا. */
        try {
          var sh = strip.scrollHeight || 0, ch = strip.clientHeight || 0, st = strip.scrollTop || 0;
          if (sh > ch + 4 && st + ch < sh - 4) strip.scrollTop = Math.min(Math.max(0, sh - ch), st + 200);
          else strip.scrollTop = 0;
        } catch (e) {}
        updateStripMore();
      });
      if (sb && setP) sb.addEventListener('click', function () {
        var open2 = !setP.classList.contains('open');
        setP.classList.toggle('open', open2);
        sb.classList.toggle('on', open2);
        if (open2 && strip) strip.classList.remove('open');
        updateStripMore();
      });
      var sc = $('setClose');
      if (sc && setP) sc.addEventListener('click', function () { setP.classList.remove('open'); if (sb) sb.classList.remove('on'); });
    })();
    /* v1.15.4 — رویدادهای تلگرام: خروج با ژست/دکمهٔ سیستمی تلگرام هم باید تمام‌صفحه را ببندد؛
       اگر درخواست تمام‌صفحهٔ تلگرام شکست خورد (fullscreenFailed) لایهٔ CSS می‌ماند.
       تغییر اندازهٔ صفحه/جهت گوشی هم چارت را دوباره می‌کشد. */
    if (!window.__tgFsBound) {
      window.__tgFsBound = true;
      try {
        if (tg && typeof tg.onEvent === 'function') {
          tg.onEvent('fullscreenChanged', function () {
            var on = false;
            try { on = !!(tg && tg.isFullscreen); } catch (e) {}
            if (!on && fsMode === 'tg') exitFs();
            else redrawChartSoon();
          });
          tg.onEvent('fullscreenFailed', function () { if (fsMode === 'tg') fsMode = 'css'; });
          tg.onEvent('viewportChanged', function () { redrawChartSoon(); });
        }
      } catch (e) {}
      try { window.addEventListener('resize', function () { redrawChartSoon(); }); } catch (e) {}
    }
    // ژست‌های TradingView (پورت js/06 اپ): اسکرول روی محور قیمت = زوم عمودی؛
    // کشیدن روی محور قیمت = کش‌آمدن مقیاس؛ کشیدن عمودی روی چارت = اسکرول صفحه
    // (v1.14.8: دیگر جابه‌جایی قیمت نیست)؛ دوبار لمس محور قیمت = مقیاس خودکار؛
    // اسکرول روی چارت = زوم افقی حول نشانگر.
    var cvs = $('cc');
    var pointers = new Map(), pinchD = 0, pinchSt = 0, dragX = null, dragY = null, dragPan = 0;
    var pm0 = null, gMode = null, gMoved = false, gx0 = 0, gy0 = 0, gs0 = 7, gPan0 = 0, gLastTap = { t: 0, x: 0, y: 0 };
    var lpTimer = null, lpX = 0, lpY = 0, xhActive = false, drawAnchor = null;
    function DW() { try { return window.OnellaDraw || null; } catch (e) { return null; } }
    function ptrPos(e) { var r = cvs.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; }
    function setCurFromX(p) { var st2 = ((window.__ov || {}).st || 7); var n = Math.min(cs.length, Math.floor((p.w - 46) / st2)); var i = Math.floor(p.x / st2); window.cur = (i >= 0 && i < n) ? i : -1; }
    /* v1.14.8 — لمس محور قیمت = کراس‌هیر روی همان قیمت (باگ #۱): برچسب قیمت آخر
       (+ ⊕ چسبیده به آن) همان قیمتِ آهنربا/آزاد را نشان می‌دهد؛ پس لمس محور،
       کراس‌هیر را روی آخرین کندلِ دیده‌شده می‌نشاند و قیمتش را از y می‌گیرد.
       pin=false برای هاور ماوس (پین نمی‌شود؛ با رفتن نشانگر خاموش می‌شود). */
    function setAxisXh(y, pin) {
      var G = window.__geo || {};
      if (!G.inv || !G.ph) return;
      var cs2 = window.cs || [];
      if (!cs2.length) return;
      var st = ((window.__ov || {}).st || 7);
      var n = Math.min(cs2.length, Math.floor(((G.W || 360) - (G.pw || 46)) / st));
      if (typeof window.cur !== 'number' || window.cur < 0 || window.cur >= n) window.cur = Math.max(0, n - 1);
      xhPriceAtY(y);
      if (pin !== false) { xhPinned = true; xhActive = true; }
    }
    function axisW() { var G = window.__geo || {}; return Math.max(56, G.pw || 46); }
    function zoneOf(p) { if (p.y > p.h - 22) return 't'; if (p.x > p.w - axisW()) return 'p'; return 'c'; }
    cvs.addEventListener('pointerdown', function (e) {
      try { cvs.setPointerCapture(e.pointerId); } catch (err) {}
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var p = ptrPos(e);
      if (pointers.size === 2) {
        if (lpTimer) { try { clearTimeout(lpTimer); } catch (err) {} lpTimer = null; }
        gMode = 'pinch'; gMoved = true;
        var pts = Array.from(pointers.values());
        pinchD = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchSt = (window.__ov && window.__ov.st) || 7;
        return;
      }
      gx0 = p.x; gy0 = p.y; gs0 = (window.__ov && window.__ov.st) || 7; gPan0 = (window.__ov && window.__ov.pan) || 0;
      dragX = e.clientX; dragY = e.clientY; dragPan = gPan0; gMoved = false;
      var G = window.__geo || {};
      pm0 = (window.__ov && window.__ov.pm) ? { hi: window.__ov.pm.hi, lo: window.__ov.pm.lo } : (G.hi != null ? { hi: G.hi, lo: G.lo } : null);
      gMode = zoneOf(p) === 'p' ? 'pscale' : 'pan';
      /* v1.4.0 — حالت رسم (مرحله ۳): اگر ابزار رسم فعال است، لمس چارت رسم است نه pan؛
         اگر انگشت روی رسمِ موجود فرود آمد، کشیدن آن را جابه‌جا می‌کند (ضربه = انتخاب). */
      drawAnchor = null;
      var dw0 = DW();
      if (zoneOf(p) === 'c' && dw0) {
        if (dw0.tool()) { gMode = 'draw'; drawAnchor = dw0.pointFromXY(p.x, p.y); if (lpTimer) { try { clearTimeout(lpTimer); } catch (err) {} lpTimer = null; } }
        else {
          var hit0 = dw0.hitTestXY(p.x, p.y);
          if (hit0) { dw0.select(hit0.id); gMode = 'move'; dw0.startMove(p.x, p.y); }
        }
      }
      /* v1.9.1 — کراس‌هیرِ پین‌شده: ضربهٔ بعدی روی چارت (بدون ابزار رسم و بدون
         برخورد به رسم) کراس‌هیر را از سر می‌گیرد؛ ضربهٔ سریعِ بدون حرکت خاموشش
         می‌کند (در ptrEnd). */
      if (zoneOf(p) === 'c' && gMode === 'pan' && xhPinned) {
        gMode = 'xh'; xhActive = true;
        setCurFromX(p); xhPriceAtY(p.y);
        try { window.head(); window.draw(); } catch (err) {}
      }
      /* v1.3.0 — نگه‌داشتن انگشت (long-press) روی چارت = کراس‌هیر (مرحله ۱)؛
         اگر انگشت زود حرکت کند، تایمر لغو می‌شود و همان pan قبلی است. */
      if (zoneOf(p) === 'c' && gMode === 'pan') {
        lpX = p.x; lpY = p.y;
        if (lpTimer) { try { clearTimeout(lpTimer); } catch (err) {} }
        lpTimer = setTimeout(function () {
          lpTimer = null;
          if (pointers.size !== 1 || gMode !== 'pan' || gMoved) return;
          xhActive = true; gMode = 'xh'; gMoved = true;
          setCurFromX({ x: lpX, w: cvs.clientWidth });
          xhPriceAtY(lpY);
          try { window.head(); window.draw(); } catch (err) {}
        }, 380);
      }
      /* v1.14.8 — لمس محور قیمت = کراس‌هیر روی همان قیمت (برچسب + ⊕ با هم
         همان‌جا می‌نشینند)؛ کشیدن روی محور هم‌زمان مقیاس را می‌کشد (pscale). */
      if (zoneOf(p) === 'p') {
        setAxisXh(p.y);
        try { window.head(); window.draw(); } catch (err) {}
      }
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
        /* v1.3.0 — حرکت زودهنگام = لغو long-press (همان pan قبلی)؛ در حالت
           کراس‌هیر، حرکت انگشت فقط نشانگر را جابه‌جا می‌کند، نه چارت را. */
        if (lpTimer && Math.hypot(p.x - lpX, p.y - lpY) > 10) { try { clearTimeout(lpTimer); } catch (err) {} lpTimer = null; }
        /* v1.4.0 — حالت رسم: کشیدن = خط راهنمای رسم؛ حالت جابه‌جایی: کشیدن = حرکت رسم. */
        if (gMode === 'draw') { var dwM = DW(); if (dwM) dwM.setPreview(dwM.pointFromXY(p.x, p.y)); try { window.draw(); } catch (err) {} return; }
        if (gMode === 'move') { var dwV = DW(); if (dwV) dwV.moveTo(p.x, p.y); try { window.draw(); } catch (err) {} return; }
        if (gMode === 'xh') { setCurFromX(p); xhPriceAtY(p.y); try { window.head(); window.draw(); } catch (err) {} return; }
        if (gMode === 'pscale' && pm0) {
          try {
            window.__ov = window.__ov || {};
            window.__ov.pm = pmScale(pm0, Math.exp(dy / 170), window.__geo || {});
            setAxisXh(p.y); // v1.14.8 — برچسب + ⊕ با انگشت روی محور حرکت می‌کنند.
            window.draw(); window.head(); refreshAxisBtns();
          } catch (err) {}
          return;
        }
        if (gMode === 'pan') {
          /* v1.14.8 — فقط کشیدنِ افقی چارت را جابه‌جا می‌کند؛ کشیدنِ عمودی را
             مرورگر اسکرول می‌کند (touch-action: pan-y) — دیگر جابه‌جایی قیمت نیست. */
          try {
            window.__ov = window.__ov || {};
            var st = ((window.__ov || {}).st || 7);
            var maxPan = Math.max(0, (window.cs ? window.cs.length : 0) - Math.floor(p.w / st));
            window.__ov.pan = Math.max(0, Math.min(maxPan, dragPan + dx / st));
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
        /* v1.14.8 — هاور ماوس روی محور قیمت: برچسب + ⊕ روی همان قیمت می‌نشینند
           (پین نمی‌شود)؛ با رفتن نشانگر از محور، کراس‌هیر خاموش می‌شود — مگر پین‌شده باشد. */
        if (zoneOf(p) === 'p') { setAxisXh(p.y, false); xhActive = true; }
        else if (!xhPinned) { window.__xhPrice = null; xhActive = false; }
        try { window.head(); window.draw(); } catch (err) {}
      }
    });
    function ptrEnd(e) {
      var wasMode = gMode;
      pointers.delete(e.pointerId);
      if (lpTimer) { try { clearTimeout(lpTimer); } catch (err) {} lpTimer = null; }
      if (pointers.size < 2) pinchD = 0;
      if (pointers.size === 0) {
        dragX = null; dragY = null;
        /* v1.3.0 — رها کردن انگشت در حالت کراس‌هیر.
           v1.9.1 — کراس‌هیر بعد از برداشتن انگشت می‌ماند (پین) تا جعبهٔ OHLC خوانده
           شود؛ ضربهٔ سریعِ بعدی روی چارت خاموشش می‌کند. کشیدن = جابه‌جایی نشانگر. */
        if (wasMode === 'xh') {
          if (!gMoved) { xhActive = false; xhPinned = false; window.cur = -1; window.__xhPrice = null; try { window.head(); window.draw(); } catch (err) {} }
          else { xhPinned = true; }
        }
        /* v1.4.0 — پایان رسم/جابه‌جایی (مرحله ۳): کشیدن = رسم از نقطهٔ شروع تا رها؛
           ضربه = نقطهٔ رسم (یا انتخاب رسم، وقتی ابزاری فعال نیست). */
        if (wasMode === 'draw') {
          var dwE = DW();
          if (dwE) {
            var rp = dwE.pointFromXY(ptrPos(e).x, ptrPos(e).y);
            if (rp) {
              if (gMoved && drawAnchor) dwE.completeDrag(drawAnchor, rp);
              else dwE.tap(rp);
            }
            dwE.setPreview(null);
            try { window.draw(); window.head(); } catch (err) {}
          }
          drawAnchor = null;
        } else if (wasMode === 'move') {
          var dwM2 = DW();
          if (dwM2) { dwM2.endMove(); try { window.draw(); } catch (err) {} }
        } else if (!gMoved && wasMode === 'pan') {
          var dwT = DW(), pt2 = ptrPos(e);
          if (dwT && zoneOf(pt2) === 'c') {
            var tp = dwT.pointFromXY(pt2.x, pt2.y);
            if (tp) { dwT.tap(tp); try { window.draw(); } catch (err) {} }
          }
        }
        if (!gMoved && wasMode && wasMode !== 'draw' && wasMode !== 'move') {
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
    /* v1.14.9 — باگ: کشیدن عمودی روی محور قیمت فقط صفحه را بالا/پایین می‌برد.
       علت: touch-action: pan-y روی کانواس (برای اسکرول صفحه از روی چارت) محور قیمت را هم
       شامل می‌شد و مرورگر ژست را می‌گرفت (pointercancel). touch-action ثابت است و بعد از
       pointerdown دیگر عوض نمی‌شود؛ پس در touchstart (non-passive) اگر لمس داخل ناحیهٔ
       محور قیمت بود، preventDefault می‌زنیم تا مرورگر اسکرول را شروع نکند و کشیدن =
       کش‌آمدن مقیاس قیمت (مثل TradingView). بقیهٔ چارت همچنان صفحه را اسکرول می‌کند. */
    var axisTouchLock = false;
    function touchInAxis(t) {
      var r = cvs.getBoundingClientRect();
      var x = t.clientX - r.left, y = t.clientY - r.top;
      return zoneOf({ x: x, y: y, w: r.width, h: r.height }) === 'p';
    }
    cvs.addEventListener('touchstart', function (e) {
      axisTouchLock = false;
      if (!e.touches || !e.touches.length) return;
      if (touchInAxis(e.touches[0])) {
        axisTouchLock = true;
        if (e.cancelable) { try { e.preventDefault(); } catch (err) {} }
      }
    }, { passive: false });
    cvs.addEventListener('touchmove', function (e) {
      if ((axisTouchLock || gMode === 'pscale') && e.cancelable) { try { e.preventDefault(); } catch (err) {} }
    }, { passive: false });
    function axisTouchEnd() { axisTouchLock = false; }
    cvs.addEventListener('touchend', axisTouchEnd);
    cvs.addEventListener('touchcancel', axisTouchEnd);
    cvs.addEventListener('pointerup', ptrEnd);
    cvs.addEventListener('pointercancel', ptrEnd);
    cvs.addEventListener('pointerleave', function (e) { if (lpTimer) { try { clearTimeout(lpTimer); } catch (err) {} lpTimer = null; } var dwL = DW(); if (dwL) dwL.setPreview(null); if (pointers.size === 0 && !xhPinned) { window.cur = -1; window.__xhPrice = null; try { window.head(); window.draw(); } catch (err) {} } });
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
    stopAlertPoll(); // v1.9.0
  }
  /* v1.2.1 — برچسب قیمت آخر روی محور قیمت (سبک TradingView): دقیقاً همان کندلی را
     نشان می‌دهد که head() نشان می‌دهد (کراس‌هیر فعال → کندل زیر کراس‌هیر، وگرنه
     آخرین کندل — مثل head()، بدون pan)؛ رنگش جهت همان کندل است. هر بار head()
     صدا زده شود، برچسب هم جابه‌جا می‌شود (wrap یک‌باره در init).
     v1.14.8 — باگ #۱: دیگر دو برچسب قیمت روی محور نیست — دکمهٔ ⊕ به همین برچسب
     چسبیده (سمت چپ، روی محور) و همان قیمت را نشان می‌دهد؛ ⊕ همیشه دیده می‌شود
     و خط‌چین نارنجی هم روی همان قیمت است. ⊕ یک بار ساخته می‌شود تا تیک زنده
     قیمت را از زیر انگشت نبرد. */
  var lastPxTagPrice = null;
  function positionLastPxTag() {
    var tag = document.getElementById('lastPxTag');
    if (!tag) return;
    var cs = window.cs;
    var G = window.__geo;
    if (!cs || !cs.length || !G || typeof G.Y !== 'function') { tag.style.display = 'none'; lastPxTagPrice = null; return; }
    var W = G.W || 360, stH = (window.__ov && window.__ov.st) || 7;
    var n = Math.min(cs.length, Math.floor((W - (G.pw || 46)) / stH));
    var cur = window.cur;
    var i = (typeof cur === 'number' && cur >= 0 && cur < n) ? cs.length - n + cur : cs.length - 1;
    var c = cs[i];
    if (!c || typeof c.c !== 'number') { tag.style.display = 'none'; lastPxTagPrice = null; return; }
    /* v1.9.1 — با کراس‌هیر فعال، برچسب قیمتِ زیر نشانگر (آهنربا/آزاد) را نشان می‌دهد، نه بستهٔ کندل. */
    var xhP = (typeof cur === 'number' && cur >= 0 && typeof window.__xhPrice === 'number' && isFinite(window.__xhPrice)) ? window.__xhPrice : null;
    var px = (xhP != null) ? xhP : c.c;
    var y = G.Y(px);
    if (!Number.isFinite(y)) { tag.style.display = 'none'; lastPxTagPrice = null; return; }
    lastPxTagPrice = px;
    /* ⊕ را فقط یک بار به برچسب بچسبان (ساختن دوباره در هر تیک، ضربه را می‌خورد). */
    var plus = tag.querySelector('.ax-plus');
    if (!plus) {
      plus = document.createElement('button');
      plus.type = 'button';
      plus.className = 'ax-plus';
      plus.textContent = '⊕';
      plus.title = T('افزودن هشدار', 'Add alert');
      plus.addEventListener('click', function (e) {
        try { if (e && e.stopPropagation) e.stopPropagation(); } catch (e2) {}
        if (lastPxTagPrice == null) return;
        var mul = (window.__dispMul && isFinite(window.__dispMul)) ? window.__dispMul : 1;
        var r = null;
        try { r = plus.getBoundingClientRect(); } catch (e3) {}
        showPriceAxisMenu(lastPxTagPrice * mul, r ? (r.left + r.width / 2) : 100, r ? (r.top + r.height / 2) : 100);
      });
      tag.appendChild(plus);
    }
    var tx = tag.querySelector('.lpx-tx');
    if (!tx) {
      tx = document.createElement('span');
      tx.className = 'lpx-tx';
      tag.appendChild(tx);
    }
    tx.textContent = (typeof window.__pfmt === 'function' ? window.__pfmt(px) : fmt(px));
    var yy = Math.max(9, Math.min((G.ph || 240) - 9, y));
    tag.style.top = yy + 'px';
    tag.className = (c.c >= c.o) ? '' : 'dn';
    tag.style.display = '';
    var tr = document.getElementById('axisTrack');
    if (tr) { tr.style.top = Math.max(0, Math.min(G.ph, y)) + 'px'; tr.style.display = ''; }
  }
  function wrapHeadOnce() {
    if (window.__pxTagWrapped || typeof window.head !== 'function') return;
    window.__pxTagWrapped = true;
    var _head = window.head;
    window.head = function () {
      var r = _head.apply(this, arguments);
      try { positionLastPxTag(); } catch (e) {} // v1.14.8 — برچسب + ⊕ با هر رسم سر قیمتش می‌مانند.
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
      applyDispMul(); // v1.6.0 — مخرج نرخ تبدیل تومان با قیمت تازهٔ دلاری به‌روز می‌شود.
      updateLivePrice(tk.price);
      checkAlertsNow(state.priceMode === 'iran' && state.priceIran ? state.priceIran.price : tk.price); // v1.9.0
      if (typeof tk.changePct === 'number') {
        // تغییر ۲۴س را تازه کن — renderPriceBox خودش بج زنده را هم می‌گذارد.
        renderPriceBox(false, false);
      }
      if (state.priceMode === 'iran') { try { window.draw(); window.head(); } catch (e) {} }
    }
    // v1.6.0 — قیمت تومان را هم تازه کن (هر ~۳۰ ثانیه) تا در حالت تومان، باکس و
    // چارت با نرخ روز بمانند و نرخ تبدیل چارت کهنه نشود.
    live.pollN = (live.pollN || 0) + 1;
    if (live.pollN % 3 === 0 && state.quote && state.quote.symbol === live.sym) {
      var ip = await iranCryptoPrice(state.quote.symbol);
      if (ip && state.quote && state.quote.symbol === live.sym) {
        state.priceIran = ip; applyDispMul();
        if (state.priceMode === 'iran') { renderPriceBox(false, false); try { window.draw(); window.head(); } catch (e) {} }
      }
    }
  }
  function mergeLiveKline(k) {
    var cs = state.candles;
    if (!cs || !cs.length) return;
    var last = cs[cs.length - 1];
    if (last && last.t === k.t) { cs[cs.length - 1] = k; }
    else if (!last || k.t > last.t) { cs.push(k); }
    else return;
    if (cs.length > 500) cs.splice(0, cs.length - 500);
    window.cs = cs;
    updateLivePrice(k.c);
    checkAlertsNow(k.c); // v1.9.0 — تیک WS کندل هم هشدار را چک می‌کند.
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

  /* ---- هشدار قیمت v1.9.0 (به سبک تریدینگ‌ویو) ----
     موتور: alerts-src.js (localStorage + تشخیص عبور با تغییر سمت).
     بررسی فقط وقتی مینی‌اپ باز است: کریپتو با تیک زنده/پولینگ، بقیه با پولینگ
     ۳۰ ثانیه‌ای وقتی هشدار فعال دارند. وقتی بسته است هیچ هشداری نمی‌رسد. */
  var alertTimer = null;
  var alertBannerTimer = null, axisMenuPrice = null;
  /* v1.11.2 — قیمت لحظه‌ای هر نمادِ دارای هشدار فعال (برای ردیف‌های مودال). */
  var liveAlertPrices = {};
  var alertLiveTimer = null;
  /* v1.9.1 — وضعیت کراس‌هیر (سطح بیرونی تا تست و head هم ببینند). */
  var xhPinned = false;
  function curAlertPrice() {
    if (state.priceMode === 'iran' && state.priceIran) return state.priceIran.price;
    return state.priceUsd ? state.priceUsd.price : null;
  }
  function checkAlertsNow(price) {
    var q = state.quote;
    if (!q || price == null || typeof price !== 'number' || !isFinite(price)) return;
    var fired = [];
    try { if (window.OnellaAlerts) fired = window.OnellaAlerts.check(q.symbol, price, Date.now()) || []; } catch (e) {}
    if (!fired.length) return;
    fired.forEach(showAlertFired);
    refreshAlertBadge();
    try { window.draw(); } catch (e) {}
  }
  function showAlertFired(a) {
    ensureAlertUI();
    var b = $('alertBanner');
    if (!b) return;
    var tm = '';
    try { tm = window.OnellaDate ? window.OnellaDate.fmt(a.firedAt || Date.now(), 'hm') : new Date(a.firedAt || Date.now()).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); } catch (e) {}
    b.innerHTML = '<span class="al-bell">' + ICON.bell + '</span><span class="al-bmsg">' + esc(a.msg || '') + '</span><span class="al-bpx">' + esc(fmt(a.firedPrice)) + ' • ' + esc(tm) + '</span><button class="al-bx" id="alBannerX" type="button">✕</button>';
    b.style.display = 'flex';
    var x = $('alBannerX');
    if (x) x.addEventListener('click', function () { b.style.display = 'none'; });
    if (alertBannerTimer) { try { clearTimeout(alertBannerTimer); } catch (e) {} }
    alertBannerTimer = setTimeout(function () { try { b.style.display = 'none'; } catch (e) {} }, 15000);
    try { if (tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
    renderAlertList();
  }
  function refreshAlertBadge() {
    var bd = $('alertBadge');
    if (!bd) return;
    var n = 0;
    try { if (window.OnellaAlerts && state.quote) n = window.OnellaAlerts.listActive(state.quote.symbol).length; } catch (e) {}
    bd.textContent = String(n);
    bd.style.display = n > 0 ? '' : 'none';
  }
  async function fetchCurrentPrice(q) {
    try {
      if (q.provider === 'binance') { var tk = await binanceTicker(q.symbol); return tk ? tk.price : null; }
      if (q.provider === 'yahoo') { var yq = await yahooQuote(q.symbol); return yq ? yq.price : null; }
      if (q.provider === 'iran-rate') { var ir = await iranRate(q.symbol); return ir ? ir.price : null; }
      if (q.provider === 'mofid') { var cs2 = await mofidCandles(q, '1d'); return (cs2 && cs2.length) ? cs2[cs2.length - 1].c : null; }
    } catch (e) {}
    return null;
  }
  async function alertPollTick() {
    if (document.hidden || state.view !== 'symbol' || !state.quote) return;
    var q = state.quote;
    var has = false;
    try { has = !!(window.OnellaAlerts && window.OnellaAlerts.listActive(q.symbol).length); } catch (e) {}
    if (!has) { stopAlertPoll(); return; }
    var p = await fetchCurrentPrice(q);
    if (p == null || !isFinite(p)) return;
    if (q.provider !== 'binance') { updateLivePrice(p); }
    checkAlertsNow(p);
  }
  function startAlertPoll() {
    stopAlertPoll();
    if (!state.quote || state.quote.provider === 'binance') return;
    var has = false;
    try { has = !!(window.OnellaAlerts && window.OnellaAlerts.listActive(state.quote.symbol).length); } catch (e) {}
    if (!has) return;
    alertTimer = setInterval(alertPollTick, 30000);
  }
  function stopAlertPoll() { if (alertTimer) { try { clearInterval(alertTimer); } catch (e) {} alertTimer = null; } }
  /* v1.11.2 — قیمت لحظه‌ای هشدارها: برای هر نمادِ دارای هشدار فعال، قیمت
     را می‌گیرد (از همان مسیر قیمت صفحه) و اگر مودال باز است، فهرست را
     دوباره می‌کشد تا «قیمت الان» زیر هر هشدار تازه شود. */
  function quoteForSymbol(sym) {
    try {
      var keys = Object.keys(MARKETS || {});
      for (var ki = 0; ki < keys.length; ki++) {
        var g = MARKETS[keys[ki]];
        if (!g || !g.quotes) continue;
        for (var i = 0; i < g.quotes.length; i++) if (g.quotes[i].symbol === sym) return g.quotes[i];
      }
    } catch (e) {}
    return null;
  }
  async function refreshAlertLivePrices() {
    var A = window.OnellaAlerts;
    if (!A) return;
    var act = [];
    try { act = A.listActive(); } catch (e) { act = []; }
    var seen = {};
    for (var i = 0; i < act.length; i++) {
      var sym = act[i].sym;
      if (seen[sym]) continue;
      seen[sym] = true;
      var q = quoteForSymbol(sym);
      if (!q) continue;
      var p = await fetchCurrentPrice(q);
      if (p != null && isFinite(p)) liveAlertPrices[sym] = { price: p, at: Date.now() };
    }
    var m = $('alertModal');
    if (m && m.style.display !== 'none') renderAlertList();
  }
  function startAlertLivePrices() {
    stopAlertLivePrices();
    refreshAlertLivePrices();
    alertLiveTimer = setInterval(refreshAlertLivePrices, 30000);
  }
  function stopAlertLivePrices() { if (alertLiveTimer) { try { clearInterval(alertLiveTimer); } catch (e) {} alertLiveTimer = null; } }
  function ensureAlertUI() {
    if ($('alertModal')) return;
    var bd = document.body;
    var banner = document.createElement('div');
    banner.id = 'alertBanner'; banner.className = 'al-banner'; banner.style.display = 'none';
    bd.appendChild(banner);
    var modal = document.createElement('div');
    modal.id = 'alertModal'; modal.className = 'al-modal'; modal.style.display = 'none';
    modal.innerHTML = '<div class="al-card">'
      + '<div class="al-top"><b id="alTitle"></b><button class="tbtn" id="alClose" type="button">✕</button></div>'
      + '<div class="al-now" id="alNow"></div>'
      + '<label class="al-lb">' + esc(T('شرط', 'Condition')) + '<select id="alCond" class="al-in">'
      + '<option value="cross">' + esc(T('عبور (هر جهت)', 'Crossing')) + '</option>'
      + '<option value="crossUp">' + esc(T('عبور به بالا', 'Crossing up')) + '</option>'
      + '<option value="crossDown">' + esc(T('عبور به پایین', 'Crossing down')) + '</option>'
      + '<option value="above">' + esc(T('بالاتر از', 'Greater than')) + '</option>'
      + '<option value="below">' + esc(T('پایین‌تر از', 'Less than')) + '</option></select></label>'
      + '<label class="al-lb">' + esc(T('قیمت', 'Price')) + '<input id="alPrice" class="al-in" inputmode="decimal" autocomplete="off"></label>'
      + '<label class="al-lb">' + esc(T('تکرار', 'Trigger')) + '<select id="alRepeat" class="al-in">'
      + '<option value="once">' + esc(T('فقط یک بار', 'Once only')) + '</option>'
      + '<option value="every">' + esc(T('هر بار', 'Every time')) + '</option></select></label>'
      + '<label class="al-lb">' + esc(T('انقضا', 'Expiration')) + '<select id="alExp" class="al-in">'
      + '<option value="2592000000">' + esc(T('۱ ماه', '1 month')) + '</option>'
      + '<option value="604800000">' + esc(T('۱ هفته', '1 week')) + '</option>'
      + '<option value="86400000">' + esc(T('۱ روز', '1 day')) + '</option>'
      + '<option value="">' + esc(T('بدون انقضا', 'No expiration')) + '</option></select></label>'
      + '<label class="al-lb">' + esc(T('پیام', 'Message')) + '<input id="alMsg" class="al-in" autocomplete="off" maxlength="120"></label>'
      + '<label class="al-ck"><input type="checkbox" id="alTelegram"><span>' + esc(T('📲 پیام تلگرام هنگام فعال‌شدن', '📲 Telegram message when it triggers')) + '</span></label>'
      + '<div class="al-tgnote" id="alTgNote"></div>'
      + '<div class="al-note">' + esc(T('اعلان درون‌برنامه (بنر + نشان) فقط وقتی مینی‌اپ باز است می‌رسد. با «پیام تلگرام» وقتی قیمت برسد در چت پیام می‌دهد — حتی اگر کامپیوتر خاموش باشد.', 'In-app notification (banner + badge) only arrives while the Mini App is open. With “Telegram message”, you get a chat message when the price gets there — even if the PC is off.')) + '</div>'
      + '<div class="al-err" id="alErr" style="display:none"></div>'
      + '<div class="al-actions"><button class="tbtn on" id="alCreate" type="button">' + esc(T('ایجاد هشدار', 'Create alert')) + '</button><button class="tbtn" id="alCancel" type="button">' + esc(T('انصراف', 'Cancel')) + '</button></div>'
      + '<div class="al-list-h">' + esc(T('هشدارهای من', 'My alerts')) + '</div>'
      + '<div id="alList"></div></div>';
    bd.appendChild(modal);
    $('alClose').addEventListener('click', function () { modal.style.display = 'none'; stopAlertLivePrices(); });
    $('alCancel').addEventListener('click', function () { modal.style.display = 'none'; stopAlertLivePrices(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) { modal.style.display = 'none'; stopAlertLivePrices(); } });
    $('alCreate').addEventListener('click', function () { createAlertFromModal(); });
  }
  function toLatinNum(s) {
    return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/[٬,]/g, '').trim();
  }
  /* ===== v1.14.7 — ساعت زنده + انتخاب‌گر منطقهٔ زمانی (به سبک تریدینگ‌ویو) ===== */
  var tzTickTimer = null;
  function updateClock() {
    var b = $('tzClockBtn');
    if (!b) return;
    try {
      b.textContent = window.OnellaTZ ? window.OnellaTZ.fmtClock(Date.now()) : '';
    } catch (e) {}
  }
  function startClockTick() {
    if (tzTickTimer) { updateClock(); return; }
    updateClock();
    tzTickTimer = setInterval(function () { updateClock(); }, 1000);
  }
  /* زونِ صرافیِ نماد فعلی (ردیف «Exchange» در انتخاب‌گر): بورس ایران → تهران،
     یاهو (سهام آمریکا) → نیویورک، کریپتو/فارکس → UTC. */
  function exchangeZoneFor() {
    var q = state.quote || {};
    if (q.provider === 'mofid' || q.mode === 'iran' || state.priceMode === 'iran') return 'Asia/Tehran';
    if (q.provider === 'yahoo') return 'America/New_York';
    return 'UTC';
  }
  function ensureTZUI() {
    var m = $('tzModal');
    if (m) return m;
    var d = document.createElement('div');
    d.id = 'tzModal'; d.className = 'al-modal';
    d.innerHTML = '<div class="al-card"><div class="al-h"><b>' + esc(T('منطقهٔ زمانی', 'Timezone')) + '</b><button class="tbtn" id="tzClose" type="button">✕</button></div>'
      + '<label class="o-input"><input id="tzSearch" type="search" placeholder="' + esc(T('جستجوی شهر…', 'Search city…')) + '" autocomplete="off"></label>'
      + '<div class="tz-list" id="tzList"></div>'
      + '<div class="set-sec-h">' + esc(T('تقویم', 'Calendar')) + '</div><div id="tzCalList"></div></div>';
    document.body.appendChild(d);
    d.addEventListener('click', function (e) { if (e.target === d) d.style.display = 'none'; });
    $('tzClose').addEventListener('click', function () { d.style.display = 'none'; });
    $('tzSearch').addEventListener('input', function () { renderTZList($('tzSearch').value || ''); });
    return d;
  }
  function renderTZList(q) {
    var list = $('tzList'); if (!list) return;
    var TZ = window.OnellaTZ; if (!TZ) return;
    var now = Date.now(), cur = TZ.get(), ex = exchangeZoneFor();
    q = (q || '').trim().toLowerCase();
    var items = [{ iana: 'UTC', fa: 'هماهنگ جهانی' }];
    if (ex !== 'UTC') items.push({ iana: ex, fa: TZ.rowLabel(ex, now), ex: true });
    TZ.sortedZones(now).forEach(function (z) { if (z[0] !== 'UTC' && z[0] !== ex) items.push({ iana: z[0], fa: z[2] }); });
    var rows = '';
    items.forEach(function (it) {
      var lb = it.ex ? 'Exchange' : TZ.rowLabel(it.iana, now);
      if (q) {
        var hay = (it.iana + ' ' + lb + ' ' + (it.fa || '')).toLowerCase();
        if (hay.indexOf(q) < 0) return;
      }
      rows += '<button class="tz-row" type="button" data-tz="' + esc(it.iana) + '"><span class="tz-ck">' + (cur === it.iana ? '✓' : '') + '</span><span class="tz-lb">' + esc(lb) + '</span>' + (it.fa ? '<span class="tz-fa">' + esc(it.fa) + '</span>' : '') + '</button>';
    });
    list.innerHTML = rows || '<div class="al-note">' + esc(T('شهری پیدا نشد.', 'No city found.')) + '</div>';
    list.querySelectorAll('.tz-row').forEach(function (b) {
      b.addEventListener('click', function () { applyTimezone(b.dataset.tz); var m = $('tzModal'); if (m) m.style.display = 'none'; });
    });
  }
  function openTZPicker() {
    var m = ensureTZUI();
    var s = $('tzSearch'); if (s) s.value = '';
    renderTZList('');
    renderCalList();
    m.style.display = 'flex';
  }
  /* v1.14.8 — باگ #۳: انتخاب تقویم در همان شیتِ زمان؛ پیش‌فرض میلادی (قانون
     این خطِ اپ)؛ شمسی و هجری قمری کنارش. در همان فروشگاهِ تاریخ
     (onella_date_v1) ذخیره می‌شود — مستقل از منطقهٔ زمانی. */
  var CAL_OPTS = [['gregory', 'میلادی', 'Gregorian'], ['persian', 'شمسی', 'Solar Hijri'], ['islamic', 'هجری قمری', 'Lunar Hijri']];
  function renderCalList() {
    var list = $('tzCalList'); if (!list) return;
    var OD = window.OnellaDate; if (!OD) return;
    var cur = 'gregory';
    try { cur = (OD.get() && OD.get().cal) || 'gregory'; } catch (e) {}
    list.innerHTML = CAL_OPTS.map(function (c) {
      return '<button class="tz-row" type="button" data-cal="' + c[0] + '"><span class="tz-ck">' + (cur === c[0] ? '✓' : '') + '</span><span class="tz-lb">' + esc(lang === 'fa' ? c[1] : c[2]) + '</span></button>';
    }).join('');
    list.querySelectorAll('.tz-row').forEach(function (b) {
      b.addEventListener('click', function () {
        try { if (OD.set) OD.set(b.dataset.cal); } catch (e) {}
        renderCalList();
        try { window.draw(); window.head(); } catch (e2) {}
        try { if (state.tab === 'news') renderNews(); } catch (e3) {}
        try { var am = $('alertModal'); if (am && am.style.display !== 'none') renderAlertList(); } catch (e4) {}
        try { if (state.view === 'dashboard') loadDash(); } catch (e5) {}
      });
    });
  }
  function applyTimezone(iana) {
    if (!window.OnellaTZ || !window.OnellaTZ.set(iana)) return;
    updateClock();
    try { window.draw(); window.head(); } catch (e) {}
    /* اگر تب خبر باز است، زمان‌هایش را هم با زون تازه رندر کن؛ فهرست هشدار هم اگر باز است. */
    try { if (state.tab === 'news') renderNews(); } catch (e) {}
    try { var am = $('alertModal'); if (am && am.style.display !== 'none') renderAlertList(); } catch (e) {}
  }
  function openAlertModal(prefillPrice) {
    ensureAlertUI();
    var q = state.quote;
    if (!q) return;
    var m = $('alertModal');
    $('alTitle').textContent = T('هشدار در ', 'Alert on ') + q.display;
    var now = curAlertPrice();
    $('alNow').textContent = (now != null ? T('قیمت فعلی: ', 'Current price: ') + fmt(now) : '');
    var p = (prefillPrice != null && isFinite(prefillPrice)) ? prefillPrice : now;
    $('alPrice').value = (p != null) ? String(p) : '';
    $('alCond').value = 'cross';
    $('alRepeat').value = 'once';
    $('alExp').value = '2592000000';
    try { $('alMsg').value = window.OnellaAlerts ? window.OnellaAlerts.defaultMsg({ sym: q.symbol, label: q.display, cond: 'cross', price: (p != null ? p : 0) }, lang) : ''; } catch (e) { $('alMsg').value = ''; }
    /* v1.10.0 — گزینهٔ «پیام تلگرام»: فقط وقتی sendData هست (مینی‌اپ از دکمهٔ
       ربات باز شده) و نماد قابل‌نگهبانی ربات است (کریپتو/سهام؛ ایران فعلاً نه). */
    var canTg = !!(tg && typeof tg.sendData === 'function');
    var shareable = q.provider === 'binance' || q.provider === 'yahoo';
    var cb = $('alTelegram'), nt = $('alTgNote');
    if (cb) { cb.checked = canTg && shareable; cb.disabled = !(canTg && shareable); }
    if (nt) {
      nt.textContent = !canTg
        ? T('برای پیام تلگرام، مینی‌اپ را از دکمهٔ ربات باز کن.', 'To get Telegram messages, open the Mini App from the bot button.')
        : !shareable
          ? T('پیام تلگرام فعلاً فقط برای کریپتو و سهام است؛ برای نمادهای ایران فقط داخل مینی‌اپ.', 'Telegram messages work for crypto and stocks for now; for Iran symbols, in-app only.')
          : T('وقتی قیمت برسد، در تلگرام پیام می‌دهد — حتی اگر کامپیوتر خاموش باشد.', 'When the price gets there, you get a Telegram message — even if the PC is off.');
    }
    $('alErr').style.display = 'none';
    renderAlertList();
    startAlertLivePrices(); // v1.11.2 — قیمت لحظه‌ای زیر هشدارهای فعال
    if (window.OnellaAlerts && window.OnellaAlerts.ready) {
      window.OnellaAlerts.ready.then(function () { try { renderAlertList(); refreshAlertBadge(); } catch (e) {} }).catch(function () {});
    }
    m.style.display = 'flex';
  }
  function renderAlertList() {
    var el = $('alList');
    if (!el || !state.quote) return;
    var q = state.quote, A = window.OnellaAlerts;
    if (!A) { el.innerHTML = ''; return; }
    var canShare = (q.provider === 'binance' || q.provider === 'yahoo') && !!(tg && typeof tg.sendData === 'function');
    /* v1.11.0 — همهٔ هشدارها دیده می‌شوند: نماد فعلی اول، بعد سایر نمادها.
       قبلاً فقط A.list(q.symbol) بود و هشدار نمادهای دیگر اینجا دیده نمی‌شد. */
    var all = A.list();
    var cur = all.filter(function (x) { return x.sym === q.symbol; });
    var others = all.filter(function (x) { return x.sym !== q.symbol; });
    function expTxt(a) {
      if (!a.expiresAt) return '';
      try { return ' • ' + T('تا ', 'until ') + (window.OnellaDate ? window.OnellaDate.fmt(a.expiresAt, 'cd') : new Date(a.expiresAt).toLocaleDateString('fa-IR-u-ca-gregory')); } catch (e) { return ''; }
    }
    function row(a, kind) {
      var sub = A.condLabel(a.cond, lang) + ' ' + fmt(a.price) + ' • ' + (a.repeat === 'every' ? T('هر بار', 'Every time') : T('فقط یک بار', 'Once only')) + expTxt(a);
      /* v1.11.2 — قیمت لحظه‌ای زیر هر هشدار فعال + فاصله تا هدف. */
      if (kind === 'active' && liveAlertPrices[a.sym]) {
        var lp = liveAlertPrices[a.sym].price;
        var pct = (lp - a.price) / a.price * 100;
        sub += ' • 📍 ' + fmt(lp) + ' (' + (pct > 0 ? '+' : '') + pct.toFixed(1) + '% ' + T('تا هدف', 'to target') + ')';
      }
      var fired = '';
      if (kind === 'fired' && a.firedAt) {
        try { fired = ' • ' + T('فعال شد ', 'Fired ') + (window.OnellaDate ? window.OnellaDate.fmt(a.firedAt, 'hm') : new Date(a.firedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })); } catch (e) {}
      }
      var tgBadge = a.shared ? ' <span class="al-tg">📲</span>' : '';
      var btns = '';
      if (kind === 'active') {
        btns = '<button class="tbtn" data-act="off" data-id="' + a.id + '" type="button">' + esc(T('خاموش', 'Off')) + '</button>';
        /* v1.11.0 — دکمهٔ اشتراک بر اساس provider خودِ آلرت، نه نماد فعلی
           (در بخش «سایر نمادها» نماد فعلی فرق می‌کند). */
        var aShare = ((a.provider === 'binance' || a.provider === 'yahoo') || (!a.provider && canShare)) && !!(tg && typeof tg.sendData === 'function');
        if (aShare) {
          btns += a.shared
            ? '<button class="tbtn" data-act="unshare" data-id="' + a.id + '" type="button">📵</button>'
            : '<button class="tbtn" data-act="share" data-id="' + a.id + '" type="button">📲</button>';
        }
      } else btns = '<button class="tbtn" data-act="on" data-id="' + a.id + '" type="button">' + esc(T('دوباره فعال', 'Re-enable')) + '</button>';
      btns += '<button class="tbtn" data-act="del" data-id="' + a.id + '" type="button">✕</button>';
      return '<div class="al-row"><div class="al-row-tx"><b>' + esc(a.msg || '') + tgBadge + '</b><span>' + esc(sub + fired) + '</span></div><div class="al-row-bt">' + btns + '</div></div>';
    }
    var act = cur.filter(function (a) { return a.active; });
    var fired = cur.filter(function (a) { return !a.active && a.firedAt; });
    var other = cur.filter(function (a) { return !a.active && !a.firedAt; });
    var html = '';
    if (!all.length) html = '<div class="na">' + esc(T('هنوز هشداری نساخته‌ای.', 'No alerts yet.')) + '</div>';
    else {
      if (act.length) html += '<div class="al-sec">' + esc(T('فعال', 'Active')) + '</div>' + act.map(function (a) { return row(a, 'active'); }).join('');
      if (fired.length) html += '<div class="al-sec">' + esc(T('فعال‌شده', 'Triggered')) + '</div>' + fired.map(function (a) { return row(a, 'fired'); }).join('');
      if (other.length) html += '<div class="al-sec">' + esc(T('خاموش / منقضی', 'Off / expired')) + '</div>' + other.map(function (a) { return row(a, 'other'); }).join('');
      if (others.length) {
        var oAct = others.filter(function (a) { return a.active; });
        var oRest = others.filter(function (a) { return !a.active; });
        html += '<div class="al-sec">' + esc(T('سایر نمادها', 'Other symbols') + ' (' + others.length + ')') + '</div>';
        if (oAct.length) html += oAct.map(function (a) { return row(a, 'active'); }).join('');
        if (oRest.length) html += oRest.map(function (a) { return row(a, a.firedAt ? 'fired' : 'other'); }).join('');
      }
    }
    el.innerHTML = html;
    el.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.id, act2 = b.dataset.act;
        if (act2 === 'del') A.remove(id);
        else if (act2 === 'off') A.setActive(id, false);
        else if (act2 === 'on') A.setActive(id, true);
        else if (act2 === 'share' || act2 === 'unshare') {
          var sa = A.list().filter(function (x) { return x.id === id; })[0];
          if (sa) { if (act2 === 'share') shareAlertToBot(sa); else unshareAlertToBot(sa); }
        }
        renderAlertList(); refreshAlertBadge(); startAlertPoll();
        try { window.draw(); } catch (e) {}
      });
    });
  }
  function createAlertFromModal() {
    var q = state.quote;
    if (!q) return;
    var err = $('alErr');
    var price = parseFloat(toLatinNum($('alPrice').value));
    if (!isFinite(price) || price <= 0) { err.textContent = T('قیمت معتبر وارد کن.', 'Enter a valid price.'); err.style.display = ''; return; }
    var exp = $('alExp').value;
    var a = null;
    try {
      a = window.OnellaAlerts.add({
        sym: q.symbol, label: q.display, mode: state.priceMode, provider: q.provider,
        cond: $('alCond').value, price: price, repeat: $('alRepeat').value,
        expiresAt: exp ? Date.now() + parseInt(exp, 10) : null,
        msg: $('alMsg').value
      });
    } catch (e) {}
    if (!a) { err.textContent = T('هشدار ساخته نشد — سقف ۵۰ هشدار فعال است.', 'Alert was not created — the 50 active-alert limit is reached.'); err.style.display = ''; return; }
    var wantTg = false;
    try { wantTg = !!($('alTelegram') && $('alTelegram').checked); } catch (e) {}
    var be = null;
    try { be = window.OnellaAlerts ? window.OnellaAlerts.backend() : null; } catch (e) {}
    $('alertModal').style.display = 'none';
    refreshAlertBadge(); startAlertPoll();
    if (wantTg) shareAlertToBot(a);
    else if (be && be.cloud && be.cloudError) showAlertNote(T('هشدار در گوشی ذخیره شد ولی در فضای ابری تلگرام نرفت — دفعهٔ بعد دوباره چک کن.', 'Alert saved on this phone but not to Telegram cloud — please check next time.'));
    try { window.draw(); } catch (e) {}
  }
  /* v1.11.0 — آلرت مشترک: اول ورکر (POST /alert-add با initData) — ورکر
     همان لحظه تأیید تلگرام می‌فرستد و Cron شلیک می‌کند (PC خاموش هم کار
     می‌کند). فقط اگر ورکر جواب ندهد/تنظیم نشده باشد، به sendData (ربات روی
     PC) برمی‌گردد — هرگز هر دو با هم ثبت نمی‌شوند (دو پیام/دو شلیک نمی‌آید).
     shared را پیش از sendData می‌زنیم، چون sendData ممکن است مینی‌اپ را ببندد. */
  function showAlertNote(text) {
    ensureAlertUI();
    var b = $('alertBanner');
    if (!b) return;
    b.innerHTML = '<span class="al-bmsg">' + esc(text || '') + '</span><button class="al-bx" id="alBannerX" type="button">✕</button>';
    b.style.display = 'flex';
    var x = $('alBannerX');
    if (x) x.addEventListener('click', function () { b.style.display = 'none'; });
    if (alertBannerTimer) { try { clearTimeout(alertBannerTimer); } catch (e) {} }
    alertBannerTimer = setTimeout(function () { try { b.style.display = 'none'; } catch (e) {} }, 15000);
  }
  async function shareAlertToBot(a) {
    var A = window.OnellaAlerts;
    if (!a || !A) return false;
    /* مسیر ۱ — ورکر: سریع و بدون PC. initData را می‌فرستیم تا ورکر هویت
       تلگرام را اعتبارسنجی کند؛ توکن هرگز به مینی‌اپ نمی‌آید. */
    if (PROXY_URL && tg && typeof tg.initData === 'string' && tg.initData) {
      try {
        var r = await fetch(PROXY_URL.replace(/\/$/, '') + '/alert-add', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData, alert: { miniAppId: a.id, sym: a.sym, label: a.label, provider: a.provider || (state.quote && state.quote.provider) || null, cond: a.cond, price: a.price, repeat: a.repeat, expiresAt: a.expiresAt, msg: a.msg } }),
          signal: AbortSignal.timeout(10000)
        });
        if (r && r.ok) {
          var j = null; try { j = await r.json(); } catch (e) { j = null; }
          if (j && j.ok) { A.setShared(a.id, true, 'worker'); renderAlertList(); refreshAlertBadge(); return true; }
          if (j && j.error === 'unsupported') {
            showAlertNote(T('این نماد را فعلاً نمی‌توان نگهبانی کرد (فقط کریپتو و سهام) — هشدار داخل مینی‌اپ سر جایش هست.', 'This symbol cannot be watched yet (crypto and stocks only) — your in-app alert still works.'));
            return false;
          }
          /* no_kv / no_token / bad_initdata / limit / bad → به مسیر ۲ می‌افتد. */
        }
      } catch (e) { /* به sendData می‌افتد */ }
    }
    /* مسیر ۲ — fallback: sendData به ربات روی PC (همان v1.10.0). */
    if (!(tg && typeof tg.sendData === 'function')) {
      showAlertNote(T('پیام تلگرام فرستاده نشد: مینی‌اپ را از دکمهٔ ربات باز کن.', 'Telegram message was not sent: open the Mini App from the bot button.'));
      return false;
    }
    var payload = {
      type: 'onella_alert_add', v: 1,
      alert: { miniAppId: a.id, sym: a.sym, label: a.label, cond: a.cond, price: a.price, repeat: a.repeat, expiresAt: a.expiresAt, msg: a.msg }
    };
    A.setShared(a.id, true, 'bot');
    try { tg.sendData(JSON.stringify(payload)); } catch (e) {
      A.setShared(a.id, false);
      showAlertNote(T('پیام تلگرام فرستاده نشد — دوباره امتحان کن.', 'Telegram message was not sent — please try again.'));
      return false;
    }
    renderAlertList(); refreshAlertBadge();
    return true;
  }
  async function unshareAlertToBot(a) {
    var A = window.OnellaAlerts;
    if (!a || !A) return false;
    if (a.sharedVia === 'worker' && PROXY_URL && tg && typeof tg.initData === 'string' && tg.initData) {
      try {
        await fetch(PROXY_URL.replace(/\/$/, '') + '/alert-del', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData, miniAppId: a.id }),
          signal: AbortSignal.timeout(10000)
        });
      } catch (e) { /* بهترین تلاش؛ حذف محلی حتماً انجام می‌شود */ }
    } else if (tg && typeof tg.sendData === 'function') {
      try { tg.sendData(JSON.stringify({ type: 'onella_alert_del', v: 1, miniAppId: a.id })); } catch (e) {}
    }
    A.setShared(a.id, false);
    renderAlertList(); refreshAlertBadge();
    return true;
  }
  /* v1.14.8 — باگ #۱: دیگر برچسبِ جداگانهٔ ⊕ نیست؛ ⊕ به برچسب قیمت آخر چسبیده
     (positionLastPxTag) و همان قیمت را نشان می‌دهد. خط‌چین نارنجی هم روی همان
     قیمت است. پس این‌جا فقط قیمتِ y روی محور مانده است. */
  function axisPriceAtY(y) {
    var G = window.__geo;
    if (!G || typeof G.inv !== 'function' || !(G.ph > 0)) return null;
    var p = G.inv(Math.max(0, Math.min(G.ph, y)));
    return (typeof p === 'number' && isFinite(p)) ? p : null;
  }
  /* v1.9.1 — آهنربای نرم کراس‌هیر (سبک تریدینگ‌ویو): خط افقی آزادانه قیمتِ زیر
     انگشت را نشان می‌دهد، ولی اگر تا ۱۰ پیکسلِ یکی از O/H/L/C کندلِ زیر نشانگر
     باشد، نرم روی همان قیمت می‌نشیند («قفل کوچک») — قفلِ کامل نیست، با کمی
     جابه‌جایی رها می‌شود و دوباره آزاد می‌شود. */
  function snapXhPrice(price, candle) {
    if (price == null || !isFinite(price) || !candle) return price;
    var G = window.__geo;
    if (!G || !(G.hi > G.lo) || !(G.ph > 0)) return price;
    var span = (G.ph - (G.vh || 0)) || G.ph;
    var thr = Math.abs(G.hi - G.lo) * 10 / Math.max(1, span);
    var best = null, bd = Infinity;
    ['o', 'h', 'l', 'c'].forEach(function (k) {
      var v = candle[k];
      if (typeof v !== 'number' || !isFinite(v)) return;
      var d = Math.abs(v - price);
      if (d < bd) { bd = d; best = v; }
    });
    return (best != null && bd <= thr) ? best : price;
  }
  function xhPriceAtY(y) {
    var raw = axisPriceAtY(y);
    if (raw == null) { window.__xhPrice = null; return null; }
    var G = window.__geo, c = null;
    try {
      var idx = (G && typeof G.off === 'number' && typeof window.cur === 'number') ? G.off + window.cur : -1;
      if (idx >= 0 && state.candles && state.candles[idx]) c = state.candles[idx];
    } catch (e) {}
    var p = snapXhPrice(raw, c);
    window.__xhPrice = p;
    return p;
  }
  function dismissCrosshair() {
    xhPinned = false;
    window.cur = -1;
    window.__xhPrice = null;
    try { window.head(); window.draw(); } catch (e) {}
  }
  /* v1.14.8 — پین کردن کراس‌هیر روی کندل i (برای اسکراب از پنل‌های اندیکاتور):
     مثل ضربهٔ پین‌شده روی چارت عمل می‌کند؛ ضربهٔ بعدی روی چارت آن را می‌گیرد. */
  function pinCrosshairAt(i) {
    var cs = window.cs || [];
    if (typeof i !== 'number' || !isFinite(i) || i < 0 || i >= cs.length) return false;
    window.cur = i;
    window.__xhPrice = null;
    xhPinned = true;
    try { window.head(); window.draw(); } catch (e) {}
    return true;
  }
  window.__pinXh = pinCrosshairAt;
  /* v1.14.8 — فوتر «⌄/⌃» پنل ابزار: ردیف ثابتِ پایین پنل است (نه وسط لیست)؛
     فقط وقتی نوار باز است دیده می‌شود؛ ⌄ یعنی هنوز پایین‌تر گزینه هست،
     ⌃ یعنی در انتهای لیست‌ایم (زدن برمی‌گردد بالا). */
  function updateStripMore() {
    var strip = $('toolsStrip'), more = $('stripMore');
    if (!strip || !more) return;
    if (!strip.classList.contains('open')) { more.style.display = 'none'; return; }
    more.style.display = '';
    var sh = strip.scrollHeight || 0, ch = strip.clientHeight || 0, st = strip.scrollTop || 0;
    more.textContent = (sh > ch + 4 && st + ch < sh - 4) ? '﹀' : '⌃';
  }
  function showPriceAxisMenu(price, clientX, clientY) {
    /* v1.14.7 — شیت پایین (مثل تریدینگ‌ویو، ولی فقط «افزودن هشدار» — بدون
       ردیف معامله و بدون «خط افقی»؛ اپ معامله نمی‌کند). price قیمت نمایشی است. */
    if (price == null || !isFinite(price) || !state.quote) return;
    var sheet = $('axisSheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'axisSheet'; sheet.className = 'al-modal'; sheet.style.display = 'none';
      sheet.innerHTML = '<div class="al-card"><div class="al-h"><b id="axSheetTitle"></b><button class="tbtn" id="axSheetClose" type="button">✕</button></div><div id="axSheetBody"></div></div>';
      document.body.appendChild(sheet);
      sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.style.display = 'none'; });
      $('axSheetClose').addEventListener('click', function () { sheet.style.display = 'none'; });
    }
    var q = state.quote || {};
    var disp = (q.display || q.label || q.symbol || '');
    var pxTxt = fmt(price);
    $('axSheetTitle').textContent = disp;
    $('axSheetBody').innerHTML = '<button class="sheet-row" id="axSheetAlert" type="button">' + ICON.alarm + '<span>' + esc(T('هشدار در ', 'Add alert on ') + disp + T(' در ', ' at ') + pxTxt) + '</span></button>';
    $('axSheetAlert').addEventListener('click', function () {
      sheet.style.display = 'none';
      openAlertModal(price);
    });
    sheet.style.display = 'flex';
  }

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
    /* v1.7.0 — تحلیل پیشرفته: جهت کوتاه‌مدت (تایم‌فریم انتخابی) و بلندمدت،
       با دلیل‌ها و شرط تغییر جهت + آیکون سبز/قرمز/زرد. کنار کارت‌های نمایشی
       اطلاعات می‌نشیند — جای آن‌ها را نمی‌گیرد. توصیفی است، نه سیگنال. */
    var adv = null;
    try { adv = window.OnellaAnalysis.analyzeAdvanced ? window.OnellaAnalysis.analyzeAdvanced(state.candles, state.tf) : null; } catch (e) {}
    var verdictHtml = '';
    if (adv) {
      var sDir = adv.short.dir, lDir = adv.long.dir;
      var sWord = dirWord(sDir), lWord = dirWord(lDir);
      var sCls = sDir === 'bull' ? 'up' : sDir === 'bear' ? 'dn' : '';
      var lCls = lDir === 'bull' ? 'up' : lDir === 'bear' ? 'dn' : '';
      var sFor = adv.shortFor.length ? adv.shortFor.join('، ') : '—';
      var sAgainst = adv.shortAgainst.length ? adv.shortAgainst.join('، ') : '—';
      var lReasons = adv.long.reasons.length ? adv.long.reasons.join('؛ ') : '—';
      var flipTxt = '';
      if (adv.flip) {
        if (adv.flip.side === 'below') flipTxt = esc(T('شرط تغییر جهت', 'What would change it')) + ': ' + esc(T('بسته شدن زیر', 'a close below')) + ' ' + esc(adv.flip.label) + ' ' + fmt(adv.flip.level);
        else if (adv.flip.side === 'above') flipTxt = esc(T('شرط تغییر جهت', 'What would change it')) + ': ' + esc(T('بسته شدن بالای', 'a close above')) + ' ' + esc(adv.flip.label) + ' ' + fmt(adv.flip.level);
        else flipTxt = esc(T('شرط تغییر جهت', 'What would change it')) + ': ' + esc(T('بسته شدن بالای یا زیر', 'a close above or below')) + ' ' + esc(adv.flip.label) + ' ' + fmt(adv.flip.level);
      }
      var thinNote = (adv.long.candles < 200) ? '<br><span style="color:var(--mut)">' + esc(T('دادهٔ بلندمدت کم است', 'Long-term data is thin')) + ' (' + adv.long.candles + ' ' + esc(T('کندل', 'candles')) + ')</span>' : '';
      verdictHtml = '<div class="an-card wide an-verdict"><h4>' + ICON.activity + esc(T('تحلیل پیشرفته', 'Advanced analysis')) + ' · <span style="color:var(--acc)">' + esc(state.tf) + '</span></h4>'
        + '<div class="verdict-row"><span class="verdict-ic">' + dirSvg(sDir, 26) + '</span><span class="verdict-tx"><b>' + esc(T('کوتاه‌مدت', 'Short term')) + ' (' + esc(state.tf) + '):</b> <span class="an-big ' + sCls + '" style="font-size:17px">' + esc(sWord) + '</span> <span style="color:var(--mut)">· ' + adv.short.bull + ' ' + esc(T('موافق صعود', 'bull')) + ' / ' + adv.short.bear + ' ' + esc(T('موافق نزول', 'bear')) + '</span><br><span class="an-sub">' + esc(T('موافق', 'For')) + ': ' + esc(sFor) + '<br>' + esc(T('مخالف', 'Against')) + ': ' + esc(sAgainst) + '</span></span></div>'
        + '<div class="verdict-row"><span class="verdict-ic">' + dirSvg(lDir, 26) + '</span><span class="verdict-tx"><b>' + esc(T('بلندمدت', 'Long term')) + ':</b> <span class="an-big ' + lCls + '" style="font-size:17px">' + esc(lWord) + '</span> <span style="color:var(--mut)">· ' + adv.long.bull + ' ' + esc(T('موافق صعود', 'bull')) + ' / ' + adv.long.bear + ' ' + esc(T('موافق نزول', 'bear')) + '</span><br><span class="an-sub">' + esc(lReasons) + thinNote + '</span></span></div>'
        + (flipTxt ? '<div class="verdict-flip">' + flipTxt + '</div>' : '')
        + '</div>';
    }
    var sumTxt = esc(T('روند', 'Trend')) + ' ' + esc(trendTxt)
      + (adxW ? ' · ' + esc(T('قدرت روند', 'trend strength')) + ' ' + esc(adxW) + (a.adx ? ' (ADX ' + a.adx.adx.toFixed(0) + ')' : '') : '')
      + '<br>' + esc(T('همگرایی شاخص‌ها', 'Indicator agreement')) + ': ' + (vTot ? vLead + ' ' + esc(T('از', 'of')) + ' ' + vTot + ' ' + esc(T('موافق', 'agree on')) + ' ' + esc(vDir) : '—')
      + (structW ? '<br>' + esc(T('ساختار', 'Structure')) + ': ' + esc(structW) : '')
      + '<br>' + esc(T('نزدیک‌ترین سطح', 'Nearest level')) + ': ' + esc(T('مقاومت', 'Resistance')) + ' ' + fmt(cs2 ? cs2.R1 : a.hi20) + ' · ' + esc(T('حمایت', 'Support')) + ' ' + fmt(cs2 ? cs2.S1 : a.lo20);
    var html = '<div class="an-grid">'
      + verdictHtml
      + '<div class="an-card wide an-sum"><h4>' + ICON.book + esc(T('خلاصهٔ تحلیل', 'Analysis summary')) + '</h4>'
      + '<div class="an-big ' + trendCls + '">' + dirSvg(a.trend === 'up' ? 'bull' : a.trend === 'down' ? 'bear' : 'flat', 22) + ' ' + esc(trendTxt) + '</div>'
      + '<div class="an-sub">' + sumTxt + '</div></div>'
      + '<div class="an-card an-trend"><h4>' + ICON.trendUp + esc(T('روند', 'Trend')) + ' ' + dirSvg(a.trend === 'up' ? 'bull' : a.trend === 'down' ? 'bear' : 'flat', 18) + '</h4>'
      + '<div class="an-big ' + trendCls + '">' + esc(trendTxt) + '</div>'
      + '<div class="an-sub">EMA20 ' + fmt(a.e20) + ' · EMA50 ' + fmt(a.e50)
      + (a.e200 != null ? '<br>EMA200 ' + fmt(a.e200) + ' (' + (a.longTrend === 'up' ? T('صعودی', 'up') : a.longTrend === 'down' ? T('نزولی', 'down') : T('خنثی', 'neutral')) + ')' : '')
      + (a.e9 != null && a.e21 != null ? '<br>EMA9 ' + fmt(a.e9) + ' · EMA21 ' + fmt(a.e21) + ' — ' + esc(crossTxt) : '')
      + (adxW ? '<br>ADX ' + a.adx.adx.toFixed(1) + ' (' + esc(adxW) + ') · DI+ ' + a.adx.diPlus.toFixed(0) + ' / DI− ' + a.adx.diMinus.toFixed(0) : '')
      + (structW ? '<br>' + esc(structW) : '')
      + '<br>' + esc(T('تغییر', 'Change')) + ' ' + fmtPct(chgS) + ' · ' + fmtPct(chgL) + '</div></div>'
      + '<div class="an-card an-mom"><h4>' + ICON.activity + 'RSI / MACD / Stoch ' + dirSvg(a.rsi == null ? 'flat' : a.rsi >= 55 ? 'bull' : a.rsi <= 45 ? 'bear' : 'flat', 18) + '</h4>'
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
      + '<div class="an-card an-cndl"><h4>' + ICON.chart + esc(T('کندل آخر', 'Last candle')) + ' ' + dirSvg(a.candle == null ? 'flat' : a.candle.dir === 'up' ? 'bull' : a.candle.dir === 'down' ? 'bear' : 'flat', 18) + '</h4>'
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

  /* ---- v1.8.0 — بازده از کندل‌های روزانه (برای بنیادی همهٔ بازارهای کندل‌دار) ----
     بدون API تازه: همان کندل‌های ۱d که چارت/قیمت از همان منبع می‌گیرند. */
  function perfFromDaily(cs) {
    var out = { chg7: null, chg30: null, chg90: null };
    if (!Array.isArray(cs) || cs.length < 2) return out;
    var closes = cs.map(function (c) { return c.c; }).filter(function (v) { return typeof v === 'number' && Number.isFinite(v) && v > 0; });
    if (closes.length < 2) return out;
    var last = closes[closes.length - 1];
    var at = function (n) {
      if (closes.length <= n) return null;
      var base = closes[closes.length - 1 - n];
      return base > 0 ? ((last - base) / base) * 100 : null;
    };
    out.chg7 = at(7); out.chg30 = at(30); out.chg90 = at(90);
    return out;
  }
  async function dailyCandlesFor(q) {
    // کندل ۱d همان نماد، بدون دست زدن به state.candles/چارت (بنیادی مستقل است).
    if (!q) return null;
    if (q.provider === 'binance') return binanceKlines(q.symbol, '1d', 100);
    if (q.provider === 'yahoo') {
      var r = await yahooChart(q.symbol, '6mo', '1d');
      return (r && r.candles) ? r.candles : null;
    }
    if (q.provider === 'mofid') return mofidCandles(q.symbol, '1d');
    return null; // نرخ ایران کندل ندارد (فقط قیمت لحظه‌ای).
  }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  async function frankfurterWeek(sym) {
    // تغییر ۷ روزهٔ جفت‌ارز از سری زمانی Frankfurter (بدون کلید، مستقیم، CORS دارد)؛
    // فقط روزهای کاری برمی‌گردد — اول و آخر همان بازه را می‌گیریم (پروب ۲۰۲۶-۱۱-۰۹).
    var p = FX_PAIRS[sym];
    if (!p) return null;
    var end = new Date(), start = new Date(Date.now() - 9 * 86400000);
    var j = await fetchJSON('https://api.frankfurter.app/' + ymd(start) + '..' + ymd(end) + '?from=' + p[0] + '&to=' + p[1], 8000);
    var rates = j && j.rates;
    if (!rates) return null;
    var days = Object.keys(rates).sort();
    if (days.length < 2) return null;
    var first = rates[days[0]] && rates[days[0]][p[1]], last = rates[days[days.length - 1]] && rates[days[days.length - 1]][p[1]];
    if (!(first > 0) || !(last > 0)) return null;
    return ((last - first) / first) * 100;
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
  async function renderFund() {
    var el = $('tab-fund');
    var q = state.quote;
    if (!q) return;
    el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    var naHtml = '<div class="na">' + esc(T('برای این نماد بنیادی نیست.', 'No fundamentals for this symbol.')) + '</div>';
    /* اگر تا رسیدن داده نماد عوض شد، در همان تب قدیمی چیزی ننویسیم. */
    var alive = function () { return state.quote === q; };
    if (q.provider === 'binance') {
      var f = await coingeckoFund(q.symbol);
      if (!alive()) return;
      if (!f) { el.innerHTML = naHtml; return; }
      el.innerHTML = '<div class="fund-grid">'
        + (f.rank ? fundCard('#', String(f.rank)) : '')
        + fundCard(esc(T('ارزش بازار', 'Market cap')), f.marketCap ? '$' + fmt(f.marketCap) : '—')
        + fundCard('FDV', f.fdv ? '$' + fmt(f.fdv) : '—')
        + fundCard(esc(T('حجم ۲۴ ساعت', 'Volume 24h')), f.volume24 ? '$' + fmt(f.volume24) : '—')
        + fundCard(esc(T('تغییر ۲۴ ساعت', 'Change 24h')), pctSpan(f.chg24))
        + fundCard(esc(T('تغییر ۷ روز', 'Change 7d')), pctSpan(f.chg7d))
        + fundCard(esc(T('تغییر ۳۰ روز', 'Change 30d')), pctSpan(f.chg30d))
        + fundCard(esc(T('تغییر ۱ سال', 'Change 1y')), pctSpan(f.chg1y))
        + fundCard(esc(T('در گردش', 'Circulating')), f.circulating ? fmt(f.circulating) : '—')
        + fundCard(esc(T('عرضهٔ کل', 'Total supply')), f.total ? fmt(f.total) : '—')
        + fundCard(esc(T('سقف عرضه', 'Max supply')), f.max ? fmt(f.max) : '—')
        + fundCard(esc(T('سقف تاریخی', 'ATH')), f.ath ? '$' + fmt(f.ath) + (f.athChange != null ? ' <small>(' + fmtPct(f.athChange) + ')</small>' : '') : '—')
        + fundCard(esc(T('کف تاریخی', 'ATL')), f.atl ? '$' + fmt(f.atl) + (f.atlChange != null ? ' <small>(' + fmtPct(f.atlChange) + ')</small>' : '') : '—')
        + '</div>';
      return;
    }
    if (q.provider === 'yahoo') {
      if (!state.quoteRes) {
        el.innerHTML = naHtml
          + '<div class="hint">' + esc(T('داده فعلاً از اینجا در دسترس نیست.', 'Data is not available from here right now.')) + '</div>';
        return;
      }
      var r = state.quoteRes;
      /* v1.8.0 — پروفایل بازار از همان دادهٔ یاهو + کندل روزانه: برای فارکس/
         شاخص/کالا که P/E و ارزش بازار ندارند، تب دیگر خالی نیست — بازهٔ روز،
         ۵۲ هفته، میانگین‌ها، حجم در برابر میانگین و بازدهٔ ۷/۳۰/۹۰ روزه هست. */
      var perf = null, fx7 = null;
      try {
        var res = await Promise.all([dailyCandlesFor(q), FX_PAIRS[q.symbol] ? frankfurterWeek(q.symbol) : Promise.resolve(null)]);
        if (!alive()) return;
        perf = perfFromDaily(res[0]); fx7 = res[1];
      } catch (e) { perf = null; fx7 = null; }
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
        + ((r.high != null && r.low != null) ? fundCard(esc(T('بازهٔ روز', 'Day range')), fmt(r.low) + ' – ' + fmt(r.high), true) : '')
        + ((typeof r.volume === 'number') ? fundCard(esc(T('حجم / میانگین', 'Volume / average')), fmt(r.volume) + (r.avgVolume ? ' / ' + fmt(r.avgVolume) : ''), true) : '')
        + fundCard(esc(T('بازده ۷ روزه', 'Return 7d')), perf ? pctSpan(perf.chg7) : '—')
        + fundCard(esc(T('بازده ۳۰ روزه', 'Return 30d')), perf ? pctSpan(perf.chg30) : '—')
        + fundCard(esc(T('بازده ۹۰ روزه', 'Return 90d')), perf ? pctSpan(perf.chg90) : '—')
        + ((fx7 != null) ? fundCard(esc(T('تغییر ۷ روزه', 'Change 7d')), pctSpan(fx7)) : '')
        + (r.exchange ? fundCard(esc(T('بورس', 'Exchange')), esc(r.exchange)) : '')
        + '</div>';
      return;
    }
    if (q.provider === 'mofid') {
      /* v1.8.0 — بورس/فرابورس تا حالا هیچ بنیادی نداشت: نام + بورس + ISIN از
         مفید، و بازده/بازه/حجم از همان کندل‌های روزانهٔ UDF مفید (۱۵۰ روز). */
      var res2 = await mofidResolve(q.symbol);
      if (!alive()) return;
      var dcs = await mofidCandles(q.symbol, '1d');
      if (!alive()) return;
      if ((!res2 || !res2.ok) && !dcs) { el.innerHTML = naHtml; return; }
      var pf = perfFromDaily(dcs);
      var lastC = (dcs && dcs.length) ? dcs[dcs.length - 1] : null;
      var hi = null, lo = null;
      if (dcs && dcs.length) {
        hi = dcs[0].h; lo = dcs[0].l;
        dcs.forEach(function (c) { if (c.h > hi) hi = c.h; if (c.l < lo) lo = c.l; });
      }
      el.innerHTML = '<div class="fund-grid">'
        + ((res2 && res2.title) ? fundCard(esc(T('نام', 'Name')), esc(res2.title), true) : '')
        + ((res2 && res2.exchange) ? fundCard(esc(T('بورس', 'Exchange')), esc(res2.exchange)) : '')
        + ((res2 && res2.isin) ? fundCard('ISIN', esc(res2.isin), true) : '')
        + (lastC ? fundCard(esc(T('آخرین قیمت پایانی', 'Last close')), fmt(lastC.c) + ' ' + esc(T('ریال', 'Rial'))) : '')
        + fundCard(esc(T('بازده ۷ روزه', 'Return 7d')), pctSpan(pf.chg7))
        + fundCard(esc(T('بازده ۳۰ روزه', 'Return 30d')), pctSpan(pf.chg30))
        + fundCard(esc(T('بازده ۹۰ روزه', 'Return 90d')), pctSpan(pf.chg90))
        + ((hi != null && lo != null) ? fundCard(esc(T('بازهٔ ۱۵۰ روزه', '150-day range')), fmt(lo) + ' – ' + fmt(hi), true) : '')
        + ((lastC && lastC.v) ? fundCard(esc(T('حجم روز آخر', 'Last-day volume')), fmt(lastC.v)) : '')
        + '</div>';
      return;
    }
    if (q.provider === 'iran-rate') {
      /* v1.8.0 — نرخ ایران تا حالا هیچ بنیادی نداشت: قیمت تومان + تغییر امروز
         + تاریخ به‌روزرسانی، همه از همان live.json نر‌خسنج. */
      var ir = await iranRate(q.symbol);
      if (!alive()) return;
      if (!ir) { el.innerHTML = naHtml; return; }
      el.innerHTML = '<div class="fund-grid">'
        + fundCard(esc(T('قیمت', 'Price')), fmt(ir.price) + ' ' + esc(T('تومان', 'Toman')))
        + fundCard(esc(T('تغییر امروز', 'Change today')), pctSpan(ir.changePct))
        + (ir.asOf ? fundCard(esc(T('به‌روز شده', 'Updated')), esc(ir.asOf), true) : '')
        + '</div>';
      return;
    }
    el.innerHTML = naHtml;
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
        el.innerHTML = '<div class="na">' + esc(T('خبری پیدا نشد.', 'No news found.')) + '</div>';
        return;
      }
      var html = '<div class="news">';
      items.forEach(function (it) {
        var tag = symTag;
        var lv = N.impactOf(it.title);
        html += '<div class="news-card imp-' + (lv === 'high' ? 'high' : lv === 'medium' ? 'med' : 'low') + '"><div class="news-tag"><span class="news-chip">[' + esc(tag) + ']</span>' + impactBadge(lv) + '</div>'
          + '<div class="news-title">' + esc(it.title) + '</div>'
          + (it.time ? '<div class="news-time">' + fmtNewsTime(it.time) + '</div>' : '')
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
     v1.7.0 — زنده از WebSocket: همان WS کندل‌ها (data-stream.binance.vision) حالا
     دو استریم دیگر هم می‌گیرد — depth20@100ms برای دفتر سفارش و aggTrade برای
     معاملات زنده — با همان fallback پولینگ ۵ ثانیه‌ای وقتی WS نرسد. */
  var depthTimer = null, depthSym = null;
  var depthWs = null, depthData = null, tradesWs = null, liveTrades = [];
  function stopDepthWs() {
    try { if (depthWs) depthWs.close(); } catch (e) {}
    depthWs = null;
    try { if (tradesWs) tradesWs.close(); } catch (e) {}
    tradesWs = null;
  }
  function stopDepthPoll() {
    if (depthTimer) { clearInterval(depthTimer); depthTimer = null; }
    depthSym = null;
    stopDepthWs();
    depthData = null; liveTrades = [];
  }
  /* دفتر سفارش را با diffهای WS به‌روز کن (بدون درخواست تازه): هر diff فقط
     سطوح تغییرکرده را می‌فرستد؛ سطح با مقدار ۰ حذف می‌شود. */
  function applyDepthDiff(d) {
    if (!depthData) return false;
    if (!d || !Array.isArray(d.b) || !Array.isArray(d.a)) return false;
    var merge = function (cur, diff, desc) {
      var map = {};
      cur.forEach(function (r) { map[r[0]] = r[1]; });
      diff.forEach(function (r) {
        var p = +r[0], q = +r[1];
        if (!Number.isFinite(p) || !Number.isFinite(q) || p <= 0) return;
        if (q === 0) delete map[p]; else map[p] = q;
      });
      var out = Object.keys(map).map(function (k) { return [+k, map[k]]; });
      out.sort(function (a, b) { return desc ? b[0] - a[0] : a[0] - b[0]; });
      return out.slice(0, 20);
    };
    depthData = { bids: merge(depthData.bids, d.b, true), asks: merge(depthData.asks, d.a, false) };
    return depthData.bids.length > 0 && depthData.asks.length > 0;
  }
  function startDepthWs(sym) {
    stopDepthWs();
    if (typeof WebSocket === 'undefined') return;
    try {
      var ws = new WebSocket('wss://data-stream.binance.vision/ws/' + sym.toLowerCase() + '@depth20@100ms');
      depthWs = ws;
      ws.onmessage = function (ev) {
        try {
          var d = JSON.parse(ev.data);
          if (!d || d.s !== sym) return;
          if (applyDepthDiff(d) && state.tab === 'depth' && state.view === 'symbol' && depthSym === sym) {
            var el = $('tab-depth');
            if (el) renderDepthData(el, depthData);
          }
        } catch (e) {}
      };
      ws.onclose = function () { if (depthWs === ws) depthWs = null; };
      ws.onerror = function () { if (depthWs === ws) { try { ws.close(); } catch (e) {} } };
      setTimeout(function () {
        if (depthWs === ws && ws.readyState !== 1) { try { ws.close(); } catch (e) {} }
      }, 6000);
    } catch (e) {}
    try {
      var tw = new WebSocket('wss://data-stream.binance.vision/ws/' + sym.toLowerCase() + '@aggTrade');
      tradesWs = tw;
      tw.onmessage = function (ev) {
        try {
          var t = JSON.parse(ev.data);
          if (!t || t.s !== sym) return;
          liveTrades.unshift({ p: +t.p, q: +t.q, t: +t.T, buy: !!t.m });
          if (liveTrades.length > 20) liveTrades.length = 20;
          if (state.tab === 'depth' && state.view === 'symbol' && depthSym === sym) {
            var list = document.getElementById('liveTrades');
            if (list) list.innerHTML = tradesRowsHtml();
          }
        } catch (e) {}
      };
      tw.onclose = function () { if (tradesWs === tw) tradesWs = null; };
      tw.onerror = function () { if (tradesWs === tw) { try { tw.close(); } catch (e) {} } };
      setTimeout(function () {
        if (tradesWs === tw && tw.readyState !== 1) { try { tw.close(); } catch (e) {} }
      }, 6000);
    } catch (e) {}
  }
  function tradesRowsHtml() {
    if (!liveTrades.length) return '<div class="muted">' + esc(T('در انتظار اولین معامله…', 'Waiting for the first trade…')) + '</div>';
    return liveTrades.map(function (tr) {
      return '<div class="tr-row"><span class="' + (tr.buy ? 'dn' : 'up') + '">' + fmt(tr.p) + '</span><span>' + fmt(tr.q) + '</span><span class="tr-t">' + (window.OnellaDate ? window.OnellaDate.fmt(tr.t, 'hms') : new Date(tr.t).toUTCString().slice(17, 25)) + '</span></div>';
    }).join('');
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
    depthData = d;
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
    var liveTag = (depthWs || tradesWs) ? ' <span class="live-dot live-ws">' + esc(T('● زنده', '● LIVE')) + '</span>' : '';
    var html = '<div class="ob-wrap">';
    html += '<div class="ob-head"><span>' + esc(T('بهترین خرید', 'Best bid')) + ' <b class="up">' + fmt(bestBid) + '</b></span>'
      + '<span>' + esc(T('بهترین فروش', 'Best ask')) + ' <b class="dn">' + fmt(bestAsk) + '</b></span>'
      + '<button type="button" id="obRefresh">↻</button>' + liveTag + '</div>';
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
    /* v1.7.0 — معاملات زنده (aggTrade همان WS): ۲۰ معاملهٔ آخر، سبز = خرید
       (taker خریدار است)، قرمز = فروش؛ فقط نمایش است. */
    html += '<div class="tr-sec"><div class="tr-h">' + esc(T('معاملات زنده', 'Live trades')) + '</div><div class="tr-cols"><span>' + esc(T('قیمت', 'Price')) + '</span><span>' + esc(T('مقدار', 'Amount')) + '</span><span>' + esc(T('زمان', 'Time')) + '</span></div><div id="liveTrades">' + tradesRowsHtml() + '</div></div>';
    el.innerHTML = html;
    var rb = document.getElementById('obRefresh');
    if (rb) rb.addEventListener('click', function () { renderDepth(); });
  }
  function renderDepth() {
    var el = $('tab-depth');
    var q = state.quote;
    if (!q) return;
    stopDepthPoll();
    /* v1.8.0 — عمق فقط کریپتو نبود: یاهو بهترین خرید/فروش + اندازه‌اش را می‌دهد
       (top-of-book — دفتر کامل نیست و قیمت‌ها با تأخیرند)؛ برای ایران و بورس
       هیچ منبعی در اپ دفتر ندارد و پیام، دلیلش را صادقانه می‌گوید. */
    if (q.provider === 'yahoo') {
      var r = state.quoteRes;
      if (r && typeof r.bid === 'number' && typeof r.ask === 'number' && r.bid > 0 && r.ask > 0) {
        var sp = r.ask - r.bid, spPct = (sp / r.bid) * 100;
        el.innerHTML = '<div class="fund-grid">'
          + fundCard(esc(T('بهترین خرید', 'Best bid')), fmt(r.bid) + (r.bidSize ? ' <small>× ' + fmt(r.bidSize) + '</small>' : ''))
          + fundCard(esc(T('بهترین فروش', 'Best ask')), fmt(r.ask) + (r.askSize ? ' <small>× ' + fmt(r.askSize) + '</small>' : ''))
          + fundCard(esc(T('اسپرد', 'Spread')), fmt(sp) + ' (' + spPct.toFixed(3) + '٪)', true)
          + '</div>'
          + '<div class="warn">' + esc(T('قیمت خرید/فروش با تأخیر است و فقط بالاترین سطح دفتر است — دفتر کامل برای این بازار در دسترس نیست.', 'Bid/ask is delayed and top-of-book only — no full order book for this market.')) + '</div>';
      } else {
        el.innerHTML = '<div class="na">' + esc(T('برای این نماد قیمت خرید/فروش در دسترس نیست.', 'No bid/ask for this symbol.')) + '</div>';
      }
      return;
    }
    if (q.provider === 'iran-rate') {
      el.innerHTML = '<div class="na">' + esc(T('نرخ‌های ایران دفتر سفارش ندارند — فقط قیمت لحظه‌ای می‌دهند.', 'Iran rates have no order book — spot prices only.')) + '</div>';
      return;
    }
    if (q.provider === 'mofid') {
      el.innerHTML = '<div class="na">' + esc(T('بورس/فرابورس دفتر سفارش ندارد — فقط تاریخچهٔ قیمت در دسترس است.', 'TSE/Farabourse have no order book here — only price history is available.')) + '</div>';
      return;
    }
    if (q.provider !== 'binance') {
      el.innerHTML = '<div class="na">' + esc(T('دفتر سفارش فقط برای نمادهای کریپتو در دسترس است.', 'Order book is only available for crypto symbols.')) + '</div>';
      return;
    }
    el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    depthSym = q.symbol;
    fetchDepth(q.symbol).then(function (d) {
      if (depthSym !== q.symbol || state.tab !== 'depth') return;
      if (!d) { el.innerHTML = '<div class="na">' + esc(T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>'; return; }
      renderDepthData(el, d);
      startDepthWs(q.symbol);
      /* پولینگ ۵ ثانیه‌ای می‌ماند: وقتی WS وصل نیست، دفتر را تازه می‌کند؛
         وقتی WS وصل است، فقط یک همگام‌سازی دوره‌ای است (diffها بین دو پول
         همان WS را پوشش می‌دهند). */
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
     نرخ‌های ایران هم از live.json نر‌خسنج می‌آیند — فیلد `change` همان فایل تغییر
     روزانه را دارد (پروب ۲۰۲۶-۱۱-۰۹؛ فرض قبلی که «فقط قیمت لحظه‌ای دارد» اشتباه بود).
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
  /* v1.8.0 — نرخ‌های ایران، یک تماس: live.json نر‌خسنج قیمت + تغییر روزانهٔ همهٔ
     نرخ‌ها را با هم می‌دهد (همان فایل iranRate)؛ پس داشبورد حالا هر ۹ بازار را دارد. */
  async function iranRatesBulk() {
    var u = proxyUrl('nerkhsanj', 'https://nerkh.jahankhahan.shop/data/live.json');
    if (!u) return [];
    var j = await fetchJSON(u, 10000);
    var rates = j && j.rates, ch = j && j.change;
    if (!rates) return [];
    var rows = [];
    MARKETS.iran.quotes.forEach(function (q) {
      var k = IRAN_KEYS[q.symbol];
      if (!k || !(rates[k] > 0)) return;
      var c = (ch && typeof ch[k] === 'number') ? ch[k] : null;
      if (typeof c !== 'number') return;
      rows.push({ quote: q, market: 'iran', price: rates[k], changePct: c, currency: 'Toman' });
    });
    return rows;
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
    $('dashDigest').innerHTML = '';
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
    var live = { rows: [], news: null, newsDone: false, fearGreed: null, mktDone: 0, done: 0, total: 7, at: now };
    function partial() {
      if (seq !== dashSeq) return;
      renderDash({ rows: live.rows, news: live.news || [], newsLoading: !live.newsDone, fearGreed: live.fearGreed,
        rowsLoading: live.mktDone < 5, yahooOk: true, mofidOk: true, cgOk: true, at: now });
    }
    function legDone() {
      live.done++;
      if (live.done >= live.total && seq === dashSeq) {
        var data = { rows: live.rows, news: live.news || [], newsLoading: false, fearGreed: live.fearGreed,
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
    iranRatesBulk().then(function (rows) {
      if (seq !== dashSeq) return;
      live.rows = live.rows.concat(rows);
      partial();
    }).catch(function () {}).then(mktLegDone),
    (async function () {
      try {
        var N0 = window.OnellaNews.createNews({ fetchImpl: proxyFetch });
        live.news = await N0.impactfulNews(lang, 10);
      } catch (e) { live.news = []; }
      live.newsDone = true;
      partial();
    })().then(legDone),
    /* v1.12.0 — ترس و طمع کریپتو (alternative.me، مستقیم؛ CORS باز است):
       فقط برای خط ترس/طمعِ خلاصه است؛ اگر نیامد، آن خط نمی‌آید — نه عدد
       ساختگی، نه «—» به‌جای شاخص. */
    (async function () {
      try {
        var fg = await fetchJSON('https://api.alternative.me/fng/?limit=1', 8000);
        var d0 = fg && Array.isArray(fg.data) && fg.data[0];
        if (d0 && isFinite(+d0.value)) live.fearGreed = { value: +d0.value, label: String(d0.value_classification || '') };
      } catch (e) {}
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
    /* v1.12.1 — خلاصهٔ بازار، بازطراحی (دستور مالک: دیزاین بهتر شود + ترس
       و طمع برای همهٔ بازارها): هیرو با کلمهٔ حال + نوار نشانگر، قیمت‌های
       سرخط به‌صورت کارت، و «حال هر بازار» برای هر ۹ بازار. حال هر بازار از
       breadth واقعی (سهم نمادهای سبز) + میانگین تغییر همان بازار حساب
       می‌شود — نه از شاخصی که وجود ندارد (CNN ربات را بلاک می‌کند؛ تست
       زنده ۲۰۲۶-۱۱-۱۰: «I'm a teapot. You're a bot.» + ۴۱۸؛ برای بازارهای
       غیرکریپتو شاخصِ رایگانِ معتبری نیست). پس کلمهٔ حال (ترس/خنثی/طمع)
       تفسیرِ دادهٔ واقعی است، نه عدد ساختگی — هیچ ۰–۱۰۰ ساختگی نشان داده
       نمی‌شود؛ تنها شاخصِ واقعیِ ترس و طمع همان alternative.me کریپتو است
       و جداگانه می‌ماند. */
    var upN = 0;
    data.rows.forEach(function (r) { if (r.changePct > 0) upN++; });
    var dgDate = '';
    try { dgDate = window.OnellaDate ? window.OnellaDate.app(data.at || Date.now(), 'long', lang === 'fa') : new Date(data.at || Date.now()).toLocaleDateString(lang === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) {}
    function moodWord(avg, upPct) {
      var w;
      if (avg >= 2) w = T('طمع شدید', 'Extreme Greed');
      else if (avg >= 0.5) w = T('طمع', 'Greed');
      else if (avg <= -2) w = T('ترس شدید', 'Extreme Fear');
      else if (avg <= -0.5) w = T('ترس', 'Fear');
      else w = T('خنثی', 'Neutral');
      if (w !== T('خنثی', 'Neutral')) {
        if ((w === T('طمع', 'Greed') || w === T('طمع شدید', 'Extreme Greed')) && upPct <= 25) w = T('خنثی', 'Neutral');
        if ((w === T('ترس', 'Fear') || w === T('ترس شدید', 'Extreme Fear')) && upPct >= 75) w = T('خنثی', 'Neutral');
      }
      return w;
    }
    function moodCls(w) {
      return (w === T('طمع', 'Greed') || w === T('طمع شدید', 'Extreme Greed')) ? 'up'
        : (w === T('ترس', 'Fear') || w === T('ترس شدید', 'Extreme Fear')) ? 'dn' : '';
    }
    var dg = '<div class="dash-sec"><h3>' + ICON.book + esc(T('خلاصهٔ بازار', 'Market digest')) + '</h3>';
    if (dgDate) dg += '<div class="muted" style="margin-bottom:4px">' + esc(dgDate) + '</div>';
    if (avgAll != null && data.rows.length) {
      var heroW = moodWord(avgAll, Math.round((upN / data.rows.length) * 100));
      var heroPos = Math.max(0, Math.min(100, (5 - Math.max(-5, Math.min(5, avgAll))) / 10 * 100));
      dg += '<div class="dg-hero"><div class="dg-hero-mood ' + moodCls(heroW) + '">' + esc(heroW) + '</div>'
        + '<div class="dg-hero-avg">' + esc(T('میانگین تغییر بازار', 'Average market change')) + ' ' + fmtPct(avgAll) + '</div>'
        + '<div class="dg-bar"><span class="dg-marker" style="right:' + heroPos + '%"></span></div>'
        + '<div class="dg-breadth">' + upN + ' ' + esc(T('از', 'of')) + ' ' + data.rows.length + ' ' + esc(T('نماد سبز', 'symbols green')) + '</div></div>';
    }
    function headStat(sym) {
      var r = null;
      data.rows.forEach(function (x) { if (!r && x.quote && x.quote.symbol === sym) r = x; });
      if (!r) return '';
      return '<div class="dg-stat"><div class="dg-lb">' + esc(r.quote.display || r.quote.label || sym) + '</div>'
        + '<div class="dg-px">' + fmt(r.price) + ' ' + esc(r.currency || '') + '</div>'
        + '<div class="dg-ch ' + (r.changePct >= 0 ? 'up' : 'dn') + '">' + fmtPct(r.changePct) + '</div></div>';
    }
    var stats = headStat('BTCUSDT') + headStat('ETHUSDT') + headStat('PAXGUSDT') + headStat('usd');
    if (stats) dg += '<div class="dg-grid">' + stats + '</div>';
    var moods = '';
    MARKET_ORDER.forEach(function (k) {
      var b = byMarket[k];
      if (!b) return;
      var upPct = Math.round((b.up / b.total) * 100);
      var avg = b.sum / b.total;
      var w = moodWord(avg, upPct);
      moods += '<div class="dg-mood"><span class="dg-lb">' + esc(marketLabel(k)) + '</span>'
        + '<span class="heat-bar"><span class="hb-up" style="width:' + upPct + '%"></span><span class="hb-dn" style="width:' + (100 - upPct) + '%"></span></span>'
        + '<span class="dg-w ' + moodCls(w) + '">' + esc(w) + ' ' + fmtPct(avg) + '</span></div>';
    });
    if (moods) dg += '<div class="dg-moods">' + moods + '</div>';
    if (data.fearGreed && isFinite(data.fearGreed.value)) {
      var fgLbl = { 'Extreme Fear': T('ترس شدید', 'Extreme Fear'), 'Fear': T('ترس', 'Fear'), 'Neutral': T('خنثی', 'Neutral'), 'Greed': T('طمع', 'Greed'), 'Extreme Greed': T('طمع شدید', 'Extreme Greed') }[data.fearGreed.label] || data.fearGreed.label;
      dg += '<div class="dg-row"><span>' + esc(T('ترس و طمع کریپتو', 'Crypto Fear & Greed')) + '</span><span class="dg-v">' + data.fearGreed.value + ' · ' + esc(fgLbl) + '</span></div>';
    }
    if (!data.rows.length && !data.fearGreed) dg += '<div class="' + (data.rowsLoading ? 'muted' : 'na') + '">' + esc(data.rowsLoading ? T('در حال بارگذاری…', 'Loading…') : T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>';
    dg += '</div>';
    $('dashDigest').innerHTML = dg;
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
        newsHtml += '<div class="news-card imp-' + (lv === 'high' ? 'high' : lv === 'medium' ? 'med' : 'low') + '"><div class="news-tag"><span class="news-chip">[' + esc(tag) + ']</span>' + impactBadge(lv) + '</div>'
          + '<div class="news-title">' + esc(it.title) + '</div>'
          + (it.time ? '<div class="news-time">' + fmtNewsTime(it.time) + '</div>' : '')
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
    // v1.6.0 — تب‌های نماد آیکون‌دار شدند (چارت/تحلیل/بنیادی/خبر/عمق).
    $('tabBtn-chart').innerHTML = ICON.chart + '<span>' + esc(T('چارت', 'Chart')) + '</span>';
    $('tabBtn-analysis').innerHTML = ICON.activity + '<span>' + esc(T('تحلیل', 'Analysis')) + '</span>';
    $('tabBtn-fund').innerHTML = ICON.fund + '<span>' + esc(T('بنیادی', 'Fundamentals')) + '</span>';
    $('tabBtn-news').innerHTML = ICON.news + '<span>' + esc(T('خبر', 'News')) + '</span>';
    $('tabBtn-depth').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"></path><path d="M3 13l9 5 9-5"></path></svg><span>' + esc(T('عمق', 'Depth')) + '</span>';
    $('backBtn').setAttribute('aria-label', T('بازگشت', 'Back')); $('backBtn').title = T('بازگشت', 'Back'); // v1.15.0 — دکمهٔ بازگشت آیکون است؛ متن نمی‌نویسیم.
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
    /* v1.10.0 — وقتی کش آلرت (CloudStorage) خوانده شد، بج را تازه کن. */
    if (window.OnellaAlerts && window.OnellaAlerts.ready) {
      window.OnellaAlerts.ready.then(function () { try { refreshAlertBadge(); } catch (e) {} }).catch(function () {});
    }
    show('catalog');
  }
  /* برای تست از کنسول مرورگر: window.__miniApp.openSymbol({provider:'binance',symbol:'BTCUSDT',display:'BTC/USDT',label:'BTC'}) */
  window.__miniApp = { openSymbol: openSymbol, setTf: setTf, setTab: setTab, state: state, renderPriceBox: renderPriceBox, setPriceMode: setPriceMode, updateLivePrice: updateLivePrice, renderSearch: renderSearch, renderCatalog: renderCatalog, zoomBy: zoomBy, toggleFs: toggleFs, startLive: startLive, stopLive: stopLive, MARKETS: MARKETS, TFS: TFS,
    showMainTab: showMainTab, openSearchModal: openSearchModal, closeSearchModal: closeSearchModal, renderSmBody: renderSmBody, renderSmTabs: renderSmTabs, sm: sm,
    loadDash: loadDash, renderDash: renderDash, confluence: confluence, renderGauge: renderGauge, renderDepth: renderDepth, renderDepthData: renderDepthData, fetchDepth: fetchDepth, stopDepthPoll: stopDepthPoll, applyDepthDiff: applyDepthDiff, tradesRowsHtml: tradesRowsHtml, getDepthData: function () { return depthData; }, getLiveTrades: function () { return liveTrades; }, setLiveTrades: function (t) { liveTrades = t || []; }, positionLastPxTag: positionLastPxTag,
    yahooSearch: yahooSearch, mofidResolve: mofidResolve, rememberQuote: rememberQuote,
    iranRate: iranRate, perfFromDaily: perfFromDaily, frankfurterWeek: frankfurterWeek, iranRatesBulk: iranRatesBulk, dailyCandlesFor: dailyCandlesFor,
    openAlertModal: openAlertModal, showPriceAxisMenu: showPriceAxisMenu, axisPriceAtY: axisPriceAtY, checkAlertsNow: checkAlertsNow, refreshAlertBadge: refreshAlertBadge, renderAlertList: renderAlertList, refreshAlertLivePrices: refreshAlertLivePrices, stopAlertLivePrices: stopAlertLivePrices, openTZPicker: openTZPicker, applyTimezone: applyTimezone, updateClock: updateClock, exchangeZoneFor: exchangeZoneFor,
    getLastPxTagPrice: function () { return lastPxTagPrice; }, snapXhPrice: snapXhPrice, updateStripMore: updateStripMore, dismissCrosshair: dismissCrosshair, isXhPinned: function () { return xhPinned; }, pinCrosshairAt: pinCrosshairAt,
    toggleFocus: toggleFocusMode, isFocusMode: function () { return focusOn; }, isFullscreen: function () { return fsMode !== 'none'; }, getFsMode: function () { return fsMode; },
    pmScale: pmScale, pmPan: pmPan, autoScale: autoScale, toLatest: toLatest, refreshAxisBtns: refreshAxisBtns,
    toggleFav: toggleFav, isFav: isFav, lookupQuote: lookupQuote, yahooMulti: yahooMulti, mofidBulk: mofidBulk, cgMarkets: cgMarkets };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

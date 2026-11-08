'use strict';
/* Onella Nelora Lite — آیکون نمادها (پورت js/114 اپ اصلی، v1.1.0).
   قاعدهٔ اپ اصلی: آیکون رسمی از اینترنت + بج حرفی جایگزینِ همیشه‌حاضر.
   - کریپتو: آیکون رسمی از CDN مجموعه cryptocurrency-icons روی jsDelivr.
   - سهام: لوگوی رسمی شرکت از سرویس favicon گوگل بر اساس دامین شرکت.
   - فارکس: پرچم رسمی کشورها از flagcdn برای هر ارز جفت.
   - فلز/کالا: بج Au/Ag/Pt/Pd یا SVG فلز (مس و …)؛ بقیه → بج حرفی.
   - بورس/فرابورس ایران، نرخ‌های ایران، شاخص‌ها → بج حرفی (حرف اول نماد).
   همه <img>ها loading="lazy" + onerror دارند که در صورت خطا/آفلاین بودن،
   تصویر با بج حرفی جایگزین می‌شود تا ظاهر خراب نشود. هیچ fetch/دانلودی اینجا نیست. */
(function () {
  var CDN_CRYPTO = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/';
  var G_FAV = 'https://www.google.com/s2/favicons?domain=';
  var FLAG = 'https://flagcdn.com/w80/';
  var CRYPTO_FILE = {
    BTC: 'btc', ETH: 'eth', USDT: 'usdt', BNB: 'bnb', SOL: 'sol', USDC: 'usdc', XRP: 'xrp', DOGE: 'doge',
    ADA: 'ada', AVAX: 'avax', TRX: 'trx', LINK: 'link', DOT: 'dot', TON: 'ton', MATIC: 'matic', POL: 'pol',
    LTC: 'ltc', BCH: 'bch', ATOM: 'atom', XLM: 'xlm', NEAR: 'near', UNI: 'uni', APT: 'apt', ARB: 'arb',
    OP: 'op', SUI: 'sui', PEPE: 'pepe', SHIB: 'shib', DAI: 'dai', WBTC: 'wbtc', ETC: 'etc', FIL: 'fil',
    INJ: 'inj', AAVE: 'aave', HBAR: 'hbar', MKR: 'mkr', RNDR: 'rndr', IMX: 'imx', GRT: 'grt', LDO: 'ldo',
    STX: 'stx', FET: 'fet', KAS: 'kas', TAO: 'tao', CRO: 'cro', VET: 'vet', FTM: 'ftm', ALGO: 'algo',
    EGLD: 'egld', SAND: 'sand', MANA: 'mana', AXS: 'axs', THETA: 'theta', XTZ: 'xtz', EOS: 'eos',
    FLOW: 'flow', KAVA: 'kava', MINA: 'mina', RUNE: 'rune', SNX: 'snx', BSV: 'bsv', XMR: 'xmr',
    ZEC: 'zec', DASH: 'dash', NEO: 'neo', QTUM: 'qtum', IOTA: 'iota', ZIL: 'zil', ONE: 'one', BAT: 'bat',
    ENJ: 'enj', CHZ: 'chz', COMP: 'comp', YFI: 'yfi', SUSHI: 'sushi', CRV: 'crv', '1INCH': '1inch',
    LUNC: 'lunc', LUNA: 'luna', KCS: 'kcs', OKB: 'okb', QNT: 'qnt', CAKE: 'cake', PAXG: 'paxg'
  };
  var STOCK_DOMAIN = {
    AAPL: 'apple.com', MSFT: 'microsoft.com', NVDA: 'nvidia.com', AMZN: 'amazon.com',
    GOOGL: 'google.com', GOOG: 'google.com', META: 'meta.com', TSLA: 'tesla.com',
    AVGO: 'broadcom.com', JPM: 'jpmorganchase.com', V: 'visa.com', MA: 'mastercard.com',
    WMT: 'walmart.com', XOM: 'exxonmobil.com', KO: 'coca-colacompany.com', PEP: 'pepsico.com',
    DIS: 'thewaltdisneycompany.com', NFLX: 'netflix.com', AMD: 'amd.com', INTC: 'intel.com',
    ORCL: 'oracle.com', CRM: 'salesforce.com', ADBE: 'adobe.com', PYPL: 'paypal.com',
    UBER: 'uber.com', BA: 'boeing.com', NKE: 'nike.com', MCD: 'mcdonalds.com',
    COIN: 'coinbase.com', MSTR: 'microstrategy.com', BAC: 'bankofamerica.com',
    UNH: 'unitedhealthgroup.com'
  };
  var FX_FLAG = { USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', CHF: 'ch', AUD: 'au', CAD: 'ca', NZD: 'nz', TRY: 'tr', MXN: 'mx', SEK: 'se', CNY: 'cn' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(sym) { return String(sym == null ? '' : sym).trim().toUpperCase(); }
  function clean(sym) { return norm(sym).replace(/[^A-Z0-9.\-]/g, ''); }
  function stripUsdt(s) { return s.replace(/USDT$/, ''); }
  function hue(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
  /* بج حرفی قطعی: رنگ از هش نماد (تکرارپذیر). برای نماد فارسی، حرف اول فارسی می‌ماند. */
  function letterBadge(sym) {
    var s = String(sym == null ? '' : sym).trim() || '?';
    var first = s.slice(0, 1);
    return '<span class="oa-ic oa-ic-letter" style="--h:' + hue(s.toUpperCase()) + '" aria-hidden="true">' + esc(first) + '</span>';
  }
  function iconFallback(img, sym) {
    try {
      var sp = document.createElement('span');
      sp.innerHTML = letterBadge(sym);
      if (img && img.parentNode) img.parentNode.replaceChild(sp.firstChild, img);
    } catch (e) { try { if (img) img.style.display = 'none'; } catch (_) {} }
  }
  if (typeof window !== 'undefined') window.__miniIconFallback = iconFallback;
  function imgTag(url, sym) {
    return '<img src="' + esc(url) + '" alt="' + esc(sym) + '" loading="lazy" onerror="window.__miniIconFallback(this,\'' + esc(sym) + '\')">';
  }
  function cryptoUrl(sym) {
    var s = stripUsdt(clean(sym)), f = CRYPTO_FILE[s];
    return f ? CDN_CRYPTO + f + '.svg' : null;
  }
  function stockUrl(sym) {
    var d = STOCK_DOMAIN[clean(sym)];
    return d ? G_FAV + encodeURIComponent(d) + '&sz=64' : null;
  }
  function flagUrl(code) {
    var cc = FX_FLAG[code];
    return cc ? FLAG + cc + '.png' : null;
  }
  function cryptoBadge(sym) {
    var s = stripUsdt(clean(sym)), u = cryptoUrl(s);
    if (u) return '<span class="oa-ic oa-ic-img">' + imgTag(u, s) + '</span>';
    return letterBadge(s);
  }
  function stockBadge(sym) {
    var s = clean(sym), u = stockUrl(s);
    if (u) return '<span class="oa-ic oa-ic-img">' + imgTag(u, s) + '</span>';
    return letterBadge(s);
  }
  function forexBadge(sym) {
    var s = clean(sym).replace(/=X$/, '').replace(/[^A-Z]/g, '');
    if (s.length === 6) {
      var a = s.slice(0, 3), b = s.slice(3, 6), ua = flagUrl(a), ub = flagUrl(b);
      if (ua && ub) return '<span class="oa-ic oa-ic-fx">' + imgTag(ua, a) + imgTag(ub, b) + '</span>';
      if (ua || ub) return '<span class="oa-ic oa-ic-fx">' + (ua ? imgTag(ua, a) : letterBadge(a)) + (ub ? imgTag(ub, b) : letterBadge(b)) + '</span>';
    }
    return letterBadge(s || sym);
  }
  var METAL_SVG = {
    copper: '<rect x="3.5" y="14" width="17" height="4.5" rx="2.2" fill="currentColor"/><rect x="5.5" y="8.5" width="13" height="4.5" rx="2.2" fill="currentColor" opacity=".75"/><rect x="8" y="3.5" width="8" height="4" rx="2" fill="currentColor" opacity=".5"/>',
    platinum: '<path d="M12 3.5l7 6-7 11-7-11z" fill="currentColor" opacity=".9"/><path d="M5 9.5h14M12 3.5l-2.6 6 2.6 11 2.6-11z" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.1" stroke-linejoin="round"/>',
    palladium: '<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" fill="currentColor" opacity=".9"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="1.6"/>'
  };
  /* آیکون کالا بر اساس برچسب (Gold/Silver/…) — طلا و نقره بج متنی، بقیه SVG یا حرفی. */
  function commodityBadge(label) {
    var l = String(label || '').toLowerCase();
    if (l.indexOf('gold') === 0) return '<span class="oa-ic oa-ic-metal oa-ic-gold" aria-hidden="true">Au</span>';
    if (l.indexOf('silver') === 0) return '<span class="oa-ic oa-ic-metal oa-ic-silver" aria-hidden="true">Ag</span>';
    if (l.indexOf('platinum') === 0) return '<span class="oa-ic oa-ic-metal oa-ic-platinum" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true">' + METAL_SVG.platinum + '</svg></span>';
    if (l.indexOf('palladium') === 0) return '<span class="oa-ic oa-ic-metal oa-ic-palladium" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true">' + METAL_SVG.palladium + '</svg></span>';
    if (l.indexOf('copper') === 0) return '<span class="oa-ic oa-ic-metal oa-ic-copper" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true">' + METAL_SVG.copper + '</svg></span>';
    return letterBadge(label);
  }
  /* آیکون یک نماد از کاتولوگ (q = {provider, symbol, label, fa}). */
  function badgeFor(q) {
    if (!q) return letterBadge('?');
    if (q.provider === 'binance') return cryptoBadge(q.label);
    if (q.provider === 'yahoo') {
      if (String(q.symbol || '').indexOf('=F') !== -1) return commodityBadge(q.label);
      if (String(q.symbol || '').indexOf('=X') !== -1) return forexBadge(q.symbol);
      if (String(q.symbol || '')[0] === '^') return letterBadge(q.label);
      return stockBadge(q.label);
    }
    if (q.provider === 'mofid') return letterBadge(q.symbol);
    if (q.provider === 'iran-rate') return letterBadge(q.fa || q.label);
    return letterBadge(q.label);
  }
  if (typeof window !== 'undefined') window.MiniIcons = {
    badgeFor: badgeFor, letterBadge: letterBadge, cryptoBadge: cryptoBadge,
    stockBadge: stockBadge, forexBadge: forexBadge, commodityBadge: commodityBadge
  };
})();

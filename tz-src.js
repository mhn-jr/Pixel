/* Mini App v1.14.7 — منطقهٔ زمانی (به سبک تریدینگ‌ویو):
   - فهرست شهرها مثل تریدینگ‌ویو: UTC بالا، بعد شهرها با افستِ همان لحظه
     (افست هرگز هاردکد نیست — با Intl از IANA همان لحظه حساب می‌شود، پس DST درست است).
   - هر ردیف یک IANA واقعی دارد (تهران → Asia/Tehran). انتخاب، فقط یک نام IANA
     در localStorage می‌ماند (onella_tz_v1)؛ نمایش همیشه از epoch با Intl و timeZone.
   - پیش‌فرض: UTC (قانون این خط: Gregorian + UTC، نه System). */
(function () {
  var KEY = 'onella_tz_v1';
  var DEFAULT_ZONE = 'UTC';
  /* [IANA, city label (English, as in TradingView), Persian label] — sorted by
     current UTC offset at runtime (UTC first, then west → east). */
  var ZONES = [
    ['Pacific/Honolulu', 'Honolulu', 'هونولولو'],
    ['America/Anchorage', 'Anchorage', 'انکوریج'],
    ['America/Juneau', 'Juneau', 'جونو'],
    ['America/Los_Angeles', 'Los Angeles', 'لس‌آنجلس'],
    ['America/Vancouver', 'Vancouver', 'ونکوور'],
    ['America/Denver', 'Denver', 'دنور'],
    ['America/Phoenix', 'Phoenix', 'فینیکس'],
    ['America/Chicago', 'Chicago', 'شیکاگو'],
    ['America/Mexico_City', 'Mexico City', 'مکزیکوسیتی'],
    ['America/El_Salvador', 'San Salvador', 'سان سالوادور'],
    ['America/Bogota', 'Bogota', 'بوگوتا'],
    ['America/New_York', 'New York', 'نیویورک'],
    ['America/Toronto', 'Toronto', 'تورنتو'],
    ['America/Santiago', 'Santiago', 'سانتیاگو'],
    ['America/Sao_Paulo', 'Sao Paulo', 'سائو پائولو'],
    ['Europe/London', 'London', 'لندن'],
    ['Europe/Dublin', 'Dublin', 'دوبلین'],
    ['Europe/Lisbon', 'Lisbon', 'لیسبون'],
    ['Europe/Paris', 'Paris', 'پاریس'],
    ['Europe/Berlin', 'Berlin', 'برلین'],
    ['Europe/Madrid', 'Madrid', 'مادرید'],
    ['Europe/Rome', 'Rome', 'رم'],
    ['Europe/Amsterdam', 'Amsterdam', 'آمستردام'],
    ['Europe/Zurich', 'Zurich', 'زوریخ'],
    ['Europe/Stockholm', 'Stockholm', 'استکهلم'],
    ['Europe/Athens', 'Athens', 'آتن'],
    ['Africa/Cairo', 'Cairo', 'قاهره'],
    ['Africa/Johannesburg', 'Johannesburg', 'ژوهانسبورگ'],
    ['Europe/Istanbul', 'Istanbul', 'استانبول'],
    ['Europe/Moscow', 'Moscow', 'مسکو'],
    ['Asia/Dubai', 'Dubai', 'دبی'],
    ['Asia/Tehran', 'Tehran', 'تهران'],
    ['Asia/Karachi', 'Karachi', 'کراچی'],
    ['Asia/Kolkata', 'Mumbai', 'بمبئی'],
    ['Asia/Dhaka', 'Dhaka', 'داکا'],
    ['Asia/Bangkok', 'Bangkok', 'بانکوک'],
    ['Asia/Jakarta', 'Jakarta', 'جاکارتا'],
    ['Asia/Singapore', 'Singapore', 'سنگاپور'],
    ['Asia/Shanghai', 'Shanghai', 'شانگهای'],
    ['Asia/Hong_Kong', 'Hong Kong', 'هنگ‌کنگ'],
    ['Asia/Tokyo', 'Tokyo', 'توکیو'],
    ['Asia/Seoul', 'Seoul', 'سئول'],
    ['Australia/Sydney', 'Sydney', 'سیدنی'],
    ['Pacific/Auckland', 'Auckland', 'اوکلند']
  ];
  function validZone(z) {
    if (typeof z !== 'string' || !z) return false;
    if (z === 'UTC') return true;
    try { Intl.DateTimeFormat('en', { timeZone: z }); return true; } catch (_) { return false; }
  }
  var current = DEFAULT_ZONE;
  try {
    var saved = localStorage.getItem(KEY);
    if (validZone(saved)) current = saved;
  } catch (_) {}
  function get() { return current; }
  function set(z) {
    if (!validZone(z)) return false;
    current = z;
    try { localStorage.setItem(KEY, z); } catch (_) {}
    try { if (window.OnellaDate && typeof window.OnellaDate.setTZ === 'function') window.OnellaDate.setTZ(z); } catch (_) {}
    return true;
  }
  /* افستِ یک زون نسبت به UTC در یک لحظه، به دقیقه (با DST همان لحظه). */
  function offsetMinutes(zone, ms) {
    ms = (typeof ms === 'number' && isFinite(ms)) ? ms : Date.now();
    if (zone === 'UTC') return 0;
    try {
      var f = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      var parts = {};
      f.formatToParts(new Date(ms)).forEach(function (p) { parts[p.type] = p.value; });
      var asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
      return Math.round((asUTC - ms) / 60000);
    } catch (_) { return 0; }
  }
  function offsetLabel(zone, ms) {
    var m = offsetMinutes(zone, ms);
    if (m === 0) return 'UTC';
    var sign = m < 0 ? '-' : '+', a = Math.abs(m);
    var h = Math.floor(a / 60), mi = a % 60;
    return 'UTC' + sign + h + (mi ? ':' + (mi < 10 ? '0' : '') + mi : '');
  }
  function zoneInfo(iana) {
    for (var i = 0; i < ZONES.length; i++) if (ZONES[i][0] === iana) return ZONES[i];
    return null;
  }
  /* برچسب کوتاه برای ساعت: UTC → «UTC»، شهرها → نام شهر. */
  function shortLabel(iana) {
    if (iana === 'UTC') return 'UTC';
    var z = zoneInfo(iana);
    return z ? z[1] : iana;
  }
  /* ردیف نمایشی تریدینگ‌ویو: «(UTC+3:30) Tehran». */
  function rowLabel(iana, ms) {
    if (iana === 'UTC') return 'UTC';
    var z = zoneInfo(iana);
    return '(' + offsetLabel(iana, ms) + ') ' + (z ? z[1] : iana);
  }
  function sortedZones(ms) {
    var arr = ZONES.slice();
    arr.sort(function (a, b) { return offsetMinutes(a[0], ms) - offsetMinutes(b[0], ms); });
    return arr;
  }
  function fmtClock(ms) {
    try {
      var f = new Intl.DateTimeFormat('en-GB', { timeZone: current, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return f.format(ms) + ' ' + shortLabel(current);
    } catch (_) {
      var d = new Date(ms);
      var p = function (n) { return (n < 10 ? '0' : '') + n; };
      return p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()) + ' UTC';
    }
  }
  window.OnellaTZ = {
    KEY: KEY, DEFAULT_ZONE: DEFAULT_ZONE, ZONES: ZONES,
    get: get, set: set, validZone: validZone,
    offsetMinutes: offsetMinutes, offsetLabel: offsetLabel,
    zoneInfo: zoneInfo, shortLabel: shortLabel, rowLabel: rowLabel,
    sortedZones: sortedZones, fmtClock: fmtClock
  };
})();

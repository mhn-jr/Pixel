'use strict';
/* Onella Telegram Bot — نمایش یکپارچهٔ همهٔ بخش‌ها (v1.8.1).
   مشکل (گزارش مالک ۲۰۲۶-۱۱-۰۸): فقط کارت قیمت نمایش خوبی داشت؛ بقیهٔ بخش‌ها
   (تحلیل، بنیادی، خبر، خلاصه) چینش‌شان با هم نامرتبط بود — خط‌ها یکی راست یکی
   چپ، ترکیب «الف | ب» وسط عدد می‌شکست، عنوان‌ها بی‌قالب بودند.
   قانون یکپارچه (همانِ کارت قیمت v1.6.9، حالا برای همه):
     ۱) هر پیام: عنوان bold + خط جداکننده + ردیف‌ها + پاصفحه — همان اسکلت.
     ۲) فارسی: اولِ هر خط RLM (U+200F) تا همهٔ خط‌ها RTL و راست‌چین شوند.
     ۳) هر واقعیت یک خط جدا — هرگز دو عدد با «|» در یک خط.
     ۴) HTML (parse_mode=HTML): عنوان <b>، عددها <code>؛ محتوا escape می‌شود. */

const RLM = '\u200F';

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function code(v) { return v == null ? null : '<code>' + esc(v) + '</code>'; }

// lines: آرایهٔ رشته‌های HTML — در فارسی RLM می‌گیرند و با \n به هم می‌چسبند.
function renderLines(lang, lines) {
  const kept = (lines || []).filter(x => x !== null && x !== undefined && x !== '');
  if (lang === 'fa') return kept.map(x => RLM + x).join('\n');
  return kept.join('\n');
}

const SEPARATOR = '━━━━━━━━━━━━━━';

// اسکلت یک بخش: [عنوان bold] [جداکننده] ...ردیف‌ها... [پاصفحه]
function section(lang, title, rows, footer) {
  const lines = ['<b>' + esc(title) + '</b>', SEPARATOR].concat(rows || []);
  if (footer) lines.push(footer);
  return renderLines(lang, lines);
}

window.__miniDisplay = { esc, code, renderLines, section, SEPARATOR, RLM };

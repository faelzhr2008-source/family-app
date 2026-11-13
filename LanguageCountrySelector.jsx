import { useEffect, useState } from 'react';

const COUNTRIES = [
  { code: 'AE', name: 'الإمارات العربية المتحدة 🇦🇪' },
  { code: 'SA', name: 'المملكة العربية السعودية 🇸🇦' },
  { code: 'KW', name: 'الكويت 🇰🇼' },
  { code: 'QA', name: 'قطر 🇶🇦' },
  { code: 'BH', name: 'البحرين 🇧🇭' },
  { code: 'OM', name: 'سلطنة عُمان 🇴🇲' },
  { code: 'EG', name: 'مصر 🇪🇬' },
  { code: 'JO', name: 'الأردن 🇯🇴' },
  { code: 'MA', name: 'المغرب 🇲🇦' },
  { code: 'DZ', name: 'الجزائر 🇩🇿' },
  { code: 'IQ', name: 'العراق 🇮🇶' },
  { code: 'US', name: 'United States 🇺🇸' },
  { code: 'GB', name: 'United Kingdom 🇬🇧' },
  { code: 'FR', name: 'France 🇫🇷' },
  { code: 'TR', name: 'Türkiye 🇹🇷' },
  { code: 'OTHER', name: 'دولة أخرى / Other 🌍' },
];

const LANGUAGES = [
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'en', label: 'English (الإنجليزية)' },
  { code: 'fr', label: 'Français (الفرنسية)' },
  { code: 'es', label: 'Español (الإسبانية)' },
  { code: 'de', label: 'Deutsch (الألمانية)' },
  { code: 'tr', label: 'Türkçe (التركية)' },
  { code: 'ur', label: 'اردو (الأردية)' },
  { code: 'id', label: 'Bahasa Indonesia (الإندونيسية)' },
  { code: 'hi', label: 'हिन्दी (الهندية)' },
  { code: 'zh-CN', label: '中文 (الصينية)' },
  { code: 'ru', label: 'Русский (الروسية)' },
];

export default function LanguageCountrySelector({ compact = false }) {
  const [country, setCountry] = useState(() => localStorage.getItem('family_country') || 'AE');
  const [lang, setLang] = useState(() => localStorage.getItem('family_lang') || 'ar');

  useEffect(() => {
    localStorage.setItem('family_country', country);
  }, [country]);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('family_lang', newLang);

    // ضبط اتجاه الصفحة تلقائياً
    document.documentElement.dir = ['ar', 'ur'].includes(newLang) ? 'rtl' : 'ltr';

    // تفعيل الترجمة الفورية عبر محرك الترجمة المدمج
    const selectEl = document.querySelector('.goog-te-combo');
    if (selectEl) {
      selectEl.value = newLang;
      selectEl.dispatchEvent(new Event('change'));
    } else if (newLang === 'ar') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.reload();
    } else {
      document.cookie = `googtrans=/ar/${newLang}; path=/;`;
      window.location.reload();
    }
  };

  return (
    <div
      className={`rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5 ${
        compact ? 'mb-5' : 'space-y-4'
      }`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-sky-900">
            🌍 البلد / Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-950 shadow-sm focus:border-sky-500 focus:outline-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-sky-900">
            🌐 اللغة / Language
          </label>
          <select
            value={lang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-950 shadow-sm focus:border-sky-500 focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
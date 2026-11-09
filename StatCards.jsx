export default function StatCards({ stats, champion }) {
  const cards = [
    { label: 'عدد الأطفال', value: stats.childrenCount, icon: '👧' },
    { label: 'مجموع النقاط', value: stats.totalPoints, icon: '⭐' },
    { label: 'المهام المعلقة', value: stats.pendingTasks, icon: '⏳' },
    { label: 'المهام المعتمدة', value: stats.approvedTasks, icon: '✅' },
    {
      label: 'بطل الشهر',
      value: champion ? champion.name : '—',
      sub: champion ? `${champion.monthPoints} نقطة هذا الشهر` : 'لا يوجد بعد',
      icon: '🏆',
      wide: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm ${
            c.wide ? 'col-span-2 lg:col-span-1' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-900/70">{c.label}</span>
            <span aria-hidden="true" className="text-xl">
              {c.icon}
            </span>
          </div>
          <p className="mt-2 truncate text-2xl font-bold text-emerald-800">{c.value}</p>
          {c.sub && <p className="mt-0.5 text-xs text-emerald-900/60">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}

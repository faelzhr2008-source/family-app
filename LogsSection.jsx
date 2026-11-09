import { useMemo, useState } from 'react';
import { Alert, EmptyState, Field, Section, btnPrimary, inputCls } from '../ui';

const TYPE_META = {
  approval: { label: 'مراجعة مهمة', cls: 'bg-emerald-100 text-emerald-800' },
  reward: { label: 'مكافأة', cls: 'bg-sky-100 text-sky-800' },
  penalty: { label: 'خصم', cls: 'bg-red-100 text-red-800' },
  purchase: { label: 'شراء', cls: 'bg-violet-100 text-violet-800' },
};

const FILTERS = [
  ['all', 'الكل'],
  ['approval', 'المهام'],
  ['reward', 'المكافآت'],
  ['penalty', 'الخصومات'],
  ['purchase', 'المشتريات'],
];

const formatTime = (iso) => new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });

function AdjustForm({ kids, onAdjust }) {
  const [form, setForm] = useState({ childId: '', kind: 'reward', points: '5', reason: '' });
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const res = onAdjust({ ...form, childId: form.childId || kids[0]?.id });
    if (res.ok) {
      setError('');
      setForm((f) => ({ ...f, reason: '' }));
    } else {
      setError(res.error);
    }
  };

  return (
    <form onSubmit={submit} className="mb-5 space-y-3 rounded-2xl bg-emerald-50/60 p-4">
      <h3 className="text-sm font-semibold text-emerald-900">إضافة مكافأة أو خصم</h3>
      {error && <Alert>{error}</Alert>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="الطفل" htmlFor="adj-child">
          <select id="adj-child" value={form.childId || kids[0]?.id || ''} onChange={set('childId')} className={inputCls}>
            {kids.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="النوع" htmlFor="adj-kind">
          <select id="adj-kind" value={form.kind} onChange={set('kind')} className={inputCls}>
            <option value="reward">مكافأة</option>
            <option value="penalty">خصم</option>
          </select>
        </Field>
        <Field label="النقاط" htmlFor="adj-points">
          <input
            id="adj-points"
            type="number"
            min="1"
            max="1000"
            inputMode="numeric"
            value={form.points}
            onChange={set('points')}
            className={inputCls}
          />
        </Field>
        <Field label="السبب" htmlFor="adj-reason">
          <input id="adj-reason" value={form.reason} onChange={set('reason')} className={inputCls} />
        </Field>
      </div>
      <button type="submit" className={btnPrimary}>
        تسجيل
      </button>
    </form>
  );
}

export default function LogsSection({ logs, kids, onAdjust }) {
  const [filter, setFilter] = useState('all');
  const visible = useMemo(
    () => (filter === 'all' ? logs : logs.filter((l) => l.type === filter)).slice(0, 100),
    [logs, filter]
  );

  return (
    <Section id="logs" title="سجل العمليات">
      {kids.length > 0 && <AdjustForm kids={kids} onAdjust={onAdjust} />}

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="تصفية السجل">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === key ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState>لا توجد عمليات مسجّلة.</EmptyState>
      ) : (
        <ul className="divide-y divide-emerald-100">
          {visible.map((l) => {
            const meta = TYPE_META[l.type] ?? TYPE_META.approval;
            return (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-emerald-950">{l.text}</p>
                  <p className="text-xs text-emerald-900/60">
                    {l.childName} · {formatTime(l.at)}
                  </p>
                </div>
                {l.points !== 0 && (
                  <span
                    dir="ltr"
                    className={`text-sm font-bold ${l.points > 0 ? 'text-emerald-700' : 'text-red-600'}`}
                  >
                    {l.points > 0 ? `+${l.points}` : l.points}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

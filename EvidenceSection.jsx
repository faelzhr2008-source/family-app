import { useState } from 'react';
import { Alert, EmptyState, Section, btnDanger, btnPrimary } from '../ui';

export default function EvidenceSection({ tasks, kids, onApprove, onReject }) {
  const [error, setError] = useState('');
  const queue = tasks.filter((t) => t.status === 'submitted');
  const nameOf = (id) => kids.find((c) => c.id === id)?.name ?? '—';

  const approve = (task) => {
    const res = onApprove(task.id);
    setError(res.ok ? '' : res.error);
  };

  const reject = (task) => {
    if (!window.confirm(`رفض المهمة «${task.title}»؟`)) return;
    const res = onReject(task.id);
    setError(res.ok ? '' : res.error);
  };

  return (
    <Section id="evidence" title={`مراجعة الأدلة${queue.length ? ` (${queue.length})` : ''}`}>
      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {queue.length === 0 ? (
        <EmptyState>لا توجد مهام بانتظار المراجعة.</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {queue.map((t) => (
            <article key={t.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
              <header className="mb-3">
                <h3 className="font-semibold text-emerald-950">{t.title}</h3>
                <p className="text-xs text-emerald-900/60">
                  {nameOf(t.childId)} · {t.points} نقطة
                </p>
              </header>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['قبل', t.beforeImage],
                  ['بعد', t.afterImage],
                ].map(([label, src]) => (
                  <figure key={label}>
                    <img
                      src={src}
                      alt={`صورة ${label} تنفيذ المهمة: ${t.title}`}
                      className="aspect-square w-full rounded-xl border border-emerald-100 bg-white object-cover"
                    />
                    <figcaption className="mt-1 text-center text-xs font-medium text-emerald-900/70">
                      {label}
                    </figcaption>
                  </figure>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <button type="button" className={`${btnPrimary} flex-1`} onClick={() => approve(t)}>
                  اعتماد المهمة
                </button>
                <button type="button" className={`${btnDanger} flex-1`} onClick={() => reject(t)}>
                  رفض المهمة
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

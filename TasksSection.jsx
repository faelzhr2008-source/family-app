import { useState } from 'react';
import { fileToDataUrl } from '../../utils/image';
import {
  Alert,
  EmptyState,
  Field,
  Modal,
  Section,
  btnDanger,
  btnPrimary,
  btnSecondary,
  btnSmall,
  inputCls,
} from '../ui';

export const STATUS_META = {
  pending: { label: 'بانتظار التنفيذ', cls: 'bg-amber-100 text-amber-800' },
  submitted: { label: 'بانتظار المراجعة', cls: 'bg-sky-100 text-sky-800' },
  approved: { label: 'معتمدة', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'مرفوضة', cls: 'bg-red-100 text-red-800' },
};

function TaskForm({ task, kids, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    task
      ? { title: task.title, description: task.description, points: String(task.points), childId: task.childId }
      : { title: '', description: '', points: '10', childId: kids[0]?.id ?? '' }
  );
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const res = onSubmit(form);
    if (res.ok) onCancel();
    else setError(res.error);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Field label="عنوان المهمة" htmlFor="task-title">
        <input id="task-title" value={form.title} onChange={set('title')} className={inputCls} />
      </Field>
      <Field label="الوصف (اختياري)" htmlFor="task-desc">
        <textarea
          id="task-desc"
          rows={3}
          value={form.description}
          onChange={set('description')}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="النقاط" htmlFor="task-points">
          <input
            id="task-points"
            type="number"
            min="1"
            max="1000"
            inputMode="numeric"
            value={form.points}
            onChange={set('points')}
            className={inputCls}
          />
        </Field>
        <Field label="الطفل" htmlFor="task-child">
          <select id="task-child" value={form.childId} onChange={set('childId')} className={inputCls}>
            {kids.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" className={`${btnPrimary} flex-1`}>
          حفظ
        </button>
        <button type="button" onClick={onCancel} className={btnSecondary}>
          إلغاء
        </button>
      </div>
    </form>
  );
}

function EvidenceForm({ onSubmit, onCancel }) {
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!before || !after) {
      setError('اختر صورة «قبل» وصورة «بعد»');
      return;
    }
    setSaving(true);
    try {
      const [b, a] = await Promise.all([fileToDataUrl(before), fileToDataUrl(after)]);
      const res = onSubmit(b, a);
      if (res.ok) onCancel();
      else setError(res.error);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Field label="صورة قبل" htmlFor="ev-before">
        <input
          id="ev-before"
          type="file"
          accept="image/*"
          onChange={(e) => setBefore(e.target.files[0] ?? null)}
          className={inputCls}
        />
      </Field>
      <Field label="صورة بعد" htmlFor="ev-after">
        <input
          id="ev-after"
          type="file"
          accept="image/*"
          onChange={(e) => setAfter(e.target.files[0] ?? null)}
          className={inputCls}
        />
      </Field>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className={`${btnPrimary} flex-1`}>
          {saving ? 'جارٍ المعالجة…' : 'إرسال للمراجعة'}
        </button>
        <button type="button" onClick={onCancel} className={btnSecondary}>
          إلغاء
        </button>
      </div>
    </form>
  );
}

export default function TasksSection({ tasks, kids, onAdd, onUpdate, onDelete, onAttachEvidence }) {
  const [modal, setModal] = useState(null); // { type: 'task' | 'evidence', task? }
  const [error, setError] = useState('');
  const nameOf = (id) => kids.find((c) => c.id === id)?.name ?? '—';

  const remove = (task) => {
    if (!window.confirm(`حذف المهمة «${task.title}»؟`)) return;
    const res = onDelete(task.id);
    setError(res.ok ? '' : res.error);
  };

  return (
    <Section
      id="tasks"
      title="إدارة المهام"
      action={
        <button
          type="button"
          className={btnPrimary}
          disabled={kids.length === 0}
          onClick={() => setModal({ type: 'task', task: null })}
        >
          + إضافة مهمة
        </button>
      }
    >
      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {kids.length === 0 ? (
        <EmptyState>أضف طفلًا أولًا ثم أنشئ له المهام.</EmptyState>
      ) : tasks.length === 0 ? (
        <EmptyState>لا توجد مهام بعد.</EmptyState>
      ) : (
        <ul className="divide-y divide-emerald-100">
          {tasks.map((t) => {
            const meta = STATUS_META[t.status];
            const canAttach = t.status === 'pending' || t.status === 'rejected';
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-emerald-950">{t.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                  </div>
                  {t.description && <p className="mt-0.5 text-sm text-emerald-900/70">{t.description}</p>}
                  <p className="mt-0.5 text-xs text-emerald-900/60">
                    {nameOf(t.childId)} · {t.points} نقطة
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canAttach && (
                    <button
                      type="button"
                      className={`${btnSecondary} ${btnSmall}`}
                      onClick={() => setModal({ type: 'evidence', task: t })}
                    >
                      إرفاق دليل
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${btnSecondary} ${btnSmall}`}
                    onClick={() => setModal({ type: 'task', task: t })}
                  >
                    تعديل
                  </button>
                  <button type="button" className={`${btnDanger} ${btnSmall}`} onClick={() => remove(t)}>
                    حذف
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal?.type === 'task' && (
        <Modal title={modal.task ? 'تعديل المهمة' : 'إضافة مهمة'} onClose={() => setModal(null)}>
          <TaskForm
            task={modal.task}
            kids={kids}
            onSubmit={(form) => (modal.task ? onUpdate(modal.task.id, form) : onAdd(form))}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === 'evidence' && (
        <Modal title={`دليل المهمة: ${modal.task.title}`} onClose={() => setModal(null)}>
          <EvidenceForm
            onSubmit={(before, after) => onAttachEvidence(modal.task.id, before, after)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </Section>
  );
}

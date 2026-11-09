import { useState } from 'react';
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

const emptyForm = { name: '', age: '', username: '', password: '' };

function ChildForm({ child, onSubmit, onCancel }) {
  const isEdit = !!child;
  const [form, setForm] = useState(
    child ? { name: child.name, age: String(child.age), username: child.username, password: '' } : emptyForm
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await onSubmit(form);
    setSaving(false);
    if (res.ok) onCancel();
    else setError(res.error);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Field label="الاسم" htmlFor="child-name">
        <input id="child-name" value={form.name} onChange={set('name')} className={inputCls} />
      </Field>
      <Field label="العمر" htmlFor="child-age">
        <input
          id="child-age"
          type="number"
          min="1"
          max="25"
          inputMode="numeric"
          value={form.age}
          onChange={set('age')}
          className={inputCls}
        />
      </Field>
      <Field label="اسم المستخدم" htmlFor="child-username">
        <input
          id="child-username"
          dir="ltr"
          autoComplete="off"
          value={form.username}
          onChange={set('username')}
          className={`${inputCls} text-left`}
        />
      </Field>
      <Field
        label="كلمة المرور"
        htmlFor="child-password"
        hint={isEdit ? 'اتركها فارغة للإبقاء على كلمة المرور الحالية' : '6 أحرف على الأقل'}
      >
        <input
          id="child-password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          className={`${inputCls} text-left`}
        />
      </Field>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className={`${btnPrimary} flex-1`}>
          {saving ? 'جارٍ الحفظ…' : 'حفظ'}
        </button>
        <button type="button" onClick={onCancel} className={btnSecondary}>
          إلغاء
        </button>
      </div>
    </form>
  );
}

export default function ChildrenSection({ kids, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null); // null | 'new' | child object
  const [error, setError] = useState('');

  const remove = (child) => {
    if (!window.confirm(`حذف ${child.name}؟ سيتم حذف مهامه أيضًا.`)) return;
    const res = onDelete(child.id);
    setError(res.ok ? '' : res.error);
  };

  return (
    <Section
      id="children"
      title="إدارة الأطفال"
      action={
        <button type="button" className={btnPrimary} onClick={() => setEditing('new')}>
          + إضافة طفل
        </button>
      }
    >
      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {kids.length === 0 ? (
        <EmptyState>لم تُضف أي طفل بعد.</EmptyState>
      ) : (
        <ul className="divide-y divide-emerald-100">
          {kids.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
              <div
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700"
              >
                {c.name.trim().charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-emerald-950">{c.name}</p>
                <p className="text-xs text-emerald-900/60">
                  {c.age} سنة · <span dir="ltr">@{c.username}</span> · {c.points} نقطة
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className={`${btnSecondary} ${btnSmall}`} onClick={() => setEditing(c)}>
                  تعديل
                </button>
                <button type="button" className={`${btnDanger} ${btnSmall}`} onClick={() => remove(c)}>
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'إضافة طفل' : 'تعديل بيانات الطفل'} onClose={() => setEditing(null)}>
          <ChildForm
            child={editing === 'new' ? null : editing}
            onSubmit={(form) => (editing === 'new' ? onAdd(form) : onUpdate(editing.id, form))}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </Section>
  );
}

import { useState } from 'react';
import { fileToDataUrl } from './image';
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
} from './ui';

const AVATARS = ['🦁', '🦄', '🚀', '🎨', '⚽', '🦖', '🐼', '🦊', '👑', '🌟', '🦋', '🤖'];

const emptyForm = { name: '', age: '', username: '', password: '', avatar: '🦁', photo: '' };

function ChildForm({ child, onSubmit, onCancel }) {
  const isEdit = !!child;
  const [form, setForm] = useState(
    child
      ? {
          name: child.name,
          age: String(child.age),
          username: child.username,
          password: '',
          avatar: child.avatar || '🦁',
          photo: child.photo || '',
        }
      : emptyForm
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({ ...f, photo: dataUrl }));
    } catch {
      setError('تعذّر تحميل الصورة، جرب صورة أصغر حجماً');
    }
  };

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

      {/* قسم اختيار صورة البروفايل أو الشخصية الكرتونية */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-sky-100 to-amber-100 text-4xl shadow-md">
          {form.photo ? (
            <img src={form.photo} alt={form.name} className="h-full w-full object-cover" />
          ) : (
            <span>{form.avatar || '🦁'}</span>
          )}
        </div>

        <div className="mb-3 flex flex-wrap justify-center gap-2">
          <label className="cursor-pointer rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-sky-700 shadow-sm border border-sky-200 hover:bg-sky-50">
            📷 رفع صورة
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
          {form.photo && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, photo: '' }))}
              className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-100"
            >
              حذف الصورة
            </button>
          )}
        </div>

        <p className="mb-2 text-xs font-semibold text-sky-800">أو اختر شخصية مفضلة:</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {AVATARS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm((f) => ({ ...f, avatar: icon, photo: '' }))}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition ${
                !form.photo && form.avatar === icon
                  ? 'scale-110 bg-sky-500 text-white shadow-md ring-2 ring-sky-300'
                  : 'bg-white hover:bg-sky-100 border border-sky-100'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

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
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const remove = (child) => {
    setError('');
    if (!window.confirm(`هل أنت متأكد من حذف حساب "${child.name}"؟`)) return;
    const res = onDelete(child.id);
    if (res && !res.ok) setError(res.error);
  };

  return (
    <Section
      title="إدارة الأطفال"
      action={
        <button type="button" onClick={() => setEditing('new')} className={btnPrimary}>
          + إضافة طفل
        </button>
      }
    >
      {error && <Alert className="mb-4">{error}</Alert>}

      {kids.length === 0 ? (
        <EmptyState message="لم تُضف أي طفل بعد. اضغط على (+ إضافة طفل) للبدء!" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kids.map((child) => (
            <div
              key={child.id}
              className="flex flex-col justify-between rounded-2xl border-2 border-sky-100 bg-white p-4 shadow-sm transition hover:border-sky-300"
            >
              <div className="flex items-center gap-3.5">
                {/* صورة البروفايل أو الشخصية الكرتونية */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-300 bg-gradient-to-br from-sky-100 to-amber-100 text-3xl shadow-sm">
                  {child.photo ? (
                    <img src={child.photo} alt={child.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{child.avatar || '🦁'}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-sky-950">{child.name}</h3>
                  <p className="text-xs font-medium text-sky-700">
                    العمر: {child.age} سنوات • @{child.username}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    ⭐ {child.points ?? 0} نقطة
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t border-sky-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditing(child)}
                  className={`${btnSmall} ${btnSecondary} flex-1`}
                >
                  تعديل البروفايل
                </button>
                <button
                  type="button"
                  onClick={() => remove(child)}
                  className={`${btnSmall} ${btnDanger}`}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? 'إضافة طفل جديد' : `تعديل بيانات ${editing.name}`}
          onClose={() => setEditing(null)}
        >
          <ChildForm
            child={editing === 'new' ? null : editing}
            onSubmit={(data) => (editing === 'new' ? onAdd(data) : onUpdate(editing.id, data))}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </Section>
  );
}

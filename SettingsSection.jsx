import { useState } from 'react';
import { MIN_PASSWORD_LENGTH, useAuth } from './AuthContext';
import { RECOVERY_QUESTION } from './storage';
import { Alert, Field, Section, btnPrimary, inputCls } from './ui';

function useSubmit(action) {
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const run = async (e, onSuccess) => {
    e.preventDefault();
    setError('');
    setDone(false);
    setSaving(true);
    const res = await action();
    setSaving(false);
    if (res.ok) {
      setDone(true);
      onSuccess?.();
    } else {
      setError(res.error);
    }
  };
  return { error, done, saving, run };
}

function ProfileForm() {
  const { currentUser, updateProfile } = useAuth();
  const [name, setName] = useState(currentUser.name);
  const { error, done, saving, run } = useSubmit(() => updateProfile({ name }));

  return (
    <form onSubmit={run} className="space-y-3">
      <h3 className="font-semibold text-emerald-900">الاسم الظاهر</h3>
      {error && <Alert>{error}</Alert>}
      {done && <Alert kind="success">تم حفظ الاسم.</Alert>}
      <Field label="اسم ولي الأمر" htmlFor="set-name">
        <input id="set-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>
      <button type="submit" disabled={saving} className={btnPrimary}>
        حفظ
      </button>
    </form>
  );
}

function RecoveryForm() {
  const { currentUser, setRecoveryAnswer } = useAuth();
  const [answer, setAnswer] = useState('');
  const [password, setPassword] = useState('');
  const { error, done, saving, run } = useSubmit(() => setRecoveryAnswer(answer, password));

  return (
    <form
      onSubmit={(e) =>
        run(e, () => {
          setAnswer('');
          setPassword('');
        })
      }
      className="space-y-3"
    >
      <h3 className="font-semibold text-emerald-900">سؤال الاسترداد</h3>
      <p className="text-sm text-emerald-900/70">
        {currentUser.hasRecoveryAnswer ? 'الإجابة محفوظة. يمكنك تغييرها هنا.' : 'لم تُحدَّد إجابة بعد.'}
      </p>
      {error && <Alert>{error}</Alert>}
      {done && <Alert kind="success">تم حفظ إجابة الاسترداد.</Alert>}
      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
        {RECOVERY_QUESTION}
      </div>
      <Field label="الإجابة" htmlFor="set-answer">
        <input
          id="set-answer"
          autoComplete="off"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="كلمة المرور الحالية" htmlFor="set-answer-pass">
        <input
          id="set-answer-pass"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputCls} text-left`}
        />
      </Field>
      <button type="submit" disabled={saving} className={btnPrimary}>
        حفظ الإجابة
      </button>
    </form>
  );
}

function PasswordForm() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState('');
  const { error, done, saving, run } = useSubmit(() => changePassword({ newPassword: next, currentPassword: current }));

  const submit = (e) => {
    if (next !== confirm) {
      e.preventDefault();
      setMismatch('كلمتا المرور غير متطابقتين');
      return;
    }
    setMismatch('');
    return run(e, () => {
      setCurrent('');
      setNext('');
      setConfirm('');
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="font-semibold text-emerald-900">تغيير كلمة المرور</h3>
      {(mismatch || error) && <Alert>{mismatch || error}</Alert>}
      {done && <Alert kind="success">تم تغيير كلمة المرور.</Alert>}
      {[
        ['set-cur', 'كلمة المرور الحالية', current, setCurrent, 'current-password'],
        ['set-new', 'كلمة المرور الجديدة', next, setNext, 'new-password'],
        ['set-conf', 'تأكيد كلمة المرور', confirm, setConfirm, 'new-password'],
      ].map(([id, label, value, setter, ac]) => (
        <Field
          key={id}
          label={label}
          htmlFor={id}
          hint={id === 'set-new' ? `${MIN_PASSWORD_LENGTH} أحرف على الأقل` : undefined}
        >
          <input
            id={id}
            type="password"
            dir="ltr"
            autoComplete={ac}
            value={value}
            onChange={(e) => setter(e.target.value)}
            className={`${inputCls} text-left`}
          />
        </Field>
      ))}
      <button type="submit" disabled={saving} className={btnPrimary}>
        تغيير كلمة المرور
      </button>
    </form>
  );
}

export default function SettingsSection() {
  return (
    <Section id="settings" title="الإعدادات">
      <div className="grid gap-8 lg:grid-cols-3">
        <ProfileForm />
        <RecoveryForm />
        <PasswordForm />
      </div>
    </Section>
  );
}

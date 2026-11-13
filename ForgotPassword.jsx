import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MIN_PASSWORD_LENGTH, useAuth } from './AuthContext';
import { RECOVERY_QUESTION } from './storage';
import AuthShell from './AuthShell';
import { Alert, Field, btnPrimary, btnSecondary, inputCls } from './ui';

export default function ForgotPassword() {
  const { forgotPassword, changePassword } = useAuth();
  const [step, setStep] = useState('verify'); // verify | reset | done
  const [email, setEmail] = useState('');
  const [answer, setAnswer] = useState('');
  const [token, setToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !answer.trim()) {
      setError('أدخل البريد الإلكتروني وإجابة سؤال الاسترداد');
      return;
    }
    setLoading(true);
    const res = await forgotPassword(email, answer);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setToken(res.resetToken);
    setStep('reset');
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف`);
      return;
    }
    if (newPassword !== confirm) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    setLoading(true);
    const res = await changePassword({ newPassword, resetToken: token });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNewPassword('');
    setConfirm('');
    setToken(null);
    setStep('done');
  };

  const footer = (
    <Link to="/login" className="font-medium text-emerald-700 underline-offset-4 hover:underline">
      العودة إلى تسجيل الدخول
    </Link>
  );

  return (
    <AuthShell
      title="استعادة كلمة المرور"
      subtitle={step === 'reset' ? 'اختر كلمة مرور جديدة' : 'تحقّق من هويتك للمتابعة'}
      footer={step === 'done' ? null : footer}
    >
      {step === 'verify' && (
        <form onSubmit={verify} noValidate className="space-y-5">
          {error && <Alert>{error}</Alert>}

          <Field label="البريد الإلكتروني" htmlFor="fp-email">
            <input
              id="fp-email"
              type="email"
              dir="ltr"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@family.local"
              className={`${inputCls} text-left`}
            />
          </Field>

          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <span className="block text-xs text-emerald-900/60">سؤال الاسترداد</span>
            <span className="font-semibold">{RECOVERY_QUESTION}</span>
          </div>

          <Field label="الإجابة" htmlFor="fp-answer">
            <input
              id="fp-answer"
              type="text"
              autoComplete="off"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={inputCls}
            />
          </Field>

          <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
            {loading ? 'جارٍ التحقق…' : 'تحقّق'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={reset} noValidate className="space-y-5">
          <Alert kind="success">تم التحقق بنجاح. أدخل كلمة المرور الجديدة.</Alert>
          {error && <Alert>{error}</Alert>}

          <Field label="كلمة المرور الجديدة" htmlFor="fp-new" hint={`${MIN_PASSWORD_LENGTH} أحرف على الأقل`}>
            <input
              id="fp-new"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${inputCls} text-left`}
            />
          </Field>

          <Field label="تأكيد كلمة المرور" htmlFor="fp-confirm">
            <input
              id="fp-confirm"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${inputCls} text-left`}
            />
          </Field>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className={`${btnPrimary} flex-1`}>
              {loading ? 'جارٍ الحفظ…' : 'تحديث كلمة المرور'}
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep('verify');
              }}
              className={btnSecondary}
            >
              رجوع
            </button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="space-y-5 text-center">
          <Alert kind="success">تم تحديث كلمة المرور بنجاح.</Alert>
          <Link to="/login" className={`${btnPrimary} w-full`}>
            تسجيل الدخول
          </Link>
        </div>
      )}
    </AuthShell>
  );
}

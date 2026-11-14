import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth, MIN_PASSWORD_LENGTH } from './AuthContext';
import { RECOVERY_QUESTION } from './storage';
import AuthShell from './AuthShell';
import LanguageCountrySelector from './LanguageCountrySelector';
import { Alert, Field, btnPrimary, inputCls } from './ui';

export default function Login() {
  const { isAuthenticated, role, login, loginChild, registerParent } = useAuth();
  const [mode, setMode] = useState('parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [familyEmail, setFamilyEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === 'child' ? '/dashboard' : '/admin'} replace />;
  }

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setPassword('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      setLoading(true);
      const res = await registerParent({ name, email, password, recoveryAnswer });
      setLoading(false);
      if (!res.ok) setError(res.error);
      return;
    }

    if (mode === 'parent') {
      if (!email.trim() || !password) {
        setError('أدخل البريد الإلكتروني وكلمة المرور');
        return;
      }
      setLoading(true);
      const res = await login(email, password, remember);
      setLoading(false);
      if (!res.ok) setError(res.error);
    } else {
      if (!familyEmail.trim() || !username.trim() || !password) {
        setError('أدخل بريد العائلة واسم المستخدم وكلمة المرور');
        return;
      }
      setLoading(true);
      const res = await loginChild(familyEmail, username, password, remember);
      setLoading(false);
      if (!res.ok) setError(res.error);
    }
  };

  return (
    <AuthShell
      title="لوحة العائلة"
      subtitle={
        mode === 'register'
          ? 'أنشئ حساباً مستقلاً لعائلتك مجاناً في ثوانٍ'
          : mode === 'parent'
          ? 'سجّل الدخول كولي أمر لإدارة الأطفال والمهام'
          : 'أهلاً بك يا بطل! سجّل الدخول لمتابعة مهامك ونقاطك'
      }
    >
      <LanguageCountrySelector compact />

      <div className="mb-6 grid grid-cols-3 gap-1.5 rounded-2xl bg-sky-100/80 p-1.5 border border-sky-200">
        <button
          type="button"
          onClick={() => switchMode('parent')}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition ${
            mode === 'parent' ? 'bg-sky-600 text-white shadow-md' : 'text-sky-800 hover:bg-white/60'
          }`}
        >
          <span>👨‍👩‍👧‍👦</span>
          <span>ولي الأمر</span>
        </button>

        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition ${
            mode === 'register' ? 'bg-emerald-600 text-white shadow-md' : 'text-sky-800 hover:bg-white/60'
          }`}
        >
          <span>✨</span>
          <span>عائلة جديدة</span>
        </button>

        <button
          type="button"
          onClick={() => switchMode('child')}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition ${
            mode === 'child' ? 'bg-amber-500 text-white shadow-md' : 'text-sky-800 hover:bg-white/60'
          }`}
        >
          <span>🧒</span>
          <span>الطفل</span>
        </button>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}

        {mode === 'register' && (
          <>
            <Field label="اسم ولي الأمر أو العائلة" htmlFor="reg-name">
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: عائلة أحمد"
                className={inputCls}
              />
            </Field>

            <Field label="البريد الإلكتروني للعائلة" htmlFor="reg-email">
              <input
                id="reg-email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`${inputCls} text-left`}
              />
            </Field>
          </>
        )}

        {mode === 'parent' && (
          <Field label="البريد الإلكتروني" htmlFor="email">
            <input
              id="email"
              type="email"
              dir="ltr"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`${inputCls} text-left`}
            />
          </Field>
        )}

        {mode === 'child' && (
          <>
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-center text-xs font-medium text-amber-900">
              🌟 أدخل بريد العائلة واسم المستخدم وكلمة المرور من والديك.
            </div>
            <Field label="البريد الإلكتروني للعائلة (بريد ولي الأمر)" htmlFor="child-family-email">
              <input
                id="child-family-email"
                type="email"
                dir="ltr"
                value={familyEmail}
                onChange={(e) => setFamilyEmail(e.target.value)}
                placeholder="parent@example.com"
                className={`${inputCls} text-left`}
              />
            </Field>
            <Field label="اسم المستخدم للطفل" htmlFor="child-username">
              <input
                id="child-username"
                type="text"
                dir="ltr"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className={`${inputCls} text-left`}
              />
            </Field>
          </>
        )}

        <Field
          label="كلمة المرور"
          htmlFor="password"
          hint={mode === 'register' ? `${MIN_PASSWORD_LENGTH} أحرف على الأقل` : undefined}
        >
          <div dir="ltr" className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-16 text-left`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-medium text-sky-700 hover:bg-sky-50"
            >
              {showPassword ? 'إخفاء' : 'إظهار'}
            </button>
          </div>
        </Field>

        {mode === 'register' && (
          <Field label={`سؤال استرداد كلمة المرور: ${RECOVERY_QUESTION}`} htmlFor="reg-recovery">
            <input
              id="reg-recovery"
              type="text"
              value={recoveryAnswer}
              onChange={(e) => setRecoveryAnswer(e.target.value)}
              placeholder="اكتب الإجابة لحفظها عند نسيان كلمة المرور"
              className={inputCls}
            />
          </Field>
        )}

        {mode !== 'register' && (
          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-sky-900">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
              />
              تذكّرني
            </label>
            {mode === 'parent' && (
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`${btnPrimary} w-full ${
            mode === 'register'
              ? '!bg-emerald-600 hover:!bg-emerald-700'
              : mode === 'child'
              ? '!bg-amber-500 hover:!bg-amber-600'
              : ''
          }`}
        >
          {loading
            ? 'جارٍ المعالجة…'
            : mode === 'register'
            ? 'إنشاء حساب العائلة مجاناً ✨'
            : mode === 'parent'
            ? 'دخول ولي الأمر'
            : 'انطلق إلى مهامي 🚀'}
        </button>
      </form>
    </AuthShell>
  );
}

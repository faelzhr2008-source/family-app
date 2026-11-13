import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import AuthShell from './AuthShell';
import LanguageCountrySelector from './LanguageCountrySelector';
import { Alert, Field, btnPrimary, inputCls } from './ui';

export default function Login() {
  const { isAuthenticated, role, login, loginChild, currentUser } = useAuth();
  const [loginType, setLoginType] = useState('parent'); // 'parent' | 'child'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === 'child' ? '/dashboard' : '/admin'} replace />;
  }

  const isDefaultAccount = currentUser?.usingDefaultPassword !== false;

  const switchType = (type) => {
    setLoginType(type);
    setError('');
    setPassword('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (loginType === 'parent') {
      if (!email.trim() || !password) {
        setError('أدخل البريد الإلكتروني وكلمة المرور');
        return;
      }
      if (!/^\S+@\S+$/.test(email.trim())) {
        setError('صيغة البريد الإلكتروني غير صحيحة');
        return;
      }
      setLoading(true);
      const res = await login(email, password, remember);
      setLoading(false);
      if (!res.ok) setError(res.error);
    } else {
      if (!username.trim() || !password) {
        setError('أدخل اسم المستخدم وكلمة المرور');
        return;
      }
      setLoading(true);
      const res = await loginChild(username, password, remember);
      setLoading(false);
      if (!res.ok) setError(res.error);
    }
  };

  return (
    <AuthShell
      title="لوحة العائلة"
      subtitle={
        loginType === 'parent'
          ? 'سجّل الدخول كولي أمر لإدارة الأطفال والمهام'
          : 'أهلاً بك يا بطل! سجّل الدخول لمتابعة مهامك ونقاطك'
      }
    >
      {/* اختيار البلد واللغة قبل تسجيل الدخول */}
      <LanguageCountrySelector compact />

      {/* أزرار الاختيار بين ولي الأمر والطفل */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-sky-100/80 p-1.5 border border-sky-200">
        <button
          type="button"
          onClick={() => switchType('parent')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
            loginType === 'parent'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-sky-800 hover:bg-white/60'
          }`}
        >
          <span>👨‍👩‍👧‍👦</span>
          <span>ولي الأمر</span>
        </button>

        <button
          type="button"
          onClick={() => switchType('child')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
            loginType === 'child'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-sky-800 hover:bg-white/60'
          }`}
        >
          <span>🧒</span>
          <span>الطفل</span>
        </button>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {loginType === 'parent' && isDefaultAccount && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-3.5 text-sm text-sky-900 space-y-2.5">
            <div className="text-right" dir="rtl">
              <p className="font-bold text-sky-800 mb-1">💡 للمستخدمين الجدد (الدخول الأول):</p>
              <p>البريد: <span className="font-mono font-semibold" dir="ltr">parent@family.local</span></p>
              <p>كلمة المرور: <span className="font-mono font-semibold" dir="ltr">12345678</span></p>
            </div>

            <hr className="border-sky-200/80" />

            <div className="text-left" dir="ltr">
              <p className="font-bold text-sky-800 mb-1">💡 First-Time Login:</p>
              <p>Email: <span className="font-mono font-semibold">parent@family.local</span></p>
              <p>Password: <span className="font-mono font-semibold">12345678</span></p>
            </div>
          </div>
        )}

        {loginType === 'child' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-center text-xs font-medium text-amber-900">
            🌟 أدخل اسم المستخدم وكلمة المرور اللذين أنشأهما لك والدك أو والدتك.
          </div>
        )}

        {error && <Alert>{error}</Alert>}

        {loginType === 'parent' ? (
          <Field label="البريد الإلكتروني" htmlFor="email">
            <input
              id="email"
              type="email"
              dir="ltr"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@family.local"
              className={`${inputCls} text-left`}
            />
          </Field>
        ) : (
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
        )}

        <Field label="كلمة المرور" htmlFor="password">
          <div dir="ltr" className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
          {loginType === 'parent' && (
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${btnPrimary} w-full ${
            loginType === 'child' ? '!bg-amber-500 hover:!bg-amber-600' : ''
          }`}
        >
          {loading
            ? 'جارٍ التحقق…'
            : loginType === 'parent'
            ? 'دخول ولي الأمر'
            : 'انطلق إلى مهامي 🚀'}
        </button>
      </form>
    </AuthShell>
  );
}
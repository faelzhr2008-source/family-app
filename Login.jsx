import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import { Alert, Field, btnPrimary, inputCls } from '../components/ui';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
    // On success isAuthenticated flips to true and we redirect to /admin above.
  };

  return (
    <AuthShell title="لوحة العائلة" subtitle="سجّل الدخول لإدارة الأطفال والمهام">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {error && <Alert>{error}</Alert>}

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
              className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
            >
              {showPassword ? 'إخفاء' : 'إظهار'}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-900">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            تذكّرني
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
          >
            نسيت كلمة المرور؟
          </Link>
        </div>

        <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
          {loading ? 'جارٍ التحقق…' : 'تسجيل الدخول'}
        </button>
      </form>
    </AuthShell>
  );
}

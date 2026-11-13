import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Header from './Header';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import Admin from './Admin';
import Dashboard from './Dashboard';

const FLOATING_ITEMS = [
  { icon: '⭐', top: '8%', left: '10%', size: 'text-3xl', delay: '0s', duration: '12s' },
  { icon: '🎈', top: '20%', left: '85%', size: 'text-4xl', delay: '2s', duration: '15s' },
  { icon: '🌟', top: '45%', left: '12%', size: 'text-2xl', delay: '4s', duration: '11s' },
  { icon: '🏆', top: '65%', left: '88%', size: 'text-3xl', delay: '1s', duration: '14s' },
  { icon: '🎨', top: '78%', left: '18%', size: 'text-3xl', delay: '3s', duration: '13s' },
  { icon: '🚀', top: '32%', left: '78%', size: 'text-3xl', delay: '5s', duration: '16s' },
  { icon: '🌈', top: '12%', left: '52%', size: 'text-4xl', delay: '2.5s', duration: '14s' },
  { icon: '✨', top: '85%', left: '65%', size: 'text-2xl', delay: '0.5s', duration: '10s' },
  { icon: '🧸', top: '52%', left: '92%', size: 'text-3xl', delay: '3.5s', duration: '15s' },
  { icon: '💫', top: '88%', left: '38%', size: 'text-3xl', delay: '1.5s', duration: '12s' },
];

function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* دوائر ضوئية ملونة تتحرك بنعومة في الزوايا */}
      <div className="animate-blob absolute -top-20 -left-20 h-80 w-80 rounded-full bg-sky-300/35 blur-3xl" />
      <div className="animate-blob animation-delay-2000 absolute top-1/4 -right-20 h-96 w-96 rounded-full bg-amber-300/35 blur-3xl" />
      <div className="animate-blob animation-delay-4000 absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-pink-300/35 blur-3xl" />

      {/* الرموز العائلية والنجوم الطافية */}
      {FLOATING_ITEMS.map((item, idx) => (
        <span
          key={idx}
          style={{
            top: item.top,
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
          className={`animate-float-item absolute opacity-30 ${item.size}`}
        >
          {item.icon}
        </span>
      ))}
    </div>
  );
}

function Layout() {
  return (
    <div dir="rtl" className="relative z-10 min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </>
  );
}
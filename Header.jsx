import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-white/20 text-white' : 'text-emerald-50/80 hover:bg-white/10 hover:text-white'
  }`;

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-emerald-700 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-lg">
            🏡
          </span>
          <span className="hidden text-base font-bold sm:block">لوحة العائلة</span>
        </div>

        <nav className="flex items-center gap-1" aria-label="التنقل الرئيسي">
          <NavLink to="/admin" className={linkCls}>
            الإدارة
          </NavLink>
          <NavLink to="/dashboard" className={linkCls}>
            اللوحة
          </NavLink>
        </nav>

        <div className="ms-auto flex items-center gap-3">
          <span className="max-w-[9rem] truncate text-sm text-emerald-50">{currentUser?.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </header>
  );
}

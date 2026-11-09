export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-4 py-10"
    >
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-2xl text-white shadow-lg shadow-emerald-600/30"
          >
            🏡
          </div>
          <h1 className="text-2xl font-bold text-emerald-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-emerald-900/60">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-900/5 sm:p-8">
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}

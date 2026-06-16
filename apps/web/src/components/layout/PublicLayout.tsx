import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-brand-base flex flex-col font-sans">
      <header className="h-16 flex items-center justify-between px-6 lg:px-12 shrink-0 bg-white border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/logo.svg" alt="PulseWatch Logo" className="w-8 h-auto" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-brand-base">PulseWatch</span>
        </div>
      </header>

      <main className="flex-1 bg-slate-50">
        <Outlet />
      </main>

      <footer className="h-16 flex items-center justify-center border-t border-slate-200 mt-12 shrink-0 bg-white">
        <p className="text-sm text-slate-500 flex items-center">
          Powered by <img src="/logo.svg" alt="PulseWatch Logo" className="w-4 h-auto mx-1.5 grayscale" /> PulseWatch
        </p>
      </footer>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePropostasPendentes } from '../hooks/usePropostasPendentes';

interface NavItem {
  label: string;
  to: string;
  badge?: 'pendentes' | number;
}
interface NavbarProps {
  items?: NavItem[];
}

export function Navbar({ items = [] }: NavbarProps) {
  const { logout, tipo } = useAuth();
  const { pathname } = useLocation();
  const pendentes = usePropostasPendentes();

  function resolveBadge(item: NavItem): number {
    if (item.badge === 'pendentes') return pendentes;
    if (typeof item.badge === 'number') return item.badge;
    if (item.label === 'Meus Casos') return pendentes;
    return 0;
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8 min-w-0">
          <Link to="/" className="flex items-center shrink-0">
            <img src="/logo-full.png" alt="Ponte Jurídica" className="h-9 w-auto" />
          </Link>

          {items.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {items.map((item) => {
                const badge = resolveBadge(item);
                const ativo = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      ativo
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-700 capitalize">{tipo}</span>
            <span className="text-xs text-slate-400">Portal {tipo === 'advogado' ? 'Jurídico' : 'do Cliente'}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">{tipo?.[0]?.toUpperCase()}</span>
          </div>
          <button
            onClick={logout}
            type="button"
            className="text-sm text-slate-400 hover:text-red-500 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

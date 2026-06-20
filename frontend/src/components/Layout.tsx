import React, { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Gauge, Sun, Moon, LogOut, DollarSign,
  LayoutDashboard, Car, Users, Wallet, BarChart2, Building2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFilial } from '../auth/FilialContext';

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, logout, temPerfil } = useAuth();
  const { isGlobal, filiais, filialAtiva, setFilialAtiva } = useFilial();
  const location = useLocation();
  const podeVerCaixa = temPerfil('ADMIN', 'FINANCEIRO');
  const isAdmin = temPerfil('ADMIN');
  const [dark, setDark] = useState(() => localStorage.getItem('gv_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('gv_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const userInitials = usuario?.nome?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 shadow-xl dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-0">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 py-3 font-bold tracking-tight text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-900/40">
                <Gauge size={20} className="text-white" />
              </div>
              <span className="flex flex-col leading-none">
                <span className="text-[17px] font-bold tracking-tight">AutoGestor</span>
                <span className="text-[10px] font-normal text-slate-400">Gestão Inteligente de Veículos</span>
              </span>
            </Link>

            {/* Nav */}
            <nav className="flex">
              <NavLink to="/dashboard" label="Dashboard" active={location.pathname.startsWith('/dashboard')} icon={LayoutDashboard} />
              <NavLink to="/veiculos" label="Estoque" active={location.pathname.startsWith('/veiculos')} icon={Car} />
              <NavLink to="/clientes" label="Clientes" active={location.pathname.startsWith('/clientes')} icon={Users} />
              {podeVerCaixa && (
                <NavLink to="/caixa" label="Caixa" active={location.pathname.startsWith('/caixa')} icon={Wallet} />
              )}
              {podeVerCaixa && (
                <NavLink to="/relatorios" label="Relatórios" active={location.pathname.startsWith('/relatorios')} icon={BarChart2} />
              )}
              {podeVerCaixa && (
                <NavLink to="/parcelas" label="Parcelas" active={location.pathname.startsWith('/parcelas')} icon={DollarSign} />
              )}
              {isAdmin && (
                <NavLink to="/filiais" label="Filiais" active={location.pathname.startsWith('/filiais')} icon={Building2} />
              )}
              {isAdmin && (
                <NavLink
                  to="/notificacoes"
                  label="WhatsApp"
                  active={location.pathname.startsWith('/notificacoes')}
                  icon={WhatsAppIcon}
                  iconClassName="text-green-400"
                />
              )}
            </nav>
          </div>

          {/* Direita */}
          <div className="flex items-center gap-2">
            {isGlobal && (
              <select
                className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                value={filialAtiva ?? ''}
                onChange={(e) => setFilialAtiva(e.target.value || undefined)}
                title="Filial em visualizacao"
              >
                <option value="">Todas as filiais</option>
                {filiais.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setDark((d) => !d)}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              title="Alternar tema"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex items-center gap-2 rounded-md px-2 py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-violet-500 text-xs font-bold text-white shadow-md">
                {userInitials}
              </div>
              <span className="hidden text-sm text-slate-300 sm:inline">{usuario?.nome}</span>
            </div>
            <button
              onClick={logout}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({
  to, label, active, icon: Icon, iconClassName,
}: {
  to: string;
  label: string;
  active: boolean;
  icon?: React.ElementType;
  iconClassName?: string;
}) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 px-3.5 py-4 text-sm font-medium transition-colors ${
        active
          ? 'text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-brand-400'
          : 'text-slate-400 hover:text-slate-100'
      }`}
    >
      {Icon && <Icon size={14} className={iconClassName} />}
      {label}
    </Link>
  );
}

import React, { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Sun, Moon, LogOut, MessageCircle, DollarSign } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFilial } from '../auth/FilialContext';

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
      {/* Header escuro */}
      <header className="bg-slate-900 shadow-lg dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-0">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 py-3 font-bold tracking-tight text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                <Car size={18} className="text-white" />
              </div>
              <span className="flex flex-col leading-none">
                <span className="text-base">AutoGestor</span>
                <span className="text-[10px] font-normal text-slate-400">Gestão Inteligente de Veículos</span>
              </span>
            </Link>

            {/* Nav */}
            <nav className="flex">
              <NavLink to="/dashboard" label="Dashboard" active={location.pathname.startsWith('/dashboard')} />
              <NavLink to="/veiculos" label="Estoque" active={location.pathname.startsWith('/veiculos')} />
              <NavLink to="/clientes" label="Clientes" active={location.pathname.startsWith('/clientes')} />
              {podeVerCaixa && (
                <NavLink to="/caixa" label="Caixa" active={location.pathname.startsWith('/caixa')} />
              )}
              {podeVerCaixa && (
                <NavLink to="/relatorios" label="Relatorios" active={location.pathname.startsWith('/relatorios')} />
              )}
              {podeVerCaixa && (
                <NavLink to="/parcelas" label="Parcelas" active={location.pathname.startsWith('/parcelas')} icon={DollarSign} />
              )}
              {isAdmin && (
                <NavLink to="/filiais" label="Filiais" active={location.pathname.startsWith('/filiais')} />
              )}
              {isAdmin && (
                <NavLink to="/notificacoes" label="WhatsApp" active={location.pathname.startsWith('/notificacoes')} icon={MessageCircle} />
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
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
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

function NavLink({ to, label, active, icon: Icon }: { to: string; label: string; active: boolean; icon?: React.ElementType }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 px-4 py-4 text-sm font-medium transition-colors ${
        active
          ? 'text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-brand-400'
          : 'text-slate-400 hover:text-slate-100'
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
    </Link>
  );
}

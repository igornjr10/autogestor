import React, { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Car, Users, Wallet, BarChart2, DollarSign, Building2, HardDrive, UserCog,
  LogOut, Search, Bell, HelpCircle, SlidersHorizontal, Settings, Sun, Moon, Crown,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFilial } from '../auth/FilialContext';
import logoImg from '../assets/logo-banner.png';

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const SIDEBAR_W = 215;

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, logout, temPerfil } = useAuth();
  const { isGlobal, filiais, filialAtiva, setFilialAtiva } = useFilial();
  const location = useLocation();
  const podeVerCaixa = temPerfil('ADMIN', 'FINANCEIRO');
  const isAdmin = temPerfil('ADMIN');
  const [dark, setDark] = useState(() => localStorage.getItem('gv_theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('gv_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const userInitials = usuario?.nome?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const at = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen" style={{ background: '#0d1117' }}>

      {/* ── SIDEBAR ── */}
      <aside
        className="fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-slate-800/50"
        style={{ width: SIDEBAR_W, background: '#0d1117' }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-4">
          <Link to="/">
            <img src={logoImg} alt="AutoGestor" style={{ height: '38px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }} />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
          <SideLink to="/dashboard"    label="Dashboard"  active={at('/dashboard')}    icon={LayoutDashboard} />
          <SideLink to="/veiculos"     label="Estoque"    active={at('/veiculos')}     icon={Car} />
          <SideLink to="/clientes"     label="Clientes"   active={at('/clientes')}     icon={Users} />
          {podeVerCaixa && <SideLink to="/caixa"      label="Caixa"      active={at('/caixa')}      icon={Wallet} />}
          {podeVerCaixa && <SideLink to="/relatorios" label="Relatórios" active={at('/relatorios')} icon={BarChart2} />}
          {podeVerCaixa && <SideLink to="/parcelas"   label="Parcelas"   active={at('/parcelas')}   icon={DollarSign} />}
          {isAdmin      && <SideLink to="/filiais"    label="Filiais"    active={at('/filiais')}    icon={Building2} />}
          {isAdmin      && (
            <SideLink
              to="/notificacoes"
              label="WhatsApp"
              active={at('/notificacoes')}
              icon={WhatsAppIcon}
              iconClass="text-green-400"
            />
          )}
          {isAdmin      && <SideLink to="/usuarios" label="Usuários"  active={at('/usuarios')}  icon={UserCog} />}
          {isAdmin      && <SideLink to="/backup"  label="Backup"    active={at('/backup')}    icon={HardDrive} />}
        </nav>

        {/* Planos */}
        <div className="px-2 pb-2">
          <div className="rounded-xl p-3" style={{ background: 'rgba(30,41,59,0.6)' }}>
            <div className="mb-1 flex items-center gap-2">
              <Crown size={13} className="text-yellow-400" />
              <p className="text-xs font-semibold text-slate-200">Planos e benefícios</p>
            </div>
            <p className="text-[11px] text-slate-400">
              Seu plano atual e{' '}
              <span className="font-semibold text-yellow-400">Premium</span>
            </p>
            <button className="mt-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
              Gerenciar plano
            </button>
          </div>
        </div>

        {/* Usuário */}
        <div className="border-t border-slate-800/50 p-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)' }}
            >
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{usuario?.nome}</p>
              <p className="truncate text-[10px] text-slate-500">{usuario?.email}</p>
            </div>
            <button
              onClick={logout}
              className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:text-rose-400"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex min-h-screen flex-1 flex-col" style={{ marginLeft: SIDEBAR_W }}>

        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-end gap-1.5 border-b border-slate-800/50 px-6 py-2.5 backdrop-blur-sm"
          style={{ background: 'rgba(13,17,23,0.95)' }}
        >
          {isGlobal && (
            <select
              className="mr-2 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              value={filialAtiva ?? ''}
              onChange={(e) => setFilialAtiva(e.target.value || undefined)}
            >
              <option value="">Todas as filiais</option>
              {filiais.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          )}

          {/* Search */}
          <button
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)' }}
          >
            <Search size={13} />
            <span>Buscar no sistema...</span>
            <kbd className="ml-3 rounded px-1.5 py-0.5 text-[10px] text-slate-500" style={{ background: 'rgba(255,255,255,0.08)' }}>Ctrl+K</kbd>
          </button>

          <button onClick={() => setDark(d => !d)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            <Bell size={15} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            <HelpCircle size={15} />
          </button>
          <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            <SlidersHorizontal size={15} />
          </button>
          <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            <Settings size={15} />
          </button>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function SideLink({
  to, label, active, icon: Icon, iconClass = '',
}: {
  to: string; label: string; active: boolean; icon: React.ElementType; iconClass?: string;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? 'bg-indigo-500/15 text-indigo-300'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <Icon size={16} className={active ? 'text-indigo-400' : iconClass || 'text-slate-500'} />
      {label}
    </Link>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { getApiError } from '../lib/api';
import { Mail, Lock, Eye, EyeOff, ArrowRight, BarChart2, Shield, Car, TrendingUp } from 'lucide-react';

const schema = z.object({
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
});
type FormData = z.infer<typeof schema>;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function FuelIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V7a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15" />
      <path d="M14 9h2a2 2 0 0 1 2 2v2.5a1.5 1.5 0 0 0 3 0V9l-3-4" />
      <line x1="3" y1="22" x2="14" y2="22" />
    </svg>
  );
}

/* ──────────── mini mockup do dashboard ──────────── */
function DashboardMockup() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* cartão superior direito */}
      <div
        className="absolute right-[-40px] top-[60px] w-[340px] rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm"
        style={{ transform: 'perspective(800px) rotateY(-8deg) rotateX(4deg)' }}
      >
        <p className="mb-3 text-xs font-semibold text-white/60">Dashboard — Visão Geral</p>
        <div className="mb-3 flex gap-3">
          <div className="flex-1 rounded-lg bg-indigo-500/20 p-3">
            <p className="text-[10px] text-indigo-300">Veículos</p>
            <p className="text-2xl font-bold text-white">128</p>
            <p className="text-[10px] text-emerald-400">Ativos</p>
          </div>
          <div className="flex-1 rounded-lg bg-violet-500/20 p-3">
            <p className="text-[10px] text-violet-300">Vendas</p>
            <p className="text-2xl font-bold text-white">84</p>
            <p className="text-[10px] text-violet-400">Este mês</p>
          </div>
        </div>
        {/* mini bar chart */}
        <p className="mb-2 text-[10px] text-white/50">Gastos por mês</p>
        <div className="flex items-end gap-1 h-14">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background: 'linear-gradient(to top, #6366f1, #8b5cf6)',
                opacity: i === 5 ? 1 : 0.5 + i * 0.06,
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[8px] text-white/30">
          {['Jan','Fev','Mar','Abr','Mai','Jun','Jul'].map(m => <span key={m}>{m}</span>)}
        </div>
      </div>

      {/* cartão inferior direito */}
      <div
        className="absolute bottom-[40px] right-[-20px] w-[280px] rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm"
        style={{ transform: 'perspective(800px) rotateY(-6deg) rotateX(-3deg)' }}
      >
        <p className="mb-2 text-xs font-semibold text-white/60">Quilometragem por mês</p>
        <div className="flex items-end gap-1 h-16">
          {[30, 55, 40, 70, 50, 85, 60, 75].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background: 'linear-gradient(to top, #3b82f6, #6366f1)',
                opacity: 0.5 + i * 0.06,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────── página principal ──────────── */
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' });

  async function onSubmit(data: FormData) {
    setErro('');
    try {
      await login(data.email, data.senha);
      navigate('/veiculos');
    } catch (e) {
      setErro(getApiError(e));
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#060d1f' }}>

      {/* ── ESQUERDA ── */}
      <div className="relative hidden flex-1 flex-col justify-center overflow-hidden px-16 lg:flex">
        {/* glow de fundo */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 30% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
        />

        <DashboardMockup />

        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/30"
              style={{ background: 'linear-gradient(135deg, #4f6ef7, #8b5cf6)' }}
            >
              <Car size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                <span className="text-white">Auto</span>
                <span style={{ background: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Gestor
                </span>
              </p>
              <p className="text-xs text-slate-400">Controle Inteligente de Frotas</p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white">
            Gestão Inteligente<br />de{' '}
            <span style={{ background: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Veículos
            </span>
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-slate-400">
            Tenha o controle completo da sua frota em um só lugar.
            Mais eficiência, economia e segurança para o seu negócio.
          </p>

          {/* Features */}
          <div className="space-y-3">
            {[
              { icon: Car,       label: '250+ veículos monitorados' },
              { icon: FuelIcon,  label: 'Controle de combustível' },
              { icon: BarChart2, label: 'Relatórios em tempo real' },
              { icon: Shield,    label: 'Segurança e dados protegidos' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)' }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'linear-gradient(135deg, rgba(79,110,247,0.3), rgba(139,92,246,0.3))' }}
                >
                  <Icon size={16} className="text-indigo-300" />
                </div>
                <span className="text-sm font-medium text-slate-200">{label}</span>
              </div>
            ))}
          </div>

          {/* Badge segurança */}
          <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
            <Shield size={12} className="text-indigo-400" />
            Seus dados estão protegidos com{' '}
            <span className="text-indigo-400">criptografia de ponta</span>
          </div>
        </div>
      </div>

      {/* ── DIREITA (card de login) ── */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[480px]">
        <div
          className="w-full max-w-sm rounded-3xl p-8"
          style={{
            background: 'rgba(15,22,45,0.95)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 0 80px rgba(99,102,241,0.12), 0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Avatar */}
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg shadow-indigo-500/30"
              style={{ background: 'linear-gradient(135deg, #4f6ef7, #8b5cf6)' }}
            >
              <Car size={32} className="text-white" />
            </div>
          </div>

          {/* Título */}
          <h2 className="mb-1 text-center text-2xl font-bold text-white">
            Bem-vindo de{' '}
            <span style={{ background: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              volta!
            </span>
          </h2>
          <p className="mb-6 text-center text-sm text-slate-400">
            Entre com suas credenciais para acessar sua conta
          </p>

          {/* Erro */}
          {erro && (
            <div className="mb-4 rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="username"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full rounded-xl py-3 pl-10 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('senha')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.senha && <p className="mt-1 text-xs text-red-400">{errors.senha.message}</p>}
            </div>

            {/* Lembrar-me / Esqueceu */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <input type="checkbox" className="accent-indigo-500 rounded" />
                Lembrar-me
              </label>
              <button type="button" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                Esqueceu sua senha?
              </button>
            </div>

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4f6ef7, #8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.35)' }}
            >
              {isSubmitting ? 'Entrando…' : (
                <>
                  Entrar no sistema
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-xs text-slate-500">ou</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* Google (visual) */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          {/* Rodapé */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Não tem uma conta?{' '}
            <span className="cursor-pointer text-indigo-400 hover:text-indigo-300 transition-colors">
              Fale com o administrador
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}

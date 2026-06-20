import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { getApiError } from '../lib/api';
import { Mail, Lock, Eye, EyeOff, ArrowRight, BarChart2, Shield, Car } from 'lucide-react';
import logoImg from '../assets/logo-banner.png';

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

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

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
    <div className="relative flex min-h-screen" style={{ background: '#070d1e' }}>

      {/* ── glow de fundo ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 70% at 25% 50%, rgba(79,110,247,0.13) 0%, transparent 65%)',
      }} />

      {/* ── Dashboard mockup flutuante (centro-direita) ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* card superior */}
        <div className="absolute" style={{
          top: '8%', right: '36%',
          width: '320px',
          transform: 'perspective(900px) rotateY(-10deg) rotateX(5deg)',
        }}>
          <div style={{
            background: 'rgba(15,22,50,0.85)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, marginBottom: '12px' }}>Dashboard — Visão Geral</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              {[{ label: 'Veículos', value: '128', sub: 'Ativos', color: '#6366f1' },
                { label: 'Vendas', value: '84', sub: 'Este mês', color: '#8b5cf6' }].map(c => (
                <div key={c.label} style={{ flex: 1, background: `${c.color}22`, borderRadius: '10px', padding: '10px' }}>
                  <p style={{ color: c.color, fontSize: '9px' }}>{c.label}</p>
                  <p style={{ color: '#fff', fontSize: '22px', fontWeight: 700 }}>{c.value}</p>
                  <p style={{ color: c.color, fontSize: '9px' }}>{c.sub}</p>
                </div>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', marginBottom: '8px' }}>Gastos por mês</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '52px' }}>
              {[35, 55, 42, 68, 50, 80, 62].map((h, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: '3px', height: `${h}%`,
                  background: `linear-gradient(to top, #6366f1, #8b5cf6)`,
                  opacity: 0.45 + i * 0.08,
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'].map(m => (
                <span key={m} style={{ color: 'rgba(255,255,255,0.2)', fontSize: '8px' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* card inferior */}
        <div className="absolute" style={{
          bottom: '8%', right: '34%',
          width: '260px',
          transform: 'perspective(900px) rotateY(-8deg) rotateX(-4deg)',
        }}>
          <div style={{
            background: 'rgba(15,22,50,0.85)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '16px',
            padding: '14px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', fontWeight: 600, marginBottom: '8px' }}>Quilometragem por mês</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '56px' }}>
              {[28, 50, 36, 65, 45, 78, 58, 70].map((h, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: '3px', height: `${h}%`,
                  background: `linear-gradient(to top, #3b82f6, #6366f1)`,
                  opacity: 0.45 + i * 0.07,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ESQUERDA ── */}
      <div className="relative z-10 hidden flex-1 flex-col justify-center px-14 lg:flex">
        {/* Logo */}
        <div className="mb-10">
          <img
            src={logoImg}
            alt="AutoGestor"
            style={{
              height: '110px',
              width: 'auto',
              borderRadius: '12px',
            }}
          />
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-5xl font-extrabold leading-tight text-white" style={{ letterSpacing: '-1px' }}>
          Gestão Inteligente<br />
          de{' '}
          <span style={{ background: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Veículos
          </span>
        </h1>

        <p className="mb-10 max-w-sm text-sm leading-relaxed text-slate-400">
          Tenha o controle completo da sua frota em um só lugar.
          Mais eficiência, economia e segurança para o seu negócio.
        </p>

        {/* Features */}
        <div className="space-y-3 max-w-sm">
          {[
            { icon: BarChart2, label: 'Relatórios em tempo real' },
            { icon: Shield,    label: 'Segurança e dados protegidos' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{
              border: '1px solid rgba(99,102,241,0.2)',
              background: 'rgba(99,102,241,0.07)',
            }}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{
                background: 'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(139,92,246,0.3))',
              }}>
                <Icon size={16} className="text-indigo-300" />
              </div>
              <span className="text-sm font-semibold text-slate-200">{label}</span>
            </div>
          ))}
        </div>

        {/* Rodapé esquerdo */}
        <div className="mt-10 flex items-center gap-2 text-xs text-slate-600">
          <Shield size={12} className="text-indigo-500" />
          Seus dados estão protegidos com{' '}
          <span className="text-indigo-400">criptografia de ponta</span>
        </div>
      </div>

      {/* ── DIREITA (card) ── */}
      <div className="relative z-20 flex w-full items-center justify-center px-6 py-12 lg:w-[460px]">
        <div className="w-full max-w-sm rounded-3xl p-8" style={{
          background: 'rgba(12,18,42,0.97)',
          border: '1px solid rgba(99,102,241,0.18)',
          boxShadow: '0 0 80px rgba(99,102,241,0.1), 0 30px 60px rgba(0,0,0,0.6)',
        }}>
          {/* Logo no card */}
          <div className="mb-6 flex justify-center">
            <img
              src={logoImg}
              alt="AutoGestor"
              style={{
                height: '90px',
                width: 'auto',
                borderRadius: '10px',
              }}
            />
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
            <div className="mb-4 rounded-xl px-4 py-3 text-sm text-red-300" style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-2 focus:ring-indigo-500/40"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
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
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full rounded-xl py-3 pl-10 pr-12 text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-2 focus:ring-indigo-500/40"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
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
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.senha && <p className="mt-1 text-xs text-red-400">{errors.senha.message}</p>}
            </div>

            {/* Lembrar / Esqueceu */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-400">
                <input type="checkbox" className="accent-indigo-500" />
                Lembrar-me
              </label>
              <button type="button" className="text-sm text-indigo-400 transition-colors hover:text-indigo-300">
                Esqueceu sua senha?
              </button>
            </div>

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
            >
              {isSubmitting ? 'Entrando…' : <><span>Entrar no sistema</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 border-t border-white/[0.07]" />
            <span className="text-xs text-slate-600">ou</span>
            <div className="flex-1 border-t border-white/[0.07]" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <p className="mt-5 text-center text-xs text-slate-600">
            Não tem uma conta?{' '}
            <span className="cursor-pointer text-indigo-400 transition-colors hover:text-indigo-300">
              Fale com o administrador
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

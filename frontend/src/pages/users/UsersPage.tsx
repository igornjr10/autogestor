import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Building2, Shield, Eye, EyeOff } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { listFiliais } from '../../lib/filiais';
import { Usuario } from '../../types';

const PERFIS = [
  { value: 'ADMIN',      label: 'Admin',      desc: 'Acesso total à empresa' },
  { value: 'VENDEDOR',   label: 'Vendedor',   desc: 'Cadastro e venda de veículos' },
  { value: 'FINANCEIRO', label: 'Financeiro', desc: 'Caixa, relatórios e parcelas' },
  { value: 'DOCUMENTAL', label: 'Documental', desc: 'Documentos e contratos' },
];

const PERFIL_COLOR: Record<string, string> = {
  ADMIN:      'rgba(99,102,241,0.2)',
  VENDEDOR:   'rgba(34,197,94,0.15)',
  FINANCEIRO: 'rgba(234,179,8,0.15)',
  DOCUMENTAL: 'rgba(59,130,246,0.15)',
};
const PERFIL_TEXT: Record<string, string> = {
  ADMIN: '#818cf8', VENDEDOR: '#4ade80', FINANCEIRO: '#facc15', DOCUMENTAL: '#60a5fa',
};

const schema = z.object({
  nome:      z.string().min(2, 'Informe o nome.'),
  email:     z.string().email('E-mail inválido.'),
  senha:     z.string().min(6, 'Mínimo 6 caracteres.'),
  perfil:    z.enum(['ADMIN', 'VENDEDOR', 'FINANCEIRO', 'DOCUMENTAL']),
  filialId:  z.string().optional(),
});
type FormData = z.infer<typeof schema>;

async function listUsers(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>('/usuarios');
  return data;
}

async function createUser(payload: FormData): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/usuarios', {
    ...payload,
    filialId: payload.filialId || null,
  });
  return data;
}

export function UsersPage() {
  const qc = useQueryClient();
  const [erro, setErro] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data: usuarios = [] } = useQuery({ queryKey: ['usuarios'], queryFn: listUsers });
  const { data: filiais = [] } = useQuery({ queryKey: ['filiais'], queryFn: listFiliais });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { perfil: 'VENDEDOR' },
  });

  const criar = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      reset({ nome: '', email: '', senha: '', perfil: 'VENDEDOR', filialId: '' });
      setErro('');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (e) => setErro(getApiError(e)),
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Users size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Usuários</h1>
            <p className="text-xs text-slate-500">Gerencie o acesso de cada empresa ao sistema</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
        >
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="mb-6 rounded-2xl p-5" style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="mb-4 text-sm font-semibold text-slate-200">Criar novo usuário</p>

          {erro && (
            <div className="mb-4 rounded-xl px-4 py-2.5 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit((d) => criar.mutate(d))} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Nome */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Nome completo</label>
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                placeholder="João Silva"
                {...register('nome')}
              />
              {errors.nome && <p className="mt-1 text-xs text-red-400">{errors.nome.message}</p>}
            </div>

            {/* E-mail */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">E-mail</label>
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                type="email"
                placeholder="joao@empresa.com"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Senha inicial</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('senha')}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.senha && <p className="mt-1 text-xs text-red-400">{errors.senha.message}</p>}
            </div>

            {/* Perfil */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Perfil de acesso</label>
              <select
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                {...register('perfil')}
              >
                {PERFIS.map(p => <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>)}
              </select>
            </div>

            {/* Empresa (Filial) */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Empresa (filial)</label>
              <select
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                {...register('filialId')}
              >
                <option value="">Global (todas as empresas)</option>
                {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-slate-600">Deixe em branco somente para admins globais</p>
            </div>

            {/* Botão */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)' }}
              >
                {isSubmitting ? 'Criando…' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="overflow-hidden rounded-2xl" style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-semibold text-slate-200">Usuários cadastrados</p>
          <p className="text-xs text-slate-500">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}</p>
        </div>

        {usuarios.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-14 text-slate-500">
            <Users size={40} className="opacity-20" />
            <p className="text-sm">Nenhum usuário cadastrado.</p>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {usuarios.map((u) => {
            const filial = filiais.find(f => f.id === u.filialId);
            return (
              <div key={u.id} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)' }}
                  >
                    {u.nome?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{u.nome}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Empresa */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Building2 size={12} />
                    {filial ? filial.nome : <span className="text-indigo-400">Global</span>}
                  </div>

                  {/* Perfil */}
                  <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: PERFIL_COLOR[u.perfil] ?? 'rgba(99,102,241,0.2)', color: PERFIL_TEXT[u.perfil] ?? '#818cf8' }}
                  >
                    <Shield size={10} />
                    {PERFIS.find(p => p.value === u.perfil)?.label ?? u.perfil}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guia rápido */}
      <div className="mt-4 rounded-xl p-4 text-xs text-slate-500" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="mb-2 font-semibold text-slate-400">Como adicionar uma nova empresa:</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Vá em <span className="text-indigo-400">Filiais</span> e crie uma filial com o nome da empresa do cliente</li>
          <li>Volte aqui e crie um usuário com perfil <span className="text-indigo-400">Admin</span>, selecionando a filial criada</li>
          <li>Passe o e-mail e senha inicial para o cliente — ele só verá os dados da empresa dele</li>
        </ol>
      </div>
    </div>
  );
}

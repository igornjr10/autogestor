import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { getApiError } from '../lib/api';

const schema = z.object({
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
});

type FormData = z.infer<typeof schema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState('');

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-gray-900 dark:text-white">
          🚗 AutoGestor
        </h1>
        <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-300">Gestão Inteligente de Veículos</p>
        <p className="mb-6 mt-2 text-center text-xs text-gray-400">Entre com suas credenciais</p>

        {erro && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" autoComplete="username" {...register('email')} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" autoComplete="current-password" {...register('senha')} />
            {errors.senha && <p className="field-error">{errors.senha.message}</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

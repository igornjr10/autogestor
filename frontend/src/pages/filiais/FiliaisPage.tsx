import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFilial, deleteFilial, listFiliais, updateFilial } from '../../lib/filiais';
import { getApiError } from '../../lib/api';

const schema = z.object({
  nome: z.string().min(2, 'Informe o nome.'),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function FiliaisPage() {
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');

  const { data: filiais } = useQuery({ queryKey: ['filiais'], queryFn: listFiliais });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['filiais'] });
  }

  const criar = useMutation({
    mutationFn: (data: FormData) => createFilial(data),
    onSuccess: () => {
      reset({ nome: '', cnpj: '', endereco: '', telefone: '' });
      invalidar();
    },
    onError: (e) => setErro(getApiError(e)),
  });

  const alternarAtiva = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) => updateFilial(id, { ativa }),
    onSuccess: invalidar,
    onError: (e) => setErro(getApiError(e)),
  });

  const remover = useMutation({
    mutationFn: (id: string) => deleteFilial(id),
    onSuccess: invalidar,
    onError: (e) => setErro(getApiError(e)),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Filiais</h1>

      {erro && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit((d) => criar.mutate(d))} className="card grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="label">Nome</label>
          <input className="input" {...register('nome')} />
          {errors.nome && <p className="field-error">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="label">CNPJ</label>
          <input className="input" {...register('cnpj')} />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" {...register('telefone')} />
        </div>
        <div>
          <label className="label">Endereço</label>
          <input className="input" {...register('endereco')} />
        </div>
        <div className="sm:col-span-4">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            + Nova filial
          </button>
        </div>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">CNPJ</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filiais?.map((f) => (
              <tr key={f.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                <td className="px-4 py-3 font-medium">{f.nome}</td>
                <td className="px-4 py-3">{f.cnpj ?? '—'}</td>
                <td className="px-4 py-3">{f.telefone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${f.ativa ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {f.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="mr-3 text-xs text-blue-600 hover:underline" onClick={() => alternarAtiva.mutate({ id: f.id, ativa: !f.ativa })}>
                    {f.ativa ? 'desativar' : 'ativar'}
                  </button>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => window.confirm('Excluir esta filial?') && remover.mutate(f.id)}>
                    excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

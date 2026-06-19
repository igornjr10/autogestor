import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Search, Users } from 'lucide-react';
import { listClients, ClientFilters } from '../../lib/clients';
import { TIPO_CLIENTE_LABEL } from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';

export function ClientList() {
  const { temPerfil } = useAuth();
  const [filters, setFilters] = useState<ClientFilters>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clientes', filters],
    queryFn: () => listClients(filters),
  });

  const podeCadastrar = temPerfil('ADMIN', 'VENDEDOR');

  return (
    <div>
      <div className="page-header">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
        {podeCadastrar && (
          <Link to="/clientes/novo" className="btn-primary">
            <UserPlus size={18} />
            Novo cliente
          </Link>
        )}
      </div>

      <div className="card mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Buscar (nome / CPF / e-mail)</label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              value={filters.busca ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, busca: e.target.value || undefined }))}
            />
          </div>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select
            className="input"
            value={filters.tipo ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value || undefined }))}
          >
            <option value="">Todos</option>
            <option value="COMPRADOR">Comprador</option>
            <option value="VENDEDOR">Vendedor (antigo proprietário)</option>
            <option value="AMBOS">Ambos</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-12 animate-pulse bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      )}
      {isError && <p className="text-red-600">Erro ao carregar clientes.</p>}

      {data && (
        <div className="table-container">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">CPF / CNPJ</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Users size={40} opacity={0.3} />
                      Nenhum cliente encontrado.
                    </div>
                  </td>
                </tr>
              )}
              {data.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                        {c.nome?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </div>
                      <Link to={`/clientes/${c.id}`} className="font-semibold text-slate-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400">
                        {c.nome}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.cpfCnpj}</td>
                  <td className="px-4 py-3">{c.telefone ?? '—'}</td>
                  <td className="px-4 py-3">{TIPO_CLIENTE_LABEL[c.tipo]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

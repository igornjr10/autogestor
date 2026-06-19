import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Car } from 'lucide-react';
import { listVehicles, VehicleFilters } from '../../lib/vehicles';
import { formatMoeda, formatData, SITUACAO_BADGE, SITUACAO_LABEL } from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';
import { useFilial } from '../../auth/FilialContext';

export function VehicleList() {
  const { temPerfil } = useAuth();
  const { filialAtiva } = useFilial();
  const [filters, setFilters] = useState<VehicleFilters>({});

  const filtrosComFilial = { ...filters, filialId: filialAtiva };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['veiculos', filtrosComFilial],
    queryFn: () => listVehicles(filtrosComFilial),
  });

  const podeCadastrar = temPerfil('ADMIN', 'VENDEDOR');

  return (
    <div>
      <div className="page-header">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Estoque de Veículos</h1>
        {podeCadastrar && (
          <Link to="/veiculos/novo" className="btn-primary">
            <Plus size={18} />
            Novo veículo
          </Link>
        )}
      </div>

      <div className="card mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Buscar (placa / chassi)</label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Ex: ABC1D23"
              value={filters.busca ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, busca: e.target.value || undefined }))}
            />
          </div>
        </div>
        <div>
          <label className="label">Marca</label>
          <input
            className="input"
            value={filters.marca ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, marca: e.target.value || undefined }))}
          />
        </div>
        <div>
          <label className="label">Situação</label>
          <select
            className="input"
            value={filters.situacao ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, situacao: e.target.value || undefined }))}
          >
            <option value="">Todas</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="RESERVADO">Reservado</option>
            <option value="VENDIDO">Vendido</option>
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
      {isError && <p className="text-red-600">Erro ao carregar veículos.</p>}

      {data && (
        <div className="table-container">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Veículo</th>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Ano</th>
                <th className="px-4 py-3">Entrada</th>
                <th className="px-4 py-3">Custo total</th>
                <th className="px-4 py-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Car size={40} opacity={0.3} />
                      Nenhum veículo encontrado.
                    </div>
                  </td>
                </tr>
              )}
              {data.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40"
                >
                  <td className="px-4 py-3">
                    <Link to={`/veiculos/${v.id}`} className="font-semibold text-slate-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400">
                      {v.marca} {v.modelo}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{v.cor}</div>
                  </td>
                  <td className="px-4 py-3 uppercase">{v.placa}</td>
                  <td className="px-4 py-3">{v.anoFabricacao}/{v.anoModelo}</td>
                  <td className="px-4 py-3">{formatData(v.dataEntrada)}</td>
                  <td className="px-4 py-3">{formatMoeda(v.custoTotal)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${SITUACAO_BADGE[v.situacao]}`}>
                      {SITUACAO_LABEL[v.situacao]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

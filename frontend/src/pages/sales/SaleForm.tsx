import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVehicle } from '../../lib/vehicles';
import { listClients } from '../../lib/clients';
import { createSale } from '../../lib/sales';
import { getApiError } from '../../lib/api';
import { formatMoeda, FORMAS_PAGAMENTO, FORMA_PAGAMENTO_LABEL } from '../../lib/format';

const schema = z.object({
  compradorId: z.string().uuid('Selecione o comprador.'),
  dataVenda: z.string().min(1, 'Informe a data da venda.'),
  valorTotal: z.coerce.number().positive('O valor deve ser positivo.'),
  formaPagamento: z.enum(FORMAS_PAGAMENTO),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function SaleForm() {
  const { veiculoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');

  const { data: veiculo } = useQuery({
    queryKey: ['veiculo', veiculoId],
    queryFn: () => getVehicle(veiculoId!),
    enabled: !!veiculoId,
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes', { compradores: true }],
    queryFn: () => listClients({}),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { formaPagamento: 'AVISTA' },
  });

  const valorTotal = watch('valorTotal');
  const lucroPrevisto =
    veiculo && valorTotal ? Number(valorTotal) - veiculo.custoTotal : undefined;

  const jaVendido = veiculo?.situacao === 'VENDIDO';

  async function onSubmit(data: FormData) {
    setErro('');
    try {
      await createSale({
        veiculoId,
        compradorId: data.compradorId,
        dataVenda: new Date(data.dataVenda).toISOString(),
        valorTotal: data.valorTotal,
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      await queryClient.invalidateQueries({ queryKey: ['veiculo', veiculoId] });
      navigate(`/veiculos/${veiculoId}`);
    } catch (e) {
      setErro(getApiError(e));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Registrar venda</h1>
      {veiculo && (
        <p className="mb-4 text-sm text-gray-500">
          {veiculo.marca} {veiculo.modelo} · placa {veiculo.placa.toUpperCase()} · custo total {formatMoeda(veiculo.custoTotal)}
        </p>
      )}

      {erro && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {erro}
        </div>
      )}

      {jaVendido && (
        <div className="mb-4 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Este veículo já está vendido. Não é possível registrar outra venda.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div>
          <label className="label">Comprador</label>
          <select className="input" {...register('compradorId')}>
            <option value="">Selecione um cliente…</option>
            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>{c.nome} — {c.cpfCnpj}</option>
            ))}
          </select>
          {errors.compradorId && <p className="field-error">{errors.compradorId.message}</p>}
          <p className="mt-1 text-xs text-gray-400">
            O comprador não está na lista? <a href="/clientes/novo" className="text-blue-600 hover:underline">Cadastre um cliente</a> primeiro.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Data da venda</label>
            <input className="input" type="date" {...register('dataVenda')} />
            {errors.dataVenda && <p className="field-error">{errors.dataVenda.message}</p>}
          </div>
          <div>
            <label className="label">Forma de pagamento</label>
            <select className="input" {...register('formaPagamento')}>
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>{FORMA_PAGAMENTO_LABEL[f]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Valor total (R$)</label>
            <input className="input" type="number" step="0.01" {...register('valorTotal')} />
            {errors.valorTotal && <p className="field-error">{errors.valorTotal.message}</p>}
          </div>
          <div>
            <label className="label">Lucro bruto previsto</label>
            <div className={`input flex items-center ${lucroPrevisto != null && lucroPrevisto < 0 ? 'text-red-600' : 'text-green-700 dark:text-green-400'}`}>
              {lucroPrevisto != null ? formatMoeda(lucroPrevisto) : '—'}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Observações da negociação</label>
          <textarea className="input" rows={3} {...register('observacoes')} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={isSubmitting || jaVendido}>
            {isSubmitting ? 'Registrando…' : 'Registrar venda'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

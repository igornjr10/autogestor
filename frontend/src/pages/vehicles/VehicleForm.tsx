import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, DollarSign, User, Image, Tag, Search, Plus, Trash2, Save, X, ChevronLeft } from 'lucide-react';
import { createVehicle, getVehicle, updateVehicle } from '../../lib/vehicles';
import { consultarFipeBeta, consultarPlacaFipeComChassi } from '../../lib/integrations';
import { getApiError } from '../../lib/api';
import { COMBUSTIVEIS } from '../../lib/format';
import { useFilial } from '../../auth/FilialContext';


const custoSchema = z.object({
  descricao: z.string().min(2, 'Descreva o custo.'),
  categoria: z.string().optional(),
  valor: z.coerce.number().positive('Valor deve ser positivo.'),
});

const fotoSchema = z.object({
  url: z.string().url('URL inválida.'),
  legenda: z.string().optional(),
});

const schema = z.object({
  placa: z.string().min(7, 'Placa inválida.'),
  renavam: z.string().min(9, 'Renavam inválido.').optional().or(z.literal('').transform(() => undefined)),
  chassi: z.string().min(17, 'Chassi deve ter 17 caracteres.'),
  marca: z.string().min(1, 'Informe a marca.'),
  modelo: z.string().min(1, 'Informe o modelo.'),
  anoFabricacao: z.coerce.number().int().min(1900).max(2100),
  anoModelo: z.coerce.number().int().min(1900).max(2100),
  cor: z.string().min(1, 'Informe a cor.'),
  combustivel: z.enum(COMBUSTIVEIS),
  quilometragem: z.coerce.number().int().min(0),
  dataEntrada: z.string().min(1, 'Informe a data de entrada.'),
  valorCompra: z.coerce.number().positive('Valor de compra deve ser positivo.'),
  valorVendaSugerido: z.coerce.number().positive().optional().or(z.literal('').transform(() => undefined)),
  observacoes: z.string().optional(),
  propNome: z.string().min(2, 'Informe o nome do antigo proprietário.').optional().or(z.literal('').transform(() => undefined)),
  propCpfCnpj: z.string().min(11, 'CPF/CNPJ inválido.').optional().or(z.literal('').transform(() => undefined)),
  propTelefone: z.string().optional(),
  propEndereco: z.string().optional(),
  filialId: z.string().optional(),
  custos: z.array(custoSchema).optional(),
  fotos: z.array(fotoSchema).optional(),
});

type FormData = z.infer<typeof schema>;

export function VehicleForm() {
  const { id } = useParams();
  const editando = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isGlobal, filiais, filialAtiva } = useFilial();
  const [erro, setErro] = useState('');

  const [consultando, setConsultando] = useState(false);
  const [avisoConsulta, setAvisoConsulta] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { combustivel: 'FLEX', custos: [], fotos: [], filialId: filialAtiva },
  });

  const custos = useFieldArray({ control, name: 'custos' });
  const fotos = useFieldArray({ control, name: 'fotos' });

  // Carrega dados ao editar
  const { data: veiculo } = useQuery({
    queryKey: ['veiculo', id],
    queryFn: () => getVehicle(id!),
    enabled: editando,
  });

  useEffect(() => {
    if (veiculo) {
      reset({
        placa: veiculo.placa,
        renavam: veiculo.renavam ?? '',
        chassi: veiculo.chassi,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        anoFabricacao: veiculo.anoFabricacao,
        anoModelo: veiculo.anoModelo,
        cor: veiculo.cor,
        combustivel: veiculo.combustivel,
        quilometragem: veiculo.quilometragem,
        dataEntrada: veiculo.dataEntrada.slice(0, 10),
        valorCompra: veiculo.valorCompra,
        valorVendaSugerido: veiculo.valorVendaSugerido ?? undefined,
        observacoes: veiculo.observacoes ?? '',
        propNome: veiculo.propNome ?? '',
        propCpfCnpj: veiculo.propCpfCnpj ?? '',
        propTelefone: veiculo.propTelefone ?? '',
        propEndereco: veiculo.propEndereco ?? '',
        custos: veiculo.custos.map((c) => ({ descricao: c.descricao, categoria: c.categoria ?? '', valor: c.valor })),
        fotos: veiculo.fotos.map((f) => ({ url: f.url, legenda: f.legenda ?? '' })),
      });
    }
  }, [veiculo, reset]);

  async function onSubmit(data: FormData) {
    setErro('');
    try {
      const payload = { ...data, dataEntrada: new Date(data.dataEntrada).toISOString() };
      if (editando) {
        // Custos, fotos e filial não são atualizados por este endpoint
        const { custos: _c, fotos: _f, filialId: _fil, ...rest } = payload;
        await updateVehicle(id!, rest);
      } else {
        await createVehicle(payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      navigate('/veiculos');
    } catch (e) {
      setErro(getApiError(e));
    }
  }

  async function consultarPlaca() {
    const placa = (getValues('placa') ?? '').trim();
    if (placa.length < 7) {
      setAvisoConsulta('Informe a placa antes de consultar.');
      return;
    }
    setAvisoConsulta('');
    setConsultando(true);
    try {
      const dados = await consultarPlacaFipeComChassi(placa);
      setValue('marca', dados.marca, { shouldValidate: true });
      setValue('modelo', dados.modelo, { shouldValidate: true });
      if (dados.anoFabricacao) setValue('anoFabricacao', dados.anoFabricacao, { shouldValidate: true });
      if (dados.anoModelo) setValue('anoModelo', dados.anoModelo, { shouldValidate: true });
      if (dados.raw?.cor) setValue('cor', dados.raw.cor, { shouldValidate: true });
      setValue('chassi', dados.chassi, { shouldValidate: true });
      const combustivel = mapCombustivelApi(dados.combustivel ?? dados.raw?.combustivel);
      if (combustivel) setValue('combustivel', combustivel, { shouldValidate: true });
      if (dados.valor) setValue('valorVendaSugerido', dados.valor, { shouldValidate: true });
      const fipeTxt = dados.valor
        ? ` FIPE: ${dados.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (sugerido como venda).`
        : '';
      setAvisoConsulta(
        `Dados reais preenchidos pela APIBrasil. Informe o Renavam manualmente, se ele nao veio na consulta.${fipeTxt}`,
      );
    } catch (e) {
      setAvisoConsulta(getApiError(e));
    } finally {
      setConsultando(false);
    }
  }

  async function consultarFipeBetaPlaca() {
    const placa = (getValues('placa') ?? '').trim();
    if (placa.length < 7) {
      setAvisoConsulta('Informe a placa antes de consultar.');
      return;
    }
    setAvisoConsulta('');
    setConsultando(true);
    try {
      const dados = await consultarFipeBeta(placa);
      setValue('marca', dados.marca, { shouldValidate: true });
      setValue('modelo', dados.modelo, { shouldValidate: true });
      if (dados.anoFabricacao) setValue('anoFabricacao', dados.anoFabricacao, { shouldValidate: true });
      if (dados.anoModelo) setValue('anoModelo', dados.anoModelo, { shouldValidate: true });
      if (dados.veiculo?.cor) setValue('cor', dados.veiculo.cor, { shouldValidate: true });
      if (dados.veiculo?.chassi) setValue('chassi', dados.veiculo.chassi, { shouldValidate: true });
      const combustivel = mapCombustivelApi(dados.combustivel ?? dados.veiculo?.combustivel);
      if (combustivel) setValue('combustivel', combustivel, { shouldValidate: true });
      if (dados.valor) setValue('valorVendaSugerido', dados.valor, { shouldValidate: true });

      const detalhes = [
        dados.valor
          ? `FIPE: ${dados.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          : undefined,
        dados.ipva?.valor
          ? `IPVA estimado: ${dados.ipva.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          : undefined,
        dados.mesReferencia,
      ].filter(Boolean).join(' | ');

      setAvisoConsulta(`Fipe Beta preenchida pela APIBrasil.${detalhes ? ` ${detalhes}.` : ''}`);
    } catch (e) {
      setAvisoConsulta(getApiError(e));
    } finally {
      setConsultando(false);
    }
  }
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary !p-2" title="Voltar">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-slate-100">
          {editando ? 'Editar veículo' : 'Novo veículo'}
        </h1>
      </div>

      {erro && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <X size={16} className="mt-0.5 shrink-0" />
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {isGlobal && !editando && (
          <section className="card">
            <SectionHeader icon={Tag} label="Filial" />
            <Field label="Filial" error={errors.filialId?.message}>
              <select className="input" {...register('filialId')}>
                <option value="">Selecione a filial…</option>
                {filiais.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </Field>
          </section>
        )}

        <section className="card">
          <SectionHeader icon={Car} label="Dados do veículo" />
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <Field label="Placa" error={errors.placa?.message}>
                <input className="input uppercase" {...register('placa')} />
              </Field>
            </div>
            <button type="button" className="btn-secondary" onClick={consultarPlaca} disabled={consultando}>
              <Search size={16} />
              {consultando ? 'Consultando…' : 'Consultar placa'}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={consultarFipeBetaPlaca}
              disabled={consultando}
            >
              <DollarSign size={16} />
              {consultando ? 'Consultando...' : 'Fipe Beta'}
            </button>
          </div>
          {avisoConsulta && (
            <p className={`mb-4 rounded-lg px-3 py-2 text-xs ${
              avisoConsulta.startsWith('⚠') || avisoConsulta.startsWith('Informe')
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                : 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            }`}>
              {avisoConsulta}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Renavam" error={errors.renavam?.message}>
              <input className="input" {...register('renavam')} />
            </Field>
            <Field label="Chassi" error={errors.chassi?.message}>
              <input className="input uppercase" {...register('chassi')} />
            </Field>
            <Field label="Marca" error={errors.marca?.message}>
              <input className="input" {...register('marca')} />
            </Field>
            <Field label="Modelo" error={errors.modelo?.message}>
              <input className="input" {...register('modelo')} />
            </Field>
            <Field label="Cor" error={errors.cor?.message}>
              <input className="input" {...register('cor')} />
            </Field>
            <Field label="Ano fabricação" error={errors.anoFabricacao?.message}>
              <input className="input" type="number" {...register('anoFabricacao')} />
            </Field>
            <Field label="Ano modelo" error={errors.anoModelo?.message}>
              <input className="input" type="number" {...register('anoModelo')} />
            </Field>
            <Field label="Combustível" error={errors.combustivel?.message}>
              <select className="input" {...register('combustivel')}>
                {COMBUSTIVEIS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Quilometragem" error={errors.quilometragem?.message}>
              <input className="input" type="number" {...register('quilometragem')} />
            </Field>
            <Field label="Data de entrada" error={errors.dataEntrada?.message}>
              <input className="input" type="date" {...register('dataEntrada')} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Observações" error={errors.observacoes?.message}>
              <textarea className="input min-h-[80px] resize-y" {...register('observacoes')} />
            </Field>
          </div>
        </section>

        <section className="card">
          <SectionHeader icon={DollarSign} label="Valores" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Valor de compra (R$)" error={errors.valorCompra?.message}>
              <input className="input" type="number" step="0.01" {...register('valorCompra')} />
            </Field>
            <Field label="Valor de venda sugerido (R$)" error={errors.valorVendaSugerido?.message}>
              <input className="input" type="number" step="0.01" {...register('valorVendaSugerido')} />
            </Field>
          </div>

        </section>

        <section className="card">
          <SectionHeader icon={User} label="Antigo proprietário" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome / Razão Social" error={errors.propNome?.message}>
              <input className="input" {...register('propNome')} />
            </Field>
            <Field label="CPF / CNPJ" error={errors.propCpfCnpj?.message}>
              <input className="input" {...register('propCpfCnpj')} />
            </Field>
            <Field label="Telefone" error={errors.propTelefone?.message}>
              <input className="input" {...register('propTelefone')} />
            </Field>
            <Field label="Endereço" error={errors.propEndereco?.message}>
              <input className="input" {...register('propEndereco')} />
            </Field>
          </div>
        </section>

        {!editando && (
          <>
            <section className="card">
              <div className="mb-4 flex items-center justify-between">
                <SectionHeader icon={DollarSign} label="Custos adicionais" />
                <button type="button" className="btn-secondary" onClick={() => custos.append({ descricao: '', categoria: '', valor: 0 })}>
                  <Plus size={16} />
                  Adicionar custo
                </button>
              </div>
              {custos.fields.length === 0 && (
                <p className="rounded-lg bg-slate-50 py-4 text-center text-sm text-slate-500 dark:bg-slate-700/30">
                  Nenhum custo adicional.
                </p>
              )}
              <div className="space-y-3">
                {custos.fields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                    <input className="input" placeholder="Descrição" {...register(`custos.${i}.descricao`)} />
                    <input className="input" placeholder="Categoria" {...register(`custos.${i}.categoria`)} />
                    <input className="input" type="number" step="0.01" placeholder="Valor" {...register(`custos.${i}.valor`)} />
                    <button type="button" className="btn-danger !p-2" onClick={() => custos.remove(i)} title="Remover">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="mb-4 flex items-center justify-between">
                <SectionHeader icon={Image} label="Fotos (URLs)" />
                <button type="button" className="btn-secondary" onClick={() => fotos.append({ url: '', legenda: '' })}>
                  <Plus size={16} />
                  Adicionar foto
                </button>
              </div>
              {fotos.fields.length === 0 && (
                <p className="rounded-lg bg-slate-50 py-4 text-center text-sm text-slate-500 dark:bg-slate-700/30">
                  Nenhuma foto. Recomenda-se ao menos 10 fotos por veículo.
                </p>
              )}
              <div className="space-y-3">
                {fotos.fields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_auto]">
                    <input className="input" placeholder="https://…" {...register(`fotos.${i}.url`)} />
                    <input className="input" placeholder="Legenda" {...register(`fotos.${i}.legenda`)} />
                    <button type="button" className="btn-danger !p-2" onClick={() => fotos.remove(i)} title="Remover">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="flex gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            <Save size={16} />
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            <X size={16} />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function mapCombustivelApi(valor?: unknown): FormData['combustivel'] | undefined {
  if (!valor) return undefined;
  const normalized = String(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (normalized.includes('DIESEL')) return 'DIESEL';
  if (normalized.includes('ELETR')) return 'ELETRICO';
  if (normalized.includes('HIBR')) return 'HIBRIDO';
  if (normalized.includes('GASOL')) return 'GASOLINA';
  if (normalized.includes('FLEX') || normalized.includes('ALCOOL')) return 'FLEX';
  return undefined;
}
function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-700">
      <Icon size={18} className="text-brand-500" />
      <h2 className="font-semibold text-slate-800 dark:text-slate-100">{label}</h2>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

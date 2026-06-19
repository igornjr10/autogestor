import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient, getClient, updateClient } from '../../lib/clients';
import { consultarDocumento } from '../../lib/integrations';
import { getApiError } from '../../lib/api';
import { TIPOS_CLIENTE } from '../../lib/format';
import { validarCpfCnpj } from '../../lib/documento';

const schema = z.object({
  nome: z.string().min(2, 'Informe o nome / razão social.'),
  cpfCnpj: z.string().refine(validarCpfCnpj, 'CPF/CNPJ inválido (verifique os dígitos).'),
  rg: z.string().optional(),
  cnh: z.string().optional(),
  dataNascimento: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
  endereco: z.string().optional(),
  tipo: z.enum(TIPOS_CLIENTE),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ClientForm() {
  const { id } = useParams();
  const editando = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [erro, setErro] = useState('');

  const [avisoDoc, setAvisoDoc] = useState('');
  const [consultandoDoc, setConsultandoDoc] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur', defaultValues: { tipo: 'COMPRADOR' } });

  async function consultarDoc() {
    const doc = (getValues('cpfCnpj') ?? '').trim();
    setAvisoDoc('');
    setConsultandoDoc(true);
    try {
      const r = await consultarDocumento(doc);
      if (!r.valido) {
        setAvisoDoc('Documento inválido — verifique os dígitos.');
        return;
      }
      if (r.nome) setValue('nome', r.nome, { shouldValidate: true });
      const partes = [`${r.tipo} válido`];
      if (r.situacao) partes.push(`situação: ${r.situacao}`);
      if (r.simulado) partes.push('(dados cadastrais simulados)');
      setAvisoDoc(`✅ ${partes.join(' · ')}`);
    } catch (e) {
      setAvisoDoc(getApiError(e));
    } finally {
      setConsultandoDoc(false);
    }
  }

  const { data: cliente } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => getClient(id!),
    enabled: editando,
  });

  useEffect(() => {
    if (cliente) {
      reset({
        nome: cliente.nome,
        cpfCnpj: cliente.cpfCnpj,
        rg: cliente.rg ?? '',
        cnh: cliente.cnh ?? '',
        dataNascimento: cliente.dataNascimento ? cliente.dataNascimento.slice(0, 10) : '',
        telefone: cliente.telefone ?? '',
        email: cliente.email ?? '',
        endereco: cliente.endereco ?? '',
        tipo: cliente.tipo,
        observacoes: cliente.observacoes ?? '',
      });
    }
  }, [cliente, reset]);

  async function onSubmit(data: FormData) {
    setErro('');
    try {
      const payload: Record<string, unknown> = { ...data };
      if (!payload.email) delete payload.email;
      if (data.dataNascimento) {
        payload.dataNascimento = new Date(data.dataNascimento).toISOString();
      } else {
        delete payload.dataNascimento;
      }
      if (editando) {
        await updateClient(id!, payload);
      } else {
        await createClient(payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['clientes'] });
      navigate('/clientes');
    } catch (e) {
      setErro(getApiError(e));
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        {editando ? 'Editar cliente' : 'Novo cliente'}
      </h1>

      {erro && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="card">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome / Razão Social" error={errors.nome?.message}>
              <input className="input" {...register('nome')} />
            </Field>
            <div>
              <label className="label">CPF / CNPJ</label>
              <div className="flex gap-2">
                <input className="input" {...register('cpfCnpj')} />
                <button type="button" className="btn-secondary whitespace-nowrap" onClick={consultarDoc} disabled={consultandoDoc}>
                  {consultandoDoc ? '...' : '🔎'}
                </button>
              </div>
              {errors.cpfCnpj && <p className="field-error">{errors.cpfCnpj.message}</p>}
              {avisoDoc && <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">{avisoDoc}</p>}
            </div>
            <Field label="RG" error={errors.rg?.message}>
              <input className="input" {...register('rg')} />
            </Field>
            <Field label="CNH" error={errors.cnh?.message}>
              <input className="input" {...register('cnh')} />
            </Field>
            <Field label="Data de nascimento" error={errors.dataNascimento?.message}>
              <input className="input" type="date" {...register('dataNascimento')} />
            </Field>
            <Field label="Telefone" error={errors.telefone?.message}>
              <input className="input" {...register('telefone')} />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <input className="input" type="email" {...register('email')} />
            </Field>
            <Field label="Tipo" error={errors.tipo?.message}>
              <select className="input" {...register('tipo')}>
                <option value="COMPRADOR">Comprador</option>
                <option value="VENDEDOR">Vendedor (antigo proprietário)</option>
                <option value="AMBOS">Ambos</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Endereço" error={errors.endereco?.message}>
                <input className="input" {...register('endereco')} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Observações" error={errors.observacoes?.message}>
                <textarea className="input" rows={3} {...register('observacoes')} />
              </Field>
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>
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

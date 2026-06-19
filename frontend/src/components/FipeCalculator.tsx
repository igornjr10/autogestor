import { useEffect, useState } from 'react';
import { fipeAnos, fipeMarcas, fipeModelos, fipePreco, FipeItem, FipePreco } from '../lib/fipe';
import { formatMoeda } from '../lib/format';

/**
 * Calculadora FIPE gratuita (Parallelum). Seleção em cascata
 * tipo → marca → modelo → ano → preço. Ao obter o preço, chama onPreco.
 */
export function FipeCalculator({ onPreco }: { onPreco: (valor: number) => void }) {
  const [tipo, setTipo] = useState('carros');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');

  const [marcas, setMarcas] = useState<FipeItem[]>([]);
  const [modelos, setModelos] = useState<FipeItem[]>([]);
  const [anos, setAnos] = useState<FipeItem[]>([]);
  const [preco, setPreco] = useState<FipePreco | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Carrega marcas ao mudar o tipo
  useEffect(() => {
    setMarca(''); setModelo(''); setAno(''); setModelos([]); setAnos([]); setPreco(null);
    setMarcas([]);
    fipeMarcas(tipo).then(setMarcas).catch(() => setErro('Falha ao carregar marcas.'));
  }, [tipo]);

  useEffect(() => {
    setModelo(''); setAno(''); setAnos([]); setPreco(null); setModelos([]);
    if (marca) fipeModelos(tipo, marca).then(setModelos).catch(() => setErro('Falha ao carregar modelos.'));
  }, [marca, tipo]);

  useEffect(() => {
    setAno(''); setPreco(null); setAnos([]);
    if (marca && modelo) fipeAnos(tipo, marca, modelo).then(setAnos).catch(() => setErro('Falha ao carregar anos.'));
  }, [modelo, marca, tipo]);

  useEffect(() => {
    setPreco(null);
    if (marca && modelo && ano) {
      setCarregando(true);
      setErro('');
      fipePreco(tipo, marca, modelo, ano)
        .then((p) => { setPreco(p); if (p.valor) onPreco(p.valor); })
        .catch(() => setErro('Falha ao consultar o preço FIPE.'))
        .finally(() => setCarregando(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, modelo, marca, tipo]);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        Calcular preço FIPE (grátis) — preenche o valor de venda sugerido
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="carros">Carros</option>
          <option value="motos">Motos</option>
          <option value="caminhoes">Caminhões</option>
        </select>
        <select className="input" value={marca} onChange={(e) => setMarca(e.target.value)} disabled={!marcas.length}>
          <option value="">Marca…</option>
          {marcas.map((m) => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
        </select>
        <select className="input" value={modelo} onChange={(e) => setModelo(e.target.value)} disabled={!modelos.length}>
          <option value="">Modelo…</option>
          {modelos.map((m) => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
        </select>
        <select className="input" value={ano} onChange={(e) => setAno(e.target.value)} disabled={!anos.length}>
          <option value="">Ano…</option>
          {anos.map((a) => <option key={a.codigo} value={a.codigo}>{a.nome}</option>)}
        </select>
      </div>
      {carregando && <p className="mt-2 text-xs text-slate-500">Consultando FIPE…</p>}
      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
      {preco?.valor != null && (
        <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">
          FIPE: {formatMoeda(preco.valor)} {preco.mesReferencia ? `(ref. ${preco.mesReferencia})` : ''} — aplicado ao valor de venda sugerido ✓
        </p>
      )}
    </div>
  );
}

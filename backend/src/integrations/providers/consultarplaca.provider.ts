import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Combustivel } from '@prisma/client';
import { VehicleDataProvider } from './vehicle-data.provider';
import { ConsultaDebitosResult, ConsultaVeiculoResult } from '../integrations.types';

/**
 * Provedor "Consultar Placa" (api.consultarplaca.com.br).
 * Autenticação: Basic Auth (email = usuário, API Key = senha).
 *
 *  - GET /consultarPlaca?placa=AAA9999      → dados do veículo
 *  - GET /consultarPrecoFipe?placa=AAA9999  → valor FIPE
 *
 * Sem credenciais (ou em erro/sem crédito), cai em dados simulados.
 */
@Injectable()
export class ConsultarPlacaProvider implements VehicleDataProvider {
  private readonly logger = new Logger('ConsultarPlaca');

  constructor(private readonly config: ConfigService) {}

  private get credenciais() {
    const baseUrl = this.config.get<string>('CONSULTARPLACA_API_URL', 'https://api.consultarplaca.com.br/v2');
    const email = this.config.get<string>('CONSULTARPLACA_EMAIL');
    const apiKey = this.config.get<string>('CONSULTARPLACA_APIKEY');
    const configurado = !!(email && apiKey);
    const auth = configurado ? 'Basic ' + Buffer.from(`${email}:${apiKey}`).toString('base64') : '';
    return { baseUrl, auth, configurado };
  }

  async consultarVeiculo(placa: string): Promise<ConsultaVeiculoResult> {
    const { baseUrl, auth, configurado } = this.credenciais;
    if (!configurado) return this.veiculoSimulado(placa, 'Sem credenciais da Consultar Placa configuradas.');

    const placaLimpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    try {
      const resp = await fetch(`${baseUrl}/consultarPlaca?placa=${placaLimpa}`, {
        headers: { Authorization: auth, Accept: 'application/json' },
      });
      const json: any = await resp.json().catch(() => ({}));
      if (!resp.ok || (json?.status && json.status !== 'ok')) {
        // Mensagem amigável para falta de crédito / erro do provedor
        const reason = json?.tipo_do_erro === 'credito_insuficiente'
          ? 'Sem créditos na Consultar Placa — adicione saldo no painel para dados reais.'
          : json?.mensagem ?? `HTTP ${resp.status}`;
        return this.veiculoSimulado(placa, reason);
      }
      const d = json?.dados?.informacoes_veiculo?.dados_veiculo ?? {};

      const resultado: ConsultaVeiculoResult = {
        placa: (d.placa ?? placaLimpa).toUpperCase(),
        marca: this.primeiraParte(d.marca),
        modelo: d.modelo ?? '',
        anoFabricacao: Number(d.ano_fabricacao) || 0,
        anoModelo: Number(d.ano_modelo) || 0,
        cor: d.cor ?? '',
        chassi: (d.chassi ?? '').toUpperCase(),
        renavam: d.renavam ?? '',
        combustivel: this.mapCombustivel(d.combustivel),
        fonte: 'consultarplaca',
        simulado: false,
      };

      // FIPE é best-effort: não derruba a consulta principal se falhar
      const fipe = await this.consultarFipe(baseUrl, auth, placaLimpa).catch(() => undefined);
      if (fipe) {
        resultado.valorFipe = fipe.valor;
        resultado.codigoFipe = fipe.codigo;
      }
      return resultado;
    } catch (e: any) {
      this.logger.warn(`Falha na consulta de placa (${placaLimpa}): ${e?.message}. Usando simulado.`);
      return this.veiculoSimulado(placa, `Falha ao consultar: ${e?.message ?? 'erro de rede'}.`);
    }
  }

  private async consultarFipe(baseUrl: string, auth: string, placa: string) {
    const resp = await fetch(`${baseUrl}/consultarPrecoFipe?placa=${placa}`, {
      headers: { Authorization: auth, Accept: 'application/json' },
    });
    if (!resp.ok) return undefined;
    const json: any = await resp.json();
    const item = json?.dados?.informacoes_fipe?.[0];
    if (!item) return undefined;
    return { valor: Number(item.preco) || undefined, codigo: item.codigo_fipe as string | undefined };
  }

  /**
   * Débitos/restrições via relatório histórico (assíncrono):
   *  1. POST /solicitarRelatorio (form-data) → protocolo
   *  2. GET /consultarProtocolo?protocolo= (poll até finalizar)
   *  3. mapeia debitos_detran / restricoes_detran / infracoes_renainf
   * Sem crédito/erro/timeout → simulado com aviso.
   */
  async consultarDebitos(placa: string): Promise<ConsultaDebitosResult> {
    const { baseUrl, auth, configurado } = this.credenciais;
    if (!configurado) return this.debitosSimulado(placa, 'Sem credenciais da Consultar Placa configuradas.');

    const placaLimpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const tipo = this.config.get<string>('CONSULTARPLACA_TIPO_RELATORIO', 'ouro');

    try {
      const form = new FormData();
      form.append('placa', placaLimpa);
      form.append('tipo_consulta', tipo);
      const solic = await fetch(`${baseUrl}/solicitarRelatorio`, {
        method: 'POST',
        headers: { Authorization: auth, Accept: 'application/json' },
        body: form,
      });
      const sJson: any = await solic.json().catch(() => ({}));
      if (!solic.ok || sJson?.status !== 'ok') {
        const reason = sJson?.tipo_do_erro === 'credito_insuficiente'
          ? 'Sem créditos na Consultar Placa — adicione saldo para consultar débitos reais.'
          : sJson?.mensagem ?? `HTTP ${solic.status}`;
        return this.debitosSimulado(placa, reason);
      }

      const protocolo = sJson.protocolo;
      // Poll: até ~6 tentativas (relatório pode levar alguns segundos)
      let resultado: any;
      for (let i = 0; i < 6; i++) {
        const resp = await fetch(`${baseUrl}/consultarProtocolo?protocolo=${protocolo}`, {
          headers: { Authorization: auth, Accept: 'application/json' },
        });
        const json: any = await resp.json().catch(() => ({}));
        const situacao = json?.situacao_consulta ?? json?.dados?.situacao_consulta;
        if (situacao === 'finalizada' || situacao === 'parcialmente_finalizada') {
          resultado = json?.dados ?? json;
          break;
        }
        await this.delay(2000);
      }

      if (!resultado) {
        return this.debitosSimulado(placa, 'Relatório em processamento — tente novamente em instantes.');
      }
      return this.mapearDebitos(placa, resultado);
    } catch (e: any) {
      this.logger.warn(`Falha ao consultar débitos (${placaLimpa}): ${e?.message}.`);
      return this.debitosSimulado(placa, `Falha ao consultar: ${e?.message ?? 'erro de rede'}.`);
    }
  }

  private mapearDebitos(placa: string, r: any): ConsultaDebitosResult {
    const ano = new Date().getFullYear();
    const det = r?.debitos_detran ?? {};
    const restr = r?.restricoes_detran ?? {};

    const ipvaValor = this.moedaBr(det?.debitos_ipva?.debido);
    const licValor = this.moedaBr(det?.debitos_licenciamento?.debido);
    const multaTotal = this.moedaBr(det?.debitos_multa?.debido);

    // Multas: usa a lista de infrações (RENAINF) quando houver, senão o total
    const infracoes: any[] = r?.infracoes_renainf?.infracoes ?? [];
    const multas = infracoes.length
      ? infracoes.map((m) => ({
          descricao: m.descricao ?? m.infracao ?? 'Infração',
          valor: this.moedaBr(m.valor ?? m.valor_infracao),
          data: m.data ?? m.data_infracao,
        }))
      : multaTotal > 0
        ? [{ descricao: 'Multas (DETRAN)', valor: multaTotal }]
        : [];

    const restricoes: string[] = [];
    if (restr?.restricao_furto?.possui_restricao === 'sim') restricoes.push('Roubo/Furto');
    if (restr?.restricao_judicial_renajud?.possui_restricao === 'sim') restricoes.push('Judicial (RENAJUD)');
    if (restr?.restricao_tributaria?.possui_restricao === 'sim') restricoes.push('Tributária');
    if (r?.registro_de_bloqueio_judicial_renajud?.possui_bloqueio === 'sim') restricoes.push('Bloqueio judicial');

    const somaMultas = multas.reduce((a, m) => a + (m.valor || 0), 0);
    return {
      placa: placa.toUpperCase(),
      ipva: { ano, valor: ipvaValor, pago: ipvaValor === 0 },
      licenciamento: {
        ano,
        valor: licValor,
        situacao: det?.debitos_licenciamento?.possui_debido === 'sim' ? 'Pendente' : 'Regular',
      },
      multas,
      restricoes,
      totalDebitos: Number((ipvaValor + licValor + somaMultas).toFixed(2)),
      fonte: 'consultarplaca',
      simulado: false,
      consultadoEm: new Date().toISOString(),
    };
  }

  /** Converte "1.739,10" → 1739.10 */
  private moedaBr(valor?: string | number): number {
    if (valor == null) return 0;
    if (typeof valor === 'number') return valor;
    const limpo = valor.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    return Number(limpo) || 0;
  }

  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ---------- helpers ----------

  private primeiraParte(valor?: string) {
    // "HYUNDAI/HB20 1.0M" → marca = "HYUNDAI"
    if (!valor) return '';
    return valor.split('/')[0].trim();
  }

  private mapCombustivel(valor?: string): Combustivel | undefined {
    if (!valor) return undefined;
    const v = valor.toString().toUpperCase();
    const flex = v.includes('FLEX') || (v.includes('ÁLCOOL') || v.includes('ALCOOL')) && v.includes('GASOLINA');
    if (flex) return Combustivel.FLEX;
    if (v.includes('DIESEL')) return Combustivel.DIESEL;
    if (v.includes('ELÉTR') || v.includes('ELETR')) return Combustivel.ELETRICO;
    if (v.includes('HÍBR') || v.includes('HIBR')) return Combustivel.HIBRIDO;
    if (v.includes('ÁLCOOL') || v.includes('ALCOOL')) return Combustivel.FLEX;
    if (v.includes('GASOL')) return Combustivel.GASOLINA;
    return undefined;
  }

  // ---------- Fallback simulado ----------

  private veiculoSimulado(placa: string, aviso?: string): ConsultaVeiculoResult {
    const seed = placa.toUpperCase().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const marcas = ['Volkswagen', 'Fiat', 'Chevrolet', 'Hyundai', 'Toyota', 'Honda'];
    const modelos = ['Gol', 'Onix', 'HB20', 'Corolla', 'Civic', 'Argo'];
    const cores = ['Prata', 'Preto', 'Branco', 'Cinza', 'Vermelho'];
    const ano = 2016 + (seed % 9);
    return {
      placa: placa.toUpperCase(),
      marca: marcas[seed % marcas.length],
      modelo: modelos[seed % modelos.length],
      anoFabricacao: ano,
      anoModelo: ano + 1,
      cor: cores[seed % cores.length],
      chassi: `9BW${(seed * 7).toString().padStart(6, '0')}VT${(seed % 1000).toString().padStart(6, '0')}`.slice(0, 17),
      renavam: `${(100000000 + seed * 137) % 1000000000}`.padStart(9, '0'),
      combustivel: Combustivel.FLEX,
      valorFipe: Number((35000 + (seed % 60) * 1000).toFixed(2)),
      codigoFipe: `0000${seed % 1000}-1`,
      fonte: 'simulado',
      simulado: true,
      aviso,
    };
  }

  private debitosSimulado(placa: string, aviso?: string): ConsultaDebitosResult {
    const seed = placa.toUpperCase().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const ano = new Date().getFullYear();
    const ipvaValor = seed % 3 === 0 ? 0 : Number((800 + (seed % 700)).toFixed(2));
    const temMulta = seed % 2 === 0;
    const multas = temMulta
      ? [{ descricao: 'Excesso de velocidade', valor: Number((130 + (seed % 200)).toFixed(2)), data: `${ano}-03-15` }]
      : [];
    const licValor = Number((98 + (seed % 60)).toFixed(2));
    const totalMultas = multas.reduce((a, m) => a + m.valor, 0);
    return {
      placa: placa.toUpperCase(),
      ipva: { ano, valor: ipvaValor, pago: ipvaValor === 0 },
      licenciamento: { ano, valor: licValor, situacao: temMulta ? 'Pendente' : 'Regular' },
      multas,
      restricoes: seed % 5 === 0 ? ['Alienação fiduciária'] : [],
      totalDebitos: Number((ipvaValor + licValor + totalMultas).toFixed(2)),
      fonte: 'simulado',
      simulado: true,
      consultadoEm: new Date().toISOString(),
      aviso,
    };
  }
}

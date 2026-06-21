import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Combustivel } from '@prisma/client';
import { VehicleDataProvider } from './vehicle-data.provider';
import { DocumentDataProvider } from './document-data.provider';
import {
  ConsultaDebitosResult,
  ConsultaDocumentoResult,
  ConsultaVeiculoResult,
} from '../integrations.types';
import { validarDocumento } from '../../common/documento.util';

/**
 * Provedor API Brasil (apibrasil.com.br).
 * Com credenciais configuradas, consulta a API real; sem credenciais, retorna
 * dados simulados plausíveis (mesmo padrão de fallback do NotificationsService).
 * As rotas reais ficam isoladas aqui e podem variar conforme o plano contratado.
 */
@Injectable()
export class ApiBrasilProvider implements VehicleDataProvider, DocumentDataProvider {
  private readonly logger = new Logger('ApiBrasil');

  constructor(private readonly config: ConfigService) {}

  private get credenciais() {
    const baseUrl = this.config.get<string>('APIBRASIL_BASE_URL');
    const bearer = this.config.get<string>('APIBRASIL_BEARER_TOKEN');
    return { baseUrl, bearer, configurado: !!(baseUrl && bearer) };
  }

  async consultarVeiculo(placa: string): Promise<ConsultaVeiculoResult> {
    const { baseUrl, bearer, configurado } = this.credenciais;
    if (!configurado) return this.veiculoSimulado(placa);

    try {
      const resp = await fetch(`${baseUrl}/vehicles/dados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify({ placa }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json: any = await resp.json();
      const r = json?.response ?? json;
      return {
        placa: placa.toUpperCase(),
        marca: r.marca ?? r.MARCA ?? '',
        modelo: r.modelo ?? r.MODELO ?? '',
        anoFabricacao: Number(r.ano ?? r.anoFabricacao ?? r.ANO_FABRICACAO) || 0,
        anoModelo: Number(r.anoModelo ?? r.ano_modelo ?? r.ANO_MODELO) || 0,
        cor: r.cor ?? r.COR ?? '',
        chassi: r.chassi ?? r.CHASSI ?? '',
        renavam: r.renavam ?? r.RENAVAM ?? '',
        combustivel: this.mapCombustivel(r.combustivel ?? r.COMBUSTIVEL),
        fonte: 'apibrasil',
        simulado: false,
      };
    } catch (e: any) {
      this.logger.warn(`Falha na consulta de veículo (${placa}): ${e?.message}. Usando simulado.`);
      return this.veiculoSimulado(placa);
    }
  }

  async consultarDebitos(placa: string): Promise<ConsultaDebitosResult> {
    const { baseUrl, bearer, configurado } = this.credenciais;
    if (!configurado) return this.debitosSimulado(placa);

    try {
      const resp = await fetch(`${baseUrl}/vehicles/debitos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify({ placa }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json: any = await resp.json();
      const r = json?.response ?? json;
      const multas = Array.isArray(r.multas)
        ? r.multas.map((m: any) => ({ descricao: m.descricao ?? 'Multa', valor: Number(m.valor) || 0, data: m.data }))
        : [];
      const ipvaValor = Number(r?.ipva?.valor) || 0;
      const licValor = Number(r?.licenciamento?.valor) || 0;
      const totalMultas = multas.reduce((a: number, m: any) => a + m.valor, 0);
      return {
        placa: placa.toUpperCase(),
        ipva: { ano: Number(r?.ipva?.ano) || new Date().getFullYear(), valor: ipvaValor, pago: !!r?.ipva?.pago },
        licenciamento: {
          ano: Number(r?.licenciamento?.ano) || new Date().getFullYear(),
          valor: licValor,
          situacao: r?.licenciamento?.situacao ?? 'Indisponível',
        },
        multas,
        restricoes: Array.isArray(r.restricoes) ? r.restricoes : [],
        totalDebitos: Number((ipvaValor + licValor + totalMultas).toFixed(2)),
        fonte: 'apibrasil',
        simulado: false,
        consultadoEm: new Date().toISOString(),
      };
    } catch (e: any) {
      this.logger.warn(`Falha na consulta de débitos (${placa}): ${e?.message}. Usando simulado.`);
      return this.debitosSimulado(placa);
    }
  }

  async consultarDocumento(documento: string): Promise<ConsultaDocumentoResult> {
    // 1) Validação local dos dígitos (sempre, offline)
    const v = validarDocumento(documento);
    const base: ConsultaDocumentoResult = {
      documento: v.documento,
      tipo: v.tipo,
      valido: v.valido,
      formatado: v.formatado,
      fonte: 'local',
      simulado: false,
    };
    if (!v.valido) return base; // não consulta cadastro de documento inválido

    // 2) Consulta cadastral (provedor real ou simulado)
    const { baseUrl, bearer, configurado } = this.credenciais;
    if (!configurado) return this.documentoSimulado(base);

    try {
      const rota = v.tipo === 'CPF' ? 'cpf' : 'cnpj';
      const resp = await fetch(`${baseUrl}/dados/${rota}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify({ [rota]: v.documento }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json: any = await resp.json();
      const r = json?.response ?? json;
      return {
        ...base,
        nome: r.nome ?? r.razao_social ?? r.razaoSocial ?? r.NOME,
        nomeFantasia: r.nome_fantasia ?? r.nomeFantasia,
        situacao: r.situacao ?? r.situacao_cadastral ?? r.descricao_situacao_cadastral,
        fonte: 'apibrasil',
      };
    } catch (e: any) {
      this.logger.warn(`Falha na consulta de documento: ${e?.message}. Usando simulado.`);
      return this.documentoSimulado(base);
    }
  }

  // ---------- Fallback simulado (sem credenciais) ----------

  private documentoSimulado(base: ConsultaDocumentoResult): ConsultaDocumentoResult {
    const seed = base.documento.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const situacoes = ['Regular', 'Ativa'];
    return {
      ...base,
      nome: base.tipo === 'CNPJ' ? `Empresa Exemplo ${seed % 100} LTDA` : `Pessoa Exemplo ${seed % 100}`,
      nomeFantasia: base.tipo === 'CNPJ' ? `Exemplo ${seed % 100}` : undefined,
      situacao: situacoes[seed % situacoes.length],
      fonte: 'simulado',
      simulado: true,
    };
  }

  private veiculoSimulado(placa: string): ConsultaVeiculoResult {
    // Varia os dados conforme a placa para parecer realista
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
      fonte: 'simulado',
      simulado: true,
    };
  }

  private debitosSimulado(placa: string): ConsultaDebitosResult {
    const seed = placa.toUpperCase().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const ano = new Date().getFullYear();
    const ipvaValor = (seed % 3 === 0) ? 0 : Number((800 + (seed % 700)).toFixed(2));
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
    };
  }

  private mapCombustivel(valor?: string): Combustivel | undefined {
    if (!valor) return undefined;
    const v = valor.toString().toUpperCase();
    if (v.includes('FLEX') || v.includes('ÁLCOOL') || v.includes('ALCOOL')) return Combustivel.FLEX;
    if (v.includes('DIESEL')) return Combustivel.DIESEL;
    if (v.includes('ELÉTR') || v.includes('ELETR')) return Combustivel.ELETRICO;
    if (v.includes('HÍBR') || v.includes('HIBR')) return Combustivel.HIBRIDO;
    if (v.includes('GASOL')) return Combustivel.GASOLINA;
    return undefined;
  }
}

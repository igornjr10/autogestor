import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TIPOS = ['carros', 'motos', 'caminhoes'];

/**
 * Integração gratuita com a tabela FIPE (Parallelum FIPE API v1).
 * Sem token. Fluxo: marcas → modelos → anos → preço.
 */
@Injectable()
export class FipeService {
  private readonly logger = new Logger('Fipe');

  constructor(private readonly config: ConfigService) {}

  private get baseUrl() {
    return this.config.get<string>('FIPE_API_URL', 'https://parallelum.com.br/fipe/api/v1');
  }

  private validarTipo(tipo: string) {
    if (!TIPOS.includes(tipo)) {
      throw new BadRequestException(`Tipo inválido. Use: ${TIPOS.join(', ')}.`);
    }
  }

  private async get(path: string): Promise<any> {
    const resp = await fetch(`${this.baseUrl}${path}`, { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new BadRequestException(`FIPE indisponível (HTTP ${resp.status}).`);
    return resp.json();
  }

  /** Lista de marcas por tipo de veículo. */
  async marcas(tipo: string) {
    this.validarTipo(tipo);
    return this.get(`/${tipo}/marcas`); // [{ codigo, nome }]
  }

  /** Modelos de uma marca. */
  async modelos(tipo: string, marca: string) {
    this.validarTipo(tipo);
    const r = await this.get(`/${tipo}/marcas/${marca}/modelos`);
    return r?.modelos ?? []; // [{ codigo, nome }]
  }

  /** Anos disponíveis de um modelo. */
  async anos(tipo: string, marca: string, modelo: string) {
    this.validarTipo(tipo);
    return this.get(`/${tipo}/marcas/${marca}/modelos/${modelo}/anos`); // [{ codigo, nome }]
  }

  /** Preço FIPE de um veículo específico. */
  async preco(tipo: string, marca: string, modelo: string, ano: string) {
    this.validarTipo(tipo);
    const r = await this.get(`/${tipo}/marcas/${marca}/modelos/${modelo}/anos/${ano}`);
    return {
      valor: this.moeda(r?.Valor ?? r?.valor),
      valorTexto: r?.Valor ?? r?.valor ?? null,
      marca: r?.Marca ?? r?.marca,
      modelo: r?.Modelo ?? r?.modelo,
      anoModelo: r?.AnoModelo ?? r?.anoModelo,
      combustivel: r?.Combustivel ?? r?.combustivel,
      codigoFipe: r?.CodigoFipe ?? r?.codigoFipe,
      mesReferencia: r?.MesReferencia ?? r?.mesReferencia,
    };
  }

  /** "R$ 89.000,00" → 89000.00 */
  private moeda(valor?: string): number | null {
    if (!valor) return null;
    const limpo = valor.replace(/[^0-9,]/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(limpo);
    return Number.isFinite(n) ? n : null;
  }
}

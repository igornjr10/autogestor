import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ApibrasilFipeBetaRequest {
  tipo: 'fipe';
  placa: string;
  homolog: boolean;
}

export interface ApibrasilFipeHistoricoItem {
  mes: string;
  valor: number;
}

export interface ApibrasilFipeIpva {
  aliquota?: number;
  uf?: string;
  valor?: number;
  valorFormatado?: string;
}

export interface ApibrasilFipeVeiculo {
  chassi?: string;
  cilindradas?: string;
  combustivel?: string;
  cor?: string;
  especie?: string;
  municipio?: string;
  nacionalidade?: string;
  potencia?: number;
  quantidadeLugares?: number;
  tipoVeiculo?: string;
  uf?: string;
}

export interface ApibrasilFipeBetaResponse {
  placa: string;
  marca: string;
  modelo: string;
  anoFabricacao?: number;
  anoModelo?: number;
  codigoFipe?: string;
  valor?: number;
  combustivel?: string;
  categoria?: string;
  mesReferencia?: string;
  url?: string;
  ipva?: ApibrasilFipeIpva;
  historico: ApibrasilFipeHistoricoItem[];
  veiculo?: ApibrasilFipeVeiculo;
  homologado?: boolean;
  fonte: 'apibrasil';
  raw: Record<string, unknown>;
}

interface ApibrasilErrorPayload {
  message?: string;
  error?: string;
  code?: string | number;
  status?: string | number;
  errors?: unknown;
}

interface NormalizedFipePayload {
  placa?: string;
  marca: string;
  modelo: string;
  anoFabricacao?: number;
  anoModelo?: number;
  codigoFipe?: string;
  valor?: number;
  combustivel?: string;
  categoria?: string;
  mesReferencia?: string;
  url?: string;
  ipva?: ApibrasilFipeIpva;
  historico: ApibrasilFipeHistoricoItem[];
  veiculo?: ApibrasilFipeVeiculo;
  homologado?: boolean;
  raw: Record<string, unknown>;
}

@Injectable()
export class ApiBrasilFipeBetaService {
  private readonly logger = new Logger(ApiBrasilFipeBetaService.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get<string>('APIBRASIL_BASE_URL', 'https://gateway.apibrasil.io/api/v2');
  }

  private get bearerToken(): string {
    return this.config.get<string>('APIBRASIL_BEARER_TOKEN') ?? '';
  }

  private get requestTimeoutMs(): number {
    return Number(this.config.get<number>('APIBRASIL_REQUEST_TIMEOUT_MS', 15000));
  }

  async consultarFipeBeta(payload: ApibrasilFipeBetaRequest): Promise<ApibrasilFipeBetaResponse> {
    this.validateConfig();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/consulta/veiculos/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.bearerToken}`,
        },
        body: JSON.stringify({
          tipo: payload.tipo,
          placa: payload.placa.toUpperCase(),
          homolog: payload.homolog,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.throwHttpError(response);
      }

      const json = await this.parseResponseBody(response);
      const data = this.normalizeResponse(json);
      this.validateRequiredResponseFields(data);

      return {
        placa: data.placa ?? payload.placa.toUpperCase(),
        marca: data.marca,
        modelo: data.modelo,
        anoFabricacao: data.anoFabricacao,
        anoModelo: data.anoModelo,
        codigoFipe: data.codigoFipe,
        valor: data.valor,
        combustivel: data.combustivel,
        categoria: data.categoria,
        mesReferencia: data.mesReferencia,
        url: data.url,
        ipva: data.ipva,
        historico: data.historico,
        veiculo: data.veiculo,
        homologado: data.homologado,
        fonte: 'apibrasil',
        raw: data.raw,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      if (this.isAbortError(error)) {
        throw new HttpException(
          {
            message: 'Tempo limite excedido ao consultar Fipe Beta na API Brasil.',
            timeoutMs: this.requestTimeoutMs,
          },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      const message = error instanceof Error ? error.message : 'Erro desconhecido ao consultar API Brasil';
      this.logger.error(`consultarFipeBeta failed: ${message}`, error instanceof Error ? error.stack : undefined);

      throw new HttpException(
        {
          message: 'Falha ao consultar Fipe Beta na API Brasil.',
          error: message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private validateConfig(): void {
    if (!this.baseUrl) {
      throw new HttpException('APIBRASIL_BASE_URL nao configurado.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (!this.bearerToken) {
      throw new HttpException('APIBRASIL_BEARER_TOKEN nao configurado.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private validateRequiredResponseFields(data: NormalizedFipePayload): void {
    const missingFields = [
      ['marca', data.marca],
      ['modelo', data.modelo],
    ]
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      throw new HttpException(
        {
          message: 'Resposta da API Brasil sem campos obrigatorios.',
          missingFields,
          apiPayload: data.raw,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      throw new HttpException(
        {
          message: 'Resposta invalida da API Brasil.',
          body: text,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private normalizeResponse(json: unknown): NormalizedFipePayload {
    const root = this.isRecord(json) ? json : {};
    const payload = this.unwrapFipeItem(root);
    const vehicle = this.unwrapVehicle(root);

    return {
      placa: this.toOptionalString(payload.placa ?? payload.PLACA),
      marca: this.toString(payload.marca ?? payload.MARCA),
      modelo: this.toString(payload.modelo ?? payload.MODELO),
      anoFabricacao: this.toNumber(payload.anoFabricacao ?? payload.ANO_FABRICACAO ?? payload.ano),
      anoModelo: this.toNumber(payload.anoModelo ?? payload.ANO_MODELO),
      codigoFipe: this.toOptionalString(payload.codigoFipe ?? payload.CODIGO_FIPE ?? payload.codigo_fipe),
      valor: this.parseMoney(payload.valor ?? payload.VALOR ?? payload.valorFipe),
      combustivel: this.toOptionalString(payload.combustivel ?? payload.COMBUSTIVEL ?? vehicle?.combustivel),
      categoria: this.toOptionalString(payload.categoria ?? payload.CATEGORIA),
      mesReferencia: this.toOptionalString(payload.mesReferencia ?? payload.mes_referencia),
      url: this.toOptionalString(payload.url),
      ipva: this.normalizeIpva(payload.ipva),
      historico: this.normalizeHistorico(payload.historico),
      veiculo: vehicle,
      homologado: this.toBoolean(root.homolog ?? payload.homologado ?? payload.homolog),
      raw: root,
    };
  }

  private unwrapFipeItem(root: Record<string, unknown>): Record<string, unknown> {
    const data = this.isRecord(root.data) ? root.data : root;
    const candidates = [
      data.data,
      data.resultados,
      root.resultados,
      root.response,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        const principal = candidate.find(
          (item): item is Record<string, unknown> => this.isRecord(item) && item.principal === true,
        );
        if (principal) return principal;

        const first = candidate.find((item): item is Record<string, unknown> => this.isRecord(item));
        if (first) return first;
      }

      if (this.isRecord(candidate)) return candidate;
    }

    return data;
  }

  private unwrapVehicle(root: Record<string, unknown>): ApibrasilFipeVeiculo | undefined {
    const data = this.isRecord(root.data) ? root.data : root;
    const vehicle = this.isRecord(data.veiculo) ? data.veiculo : this.isRecord(root.veiculo) ? root.veiculo : undefined;
    if (!vehicle) return undefined;

    return {
      chassi: this.toOptionalString(vehicle.chassi ?? vehicle.CHASSI),
      cilindradas: this.toOptionalString(vehicle.cilindradas),
      combustivel: this.toOptionalString(vehicle.combustivel ?? vehicle.COMBUSTIVEL),
      cor: this.toOptionalString(vehicle.cor ?? vehicle.COR),
      especie: this.toOptionalString(vehicle.especie),
      municipio: this.toOptionalString(vehicle.municipio),
      nacionalidade: this.toOptionalString(vehicle.nacionalidade),
      potencia: this.toNumber(vehicle.potencia),
      quantidadeLugares: this.toNumber(vehicle.quantidade_lugares ?? vehicle.quantidadeLugares),
      tipoVeiculo: this.toOptionalString(vehicle.tipo_veiculo ?? vehicle.tipoVeiculo),
      uf: this.toOptionalString(vehicle.uf ?? vehicle.UF),
    };
  }

  private normalizeIpva(value: unknown): ApibrasilFipeIpva | undefined {
    if (!this.isRecord(value)) return undefined;
    return {
      aliquota: this.toNumber(value.aliquota),
      uf: this.toOptionalString(value.uf),
      valor: this.parseMoney(value.valor),
      valorFormatado: this.toOptionalString(value.valor_formatado ?? value.valorFormatado),
    };
  }

  private normalizeHistorico(value: unknown): ApibrasilFipeHistoricoItem[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is Record<string, unknown> => this.isRecord(item))
      .map((item) => ({
        mes: this.toString(item.mes),
        valor: this.parseMoney(item.valor) ?? 0,
      }))
      .filter((item) => item.mes && item.valor > 0);
  }

  private async throwHttpError(response: Response): Promise<never> {
    const body = await this.parseResponseBody(response);
    const apiError = this.extractErrorPayload(body);

    throw new HttpException(
      {
        message: apiError.message ?? apiError.error ?? 'API Brasil retornou erro.',
        status: response.status,
        apiError,
      },
      response.status,
    );
  }

  private extractErrorPayload(body: unknown): ApibrasilErrorPayload {
    if (!body || typeof body !== 'object') {
      return { message: String(body ?? '') };
    }

    const payload = body as Record<string, unknown>;
    return {
      message: this.toOptionalString(payload.message ?? payload.erro),
      error: this.toOptionalString(payload.error ?? payload.erro),
      code: this.normalizeErrorField(payload.code ?? payload.status_code ?? payload.status),
      status: this.normalizeErrorField(payload.status ?? payload.status_code ?? payload.code),
      errors: payload.errors,
    };
  }

  private normalizeErrorField(value: unknown): string | number | undefined {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : normalized;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private toString(value: unknown): string {
    return this.toOptionalString(value) ?? '';
  }

  private toOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    return normalized || undefined;
  }

  private toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private toBoolean(value: unknown): boolean | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).toLowerCase().trim();
    return ['true', '1', 'sim', 'yes'].includes(normalized);
  }

  private parseMoney(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;

    const text = String(value).replace(/[^0-9,.-]/g, '').trim();
    const normalized = text.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }
}

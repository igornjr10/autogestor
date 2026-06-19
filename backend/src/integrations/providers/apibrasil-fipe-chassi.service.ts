import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ApibrasilFipeChassiRequest {
  tipo: 'fipe-chassi';
  placa: string;
  homolog: boolean;
}

export interface ApibrasilFipeChassiResponse {
  placa: string;
  chassi: string;
  marca: string;
  modelo: string;
  anoFabricacao?: number;
  anoModelo?: number;
  codigoFipe?: string;
  valor?: number;
  valorTexto?: string;
  combustivel?: string;
  homologado?: boolean;
  fonte: 'apibrasil';
  raw?: unknown;
}

interface ApibrasilErrorPayload {
  message?: string;
  error?: string;
  code?: string | number;
  status?: string | number;
  errors?: unknown;
}

@Injectable()
export class ApiBrasilFipeChassiService {
  private readonly logger = new Logger(ApiBrasilFipeChassiService.name);

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

  async consultarPlacaFipeComChassi(
    payload: ApibrasilFipeChassiRequest,
  ): Promise<ApibrasilFipeChassiResponse> {
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
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.throwHttpError(response);
      }

      const json = await this.parseResponseBody(response);
      const data = this.normalizeResponse(json);

      return {
        placa: data.placa ?? payload.placa.toUpperCase(),
        chassi: data.chassi,
        marca: data.marca,
        modelo: data.modelo,
        anoFabricacao: data.anoFabricacao,
        anoModelo: data.anoModelo,
        codigoFipe: data.codigoFipe,
        valor: data.valor,
        valorTexto: data.valorTexto,
        combustivel: data.combustivel,
        homologado: data.homologado,
        fonte: 'apibrasil',
        raw: data.raw,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao consultar API Brasil';
      this.logger.error(`consultaPlacaFipeComChassi failed: ${message}`, error instanceof Error ? error.stack : undefined);
      throw new HttpException(
        {
          message: 'Falha ao consultar Placa FIPE com Chassi na API Brasil.',
          error: message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private validateConfig() {
    if (!this.baseUrl) {
      throw new HttpException('APIBRASIL_BASE_URL não configurado.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (!this.bearerToken) {
      throw new HttpException('APIBRASIL_BEARER_TOKEN não configurado.', HttpStatus.INTERNAL_SERVER_ERROR);
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
          message: 'Resposta inválida da API Brasil.',
          body: text,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private normalizeResponse(json: unknown): {
    placa?: string;
    chassi: string;
    marca: string;
    modelo: string;
    anoFabricacao?: number;
    anoModelo?: number;
    codigoFipe?: string;
    valor?: number;
    valorTexto?: string;
    combustivel?: string;
    homologado?: boolean;
    raw?: unknown;
  } {
    const payload = this.unwrapResponse(json);
    return {
      placa: this.toString(payload.placa ?? payload.PLACA) ?? undefined,
      chassi: this.toString(payload.chassi ?? payload.CHASSI),
      marca: this.toString(payload.marca ?? payload.MARCA),
      modelo: this.toString(payload.modelo ?? payload.MODELO),
      anoFabricacao: this.toNumber(payload.anoFabricacao ?? payload.ANO_FABRICACAO ?? payload.ano),
      anoModelo: this.toNumber(payload.anoModelo ?? payload.ANO_MODELO ?? payload.anoModelo),
      codigoFipe: this.toString(payload.codigoFipe ?? payload.CODIGO_FIPE ?? payload.codigo_fipe),
      valor: this.parseMoney(payload.valor ?? payload.VALOR ?? payload.valorFipe),
      valorTexto: this.toString(payload.valor ?? payload.VALOR ?? payload.valorTexto ?? payload.VALOR_TEXTO),
      combustivel: this.toString(payload.combustivel ?? payload.COMBUSTIVEL),
      homologado: this.toBoolean(payload.homolog ?? payload.HOMOLOG ?? payload.homologado),
      raw: payload,
    };
  }

  private async throwHttpError(response: Response): Promise<never> {
    const body = await this.parseResponseBody(response);
    const apiError = this.extractErrorPayload(body);
    const message = apiError.message ?? apiError.error ?? `HTTP ${response.status}`;

    throw new HttpException(
      {
        message: 'API Brasil retornou erro.',
        status: response.status,
        apiError,
      },
      response.status,
    );
  }

  private extractErrorPayload(body: unknown): ApibrasilErrorPayload {
    if (!body || typeof body !== 'object') return { message: String(body ?? '') };
    const payload = body as Record<string, unknown>;
    return {
      message: this.toString(payload.message ?? payload.error ?? payload.erro),
      error: this.toString(payload.error ?? payload.erro),
      code: this.normalizeErrorField(payload.code ?? payload.status),
      status: this.normalizeErrorField(payload.status ?? payload.code),
      errors: payload.errors,
    };
  }

  private normalizeErrorField(value: unknown): string | number | undefined {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : normalized;
  }

  private unwrapResponse(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object') return {};
    const candidate = body as Record<string, unknown>;
    if ('response' in candidate && typeof candidate.response === 'object' && candidate.response !== null) {
      return candidate.response as Record<string, unknown>;
    }
    return candidate;
  }

  private toString(value: unknown): string {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  }

  private toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    const cast = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(cast) ? cast : undefined;
  }

  private toBoolean(value: unknown): boolean | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).toLowerCase().trim();
    return normalized === 'true' || normalized === '1' || normalized === 'sim' || normalized === 'yes';
  }

  private parseMoney(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    const text = String(value).replace(/[^0-9,.-]/g, '').trim();
    const normalized = text.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}

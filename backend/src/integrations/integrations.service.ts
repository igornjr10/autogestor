import { Inject, Injectable } from '@nestjs/common';
import { Prisma, TipoConsulta } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VEHICLE_DATA_PROVIDER, VehicleDataProvider } from './providers/vehicle-data.provider';
import { DOCUMENT_DATA_PROVIDER, DocumentDataProvider } from './providers/document-data.provider';
import {
  ApiBrasilFipeChassiService,
  ApibrasilFipeChassiResponse,
} from './providers/apibrasil-fipe-chassi.service';
import {
  ApiBrasilFipeBetaService,
  ApibrasilFipeBetaResponse,
} from './providers/apibrasil-fipe-beta.service';
import { validarDocumento } from '../common/documento.util';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(VEHICLE_DATA_PROVIDER) private readonly provider: VehicleDataProvider,
    @Inject(DOCUMENT_DATA_PROVIDER) private readonly docProvider: DocumentDataProvider,
    private readonly fipeBeta: ApiBrasilFipeBetaService,
    private readonly fipeChassi: ApiBrasilFipeChassiService,
  ) {}

  validarDocumento(documento: string) {
    return validarDocumento(documento);
  }

  consultarDocumento(documento: string) {
    return this.docProvider.consultarDocumento(documento);
  }

  async consultarVeiculo(placa: string, usuarioId?: string) {
    const resultado = await this.provider.consultarVeiculo(placa);
    await this.registrar(placa, TipoConsulta.DADOS, resultado, resultado.simulado, usuarioId);
    return resultado;
  }

  async consultarDebitos(placa: string, usuarioId?: string, veiculoId?: string) {
    const resultado = await this.provider.consultarDebitos(placa);
    await this.registrar(placa, TipoConsulta.DEBITOS, resultado, resultado.simulado, usuarioId, veiculoId);
    return resultado;
  }

  consultarPlacaFipeComChassi(placa: string, homolog = false): Promise<ApibrasilFipeChassiResponse> {
    return this.fipeChassi.consultarPlacaFipeComChassi({
      tipo: 'fipe-chassi',
      placa: placa.toUpperCase(),
      homolog,
    });
  }

  consultarFipeBeta(placa: string, homolog = false): Promise<ApibrasilFipeBetaResponse> {
    return this.fipeBeta.consultarFipeBeta({
      tipo: 'fipe',
      placa: placa.toUpperCase(),
      homolog,
    });
  }

  historico(veiculoId?: string) {
    return this.prisma.consultaPlaca.findMany({
      where: veiculoId ? { veiculoId } : {},
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });
  }

  private registrar(
    placa: string,
    tipo: TipoConsulta,
    resultado: unknown,
    simulado: boolean,
    usuarioId?: string,
    veiculoId?: string,
  ) {
    return this.prisma.consultaPlaca.create({
      data: {
        placa: placa.toUpperCase(),
        tipo,
        resultado: resultado as Prisma.InputJsonValue,
        simulado,
        usuarioId,
        veiculoId,
      },
    });
  }
}

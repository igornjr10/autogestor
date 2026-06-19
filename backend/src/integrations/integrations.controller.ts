import { Controller, Get, Param, Query } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { IntegrationsService } from './integrations.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('integracoes')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  /** Dados do veículo por placa (para auto-preencher o cadastro). */
  @Get('veiculo/:placa')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  consultarVeiculo(@Param('placa') placa: string, @CurrentUser() user: AuthUser) {
    return this.integrations.consultarVeiculo(placa, user.id);
  }

  /** Débitos e restrições (DETRAN) por placa. */
  @Get('debitos/:placa')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR, Perfil.FINANCEIRO)
  consultarDebitos(
    @Param('placa') placa: string,
    @CurrentUser() user: AuthUser,
    @Query('veiculoId') veiculoId?: string,
  ) {
    return this.integrations.consultarDebitos(placa, user.id, veiculoId);
  }

  /** Histórico de consultas (auditoria). */
  @Get('consultas')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR, Perfil.FINANCEIRO)
  historico(@Query('veiculoId') veiculoId?: string) {
    return this.integrations.historico(veiculoId);
  }

  /** Validação local (offline) de CPF/CNPJ — liberada a qualquer perfil autenticado. */
  @Get('documento/:doc/validar')
  validarDocumento(@Param('doc') doc: string) {
    return this.integrations.validarDocumento(doc);
  }

  /** Validação + consulta cadastral de CPF/CNPJ (nome/razão social, situação). */
  @Get('documento/:doc')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  consultarDocumento(@Param('doc') doc: string) {
    return this.integrations.consultarDocumento(doc);
  }
}

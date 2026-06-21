import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { IntegrationsService } from './integrations.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { PlacaFipeChassiDto } from './dto/placa-fipe-chassi.dto';
import { PlacaFipeDto } from './dto/placa-fipe.dto';

@Controller('integracoes')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get('veiculo/:placa')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  consultarVeiculo(@Param('placa') placa: string, @CurrentUser() user: AuthUser) {
    return this.integrations.consultarVeiculo(placa, user.id);
  }

  @Get('debitos/:placa')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR, Perfil.FINANCEIRO)
  consultarDebitos(
    @Param('placa') placa: string,
    @CurrentUser() user: AuthUser,
    @Query('veiculoId') veiculoId?: string,
  ) {
    return this.integrations.consultarDebitos(placa, user.id, veiculoId);
  }

  @Post('placa-fipe-chassi')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  consultarPlacaFipeComChassi(@Body() dto: PlacaFipeChassiDto) {
    return this.integrations.consultarPlacaFipeComChassi(dto.placa, dto.homolog ?? false);
  }

  @Post('fipe-beta')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  consultarFipeBeta(@Body() dto: PlacaFipeDto) {
    return this.integrations.consultarFipeBeta(dto.placa, dto.homolog ?? false);
  }

  @Get('consultas')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR, Perfil.FINANCEIRO)
  historico(@Query('veiculoId') veiculoId?: string) {
    return this.integrations.historico(veiculoId);
  }

  @Get('documento/:doc/validar')
  validarDocumento(@Param('doc') doc: string) {
    return this.integrations.validarDocumento(doc);
  }

  @Get('documento/:doc')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  consultarDocumento(@Param('doc') doc: string) {
    return this.integrations.consultarDocumento(doc);
  }
}
